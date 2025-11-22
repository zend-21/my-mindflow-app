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

// NEW 뱃지 - 형광 라임 그린
const NewBadge = styled.span`
    background: rgba(94, 190, 38, 0.2);
    border: 1px solid rgba(94, 190, 38, 0.3);
    color: #7fff00;
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
    background: ${props => props.$variant === 'unshare'
        ? 'rgba(139, 69, 19, 0.2)'
        : 'rgba(255, 255, 255, 0.2)'};
    border: 1px solid ${props => props.$variant === 'unshare'
        ? 'rgba(139, 69, 19, 0.6)'
        : 'rgba(255, 255, 255, 0.3)'};
    color: ${props => props.$variant === 'unshare' ? '#6b3410' : 'white'};
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: ${props => props.$variant === 'unshare' ? '600' : '500'};
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    &:hover:not(:disabled) {
        background: ${props => props.$variant === 'unshare'
            ? 'rgba(139, 69, 19, 0.2)'
            : 'rgba(255, 255, 255, 0.3)'};
        border-color: ${props => props.$variant === 'unshare'
            ? 'rgba(139, 69, 19, 0.6)'
            : 'rgba(255, 255, 255, 0.5)'};
    }

    &:active:not(:disabled) {
        transform: scale(0.95);
    }

    &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
        background: ${props => props.$variant === 'unshare'
            ? 'rgba(139, 69, 19, 0.05)'
            : 'rgba(255, 255, 255, 0.05)'};
        border-color: ${props => props.$variant === 'unshare'
            ? 'rgba(139, 69, 19, 0.2)'
            : 'rgba(255, 255, 255, 0.15)'};
        color: ${props => props.$variant === 'unshare' ? 'rgba(139, 69, 19, 0.5)' : 'rgba(255, 255, 255, 0.4)'};
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

    /* 그리드 뷰일 때 */
    ${props => props.$layoutView === 'grid' && `
        height: 160px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding-top: 20px;
    `}
`;
const MemoHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    /* 그리드 뷰일 때 */
    ${props => props.$layoutView === 'grid' && `
        flex-grow: 1;
        overflow: hidden;
    `}
`;
const MemoText = styled.p`
    font-size: 16px;
    color: #e0e0e0;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    padding-right: 2px;

    /* 리스트 뷰일 때 - 2줄 제한 */
    ${props => props.$layoutView === 'list' && `
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-top: 5px;
    `}

    /* 그리드 뷰일 때 - 6줄 제한 */
    ${props => props.$layoutView === 'grid' && `
        display: -webkit-box;
        -webkit-line-clamp: 6;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        flex-grow: 0;
        padding-top: 12px;
    `}
`;
const DateText = styled.span`
    font-size: 12px;
    color: #b0b0b0;
    margin-top: 8px;
    display: block;

    /* 그리드 뷰일 때 */
    ${props => props.$layoutView === 'grid' && `
        flex-shrink: 0;
        margin-top: 8px;
    `}
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
// 중요도 뱃지 - 형광 골드/오렌지
const ImportantIndicator = styled.span`
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(255, 215, 0, 0.2);
    border: 1px solid rgba(255, 215, 0, 0.3);
    color: #ffd700;
    font-size: 14px;
    font-weight: bold;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const StarIcon = styled.span`
    display: inline-block;
    transform: translate(0px, -1px);
`;

// 스텔스 뱃지 - 형광 시안/하늘색
const StealthBadge = styled.span`
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(96, 165, 250, 0.2);
    border: 1px solid rgba(96, 165, 250, 0.3);
    color: #60a5fa;
    display: flex;
    align-items: center;
    justify-content: center;
