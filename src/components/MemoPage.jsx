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
    margin-bottom: 20px;
`;
const SelectionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    position: sticky;
    top: 0;
    z-index: 100;
    background-color: #2a2d35; /* 다크 배경 */
    padding: 10px 20px;
    animation: ${fadeIn} 0.3s ease-out;
    transform: translateY(-5px);
    border-radius: 12px;
`;
const HeaderButton = styled.button`
    background-color: #333842;
    border: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 16px;
    color: #f093fb;
    cursor: pointer;
    font-weight: 600;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:disabled {
        background-color: #2a2d35;
        box-shadow: none;
        color: #606060;
        cursor: not-allowed;
    }

    &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(240, 147, 251, 0.3);
    }
`;
const SelectionCount = styled.span`
    font-size: 20px;
    font-weight: bold;
    color: #f093fb;
    margin-top: 0px; /* 오타 수정 및 정렬을 위해 margin-top 사용 */
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
`;
const DateText = styled.span`
    font-size: 12px;
    color: #b0b0b0;
    margin-top: 8px;
    display: block;
`;
const DeleteButton = styled.button`
    background: none;
    border: none;
    font-size: 20px;
    color: #b0b0b0;
    cursor: pointer;
    margin-left: 10px;
    transition: color 0.2s ease;
    &:hover {
        color: #f5576c;
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
    top: -8px; 
    right: -8px; 
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #ff4d4f;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-size: 14px;
    font-weight: 900;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    opacity: ${props => props.$isImportant ? 1 : 0};
    transition: opacity 0.3s ease;
    z-index: 10; 

    ${props => props.$layoutView === 'grid' && `
        top: -12px; 
        right: 5px;
        left: auto;
        transform: none;
    `}
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
    top: 19px;
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
    onRequestDeleteSelectedMemos
}) => {
    const [layoutView, setLayoutView] = useLocalStorage('memoLayoutView', 'list'); 
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

    let sortedMemos = [];
    if (memos && Array.isArray(memos)) {
        sortedMemos = [...memos].sort((a, b) => {
            const aImportant = a.isImportant ? 1 : 0;
            const bImportant = b.isImportant ? 1 : 0;
            return bImportant - aImportant || (b.date || 0) - (a.date || 0);
        });
    }

    const selectedCount = selectedMemoIds.size;

    return (
        <MemoContainer>
            {isSelectionMode ? (
                <SelectionHeader>
                    <HeaderButton onClick={onExitSelectionMode}>취소</HeaderButton>
                    <SelectionCount>{selectedCount}개 선택됨</SelectionCount>
                    <HeaderButton onClick={onRequestDeleteSelectedMemos} disabled={selectedCount === 0}>
                        삭제
                    </HeaderButton>
                </SelectionHeader>
            ) : (
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
            )}

            <MemoList $layoutView={layoutView}>
                {sortedMemos.length > 0 ? (
                    sortedMemos.map(memo => {
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
                                <ImportantIndicator $isImportant={memo.isImportant} $layoutView={layoutView}>!</ImportantIndicator>
                                <MemoHeader>
                                    <MemoText>
                                        {memo.content || ''}
                                    </MemoText>
                                    <DeleteButton onClick={(e) => handleDeleteClick(e, memo.id)} $isSelectionMode={isSelectionMode}>
                                        &times;
                                    </DeleteButton>
                                </MemoHeader>
                                <DateText>{memo.displayDate || '날짜 없음'}</DateText>
                            </MemoCard>
                        );
                    })
                ) : (
                    <EmptyMessage>작성된 메모가 없습니다.</EmptyMessage>
                )}
            </MemoList>
        </MemoContainer>
    );
};

export default MemoPage;