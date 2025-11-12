// src/components/TrashPage.jsx

import React, { useState } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTrashContext } from '../contexts/TrashContext';
import ConfirmationModal from './ConfirmationModal';
import Portal from './Portal';

const PageContainer = styled.div`
    padding: 0;
    min-height: 100%;
`;

const Header = styled.div`
    padding: 12px 0 12px 0;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 16px;
`;

const TitleSection = styled.div`
    margin-bottom: 12px;
`;

const Title = styled.h2`
    font-size: 28px;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
`;

const SubTitle = styled.p`
    font-size: 14px;
    color: #999;
    margin: 0;
    font-weight: 400;
`;

const ActionButtonRow = styled.div`
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
`;

const TopActionButton = styled.button`
    flex: 1;
    padding: 10px 16px;
    border-radius: 10px;
    border: 1px solid #e0e0e0;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    background: white;
    color: #666;

    ${props => props.$variant === 'select' && !props.$isAllSelected && `
        &:hover {
            border-color: #667eea;
            color: #667eea;
            background: #f8f9ff;
        }
    `}

    ${props => props.$variant === 'select' && props.$isAllSelected && `
        background: #10b981;
        color: white;
        border-color: #10b981;
        &:hover {
            background: #059669;
            border-color: #059669;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }
    `}

    ${props => props.$variant === 'restore' && !props.$hasSelection && `
        &:hover {
            border-color: #667eea;
            color: #667eea;
            background: #f8f9ff;
        }
    `}

    ${props => props.$variant === 'restore' && props.$hasSelection && `
        background: #667eea;
        color: white;
        border-color: #667eea;
        &:hover {
            background: #5568d3;
            border-color: #5568d3;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }
    `}

    ${props => props.$variant === 'delete' && !props.$hasSelection && `
        &:hover {
            border-color: #f5576c;
            color: #f5576c;
            background: #fff5f7;
        }
    `}

    ${props => props.$variant === 'delete' && props.$hasSelection && `
        background: #f5576c;
        color: white;
        border-color: #f5576c;
        &:hover {
            background: #e04757;
            border-color: #e04757;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(245, 87, 108, 0.3);
        }
    `}

    &:active {
        transform: translateY(0);
    }

    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        transform: none;
        &:hover {
            transform: none;
            box-shadow: none;
        }
    }
`;

const SearchAndFilterSection = styled.div`
    margin-top: 8px;
    margin-bottom: 16px;
`;

const SearchBox = styled.div`
    position: relative;
    margin-bottom: 12px;
`;

const SearchInput = styled.input`
    width: 100%;
    padding: 12px 40px 12px 16px;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    font-size: 14px;
    transition: all 0.2s;
    box-sizing: border-box;

    &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    &::placeholder {
        color: #bbb;
    }
`;

const ClearButton = styled.button`
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    font-size: 18px;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        color: #666;
    }
`;

const FilterRow = styled.div`
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
`;

const FilterButton = styled.button`
    background: ${props => props.$active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white'};
    color: ${props => props.$active ? 'white' : '#666'};
    border: 1px solid ${props => props.$active ? 'transparent' : '#e0e0e0'};
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: ${props => props.$active ? '600' : '500'};
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    &:hover {
        ${props => !props.$active && `
            border-color: #667eea;
            color: #667eea;
            background: #f8f9ff;
        `}
    }
`;

const SortButton = styled.button`
    background: white;
    color: #666;
    border: 1px solid #e0e0e0;
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;

    &:hover {
        border-color: #667eea;
        color: #667eea;
        background: #f8f9ff;
    }
`;

const ResultCount = styled.div`
    font-size: 13px;
    color: #999;
    margin-bottom: 12px;
    font-weight: 500;
`;

// 상세보기 모달 스타일
const DetailModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 30000;
    padding: 20px;
    touch-action: none; /* 모든 터치 제스처 방지 */
    pointer-events: auto; /* 모달 뒤의 모든 요소 비활성화 */
`;

const DetailModalContainer = styled.div`
    background: white;
    border-radius: 20px;
    width: 100%;
    max-width: 600px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    pointer-events: auto; /* 모달 자체는 클릭 가능 */
`;

const DetailModalHeader = styled.div`
    padding: 24px 24px 16px 24px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-shrink: 0;
`;

const DetailModalTitle = styled.div`
    flex: 1;
`;

const DetailTypeLabel = styled.span`
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    background: ${props => {
        switch (props.$type) {
            case 'memo': return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            case 'schedule': return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
            case 'secret': return 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)';
            case 'review': return 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
            default: return '#f5f5f5';
        }
    }};
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    margin-bottom: 8px;
`;

const DetailDeleteInfo = styled.div`
    font-size: 13px;
    color: #999;
    margin-bottom: 4px;
`;

const DetailDaysLeft = styled.div`
    font-size: 12px;
    color: ${props => props.$days <= 7 ? '#f44336' : '#666'};
    font-weight: ${props => props.$days <= 7 ? '600' : '500'};
`;

const CloseIconButton = styled.button`
    background: none;
    border: none;
    font-size: 28px;
    color: #999;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
        background: #f5f5f5;
        color: #666;
    }
