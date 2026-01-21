// src/services/inquiryService.js
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * 새로운 문의 작성
 * @param {string} userId - 사용자 ID
 * @param {Object} inquiryData - 문의 데이터
 * @param {Object} userInfo - 사용자 정보 (optional)
 * @returns {Promise<string>} - 생성된 문의 ID
 */
export const createInquiry = async (userId, inquiryData, userInfo = null) => {
  try {
    const inquiriesRef = collection(db, 'users', userId, 'inquiries');
    const docRef = await addDoc(inquiriesRef, {
      category: inquiryData.category || '기타',
      title: inquiryData.title,
      content: inquiryData.content,
      status: 'pending', // pending, in_progress, resolved
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 관리자에게 알림 전송 (비동기로 처리, 실패해도 문의는 성공)
    try {
      const { notifyAdminsNewInquiry } = await import('./adminInquiryService');
      await notifyAdminsNewInquiry({
        inquiryId: docRef.id,
        userId,
        title: inquiryData.title,
        userDisplayName: userInfo?.displayName || userInfo?.email || '알 수 없음',
      });
    } catch (notifError) {
      console.error('관리자 알림 전송 실패:', notifError);
      // 알림 실패는 무시하고 계속 진행
    }

    return docRef.id;
  } catch (error) {
    console.error('문의 작성 오류:', error);
    throw error;
  }
};

/**
 * 사용자의 모든 문의 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Array>} - 문의 목록
 */
export const getUserInquiries = async (userId) => {
  try {
    const inquiriesRef = collection(db, 'users', userId, 'inquiries');
    const q = query(inquiriesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || null,
      updatedAt: doc.data().updatedAt?.toDate() || null,
    }));
  } catch (error) {
    console.error('문의 목록 조회 오류:', error);
    throw error;
  }
};

/**
 * 특정 문의 상세 조회
 * @param {string} userId - 사용자 ID
 * @param {string} inquiryId - 문의 ID
 * @returns {Promise<Object>} - 문의 상세 정보
 */
export const getInquiryDetail = async (userId, inquiryId) => {
  try {
    const inquiryRef = doc(db, 'users', userId, 'inquiries', inquiryId);
    const inquiryDoc = await getDoc(inquiryRef);

    if (!inquiryDoc.exists()) {
      throw new Error('문의를 찾을 수 없습니다.');
    }

    return {
      id: inquiryDoc.id,
      ...inquiryDoc.data(),
      createdAt: inquiryDoc.data().createdAt?.toDate(),
      updatedAt: inquiryDoc.data().updatedAt?.toDate(),
    };
  } catch (error) {
    console.error('문의 상세 조회 오류:', error);
    throw error;
  }
};

/**
 * 문의에 대한 답변 조회
 * @param {string} userId - 사용자 ID
 * @param {string} inquiryId - 문의 ID
 * @returns {Promise<Array>} - 답변 목록
 */
export const getInquiryReplies = async (userId, inquiryId) => {
  try {
    const repliesRef = collection(db, 'users', userId, 'inquiries', inquiryId, 'replies');
    const q = query(repliesRef, orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    }));
  } catch (error) {
    console.error('답변 조회 오류:', error);
    throw error;
  }
};

/**
 * 문의 상태 업데이트 (관리자용)
 * @param {string} userId - 사용자 ID
 * @param {string} inquiryId - 문의 ID
 * @param {string} status - 새로운 상태
 */
export const updateInquiryStatus = async (userId, inquiryId, status) => {
  try {
    const inquiryRef = doc(db, 'users', userId, 'inquiries', inquiryId);
    await updateDoc(inquiryRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('문의 상태 업데이트 오류:', error);
    throw error;
  }
};

/**
 * 문의에 답변 추가 (관리자용)
 * @param {string} userId - 사용자 ID
 * @param {string} inquiryId - 문의 ID
 * @param {Object} replyData - 답변 데이터 (content, adminUserId, adminNickname)
 */
export const addInquiryReply = async (userId, inquiryId, replyData) => {
  try {
    const repliesRef = collection(db, 'users', userId, 'inquiries', inquiryId, 'replies');
    await addDoc(repliesRef, {
      content: replyData.content,
      isAdmin: true,
      adminUserId: replyData.adminUserId || null,
      adminNickname: replyData.adminNickname || null,
      createdAt: serverTimestamp(),
    });

    // 문의 상태를 'in_progress'로 업데이트하고 읽지 않은 답변 플래그 설정
    const inquiryRef = doc(db, 'users', userId, 'inquiries', inquiryId);
    await updateDoc(inquiryRef, {
      status: 'in_progress',
      hasUnreadReplies: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('답변 추가 오류:', error);
    throw error;
  }
};

/**
 * 문의 읽음 처리 (사용자가 답변을 확인했을 때)
 * @param {string} userId - 사용자 ID
 * @param {string} inquiryId - 문의 ID
 */
export const markInquiryAsRead = async (userId, inquiryId) => {
  try {
    const inquiryRef = doc(db, 'users', userId, 'inquiries', inquiryId);
    await updateDoc(inquiryRef, {
      hasUnreadReplies: false,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('문의 읽음 처리 오류:', error);
    throw error;
  }
};

// 상태별 한글 표시
export const getStatusText = (status) => {
  const statusMap = {
    pending: '답변 대기',
    in_progress: '답변 완료',
    resolved: '해결 완료',
  };
  return statusMap[status] || status;
};

// 상태별 색상
export const getStatusColor = (status) => {
  const colorMap = {
    pending: '#f39c12',
    in_progress: '#3498db',
    resolved: '#27ae60',
  };
  return colorMap[status] || '#95a5a6';
};

/**
 * 문의 삭제 (답변이 없는 경우만)
 * @param {string} userId - 사용자 ID
 * @param {string} inquiryId - 문의 ID
 */
export const deleteInquiry = async (userId, inquiryId) => {
  try {
    const inquiryRef = doc(db, 'users', userId, 'inquiries', inquiryId);
    const inquiryDoc = await getDoc(inquiryRef);

    if (!inquiryDoc.exists()) {
      throw new Error('문의를 찾을 수 없습니다.');
    }

    const inquiryData = inquiryDoc.data();

    // 답변 대기 중인 상태만 삭제 가능
    if (inquiryData.status !== 'pending') {
      throw new Error('답변이 달린 문의는 삭제할 수 없습니다.');
    }

    await deleteDoc(inquiryRef);
  } catch (error) {
    console.error('문의 삭제 오류:', error);
    throw error;
  }
};

// 카테고리 목록
export const INQUIRY_CATEGORIES = [
  '기능 문의',
  '버그 신고',
  '개선 제안',
  '계정 문제',
  '기타',
];
