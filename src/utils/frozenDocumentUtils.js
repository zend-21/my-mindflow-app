// 프리즈된 문서 체크 유틸리티
import { db } from '../firebase/config';
import { collection, collectionGroup, query, where, getDocs } from 'firebase/firestore';

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
 * 여러 메모의 프리즈 상태를 일괄 확인 (어느 대화방에서 작업 중인지 포함)
 * @param {Array} memoIds - 확인할 메모 ID 배열
 * @param {string} userId - 현재 사용자 ID
 * @returns {Promise<Map>} - 메모 ID를 키로, chatRoomId를 값으로 하는 Map
 */
export const checkFrozenDocuments = async (memoIds, userId) => {
  const frozenMap = new Map(); // memoId -> chatRoomId

  try {
    console.log('🔍 프리즈 체크 시작 - 메모 개수:', memoIds.length);

    // collectionGroup으로 모든 대화방의 editHistory를 한 번에 검색
    // status가 'pending'인 편집 이력만 조회
    const editHistoryQuery = query(
      collectionGroup(db, 'editHistory'),
      where('status', '==', 'pending')
    );

    const snapshot = await getDocs(editHistoryQuery);

    console.log('📊 전체 pending 편집 개수:', snapshot.docs.length);

    // pending 편집 이력의 문서 경로에서 memoId와 chatRoomId 추출
    snapshot.docs.forEach(doc => {
      // 경로: chatRooms/{chatRoomId}/documents/{memoId}/editHistory/{editId}
      const pathParts = doc.ref.path.split('/');
      const chatRoomId = pathParts[1]; // chatRooms 다음의 chatRoomId
      const memoId = pathParts[3]; // documents 다음의 memoId

      // 공유 폴더 메모 목록에 있는 경우만 프리즈 처리
      if (memoIds.includes(memoId)) {
        console.log('❄️ 프리즈된 문서 발견:', memoId, '대화방:', chatRoomId, '편집 ID:', doc.id);
        frozenMap.set(memoId, chatRoomId);
      }
    });

    console.log('✅ 프리즈 체크 완료 - 프리즈된 문서:', Array.from(frozenMap.entries()));
  } catch (error) {
    console.error('❌ 프리즈 문서 일괄 체크 오류:', error);
  }

  return frozenMap;
};
