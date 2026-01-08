// src/components/TrashPage.jsx

import React, { useState } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTrashContext } from '../contexts/TrashContext';
import ConfirmationModal from './ConfirmationModal';
import Portal from './Portal';
import { verifyPassword } from '../utils/encryption';

const PageContainer = styled.div`
    padding: 0;
    min-height: 100%;
`;

const Header = styled.div`
    padding: 12px 0 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 16px;
`;

const TitleSection = styled.div`
    margin-bottom: 12px;
`;

const Title = styled.h2`
    font-size: 28px;
    font-weight: 700;
    color: #e0e0e0;
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
`;

const SubTitle = styled.p`
    font-size: 14px;
    color: #b0b0b0;
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
    border: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 13px;
    font-weight: 400;
    cursor: pointer;
    transition: all 0.2s;
    background: #333842;
    color: #e0e0e0;

    ${props => props.$variant === 'select' && !props.$isAllSelected && `
        &:hover {
            border-color: #667eea;
            color: #667eea;
            background: #3d4250;
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
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.5);
        }
    `}

    ${props => props.$variant === 'restore' && !props.$hasSelection && `
        &:hover {
            border-color: #667eea;
            color: #667eea;
            background: #3d4250;
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
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.5);
        }
    `}

    ${props => props.$variant === 'delete' && !props.$hasSelection && `
        &:hover {
            border-color: #f5576c;
            color: #f5576c;
            background: #3d3237;
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
            box-shadow: 0 2px 8px rgba(245, 87, 108, 0.5);
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
    padding: 12px 40px 12px 44px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    font-size: 14px;
    transition: all 0.2s;
    box-sizing: border-box;
    background: #333842;
    color: #e0e0e0;

    &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    &::placeholder {
        color: #808080;
        font-size: 12px;
        line-height: 1.4;
    }
`;

const ClearButton = styled.button`
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #b0b0b0;
    cursor: pointer;
    font-size: 18px;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        color: #e0e0e0;
    }
`;

const SearchIcon = styled.div`
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: #808080;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
`;

const FilterRow = styled.div`
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
`;

const FilterButton = styled.button`
    flex: 1;
    background: ${props => {
        if (!props.$active) return 'rgba(255, 255, 255, 0.05)';
        switch (props.$type) {
            case 'all': return 'rgba(102, 126, 234, 0.2)';
            case 'memo': return 'rgba(139, 92, 246, 0.2)';
            case 'schedule': return 'rgba(236, 72, 153, 0.2)';
            case 'secret': return 'rgba(59, 130, 246, 0.2)';
            case 'review': return 'rgba(168, 85, 247, 0.2)';
            default: return 'rgba(102, 126, 234, 0.2)';
        }
    }};
    color: ${props => {
        if (!props.$active) return '#b0b0b0';
        switch (props.$type) {
            case 'all': return '#667eea';
            case 'memo': return '#a78bfa';
            case 'schedule': return '#ec4899';
            case 'secret': return '#3b82f6';
            case 'review': return '#a855f7';
            default: return '#667eea';
        }
    }};
    border: 1px solid ${props => {
        if (!props.$active) return 'rgba(255, 255, 255, 0.1)';
        switch (props.$type) {
            case 'all': return 'rgba(102, 126, 234, 0.5)';
            case 'memo': return 'rgba(139, 92, 246, 0.5)';
            case 'schedule': return 'rgba(236, 72, 153, 0.5)';
            case 'secret': return 'rgba(59, 130, 246, 0.5)';
            case 'review': return 'rgba(168, 85, 247, 0.5)';
            default: return 'rgba(102, 126, 234, 0.5)';
        }
    }};
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: ${props => props.$active ? '600' : '500'};
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    &:hover {
        ${props => !props.$active && `
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.2);
        `}
    }
`;

const SortButton = styled.button`
    width: 100%;
    background: #333842;
    color: #e0e0e0;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;

    &:hover {
        border-color: #667eea;
        color: #667eea;
        background: #3d4250;
    }
`;

const ResultCount = styled.div`
    font-size: 13px;
    color: #b0b0b0;
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
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 30000;
    padding: 20px;
    touch-action: none; /* 모든 터치 제스처 방지 */
    pointer-events: auto; /* 모달 뒤의 모든 요소 비활성화 */
