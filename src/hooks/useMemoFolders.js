// 메모 폴더 관리 커스텀 훅
import { useState, useEffect, useCallback } from 'react';

const MAX_CUSTOM_FOLDERS = 4; // 사용자 정의 폴더 최대 개수

// 기본 폴더 (삭제 불가)
const DEFAULT_FOLDERS = [
  { id: 'all', name: '전체', icon: '📋', isDefault: true, order: 0 },
  { id: 'shared', name: '공유', icon: '🔗', isDefault: true, order: 1, isAutoTag: true }
];

/**
 * 메모 폴더 관리 훅
 *
 * 이제 useFirestoreSync 훅을 통해 동기화됩니다.
 * 이 훅은 UI 상태 관리와 로직만 담당하고, 실제 Firestore 동기화는 useFirestoreSync가 처리합니다.
 *
 * @param {Object} syncContext - useFirestoreSync에서 제공하는 폴더 동기화 컨텍스트
 * @param {Array} syncContext.folders - 실시간으로 동기화되는 폴더 배열
 * @param {Function} syncContext.syncFolder - 개별 폴더 저장 함수
 * @param {Function} syncContext.deleteFolder - 폴더 삭제 함수
 */
export const useMemoFolders = (syncContext = null) => {
  const [folders, setFolders] = useState(DEFAULT_FOLDERS);
  const [activeFolder, setActiveFolder] = useState('all');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // syncContext가 제공되면 실시간 폴더 데이터 사용
  useEffect(() => {
    if (syncContext?.folders && syncContext.folders.length > 0) {
      // Firestore에서 실시간으로 받은 폴더 데이터
      const firestoreFolders = syncContext.folders;

      // 기본 폴더가 없으면 추가
      const hasAllFolder = firestoreFolders.some(f => f.id === 'all');
      const hasSharedFolder = firestoreFolders.some(f => f.id === 'shared');

      let merged = [...firestoreFolders];
      if (!hasAllFolder) {
        merged = [DEFAULT_FOLDERS[0], ...merged];
      }
      if (!hasSharedFolder) {
        merged.splice(1, 0, DEFAULT_FOLDERS[1]);
      }

      setFolders(merged);
      setIsInitialLoad(false);
    } else if (syncContext?.folders) {
      // Firestore가 비어있으면 기본 폴더만 사용
      setFolders(DEFAULT_FOLDERS);
      setIsInitialLoad(false);
    }
  }, [syncContext?.folders]);

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

    // UI 즉시 업데이트 (Optimistic Update)
    setFolders(prev => [...prev, newFolder]);

    // Firestore에 저장 (syncContext가 있을 때만)
    if (syncContext?.syncFolder) {
      syncContext.syncFolder(newFolder);
    }

    return newFolder;
  }, [folders, syncContext]);

  // 폴더 수정
  const updateFolder = useCallback((folderId, updates) => {
    const targetFolder = folders.find(f => f.id === folderId);
    if (!targetFolder || targetFolder.isDefault) {
      console.warn('기본 폴더는 수정할 수 없습니다.');
      return;
    }

    const updatedFolder = { ...targetFolder, ...updates };

    // UI 즉시 업데이트
    setFolders(prev => prev.map(folder =>
      folder.id === folderId ? updatedFolder : folder
    ));

    // Firestore에 저장
    if (syncContext?.syncFolder) {
      syncContext.syncFolder(updatedFolder);
    }
  }, [folders, syncContext]);

  // 폴더 삭제
  const deleteFolder = useCallback((folderId) => {
    const folder = folders.find(f => f.id === folderId);
    if (folder?.isDefault) {
      console.warn('기본 폴더는 삭제할 수 없습니다.');
      return false;
    }

    // UI 즉시 업데이트
    setFolders(prev => prev.filter(f => f.id !== folderId));

    // Firestore에서 삭제
    if (syncContext?.deleteFolder) {
      syncContext.deleteFolder(folderId);
    }

    // 삭제된 폴더가 현재 선택된 폴더면 '전체'로 이동
    if (activeFolder === folderId) {
      setActiveFolder('all');
    }

    return true;
  }, [folders, activeFolder, syncContext]);

  // 폴더 순서 변경
  const reorderFolders = useCallback((startIndex, endIndex) => {
    const reordered = [...folders];
    const [removed] = reordered.splice(startIndex, 1);
    reordered.splice(endIndex, 0, removed);

    // order 필드 업데이트
    const updatedFolders = reordered.map((f, i) => ({ ...f, order: i }));

    // UI 즉시 업데이트
    setFolders(updatedFolders);

    // 변경된 폴더들만 Firestore에 저장
    if (syncContext?.syncFolder) {
      updatedFolders.forEach(folder => {
        // 기본 폴더가 아닌 경우에만 저장
        if (!folder.isDefault) {
          syncContext.syncFolder(folder);
        }
      });
    }
  }, [folders, syncContext]);

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
    maxFolders: MAX_CUSTOM_FOLDERS,
    isInitialLoad
  };
};

export default useMemoFolders;
