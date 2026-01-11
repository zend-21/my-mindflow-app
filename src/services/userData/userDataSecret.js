/**
 * Secret page data operations
 * Handles encrypted documents, PIN, and secret settings
 */
import { db } from '../../firebase/config';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
  writeBatch
} from 'firebase/firestore';

// ========================================
// 시크릿 페이지 데이터 (기존 방식 유지)
// ========================================

export const fetchSecretPinFromFirestore = async (userId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'secretPin');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().pinHash || null;
    }
    return null;
  } catch (error) {
    console.error('시크릿 PIN 가져오기 실패:', error);
    throw error;
  }
};

export const saveSecretPinToFirestore = async (userId, pinHash) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'secretPin');
    await setDoc(docRef, {
      pinHash,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('시크릿 PIN 저장 실패:', error);
    throw error;
  }
};

export const fetchSecretDocsFromFirestore = async (userId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'secretDocs');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().encryptedData || '';
    }
    return '';
  } catch (error) {
    console.error('시크릿 문서 가져오기 실패:', error);
    throw error;
  }
};

export const saveSecretDocsToFirestore = async (userId, encryptedData) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'secretDocs');
    await setDoc(docRef, {
      encryptedData,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('시크릿 문서 저장 실패:', error);
    throw error;
  }
};

export const fetchSecretSettingsFromFirestore = async (userId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'secretSettings');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    }
    return {
      pinLength: 6,
      autoLockMinutes: 5,
      emailNotifications: false,
      categoryNames: {
        financial: '금융',
        personal: '개인',
        work: '업무',
        diary: '일기'
      },
      categoryIcons: {
        financial: 'dollar',
        personal: 'user',
        work: 'briefcase',
        diary: 'book'
      }
    };
  } catch (error) {
    console.error('시크릿 설정 가져오기 실패:', error);
    throw error;
  }
};

export const saveSecretSettingsToFirestore = async (userId, settings) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'secretSettings');
    await setDoc(docRef, {
      ...settings,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('시크릿 설정 저장 실패:', error);
    throw error;
  }
};

export const fetchDeletedSecretDocIds = async (userId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'secretDeletedIds');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().deletedIds || [];
    }
    return [];
  } catch (error) {
    console.error('삭제된 시크릿 문서 ID 가져오기 실패:', error);
    throw error;
  }
};

export const saveDeletedSecretDocIds = async (userId, deletedIds) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'secretDeletedIds');
    await setDoc(docRef, {
      deletedIds,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('삭제된 시크릿 문서 ID 저장 실패:', error);
    throw error;
  }
};

export const fetchPendingCleanupIds = async (userId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'secretPendingCleanup');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().pendingIds || [];
    }
    return [];
  } catch (error) {
    console.error('대기 중인 정리 ID 가져오기 실패:', error);
    throw error;
  }
};

export const savePendingCleanupIds = async (userId, pendingIds) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'secretPendingCleanup');
    await setDoc(docRef, {
      pendingIds,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('대기 중인 정리 ID 저장 실패:', error);
    throw error;
  }
};

export const fetchSecretDocsMetadata = async (userId) => {
  try {
    const metadataRef = doc(db, 'mindflowUsers', userId, 'secretDocs', 'metadata');
    const metadataSnap = await getDoc(metadataRef);

    if (metadataSnap.exists()) {
      return metadataSnap.data();
    }
    return { count: 0, updatedAt: null };
  } catch (error) {
    console.error('시크릿 메타데이터 가져오기 실패:', error);
    return { count: 0, updatedAt: null };
  }
};

export const fetchIndividualSecretDocsFromFirestore = async (userId, docId = null) => {
  try {
    const colRef = collection(db, 'mindflowUsers', userId, 'secretDocs');

    // 🚀 최적화: 단일 문서만 요청하는 경우
    if (docId) {
      const docRef = doc(colRef, docId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();

      // ⭐ deleted 체크
      if (data.deleted === true) {
        return null;
      }

      return {
        id: docSnap.id,
        encryptedData: data.encryptedData || '',
        deleted: data.deleted ?? false
      };
    }

    // 전체 문서 요청
    const querySnapshot = await getDocs(colRef);

    const docs = [];
    querySnapshot.forEach((docSnap) => {
      if (docSnap.id !== 'metadata') {
        const data = docSnap.data();

        // ⭐ deleted 체크
        if (data.deleted === true) {
          return;  // 스킵
        }

        docs.push({
          id: docSnap.id,
          encryptedData: data.encryptedData || '',
          deleted: data.deleted ?? false,
          updatedAt: data.updatedAt  // ⭐ Firestore 타임스탬프 추가 (timestamp comparison용)
        });
      }
    });

    return docs;
  } catch (error) {
    console.error('개별 시크릿 문서 가져오기 실패:', error);
    throw error;
  }
};

export const saveIndividualSecretDocsToFirestore = async (userId, encryptedDocs) => {
  try {
    const batch = writeBatch(db);
    const colRef = collection(db, 'mindflowUsers', userId, 'secretDocs');

    encryptedDocs.forEach((encDoc) => {
      const docRef = doc(colRef, encDoc.id);
      batch.set(docRef, {
        encryptedData: encDoc.encryptedData,
        deleted: false,  // ⭐ Evernote 방식
        updatedAt: serverTimestamp(),
        createdAt: encDoc.createdAt || serverTimestamp()
      }, { merge: true });
    });

    const metadataRef = doc(colRef, 'metadata');
    batch.set(metadataRef, {
      count: encryptedDocs.length,
      updatedAt: serverTimestamp()
    }, { merge: true });

    await batch.commit();
  } catch (error) {
    console.error('개별 시크릿 문서 저장 실패:', error);
    throw error;
  }
};

export const deleteIndividualSecretDocsFromFirestore = async (userId, docIds) => {
  try {
    const batch = writeBatch(db);
    const colRef = collection(db, 'mindflowUsers', userId, 'secretDocs');

    docIds.forEach((docId) => {
      const docRef = doc(colRef, docId);
      // ⭐ Soft Delete
      batch.set(docRef, {
        deleted: true,
        deletedAt: serverTimestamp()
      }, { merge: true });
    });

    await batch.commit();
    console.log(`✅ 시크릿 문서 soft delete 완료: ${docIds.join(', ')}`);
  } catch (error) {
    console.error('개별 시크릿 문서 삭제 실패:', error);
    throw error;
  }
};

export const migrateToIndividualEncryption = async (userId) => {
  try {
    const oldDocRef = doc(db, 'mindflowUsers', userId, 'userData', 'secretDocs');
    const oldDocSnap = await getDoc(oldDocRef);

    if (!oldDocSnap.exists() || !oldDocSnap.data().encryptedData) {
      console.log('✅ 마이그레이션 불필요: 기존 데이터 없음');
      return { migrated: false, reason: 'no-old-data' };
    }

    console.log('🔄 마이그레이션 시작: 단일 blob → 개별 문서 암호화');
    return { migrated: false, reason: 'needs-pin', oldData: oldDocSnap.data().encryptedData };
  } catch (error) {
    console.error('❌ 마이그레이션 확인 실패:', error);
    throw error;
  }
};
