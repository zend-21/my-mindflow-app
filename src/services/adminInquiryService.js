// src/services/adminInquiryService.js
import {
  collection,
  query,
  orderBy,
  getDocs,
  onSnapshot,
  doc,
  getDoc,
  where,
  collectionGroup,
  addDoc,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  checkAdminStatus,
  hasPermission,
  getNotificationRecipients,
  PERMISSIONS
} from './adminManagementService';

/**
 * 사용자가 관리자인지 확인 (최고 또는 부관리자)
 * @param {string} userId - 확인할 사용자 ID
 * @returns {Promise<boolean>} - 관리자 여부
 */
export const isAdmin = async (userId) => {
  const status = await checkAdminStatus(userId);
  return status.isAdmin;
};

/**
 * 모든 사용자의 문의 조회 (관리자 전용)
 * @returns {Promise<Array>} - 모든 문의 목록
 */
export const getAllInquiries = async () => {
  try {
    // collectionGroup을 사용하여 모든 사용자의 inquiries 서브컬렉션 조회
    const inquiriesQuery = query(
      collectionGroup(db, 'inquiries'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(inquiriesQuery);

    const inquiries = [];
    for (const docSnapshot of querySnapshot.docs) {
      // userId 추출 (부모 문서의 ID)
      const userId = docSnapshot.ref.parent.parent.id;
      const inquiryId = docSnapshot.id;

      // 문의가 실제로 존재하는지 재확인 (고스트 데이터 방지)
      try {
        const inquiryRef = doc(db, 'users', userId, 'inquiries', inquiryId);
        const inquiryCheck = await getDoc(inquiryRef);

        if (!inquiryCheck.exists()) {
          continue; // 삭제된 문의는 목록에 추가하지 않음
        }
      } catch (checkError) {
        console.warn('문의 존재 확인 실패, 스킵:', { userId, inquiryId }, checkError);
        continue;
      }

      const data = docSnapshot.data();

      // 사용자 정보 가져오기
      let userInfo = { displayName: '알 수 없음', email: '' };
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userInfo = {
            displayName: userData.displayName || userData.email || '알 수 없음',
            email: userData.email || ''
          };
        }
      } catch (error) {
        console.error('사용자 정보 조회 오류:', error);
      }

      inquiries.push({
        id: docSnapshot.id,
        userId,
        userDisplayName: userInfo.displayName,
        userEmail: userInfo.email,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      });
    }

    return inquiries;
  } catch (error) {
    console.error('전체 문의 목록 조회 오류:', error);
    throw error;
  }
};

/**
 * 실시간으로 모든 문의 구독 (관리자 전용)
 * @param {Function} callback - 데이터 변경 시 호출될 콜백
 * @returns {Function} - 구독 해제 함수
 */
export const subscribeToAllInquiries = (callback) => {
  const inquiriesQuery = query(
    collectionGroup(db, 'inquiries'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(inquiriesQuery, async (snapshot) => {
    const inquiries = [];

    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const userId = docSnapshot.ref.parent.parent.id;

      let userInfo = { displayName: '알 수 없음', email: '' };
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userInfo = {
            displayName: userData.displayName || userData.email || '알 수 없음',
            email: userData.email || ''
          };
        }
      } catch (error) {
        console.error('사용자 정보 조회 오류:', error);
      }

      inquiries.push({
        id: docSnapshot.id,
        userId,
        userDisplayName: userInfo.displayName,
        userEmail: userInfo.email,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      });
    }

    callback(inquiries);
  }, (error) => {
    console.error('실시간 구독 오류:', error);
  });
};

/**
 * 관리자에게 알림 전송
 * @param {string} adminUserId - 관리자 사용자 ID
 * @param {Object} notificationData - 알림 데이터
 */