`;

const DetailModalContainer = styled.div`
    background: #2a2d35;
    border-radius: 20px;
    width: 100%;
    max-width: 600px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    pointer-events: auto; /* 모달 자체는 클릭 가능 */
`;

const DetailModalHeader = styled.div`
    padding: 24px 24px 16px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
            case 'memo': return 'rgba(139, 92, 246, 0.2)';
            case 'schedule': return 'rgba(236, 72, 153, 0.2)';
            case 'secret': return 'rgba(59, 130, 246, 0.2)';
            case 'review': return 'rgba(168, 85, 247, 0.2)';
            default: return 'rgba(255, 255, 255, 0.05)';
        }
    }};
    border: 1px solid ${props => {
        switch (props.$type) {
            case 'memo': return 'rgba(139, 92, 246, 0.5)';
            case 'schedule': return 'rgba(236, 72, 153, 0.5)';
            case 'secret': return 'rgba(59, 130, 246, 0.5)';
            case 'review': return 'rgba(168, 85, 247, 0.5)';
            default: return 'rgba(255, 255, 255, 0.1)';
        }
    }};
    color: ${props => {
        switch (props.$type) {
            case 'memo': return '#a78bfa';
            case 'schedule': return '#ec4899';
            case 'secret': return '#3b82f6';
            case 'review': return '#a855f7';
            default: return '#e0e0e0';
        }
    }};
    margin-bottom: 8px;
`;

const DetailDeleteInfo = styled.div`
    font-size: 13px;
    color: #b0b0b0;
    margin-bottom: 4px;
`;

const DetailDaysLeft = styled.div`
    font-size: 12px;
    color: ${props => props.$days <= 7 ? '#ff6b6b' : '#b0b0b0'};
    font-weight: ${props => props.$days <= 7 ? '600' : '500'};
`;

const CloseIconButton = styled.button`
    background: none;
    border: none;
    font-size: 28px;
    color: #b0b0b0;
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
        background: #333842;
        color: #e0e0e0;
    }
`;

const DetailModalContent = styled.div`
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 24px;
    min-height: 0; /* Flexbox에서 스크롤을 위해 필요 */
    -webkit-overflow-scrolling: touch; /* iOS 부드러운 스크롤 */
    overscroll-behavior: contain; /* 모달 밖으로 스크롤 방지 */

    /* 웹킷 스크롤바 스타일링 */
    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: #1a1d23;
        border-radius: 10px;
    }

    &::-webkit-scrollbar-thumb {
        background: #4a4d55;
        border-radius: 10px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: #5a5d65;
    }
`;

const SecretDocTitle = styled.h2`
    font-size: 20px;
    font-weight: 600;
    color: #e0e0e0;
    margin: 0 0 12px 0;
    word-break: break-word;
`;

const SecretDocMeta = styled.div`
    font-size: 12px;
    color: #b0b0b0;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    line-height: 1.6;
`;

const SecretDocContent = styled.div`
    font-size: 15px;
    line-height: 1.8;
    color: #e0e0e0;
    white-space: pre-wrap;
    word-break: break-word;
`;

const NormalDocContent = styled.div`
    font-size: 15px;
    line-height: 1.8;
    color: #d0d0d0;
    white-space: pre-wrap;
    word-break: break-word;
`;

const DetailModalActions = styled.div`
    padding: 16px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
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
        color: #b0b0b0;
    }

    .empty-text {
        font-size: 16px;
        color: #b0b0b0;
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
    background: #2a2d35;
    border: 1px solid ${props => props.$isSelected ? '#667eea' : 'rgba(255, 255, 255, 0.1)'};
    border-radius: 16px;
    padding: 20px;
    padding-right: 60px; /* 라디오 버튼 공간 확보 */
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    position: relative;
    overflow: hidden;

    ${props => props.$isSelected && `
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
        transform: translateY(-2px);
    `}

    &:hover {
        border-color: ${props => props.$isSelected ? '#667eea' : 'rgba(255, 255, 255, 0.2)'};
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
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
                case 'memo': return '#a78bfa';
                case 'schedule': return '#ec4899';
                case 'secret': return '#3b82f6';
                case 'review': return '#a855f7';
                default: return 'rgba(255, 255, 255, 0.1)';
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
            case 'memo': return 'rgba(139, 92, 246, 0.2)';
            case 'schedule': return 'rgba(236, 72, 153, 0.2)';
            case 'secret': return 'rgba(59, 130, 246, 0.2)';
            case 'review': return 'rgba(168, 85, 247, 0.2)';
            default: return 'rgba(255, 255, 255, 0.05)';
        }
    }};
    border: 1px solid ${props => {
        switch (props.$type) {
            case 'memo': return 'rgba(139, 92, 246, 0.5)';
            case 'schedule': return 'rgba(236, 72, 153, 0.5)';
            case 'secret': return 'rgba(59, 130, 246, 0.5)';
            case 'review': return 'rgba(168, 85, 247, 0.5)';
            default: return 'rgba(255, 255, 255, 0.1)';
        }
    }};
    color: ${props => {
        switch (props.$type) {
            case 'memo': return '#a78bfa';
            case 'schedule': return '#ec4899';
            case 'secret': return '#3b82f6';
            case 'review': return '#a855f7';
            default: return '#e0e0e0';
        }
    }};
    white-space: nowrap;
