import styled from 'styled-components';

export const Container = styled.div`
    width: 100%;
    height: 100%;
    padding: 0;
    background: linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%);
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
    /* 터치 스크롤 최적화 */
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
`;

export const InnerContent = styled.div`
    padding: 0px 24px 15px 24px;
    box-sizing: border-box;
    margin-top: -5px;
`;

export const TitleWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
`;

export const PageTitle = styled.div`
    font-size: 16px;
    color: rgba(255, 255, 255, 0.6);
    font-weight: 500;
    letter-spacing: 0.3px;
`;

export const AddDocButton = styled.button`
    background-color: transparent;
    border: none;
    font-size: 28px;
    cursor: pointer;
    color: #f093fb;
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

export const SearchBar = styled.div`
    margin-bottom: 16px;
    width: 100%;
    position: relative;
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

export const SearchInput = styled.input`
    width: 100%;
    padding: 12px 16px 12px 44px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
    font-size: 14px;
    transition: all 0.2s;
    box-sizing: border-box;

    &:focus {
        outline: none;
        border-color: rgba(240, 147, 251, 0.5);
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 0 0 3px rgba(240, 147, 251, 0.1);
    }

    &::placeholder {
        color: #808080;
    }
`;

export const FilterBar = styled.div`
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    width: 100%;
`;

export const SortBar = styled.div`
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    width: 100%;
`;

export const SortButton = styled.button`
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid ${props => props.$active ? 'rgba(240, 147, 251, 0.5)' : 'rgba(255, 255, 255, 0.15)'};
    background: ${props => props.$active ? 'rgba(240, 147, 251, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
    color: ${props => props.$active ? '#f093fb' : '#b0b0b0'};
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
        background: ${props => props.$active ? 'rgba(240, 147, 251, 0.25)' : 'rgba(255, 255, 255, 0.08)'};
        border-color: ${props => props.$active ? 'rgba(240, 147, 251, 0.6)' : 'rgba(255, 255, 255, 0.25)'};
    }
`;

export const FilterButton = styled.button`
    padding: 8px 4px;
    border-radius: 6px;
    border: 1px solid ${props => {
        if (!props.$active) return 'rgba(255, 255, 255, 0.15)';
        switch(props.$category) {
            case 'all': return '#7fa3ff';
            case 'financial': return 'rgba(255, 215, 0, 0.5)';
            case 'personal': return 'rgba(167, 139, 250, 0.5)';
            case 'work': return 'rgba(96, 165, 250, 0.5)';
            case 'diary': return 'rgba(244, 114, 182, 0.5)';
            default: return 'rgba(255, 255, 255, 0.15)';
        }
    }};
    background: ${props => {
        if (!props.$active) return 'rgba(255, 255, 255, 0.05)';
        switch(props.$category) {
            case 'all': return '#7fa3ff';
            case 'financial': return 'rgba(255, 215, 0, 0.2)';
            case 'personal': return 'rgba(167, 139, 250, 0.2)';
            case 'work': return 'rgba(96, 165, 250, 0.2)';
            case 'diary': return 'rgba(244, 114, 182, 0.2)';
            default: return 'rgba(255, 255, 255, 0.05)';
        }
    }};
    color: ${props => {
        if (!props.$active) return '#b0b0b0';
        switch(props.$category) {
            case 'all': return '#ffffff';
            case 'financial': return '#FFD700';
            case 'personal': return '#A78BFA';
            case 'work': return '#60A5FA';
            case 'diary': return '#F472B6';
            default: return '#ffffff';
        }
    }};
    font-size: 13px;
    font-weight: ${props => props.$active ? '700' : '500'};
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        background: ${props => {
            if (props.$active) {
                switch(props.$category) {
                    case 'all': return '#7fa3ff';
                    case 'financial': return 'rgba(255, 215, 0, 0.3)';
                    case 'personal': return 'rgba(167, 139, 250, 0.3)';
                    case 'work': return 'rgba(96, 165, 250, 0.3)';
                    case 'diary': return 'rgba(244, 114, 182, 0.3)';
                    default: return 'rgba(255, 255, 255, 0.05)';
                }
            }
            return 'rgba(255, 255, 255, 0.08)';
        }};
        border-color: ${props => {
            if (props.$active) {
                switch(props.$category) {
                    case 'all': return '#7fa3ff';
                    case 'financial': return 'rgba(255, 215, 0, 0.6)';
                    case 'personal': return 'rgba(167, 139, 250, 0.6)';
                    case 'work': return 'rgba(96, 165, 250, 0.6)';
                    case 'diary': return 'rgba(244, 114, 182, 0.6)';
                    default: return 'rgba(255, 255, 255, 0.15)';
                }
            }
            return 'rgba(255, 255, 255, 0.25)';
        }};
    }
`;

export const DocsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
    padding-bottom: ${props => props.$selectionMode ? '80px' : '20px'};

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

export const EmptyState = styled.div`
    text-align: center;
    padding: 60px 20px;
    color: #808080;
`;

export const EmptyIcon = styled.div`
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.5;
`;

export const EmptyText = styled.p`
    font-size: 16px;
    margin: 0 0 24px 0;
`;

export const GuidanceMessage = styled.div`
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(240, 147, 251, 0.3);
    padding: 10px 24px;
    text-align: center;
    margin-top: -10px;
    margin-bottom: 10px;
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 12px;
    font-weight: 300;
`;

export const SelectionModeBar = styled.div`
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    padding: 12px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(240, 147, 251, 0.3);
`;

export const SelectionInfo = styled.div`
    color: white;
    font-size: 15px;
    font-weight: 600;
