// src/components/MemoPage.jsx

import React, { useRef, useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useMemoFolders } from '../hooks/useMemoFolders';
import { exportData, importData } from '../utils/dataManager';
import Header from './Header';
import { BsCheckCircleFill, BsCircle } from 'react-icons/bs';
import { checkMemoSharedStatus } from '../services/collaborationRoomService';

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
const BadgeContainer = styled.div`
    position: absolute;
    top: -8px;
    left: -8px;
    display: flex;
    gap: 8px;
    z-index: 10;
`;

const NewBadge = styled.span`
    background-color: #5ebe26ff;
    color: white;
    font-size: 10px;
    font-weight: bold;
    padding: 4px 8px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    line-height: 1;
    padding-top: 6px;
    padding-bottom: 4px;
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
    position: sticky;
    top: 0;
    z-index: 100;
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    padding: 12px 24px;
    margin-bottom: 0;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    gap: 12px;

    &::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 0;
        right: 0;
        height: 8px;
        background: linear-gradient(to bottom, rgba(26, 29, 36, 0.95), rgba(26, 29, 36, 0));
        pointer-events: none;
    }
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
    position: sticky;
    top: 60px;
    z-index: 99;
    background: #1a1d24;
    padding: 16px 0;
    margin-bottom: 8px;
    display: flex;
    gap: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);

    &::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 0;
        right: 0;
        height: 8px;
        background: linear-gradient(to bottom, rgba(26, 29, 36, 0.95), rgba(26, 29, 36, 0));
        pointer-events: none;
    }
`;

const ActionButton = styled.button`
    background: ${props => {
        switch(props.$type) {
            case 'delete': return 'rgba(255, 107, 107, 0.1)';
            case 'importance': return 'rgba(255, 193, 7, 0.1)';
            case 'stealth': return 'rgba(96, 165, 250, 0.1)';
            default: return 'rgba(255, 255, 255, 0.05)';
        }
    }};
    border: 1px solid ${props => {
        switch(props.$type) {
            case 'delete': return 'rgba(255, 107, 107, 0.3)';
            case 'importance': return 'rgba(255, 193, 7, 0.3)';
            case 'stealth': return 'rgba(96, 165, 250, 0.3)';
            default: return 'rgba(255, 255, 255, 0.15)';
        }
    }};
    color: ${props => {
        switch(props.$type) {
            case 'delete': return '#ff6b6b';
            case 'importance': return '#ffc107';
            case 'stealth': return '#60a5fa';
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
                case 'stealth': return 'rgba(96, 165, 250, 0.2)';
                default: return 'rgba(255, 255, 255, 0.08)';
            }
        }};
        border-color: ${props => {
            switch(props.$type) {
                case 'delete': return 'rgba(255, 107, 107, 0.5)';
                case 'importance': return 'rgba(255, 193, 7, 0.5)';
                case 'stealth': return 'rgba(96, 165, 250, 0.5)';
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
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const StarIcon = styled.span`
    display: inline-block;
    transform: translate(0px, -1px);
`;

const StealthBadge = styled.span`
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #60a5fa;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
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
    padding-bottom: 20px;

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
            padding-top: 12px;
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

// 폴더 탭 스타일
const FolderTabContainer = styled.div`
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    overflow-x: auto;
    padding-bottom: 4px;

    &::-webkit-scrollbar {
        height: 4px;
    }
    &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 2px;
    }
    &::-webkit-scrollbar-thumb {
        background: rgba(74, 144, 226, 0.3);
        border-radius: 2px;
    }
`;

const FolderTab = styled.button`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 20px;
    border: 1px solid ${props => props.$active ? 'rgba(74, 144, 226, 0.5)' : 'rgba(255, 255, 255, 0.1)'};
    background: ${props => props.$active ? 'rgba(74, 144, 226, 0.15)' : 'rgba(255, 255, 255, 0.03)'};
    color: ${props => props.$active ? '#4a90e2' : '#888'};
    font-size: 13px;
    font-weight: ${props => props.$active ? '600' : '500'};
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    flex-shrink: 0;

    &:hover {
        background: rgba(74, 144, 226, 0.1);
        border-color: rgba(74, 144, 226, 0.3);
        color: #4a90e2;
    }

    span.count {
        background: ${props => props.$active ? 'rgba(74, 144, 226, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 11px;
        min-width: 18px;
        text-align: center;
    }
`;

const AddFolderTab = styled(FolderTab)`
    border-style: dashed;
    color: #666;

    &:hover {
        color: #4a90e2;
        border-color: rgba(74, 144, 226, 0.5);
    }
`;