`;

const DeleteInfo = styled.div`
    font-size: 11px;
    color: #808080;
    white-space: nowrap;
    font-weight: 500;
`;

const ItemContent = styled.div`
    color: #e0e0e0;
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
    color: ${props => props.$days <= 7 ? '#ff6b6b' : '#b0b0b0'};
    font-weight: ${props => props.$days <= 7 ? '600' : '500'};
    padding: 4px 10px;
    background: ${props => props.$days <= 7 ? 'rgba(255, 107, 107, 0.15)' : '#1f2229'};
    border-radius: 6px;

    &::before {
        content: '⏱';
        font-size: 14px;
    }
`;

// PIN 입력 모달 스타일
const PinModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 30001;
    padding: 20px;
    touch-action: none;
`;

const PinModalContainer = styled.div`
    background: linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%);
    border-radius: 20px;
    width: 100%;
    max-width: 400px;
    padding: 32px 24px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

const PinModalTitle = styled.h3`
    font-size: 20px;
    font-weight: 600;
    color: #e0e0e0;
    margin: 0 0 8px 0;
    text-align: center;
`;

const PinModalSubtitle = styled.p`
    font-size: 13px;
    color: #b0b0b0;
    margin: 0 0 24px 0;
    text-align: center;
    line-height: 1.5;