`;

// 공유 뱃지 (공개: 형광 그린, 비공개: 형광 레드) - 시크릿 카테고리 뱃지 스타일
const ShareBadge = styled.span`
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: ${props => props.$isPublic
        ? 'rgba(0, 255, 136, 0.2)'
        : 'rgba(255, 107, 107, 0.2)'};
    border: 1px solid ${props => props.$isPublic
        ? 'rgba(0, 255, 136, 0.3)'
        : 'rgba(255, 107, 107, 0.3)'};
    color: ${props => props.$isPublic ? '#00ff88' : '#ff6b6b'};
    display: flex;
    align-items: center;
    justify-content: center;
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
`;

// 일반 메모들만을 위한 wrapper (리스트/그리드 전환 적용)
const MemoGridWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;

    /* 그리드 뷰일 때 */
    ${props => props.$layoutView === 'grid' && `
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;

        @media (min-width: 768px) {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
        }

        @media (min-width: 1024px) {
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
        }

        @media (min-width: 1440px) {
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
        }
    `}
`;

// 폴더 그리드 컨테이너
const FolderGridContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    width: 100%;
    margin-bottom: 0;
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

const FolderCard = styled.div`
    background: linear-gradient(135deg, #2a2d35, #333842);
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s;
    border: 2px solid ${props => props.$isShared
        ? 'rgba(0, 255, 136, 0.3)'
        : 'transparent'};
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    min-height: 100px;
    justify-content: center;
    ${props => props.$isShared && `
        box-shadow: 0 0 15px rgba(0, 255, 136, 0.15);
    `}

    &:hover {
        transform: translateY(-2px);
        box-shadow: ${props => props.$isShared
            ? '0 4px 20px rgba(0, 255, 136, 0.3)'
            : '0 4px 12px rgba(74, 144, 226, 0.2)'};
        border-color: ${props => props.$isShared
            ? 'rgba(0, 255, 136, 0.5)'
            : 'rgba(74, 144, 226, 0.3)'};
    }

    &:active {
        transform: scale(0.98);
    }
`;

const FolderIconWrapper = styled.div`
    font-size: 40px;
    line-height: 1;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
`;

// 공유 폴더 아이콘 (형광 그린)
const SharedFolderIcon = styled.div`
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(0, 255, 136, 0.15);
    border: 2px solid rgba(0, 255, 136, 0.4);
    color: #00ff88;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 12px rgba(0, 255, 136, 0.2);
`;

const FolderName = styled.span`
    color: #e0e0e0;
    font-size: 13px;
    font-weight: 500;
    text-align: center;
    word-break: break-word;
    max-width: 100%;
`;

const FolderMemoCount = styled.span`
    background: rgba(74, 144, 226, 0.2);
    border: 1px solid rgba(74, 144, 226, 0.3);
    color: #4a90e2;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 10px;
`;

const FolderEmptyBadge = styled.span`
    background: rgba(255, 255, 255, 0.1);
    color: #666;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 10px;
`;

const AddFolderCard = styled(FolderCard)`
    border: 2px dashed rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.02);
    opacity: ${props => props.$disabled ? 0.4 : 1};
    cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};

    &:hover {
        border-color: ${props => props.$disabled ? 'rgba(255, 255, 255, 0.15)' : 'rgba(74, 144, 226, 0.5)'};
        background: ${props => props.$disabled ? 'rgba(255, 255, 255, 0.02)' : 'rgba(74, 144, 226, 0.1)'};
        transform: ${props => props.$disabled ? 'none' : 'translateY(-2px)'};
        box-shadow: ${props => props.$disabled ? 'none' : '0 4px 12px rgba(74, 144, 226, 0.2)'};
    }
`;

const AddFolderIcon = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: #666;
`;

const AddFolderText = styled.span`
    color: #666;
    font-size: 13px;
    margin-bottom: 20px;
`;

// 섹션 구분선
const SectionDivider = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 10px 0;
    color: #888;
    font-size: 13px;

    &::before, &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
    }
`;

// 뒤로가기 버튼
const BackToMainButton = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(74, 144, 226, 0.1);
    border: 1px solid rgba(74, 144, 226, 0.3);
    color: #4a90e2;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    margin-bottom: 16px;
    transition: all 0.2s;

    &:hover {
        background: rgba(74, 144, 226, 0.2);
        border-color: rgba(74, 144, 226, 0.5);
    }
`;

// 폴더 수정 버튼 (폴더 내부에서) - 형광 오렌지
const FolderEditButton = styled.button`
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(255, 165, 0, 0.15);
    border: 1px solid rgba(255, 165, 0, 0.4);
    color: #ffa500;
    font-size: 12px;
    cursor: pointer;
    padding: 4px 10px;
    margin-left: 8px;
    border-radius: 6px;
    box-shadow: 0 0 8px rgba(255, 165, 0, 0.2);

    &:active {
        transform: scale(0.95);
    }
