// src/components/MemoPage.jsx

import React, { useRef } from 'react';
import styled, { keyframes, css } from 'styled-components'; 
import { useLocalStorage } from '../hooks/useLocalStorage';
import { exportData, importData } from '../utils/dataManager';
import Header from './Header';
import { BsCheckCircleFill, BsCircle } from 'react-icons/bs';

// 애니메이션 keyframes
const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const slideUp = keyframes`
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
`;

// --- (스타일 정의) ---
const NewBadge = styled.span`
    position: absolute;
    top: -8px;
    left: -8px;
    background-color: #5ebe26ff;
    color: white;
    font-size: 10px;
    font-weight: bold;
    padding: 4px 8px;
    border-radius: 12px;
    z-index: 10;
`;
const MemoContainer = styled.div`
    padding: 0px 0px;
`;
const SectionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
`;

const SelectionModeBar = styled.div`
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    padding: 12px 24px;
    margin-bottom: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(240, 147, 251, 0.3);
    display: flex;
    align-items: center;
    gap: 12px;
`;

const SelectionInfo = styled.div`
    color: white;
    font-size: 15px;
    font-weight: 600;
    flex-shrink: 0;
    white-space: nowrap;
`;

const SelectionButtonsContainer = styled.div`
    flex: 1;
    display: flex;
    gap: 8px;
    justify-content: flex-end;
`;

const SelectionButton = styled.button`
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    &:hover {
        background: rgba(255, 255, 255, 0.3);
        border-color: rgba(255, 255, 255, 0.5);
    }

    &:active {
        transform: scale(0.95);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const ActionButtonsBar = styled.div`
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
`;

const ActionButton = styled.button`
    background: ${props => {
        switch(props.$type) {
            case 'delete': return 'rgba(255, 107, 107, 0.1)';
            case 'importance': return 'rgba(255, 193, 7, 0.1)';
            default: return 'rgba(255, 255, 255, 0.05)';
        }
    }};
    border: 1px solid ${props => {
        switch(props.$type) {
            case 'delete': return 'rgba(255, 107, 107, 0.3)';
            case 'importance': return 'rgba(255, 193, 7, 0.3)';
            default: return 'rgba(255, 255, 255, 0.15)';
        }
    }};
    color: ${props => {
        switch(props.$type) {
            case 'delete': return '#ff6b6b';
            case 'importance': return '#ffc107';
            default: return '#e0e0e0';
        }
    }};
    padding: 10px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    flex: 1;
    white-space: nowrap;

    &:hover {
        background: ${props => {
            switch(props.$type) {
                case 'delete': return 'rgba(255, 107, 107, 0.2)';
                case 'importance': return 'rgba(255, 193, 7, 0.2)';
                default: return 'rgba(255, 255, 255, 0.08)';
            }
        }};
        border-color: ${props => {
            switch(props.$type) {
                case 'delete': return 'rgba(255, 107, 107, 0.5)';
                case 'importance': return 'rgba(255, 193, 7, 0.5)';
                default: return 'rgba(255, 255, 255, 0.25)';
            }
        }};
    }

    &:active {
        transform: scale(0.98);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const SearchBar = styled.div`
    margin-bottom: 16px;
    width: 100%;
    position: relative;
`;

const SearchInput = styled.input`
    width: 100%;
    padding: 12px 16px;
    padding-right: ${props => props.$hasValue ? '40px' : '16px'};
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
    font-size: 14px;
    transition: all 0.2s;
    box-sizing: border-box;

    &:focus {
        outline: none;
        border-color: rgba(74, 144, 226, 0.5);
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
    }

    &::placeholder {
        color: #808080;
    }
`;

const ClearSearchButton = styled.button`
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    color: #b0b0b0;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    padding: 0;

    &:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #ffffff;
    }

    &:active {
        transform: translateY(-50%) scale(0.95);
    }
