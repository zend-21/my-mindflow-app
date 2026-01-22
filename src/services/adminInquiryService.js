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

// 사용자 정보 캐시 (메모리 내 캐싱으로 중복 조회 방지)
const userInfoCache = new Map();
const USER_CACHE_TTL = 5 * 60 * 1000; // 5분 캐시

/**
 * 사용자 정보 조회 (캐싱 적용)
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} - 사용자 정보
 */
const getCachedUserInfo = async (userId) => {
  const now = Date.now();
  const cached = userInfoCache.get(userId);

  // 캐시가 있고 유효하면 반환
  if (cached && (now - cached.timestamp < USER_CACHE_TTL)) {
    return cached.data;
  }

  // 캐시 없거나 만료됨 - 새로 조회
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
    // 캐시에 저장
    userInfoCache.set(userId, { data: userInfo, timestamp: now });
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
  }

  return userInfo;
};

/**
 * 모든 사용자의 문의 조회 (관리자 전용)
 * - collectionGroup 인덱스 캐시로 인한 고스트 데이터 필터링 포함
 * - 사용자 정보 캐싱으로 중복 조회 최소화
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

    // 고스트 데이터 필터링: 실제 존재하는 문서만 병렬로 확인
    const validDocs = [];
    await Promise.all(
      querySnapshot.docs.map(async (docSnapshot) => {
        const userId = docSnapshot.ref.parent.parent.id;
        const inquiryId = docSnapshot.id;

        try {
          const inquiryRef = doc(db, 'users', userId, 'inquiries', inquiryId);
          const inquiryCheck = await getDoc(inquiryRef);

          if (inquiryCheck.exists()) {
            validDocs.push(docSnapshot);
          }
        } catch (error) {
          // 존재 확인 실패 시 제외
          console.warn('문의 존재 확인 실패:', { userId, inquiryId });
        }
      })
    );

    // 고유 사용자 ID 추출하여 배치 조회
    const uniqueUserIds = [...new Set(validDocs.map(d => d.ref.parent.parent.id))];

    // 모든 사용자 정보를 병렬로 조회 (캐싱 적용)
    const userInfoMap = new Map();
    await Promise.all(
      uniqueUserIds.map(async (userId) => {
        const userInfo = await getCachedUserInfo(userId);
        userInfoMap.set(userId, userInfo);
      })
    );

    const inquiries = validDocs.map(docSnapshot => {
      const data = docSnapshot.data();
      const userId = docSnapshot.ref.parent.parent.id;
      const userInfo = userInfoMap.get(userId) || { displayName: '알 수 없음', email: '' };

      return {
        id: docSnapshot.id,
        userId,
        userDisplayName: userInfo.displayName,
        userEmail: userInfo.email,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      };
    });

    return inquiries;
  } catch (error) {
    console.error('전체 문의 목록 조회 오류:', error);
    throw error;
  }
};

/**
 * @deprecated subscribeToAllInquiries는 데이터 사용량 문제로 더 이상 사용하지 않음
 * getAllInquiries를 사용하세요
 *
 * 주의: onSnapshot + getDoc 조합은 실시간으로 트리거될 때마다
 * 모든 문서에 대해 추가 읽기가 발생하여 데이터 사용량이 폭증함
 */
export const subscribeToAllInquiries = (callback) => {
  console.warn('subscribeToAllInquiries는 deprecated됨. getAllInquiries 사용 권장');
  // 일회성 조회로 대체
  getAllInquiries().then(inquiries => callback(inquiries));
  // 빈 unsubscribe 함수 반환
  return () => {};
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
 * 답변대기 중인 문의 개수 조회 (일회성)
 * - 실시간 구독 대신 페이지 전환 시 호출
 * - 고스트 데이터 필터링 포함
 * @returns {Promise<number>} - 답변대기 중인 문의 개수
 */
export const getPendingInquiriesCount = async () => {
  try {
    const inquiriesQuery = query(
      collectionGroup(db, 'inquiries'),
      where('status', '==', 'pending')
    );

    const snapshot = await getDocs(inquiriesQuery);

    // 고스트 데이터 필터링: 실제 존재하는 문서만 카운트
    let validCount = 0;
    await Promise.all(
      snapshot.docs.map(async (docSnapshot) => {
        const userId = docSnapshot.ref.parent.parent.id;
        const inquiryId = docSnapshot.id;

        try {
          const inquiryRef = doc(db, 'users', userId, 'inquiries', inquiryId);
          const inquiryCheck = await getDoc(inquiryRef);

          if (inquiryCheck.exists()) {
            validCount++;
          }
        } catch {
          // 존재 확인 실패 시 카운트하지 않음
        }
      })
    );

    return validCount;
  } catch (error) {
    console.error('답변대기 문의 개수 조회 오류:', error);
    return 0;
  }
};

/**
 * @deprecated subscribeToPendingInquiries는 더 이상 사용하지 않음
 * getPendingInquiriesCount를 사용하세요
 */
export const subscribeToPendingInquiries = (callback) => {
  console.warn('subscribeToPendingInquiries는 deprecated됨. getPendingInquiriesCount 사용 권장');
  // 기존 호환성을 위해 일회성 조회 후 콜백 호출
  getPendingInquiriesCount().then(count => callback(count));
  // 빈 unsubscribe 함수 반환
  return () => {};
};

/**
 * 고스트 문의 데이터 정리 (최고 관리자 전용)
 * collectionGroup 인덱스에 남아있는 삭제된 문의를 찾아 완전히 제거
 * @returns {Promise<{cleaned: number, errors: number}>} - 정리 결과
 */
export const cleanupGhostInquiries = async () => {
  console.log('🧹 고스트 문의 정리 시작...');

  try {
    const inquiriesQuery = query(
      collectionGroup(db, 'inquiries'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(inquiriesQuery);
    let cleaned = 0;
    let errors = 0;

    // 각 문서가 실제로 존재하는지 확인하고, 고스트면 삭제
    await Promise.all(
      querySnapshot.docs.map(async (docSnapshot) => {
        const userId = docSnapshot.ref.parent.parent.id;
        const inquiryId = docSnapshot.id;
        const inquiryRef = doc(db, 'users', userId, 'inquiries', inquiryId);

        try {
          const inquiryCheck = await getDoc(inquiryRef);

          if (!inquiryCheck.exists()) {
            // 고스트 데이터 발견 - collectionGroup에만 존재
            console.log(`🗑️ 고스트 문의 발견: ${userId}/${inquiryId}`);
            // 참고: collectionGroup 인덱스의 고스트는 직접 삭제 불가
            // 대신 deleteDoc을 시도하면 이미 없으므로 무시됨
            try {
              const { deleteDoc } = await import('firebase/firestore');
              await deleteDoc(inquiryRef);
              cleaned++;
              console.log(`✅ 고스트 문의 삭제 완료: ${userId}/${inquiryId}`);
            } catch (deleteError) {
              // 이미 삭제된 경우 무시
              console.log(`⚠️ 고스트 문의 삭제 시도 (이미 없음): ${userId}/${inquiryId}`);
            }
          }
        } catch (error) {
          console.error(`❌ 문의 확인 오류: ${userId}/${inquiryId}`, error);
          errors++;
        }
      })
    );

    console.log(`🧹 고스트 문의 정리 완료 - 정리: ${cleaned}, 오류: ${errors}`);
    return { cleaned, errors };
  } catch (error) {
    console.error('고스트 문의 정리 오류:', error);
    throw error;
  }
};
