// 메모 폴더 관리 커스텀 훅
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'memoFolders';

// 기본 폴더 (삭제 불가)
const DEFAULT_FOLDERS = [
  { id: 'all', name: '전체', icon: '📋', isDefault: true, order: 0 },
  { id: 'shared', name: '공유', icon: '🔗', isDefault: true, order: 1, isAutoTag: true }
];

export const useMemoFolders = () => {
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState('all');

  // 초기 로드
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 기본 폴더가 없으면 추가
        const hasAllFolder = parsed.some(f => f.id === 'all');
        const hasSharedFolder = parsed.some(f => f.id === 'shared');

        let merged = [...parsed];
        if (!hasAllFolder) {
          merged = [DEFAULT_FOLDERS[0], ...merged];
        }
        if (!hasSharedFolder) {
          merged.splice(1, 0, DEFAULT_FOLDERS[1]);
        }

        setFolders(merged);
      } catch (e) {
        console.error('폴더 데이터 파싱 오류:', e);
        setFolders(DEFAULT_FOLDERS);
      }
    } else {
      setFolders(DEFAULT_FOLDERS);
    }
  }, []);

  // 저장
  useEffect(() => {
    if (folders.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
    }
  }, [folders]);

  // 폴더 추가
  const addFolder = useCallback((name, icon = '📁') => {
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
  }, [folders.length]);

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

  return {
    folders,
    customFolders,
    activeFolder,
    setActiveFolder,
    addFolder,
    updateFolder,
    deleteFolder,
    reorderFolders
  };
};

export default useMemoFolders;