`;

const SortBar = styled.div`
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    width: 100%;
`;

const SortButton = styled.button`
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid ${props => props.$active ? 'rgba(74, 144, 226, 0.5)' : 'rgba(255, 255, 255, 0.15)'};
    background: ${props => props.$active ? 'rgba(74, 144, 226, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
    color: ${props => props.$active ? '#4a90e2' : '#b0b0b0'};
    font-size: 13px;
    font-weight: ${props => props.$active ? '600' : '500'};
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;

    &:hover {
        background: ${props => props.$active ? 'rgba(74, 144, 226, 0.25)' : 'rgba(255, 255, 255, 0.08)'};
        border-color: ${props => props.$active ? 'rgba(74, 144, 226, 0.6)' : 'rgba(255, 255, 255, 0.25)'};
    }
`;

const GuidanceMessage = styled.div`
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(74, 144, 226, 0.3);
    padding: 10px 16px;
    text-align: center;
    margin-bottom: 16px;
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 12px;
    font-weight: 300;
`;
const SectionTitleWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
`;
const SectionTitle = styled.h2`
    font-size: 24px;
    font-weight: 500;
    color: #e0e0e0;
    margin: 0;
`;
const MemoCount = styled.span`
    font-size: 18px;
    font-weight: normal;
`;
const HeaderButtonWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 15px;
`;
const LayoutButtonSet = styled.div`
    display: flex;
    gap: 5px; 
`;
const LayoutToggleButton = styled.button`
    background-color: transparent;
    border: 1px solid ${props => props.$isActive ? '#4a90e2' : '#e2e8f0'}; 
    font-size: 18px;
    cursor: pointer;
    color: ${props => props.$isActive ? '#4a90e2' : '#a0aec0'}; 
    border-radius: 8px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
    
    &:hover {
        background-color: #f7fafc;
        color: #000;
        border-color: #a0aec0; 
    }
`;
const AddMemoButton = styled.button`
    background-color: transparent;
    border: none;
    font-size: 28px;
    cursor: pointer;
    color: #4a90e2;
    transition: transform 0.2s ease;
    &:hover {
        transform: rotate(90deg);
    }
    width: 40px;
    height: 40px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
`;
const GridIconContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 3px;
    width: 15px;
    height: 15px;
`;
const GridSquare = styled.span`
    background-color: currentColor;
    border-radius: 2px;
`;
const GridIcon = () => (
    <GridIconContainer>
        <GridSquare /><GridSquare /><GridSquare /><GridSquare />
    </GridIconContainer>
);
const ListIconContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 15px;
    height: 15px;
    justify-content: center;
`;
const ListBar = styled.span`
    background-color: currentColor;
    height: 5px;
    width: 100%;
    border-radius: 2px;
`;
const ListIcon = () => (
    <ListIconContainer>
        <ListBar /><ListBar />
    </ListIconContainer>
);
const MemoCard = styled.div`
    background: ${props => props.$isImportant
        ? 'linear-gradient(135deg, rgba(245, 87, 108, 0.15), rgba(240, 147, 251, 0.15))'
        : 'linear-gradient(135deg, #2a2d35, #333842)'};
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    position: relative;
    border: 2px solid ${props => props.$isSelected ? '#f093fb' : 'rgba(255, 255, 255, 0.05)'};

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 6px 16px rgba(240, 147, 251, 0.2);
    }

    ${props => props.$isSelectionMode && `
        &:hover {
            transform: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
    `}
`;
const MemoHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
`;
const MemoText = styled.p`
    font-size: 16px;
    color: #e0e0e0;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    padding-right: 2px;
`;
const DateText = styled.span`
    font-size: 12px;
    color: #b0b0b0;
    margin-top: 8px;
    display: block;
`;
const DeleteButton = styled.button`
    position: absolute;
    top: 9px;
    right: 8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #4a4a4a;
    border: none;
    font-size: 18px;
    color: #ffffff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
    z-index: 5;

    &:hover {
        background: #f5576c;
        color: #ffffff;
        transform: scale(1.1);
    }

    ${props => props.$isSelectionMode && `
        display: none;
    `}
`;
const ToastOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 6000; 
  background: rgba(0, 0, 0, 0.2); 
  animation: ${fadeIn} 0.2s ease-out;