`;

// 폴더 나가기 버튼 - 형광 시안
const FolderExitButton = styled.button`
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(0, 200, 255, 0.15);
    border: 1px solid rgba(0, 200, 255, 0.4);
    color: #00c8ff;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(0, 200, 255, 0.2);

    &:active {
        transform: scale(0.95);
    }
`;

// 현재 폴더 정보 표시
const CurrentFolderHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(135deg, #2a2d35, #333842);
    padding: 12px 16px;
    border-radius: 10px;
    margin-bottom: 16px;
`;

const CurrentFolderInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
`;

const CurrentFolderIcon = styled.span`
    font-size: 24px;
`;

const CurrentFolderName = styled.span`
    color: #e0e0e0;
    font-size: 16px;
    font-weight: 600;
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

// 메모 선택 모달 (폴더에 메모 추가)
const MemoSelectModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    flex-direction: column;
    z-index: 10001;
    animation: ${fadeIn} 0.2s ease-out;
`;

const MemoSelectHeader = styled.div`
    background: linear-gradient(135deg, #2a2d35, #333842);
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const MemoSelectTitle = styled.h3`
    color: #e0e0e0;
    font-size: 16px;
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
`;

const MemoSelectCloseBtn = styled.button`
    background: transparent;
    border: none;
    color: #999;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        color: #e0e0e0;
    }
`;

const MemoSelectList = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 16px;
`;

const MemoSelectItem = styled.div`
    background: ${props => props.$isShared
        ? 'rgba(255, 107, 107, 0.05)'
        : props.$selected
            ? 'rgba(74, 144, 226, 0.2)'
            : 'rgba(255, 255, 255, 0.05)'};
    border: 1px solid ${props => props.$isShared
        ? 'rgba(255, 107, 107, 0.3)'
        : props.$selected
            ? 'rgba(74, 144, 226, 0.5)'
            : 'rgba(255, 255, 255, 0.1)'};
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 10px;
    cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
    opacity: ${props => props.$disabled ? 0.5 : 1};
    transition: all 0.2s;
    position: relative;

    /* 공유 메모일 때 대각선 줄무늬 배경 */
    ${props => props.$isShared && `
        &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 10px,
                rgba(255, 107, 107, 0.03) 10px,
                rgba(255, 107, 107, 0.03) 20px
            );
            border-radius: 10px;
            pointer-events: none;
        }
    `}

    &:hover {
        background: ${props => props.$disabled
            ? props.$isShared
                ? 'rgba(255, 107, 107, 0.05)'
                : 'rgba(255, 255, 255, 0.05)'
            : props.$selected
                ? 'rgba(74, 144, 226, 0.25)'
                : 'rgba(255, 255, 255, 0.08)'};
    }
`;

const MemoSelectItemHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 6px;
`;

const MemoSelectItemText = styled.p`
    color: #e0e0e0;
    font-size: 14px;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
`;

const MemoSelectBadgeGroup = styled.div`
    display: flex;
    gap: 6px;
    flex-shrink: 0;
    margin-left: 8px;
`;

const MemoFolderBadge = styled.span`
    background: rgba(167, 139, 250, 0.2);
    border: 1px solid rgba(167, 139, 250, 0.3);
    color: #a78bfa;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 8px;
    white-space: nowrap;
`;

const MemoSharedBadge = styled.span`
    background: rgba(255, 107, 107, 0.2);
    border: 1px solid rgba(255, 107, 107, 0.3);
    color: #ff6b6b;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 8px;
    white-space: nowrap;
`;

const MemoSelectFooter = styled.div`
    background: linear-gradient(135deg, #2a2d35, #333842);
    padding: 16px 20px;
    display: flex;
    gap: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const MemoSelectBtn = styled.button`
    padding: 12px;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    ${props => props.$variant === 'cancel' && `
        background: rgba(255, 255, 255, 0.1);
        color: #b0b0b0;
        &:hover { background: rgba(255, 255, 255, 0.15); }
    `}

    ${props => props.$variant === 'confirm' && `
        background: #4a90e2;
        color: white;
        &:hover { background: #3b78c4; }
        &:disabled {
            background: rgba(255, 255, 255, 0.1);
            color: #888;
            cursor: not-allowed;
        }
    `}
`;

const MemoSelectInfo = styled.div`
    color: #888;
    font-size: 12px;
    text-align: center;
    padding: 8px;
`;

// 탭 컨테이너
const TabContainer = styled.div`
    display: flex;
    background: linear-gradient(135deg, #2a2d35, #333842);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Tab = styled.button`
    flex: 1;
    padding: 12px 16px;
    border: none;
    background: ${props => props.$active ? 'rgba(74, 144, 226, 0.2)' : 'transparent'};
    color: ${props => props.$active ? '#4a90e2' : '#999'};
    font-size: 14px;
    font-weight: ${props => props.$active ? '600' : '500'};
    cursor: pointer;
    transition: all 0.2s;
    border-bottom: 2px solid ${props => props.$active ? '#4a90e2' : 'transparent'};

    &:hover {
        background: ${props => props.$active ? 'rgba(74, 144, 226, 0.25)' : 'rgba(255, 255, 255, 0.05)'};
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
    onUpdateMemoFolder,
    onRequestUnshareSelectedMemos
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
        customFolders,
        activeFolder,
        setActiveFolder,
        addFolder,
        updateFolder,
        deleteFolder,
        canAddFolder,
        maxFolders
    } = useMemoFolders();

    // 공유된 메모 정보 (Map: memoId -> { isPublic: boolean })
    const [sharedMemoInfo, setSharedMemoInfo] = useState(new Map());

    // 폴더 모달 상태
    const [folderModal, setFolderModal] = useState(null); // null | { mode: 'add' | 'edit', folder?: object }
    const [folderName, setFolderName] = useState('');
    const [folderIcon, setFolderIcon] = useState('📁');

    // 폴더 삭제 확인 모달
    const [deleteFolderModal, setDeleteFolderModal] = useState(null); // null | { folder: object }
    const folderLongPressTimer = useRef(null);

    // 메모 이동 모달 상태
    const [moveMemosModal, setMoveMemosModal] = useState(null); // null | { folder: object }
    const [moveModalTab, setMoveModalTab] = useState('outside'); // 'inside' | 'outside'
    const [selectedMemosForMove, setSelectedMemosForMove] = useState(new Set());
    const folderHeaderLongPressTimer = useRef(null);

    // 메모 이동 확인 모달
    const [moveConfirmModal, setMoveConfirmModal] = useState(null); // null | { action: 'move' | 'remove', count: number }

    // 공유 상태 확인 (메모 목록이 변경될 때)
    useEffect(() => {
        const checkSharedMemos = async () => {
            if (!memos || memos.length === 0) return;

            const sharedInfo = new Map();
            for (const memo of memos) {
                try {
                    const result = await checkMemoSharedStatus(memo.id);
                    if (result.isShared && result.room) {
                        sharedInfo.set(memo.id, { isPublic: result.room.isPublic === true });
                    }
                } catch (e) {
                    // 에러 무시
                }
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
        } else if (folderModal.mode === 'edit') {
            updateFolder(folderModal.folder.id, { name: folderName, icon: folderIcon });
        }
        setFolderModal(null);
    };

    // 폴더 삭제 (수정 모달에서)
    const handleDeleteFolderFromEdit = () => {
        if (folderModal?.folder) {
            deleteFolder(folderModal.folder.id);
            setFolderModal(null);
        }
    };

    // 폴더별 메모 수 계산
    const getFolderMemoCount = (folderId) => {
        if (!memos) return 0;
        if (folderId === 'all') return memos.length;
        if (folderId === 'shared') return sharedMemoInfo.size;
        return memos.filter(memo => memo.folderId === folderId).length;
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
        setDeleteFolderModal({ folder });
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
    };

    // 폴더 헤더 길게 누르기 (폴더 수정 모달 열기)
    const handleFolderHeaderLongPress = (folder) => {
        openEditFolderModal(folder);
    };

    // 메모 이동 모달 열기
    const openMoveMemosModal = (folder) => {
        setMoveMemosModal({ folder });
        setMoveModalTab('outside'); // 기본값: 미분류 메모 탭
        setSelectedMemosForMove(new Set());
    };

    // 메모 이동 모달 닫기
    const closeMoveMemosModal = () => {
        setMoveMemosModal(null);
        setSelectedMemosForMove(new Set());
    };

    // 메모 선택 토글
    const toggleMemoForMove = (memoId) => {
        setSelectedMemosForMove(prev => {
            const newSet = new Set(prev);
            if (newSet.has(memoId)) {
                newSet.delete(memoId);
            } else {
                newSet.add(memoId);
            }
            return newSet;
        });
    };

    // 메모 이동 확인 모달 열기
    const handleRequestMove = () => {
        if (selectedMemosForMove.size === 0) return;

        setMoveConfirmModal({
            action: moveModalTab === 'outside' ? 'move' : 'remove',
            count: selectedMemosForMove.size
        });
    };

    // 메모 이동 실행
    const handleConfirmMove = () => {
        if (!moveMemosModal?.folder || selectedMemosForMove.size === 0) return;

        const folderId = moveMemosModal.folder.id;

        selectedMemosForMove.forEach(memoId => {
            if (onUpdateMemoFolder) {
                if (moveModalTab === 'outside') {
                    // 미분류 메모 -> 폴더로 이동
                    onUpdateMemoFolder(memoId, folderId);
                } else {
                    // 폴더 내 메모 -> 미분류로 이동
                    onUpdateMemoFolder(memoId, null);
                }
            }
        });

        setMoveConfirmModal(null);
        closeMoveMemosModal();
    };

    const handleAddMemoClick = () => {
        // 폴더 안에서 메모 작성 시 해당 폴더 ID 전달 (전체/공유 폴더는 미분류로 저장)
        const targetFolderId = (activeFolder !== 'all' && activeFolder !== 'shared') ? activeFolder : null;
        onOpenNewMemo(targetFolderId);
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
            // "전체"일 때는 폴더에 속하지 않은 미분류 메모만 표시 (공유된 메모 제외)
            if (activeFolder === 'all') return !memo.folderId && !sharedMemoInfo.has(memo.id);
            // "공유"일 때는 folderId가 'shared'이거나 sharedMemoInfo에 있는 메모 표시
            if (activeFolder === 'shared') return memo.folderId === 'shared' || sharedMemoInfo.has(memo.id);
            // 다른 커스텀 폴더일 때는 해당 폴더 ID와 일치하고 공유되지 않은 메모만 표시
            return memo.folderId === activeFolder && !sharedMemoInfo.has(memo.id);
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
                            {/* 공유 폴더일 때만 공유해제 버튼 표시 */}
                            {activeFolder === 'shared' && (
                                <SelectionButton
                                    $variant="unshare"
                                    disabled={selectedCount === 0}
                                    onClick={onRequestUnshareSelectedMemos}
                                >
                                    공유해제
                                </SelectionButton>
                            )}
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

                    {/* 공유 폴더 내부일 때 폴더 정보 */}
                    {activeFolder === 'shared' && (
                        <CurrentFolderHeader>
                            <CurrentFolderInfo>
                                <CurrentFolderIcon style={{ display: 'flex', alignItems: 'center', color: '#00ff88' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5C21 3.34 19.66 2 18 2C16.34 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.35C15.11 18.56 15.08 18.78 15.08 19C15.08 20.61 16.39 21.92 18 21.92C19.61 21.92 20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z" fill="currentColor"/>
                                    </svg>
                                </CurrentFolderIcon>
                                <CurrentFolderName>공유 폴더</CurrentFolderName>
                            </CurrentFolderInfo>
                            <FolderExitButton onClick={() => setActiveFolder('all')}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M13 17L14.4 15.6L11.8 13H22V11H11.8L14.4 8.4L13 7L8 12L13 17ZM4 5H13V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H13V19H4V5Z" fill="currentColor"/>
                                </svg>
                                폴더 나가기
                            </FolderExitButton>
                        </CurrentFolderHeader>
                    )}

                    {/* 사용자 폴더 내부일 때 폴더 정보 */}
                    {activeFolder !== 'all' && activeFolder !== 'shared' && (() => {
                        const currentFolder = customFolders.find(f => f.id === activeFolder);
                        if (!currentFolder) return null;
                        return (
                            <CurrentFolderHeader>
                                <CurrentFolderInfo
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
                                    <CurrentFolderIcon>{currentFolder.icon}</CurrentFolderIcon>
                                    <CurrentFolderName>{currentFolder.name}</CurrentFolderName>
                                </CurrentFolderInfo>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <FolderEditButton onClick={() => openMoveMemosModal(currentFolder)}>
                                        📋 메모 이동
                                    </FolderEditButton>
                                    <FolderExitButton onClick={() => setActiveFolder('all')}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M13 17L14.4 15.6 L11.8 13H22V11H11.8L14.4 8.4L13 7L8 12L13 17ZM4 5H13V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H13V19H4V5Z" fill="currentColor"/>
                                        </svg>
                                        폴더 나가기
                                    </FolderExitButton>
                                </div>
                            </CurrentFolderHeader>
                        );
                    })()}

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

            <MemoList>
                {/* 전체 보기일 때만 폴더 표시 */}
                {activeFolder === 'all' && (
                    <>
                        <FolderGridContainer>
                            {/* 공유 폴더 - 항상 맨 앞에 표시 (형광 그린 스타일) */}
                            <FolderCard
                                $isShared
                                onClick={() => setActiveFolder('shared')}
                                title="공유된 메모 보기"
                            >
                                <SharedFolderIcon>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5C21 3.34 19.66 2 18 2C16.34 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.35C15.11 18.56 15.08 18.78 15.08 19C15.08 20.61 16.39 21.92 18 21.92C19.61 21.92 20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z" fill="currentColor"/>
                                    </svg>
                                </SharedFolderIcon>
                                <FolderName>공유 폴더</FolderName>
                                {sharedMemoInfo.size > 0 ? (
                                    <FolderMemoCount>{sharedMemoInfo.size}개 문서</FolderMemoCount>
                                ) : (
                                    <FolderEmptyBadge>비어있음</FolderEmptyBadge>
                                )}
                            </FolderCard>

                            {/* 사용자 정의 폴더들 */}
                            {customFolders.map(folder => {
                                const folderMemoCount = getFolderMemoCount(folder.id);
                                return (
                                    <FolderCard
                                        key={folder.id}
                                        onClick={() => setActiveFolder(folder.id)}
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
                                        title="길게 눌러서 삭제"
                                    >
                                        <FolderIconWrapper>{folder.icon}</FolderIconWrapper>
                                        <FolderName>{folder.name}</FolderName>
                                        {folderMemoCount > 0 ? (
                                            <FolderMemoCount>{folderMemoCount}개 문서</FolderMemoCount>
                                        ) : (
                                            <FolderEmptyBadge>비어있음</FolderEmptyBadge>
                                        )}
                                    </FolderCard>
                                );
                            })}

                            {/* 새 폴더 만들기 카드 */}
                            <AddFolderCard
                                onClick={canAddFolder ? openAddFolderModal : undefined}
                                $disabled={!canAddFolder}
                                title={canAddFolder ? '새 폴더 만들기' : `폴더는 최대 ${maxFolders}개까지 생성 가능`}
                            >
                                <AddFolderIcon>+</AddFolderIcon>
                                <AddFolderText>
                                    {canAddFolder ? '새 폴더' : `${maxFolders}/${maxFolders}`}
                                </AddFolderText>
                            </AddFolderCard>
                        </FolderGridContainer>

                        {/* 구분선 - 미분류 메모가 있을 때만 표시 */}
                        {filteredAndSortedMemos.length > 0 && (
                            <SectionDivider>미분류 메모</SectionDivider>
                        )}
                    </>
                )}

                {/* 일반 메모들만 레이아웃 전환 적용 */}
                <MemoGridWrapper $layoutView={layoutView}>
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
                                $layoutView={layoutView}
                            >
                                <CheckboxContainer $isVisible={isSelectionMode} $isSelected={isSelected}>
                                    {isSelected ? <StyledCheckIcon /> : <BsCircle />}
                                </CheckboxContainer>

                                {/* 뱃지 컨테이너: NEW → 중요도 → 스텔스 → 공유 순서로 자동 정렬 */}
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
                                                      fill="#60a5fa"
                                                      opacity="0.9"/>
                                                {/* 눈 */}
                                                <circle cx="9" cy="9" r="1.5" fill="#1a1d24"/>
                                                <circle cx="15" cy="9" r="1.5" fill="#1a1d24"/>
                                            </svg>
                                        </StealthBadge>
                                    )}
                                    {/* 공유 뱃지: 공개(형광 그린), 비공개(형광 레드) */}
                                    {sharedMemoInfo.has(memo.id) && (
                                        <ShareBadge
                                            $isPublic={sharedMemoInfo.get(memo.id)?.isPublic}
                                            title={sharedMemoInfo.get(memo.id)?.isPublic ? '공개 공유 중' : '비공개 공유 중'}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5C21 3.34 19.66 2 18 2C16.34 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.35C15.11 18.56 15.08 18.78 15.08 19C15.08 20.61 16.39 21.92 18 21.92C19.61 21.92 20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z" fill="currentColor"/>
                                            </svg>
                                        </ShareBadge>
                                    )}
                                </BadgeContainer>
                                <MemoHeader $layoutView={layoutView}>
                                    <MemoText $layoutView={layoutView}>
                                        {memo.isStealth ? (memo.stealthPhrase || '비공개 메모') : (memo.content || '')}
                                    </MemoText>
                                    <DeleteButton onClick={(e) => handleDeleteClick(e, memo.id)} $isSelectionMode={isSelectionMode}>
                                        &times;
                                    </DeleteButton>
                                </MemoHeader>
                                <DateText $layoutView={layoutView}>
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
                </MemoGridWrapper>
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
                                <FolderModalButton $variant="delete" onClick={handleDeleteFolderFromEdit}>
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

            {/* 폴더 삭제 확인 모달 */}
            {deleteFolderModal && (
                <FolderModalOverlay onClick={() => setDeleteFolderModal(null)}>
                    <FolderModalBox onClick={(e) => e.stopPropagation()}>
                        <FolderModalTitle>
                            폴더 삭제
                        </FolderModalTitle>

                        <div style={{ color: '#e0e0e0', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                            <p style={{ margin: '0 0 12px 0' }}>
                                <strong>"{deleteFolderModal.folder.name}"</strong> 폴더를 삭제하시겠습니까?
                            </p>
                            <p style={{ margin: '0', color: '#4a90e2' }}>
                                ⚠️ 폴더 내부의 메모들은 삭제되지 않고 미분류 메모로 자동 이동됩니다.
                            </p>
                        </div>

                        <FolderModalButtons>
                            <FolderModalButton $variant="cancel" onClick={() => setDeleteFolderModal(null)}>
                                취소
                            </FolderModalButton>
                            <FolderModalButton $variant="delete" onClick={handleConfirmDeleteFolder}>
                                폴더 삭제
                            </FolderModalButton>
                        </FolderModalButtons>
                    </FolderModalBox>
                </FolderModalOverlay>
            )}

            {/* 메모 이동 확인 모달 */}
            {moveConfirmModal && (
                <FolderModalOverlay onClick={() => setMoveConfirmModal(null)} style={{ zIndex: 10002 }}>
                    <FolderModalBox onClick={(e) => e.stopPropagation()}>
                        <FolderModalTitle>
                            {moveConfirmModal.action === 'move' ? '메모 이동' : '폴더에서 제거'}
                        </FolderModalTitle>

                        <div style={{ color: '#e0e0e0', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                            <p style={{ margin: '0 0 12px 0' }}>
                                {moveConfirmModal.action === 'move'
                                    ? `선택한 ${moveConfirmModal.count}개의 메모를 "${moveMemosModal?.folder.name}" 폴더로 이동하시겠습니까?`
                                    : `선택한 ${moveConfirmModal.count}개의 메모를 폴더에서 제거하시겠습니까?`}
                            </p>
                            {moveConfirmModal.action === 'remove' && (
                                <p style={{ margin: '0', color: '#4a90e2' }}>
                                    ⚠️ 메모는 삭제되지 않고 미분류 메모로 이동됩니다.
                                </p>
                            )}
                        </div>

                        <FolderModalButtons>
                            <FolderModalButton $variant="cancel" onClick={() => setMoveConfirmModal(null)}>
                                취소
                            </FolderModalButton>
                            <FolderModalButton $variant="confirm" onClick={handleConfirmMove}>
                                {moveConfirmModal.action === 'move' ? '이동' : '제거'}
                            </FolderModalButton>
                        </FolderModalButtons>
                    </FolderModalBox>
                </FolderModalOverlay>
            )}

            {/* 메모 이동 모달 */}
            {moveMemosModal && (
                <MemoSelectModalOverlay>
                    <MemoSelectHeader>
                        <MemoSelectTitle>
                            {moveMemosModal.folder.icon} "{moveMemosModal.folder.name}" 메모 이동
                        </MemoSelectTitle>
                        <MemoSelectCloseBtn onClick={closeMoveMemosModal}>×</MemoSelectCloseBtn>
                    </MemoSelectHeader>

                    {/* 탭 */}
                    <TabContainer>
                        <Tab
                            $active={moveModalTab === 'outside'}
                            onClick={() => {
                                setMoveModalTab('outside');
                                setSelectedMemosForMove(new Set());
                            }}
                        >
                            미분류 메모
                        </Tab>
                        <Tab
                            $active={moveModalTab === 'inside'}
                            onClick={() => {
                                setMoveModalTab('inside');
                                setSelectedMemosForMove(new Set());
                            }}
                        >
                            폴더 내 메모
                        </Tab>
                    </TabContainer>

                    {/* 버튼 영역 */}
                    <div style={{
                        padding: '12px 20px',
                        display: 'flex',
                        gap: '8px',
                        background: '#2c2f38',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <MemoSelectBtn
                            $variant="confirm"
                            onClick={handleRequestMove}
                            disabled={selectedMemosForMove.size === 0}
                            style={{ flex: 1 }}
                        >
                            {moveModalTab === 'outside'
                                ? `이 폴더로 이동 ${selectedMemosForMove.size > 0 ? `(${selectedMemosForMove.size}개)` : ''}`
                                : `폴더에서 제거 ${selectedMemosForMove.size > 0 ? `(${selectedMemosForMove.size}개)` : ''}`}
                        </MemoSelectBtn>
                        <MemoSelectBtn $variant="cancel" onClick={closeMoveMemosModal}>
                            닫기
                        </MemoSelectBtn>
                    </div>

                    <MemoSelectList>
                        {(() => {
                            const targetMemos = moveModalTab === 'outside'
                                ? memos?.filter(memo => !memo.folderId && !sharedMemoInfo.has(memo.id)) || []
                                : memos?.filter(memo => memo.folderId === moveMemosModal.folder.id) || [];

                            if (targetMemos.length === 0) {
                                return (
                                    <MemoSelectInfo>
                                        {moveModalTab === 'outside' ? '미분류 메모가 없습니다.' : '폴더 내 메모가 없습니다.'}
                                    </MemoSelectInfo>
                                );
                            }

                            return targetMemos.map(memo => {
                                const isSelected = selectedMemosForMove.has(memo.id);
                                // 메모 이동 모달에서는 스텔스 여부와 관계없이 실제 내용 표시
                                const displayContent = memo.content?.split('\n')[0] || '(내용 없음)';
                                return (
                                    <MemoSelectItem
                                        key={memo.id}
                                        $selected={isSelected}
                                        onClick={() => toggleMemoForMove(memo.id)}
                                    >
                                        <MemoSelectItemHeader>
                                            <MemoSelectItemText>
                                                {displayContent}
                                            </MemoSelectItemText>
                                        </MemoSelectItemHeader>
                                    </MemoSelectItem>
                                );
                            });
                        })()}
                    </MemoSelectList>
                </MemoSelectModalOverlay>
            )}
        </MemoContainer>
    );
};

export default MemoPage;