export const sendAdminNotification = async (adminUserId, notificationData) => {
  try {
    const notificationsRef = collection(db, 'users', adminUserId, 'notifications');
    await addDoc(notificationsRef, {
      type: 'new_inquiry',
      title: '새로운 문의가 등록되었습니다',
      message: notificationData.message,
      inquiryId: notificationData.inquiryId,
      userId: notificationData.userId,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('관리자 알림 전송 오류:', error);
    throw error;
  }
};

/**
 * 모든 관리자에게 새 문의 알림 전송 (권한 있는 관리자만)
 * @param {Object} inquiryData - 문의 데이터
 */
export const notifyAdminsNewInquiry = async (inquiryData) => {
  try {
    // 알림 권한이 있는 모든 관리자 조회
    const recipientUids = await getNotificationRecipients();

    const promises = recipientUids.map(adminUid =>
      sendAdminNotification(adminUid, {
        message: `${inquiryData.userDisplayName}님이 "${inquiryData.title}" 문의를 등록했습니다.`,
        inquiryId: inquiryData.inquiryId,
        userId: inquiryData.userId,
      })
    );

    await Promise.all(promises);
  } catch (error) {
    console.error('관리자 알림 전송 실패:', error);
    // 알림 전송 실패해도 문의 작성은 성공으로 처리
  }
};

/**
 * 관리자 알림 목록 조회
 * @param {string} adminUserId - 관리자 사용자 ID
 * @returns {Promise<Array>} - 알림 목록
 */
export const getAdminNotifications = async (adminUserId) => {
  try {
    const notificationsRef = collection(db, 'users', adminUserId, 'notifications');
    const q = query(notificationsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    }));
  } catch (error) {
    console.error('알림 목록 조회 오류:', error);
    throw error;
  }
};

/**
 * 알림 읽음 처리
 * @param {string} adminUserId - 관리자 사용자 ID
 * @param {string} notificationId - 알림 ID
 */
export const markNotificationAsRead = async (adminUserId, notificationId) => {
  try {
    const notificationRef = doc(db, 'users', adminUserId, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
    });
  } catch (error) {
    console.error('알림 읽음 처리 오류:', error);
    throw error;
  }
};

/**
 * 읽지 않은 알림 개수 조회
 * @param {string} adminUserId - 관리자 사용자 ID
 * @returns {Promise<number>} - 읽지 않은 알림 개수
 */
export const getUnreadNotificationCount = async (adminUserId) => {
  try {
    const notificationsRef = collection(db, 'users', adminUserId, 'notifications');
    const q = query(notificationsRef, where('read', '==', false));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('읽지 않은 알림 개수 조회 오류:', error);
    return 0;
  }
};

/**
 * 실시간으로 읽지 않은 알림 개수 구독
 * @param {string} adminUserId - 관리자 사용자 ID
 * @param {Function} callback - 개수 변경 시 호출될 콜백
 * @returns {Function} - 구독 해제 함수
 */
export const subscribeToUnreadNotifications = (adminUserId, callback) => {
  const notificationsRef = collection(db, 'users', adminUserId, 'notifications');
  const q = query(notificationsRef, where('read', '==', false));

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.size);
  }, (error) => {
    console.error('알림 구독 오류:', error);
  });
};

/**
 * 실시간으로 답변대기 중인 문의 개수 구독
 * @param {Function} callback - 개수 변경 시 호출될 콜백
 * @returns {Function} - 구독 해제 함수
 */
export const subscribeToPendingInquiries = (callback) => {
  const inquiriesQuery = query(
    collectionGroup(db, 'inquiries'),
    where('status', '==', 'pending')
  );

  return onSnapshot(inquiriesQuery, async (snapshot) => {
    // 고스트 데이터 필터링: 실제로 존재하는 문의만 카운트
    let validCount = 0;

    for (const docSnapshot of snapshot.docs) {
      const userId = docSnapshot.ref.parent.parent.id;
      const inquiryId = docSnapshot.id;

      try {
        const inquiryRef = doc(db, 'users', userId, 'inquiries', inquiryId);
        const inquiryCheck = await getDoc(inquiryRef);

        if (inquiryCheck.exists()) {
          validCount++;
        }
      } catch (error) {
        // 존재 확인 실패 시 카운트하지 않음
        continue;
      }
    }

    callback(validCount);
  }, (error) => {
    console.error('답변대기 문의 구독 오류:', error);
  });
};