`;
const ToastBox = styled.div`
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 16px 24px;
  border-radius: 8px;
  font-size: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  animation: ${slideUp} 0.3s cubic-bezier(0.2, 0, 0, 1);
`;
const ImportantIndicator = styled.span`
    position: absolute;
    top: -10px;
    left: ${props => props.$hasNew ? '40px' : '-8px'}; /* NEW가 있으면 오른쪽으로, 없으면 NEW 자리에 */
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: #ff4444;
    color: white;
    font-size: 14px;
    font-weight: bold;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
    opacity: ${props => props.$isImportant ? 1 : 0};
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;
const EmptyMessage = styled.p`
    color: #b0b0b0;
    text-align: center;
    font-size: 16px;
    padding: 40px 20px;
`;

const MemoList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px; 
    width: 100%;
    margin-top: 35px;

    & ${MemoText} {
        white-space: nowrap; 
        overflow: hidden;
        text-overflow: ellipsis;
        flex-grow: 1; 
    }

    /* ★★★ 반응형 그리드 레이아웃 수정 ★★★ */
    ${props => props.$layoutView === 'grid' && `
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;

        & ${MemoCard} {
            height: 160px;
            display: flex;
            flex-direction: column;
            justify-content: space-between; 
            padding-top: 20px;
        }

        & ${MemoHeader} {
             flex-grow: 1; 
             overflow: hidden; 
        }

        & ${MemoText} {
            white-space: pre-wrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 6; 
            -webkit-box-orient: vertical;
            word-break: break-word;
            flex-grow: 0;
        }
        
         & ${DateText} {
             flex-shrink: 0; 
             margin-top: 8px; 
         }
    `}

    /* ★★★ 태블릿 및 데스크탑용 미디어 쿼리 추가 ★★★ */
    @media (min-width: 768px) {
        ${props => props.$layoutView === 'grid' && `
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
        `}
    }

    @media (min-width: 1024px) {
        ${props => props.$layoutView === 'grid' && `
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
        `}
    }

    @media (min-width: 1440px) {
        ${props => props.$layoutView === 'grid' && `
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
        `}
    }
