// src/components/TrashPage.styles.js

import styled from 'styled-components';

export const PageContainer = styled.div`
    padding: 0;
    min-height: 100%;
`;

export const Header = styled.div`
    padding: 12px 0 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 16px;
`;

export const TitleSection = styled.div`
    margin-bottom: 12px;
`;

export const Title = styled.h2`
    font-size: 28px;
    font-weight: 700;
    color: #e0e0e0;
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
`;

export const SubTitle = styled.p`
    font-size: 14px;
    color: #b0b0b0;
    margin: 0;
    font-weight: 400;
`;

export const ActionButtonRow = styled.div`
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
`;

export const TopActionButton = styled.button`
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

export const SearchAndFilterSection = styled.div`
    margin-top: 8px;
    margin-bottom: 16px;
`;

export const SearchBox = styled.div`
    position: relative;
    margin-bottom: 12px;
`;

export const SearchInput = styled.input`
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

export const ClearButton = styled.button`
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

export const SearchIcon = styled.div`
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

export const FilterRow = styled.div`
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
`;

export const FilterButton = styled.button`
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

export const SortButton = styled.button`
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

export const ResultCount = styled.div`
    font-size: 13px;
    color: #b0b0b0;
    margin-bottom: 12px;
    font-weight: 500;
`;

export const DetailModalOverlay = styled.div`
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
    touch-action: none;
    pointer-events: auto;
`;

export const DetailModalContainer = styled.div`
    background: #2a2d35;
    border-radius: 20px;
    width: 100%;
    max-width: 600px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    pointer-events: auto;
`;

export const DetailModalHeader = styled.div`
    padding: 24px 24px 16px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-shrink: 0;
`;

export const DetailModalTitle = styled.div`
    flex: 1;
`;

export const DetailTypeLabel = styled.span`
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

export const DetailDeleteInfo = styled.div`
    font-size: 13px;
    color: #b0b0b0;
    margin-bottom: 4px;
`;

export const DetailDaysLeft = styled.div`
    font-size: 12px;
    color: ${props => props.$days <= 7 ? '#ff6b6b' : '#b0b0b0'};
    font-weight: ${props => props.$days <= 7 ? '600' : '500'};
`;

export const CloseIconButton = styled.button`
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

export const DetailModalContent = styled.div`
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 24px;
    min-height: 0;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;

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

export const SecretDocTitle = styled.h2`
    font-size: 20px;
    font-weight: 600;
    color: #e0e0e0;
    margin: 0 0 12px 0;
    word-break: break-word;
`;

export const SecretDocMeta = styled.div`
    font-size: 12px;
    color: #b0b0b0;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    line-height: 1.6;
`;

export const SecretDocContent = styled.div`
    font-size: 15px;
    line-height: 1.8;
    color: #e0e0e0;
    white-space: pre-wrap;
    word-break: break-word;
`;

export const NormalDocContent = styled.div`
    font-size: 15px;
    line-height: 1.8;
    color: #d0d0d0;
    white-space: pre-wrap;
    word-break: break-word;
`;

export const DetailModalActions = styled.div`
    padding: 16px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    gap: 12px;
    flex-shrink: 0;
`;

export const DetailActionButton = styled.button`
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

export const EmptyState = styled.div`
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

export const TrashList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-bottom: 20px;
`;

export const TrashItem = styled.div`
    background: #2a2d35;
    border: 1px solid ${props => props.$isSelected ? '#667eea' : 'rgba(255, 255, 255, 0.1)'};
    border-radius: 16px;
    padding: 20px;
    padding-right: 60px;
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

export const RadioButton = styled.div`
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

export const ItemHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    gap: 12px;
`;

export const ItemType = styled.span`
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

export const DeleteInfo = styled.div`
    font-size: 11px;
    color: #808080;
    white-space: nowrap;
    font-weight: 500;
`;

export const ItemContent = styled.div`
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

export const DaysLeft = styled.div`
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

export const PinModalOverlay = styled.div`
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

export const PinModalContainer = styled.div`
    background: linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%);
    border-radius: 20px;
    width: 100%;
    max-width: 400px;
    padding: 32px 24px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const PinModalTitle = styled.h3`
    font-size: 20px;
    font-weight: 600;
    color: #e0e0e0;
    margin: 0 0 8px 0;
    text-align: center;
`;

export const PinModalSubtitle = styled.p`
    font-size: 13px;
    color: #b0b0b0;
    margin: 0 0 24px 0;
    text-align: center;
    line-height: 1.5;
`;

export const PinInputContainer = styled.div`
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-bottom: 24px;
`;

export const PinDigit = styled.div`
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

export const PinKeypad = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 16px;
`;

export const PinKey = styled.button`
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

export const PinErrorMessage = styled.div`
    color: #ff6b6b;
    font-size: 13px;
    text-align: center;
    margin-top: -16px;
    margin-bottom: 16px;
    min-height: 20px;
`;

export const PinCancelButton = styled.button`
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
