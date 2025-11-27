// 메모 폴더 관리 커스텀 훅
import { useState, useEffect, useCallback } from 'react';
import { fetchFoldersFromFirestore, saveFoldersToFirestore } from '../services/userDataService';

const MAX_CUSTOM_FOLDERS = 4; // 사용자 정의 폴더 최대 개수

// 기본 폴더 (삭제 불가)
const DEFAULT_FOLDERS = [
  { id: 'all', name: '전체', icon: '📋', isDefault: true, order: 0 },
  { id: 'shared', name: '공유', icon: '🔗', isDefault: true, order: 1, isAutoTag: true }
];

export const useMemoFolders = () => {
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState('all');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 초기 로드 (Firestore 우선, localStorage 마이그레이션)
  useEffect(() => {
    const loadFolders = async () => {
      const userId = localStorage.getItem('firebaseUserId');
      if (!userId) {
        console.log('⚠️ userId 없음, 기본 폴더만 로드');
        setFolders(DEFAULT_FOLDERS);
        return;
      }

      try {
        console.log('📂 Firestore에서 폴더 로드 시도...');
        // Firestore에서 폴더 데이터 가져오기
        const firestoreFolders = await fetchFoldersFromFirestore(userId);
        console.log('📂 Firestore 폴더:', firestoreFolders);

        let loadedFolders = DEFAULT_FOLDERS;

        if (firestoreFolders && firestoreFolders.length > 0) {
          // Firestore에 데이터가 있으면 사용
          const hasAllFolder = firestoreFolders.some(f => f.id === 'all');
          const hasSharedFolder = firestoreFolders.some(f => f.id === 'shared');

          let merged = [...firestoreFolders];
          if (!hasAllFolder) {
            merged = [DEFAULT_FOLDERS[0], ...merged];
          }
          if (!hasSharedFolder) {
            merged.splice(1, 0, DEFAULT_FOLDERS[1]);
          }

          loadedFolders = merged;
        } else {
          // Firestore가 비어있으면 localStorage에서 마이그레이션
          const localFolders = JSON.parse(localStorage.getItem('memoFolders') || '[]');

          if (localFolders.length > 0) {
            console.log('📦 localStorage 폴더를 Firestore로 마이그레이션합니다...');

            // 기본 폴더가 없으면 추가
            const hasAllFolder = localFolders.some(f => f.id === 'all');
            const hasSharedFolder = localFolders.some(f => f.id === 'shared');

            let merged = [...localFolders];
            if (!hasAllFolder) {
              merged = [DEFAULT_FOLDERS[0], ...merged];
            }
            if (!hasSharedFolder) {
              merged.splice(1, 0, DEFAULT_FOLDERS[1]);
            }

            loadedFolders = merged;

            // Firestore에 저장
            try {
              await saveFoldersToFirestore(userId, merged);
              console.log('✅ 폴더 마이그레이션 완료!');
            } catch (error) {
              console.error('폴더 마이그레이션 실패:', error);
            }
          }
        }

        setFolders(loadedFolders);
      } catch (error) {
        console.error('폴더 로드 실패:', error);
        setFolders(DEFAULT_FOLDERS);
      } finally {
        setIsInitialLoad(false);
      }
    };

    loadFolders();
  }, []);

  // Firestore에 저장
  useEffect(() => {
    // 초기 로드 중에는 저장하지 않음
    if (isInitialLoad) {
      console.log('⏳ 초기 로드 중... 폴더 저장 스킵');
      return;
    }
    if (folders.length === 0) {
      console.log('⚠️ 폴더가 없음, 저장 스킵');
      return;
    }

    const saveFolders = async () => {
      const userId = localStorage.getItem('firebaseUserId');
      if (!userId) {
        console.log('⚠️ userId 없음, 폴더 저장 불가');
        return;
      }

      try {
        console.log('💾 Firestore에 폴더 저장 시도:', folders.length, '개');
        await saveFoldersToFirestore(userId, folders);
        console.log('✅ 폴더 저장 완료:', folders.map(f => f.name));
      } catch (error) {
        console.error('❌ 폴더 저장 실패:', error);
      }
    };

    saveFolders();
  }, [folders, isInitialLoad]);

  // 폴더 추가 (최대 개수 제한)
  const addFolder = useCallback((name, icon = '📁') => {
    // 사용자 정의 폴더 개수 확인
    const customCount = folders.filter(f => !f.isDefault).length;
    if (customCount >= MAX_CUSTOM_FOLDERS) {
      console.warn(`폴더는 최대 ${MAX_CUSTOM_FOLDERS}개까지만 생성할 수 있습니다.`);
      return null;
    }

    const id = `folder_${Date.now()}`;
    const newFolder = {
      id,
      name: name.trim(),
      icon,
      isDefault: false,
      order: folders.length,
      createdAt: Date.now()
    };
    setFolders(prev => [...prev, newFolder]);
    return newFolder;
  }, [folders]);

  // 폴더 수정
  const updateFolder = useCallback((folderId, updates) => {
    setFolders(prev => prev.map(folder => {
      if (folder.id === folderId && !folder.isDefault) {
        return { ...folder, ...updates };
      }
      return folder;
    }));
  }, []);

  // 폴더 삭제
  const deleteFolder = useCallback((folderId) => {
    const folder = folders.find(f => f.id === folderId);
    if (folder?.isDefault) {
      console.warn('기본 폴더는 삭제할 수 없습니다.');
      return false;
    }

    setFolders(prev => prev.filter(f => f.id !== folderId));

    // 삭제된 폴더가 현재 선택된 폴더면 '전체'로 이동
    if (activeFolder === folderId) {
      setActiveFolder('all');
    }
    return true;
  }, [folders, activeFolder]);

  // 폴더 순서 변경
  const reorderFolders = useCallback((startIndex, endIndex) => {
    setFolders(prev => {
      const result = [...prev];
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result.map((f, i) => ({ ...f, order: i }));
    });
  }, []);

  // 사용자 정의 폴더만 반환
  const customFolders = folders.filter(f => !f.isDefault);

  // 폴더 추가 가능 여부
  const canAddFolder = customFolders.length < MAX_CUSTOM_FOLDERS;

  return {
    folders,
    customFolders,
    activeFolder,
    setActiveFolder,
    addFolder,
    updateFolder,
    deleteFolder,
    reorderFolders,
    canAddFolder,
    maxFolders: MAX_CUSTOM_FOLDERS
  };
};

export default useMemoFolders;
