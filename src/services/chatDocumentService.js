// 📄 채팅방 문서 첨부 및 협업 편집 서비스
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  increment
} from 'firebase/firestore';
import { db } from '../firebase/config';

// ==================== 문서 첨부 ====================

/**
 * 채팅방에 새 문서 첨부
 * @param {string} chatRoomId - 채팅방 ID (1:1 또는 그룹)
 * @param {string} chatType - 'dm' 또는 'group'
 * @param {string} creatorId - 문서 생성자 UID
 * @param {string} title - 문서 제목
 * @param {string} content - 문서 내용
 * @returns {Promise<string>} 생성된 문서 ID
 */
export const attachDocumentToChat = async (chatRoomId, chatType, creatorId, title, content = '') => {
  try {
    const collectionName = chatType === 'group' ? 'groupChats' : 'directMessages';
    const documentsRef = collection(db, collectionName, chatRoomId, 'documents');

    const documentData = {
      title,
      content,
      creatorId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // 편집 권한 관리
      permissions: {
        owner: creatorId, // 소유자
        editors: [], // 편집 가능한 사용자 UID 배열
        viewers: [] // 보기만 가능한 사용자 UID 배열
      },
      // 변경 이력
      changeHistory: [],
      // 문서 상태
      isArchived: false,
      version: 1
    };

    const docRef = await addDoc(documentsRef, documentData);

    // 채팅방에 시스템 메시지 추가
    const messagesRef = collection(db, collectionName, chatRoomId, 'messages');
    await addDoc(messagesRef, {
      type: 'document_attached',
      content: `📄 ${title}`,
      senderId: creatorId,
      createdAt: serverTimestamp(),
      metadata: {
        documentId: docRef.id,
        documentTitle: title,
        action: 'attached'
      }
    });

    // 채팅방의 lastMessage 업데이트
    const chatRoomRef = doc(db, collectionName, chatRoomId);
    await updateDoc(chatRoomRef, {
      lastMessage: `📄 문서: ${title}`,
      lastMessageTime: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('✅ 문서 첨부 완료:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ 문서 첨부 실패:', error);
    throw error;
  }
};

/**
 * 기존 메모를 채팅방에 첨부
 * @param {string} chatRoomId - 채팅방 ID
 * @param {string} chatType - 'dm' 또는 'group'
 * @param {string} userId - 사용자 UID
 * @param {string} memoId - 첨부할 메모 ID
 */
export const attachExistingMemo = async (chatRoomId, chatType, userId, memoId) => {
  try {
    // 메모 내용 가져오기
    const memoRef = doc(db, 'memos', memoId);
    const memoDoc = await getDoc(memoRef);

    if (!memoDoc.exists()) {
      throw new Error('메모를 찾을 수 없습니다.');
    }

    const memoData = memoDoc.data();

    // 채팅방에 문서로 첨부
    const documentId = await attachDocumentToChat(
      chatRoomId,
      chatType,
      userId,
      memoData.title || '제목 없음',
      memoData.content || ''
    );

    console.log('✅ 기존 메모 첨부 완료:', documentId);
    return documentId;
  } catch (error) {
    console.error('❌ 기존 메모 첨부 실패:', error);
    throw error;
  }
};

// ==================== 권한 관리 ====================

/**
 * 사용자에게 편집 권한 부여
 * @param {string} chatRoomId - 채팅방 ID
 * @param {string} chatType - 'dm' 또는 'group'
 * @param {string} documentId - 문서 ID
 * @param {string} ownerId - 문서 소유자 UID
 * @param {string} userId - 권한을 부여받을 사용자 UID
 */
export const grantEditPermission = async (chatRoomId, chatType, documentId, ownerId, userId) => {
  try {
    const collectionName = chatType === 'group' ? 'groupChats' : 'directMessages';
    const documentRef = doc(db, collectionName, chatRoomId, 'documents', documentId);
    const documentDoc = await getDoc(documentRef);

    if (!documentDoc.exists()) {
      throw new Error('문서를 찾을 수 없습니다.');
    }

    const docData = documentDoc.data();

    // 권한 확인
    if (docData.permissions.owner !== ownerId) {
      throw new Error('문서 소유자만 권한을 부여할 수 있습니다.');
    }

    // 이미 편집 권한이 있는지 확인
    if (docData.permissions.editors.includes(userId)) {
      console.log('이미 편집 권한이 있습니다.');
      return;
    }

    // 편집 권한 추가
    await updateDoc(documentRef, {
      'permissions.editors': arrayUnion(userId),
      updatedAt: serverTimestamp()
    });

    // 시스템 메시지 추가
    const messagesRef = collection(db, collectionName, chatRoomId, 'messages');
    await addDoc(messagesRef, {
      type: 'system',
      content: `편집 권한이 부여되었습니다.`,
      createdAt: serverTimestamp(),
      metadata: {
        documentId,
        action: 'permission_granted',
        userId
      }
    });

    console.log('✅ 편집 권한 부여 완료');
  } catch (error) {
    console.error('❌ 편집 권한 부여 실패:', error);
    throw error;
  }
};

/**
 * 편집 권한 취소
 * @param {string} chatRoomId - 채팅방 ID
 * @param {string} chatType - 'dm' 또는 'group'
 * @param {string} documentId - 문서 ID
 * @param {string} ownerId - 문서 소유자 UID
 * @param {string} userId - 권한을 취소할 사용자 UID
 */
export const revokeEditPermission = async (chatRoomId, chatType, documentId, ownerId, userId) => {
  try {
    const collectionName = chatType === 'group' ? 'groupChats' : 'directMessages';
    const documentRef = doc(db, collectionName, chatRoomId, 'documents', documentId);
    const documentDoc = await getDoc(documentRef);

    if (!documentDoc.exists()) {
      throw new Error('문서를 찾을 수 없습니다.');
    }

    const docData = documentDoc.data();

    // 권한 확인
    if (docData.permissions.owner !== ownerId) {
      throw new Error('문서 소유자만 권한을 취소할 수 있습니다.');
    }

    // 편집 권한 제거
    const updatedEditors = docData.permissions.editors.filter(id => id !== userId);
    await updateDoc(documentRef, {
      'permissions.editors': updatedEditors,
      updatedAt: serverTimestamp()
    });

    console.log('✅ 편집 권한 취소 완료');
  } catch (error) {
    console.error('❌ 편집 권한 취소 실패:', error);
    throw error;
  }
};

// ==================== 문서 편집 ====================

/**
 * 문서 내용 수정
 * @param {string} chatRoomId - 채팅방 ID
 * @param {string} chatType - 'dm' 또는 'group'
 * @param {string} documentId - 문서 ID
 * @param {string} userId - 수정하는 사용자 UID
 * @param {string} newContent - 새 문서 내용
 * @param {Array} changes - 변경 사항 배열 (옵션)
 */
export const updateDocument = async (chatRoomId, chatType, documentId, userId, newContent, changes = []) => {
  try {
    const collectionName = chatType === 'group' ? 'groupChats' : 'directMessages';
    const documentRef = doc(db, collectionName, chatRoomId, 'documents', documentId);
    const documentDoc = await getDoc(documentRef);

    if (!documentDoc.exists()) {
      throw new Error('문서를 찾을 수 없습니다.');
    }

    const docData = documentDoc.data();

    // 편집 권한 확인
    const hasPermission =
      docData.permissions.owner === userId ||
      docData.permissions.editors.includes(userId);

    if (!hasPermission) {
      throw new Error('문서 편집 권한이 없습니다.');
    }

    // 변경 이력 추가
    const changeRecord = {
      userId,
      timestamp: new Date(),
      changes: changes.length > 0 ? changes : [{ type: 'content_updated' }],
      oldContent: docData.content,
      newContent
    };

    // 문서 업데이트
    await updateDoc(documentRef, {
      content: newContent,
      updatedAt: serverTimestamp(),
      changeHistory: arrayUnion(changeRecord),
      version: increment(1)
    });

    // 시스템 메시지 추가
    const messagesRef = collection(db, collectionName, chatRoomId, 'messages');
    await addDoc(messagesRef, {
      type: 'document_edited',
      content: `📝 문서가 수정되었습니다`,
      senderId: userId,
      createdAt: serverTimestamp(),
      metadata: {
        documentId,
        documentTitle: docData.title,
        action: 'edited'
      }
    });

    console.log('✅ 문서 수정 완료');
  } catch (error) {
    console.error('❌ 문서 수정 실패:', error);
    throw error;
  }
};

/**
 * 문서 제목 수정
 * @param {string} chatRoomId - 채팅방 ID
 * @param {string} chatType - 'dm' 또는 'group'
 * @param {string} documentId - 문서 ID
 * @param {string} userId - 수정하는 사용자 UID
 * @param {string} newTitle - 새 제목
 */
export const updateDocumentTitle = async (chatRoomId, chatType, documentId, userId, newTitle) => {
  try {
    const collectionName = chatType === 'group' ? 'groupChats' : 'directMessages';
    const documentRef = doc(db, collectionName, chatRoomId, 'documents', documentId);
    const documentDoc = await getDoc(documentRef);

    if (!documentDoc.exists()) {
      throw new Error('문서를 찾을 수 없습니다.');
    }

    const docData = documentDoc.data();

    // 편집 권한 확인
    const hasPermission =
      docData.permissions.owner === userId ||
      docData.permissions.editors.includes(userId);

    if (!hasPermission) {
      throw new Error('문서 편집 권한이 없습니다.');
    }

    // 제목 업데이트
    await updateDoc(documentRef, {
      title: newTitle,
      updatedAt: serverTimestamp()
    });

    console.log('✅ 문서 제목 수정 완료');
  } catch (error) {
    console.error('❌ 문서 제목 수정 실패:', error);
    throw error;
  }
};

// ==================== 문서 조회 ====================

/**
 * 채팅방의 문서 목록 실시간 구독
 * @param {string} chatRoomId - 채팅방 ID
 * @param {string} chatType - 'dm' 또는 'group'
 * @param {Function} callback - 문서 목록을 받을 콜백
 * @returns {Function} unsubscribe 함수
 */
export const subscribeToDocuments = (chatRoomId, chatType, callback) => {
  const collectionName = chatType === 'group' ? 'groupChats' : 'directMessages';
  const documentsRef = collection(db, collectionName, chatRoomId, 'documents');
  const q = query(
    documentsRef,
    where('isArchived', '==', false),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const documents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(documents);
  });
};

/**
 * 특정 문서 정보 조회
 * @param {string} chatRoomId - 채팅방 ID
 * @param {string} chatType - 'dm' 또는 'group'
 * @param {string} documentId - 문서 ID
 * @returns {Promise<Object>} 문서 정보
 */
export const getDocument = async (chatRoomId, chatType, documentId) => {
  try {
    const collectionName = chatType === 'group' ? 'groupChats' : 'directMessages';
    const documentRef = doc(db, collectionName, chatRoomId, 'documents', documentId);
    const documentDoc = await getDoc(documentRef);

    if (!documentDoc.exists()) {
      throw new Error('문서를 찾을 수 없습니다.');
    }

    return {
      id: documentDoc.id,
      ...documentDoc.data()
    };
  } catch (error) {
    console.error('❌ 문서 조회 실패:', error);
    throw error;
  }
};

// ==================== 문서 삭제 ====================

/**
 * 문서 삭제 (소유자만 가능)
 * @param {string} chatRoomId - 채팅방 ID
 * @param {string} chatType - 'dm' 또는 'group'
 * @param {string} documentId - 문서 ID
 * @param {string} ownerId - 문서 소유자 UID
 */
export const deleteDocument = async (chatRoomId, chatType, documentId, ownerId) => {
  try {
    const collectionName = chatType === 'group' ? 'groupChats' : 'directMessages';
    const documentRef = doc(db, collectionName, chatRoomId, 'documents', documentId);
    const documentDoc = await getDoc(documentRef);

    if (!documentDoc.exists()) {
      throw new Error('문서를 찾을 수 없습니다.');
    }

    const docData = documentDoc.data();

    // 권한 확인
    if (docData.permissions.owner !== ownerId) {
      throw new Error('문서 소유자만 삭제할 수 있습니다.');
    }

    // 문서 삭제
    await deleteDoc(documentRef);

    // 시스템 메시지 추가
    const messagesRef = collection(db, collectionName, chatRoomId, 'messages');
    await addDoc(messagesRef, {
      type: 'system',
      content: `📄 문서 "${docData.title}"이(가) 삭제되었습니다.`,
      createdAt: serverTimestamp(),
      metadata: {
        documentId,
        action: 'deleted'
      }
    });

    console.log('✅ 문서 삭제 완료');
  } catch (error) {
    console.error('❌ 문서 삭제 실패:', error);
    throw error;
  }
};

/**
 * 문서 보관 (아카이브)
 * @param {string} chatRoomId - 채팅방 ID
 * @param {string} chatType - 'dm' 또는 'group'
 * @param {string} documentId - 문서 ID
 * @param {string} ownerId - 문서 소유자 UID
 */
export const archiveDocument = async (chatRoomId, chatType, documentId, ownerId) => {
  try {
    const collectionName = chatType === 'group' ? 'groupChats' : 'directMessages';
    const documentRef = doc(db, collectionName, chatRoomId, 'documents', documentId);
    const documentDoc = await getDoc(documentRef);

    if (!documentDoc.exists()) {
      throw new Error('문서를 찾을 수 없습니다.');
    }

    const docData = documentDoc.data();

    // 권한 확인
    if (docData.permissions.owner !== ownerId) {
      throw new Error('문서 소유자만 보관할 수 있습니다.');
    }

    // 문서 보관
    await updateDoc(documentRef, {
      isArchived: true,
      updatedAt: serverTimestamp()
    });

    console.log('✅ 문서 보관 완료');
  } catch (error) {
    console.error('❌ 문서 보관 실패:', error);
    throw error;
  }
};