`;

const LeftHeaderGroup = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
`;
const CheckboxContainer = styled.div`
    position: absolute;
    top: 14px;
    right: 10px;
    font-size: 24px;
    color: ${props => props.$isSelected ? '#4a90e2' : '#a0aec0'};
    background: #fff;
    border-radius: 50%;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;

    ${props => !props.$isVisible && `
        display: none;
    `}
`;
const StyledCheckIcon = styled(BsCheckCircleFill)`
    transform: translateY(0px);
`;
// --- (모든 스타일 끝) ---

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
    onRequestDeleteSelectedMemos
}) => {
    const [layoutView, setLayoutView] = useLocalStorage('memoLayoutView', 'list');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [sortOrder, setSortOrder] = React.useState('date'); // 'date' 또는 'importance'
    const [sortDirection, setSortDirection] = React.useState('desc'); // 'asc' 또는 'desc'
    const longPressTimer = useRef(null);
    const PRESS_DURATION = 500;

    const handleAddMemoClick = () => {
        onOpenNewMemo();
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
            onOpenDetailMemo(memo);
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
    
    const handleDeleteClick = (e, id) => {
        e.stopPropagation();
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
        // 1. 검색 필터링
        filteredAndSortedMemos = memos.filter(memo => {
            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase();
            return memo.content?.toLowerCase().includes(query);
        });

        // 2. 정렬
        filteredAndSortedMemos = [...filteredAndSortedMemos].sort((a, b) => {
            if (sortOrder === 'importance') {
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
        <MemoContainer>
            {isSelectionMode ? (
                <>
                    <SelectionModeBar>
                        <SelectionInfo>
                            {selectedCount}개 선택됨
                        </SelectionInfo>
                        <SelectionButtonsContainer>
                            <SelectionButton onClick={() => {
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
                            </SelectionButton>
                            <SelectionButton onClick={onExitSelectionMode}>
                                취소
                            </SelectionButton>
                        </SelectionButtonsContainer>
                    </SelectionModeBar>

                    <ActionButtonsBar>
                        <ActionButton
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
                        </ActionButton>
                        <ActionButton
                            $type="delete"
                            onClick={onRequestDeleteSelectedMemos}
                            disabled={selectedCount === 0}
                        >
                            삭제
                        </ActionButton>
                    </ActionButtonsBar>
                </>
            ) : (
                <>
                    <SectionHeader>
                        <LeftHeaderGroup>
                            <SectionTitleWrapper>
                                <SectionTitle>📝  메모장 <MemoCount>({memos?.length || 0})</MemoCount></SectionTitle>
                            </SectionTitleWrapper>
                            <AddMemoButton onClick={handleAddMemoClick}>+</AddMemoButton>
                        </LeftHeaderGroup>

                        <HeaderButtonWrapper>
                            <LayoutButtonSet>
                                <LayoutToggleButton $isActive={layoutView === 'list'} onClick={() => setLayoutView('list')}>
                                    <ListIcon />
                                </LayoutToggleButton>
                                <LayoutToggleButton $isActive={layoutView === 'grid'} onClick={() => setLayoutView('grid')}>
                                    <GridIcon />
                                </LayoutToggleButton>
                            </LayoutButtonSet>
                        </HeaderButtonWrapper>
                    </SectionHeader>

                    <SearchBar>
                        <SearchInput
                            type="text"
                            placeholder="메모 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            $hasValue={searchQuery.length > 0}
                        />
                        {searchQuery && (
                            <ClearSearchButton
                                onClick={() => setSearchQuery('')}
                                title="검색어 지우기"
                            >
                                ×
                            </ClearSearchButton>
                        )}
                    </SearchBar>

                    <SortBar>
                        <SortButton
                            $active={sortOrder === 'date'}
                            onClick={() => handleSortToggle('date')}
                        >
                            등록일순 {sortOrder === 'date' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
                        </SortButton>
                        <SortButton
                            $active={sortOrder === 'updated'}
                            onClick={() => handleSortToggle('updated')}
                        >
                            수정일순 {sortOrder === 'updated' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
                        </SortButton>
                        <SortButton
                            $active={sortOrder === 'importance'}
                            onClick={() => handleSortToggle('importance')}
                        >
                            중요도순 {sortOrder === 'importance' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
                        </SortButton>
                    </SortBar>

                    <GuidanceMessage>
                        하단의 목록창을 길게 누르면 다중 선택 모드가 활성화 됩니다.
                    </GuidanceMessage>
                </>
            )}

            <MemoList $layoutView={layoutView}>
                {filteredAndSortedMemos.length > 0 ? (
                    filteredAndSortedMemos.map(memo => {
                        if (!memo || !memo.id) {
                            return null;
                        }
                        const isNew = (Date.now() - memo.date) < (5 * 60 * 60 * 1000);
                        const isSelected = selectedMemoIds.has(memo.id);
                        
                        return (
                            <MemoCard 
                                key={memo.id} 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if(isSelectionMode) {
                                        onToggleMemoSelection(memo.id);
                                    } else {
                                        onOpenDetailMemo(memo);
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
                            >
                                <CheckboxContainer $isVisible={isSelectionMode} $isSelected={isSelected}>
                                    {isSelected ? <StyledCheckIcon /> : <BsCircle />}
                                </CheckboxContainer>
                                {isNew && <NewBadge>NEW</NewBadge>}
                                <ImportantIndicator $isImportant={memo.isImportant} $hasNew={isNew}>★</ImportantIndicator>
                                <MemoHeader>
                                    <MemoText>
                                        {memo.content || ''}
                                    </MemoText>
                                    <DeleteButton onClick={(e) => handleDeleteClick(e, memo.id)} $isSelectionMode={isSelectionMode}>
                                        &times;
                                    </DeleteButton>
                                </MemoHeader>
                                <DateText>
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
                                </DateText>
                            </MemoCard>
                        );
                    })
                ) : (
                    <EmptyMessage>
                        {searchQuery ? '검색 결과가 없습니다.' : '작성된 메모가 없습니다.'}
                    </EmptyMessage>
                )}
            </MemoList>
        </MemoContainer>
    );
};

export default MemoPage;