`;

export const SelectionActions = styled.div`
    display: flex;
    gap: 8px;
`;

export const SelectionButton = styled.button`
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.3);
        border-color: rgba(255, 255, 255, 0.5);
    }

    &:active {
        transform: scale(0.95);
    }
`;

export const BulkActionBar = styled.div`
    position: fixed;
    bottom: 86px;
    left: 0;
    right: 0;
    background: linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding: 8px 24px;
    display: flex;
    gap: 8px;
    justify-content: space-around;
    align-items: center;
    z-index: 9999;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
    touch-action: none;
    pointer-events: auto;
`;

export const BulkActionButton = styled.button`
    flex: 1;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid ${props => {
        switch(props.$type) {
            case 'delete': return 'rgba(255, 107, 107, 0.3)';
            case 'category': return 'rgba(100, 181, 246, 0.3)';
            case 'importance': return 'rgba(255, 193, 7, 0.3)';
            default: return 'rgba(255, 255, 255, 0.15)';
        }
    }};
    background: ${props => {
        switch(props.$type) {
            case 'delete': return 'rgba(255, 107, 107, 0.1)';
            case 'category': return 'rgba(100, 181, 246, 0.1)';
            case 'importance': return 'rgba(255, 193, 7, 0.1)';
            default: return 'rgba(255, 255, 255, 0.05)';
        }
    }};
    color: ${props => {
        switch(props.$type) {
            case 'delete': return '#ff6b6b';
            case 'category': return '#64b5f6';
            case 'importance': return '#ffc107';
            default: return '#ffffff';
        }
    }};
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;

    &:hover {
        background: ${props => {
            switch(props.$type) {
                case 'delete': return 'rgba(255, 107, 107, 0.2)';
                case 'category': return 'rgba(100, 181, 246, 0.2)';
                case 'importance': return 'rgba(255, 193, 7, 0.2)';
                default: return 'rgba(255, 255, 255, 0.08)';
            }
        }};
        border-color: ${props => {
            switch(props.$type) {
                case 'delete': return 'rgba(255, 107, 107, 0.5)';
                case 'category': return 'rgba(100, 181, 246, 0.5)';
                case 'importance': return 'rgba(255, 193, 7, 0.5)';
                default: return 'rgba(255, 255, 255, 0.25)';
            }
        }};
    }

    &:active {
        transform: scale(0.95);
    }
`;

export const CategoryModal = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
    padding: 20px;
`;

export const CategoryModalContent = styled.div`
    background: linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%);
    border-radius: 16px;
    padding: 24px;
    max-width: 400px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const CategoryModalTitle = styled.h3`
    color: #ffffff;
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 20px 0;
    text-align: center;
`;

export const CategoryGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 16px;
`;

export const CategoryOption = styled.button`
    padding: 16px;
    border-radius: 12px;
    border: 2px solid ${props => {
        switch(props.$category) {
            case 'financial': return 'rgba(255, 215, 0, 0.5)';
            case 'personal': return 'rgba(167, 139, 250, 0.5)';
            case 'work': return 'rgba(96, 165, 250, 0.5)';
            case 'diary': return 'rgba(244, 114, 182, 0.5)';
            default: return 'rgba(255, 255, 255, 0.15)';
        }
    }};
    background: ${props => {
        switch(props.$category) {
            case 'financial': return 'rgba(255, 215, 0, 0.1)';
            case 'personal': return 'rgba(167, 139, 250, 0.1)';
            case 'work': return 'rgba(96, 165, 250, 0.1)';
            case 'diary': return 'rgba(244, 114, 182, 0.1)';
            default: return 'rgba(255, 255, 255, 0.05)';
        }
    }};
    color: ${props => {
        switch(props.$category) {
            case 'financial': return '#FFD700';
            case 'personal': return '#A78BFA';
            case 'work': return '#60A5FA';
            case 'diary': return '#F472B6';
            default: return '#ffffff';
        }
    }};
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    &:active {
        transform: scale(0.95);
    }
`;

export const ModalCancelButton = styled.button`
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.05);
    color: #d0d0d0;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.25);
    }

    &:active {
        transform: scale(0.98);
    }
`;

export const AddButton = styled.div`
    width: 70px;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    border: none;

    position: fixed;
    bottom: 109px;
    right: 29px;
    z-index: 10000;

    user-select: none;
    touch-action: none;
    pointer-events: auto;
    isolation: isolate;

    ${props => props.$isDragging && `
        animation: none !important;
        transform: translateY(${props.$offsetY}px) !important;
        cursor: grabbing;
    `}

    ${props => !props.$isDragging && props.$hasBeenDragged && `
        animation: none !important;
        transform: translateY(${props.$offsetY}px);
        transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1);
    `}

    &:active {
        cursor: grabbing;
    }
`;

export const MaskImage = styled.img`
    width: 70px;
    height: 70px;
    object-fit: contain;
    filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 0 2px #8B0000);
    transition: all 0.2s;

    &:hover {
        filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 0 2px #8B0000);
        transform: scale(1.05);
    }
`;

export const PlusIcon = styled.div`
    position: absolute;
    bottom: 5px;
    left: 50%;
    transform: translateX(-50%);
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f093fb, #f5576c);
    display: flex;
    align-items: center;
    justify-content: center;

    &::before,
    &::after {
        content: '';
        position: absolute;
        background: white;
    }

    &::before {
        width: 12px;
        height: 2px;
    }

    &::after {
        width: 2px;
        height: 12px;
    }
`;