`;

const PinInputContainer = styled.div`
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-bottom: 24px;
`;

const PinDigit = styled.div`
    width: 48px;
    height: 56px;
    border: 2px solid ${props => props.$filled ? '#3b82f6' : 'rgba(255, 255, 255, 0.15)'};
    border-radius: 12px;
    background: ${props => props.$filled ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    color: #e0e0e0;
    font-weight: 600;
    transition: all 0.2s;
`;

const PinKeypad = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 16px;
`;

const PinKey = styled.button`
    height: 56px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    color: #e0e0e0;
    font-size: 20px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(59, 130, 246, 0.5);
    }

    &:active {
        transform: scale(0.95);
    }

    ${props => props.$span2 && `
        grid-column: span 2;
    `}
`;

const PinErrorMessage = styled.div`
    color: #ff6b6b;
    font-size: 13px;
    text-align: center;
    margin-top: -16px;
    margin-bottom: 16px;
    min-height: 20px;
`;

const PinCancelButton = styled.button`
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: #e0e0e0;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
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

    // PIN 입력 모달 상태
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState('');
    const [pendingSecretItem, setPendingSecretItem] = useState(null);
    const [decryptedSecretContent, setDecryptedSecretContent] = useState({});

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
        event.stopPropagation();

        // 시크릿 문서인 경우
        if (item.type === 'secret') {
            // 이미 복호화된 경우 바로 표시
            if (decryptedSecretContent[item.id]) {
                setSelectedItem(item);
                setIsDetailModalOpen(true);
            } else {
                // PIN 입력 모달 열기
                setPendingSecretItem(item);
                setIsPinModalOpen(true);
                setPinInput('');
                setPinError('');
            }
        } else {
            // 일반 문서는 바로 표시
            setSelectedItem(item);
            setIsDetailModalOpen(true);
        }
    };

    const handlePinKeyPress = (key) => {
        if (key === 'backspace') {
            setPinInput(prev => prev.slice(0, -1));
            setPinError('');
        } else if (pinInput.length < 6) {
            const newPin = pinInput + key;
            setPinInput(newPin);
            setPinError('');

            // 6자리가 되면 자동으로 검증
            if (newPin.length === 6) {
                handlePinSubmit(newPin);
            }
        }
    };

    const handlePinSubmit = async (pin) => {
        try {
            // PIN 검증
            const storedHash = localStorage.getItem('secretPagePin');
            if (!storedHash) {
                setPinError('PIN이 설정되지 않았습니다');
                setPinInput('');
                return;
            }

            const isValid = await verifyPassword(pin, storedHash);
            if (!isValid) {
                setPinError('PIN이 올바르지 않습니다');
                setPinInput('');
                return;
            }

            // PIN 검증 성공 - 시크릿 문서 표시
            // (originalData는 이미 복호화된 상태로 저장되어 있음)
            if (pendingSecretItem && pendingSecretItem.originalData) {
                // 검증 완료 표시 (필요시 나중에 재검증 방지용)
                setDecryptedSecretContent(prev => ({
                    ...prev,
                    [pendingSecretItem.id]: true
                }));

                // 상세보기 모달 열기
                setSelectedItem(pendingSecretItem);
                setIsDetailModalOpen(true);
                setIsPinModalOpen(false);
                setPendingSecretItem(null);
                setPinInput('');
                setPinError('');
            }
        } catch (error) {
            console.error('PIN 검증 오류:', error);
            setPinError('PIN 검증 중 오류가 발생했습니다');
            setPinInput('');
        }
    };

    const handleCloseDetailModal = () => {
        // 시크릿 문서 검증 상태 초기화 (모달을 닫을 때마다 다시 PIN 입력하도록)
        if (selectedItem && selectedItem.type === 'secret') {
            setDecryptedSecretContent(prev => {
                const newContent = { ...prev };
                delete newContent[selectedItem.id];
                return newContent;
            });
        }

        setIsDetailModalOpen(false);
        setSelectedItem(null);
    };

    const handleRestoreFromDetail = () => {
        if (!selectedItem) return;

        restoreFromTrash([selectedItem.id]);
        showToast('항목이 복원되었습니다 ✅');

        // 시크릿 문서 검증 상태 초기화
        if (selectedItem.type === 'secret') {
            setDecryptedSecretContent(prev => {
                const newContent = { ...prev };
                delete newContent[selectedItem.id];
                return newContent;
            });
        }

        setIsDetailModalOpen(false);
        setSelectedItem(null);
    };

    const handleDeleteFromDetail = async () => {
        if (!selectedItem) return;

        try {
            await permanentDelete([selectedItem.id]);
            showToast('항목이 영구 삭제되었습니다 🔥');

            // 시크릿 문서 검증 상태 초기화
            if (selectedItem.type === 'secret') {
                setDecryptedSecretContent(prev => {
                    const newContent = { ...prev };
                    delete newContent[selectedItem.id];
                    return newContent;
                });
            }

            setIsDetailModalOpen(false);
            setSelectedItem(null);
        } catch (error) {
            console.error('영구 삭제 실패:', error);
            showToast('❌ 영구 삭제 중 오류가 발생했습니다');
        }
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

        // 2. 검색어 필터링 (시크릿 문서 제외)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            items = items.filter(item => {
                // 시크릿 문서는 검색에서 제외
                if (item.type === 'secret') {
                    return false;
                }
                return item.content.toLowerCase().includes(query);
            });
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
                        {selectedIds.size === filteredAndSortedItems.length && filteredAndSortedItems.length > 0 ? '전체해제' : '전체선택'}
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
                        영구삭제{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
                    </TopActionButton>
                </ActionButtonRow>
            </Header>

            {/* 검색 및 필터 섹션 */}
            <SearchAndFilterSection>
                <SearchBox>
                    <SearchIcon>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="m21 21-4.35-4.35"/>
                        </svg>
                    </SearchIcon>
                    <SearchInput
                        type="text"
                        placeholder="휴지통 검색...&#10;시크릿 문서는 검색에서 제외됩니다"
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
                        $type="all"
                        onClick={() => setFilterType('all')}
                    >
                        전체
                    </FilterButton>
                    <FilterButton
                        $active={filterType === 'memo'}
                        $type="memo"
                        onClick={() => setFilterType('memo')}
                    >
                        메모
                    </FilterButton>
                    <FilterButton
                        $active={filterType === 'schedule'}
                        $type="schedule"
                        onClick={() => setFilterType('schedule')}
                    >
                        스케줄
                    </FilterButton>
                    <FilterButton
                        $active={filterType === 'secret'}
                        $type="secret"
                        onClick={() => setFilterType('secret')}
                    >
                        시크릿
                    </FilterButton>
                    <FilterButton
                        $active={filterType === 'review'}
                        $type="review"
                        onClick={() => setFilterType('review')}
                    >
                        리뷰
                    </FilterButton>
                </FilterRow>

                <FilterRow style={{ marginTop: '8px' }}>
                    <SortButton onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}>
                        {sortOrder === 'newest' ? '삭제순 ↓' : '삭제순 ↑'}
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
                    onConfirm={async () => {
                        const count = selectedIds.size;
                        await restoreFromTrash(Array.from(selectedIds));
                        showToast(`${count}개 항목이 복원되었습니다 ✅`);
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
                    onConfirm={async () => {
                        const count = selectedIds.size;
                        try {
                            await permanentDelete(Array.from(selectedIds));
                            showToast(`${count}개 항목이 영구 삭제되었습니다 🔥`);
                            setSelectedIds(new Set());
                            setIsDeleteConfirmOpen(false);
                        } catch (error) {
                            console.error('영구 삭제 실패:', error);
                            showToast('❌ 영구 삭제 중 오류가 발생했습니다');
                        }
                    }}
                    onCancel={() => setIsDeleteConfirmOpen(false)}
                />
            )}

            {/* 상세보기 모달 */}
            {isDetailModalOpen && selectedItem && (
                <Portal>
                    <DetailModalOverlay onClick={handleCloseDetailModal}>
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
                                <CloseIconButton onClick={handleCloseDetailModal}>
                                    ×
                                </CloseIconButton>
                            </DetailModalHeader>

                            <DetailModalContent>
                                {selectedItem.type === 'secret' ? (
                                    <>
                                        <SecretDocTitle>
                                            {selectedItem.originalData?.title || '제목 없음'}
                                        </SecretDocTitle>
                                        {selectedItem.originalData?.createdAt && (
                                            <SecretDocMeta>
                                                작성일: {format(new Date(selectedItem.originalData.createdAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                                                <br />
                                                수정일: {format(new Date(selectedItem.originalData.updatedAt || selectedItem.originalData.createdAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                                            </SecretDocMeta>
                                        )}
                                        <SecretDocContent>
                                            {selectedItem.originalData?.content || '내용 없음'}
                                        </SecretDocContent>
                                    </>
                                ) : (
                                    <NormalDocContent>
                                        {selectedItem.originalData?.content || selectedItem.originalData?.text || selectedItem.content}
                                    </NormalDocContent>
                                )}
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

            {/* PIN 입력 모달 */}
            {isPinModalOpen && (
                <Portal>
                    <PinModalOverlay onClick={() => {
                        setIsPinModalOpen(false);
                        setPendingSecretItem(null);
                        setPinInput('');
                        setPinError('');
                    }}>
                        <PinModalContainer onClick={(e) => e.stopPropagation()}>
                            <PinModalTitle>시크릿 문서 확인</PinModalTitle>
                            <PinModalSubtitle>
                                시크릿 문서를 보려면 PIN을 입력하세요
                            </PinModalSubtitle>

                            <PinInputContainer>
                                {[0, 1, 2, 3, 4, 5].map((index) => (
                                    <PinDigit key={index} $filled={index < pinInput.length}>
                                        {index < pinInput.length ? '●' : ''}
                                    </PinDigit>
                                ))}
                            </PinInputContainer>

                            <PinErrorMessage>{pinError}</PinErrorMessage>

                            <PinKeypad>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                    <PinKey key={num} onClick={() => handlePinKeyPress(num.toString())}>
                                        {num}
                                    </PinKey>
                                ))}
                                <PinKey onClick={() => handlePinKeyPress('backspace')}>
                                    ←
                                </PinKey>
                                <PinKey onClick={() => handlePinKeyPress('0')}>
                                    0
                                </PinKey>
                                <PinKey onClick={() => handlePinKeyPress('#')}>
                                    #
                                </PinKey>
                            </PinKeypad>

                            <PinCancelButton onClick={() => {
                                setIsPinModalOpen(false);
                                setPendingSecretItem(null);
                                setPinInput('');
                                setPinError('');
                            }}>
                                취소
                            </PinCancelButton>
                        </PinModalContainer>
                    </PinModalOverlay>
                </Portal>
            )}
        </PageContainer>
    );
};

export default TrashPage;