`;

const DetailModalContent = styled.div`
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 24px;
    font-size: 15px;
    line-height: 1.8;
    color: #333;
    white-space: pre-wrap;
    word-break: break-word;
    min-height: 0; /* Flexbox에서 스크롤을 위해 필요 */
    -webkit-overflow-scrolling: touch; /* iOS 부드러운 스크롤 */
    overscroll-behavior: contain; /* 모달 밖으로 스크롤 방지 */

    /* 웹킷 스크롤바 스타일링 */
    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
    }

    &::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 10px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: #555;
    }
`;

const DetailModalActions = styled.div`
    padding: 16px 24px;
    border-top: 1px solid #f0f0f0;
    display: flex;
    gap: 12px;
    flex-shrink: 0;
`;

const DetailActionButton = styled.button`
    flex: 1;
    padding: 12px;
    border-radius: 10px;
    border: none;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    ${props => props.$variant === 'restore' && `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);;
        color: white;
        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
    `}

    ${props => props.$variant === 'delete' && `
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);
        }
    `}

    &:active {
        transform: translateY(0);
    }
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 100px 20px;
    
    svg {
        width: 80px;
        height: 80px;
        margin-bottom: 20px;
        opacity: 0.3;
    }
    
    .empty-text {
        font-size: 16px;
        color: #999;
        font-weight: 500;
    }
`;

const TrashList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-bottom: 20px;
`;

const TrashItem = styled.div`
    background: white;
    border: 1px solid ${props => props.$isSelected ? '#667eea' : '#f0f0f0'};
    border-radius: 16px;
    padding: 20px;
    padding-right: 60px; /* 라디오 버튼 공간 확보 */
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    position: relative;
    overflow: hidden;

    ${props => props.$isSelected && `
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
        transform: translateY(-2px);
    `}

    &:hover {
        border-color: ${props => props.$isSelected ? '#667eea' : '#e0e0e0'};
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    }

    &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: ${props => {
            switch (props.$type) {
                case 'memo': return 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)';
                case 'schedule': return 'linear-gradient(180deg, #f093fb 0%, #f5576c 100%)';
                case 'secret': return 'linear-gradient(180deg, #fbc2eb 0%, #a6c1ee 100%)';
                case 'review': return 'linear-gradient(180deg, #a8edea 0%, #fed6e3 100%)';
                default: return '#e0e0e0';
            }
        }};
        opacity: ${props => props.$isSelected ? '1' : '0'};
        transition: opacity 0.2s;
    }
`;

const RadioButton = styled.div`
    position: absolute;
    right: 16px;
    bottom: 16px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid #667eea;
    background: ${props => props.$isSelected ? '#667eea' : 'white'};
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    cursor: pointer;
    z-index: 10;

    &:hover {
        transform: scale(1.1);
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    }

    &::after {
        content: '✓';
        color: white;
        font-size: 16px;
        font-weight: bold;
        opacity: ${props => props.$isSelected ? '1' : '0'};
        transition: opacity 0.2s;
    }
`;

const ItemHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    gap: 12px;
`;

const ItemType = styled.span`
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    background: ${props => {
        switch (props.$type) {
            case 'memo': return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            case 'schedule': return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
            case 'secret': return 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)';
            case 'review': return 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
            default: return '#f5f5f5';
        }
    }};
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    white-space: nowrap;
`;

const DeleteInfo = styled.div`
    font-size: 11px;
    color: #bbb;
    white-space: nowrap;
    font-weight: 500;
`;

const ItemContent = styled.div`
    color: #333;
    font-size: 15px;
    line-height: 1.6;
    margin-bottom: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    font-weight: 400;
`;

const DaysLeft = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: ${props => props.$days <= 7 ? '#f44336' : '#999'};
    font-weight: ${props => props.$days <= 7 ? '600' : '500'};
    padding: 4px 10px;
    background: ${props => props.$days <= 7 ? '#fff0f0' : '#f9f9f9'};
    border-radius: 6px;
    
    &::before {
        content: '⏱';
        font-size: 14px;
    }
`;


const TrashPage = ({ showToast }) => {
    const {
        trashedItems,
        autoDeletePeriod,
        restoreFromTrash,
        permanentDelete
    } = useTrashContext();

    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);

    // 검색/필터/정렬 상태
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all', 'memo', 'schedule', 'secret', 'review'
    const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest'

    // 상세보기 모달 상태
    const [selectedItem, setSelectedItem] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const handleToggleSelect = (id) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleItemClick = (item, event) => {
        // 항상 상세보기 모달 열기 (라디오 버튼은 별도 처리)
        event.stopPropagation();
        setSelectedItem(item);
        setIsDetailModalOpen(true);
    };

    const handleRestoreFromDetail = () => {
        if (!selectedItem) return;

        restoreFromTrash([selectedItem.id]);
        showToast('항목이 복원되었습니다 ✅');
        setIsDetailModalOpen(false);
        setSelectedItem(null);
    };

    const handleDeleteFromDetail = () => {
        if (!selectedItem) return;

        permanentDelete([selectedItem.id]);
        showToast('항목이 영구 삭제되었습니다 🔥');
        setIsDetailModalOpen(false);
        setSelectedItem(null);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === filteredAndSortedItems.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredAndSortedItems.map(item => item.id)));
        }
    };

    const calculateDaysLeft = (deletedAt) => {
        // 오늘 자정
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);

        // 삭제일 자정
        const deletedDate = new Date(deletedAt);
        deletedDate.setHours(0, 0, 0, 0);

        // 날짜 차이 계산 (자정 기준)
        const diffTime = todayMidnight - deletedDate;
        const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        return autoDeletePeriod - daysElapsed;
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'memo': return '메모';
            case 'schedule': return '스케줄';
            case 'secret': return '시크릿';
            case 'review': return '리뷰';
            default: return '항목';
        }
    };

    // 검색/필터/정렬 적용
    const filteredAndSortedItems = React.useMemo(() => {
        let items = [...trashedItems];

        // 1. 타입 필터링
        if (filterType !== 'all') {
            items = items.filter(item => item.type === filterType);
        }

        // 2. 검색어 필터링
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            items = items.filter(item =>
                item.content.toLowerCase().includes(query)
            );
        }

        // 3. 정렬
        items.sort((a, b) => {
            if (sortOrder === 'newest') {
                return b.deletedAt - a.deletedAt; // 최신순
            } else {
                return a.deletedAt - b.deletedAt; // 오래된 순
            }
        });

        return items;
    }, [trashedItems, filterType, searchQuery, sortOrder]);

    if (trashedItems.length === 0) {
        return (
            <PageContainer>
                <Header>
                    <TitleSection>
                        <Title>🗑️ 휴지통</Title>
                        <SubTitle>{autoDeletePeriod}일 후 자동으로 삭제됩니다</SubTitle>
                    </TitleSection>
                </Header>
                <EmptyState>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                    <div className="empty-text">휴지통이 비어있습니다</div>
                </EmptyState>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <Header>
                <TitleSection>
                    <Title>🗑️ 휴지통 ({trashedItems.length})</Title>
                    <SubTitle>{autoDeletePeriod}일 후 자동으로 삭제됩니다</SubTitle>
                </TitleSection>

                <ActionButtonRow>
                    <TopActionButton
                        $variant="select"
                        $isAllSelected={selectedIds.size === filteredAndSortedItems.length && filteredAndSortedItems.length > 0}
                        onClick={handleSelectAll}
                    >
                        {selectedIds.size === filteredAndSortedItems.length && filteredAndSortedItems.length > 0 ? '전체 해제' : '전체 선택'}
                    </TopActionButton>
                    <TopActionButton
                        $variant="restore"
                        $hasSelection={selectedIds.size > 0}
                        onClick={() => {
                            if (selectedIds.size === 0) return;
                            setIsRestoreConfirmOpen(true);
                        }}
                        disabled={selectedIds.size === 0}
                    >
                        복원{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
                    </TopActionButton>
                    <TopActionButton
                        $variant="delete"
                        $hasSelection={selectedIds.size > 0}
                        onClick={() => {
                            if (selectedIds.size === 0) return;
                            setIsDeleteConfirmOpen(true);
                        }}
                        disabled={selectedIds.size === 0}
                    >
                        영구 삭제{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
                    </TopActionButton>
                </ActionButtonRow>
            </Header>

            {/* 검색 및 필터 섹션 */}
            <SearchAndFilterSection>
                <SearchBox>
                    <SearchInput
                        type="text"
                        placeholder="휴지통 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <ClearButton onClick={() => setSearchQuery('')}>
                            ×
                        </ClearButton>
                    )}
                </SearchBox>

                <FilterRow>
                    <FilterButton
                        $active={filterType === 'all'}
                        onClick={() => setFilterType('all')}
                    >
                        전체
                    </FilterButton>
                    <FilterButton
                        $active={filterType === 'memo'}
                        onClick={() => setFilterType('memo')}
                    >
                        메모
                    </FilterButton>
                    <FilterButton
                        $active={filterType === 'schedule'}
                        onClick={() => setFilterType('schedule')}
                    >
                        스케줄
                    </FilterButton>
                    <FilterButton
                        $active={filterType === 'secret'}
                        onClick={() => setFilterType('secret')}
                    >
                        시크릿
                    </FilterButton>
                    <FilterButton
                        $active={filterType === 'review'}
                        onClick={() => setFilterType('review')}
                    >
                        리뷰
                    </FilterButton>

                    <SortButton onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}>
                        {sortOrder === 'newest' ? '↓ 최신순' : '↑ 오래된 순'}
                    </SortButton>
                </FilterRow>
            </SearchAndFilterSection>

            {/* 검색 결과 개수 */}
            {(searchQuery || filterType !== 'all') && (
                <ResultCount>
                    {filteredAndSortedItems.length}개의 항목이 검색되었습니다
                </ResultCount>
            )}

            {filteredAndSortedItems.length === 0 ? (
                <EmptyState>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <div className="empty-text">
                        {searchQuery || filterType !== 'all'
                            ? '검색 결과가 없습니다'
                            : '휴지통이 비어있습니다'}
                    </div>
                </EmptyState>
            ) : (
                <TrashList>
                    {filteredAndSortedItems.map(item => {
                        const daysLeft = calculateDaysLeft(item.deletedAt);
                        const isSelected = selectedIds.has(item.id);
                        return (
                            <TrashItem
                                key={item.id}
                                $isSelected={isSelected}
                                $type={item.type}
                                onClick={(e) => {
                                    // 라디오 버튼 클릭이 아니면 상세보기
                                    if (!e.target.closest('[data-radio]')) {
                                        handleItemClick(item, e);
                                    }
                                }}
                            >
                                <ItemHeader>
                                    <ItemType $type={item.type}>
                                        {getTypeLabel(item.type)}
                                    </ItemType>
                                    <DeleteInfo>
                                        삭제일 - {format(new Date(item.deletedAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
                                    </DeleteInfo>
                                </ItemHeader>
                                <ItemContent>
                                    {item.type === 'secret' ? '*********************' : item.content}
                                </ItemContent>
                                <DaysLeft $days={daysLeft}>
                                    {daysLeft > 0
                                        ? `${daysLeft}일 후 자동 삭제`
                                        : '곧 자동 삭제됨'}
                                </DaysLeft>
                                <RadioButton
                                    data-radio
                                    $isSelected={isSelected}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleSelect(item.id);
                                    }}
                                />
                            </TrashItem>
                        );
                    })}
                </TrashList>
            )}

            {/* 복원 확인 모달 */}
            {isRestoreConfirmOpen && (
                <ConfirmationModal
                    isOpen={true}
                    message={`선택한 ${selectedIds.size}개 항목을 복원하시겠습니까?`}
                    confirmText="복원"
                    onConfirm={() => {
                        const restoredItems = restoreFromTrash(Array.from(selectedIds));
                        showToast(`${restoredItems.length}개 항목이 복원되었습니다 ✅`);
                        setSelectedIds(new Set());
                        setIsRestoreConfirmOpen(false);
                    }}
                    onCancel={() => setIsRestoreConfirmOpen(false)}
                />
            )}

            {/* 영구 삭제 확인 모달 */}
            {isDeleteConfirmOpen && (
                <ConfirmationModal
                    isOpen={true}
                    message={`선택한 ${selectedIds.size}개 항목을 영구적으로 삭제하시겠습니까?`}
                    onConfirm={() => {
                        permanentDelete(Array.from(selectedIds));
                        showToast(`${selectedIds.size}개 항목이 영구 삭제되었습니다 🔥`);
                        setSelectedIds(new Set());
                        setIsDeleteConfirmOpen(false);
                    }}
                    onCancel={() => setIsDeleteConfirmOpen(false)}
                />
            )}

            {/* 상세보기 모달 */}
            {isDetailModalOpen && selectedItem && (
                <Portal>
                    <DetailModalOverlay onClick={() => setIsDetailModalOpen(false)}>
                        <DetailModalContainer onClick={(e) => e.stopPropagation()}>
                            <DetailModalHeader>
                                <DetailModalTitle>
                                    <DetailTypeLabel $type={selectedItem.type}>
                                        {getTypeLabel(selectedItem.type)}
                                    </DetailTypeLabel>
                                    <DetailDeleteInfo>
                                        삭제일: {format(new Date(selectedItem.deletedAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
                                    </DetailDeleteInfo>
                                    <DetailDaysLeft $days={calculateDaysLeft(selectedItem.deletedAt)}>
                                        {calculateDaysLeft(selectedItem.deletedAt) > 0
                                            ? `${calculateDaysLeft(selectedItem.deletedAt)}일 후 자동 삭제`
                                            : '곧 자동 삭제됨'}
                                    </DetailDaysLeft>
                                </DetailModalTitle>
                                <CloseIconButton onClick={() => setIsDetailModalOpen(false)}>
                                    ×
                                </CloseIconButton>
                            </DetailModalHeader>

                            <DetailModalContent>
                                {selectedItem.type === 'secret'
                                    ? '*********************'
                                    : (selectedItem.originalData?.content || selectedItem.content)}
                            </DetailModalContent>

                            <DetailModalActions>
                                <DetailActionButton
                                    $variant="restore"
                                    onClick={handleRestoreFromDetail}
                                >
                                    복원
                                </DetailActionButton>
                                <DetailActionButton
                                    $variant="delete"
                                    onClick={handleDeleteFromDetail}
                                >
                                    영구 삭제
                                </DetailActionButton>
                            </DetailModalActions>
                        </DetailModalContainer>
                    </DetailModalOverlay>
                </Portal>
            )}
        </PageContainer>
    );
};

export default TrashPage;
