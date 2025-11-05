// src/components/TrashPage.jsx

import React, { useState } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTrashContext } from '../contexts/TrashContext';
import ConfirmationModal from './ConfirmationModal';

const PageContainer = styled.div`
    padding: 0;
    min-height: 100%;
`;

const Header = styled.div`
    padding: 24px 0 20px 0;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
`;

const TitleSection = styled.div`
    flex: 1;
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

const SelectAllButton = styled.button`
    background: transparent;
    border: 1px solid #e0e0e0;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #666;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
        border-color: #667eea;
        color: #667eea;
        background: #f8f9ff;
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
`;

const TrashItem = styled.div`
    background: white;
    border: 1px solid ${props => props.$isSelected ? '#667eea' : '#f0f0f0'};
    border-radius: 16px;
    padding: 20px;
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

const ActionBar = styled.div`
    position: sticky;
    bottom: 80px;
    background: white;
    padding: 16px;
    border-top: 1px solid #f0f0f0;
    display: flex;
    gap: 12px;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
    margin: 0 -24px;
    padding-left: 24px;
    padding-right: 24px;
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.95);
`;

const ActionButton = styled.button`
    flex: 1;
    padding: 14px;
    border-radius: 12px;
    border: none;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    ${props => props.$variant === 'restore' && `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
        }
        &:active {
            transform: translateY(0);
        }
    `}

    ${props => props.$variant === 'delete' && `
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(245, 87, 108, 0.4);
        }
        &:active {
            transform: translateY(0);
        }
    `}

    ${props => props.$variant === 'empty' && `
        background: linear-gradient(135deg, #868f96 0%, #596164 100%);
        color: white;
        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }
        &:active {
            transform: translateY(0);
        }
    `}

    &:disabled {
        background: #e0e0e0;
        color: #999;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }
`;

const TrashPage = ({ showToast }) => {
    const {
        trashedItems,
        autoDeletePeriod,
        restoreFromTrash,
        permanentDelete,
        emptyTrash
    } = useTrashContext();

    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isEmptyConfirmOpen, setIsEmptyConfirmOpen] = useState(false);

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

    const handleSelectAll = () => {
        if (selectedIds.size === trashedItems.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(trashedItems.map(item => item.id)));
        }
    };

    const calculateDaysLeft = (deletedAt) => {
        const now = Date.now();
        const elapsed = now - deletedAt;
        const daysElapsed = Math.floor(elapsed / (1000 * 60 * 60 * 24));
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
                <SelectAllButton onClick={handleSelectAll}>
                    {selectedIds.size === trashedItems.length ? '전체 해제' : '전체 선택'}
                </SelectAllButton>
            </Header>

            <TrashList>
                {trashedItems.map(item => {
                    const daysLeft = calculateDaysLeft(item.deletedAt);
                    return (
                        <TrashItem
                            key={item.id}
                            $isSelected={selectedIds.has(item.id)}
                            $type={item.type}
                            onClick={() => handleToggleSelect(item.id)}
                        >
                            <ItemHeader>
                                <ItemType $type={item.type}>
                                    {getTypeLabel(item.type)}
                                </ItemType>
                                <DeleteInfo>
                                    {format(new Date(item.deletedAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
                                </DeleteInfo>
                            </ItemHeader>
                            <ItemContent>{item.content}</ItemContent>
                            <DaysLeft $days={daysLeft}>
                                {daysLeft > 0 
                                    ? `${daysLeft}일 후 자동 삭제` 
                                    : '곧 자동 삭제됨'}
                            </DaysLeft>
                        </TrashItem>
                    );
                })}
            </TrashList>

            {selectedIds.size > 0 && (
                <ActionBar>
                    <ActionButton
                        $variant="restore"
                        onClick={() => {
                            const restoredItems = restoreFromTrash(Array.from(selectedIds));
                            showToast(`${restoredItems.length}개 항목이 복원되었습니다 ✅`);
                            setSelectedIds(new Set());
                        }}
                    >
                        복원 ({selectedIds.size})
                    </ActionButton>
                    <ActionButton
                        $variant="delete"
                        onClick={() => setIsDeleteConfirmOpen(true)}
                    >
                        영구 삭제 ({selectedIds.size})
                    </ActionButton>
                </ActionBar>
            )}

            {selectedIds.size === 0 && trashedItems.length > 0 && (
                <ActionBar>
                    <ActionButton
                        $variant="empty"
                        onClick={() => setIsEmptyConfirmOpen(true)}
                    >
                        휴지통 비우기
                    </ActionButton>
                </ActionBar>
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

            {/* 휴지통 비우기 확인 모달 */}
            {isEmptyConfirmOpen && (
                <ConfirmationModal
                    isOpen={true}
                    message={
                        <>
                            휴지통을 비우시겠습니까?
                            <br />
                            모든 항목이 영구적으로 삭제됩니다.
                        </>
                    }
                    onConfirm={() => {
                        const count = trashedItems.length;
                        emptyTrash();
                        showToast(`휴지통이 비워졌습니다 (${count}개 삭제) 🧹`);
                        setIsEmptyConfirmOpen(false);
                    }}
                    onCancel={() => setIsEmptyConfirmOpen(false)}
                />
            )}
        </PageContainer>
    );
};

export default TrashPage;
