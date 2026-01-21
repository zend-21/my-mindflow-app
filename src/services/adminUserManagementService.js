// src/services/adminUserManagementService.js
// 관리자용 회원 관리 서비스

import { db } from '../firebase/config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

/**
 * 전체 회원 통계 조회
 */
export const getUserStats = async () => {
  try {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let totalUsers = 0;
    let todaySignups = 0;
    let deletedUsers = 0;
    const signupsByDate = {};
    const deletionsByDate = {};

    usersSnapshot.forEach((doc) => {
      const data = doc.data();

      if (data.deletedAt) {
        // 탈퇴한 회원
        deletedUsers++;

        // Firestore Timestamp를 Date로 변환
        let deletedDate;
        if (data.deletedAt.toDate && typeof data.deletedAt.toDate === 'function') {
          deletedDate = data.deletedAt.toDate();
        } else if (data.deletedAt instanceof Date) {
          deletedDate = data.deletedAt;
        } else if (typeof data.deletedAt === 'string') {
          deletedDate = new Date(data.deletedAt);
        } else {
          return; // 유효하지 않은 날짜는 건너뜀
        }

        const dateKey = deletedDate.toISOString().split('T')[0];
        deletionsByDate[dateKey] = (deletionsByDate[dateKey] || 0) + 1;
      } else {
        // 활성 회원
        totalUsers++;

        if (data.createdAt) {
          // Firestore Timestamp를 Date로 변환
          let createdDate;
          if (data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
            createdDate = data.createdAt.toDate();
          } else if (data.createdAt instanceof Date) {
            createdDate = data.createdAt;
          } else if (typeof data.createdAt === 'string') {
            createdDate = new Date(data.createdAt);
          } else {
            return; // 유효하지 않은 날짜는 건너뜀
          }

          const dateKey = createdDate.toISOString().split('T')[0];
          signupsByDate[dateKey] = (signupsByDate[dateKey] || 0) + 1;

          // 오늘 가입자
          if (createdDate >= todayStart) {
            todaySignups++;
          }
        }
      }
    });

    // 날짜별 데이터를 배열로 변환 (최근 30일)
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      last30Days.push({
        date: dateKey,
        signups: signupsByDate[dateKey] || 0,
        deletions: deletionsByDate[dateKey] || 0
      });
    }

    return {
      totalUsers,
      todaySignups,
      deletedUsers,
      chartData: last30Days
    };
  } catch (error) {
    console.error('회원 통계 조회 실패:', error);
    throw error;
  }
};

/**
 * ShareNote ID로 사용자 검색
 */
export const searchUserByShareNoteId = async (shareNoteId) => {
  try {
    // ws- 접두사 자동 추가
    const normalizedId = shareNoteId.toLowerCase().startsWith('ws-')
      ? shareNoteId
      : `ws-${shareNoteId}`;

    // workspaces에서 userId 찾기
    const workspacesRef = collection(db, 'workspaces');
    const q = query(workspacesRef, where('workspaceCode', '==', normalizedId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const workspaceData = snapshot.docs[0].data();
    const userId = workspaceData.userId;

    // users 컬렉션에서 사용자 정보 조회
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();

    // 닉네임 조회
    let nickname = null;
    try {
      const nicknameDocRef = doc(db, 'nicknames', userId);
      const nicknameDoc = await getDoc(nicknameDocRef);
      if (nicknameDoc.exists()) {
        nickname = nicknameDoc.data().nickname;
      }
    } catch (error) {
      console.warn('닉네임 조회 실패:', error);
    }

    // 문의 건수 조회
    let inquiryCount = 0;
    try {
      const inquiriesRef = collection(db, 'users', userId, 'inquiries');
      const inquiriesSnapshot = await getDocs(inquiriesRef);
      inquiryCount = inquiriesSnapshot.size;
    } catch (error) {
      console.warn('문의 건수 조회 실패:', error);
    }

    return {
      userId,
      shareNoteId: normalizedId,
      email: userData.email,
      displayName: userData.displayName,
      nickname: nickname || userData.displayName,
      photoURL: userData.photoURL,
      createdAt: userData.createdAt,
      deletedAt: userData.deletedAt || null,
      inquiryCount,
      isDeleted: !!userData.deletedAt
    };
  } catch (error) {
    console.error('사용자 검색 실패:', error);
    throw error;
  }
};

/**
 * 사용자의 문의 목록 조회
 */
export const getUserInquiries = async (userId) => {
  try {
    const inquiriesRef = collection(db, 'users', userId, 'inquiries');
    const q = query(inquiriesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      userId,
      ...doc.data()
    }));
  } catch (error) {
    console.error('사용자 문의 목록 조회 실패:', error);
    throw error;
  }
};

/**
 * 회원 탈퇴 처리 (문의 글 제외한 모든 정보 삭제)
 */
export const deleteUser = async (userId) => {
  try {
    // 1. users 문서에 deletedAt 타임스탬프 추가
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      deletedAt: serverTimestamp(),
      // 개인정보 삭제
      email: null,
      displayName: '[탈퇴한 사용자]',
      photoURL: null,
      phoneNumber: null
    });

    // 2. nicknames 문서 삭제
    try {
      const nicknameDocRef = doc(db, 'nicknames', userId);
      await deleteDoc(nicknameDocRef);
    } catch (error) {
      console.warn('닉네임 삭제 실패:', error);
    }

    // 3. workspaces 문서 삭제
    try {
      const workspacesRef = collection(db, 'workspaces');
      const q = query(workspacesRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);

      for (const docSnapshot of snapshot.docs) {
        await deleteDoc(docSnapshot.ref);
      }
    } catch (error) {
      console.warn('워크스페이스 삭제 실패:', error);
    }

    // 4. memos 컬렉션 전체 삭제
    try {
      const memosRef = collection(db, 'users', userId, 'memos');
      const memosSnapshot = await getDocs(memosRef);

      for (const docSnapshot of memosSnapshot.docs) {
        await deleteDoc(docSnapshot.ref);
      }
    } catch (error) {
      console.warn('메모 삭제 실패:', error);
    }

    // 5. friends 관계 삭제
    try {
      const friendsRef = collection(db, 'users', userId, 'friends');
      const friendsSnapshot = await getDocs(friendsRef);

      for (const docSnapshot of friendsSnapshot.docs) {
        await deleteDoc(docSnapshot.ref);
      }
    } catch (error) {
      console.warn('친구 관계 삭제 실패:', error);
    }

    // 6. directMessages 삭제
    try {
      const dmsRef = collection(db, 'users', userId, 'directMessages');
      const dmsSnapshot = await getDocs(dmsRef);

      for (const docSnapshot of dmsSnapshot.docs) {
        await deleteDoc(docSnapshot.ref);
      }
    } catch (error) {
      console.warn('다이렉트 메시지 삭제 실패:', error);
    }

    // 주의: inquiries는 법적 보관 목적으로 삭제하지 않음

    return { success: true };
  } catch (error) {
    console.error('회원 탈퇴 처리 실패:', error);
    throw error;
  }
};
