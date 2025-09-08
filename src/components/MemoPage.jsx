// src/components/MemoPage.jsx

import React, { useState } from 'react';
import styled from 'styled-components';
import ConfirmationModal from './ConfirmationModal';
import MemoDetailModal from './MemoDetailModal';
import NewMemoModal from './NewMemoModal';
import SideMenu from './SideMenu';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { exportData, importData } from '../utils/dataManager';

// NEW 배지 스타일 추가
const NewBadge = styled.span`
    position: absolute;
    top: -8px;
    left: -8px;
    background-color: #ff4d4f;
    color: white;
    font-size: 10px;
    font-weight: bold;
    padding: 4px 8px;
    border-radius: 12px;
    z-index: 10;
`;

const MemoContainer = styled.div`
    padding: 24px;
`;

const SectionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
`;

const SectionTitle = styled.h2`
    font-size: 24px;
    font-weight: 500;
    color: #2d3748;
    margin: 0;
`;

const MemoCount = styled.span`
    font-size: 18px;
    font-weight: normal;
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
`;

const ViewToggle = styled.div`
    display: flex;
    gap: 8px;
`;

const ViewButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    opacity: ${({ $isActive }) => ($isActive ? 1 : 0.5)};
    transition: opacity 0.2s ease-in-out;
    padding: 0;
    display: flex;
    align-items: center;

    &:hover {
        opacity: 0.8;
    }
`;

const MemoList = styled.div`
    display: ${({ $isGridLayout }) => ($isGridLayout ? 'grid' : 'flex')};
    flex-direction: ${({ $isGridLayout }) => ($isGridLayout ? 'row' : 'column')};
    flex-wrap: wrap;
    gap: 16px;
    width: 100%;

    ${({ $isGridLayout }) => $isGridLayout && `
        grid-template-columns: repeat(2, 1fr);
    `}
`;

const MemoCard = styled.div`
    background: ${({ $isImportant }) => ($isImportant ? 'rgba(255, 230, 230, 0.9)' : '#fff8e1')};
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    position: relative;
    
    ${({ $isGridLayout }) => $isGridLayout && `
        height: 150px; 
    `}
    
    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    }
`;

const MemoHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
`;

const MemoText = styled.p`
    font-size: 16px;
    color: #4a5568;
    margin: 0;
    white-space: nowrap; 
    overflow: hidden;
    text-overflow: ellipsis;
    flex-grow: 1;
`;

const DateText = styled.span`
    font-size: 12px;
    color: #a0aec0;
    margin-top: 8px;
    display: block;
`;

const DeleteButton = styled.button`
    background: none;
    border: none;
    font-size: 20px;
    color: #a0aec0;
    cursor: pointer;
    margin-left: 10px;
    transition: color 0.2s ease;
    &:hover {
        color: #e53e3e;
    }
`;

// === 이 부분 수정: isImportant prop을 $isImportant로 변경 ===
const ImportantIndicator = styled.span`
    position: absolute;
    top: -8px;
    right: -8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #e53e3e;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-size: 14px;
    font-weight: 900;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2); 
    opacity: ${props => props.$isImportant ? 1 : 0};
    transition: opacity 0.3s ease;
`;
// === 수정 끝 ===

const MemoPage = ({ memos, onSaveNewMemo, onEditMemo, onDeleteMemo, addActivity }) => {
    const [isNewMemoModalOpen, setIsNewMemoModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedMemo, setSelectedMemo] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [memoToDelete, setMemoToDelete] = useState(null);
    const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
    const [isGridLayout, setIsGridLayout] = useState(true);

    const handleAddMemoClick = () => {
        setIsNewMemoModalOpen(true);
    };

    const handleMemoCardClick = (memo) => {
        setSelectedMemo(memo);
        setIsDetailModalOpen(true);
    };

    const handleDetailSave = (id, newContent, isImportant) => {
        onEditMemo(id, newContent, isImportant);
        setIsDetailModalOpen(false);
    };
    
    const handleDeleteClick = (e, id) => {
        e.stopPropagation();
        setMemoToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        onDeleteMemo(memoToDelete);
        setIsDeleteModalOpen(false);
        setMemoToDelete(null);
    };

    const handleDeleteCancel = () => {
        setIsDeleteModalOpen(false);
        setMemoToDelete(null);
    };

    const handleExport = () => {
        exportData(memos);
        addActivity('백업', '전체 메모 백업');
    };

    const handleImport = async () => {
        const imported = await importData();
        if (imported) {
            alert('데이터가 성공적으로 복원되었습니다.');
            addActivity('복원', '전체 메모 복원');
            window.location.reload();
        }
    };
    
    const sortedMemos = [...memos].sort((a, b) => b.isImportant - a.isImportant || b.date - a.date);

    return (
        <MemoContainer>
            <SectionHeader>
                <SectionTitle>📝  메모장 <MemoCount>({memos.length})</MemoCount></SectionTitle>
                <ViewToggle>
                    <ViewButton $isActive={!isGridLayout} onClick={() => setIsGridLayout(false)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2d3748" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </ViewButton>
                    <ViewButton $isActive={isGridLayout} onClick={() => setIsGridLayout(true)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2d3748" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                        </svg>
                    </ViewButton>
                </ViewToggle>
                <AddMemoButton onClick={() => setIsNewMemoModalOpen(true)}>+</AddMemoButton>
            </SectionHeader>

            <MemoList $isGridLayout={isGridLayout}>
                {memos.length > 0 ? (
                    sortedMemos.map(memo => {
                        const isNew = (Date.now() - memo.date) < (5 * 60 * 60 * 1000);
                        return (
                            <MemoCard 
                                key={memo.id} 
                                onClick={() => handleMemoCardClick(memo)} 
                                $isImportant={memo.isImportant} 
                                $isGridLayout={isGridLayout}
                            >
                                {isNew && <NewBadge>NEW</NewBadge>}
                                {/* 이 부분 수정: isImportant prop을 $isImportant로 변경 */}
                                <ImportantIndicator $isImportant={memo.isImportant}>!</ImportantIndicator>
                                <MemoHeader>
                                    <MemoText>
                                        {
                                            memo.content.split('\n')[0].length > 15
                                                ? memo.content.split('\n')[0].substring(0, 15) + '...'
                                                : memo.content.split('\n')[0]
                                        }
                                    </MemoText>
                                    <DeleteButton onClick={(e) => handleDeleteClick(e, memo.id)}>
                                        &times;
                                    </DeleteButton>
                                </MemoHeader>
                                <DateText>{memo.displayDate}</DateText>
                            </MemoCard>
                        );
                    })
                ) : (
                    <p>작성된 메모가 없습니다.</p>
                )}
            </MemoList>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
            />

            <MemoDetailModal
                isOpen={isDetailModalOpen}
                memo={selectedMemo}
                onSave={handleDetailSave}
                onCancel={() => setIsDetailModalOpen(false)}
            />

            <NewMemoModal
                isOpen={isNewMemoModalOpen}
                onSave={onSaveNewMemo}
                onCancel={() => setIsNewMemoModalOpen(false)}
            />

            <SideMenu
                isOpen={isSideMenuOpen}
                onClose={() => setIsSideMenuOpen(false)}
                onExport={handleExport}
                onImport={handleImport}
            />
        </MemoContainer>
    );
};

export default MemoPage;