// 폴더 모달 스타일
const FolderModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    animation: ${fadeIn} 0.2s ease-out;
`;

const FolderModalBox = styled.div`
    background: linear-gradient(135deg, #2a2d35, #333842);
    border-radius: 16px;
    padding: 24px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
    animation: ${slideUp} 0.3s cubic-bezier(0.2, 0, 0, 1);
`;

const FolderModalTitle = styled.h3`
    color: #e0e0e0;
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 20px 0;
`;

const FolderInput = styled.input`
    width: 100%;
    padding: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    background: #1a1d24;
    color: #e0e0e0;
    font-size: 15px;
    outline: none;
    margin-bottom: 16px;

    &:focus {
        border-color: #4a90e2;
    }

    &::placeholder {
        color: #666;
    }
`;

const IconPickerContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
`;

const IconOption = styled.button`
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 2px solid ${props => props.$selected ? '#4a90e2' : 'rgba(255, 255, 255, 0.1)'};
    background: ${props => props.$selected ? 'rgba(74, 144, 226, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
    font-size: 18px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        border-color: rgba(74, 144, 226, 0.5);
        background: rgba(74, 144, 226, 0.1);
    }
`;

const FolderModalButtons = styled.div`
    display: flex;
    gap: 12px;
`;

const FolderModalButton = styled.button`
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    ${props => props.$variant === 'cancel' && `
        background: rgba(255, 255, 255, 0.1);
        color: #b0b0b0;
        &:hover { background: rgba(255, 255, 255, 0.15); }
    `}

    ${props => props.$variant === 'confirm' && `
        background: #4a90e2;
        color: white;
        &:hover { background: #3b78c4; }
    `}

    ${props => props.$variant === 'delete' && `
        background: #e74c3c;
        color: white;
        &:hover { background: #c0392b; }
    `}
`;

const FolderEditButton = styled.button`
    background: transparent;
    border: none;
    color: #666;
    font-size: 12px;
    cursor: pointer;
    padding: 2px 6px;
    margin-left: 4px;
    border-radius: 4px;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #4a90e2;
    }
`;

// --- (모든 스타일 끝) ---

// 아이콘 선택 옵션
const FOLDER_ICONS = ['📁', '📂', '🗂️', '📋', '📝', '💼', '🎯', '⭐', '💡', '🔖', '📌', '🏷️', '🔒', '🔓', '💎', '🎨'];

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
    onUpdateMemoFolder
}) => {
    const [layoutView, setLayoutView] = useLocalStorage('memoLayoutView', 'list');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [sortOrder, setSortOrder] = React.useState('date'); // 'date' 또는 'importance'
    const [sortDirection, setSortDirection] = React.useState('desc'); // 'asc' 또는 'desc'
    const longPressTimer = useRef(null);
    const PRESS_DURATION = 500;

    // 폴더 관련 상태
    const {
        folders,
        activeFolder,
        setActiveFolder,
        addFolder,
        updateFolder,
        deleteFolder
    } = useMemoFolders();

    // 공유된 메모 ID 목록
    const [sharedMemoIds, setSharedMemoIds] = useState(new Set());

    // 폴더 모달 상태
    const [folderModal, setFolderModal] = useState(null); // null | { mode: 'add' | 'edit', folder?: object }
    const [folderName, setFolderName] = useState('');
    const [folderIcon, setFolderIcon] = useState('📁');

    // 공유 상태 확인 (메모 목록이 변경될 때)
    useEffect(() => {
        const checkSharedMemos = async () => {
            if (!memos || memos.length === 0) return;

            const sharedIds = new Set();
            for (const memo of memos) {
                try {
                    const result = await checkMemoSharedStatus(memo.id);
                    if (result.isShared) {
                        sharedIds.add(memo.id);
                    }
                } catch (e) {
                    // 에러 무시
                }
            }
            setSharedMemoIds(sharedIds);
        };

        checkSharedMemos();
    }, [memos]);

    // 폴더 모달 열기
    const openAddFolderModal = () => {
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
        } else if (folderModal.mode === 'edit') {
            updateFolder(folderModal.folder.id, { name: folderName, icon: folderIcon });
        }
        setFolderModal(null);
    };

    // 폴더 삭제
    const handleDeleteFolder = () => {
        if (folderModal?.folder) {
            deleteFolder(folderModal.folder.id);
            setFolderModal(null);
        }
    };

    // 폴더별 메모 수 계산
    const getFolderMemoCount = (folderId) => {
        if (!memos) return 0;
        if (folderId === 'all') return memos.length;
        if (folderId === 'shared') return sharedMemoIds.size;
        return memos.filter(memo => memo.folderId === folderId).length;
    };

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
        // 1. 폴더 필터링
        filteredAndSortedMemos = memos.filter(memo => {
            if (activeFolder === 'all') return true;
            if (activeFolder === 'shared') return sharedMemoIds.has(memo.id);
            return memo.folderId === activeFolder;
        });

        // 2. 검색 필터링
        filteredAndSortedMemos = filteredAndSortedMemos.filter(memo => {
            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase();
            return memo.content?.toLowerCase().includes(query);
        });

        // 3. 정렬
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
                        </ActionButton>
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

                    {/* 폴더 탭 */}
                    <FolderTabContainer>
                        {folders.map(folder => (
                            <FolderTab
                                key={folder.id}
                                $active={activeFolder === folder.id}
                                onClick={() => setActiveFolder(folder.id)}
                            >
                                <span>{folder.icon}</span>
                                <span>{folder.name}</span>
                                <span className="count">{getFolderMemoCount(folder.id)}</span>
                                {!folder.isDefault && activeFolder === folder.id && (
                                    <FolderEditButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openEditFolderModal(folder);
                                        }}
                                    >
                                        ✏️
                                    </FolderEditButton>
                                )}
                            </FolderTab>
                        ))}
                        <AddFolderTab onClick={openAddFolderModal}>
                            <span>+</span>
                            <span>새 폴더</span>
                        </AddFolderTab>
                    </FolderTabContainer>

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
                        const isNew = (Date.now() - memo.date) < (24 * 60 * 60 * 1000);
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

                                {/* 뱃지 컨테이너: NEW → 중요도 → 스텔스 순서로 자동 정렬 */}
                                <BadgeContainer>
                                    {isNew && <NewBadge>NEW</NewBadge>}
                                    {memo.isImportant && (
                                        <ImportantIndicator>
                                            <StarIcon>★</StarIcon>
                                        </ImportantIndicator>
                                    )}
                                    {memo.isStealth && (
                                        <StealthBadge>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                {/* 고스트 몸통 */}
                                                <path d="M12 2C7.58 2 4 5.58 4 10V18C4 18.55 4.45 19 5 19C5.55 19 6 18.55 6 18V17C6 16.45 6.45 16 7 16C7.55 16 8 16.45 8 17V18.5C8 19.05 8.45 19.5 9 19.5C9.55 19.5 10 19.05 10 18.5V17C10 16.45 10.45 16 11 16C11.55 16 12 16.45 12 17V18.5C12 19.05 12.45 19.5 13 19.5C13.55 19.5 14 19.05 14 18.5V17C14 16.45 14.45 16 15 16C15.55 16 16 16.45 16 17V18.5C16 19.05 16.45 19.5 17 19.5C17.55 19.5 18 19.05 18 18.5V17C18 16.45 18.45 16 19 16C19.55 16 20 16.45 20 17V18C20 18.55 19.55 19 19 19C18.45 19 18 18.55 18 18V10C18 5.58 14.42 2 12 2Z"
                                                      fill="white"
                                                      opacity="0.9"/>
                                                {/* 눈 */}
                                                <circle cx="9" cy="9" r="1.5" fill="#667eea"/>
                                                <circle cx="15" cy="9" r="1.5" fill="#667eea"/>
                                            </svg>
                                        </StealthBadge>
                                    )}
                                </BadgeContainer>
                                <MemoHeader>
                                    <MemoText>
                                        {memo.isStealth ? (memo.stealthPhrase || '비공개 메모') : (memo.content || '')}
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

            {/* 폴더 추가/수정 모달 */}
            {folderModal && (
                <FolderModalOverlay onClick={() => setFolderModal(null)}>
                    <FolderModalBox onClick={(e) => e.stopPropagation()}>
                        <FolderModalTitle>
                            {folderModal.mode === 'add' ? '새 폴더 만들기' : '폴더 수정'}
                        </FolderModalTitle>

                        <FolderInput
                            type="text"
                            placeholder="폴더 이름을 입력하세요"
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            autoFocus
                            maxLength={20}
                        />

                        <IconPickerContainer>
                            {FOLDER_ICONS.map(icon => (
                                <IconOption
                                    key={icon}
                                    $selected={folderIcon === icon}
                                    onClick={() => setFolderIcon(icon)}
                                >
                                    {icon}
                                </IconOption>
                            ))}
                        </IconPickerContainer>

                        <FolderModalButtons>
                            <FolderModalButton $variant="cancel" onClick={() => setFolderModal(null)}>
                                취소
                            </FolderModalButton>
                            {folderModal.mode === 'edit' && (
                                <FolderModalButton $variant="delete" onClick={handleDeleteFolder}>
                                    삭제
                                </FolderModalButton>
                            )}
                            <FolderModalButton
                                $variant="confirm"
                                onClick={handleSaveFolder}
                                disabled={!folderName.trim()}
                            >
                                {folderModal.mode === 'add' ? '생성' : '저장'}
                            </FolderModalButton>
                        </FolderModalButtons>
                    </FolderModalBox>
                </FolderModalOverlay>
            )}
        </MemoContainer>
    );
};

export default MemoPage;