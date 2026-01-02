// 프리즈된 문서 체크 유틸리티
import { db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

/**
 * 특정 메모가 어느 대화방에서든 편집 중인지 확인
 * @param {string} memoId - 확인할 메모 ID
 * @param {string} userId - 현재 사용자 ID
 * @returns {Promise<boolean>} - 프리즈 여부
 */
export const checkIfMemoIsFrozen = async (memoId, userId) => {
  try {
    // 사용자가 참여 중인 모든 대화방 조회
    const chatRoomsRef = collection(db, 'chatRooms');
    const chatRoomsSnapshot = await getDocs(chatRoomsRef);

    // 각 대화방에서 해당 메모의 편집 이력 확인
    for (const chatRoomDoc of chatRoomsSnapshot.docs) {
      const chatRoomId = chatRoomDoc.id;

      try {
        const editHistoryRef = collection(
          db,
          'chatRooms',
          chatRoomId,
          'documents',
          memoId,
          'editHistory'
        );
        const q = query(editHistoryRef, where('status', '==', 'pending'));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          // 편집 중인 이력이 있음
          return true;
        }
      } catch (error) {
        // 해당 메모의 편집 이력이 없는 경우 (정상)
        continue;
      }
    }

    return false;
  } catch (error) {
    console.error('프리즈 문서 체크 오류:', error);
    return false;
  }
};

/**
 * 여러 메모의 프리즈 상태를 일괄 확인
 * @param {Array} memoIds - 확인할 메모 ID 배열
 * @param {string} userId - 현재 사용자 ID
 * @returns {Promise<Set>} - 프리즈된 메모 ID Set
 */
export const checkFrozenDocuments = async (memoIds, userId) => {
  const frozenSet = new Set();

  try {
    console.log('🔍 프리즈 체크 시작 - 메모 개수:', memoIds.length);

    // 사용자가 참여 중인 모든 대화방 조회
    const chatRoomsRef = collection(db, 'chatRooms');
    const chatRoomsSnapshot = await getDocs(chatRoomsRef);

    console.log('🔍 전체 대화방 개수:', chatRoomsSnapshot.docs.length);

    // 각 메모에 대해 모든 대화방 확인
    for (const memoId of memoIds) {
      for (const chatRoomDoc of chatRoomsSnapshot.docs) {
        const chatRoomId = chatRoomDoc.id;

        try {
          const editHistoryRef = collection(
            db,
            'chatRooms',
            chatRoomId,
            'documents',
            memoId,
            'editHistory'
          );
          const q = query(editHistoryRef, where('status', '==', 'pending'));
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            console.log('❄️ 프리즈된 문서 발견:', memoId, 'in room:', chatRoomId, '편집 개수:', snapshot.docs.length);
            frozenSet.add(memoId);
            break; // 이미 프리즈 확인되면 다른 대화방 체크 불필요
          }
        } catch (error) {
          // 편집 이력이 없는 경우 무시
          continue;
        }
      }
    }

    console.log('✅ 프리즈 체크 완료 - 프리즈된 문서:', Array.from(frozenSet));
  } catch (error) {
    console.error('❌ 프리즈 문서 일괄 체크 오류:', error);
  }

  return frozenSet;
};
