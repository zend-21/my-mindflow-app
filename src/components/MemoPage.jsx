// src/components/MemoPage.jsx

import React, { useRef, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useMemoFolders } from '../hooks/useMemoFolders';
import { exportData, importData } from '../utils/dataManager';
import Header from './Header';
import { BsCircle } from 'react-icons/bs';
import { Snowflake } from 'lucide-react';
import * as S from './MemoPage.styles';

// Helper Components (using S. prefix)
const GridIcon = () => (
    <S.GridIconContainer>
        <S.GridSquare /><S.GridSquare /><S.GridSquare /><S.GridSquare />
    </S.GridIconContainer>
);

const ListIcon = () => (
    <S.ListIconContainer>
        <S.ListBar /><S.ListBar />
    </S.ListIconContainer>
);

// 아이콘 선택 옵션
const FOLDER_ICONS = [
    '📁', '📂', '🗂️', '📋', '📝', '💼', '🎯', '⭐', '💡', '🔖',
    '📌', '🏷️', '🔒', '🔓', '💎', '🎨', '🎮', '🎵', '🎬', '📷',
    '🏆', '🎓', '💰', '🌟', '🚀', '🔥'
];

const MemoPage = ({
    memos,
    onOpenNewMemo,
    onOpenDetailMemo,
    onDeleteMemoRequest,
    isSelectionMode,
    selectedMemoIds,
    onStartSelectionMode,
    onToggleMemoSelection,
    onExitSelectionMode,
    onToggleSelectedMemosImportance,
    onToggleSelectedMemosStealth,
    onRequestDeleteSelectedMemos,
    onUpdateMemoFolder,
    onUpdateMemoFolderBatch,
    onRequestShareSelectedMemos,
    onRequestUnshareSelectedMemos,
    folderSyncContext,
    onActiveFolderChange // 활성 폴더 변경 콜백 추가
}) => {
    const [layoutView, setLayoutView] = useLocalStorage('memoLayoutView', 'list');
    const [sortOrder, setSortOrder] = React.useState('date'); // 'date' 또는 'importance'
    const [sortDirection, setSortDirection] = React.useState('desc'); // 'asc' 또는 'desc'
    const longPressTimer = useRef(null);
    const PRESS_DURATION = 500;

    // HTML에서 순수 텍스트만 추출하는 함수
    const stripHtmlTags = (html) => {
        if (!html) return '';
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    };

    // 폴더 관련 상태
    const {
        folders,
        customFolders,
        activeFolder,
        setActiveFolder,
        addFolder,
        updateFolder,
        deleteFolder,
        canAddFolder,
        maxFolders
    } = useMemoFolders(folderSyncContext);

    // 공유된 메모 정보 (Map: memoId -> { isPublic: boolean })
    const [sharedMemoInfo, setSharedMemoInfo] = useState(new Map());

    // 폴더 모달 상태
    const [folderModal, setFolderModal] = useState(null); // null | { mode: 'add' | 'edit', folder?: object }
    const [folderName, setFolderName] = useState('');
    const [folderIcon, setFolderIcon] = useState('📁');
    const [folderLocked, setFolderLocked] = useState(false);

    // 폴더 삭제 확인 모달
    const [deleteFolderModal, setDeleteFolderModal] = useState(null); // null | { folder: object }
    const folderLongPressTimer = useRef(null);

    const folderHeaderLongPressTimer = useRef(null);

    // 폴더 선택 모달 (미분류 문서를 폴더로 이동)
    const [showMoveToFolderModal, setShowMoveToFolderModal] = useState(false);

    // 폴더 이동 확인 모달
    const [moveConfirmModal, setMoveConfirmModal] = useState(null); // null | { targetFolder: object, count: number }

    // 미분류로 이동 확인 모달
    const [moveToUncategorizedConfirm, setMoveToUncategorizedConfirm] = useState(null); // null | { count: number }

    // 프리즈 문서 경고 모달
    const [showFrozenWarning, setShowFrozenWarning] = useState(false);

    // 활성 폴더 변경 시 App.jsx로 알림
    useEffect(() => {
        if (onActiveFolderChange) {
            onActiveFolderChange(activeFolder);
        }
    }, [activeFolder, onActiveFolderChange]);

    // 공유 상태 확인 (메모 목록이 변경될 때)
    // ⚠️ 참고용 협업 기능 - 현재 사용 안 함
    useEffect(() => {
        const checkSharedMemos = async () => {
            if (!memos || memos.length === 0) return;

            const sharedInfo = new Map();
            for (const memo of memos) {
                // folderId가 'shared'인 메모는 무조건 공유 메모로 인식
                if (memo.folderId === 'shared') {
                    sharedInfo.set(memo.id, { isPublic: false });
                }
                // 기존 로직: Firestore 협업방 확인 - 비활성화
                // else {
                //     try {
                //         const result = await checkMemoSharedStatus(memo.id);
                //         if (result.isShared && result.room) {
                //             sharedInfo.set(memo.id, { isPublic: result.room.isPublic === true });
                //         }
                //     } catch (e) {
                //         // 에러 무시
                //     }
                // }
            }
            setSharedMemoInfo(sharedInfo);
        };

        checkSharedMemos();
    }, [memos]);

    // 폴더 모달 열기
    const openAddFolderModal = () => {
        if (!canAddFolder) {
            alert(`폴더는 최대 ${maxFolders}개까지만 생성할 수 있습니다.`);
            return;
        }
        setFolderModal({ mode: 'add' });
        setFolderName('');
        setFolderIcon('📁');
    };

    const openEditFolderModal = (folder) => {
        setFolderModal({ mode: 'edit', folder });
        setFolderName(folder.name);
        setFolderIcon(folder.icon);
    };

    // 폴더 저장
    const handleSaveFolder = () => {
        if (!folderName.trim()) return;

        if (folderModal.mode === 'add') {
            addFolder(folderName, folderIcon);
            // 폴더 생성 시 다중 선택 모드 해제
            if (isSelectionMode) {
                onExitSelectionMode();
            }
        } else if (folderModal.mode === 'edit') {
            updateFolder(folderModal.folder.id, { name: folderName, icon: folderIcon, isLocked: folderLocked });
        }
        setFolderModal(null);
    };

    // 폴더 삭제 (수정 모달에서)
    const handleDeleteFolderFromEdit = () => {
        if (folderModal?.folder) {
            deleteFolder(folderModal.folder.id);
            setFolderModal(null);
            // 폴더 삭제 시 다중 선택 모드 해제
            if (isSelectionMode) {
                onExitSelectionMode();
            }
        }
    };

    // 폴더별 메모 수 계산
    const getFolderMemoCount = (folderId) => {
        if (!memos) return 0;
        if (folderId === 'all') return memos.length;
        if (folderId === 'shared') return sharedMemoInfo.size;
        // 공유된 메모는 제외하고 카운트
        return memos.filter(memo => memo.folderId === folderId && !sharedMemoInfo.has(memo.id)).length;
    };

    // 폴더 이름 가져오기
    const getFolderName = (folderId) => {
        const folder = folders.find(f => f.id === folderId);
        return folder ? folder.name : null;
    };

    // 폴더 길게 누르기 핸들러 (삭제 확인 모달 열기)
    const handleFolderLongPress = (folder) => {
        // 기본 폴더(전체, 공유)는 제외
        if (folder.isDefault) return;
        // 폴더 수정 모달 열기
        setFolderModal({ mode: 'edit', folder });
        setFolderName(folder.name);
        setFolderIcon(folder.icon);
        setFolderLocked(folder.isLocked || false);
    };

    // 폴더 삭제 확인
    const handleConfirmDeleteFolder = () => {
        if (!deleteFolderModal?.folder) return;

        const folderId = deleteFolderModal.folder.id;

        // 폴더 내 메모들을 미분류로 이동
        if (memos && onUpdateMemoFolder) {
            memos.forEach(memo => {
                if (memo.folderId === folderId) {
                    onUpdateMemoFolder(memo.id, null); // null = 미분류
                }
            });
        }

        // 폴더 삭제
        deleteFolder(folderId);
        setDeleteFolderModal(null);
        // 폴더 삭제 시 다중 선택 모드 해제
        if (isSelectionMode) {
            onExitSelectionMode();
        }
    };

    // 폴더 헤더 길게 누르기 (폴더 수정 모달 열기)
    const handleFolderHeaderLongPress = (folder) => {
        openEditFolderModal(folder);
    };

    const handleAddMemoClick = () => {
        // 폴더 안에서 메모 작성 시 해당 폴더 ID 전달 (전체 폴더만 미분류로 저장)
        const targetFolderId = activeFolder !== 'all' ? activeFolder : null;
        onOpenNewMemo(targetFolderId);
    };

    // 폴더 선택 모달 열기 (미분류 문서를 폴더로 이동)
    const handleOpenMoveToFolderModal = () => {
        if (selectedCount === 0) return;

        // 선택된 메모 중 프리즈된 문서가 있으면 차단
        if (hasFrozenMemoInSelection()) {
            setShowFrozenWarning(true);
            return;
        }

        setShowMoveToFolderModal(true);
    };

    // 폴더 선택 모달 닫기
    const handleCloseMoveToFolderModal = () => {
        setShowMoveToFolderModal(false);
    };

    // 폴더 선택 시 확인 모달 열기 (폴더 선택 모달은 닫지 않음)
    const handleSelectFolder = (folder) => {
        setMoveConfirmModal({
            targetFolder: folder,
            count: selectedCount
        });
    };

    // 폴더 이동 확인 취소 (폴더 선택 모달로 되돌아가기)
    const handleCancelMoveConfirm = () => {
        setMoveConfirmModal(null);
    };

    // 폴더 이동 확인
    const handleConfirmMoveToFolder = () => {
        if (!moveConfirmModal || !onUpdateMemoFolderBatch) return;

        const selectedMemoIdsArray = Array.from(selectedMemoIds);
        const targetFolderId = moveConfirmModal.targetFolder.id === 'shared'
            ? null
            : moveConfirmModal.targetFolder.id;

        // 공유 폴더를 선택한 경우
        if (moveConfirmModal.targetFolder.id === 'shared') {
            // 공유 폴더로 이동 시 기존 공유 로직 사용
            handleRequestShareSelectedMemos();
        } else {
            // 사용자 정의 폴더로 이동
            onUpdateMemoFolderBatch(selectedMemoIdsArray, targetFolderId);
        }

        // 이동 완료 후 두 모달 모두 닫기
        setMoveConfirmModal(null);
        setShowMoveToFolderModal(false);
    };

    // 미분류로 이동 확인 모달 열기
    const handleRequestMoveToUncategorized = () => {
        if (selectedCount === 0) return;

        // 선택된 메모 중 프리즈된 문서가 있으면 차단
        if (hasFrozenMemoInSelection()) {
            setShowFrozenWarning(true);
            return;
        }

        setMoveToUncategorizedConfirm({ count: selectedCount });
    };

    // 미분류로 이동 실행
    const handleConfirmMoveToUncategorized = () => {
        if (!moveToUncategorizedConfirm || !onUpdateMemoFolderBatch) return;

        const selectedMemoIdsArray = Array.from(selectedMemoIds);
        onUpdateMemoFolderBatch(selectedMemoIdsArray, null);

        setMoveToUncategorizedConfirm(null);
    };

    const handleTouchStart = (e, memoId) => {
        longPressTimer.current = setTimeout(() => {
            onStartSelectionMode(memoId);
        }, PRESS_DURATION);
    };

    const handleTouchEnd = () => {
        clearTimeout(longPressTimer.current);
    };

    const handleMemoCardInteraction = (e, memo) => {
        e.stopPropagation();
        
        if (isSelectionMode) {
            // 이미 선택 모드인 경우, 토글만 수행
            onToggleMemoSelection(memo.id);
        } else {
            // 선택 모드가 아닌 경우, 상세 보기로 이동
            onOpenDetailMemo(memo, {
                activeFolder,
                sortOrder,
                sortDirection,
                sharedMemoInfo
            });
        }
        // 클릭 이벤트 후 longPressTimer를 항상 초기화
        clearTimeout(longPressTimer.current);
    };
    
    const handleMouseUp = (e, memo) => {
        clearTimeout(longPressTimer.current);
    };
    
    const handleMouseDown = (e, memoId) => {
        longPressTimer.current = setTimeout(() => {
            onStartSelectionMode(memoId);
        }, PRESS_DURATION);
    };
    
    // 선택된 메모 중 프리즈된 문서 확인
    const hasFrozenMemoInSelection = () => {
        const selectedMemos = memos.filter(memo => selectedMemoIds.has(memo.id));
        return selectedMemos.some(memo => memo.hasPendingEdits === true);
    };

    // 선택된 메모 삭제 요청 (프리즈 체크 포함)
    const handleRequestDeleteSelectedMemos = () => {
        if (hasFrozenMemoInSelection()) {
            setShowFrozenWarning(true);
            return;
        }
        onRequestDeleteSelectedMemos();
    };

    // 선택된 메모 공유 요청 (프리즈 체크 포함)
    const handleRequestShareSelectedMemos = () => {
        if (hasFrozenMemoInSelection()) {
            setShowFrozenWarning(true);
            return;
        }
        onRequestShareSelectedMemos();
    };

    // 선택된 메모 공유 해제 요청 (프리즈 체크 포함)
    const handleRequestUnshareSelectedMemos = () => {
        if (hasFrozenMemoInSelection()) {
            setShowFrozenWarning(true);
            return;
        }
        if (onRequestUnshareSelectedMemos) {
            onRequestUnshareSelectedMemos();
        }
    };

    const handleDeleteClick = (e, id) => {
        e.stopPropagation();

        // 프리즈된 문서이고 공유 폴더에 있는 경우 차단
        const memo = memos.find(m => m.id === id);
        const isInSharedFolder = activeFolder === 'shared' || memo?.folderId === 'shared';

        if (memo?.hasPendingEdits && isInSharedFolder) {
            setShowFrozenWarning(true);
            return;
        }

        onDeleteMemoRequest(id);
    };

    const handleSortToggle = (type) => {
        if (sortOrder === type) {
            // 같은 정렬 기준이면 방향만 토글
            setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
        } else {
            // 다른 정렬 기준이면 해당 기준으로 변경하고 내림차순으로 설정
            setSortOrder(type);
            setSortDirection('desc');
        }
    };

    // 검색 및 정렬 로직
    let filteredAndSortedMemos = [];
    if (memos && Array.isArray(memos)) {
        // 폴더 필터링
        filteredAndSortedMemos = memos.filter(memo => {
            // "전체"일 때는 폴더에 속하지 않은 미분류 메모만 표시 (공유된 메모 제외)
            if (activeFolder === 'all') return !memo.folderId && !sharedMemoInfo.has(memo.id);
            // "공유"일 때는 folderId가 'shared'이거나 sharedMemoInfo에 있는 메모 표시
            if (activeFolder === 'shared') return memo.folderId === 'shared' || sharedMemoInfo.has(memo.id);
            // 다른 커스텀 폴더일 때는 해당 폴더 ID와 일치하고 공유되지 않은 메모만 표시
            return memo.folderId === activeFolder && !sharedMemoInfo.has(memo.id);
        });

        // 3. 정렬
        filteredAndSortedMemos = [...filteredAndSortedMemos].sort((a, b) => {
            if (sortOrder === 'importance') {
                // 중요 문서가 하나라도 있는지 확인
                const hasImportantMemo = filteredAndSortedMemos.some(memo => memo.isImportant);

                // 중요 문서가 없으면 정렬하지 않음 (현재 순서 유지)
                if (!hasImportantMemo) {
                    return 0;
                }

                // 중요도순 정렬
                const aImportant = a.isImportant ? 1 : 0;
                const bImportant = b.isImportant ? 1 : 0;

                if (sortDirection === 'desc') {
                    return bImportant - aImportant || (b.date || 0) - (a.date || 0);
                } else {
                    return aImportant - bImportant || (a.date || 0) - (b.date || 0);
                }
            } else if (sortOrder === 'updated') {
                // 수정순 정렬 (updatedAt이 없으면 createdAt 사용)
                const aUpdated = a.updatedAt || a.createdAt || a.date || 0;
                const bUpdated = b.updatedAt || b.createdAt || b.date || 0;

                if (sortDirection === 'desc') {
                    return bUpdated - aUpdated;
                } else {
                    return aUpdated - bUpdated;
                }
            } else {
                // 등록순 정렬
                if (sortDirection === 'desc') {
                    return (b.date || 0) - (a.date || 0);
                } else {
                    return (a.date || 0) - (b.date || 0);
                }
            }
        });
    }

    const selectedCount = selectedMemoIds.size;

    return (
        <S.MemoContainer>
            {isSelectionMode ? (
                <>
                    <S.SelectionModeBar>
                        <S.SelectionInfo>
                            {selectedCount}개 선택됨
                        </S.SelectionInfo>
                        <S.SelectionButtonsContainer>
                            <S.SelectionButton onClick={() => {
                                // 전체선택/해제 로직: SecretPage와 동일
                                const allFilteredIds = filteredAndSortedMemos.map(memo => memo.id);
                                const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedMemoIds.has(id));

                                if (allSelected) {
                                    // 모두 선택된 상태면 전체 해제
                                    allFilteredIds.forEach(id => {
                                        if (selectedMemoIds.has(id)) {
                                            onToggleMemoSelection(id);
                                        }
                                    });
                                } else {
                                    // 일부만 선택되었거나 아무것도 선택 안 된 경우 전체 선택
                                    allFilteredIds.forEach(id => {
                                        if (!selectedMemoIds.has(id)) {
                                            onToggleMemoSelection(id);
                                        }
                                    });
                                }
                            }}>
                                {filteredAndSortedMemos.length > 0 && filteredAndSortedMemos.every(memo => selectedMemoIds.has(memo.id))
                                    ? '전체해제'
                                    : '전체선택'}
                            </S.SelectionButton>
                            <S.SelectionButton onClick={onExitSelectionMode}>
                                취소
                            </S.SelectionButton>
                        </S.SelectionButtonsContainer>
                    </S.SelectionModeBar>

                    <S.ActionButtonsBar>
                        {/* 공유 폴더 내부일 때 */}
                        {activeFolder === 'shared' ? (
                            <>
                                <S.ActionButton
                                    $type="stealth"
                                    onClick={handleRequestUnshareSelectedMemos}
                                    disabled={selectedCount === 0}
                                >
                                    공유 해제
                                </S.ActionButton>
                                <S.ActionButton
                                    $type="importance"
                                    onClick={onToggleSelectedMemosImportance}
                                    disabled={selectedCount === 0}
                                >
                                    {(() => {
                                        if (selectedCount === 0) return '중요도 지정/해제';
                                        const selectedMemos = memos.filter(memo => selectedMemoIds.has(memo.id));
                                        const allImportant = selectedMemos.every(memo => memo.isImportant);
                                        return allImportant ? '중요도 해제' : '중요도 지정';
                                    })()}
                                </S.ActionButton>
                                <S.ActionButton
                                    $type="delete"
                                    onClick={handleRequestDeleteSelectedMemos}
                                    disabled={selectedCount === 0}
                                >
                                    삭제
                                </S.ActionButton>
                            </>
                        ) : (
                            /* 메인페이지 또는 일반 폴더 */
                            <>
                                {/* <S.ActionButton
                                    $type="stealth"
                                    onClick={onToggleSelectedMemosStealth}
                                    disabled={selectedCount === 0}
                                >
                                    {(() => {
                                        if (selectedCount === 0) return '스텔스 설정/해제';
                                        const selectedMemos = memos.filter(memo => selectedMemoIds.has(memo.id));
                                        const allStealth = selectedMemos.every(memo => memo.isStealth);
                                        return allStealth ? '스텔스 해제' : '스텔스 설정';
                                    })()}
                                </S.ActionButton> */}
                                {/* 사용자 정의 폴더 내부일 때는 '미분류로 이동', 메인페이지일 때는 '폴더로 이동' */}
                                {activeFolder !== 'all' && activeFolder !== 'shared' ? (
                                    <S.ActionButton
                                        $type="share"
                                        onClick={handleRequestMoveToUncategorized}
                                        disabled={selectedCount === 0}
                                    >
                                        미분류로 이동
                                    </S.ActionButton>
                                ) : (
                                    <S.ActionButton
                                        $type="share"
                                        onClick={handleOpenMoveToFolderModal}
                                        disabled={selectedCount === 0}
                                    >
                                        폴더로 이동
                                    </S.ActionButton>
                                )}
                                <S.ActionButton
                                    $type="importance"
                                    onClick={onToggleSelectedMemosImportance}
                                    disabled={selectedCount === 0}
                                >
                                    {(() => {
                                        if (selectedCount === 0) return '중요도 지정/해제';
                                        const selectedMemos = memos.filter(memo => selectedMemoIds.has(memo.id));
                                        const allImportant = selectedMemos.every(memo => memo.isImportant);
                                        return allImportant ? '중요도 해제' : '중요도 지정';
                                    })()}
                                </S.ActionButton>
                                <S.ActionButton
                                    $type="delete"
                                    onClick={handleRequestDeleteSelectedMemos}
                                    disabled={selectedCount === 0}
                                >
                                    삭제
                                </S.ActionButton>
                            </>
                        )}
                    </S.ActionButtonsBar>
                </>
            ) : (
                <>
                    <S.SectionHeader>
                        <S.LeftHeaderGroup>
                            <S.SectionTitleWrapper>
                                <S.SectionTitle>📝  메모장 <S.MemoCount>({memos?.length || 0})</S.MemoCount></S.SectionTitle>
                            </S.SectionTitleWrapper>
                            <S.AddMemoButton onClick={handleAddMemoClick}>+</S.AddMemoButton>
                        </S.LeftHeaderGroup>

                        <S.HeaderButtonWrapper>
                            <S.LayoutButtonSet>
                                <S.LayoutToggleButton $isActive={layoutView === 'list'} onClick={() => setLayoutView('list')}>
                                    <ListIcon />
                                </S.LayoutToggleButton>
                                <S.LayoutToggleButton $isActive={layoutView === 'grid'} onClick={() => setLayoutView('grid')}>
                                    <GridIcon />
                                </S.LayoutToggleButton>
                            </S.LayoutButtonSet>
                        </S.HeaderButtonWrapper>
                    </S.SectionHeader>

                    {/* 공유 폴더 내부일 때 폴더 정보 */}
                    {activeFolder === 'shared' && (
                        <S.CurrentFolderHeader>
                            <S.CurrentFolderInfo>
                                <S.CurrentFolderIcon style={{ display: 'flex', alignItems: 'center', color: '#00ff88' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5C21 3.34 19.66 2 18 2C16.34 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.35C15.11 18.56 15.08 18.78 15.08 19C15.08 20.61 16.39 21.92 18 21.92C19.61 21.92 20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z" fill="currentColor"/>
                                    </svg>
                                </S.CurrentFolderIcon>
                                <S.CurrentFolderName>공유 폴더 ({sharedMemoInfo.size})</S.CurrentFolderName>
                            </S.CurrentFolderInfo>
                            <S.FolderExitButton onClick={() => setActiveFolder('all')}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M13 17L14.4 15.6L11.8 13H22V11H11.8L14.4 8.4L13 7L8 12L13 17ZM4 5H13V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H13V19H4V5Z" fill="currentColor"/>
                                </svg>
                                폴더 나가기
                            </S.FolderExitButton>
                        </S.CurrentFolderHeader>
                    )}

                    {/* 사용자 폴더 내부일 때 폴더 정보 */}
                    {activeFolder !== 'all' && activeFolder !== 'shared' && (() => {
                        const currentFolder = customFolders.find(f => f.id === activeFolder);
                        if (!currentFolder) return null;
                        const folderMemoCount = getFolderMemoCount(currentFolder.id);
                        return (
                            <S.CurrentFolderHeader>
                                <S.CurrentFolderInfo
                                    onTouchStart={() => {
                                        folderHeaderLongPressTimer.current = setTimeout(() => {
                                            handleFolderHeaderLongPress(currentFolder);
                                        }, PRESS_DURATION);
                                    }}
                                    onTouchEnd={() => clearTimeout(folderHeaderLongPressTimer.current)}
                                    onTouchMove={() => clearTimeout(folderHeaderLongPressTimer.current)}
                                    onMouseDown={() => {
                                        folderHeaderLongPressTimer.current = setTimeout(() => {
                                            handleFolderHeaderLongPress(currentFolder);
                                        }, PRESS_DURATION);
                                    }}
                                    onMouseUp={() => clearTimeout(folderHeaderLongPressTimer.current)}
                                    onMouseLeave={() => clearTimeout(folderHeaderLongPressTimer.current)}
                                    style={{ cursor: 'pointer' }}
                                    title="길게 눌러서 폴더 수정"
                                >
                                    <S.CurrentFolderIcon>{currentFolder.icon}</S.CurrentFolderIcon>
                                    <S.CurrentFolderName>{currentFolder.name} ({folderMemoCount})</S.CurrentFolderName>
                                </S.CurrentFolderInfo>
                                <S.FolderExitButton onClick={() => setActiveFolder('all')}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M13 17L14.4 15.6 L11.8 13H22V11H11.8L14.4 8.4L13 7L8 12L13 17ZM4 5H13V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H13V19H4V5Z" fill="currentColor"/>
                                    </svg>
                                    폴더 나가기
                                </S.FolderExitButton>
                            </S.CurrentFolderHeader>
                        );
                    })()}

                    {/* 공유 폴더일 때 정렬 버튼과 안내문 */}
                    {activeFolder === 'shared' && (
                        <div style={{ marginTop: '15px' }}>
                            <S.SortBar>
                                <S.SortButton
                                    $active={sortOrder === 'date'}
                                    onClick={() => handleSortToggle('date')}
                                >
                                    등록일순 {sortOrder === 'date' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
                                </S.SortButton>
                                <S.SortButton
                                    $active={sortOrder === 'updated'}
                                    onClick={() => handleSortToggle('updated')}
                                >
                                    수정일순 {sortOrder === 'updated' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
                                </S.SortButton>
                                <S.SortButton
                                    $active={sortOrder === 'importance'}
                                    onClick={() => handleSortToggle('importance')}
                                >
                                    중요도순 {sortOrder === 'importance' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
                                </S.SortButton>
                            </S.SortBar>

                            <S.GuidanceMessage style={{ marginTop: '15px' }}>
                                하단의 목록창을 길게 누르면 다중 선택 모드가 활성화 됩니다.
                            </S.GuidanceMessage>
                        </div>
                    )}

                    {/* 사용자 정의 폴더일 때 정렬 버튼, 안내문 */}
                    {activeFolder !== 'all' && activeFolder !== 'shared' && (() => {
                        const currentFolder = customFolders.find(f => f.id === activeFolder);
                        if (!currentFolder) return null;
                        return (
                            <div style={{ marginTop: '15px' }}>
                                <S.SortBar>
                                    <S.SortButton
                                        $active={sortOrder === 'date'}
                                        onClick={() => handleSortToggle('date')}
                                    >
                                        등록일순 {sortOrder === 'date' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
                                    </S.SortButton>
                                    <S.SortButton
                                        $active={sortOrder === 'updated'}
                                        onClick={() => handleSortToggle('updated')}
                                    >
                                        수정일순 {sortOrder === 'updated' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
                                    </S.SortButton>
                                    <S.SortButton
                                        $active={sortOrder === 'importance'}
                                        onClick={() => handleSortToggle('importance')}
                                    >
                                        중요도순 {sortOrder === 'importance' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
                                    </S.SortButton>
                                </S.SortBar>

                                <S.GuidanceMessage style={{ marginTop: '15px' }}>
                                    하단의 목록창을 길게 누르면 다중 선택 모드가 활성화 됩니다.
                                </S.GuidanceMessage>

                                <div style={{
                                    width: '100%',
                                    height: '1px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    marginTop: '15px',
                                    marginBottom: '10px'
                                }} />
                            </div>
                        );
                    })()}
                </>
            )}

            <S.MemoList>
                {/* 전체 보기일 때만 폴더 표시 */}
                {activeFolder === 'all' && (
                    <>
                        <S.FolderGridContainer>
                            {/* 공유 폴더 - 항상 맨 앞에 표시 (형광 그린 스타일) */}
                            <S.FolderCard
                                $isShared
                                onClick={() => {
                                    if (isSelectionMode) {
                                        onExitSelectionMode();
                                    }
                                    setActiveFolder('shared');
                                }}
                                title="공유된 메모 보기"
                            >
                                <S.SharedFolderIcon>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5C21 3.34 19.66 2 18 2C16.34 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.35C15.11 18.56 15.08 18.78 15.08 19C15.08 20.61 16.39 21.92 18 21.92C19.61 21.92 20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z" fill="currentColor"/>
                                    </svg>
                                </S.SharedFolderIcon>
                                <S.FolderName>공유 폴더</S.FolderName>
                                {sharedMemoInfo.size > 0 ? (
                                    <S.FolderMemoCount>{sharedMemoInfo.size}개 문서</S.FolderMemoCount>
                                ) : (
                                    <S.FolderEmptyBadge>비어있음</S.FolderEmptyBadge>
                                )}
                            </S.FolderCard>

                            {/* 사용자 정의 폴더들 */}
                            {customFolders.map(folder => {
                                const folderMemoCount = getFolderMemoCount(folder.id);
                                return (
                                    <S.FolderCard
                                        key={folder.id}
                                        onClick={() => {
                                            if (isSelectionMode) {
                                                onExitSelectionMode();
                                            }
                                            setActiveFolder(folder.id);
                                        }}
                                        onTouchStart={() => {
                                            folderLongPressTimer.current = setTimeout(() => {
                                                handleFolderLongPress(folder);
                                            }, PRESS_DURATION);
                                        }}
                                        onTouchEnd={() => clearTimeout(folderLongPressTimer.current)}
                                        onTouchMove={() => clearTimeout(folderLongPressTimer.current)}
                                        onMouseDown={() => {
                                            folderLongPressTimer.current = setTimeout(() => {
                                                handleFolderLongPress(folder);
                                            }, PRESS_DURATION);
                                        }}
                                        onMouseUp={() => clearTimeout(folderLongPressTimer.current)}
                                        onMouseLeave={() => clearTimeout(folderLongPressTimer.current)}
                                        title="길게 눌러서 이름 변경"
                                    >
                                        {!folder.isLocked && (
                                            <S.FolderDeleteButton
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteFolderModal({ folder });
                                                }}
                                                title="폴더 삭제"
                                            >
                                                ×
                                            </S.FolderDeleteButton>
                                        )}
                                        <S.FolderIconWrapper>{folder.icon}</S.FolderIconWrapper>
                                        <S.FolderName>{folder.name}</S.FolderName>
                                        {folderMemoCount > 0 ? (
                                            <S.FolderMemoCount>{folderMemoCount}개 문서</S.FolderMemoCount>
                                        ) : (
                                            <S.FolderEmptyBadge>비어있음</S.FolderEmptyBadge>
                                        )}
                                    </S.FolderCard>
                                );
                            })}

                            {/* 새 폴더 만들기 카드 */}
                            <S.AddFolderCard
                                onClick={canAddFolder ? openAddFolderModal : undefined}
                                $disabled={!canAddFolder}
                                title={canAddFolder ? '새 폴더 만들기' : `폴더는 최대 ${maxFolders}개까지 생성 가능`}
                            >
                                <S.AddFolderIcon>+</S.AddFolderIcon>
                                <S.AddFolderText>
                                    {canAddFolder ? '새 폴더' : `${maxFolders}/${maxFolders}`}
                                </S.AddFolderText>
                            </S.AddFolderCard>
                        </S.FolderGridContainer>

                        {/* 구분선 - 미분류 문서가 있을 때만 표시 */}
                        {filteredAndSortedMemos.length > 0 && (
                            <>
                                <S.SectionDivider>미분류 문서</S.SectionDivider>

                                {/* 정렬 버튼 */}
                                <S.SortBar>
                                    <S.SortButton
                                        $active={sortOrder === 'date'}
                                        onClick={() => handleSortToggle('date')}
                                    >
                                        등록일순 {sortOrder === 'date' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
                                    </S.SortButton>
                                    <S.SortButton
                                        $active={sortOrder === 'updated'}
                                        onClick={() => handleSortToggle('updated')}
                                    >
                                        수정일순 {sortOrder === 'updated' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
                                    </S.SortButton>
                                    <S.SortButton
                                        $active={sortOrder === 'importance'}
                                        onClick={() => handleSortToggle('importance')}
                                    >
                                        중요도순 {sortOrder === 'importance' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
                                    </S.SortButton>
                                </S.SortBar>

                                {/* 안내 메시지 */}
                                <S.GuidanceMessage>
                                    하단의 목록창을 길게 누르면 다중 선택 모드가 활성화 됩니다.
                                </S.GuidanceMessage>
                            </>
                        )}
                    </>
                )}

                {/* 일반 메모들만 레이아웃 전환 적용 */}
                <S.MemoGridWrapper $layoutView={layoutView}>
                    {filteredAndSortedMemos.length > 0 ? (
                        filteredAndSortedMemos.map(memo => {
                        if (!memo || !memo.id) {
                            return null;
                        }
                        // createdAt이 24시간 이내인 경우만 NEW 뱃지 표시
                        const isNew = memo.createdAt && (Date.now() - memo.createdAt) < (24 * 60 * 60 * 1000);
                        const isSelected = selectedMemoIds.has(memo.id);
                        
                        return (
                            <S.MemoCard
                                key={memo.id}
                                onClick={(e) => {
                                    e.stopPropagation();

                                    // 프리즈된 문서이고 공유 폴더에 있는 경우
                                    const isInSharedFolder = activeFolder === 'shared' || memo.folderId === 'shared';
                                    const isMemoFrozen = memo.hasPendingEdits === true;

                                    if (isMemoFrozen && isInSharedFolder && !isSelectionMode) {
                                        // 프리즈 경고 모달 표시
                                        setShowFrozenWarning(true);
                                        return;
                                    }

                                    if(isSelectionMode) {
                                        onToggleMemoSelection(memo.id);
                                    } else {
                                        onOpenDetailMemo(memo, {
                                            activeFolder,
                                            sortOrder,
                                            sortDirection,
                                            sharedMemoInfo
                                        });
                                    }
                                }}
                                onTouchStart={(e) => {
                                    longPressTimer.current = setTimeout(() => {
                                        onStartSelectionMode(memo.id);
                                    }, PRESS_DURATION);
                                }}
                                onTouchEnd={() => {
                                    clearTimeout(longPressTimer.current);
                                }}
                                onTouchMove={() => {
                                    clearTimeout(longPressTimer.current);
                                }}
                                onMouseDown={(e) => {
                                    longPressTimer.current = setTimeout(() => {
                                        onStartSelectionMode(memo.id);
                                    }, PRESS_DURATION);
                                }}
                                onMouseUp={() => {
                                    clearTimeout(longPressTimer.current);
                                }}
                                onMouseLeave={() => clearTimeout(longPressTimer.current)}
                                $isImportant={memo.isImportant}
                                $isSelectionMode={isSelectionMode}
                                $isSelected={isSelected}
                                $layoutView={layoutView}
                            >
                                <S.CheckboxContainer $isVisible={isSelectionMode} $isSelected={isSelected}>
                                    {isSelected ? <S.StyledCheckIcon /> : <BsCircle />}
                                </S.CheckboxContainer>

                                {/* 뱃지 컨테이너: NEW → 중요도 → 스텔스 → 공유 → 프리즈 순서로 자동 정렬 */}
                                <S.BadgeContainer>
                                    {isNew && <S.NewBadge>NEW</S.NewBadge>}
                                    {memo.isImportant && (
                                        <S.ImportantIndicator>
                                            <S.StarIcon>★</S.StarIcon>
                                        </S.ImportantIndicator>
                                    )}
                                    {memo.isStealth && (
                                        <S.StealthBadge>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                {/* 고스트 몸통 */}
                                                <path d="M12 2C7.58 2 4 5.58 4 10V18C4 18.55 4.45 19 5 19C5.55 19 6 18.55 6 18V17C6 16.45 6.45 16 7 16C7.55 16 8 16.45 8 17V18.5C8 19.05 8.45 19.5 9 19.5C9.55 19.5 10 19.05 10 18.5V17C10 16.45 10.45 16 11 16C11.55 16 12 16.45 12 17V18.5C12 19.05 12.45 19.5 13 19.5C13.55 19.5 14 19.05 14 18.5V17C14 16.45 14.45 16 15 16C15.55 16 16 16.45 16 17V18.5C16 19.05 16.45 19.5 17 19.5C17.55 19.5 18 19.05 18 18.5V17C18 16.45 18.45 16 19 16C19.55 16 20 16.45 20 17V18C20 18.55 19.55 19 19 19C18.45 19 18 18.55 18 18V10C18 5.58 14.42 2 12 2Z"
                                                      fill="#60a5fa"
                                                      opacity="0.9"/>
                                                {/* 눈 */}
                                                <circle cx="9" cy="9" r="1.5" fill="#1a1d24"/>
                                                <circle cx="15" cy="9" r="1.5" fill="#1a1d24"/>
                                            </svg>
                                        </S.StealthBadge>
                                    )}
                                    {/* 공유 뱃지: 공개(형광 그린), 비공개(형광 레드) */}
                                    {sharedMemoInfo.has(memo.id) && (
                                        <S.ShareBadge
                                            $isPublic={sharedMemoInfo.get(memo.id)?.isPublic}
                                            title={sharedMemoInfo.get(memo.id)?.isPublic ? '공개 공유 중' : '비공개 공유 중'}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5C21 3.34 19.66 2 18 2C16.34 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.35C15.11 18.56 15.08 18.78 15.08 19C15.08 20.61 16.39 21.92 18 21.92C19.61 21.92 20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z" fill="currentColor"/>
                                            </svg>
                                        </S.ShareBadge>
                                    )}
                                    {/* 프리즈 뱃지: 대화방에서 편집 중인 문서 */}
                                    {memo.hasPendingEdits && (activeFolder === 'shared' || memo.folderId === 'shared') && (
                                        <S.FrozenBadge title="대화방에서 편집 중">
                                            <Snowflake size={14} />
                                        </S.FrozenBadge>
                                    )}
                                </S.BadgeContainer>
                                <S.MemoHeader $layoutView={layoutView}>
                                    <S.MemoText
                                        $layoutView={layoutView}
                                        {...(layoutView === 'grid' && !memo.isStealth
                                            ? { dangerouslySetInnerHTML: { __html: memo.content || '' } }
                                            : {}
                                        )}
                                    >
                                        {layoutView === 'list' || memo.isStealth
                                            ? (memo.isStealth ? (memo.stealthPhrase || '비공개 메모') : stripHtmlTags(memo.content || ''))
                                            : null
                                        }
                                    </S.MemoText>
                                    <S.DeleteButton onClick={(e) => handleDeleteClick(e, memo.id)} $isSelectionMode={isSelectionMode}>
                                        &times;
                                    </S.DeleteButton>
                                </S.MemoHeader>
                                <S.DateText $layoutView={layoutView}>
                                    {memo.updatedAt && memo.createdAt && memo.updatedAt !== memo.createdAt ? (
                                        <>수정일: {new Date(memo.updatedAt).toLocaleString('ko-KR', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                            hour12: false
                                        }).replace(/\. /g, '. ').replace(/\.$/, '')}</>
                                    ) : (
                                        <>등록일: {new Date(memo.createdAt || memo.date).toLocaleString('ko-KR', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                            hour12: false
                                        }).replace(/\. /g, '. ').replace(/\.$/, '')}</>
                                    )}
                                </S.DateText>
                            </S.MemoCard>
                        );
                    })
                ) : (
                    <S.EmptyMessage>
                        작성된 문서가 없습니다.
                    </S.EmptyMessage>
                )}
                </S.MemoGridWrapper>
            </S.MemoList>

            {/* 폴더 추가/수정 모달 */}
            {folderModal && ReactDOM.createPortal(
                <S.FolderModalOverlay onClick={() => setFolderModal(null)}>
                    <S.FolderModalBox onClick={(e) => e.stopPropagation()}>
                        <S.FolderModalTitleRow>
                            <S.FolderModalTitle>
                                {folderModal.mode === 'add' ? '새 폴더 만들기' : '폴더 수정'}
                            </S.FolderModalTitle>
                            {folderModal.mode === 'edit' && (
                                <S.FolderLockToggleContainer>
                                    <S.FolderLockToggle
                                        $locked={folderLocked}
                                        onClick={() => setFolderLocked(!folderLocked)}
                                        title={folderLocked ? '폴더 잠금 해제' : '폴더 잠금'}
                                    >
                                        <S.FolderLockToggleSlider $locked={folderLocked}>
                                            {folderLocked ? (
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" fill="currentColor"/>
                                                </svg>
                                            ) : (
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h2c0-1.66 1.34-3 3-3s3 1.34 3 3v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" fill="currentColor"/>
                                                </svg>
                                            )}
                                        </S.FolderLockToggleSlider>
                                    </S.FolderLockToggle>
                                </S.FolderLockToggleContainer>
                            )}
                        </S.FolderModalTitleRow>

                        <FolderInput
                            type="text"
                            placeholder="폴더 이름을 입력하세요 (최대 8자)"
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            autoFocus
                            maxLength={8}
                        />

                        <S.IconPickerContainer>
                            {FOLDER_ICONS.map(icon => (
                                <S.IconOption
                                    key={icon}
                                    $selected={folderIcon === icon}
                                    onClick={() => setFolderIcon(icon)}
                                >
                                    {icon}
                                </S.IconOption>
                            ))}
                        </S.IconPickerContainer>

                        <S.FolderModalButtons>
                            <S.FolderModalButton $variant="cancel" onClick={() => setFolderModal(null)}>
                                취소
                            </S.FolderModalButton>
                            <S.FolderModalButton
                                $variant="confirm"
                                onClick={handleSaveFolder}
                                disabled={!folderName.trim()}
                            >
                                {folderModal.mode === 'add' ? '생성' : '저장'}
                            </S.FolderModalButton>
                        </S.FolderModalButtons>
                    </S.FolderModalBox>
                </S.FolderModalOverlay>,
                document.getElementById('modal-root')
            )}

            {/* 폴더 삭제 확인 모달 */}
            {deleteFolderModal && ReactDOM.createPortal(
                <S.FolderModalOverlay onClick={() => setDeleteFolderModal(null)}>
                    <S.FolderModalBox onClick={(e) => e.stopPropagation()}>
                        <S.FolderModalTitle>
                            폴더 삭제
                        </S.FolderModalTitle>

                        <div style={{ color: '#e0e0e0', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                            <p style={{ margin: '0 0 12px 0' }}>
                                <strong>'{deleteFolderModal.folder.name}'</strong> 폴더를 삭제하시겠습니까?
                            </p>
                            <p style={{ margin: '0', color: '#4a90e2', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                <span style={{ flexShrink: 0 }}>ℹ️</span>
                                <span>폴더 내부의 문서들은 삭제되지 않고 미분류 문서로 이동됩니다.</span>
                            </p>
                        </div>

                        <S.FolderModalButtons>
                            <S.FolderModalButton $variant="cancel" onClick={() => setDeleteFolderModal(null)}>
                                취소
                            </S.FolderModalButton>
                            <S.FolderModalButton $variant="delete" onClick={handleConfirmDeleteFolder}>
                                폴더 삭제
                            </S.FolderModalButton>
                        </S.FolderModalButtons>
                    </S.FolderModalBox>
                </S.FolderModalOverlay>,
                document.getElementById('modal-root')
            )}

            {/* 폴더 선택 모달 (미분류 문서를 폴더로 이동) */}
            {showMoveToFolderModal && ReactDOM.createPortal(
                <S.FolderSelectModalOverlay onClick={handleCloseMoveToFolderModal}>
                    <S.FolderSelectModalBox onClick={(e) => e.stopPropagation()}>
                        <S.FolderSelectTitle>폴더 선택</S.FolderSelectTitle>
                        <S.FolderOptionsContainer>
                            {/* 공유 폴더 옵션 */}
                            <S.FolderOptionButton onClick={() => handleSelectFolder({ id: 'shared', name: '공유 폴더' })}>
                                <S.FolderOptionIcon>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5C21 3.34 19.66 2 18 2C16.34 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.35C15.11 18.56 15.08 18.78 15.08 19C15.08 20.61 16.39 21.92 18 21.92C19.61 21.92 20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z" fill="currentColor"/>
                                    </svg>
                                </S.FolderOptionIcon>
                                <S.FolderOptionName>공유 폴더</S.FolderOptionName>
                            </S.FolderOptionButton>

                            {/* 사용자 정의 폴더 옵션들 */}
                            {customFolders.map(folder => (
                                <S.FolderOptionButton key={folder.id} onClick={() => handleSelectFolder(folder)}>
                                    <S.FolderOptionIcon>{folder.icon}</S.FolderOptionIcon>
                                    <S.FolderOptionName>{folder.name}</S.FolderOptionName>
                                </S.FolderOptionButton>
                            ))}
                        </S.FolderOptionsContainer>
                        <S.FolderModalButtons style={{ marginTop: '20px' }}>
                            <S.FolderModalButton $variant="cancel" onClick={handleCloseMoveToFolderModal}>
                                취소
                            </S.FolderModalButton>
                        </S.FolderModalButtons>
                    </S.FolderSelectModalBox>
                </S.FolderSelectModalOverlay>,
                document.getElementById('modal-root')
            )}

            {/* 폴더 이동 확인 모달 */}
            {moveConfirmModal && ReactDOM.createPortal(
                <S.FolderModalOverlay onClick={handleCancelMoveConfirm} style={{ zIndex: 10002 }}>
                    <S.FolderModalBox onClick={(e) => e.stopPropagation()}>
                        <S.FolderModalTitle>문서 이동</S.FolderModalTitle>

                        <div style={{ color: '#e0e0e0', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                            <p style={{ margin: '0' }}>
                                {moveConfirmModal.count}개의 문서를 "{moveConfirmModal.targetFolder.name}" 폴더로 이동하시겠습니까?
                            </p>
                        </div>

                        <S.FolderModalButtons>
                            <S.FolderModalButton $variant="cancel" onClick={handleCancelMoveConfirm}>
                                취소
                            </S.FolderModalButton>
                            <S.FolderModalButton $variant="confirm" onClick={handleConfirmMoveToFolder}>
                                이동
                            </S.FolderModalButton>
                        </S.FolderModalButtons>
                    </S.FolderModalBox>
                </S.FolderModalOverlay>,
                document.getElementById('modal-root')
            )}

            {/* 미분류로 이동 확인 모달 */}
            {moveToUncategorizedConfirm && ReactDOM.createPortal(
                <S.FolderModalOverlay onClick={() => setMoveToUncategorizedConfirm(null)}>
                    <S.FolderModalBox onClick={(e) => e.stopPropagation()}>
                        <S.FolderModalTitle>미분류로 이동</S.FolderModalTitle>

                        <div style={{ color: '#e0e0e0', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                            <p style={{ margin: '0' }}>
                                {moveToUncategorizedConfirm.count}개의 문서를 미분류 문서로 이동할까요?
                            </p>
                        </div>

                        <S.FolderModalButtons>
                            <S.FolderModalButton $variant="cancel" onClick={() => setMoveToUncategorizedConfirm(null)}>
                                취소
                            </S.FolderModalButton>
                            <S.FolderModalButton $variant="confirm" onClick={handleConfirmMoveToUncategorized}>
                                이동
                            </S.FolderModalButton>
                        </S.FolderModalButtons>
                    </S.FolderModalBox>
                </S.FolderModalOverlay>,
                document.getElementById('modal-root')
            )}

            {/* 프리즈된 문서 경고 모달 */}
            {showFrozenWarning && ReactDOM.createPortal(
                <S.FrozenWarningOverlay onClick={() => setShowFrozenWarning(false)}>
                    <S.FrozenWarningContent onClick={(e) => e.stopPropagation()}>
                        <S.FrozenWarningHeader>
                            <Snowflake size={24} color="#4a90e2" />
                            <div>편집 중인 문서</div>
                        </S.FrozenWarningHeader>
                        <S.FrozenWarningBody>
                            이 문서는 대화방에서 편집 작업이 진행 중입니다.
                        </S.FrozenWarningBody>
                        <S.FrozenWarningInfo>
                            편집, 이동, 삭제 작업은 대화방에서 편집이 완료된 후 가능합니다.
                        </S.FrozenWarningInfo>
                        <S.FrozenWarningButton onClick={() => setShowFrozenWarning(false)}>
                            확인
                        </S.FrozenWarningButton>
                    </S.FrozenWarningContent>
                </S.FrozenWarningOverlay>,
                document.getElementById('modal-root')
            )}
        </S.MemoContainer>
    );
};

export default MemoPage;