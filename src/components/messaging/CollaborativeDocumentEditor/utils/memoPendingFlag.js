import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../firebase/config';

/**
 * 메모 문서의 hasPendingEdits 플래그 업데이트
 */
export const updateMemoPendingFlag = async (memoId, hasPending, currentUserId, onUpdateMemoPendingFlag) => {
  if (!memoId || !currentUserId) return;

  // 임시 문서는 스킵 (아직 Firestore에 저장되지 않음)
  if (memoId.startsWith('temp_')) {
    return;
  }

  try {
    const memoRef = doc(db, 'mindflowUsers', currentUserId, 'memos', memoId);

    // 먼저 문서가 존재하는지 확인
    const memoSnap = await getDoc(memoRef);
    if (!memoSnap.exists()) {
      console.error(`❌ 메모 문서가 존재하지 않음: ${memoId}`);
      return;
    }

    await updateDoc(memoRef, {
      hasPendingEdits: hasPending
    });

    // 저장 후 다시 읽어서 확인
    const updatedSnap = await getDoc(memoRef);
    const actualValue = updatedSnap.data()?.hasPendingEdits;
    console.log(`✏️ 메모 ${memoId} pending 플래그 업데이트:`, hasPending, '/ 실제 저장된 값:', actualValue);

    // ⭐ App.jsx의 메모 state도 즉시 업데이트 (새로고침 없이 배지 표시)
    if (onUpdateMemoPendingFlag) {
      onUpdateMemoPendingFlag(memoId, hasPending);
    }
  } catch (error) {
    console.error('메모 pending 플래그 업데이트 실패:', error);
  }
};
