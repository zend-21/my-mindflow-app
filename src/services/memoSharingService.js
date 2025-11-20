// 메모 공유 서비스
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * 메모를 친구와 공유
 * @param {string} memoId - 공유할 메모 ID
 * @param {Array} friendIds - 공유할 친구 ID 배열
 * @param {string} permission - 'read' | 'suggest' (읽기전용 | 편집제안)
 */
export const shareMemoWithFriends = async (memoId, friendIds, permission = 'read') => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  // 공유 문서 생성 또는 업데이트
  const shareRef = doc(db, 'sharedMemos', memoId);
  const shareDoc = await getDoc(shareRef);

  const shareData = {
    ownerId: userId,
    memoId: memoId,
    sharedWith: friendIds.map(friendId => ({
      userId: friendId,
      permission: permission,
      sharedAt: new Date().toISOString()
    })),
    updatedAt: new Date().toISOString()
  };

  if (shareDoc.exists()) {
    // 기존 공유에 추가
    const existingShares = shareDoc.data().sharedWith || [];
    const newShares = friendIds.filter(
      fId => !existingShares.some(s => s.userId === fId)
    ).map(friendId => ({
      userId: friendId,
      permission: permission,
      sharedAt: new Date().toISOString()
    }));

    await updateDoc(shareRef, {
      sharedWith: arrayUnion(...newShares),
      updatedAt: new Date().toISOString()
    });
  } else {
    // 새로운 공유 생성
    await setDoc(shareRef, shareData);
  }

  return true;
};

/**
 * 메모 공유 해제
 * @param {string} memoId - 메모 ID
 * @param {string} friendId - 공유 해제할 친구 ID
 */
export const unshareMemo = async (memoId, friendId) => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  const shareRef = doc(db, 'sharedMemos', memoId);
  const shareDoc = await getDoc(shareRef);

  if (!shareDoc.exists()) return;

  const sharedWith = shareDoc.data().sharedWith || [];
  const updatedShares = sharedWith.filter(s => s.userId !== friendId);

  if (updatedShares.length === 0) {
    // 공유 대상이 없으면 문서 삭제
    await deleteDoc(shareRef);
  } else {
    await updateDoc(shareRef, {
      sharedWith: updatedShares,
      updatedAt: new Date().toISOString()
    });
  }

  return true;
};

/**
 * 나와 공유된 메모 목록 가져오기
 */
export const getSharedMemos = async () => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  const sharesRef = collection(db, 'sharedMemos');
  const q = query(sharesRef);
  const snapshot = await getDocs(q);

  const sharedMemos = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    const share = data.sharedWith?.find(s => s.userId === userId);

    if (share) {
      sharedMemos.push({
        memoId: data.memoId,
        ownerId: data.ownerId,
        permission: share.permission,
        sharedAt: share.sharedAt
      });
    }
  });

  return sharedMemos;
};

/**
 * 특정 메모의 공유 정보 가져오기
 */
export const getMemoShareInfo = async (memoId) => {
  const shareRef = doc(db, 'sharedMemos', memoId);
  const shareDoc = await getDoc(shareRef);

  if (!shareDoc.exists()) return null;

  return shareDoc.data();
};

/**
 * 편집 권한 업데이트
 * @param {string} memoId - 메모 ID
 * @param {string} friendId - 친구 ID
 * @param {string} permission - 'read' | 'suggest'
 */
export const updateSharePermission = async (memoId, friendId, permission) => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  const shareRef = doc(db, 'sharedMemos', memoId);
  const shareDoc = await getDoc(shareRef);

  if (!shareDoc.exists()) throw new Error('공유 정보를 찾을 수 없습니다');
  if (shareDoc.data().ownerId !== userId) throw new Error('권한이 없습니다');

  const sharedWith = shareDoc.data().sharedWith || [];
  const updatedShares = sharedWith.map(s => {
    if (s.userId === friendId) {
      return { ...s, permission };
    }
    return s;
  });

  await updateDoc(shareRef, {
    sharedWith: updatedShares,
    updatedAt: new Date().toISOString()
  });

  return true;
};
