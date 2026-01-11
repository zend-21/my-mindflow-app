import styled, { keyframes } from 'styled-components';
import { BsCheckCircleFill } from 'react-icons/bs';

// 애니메이션 keyframes
export const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

export const slideUp = keyframes`
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
`;

// Badge Containers
export const BadgeContainer = styled.div`
    position: absolute;
    top: -8px;
    left: -8px;
    display: flex;
    gap: 8px;
    z-index: 10;
`;

// NEW 뱃지 - 형광 라임 그린
export const NewBadge = styled.span`
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

// Main Container
export const MemoContainer = styled.div`
    padding: 0px 0px;
`;

export const SectionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
`;

// Selection Mode Bar
export const SelectionModeBar = styled.div`
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

export const SelectionInfo = styled.div`
    color: white;
    font-size: 15px;
    font-weight: 600;
    flex-shrink: 0;
    white-space: nowrap;
`;

export const SelectionButtonsContainer = styled.div`
    flex: 1;
    display: flex;
    gap: 8px;
    justify-content: flex-end;
`;

export const SelectionButton = styled.button`
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

// Action Buttons Bar
export const ActionButtonsBar = styled.div`
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

export const ActionButton = styled.button`
    background: ${props => {
        switch(props.$type) {
            case 'delete': return 'rgba(255, 107, 107, 0.1)';
            case 'importance': return 'rgba(255, 193, 7, 0.1)';
            case 'stealth': return 'rgba(96, 165, 250, 0.1)';
            case 'share': return 'rgba(96, 165, 250, 0.1)';
            default: return 'rgba(255, 255, 255, 0.05)';
        }
    }};
    border: 1px solid ${props => {
        switch(props.$type) {
            case 'delete': return 'rgba(255, 107, 107, 0.3)';
            case 'importance': return 'rgba(255, 193, 7, 0.3)';
            case 'stealth': return 'rgba(96, 165, 250, 0.3)';
            case 'share': return 'rgba(96, 165, 250, 0.3)';
            default: return 'rgba(255, 255, 255, 0.15)';
        }
    }};
    color: ${props => {
        switch(props.$type) {
            case 'delete': return '#ff6b6b';
            case 'importance': return '#ffc107';
            case 'stealth': return '#60a5fa';
            case 'share': return '#60a5fa';
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
                case 'share': return 'rgba(96, 165, 250, 0.2)';
                default: return 'rgba(255, 255, 255, 0.08)';
            }
        }};
        border-color: ${props => {
            switch(props.$type) {
                case 'delete': return 'rgba(255, 107, 107, 0.5)';
                case 'importance': return 'rgba(255, 193, 7, 0.5)';
                case 'stealth': return 'rgba(96, 165, 250, 0.5)';
                case 'share': return 'rgba(96, 165, 250, 0.5)';
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

// Search Bar
export const SearchBar = styled.div`
    margin-bottom: 16px;
    width: 100%;
    position: relative;
`;

export const SearchInput = styled.input`
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

export const ClearSearchButton = styled.button`
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

// Sort Bar
export const SortBar = styled.div`
    display: flex;
    gap: 8px;
    margin-bottom: -8px;
    width: 100%;
`;

export const SortButton = styled.button`
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

export const GuidanceMessage = styled.div`
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(74, 144, 226, 0.3);
    padding: 10px 16px;
    text-align: center;
    margin-bottom: 3px;
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 12px;
    font-weight: 300;
`;

// Section Title
export const SectionTitleWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
`;

export const SectionTitle = styled.h2`
    font-size: 16px;
    font-weight: 500;
    color: #e0e0e0;
    margin: 0;
`;

export const MemoCount = styled.span`
    font-size: 14px;
    font-weight: normal;
`;

// Header Buttons
export const HeaderButtonWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 15px;
`;

export const LayoutButtonSet = styled.div`
    display: flex;
    gap: 5px;
`;

export const LayoutToggleButton = styled.button`
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

export const AddMemoButton = styled.button`
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

// Grid/List Icon Components
export const GridIconContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 3px;
    width: 15px;
    height: 15px;
`;

export const GridSquare = styled.span`
    background-color: currentColor;
    border-radius: 2px;
`;

export const ListIconContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 15px;
    height: 15px;
    justify-content: center;
`;

export const ListBar = styled.span`
    background-color: currentColor;
    height: 5px;
    width: 100%;
    border-radius: 2px;
`;

// Memo Card
export const MemoCard = styled.div`
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

export const MemoHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    /* 그리드 뷰일 때 */
    ${props => props.$layoutView === 'grid' && `
        flex-grow: 1;
        overflow: hidden;
    `}
`;

export const MemoText = styled.div`
    font-size: 16px;
    color: #e0e0e0;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    padding-right: 2px;
    box-sizing: border-box;

    /* 리스트 뷰일 때 - 2줄 제한 */
    ${props => props.$layoutView === 'list' && `
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-top: 5px;
    `}

    /* 그리드 뷰일 때 - HTML 렌더링 */
    ${props => props.$layoutView === 'grid' && `
        overflow: hidden;
        max-height: 120px;
        flex-grow: 0;
        padding-top: 12px;
        line-height: 1.5;

        /* 이미지 스타일 - 썸네일처럼 작게 */
        img {
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            border-radius: 4px;
            margin: 0.3em 0;
            box-sizing: border-box;
        }

        /* YouTube 영상 스타일 - 썸네일처럼 작게 */
        iframe {
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            aspect-ratio: 16 / 9 !important;
            border-radius: 4px;
            margin: 0.3em 0;
            box-sizing: border-box;
        }

        /* 기타 스타일 */
        h1, h2, h3 {
            font-size: 1em;
            margin: 0.2em 0;
        }

        ul, ol {
            margin: 0.2em 0;
            padding-left: 1.2em;
        }

        p {
            margin: 0.2em 0;
        }

        blockquote {
            margin: 0.2em 0;
            padding-left: 0.5em;
            border-left: 2px solid rgba(255, 255, 255, 0.3);
        }
    `}
`;

export const DateText = styled.span`
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

export const DeleteButton = styled.button`
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

// Toast
export const ToastOverlay = styled.div`
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

export const ToastBox = styled.div`
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 16px 24px;
  border-radius: 8px;
  font-size: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  animation: ${slideUp} 0.3s cubic-bezier(0.2, 0, 0, 1);
`;

// 중요도 뱃지 - 붉은 계열 (MemoDetailModal과 통일)
export const ImportantIndicator = styled.span`
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(239, 83, 80, 0.2);
    border: 1px solid rgba(239, 83, 80, 0.4);
    color: #ef5350;
    font-size: 14px;
    font-weight: bold;
    display: flex;
    justify-content: center;
    align-items: center;
`;

export const StarIcon = styled.span`
    display: inline-block;
    transform: translate(0px, -1px);
`;

// 스텔스 뱃지 - 형광 시안/하늘색
export const StealthBadge = styled.span`
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

// 공유 뱃지 (형광 그린 - 공유 폴더 색상과 동일)
export const ShareBadge = styled.span`
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(0, 255, 136, 0.2);
    border: 1px solid rgba(0, 255, 136, 0.3);
    color: #00ff88;
    display: flex;
    align-items: center;
    justify-content: center;
`;

// 프리즈 뱃지 (파란색 얼음 결정)
export const FrozenBadge = styled.span`
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(74, 144, 226, 0.2);
    border: 1px solid #4a90e2;
    color: #4a90e2;
    display: flex;
    align-items: center;
    justify-content: center;
`;

export const EmptyMessage = styled.p`
    color: #b0b0b0;
    text-align: center;
    font-size: 16px;
    padding: 40px 20px;
`;

export const MemoList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
    margin-top: 20px;
    padding-bottom: 20px;
`;

// 일반 메모들만을 위한 wrapper (리스트/그리드 전환 적용)
export const MemoGridWrapper = styled.div`
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

// Folder Components
export const FolderGridContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    width: 100%;
    margin-bottom: 0;
`;

export const LeftHeaderGroup = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
`;

export const CheckboxContainer = styled.div`
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

export const StyledCheckIcon = styled(BsCheckCircleFill)`
    transform: translateY(0px);
`;

export const FolderCard = styled.div`
    background: linear-gradient(135deg, #2a2d35, #333842);
    border-radius: 12px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s;
    border: 2px solid ${props => props.$isShared
        ? 'rgba(0, 255, 136, 0.3)'
        : 'rgba(101, 67, 33, 0.5)'};
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    position: relative;
    ${props => props.$isShared && `
        box-shadow: 0 0 15px rgba(0, 255, 136, 0.15);
    `}

    &:hover {
        transform: translateY(-2px);
        box-shadow: ${props => props.$isShared
            ? '0 4px 20px rgba(0, 255, 136, 0.3)'
            : '0 4px 12px rgba(101, 67, 33, 0.3)'};
        border-color: ${props => props.$isShared
            ? 'rgba(0, 255, 136, 0.5)'
            : 'rgba(101, 67, 33, 0.7)'};
    }

    &:active {
        transform: scale(0.98);
    }
`;

export const FolderIconWrapper = styled.div`
    font-size: 32px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    display: flex;
    align-items: center;
    justify-content: center;
`;

// 공유 폴더 아이콘 (형광 그린)
export const SharedFolderIcon = styled.div`
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

export const FolderName = styled.span`
    color: #e0e0e0;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    word-break: break-word;
`;

// 폴더 삭제 버튼
export const FolderDeleteButton = styled.button`
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    background: rgba(150, 150, 150, 0.15);
    border: 1.5px solid rgba(150, 150, 150, 0.4);
    color: #aaa;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 18px;
    font-weight: 600;
    padding: 0;
    z-index: 10;

    &:hover {
        background: rgba(200, 200, 200, 0.25);
        border-color: rgba(200, 200, 200, 0.6);
        color: #ddd;
        transform: scale(1.1);
    }

    &:active {
        transform: scale(0.95);
    }
`;

export const FolderMemoCount = styled.span`
    color: #999;
    font-size: 12px;
`;

export const FolderEmptyBadge = styled.span`
    color: #666;
    font-size: 11px;
    font-style: italic;
`;

export const AddFolderCard = styled(FolderCard)`
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

export const AddFolderIcon = styled.div`
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

export const AddFolderText = styled.span`
    color: #666;
    font-size: 13px;
    margin-bottom: 20px;
`;

// 섹션 구분선
export const SectionDivider = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 10px 0 8px 0;
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
export const BackToMainButton = styled.button`
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
export const FolderEditButton = styled.button`
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
export const FolderExitButton = styled.button`
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
export const CurrentFolderHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(135deg, #2a2d35, #333842);
    padding: 12px 16px;
    border-radius: 10px;
    margin-bottom: 16px;
`;

export const CurrentFolderInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
`;

export const CurrentFolderIcon = styled.span`
    font-size: 24px;
`;

export const CurrentFolderName = styled.span`
    color: #e0e0e0;
    font-size: 16px;
    font-weight: 600;
`;

// 폴더 모달 스타일
export const FolderModalOverlay = styled.div`
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

export const FolderModalBox = styled.div`
    background: linear-gradient(135deg, #2a2d35, #333842);
    border-radius: 16px;
    padding: 24px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
    animation: ${slideUp} 0.3s cubic-bezier(0.2, 0, 0, 1);
`;

export const FolderModalTitle = styled.h3`
    color: #e0e0e0;
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    line-height: 1;
`;

export const FolderInput = styled.input`
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

export const IconPickerContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
`;

export const IconOption = styled.button`
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

// 폴더 잠금 토글 스위치
export const FolderLockToggleContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
`;

export const FolderLockToggle = styled.button`
    width: 52px;
    height: 28px;
    border-radius: 14px;
    border: none;
    cursor: pointer;
    position: relative;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: ${props => props.$locked ? '#4a90e2' : '#8a8a8a'};
    padding: 0;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);

    &:hover {
        opacity: 0.9;
    }

    &:active {
        transform: scale(0.98);
    }
`;

export const FolderLockToggleSlider = styled.div`
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: white;
    position: absolute;
    top: 2px;
    left: ${props => props.$locked ? 'calc(100% - 26px)' : '2px'};
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

    svg {
        width: 20px;
        height: 20px;
        color: ${props => props.$locked ? '#4a90e2' : '#666'};
        transition: color 0.3s;
    }
`;

export const FolderModalTitleRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 20px;
`;

export const FolderModalButtons = styled.div`
    display: flex;
    gap: 12px;
`;

export const FolderModalButton = styled.button`
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

// 폴더 이동 모달
export const FolderSelectModalOverlay = styled.div`
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

export const FolderSelectModalBox = styled.div`
    background: linear-gradient(135deg, #2a2d35, #333842);
    border-radius: 16px;
    padding: 24px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
    animation: ${slideUp} 0.3s cubic-bezier(0.2, 0, 0, 1);
`;

export const FolderSelectTitle = styled.h3`
    color: #e0e0e0;
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 20px 0;
    text-align: center;
`;

export const FolderOptionsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
`;

export const FolderOptionButton = styled.button`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: #e0e0e0;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(74, 144, 226, 0.5);
        transform: translateX(5px);
    }

    &:active {
        transform: translateX(5px) scale(0.98);
    }
`;

export const FolderOptionIcon = styled.span`
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

export const FolderOptionName = styled.span`
    flex: 1;
    font-weight: 500;
`;

// 메모 선택 모달 (폴더에 메모 추가)
export const MemoSelectModalOverlay = styled.div`
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

export const MemoSelectHeader = styled.div`
    background: linear-gradient(135deg, #2a2d35, #333842);
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

export const MemoSelectTitle = styled.h3`
    color: #e0e0e0;
    font-size: 16px;
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const MemoSelectCloseBtn = styled.button`
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

export const MemoSelectList = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 16px;
`;

export const MemoSelectItem = styled.div`
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

export const MemoSelectItemHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 6px;
`;

export const MemoSelectItemText = styled.p`
    color: #e0e0e0;
    font-size: 14px;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
`;

export const MemoSelectBadgeGroup = styled.div`
    display: flex;
    gap: 6px;
    flex-shrink: 0;
    margin-left: 8px;
`;

export const MemoFolderBadge = styled.span`
    background: rgba(167, 139, 250, 0.2);
    border: 1px solid rgba(167, 139, 250, 0.3);
    color: #a78bfa;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 8px;
    white-space: nowrap;
`;

export const MemoSharedBadge = styled.span`
    background: rgba(94, 190, 38, 0.15);
    border: 1px solid rgba(94, 190, 38, 0.3);
    color: #5ebe26;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 8px;
    white-space: nowrap;
`;

export const MemoSelectFooter = styled.div`
    background: linear-gradient(135deg, #2a2d35, #333842);
    padding: 16px 20px;
    display: flex;
    gap: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

export const MemoSelectBtn = styled.button`
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

export const MemoSelectInfo = styled.div`
    color: #888;
    font-size: 12px;
    text-align: center;
    padding: 8px;
`;

// 탭 컨테이너
export const TabContainer = styled.div`
    display: flex;
    background: linear-gradient(135deg, #2a2d35, #333842);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

export const Tab = styled.button`
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

// 프리즈 경고 모달
export const FrozenWarningOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100001;
    backdrop-filter: blur(4px);
`;

export const FrozenWarningContent = styled.div`
    background: linear-gradient(180deg, #2a2d35, #1f2128);
    border-radius: 16px;
    width: 90%;
    max-width: 400px;
    padding: 24px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const FrozenWarningHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    font-size: 18px;
    font-weight: 700;
    color: #4a90e2;
`;

export const FrozenWarningBody = styled.div`
    color: #e0e0e0;
    font-size: 14px;
    line-height: 1.6;
    margin-bottom: 20px;
`;

export const FrozenWarningInfo = styled.div`
    background: rgba(74, 144, 226, 0.1);
    border: 1px solid rgba(74, 144, 226, 0.3);
    border-radius: 8px;
    padding: 12px;
    margin: 16px 0;
    font-size: 13px;
    line-height: 1.6;
    color: #e0e0e0;
`;

export const FrozenWarningButton = styled.button`
    width: 100%;
    background: #4a90e2;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    min-height: 44px;

    &:active {
        transform: scale(0.98);
        background: #3a7bc8;
    }
`;
