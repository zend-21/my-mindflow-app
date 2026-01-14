// src/components/MemoDetailModal.styles.js

import styled, { keyframes } from 'styled-components';

/* --- Keyframe Animations --- */
export const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

export const slideUp = keyframes`
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
`;

export const slideInFromLeft = keyframes`
    from { transform: translateX(-100%); opacity: 0.5; }
    to { transform: translateX(0); opacity: 1; }
`;

export const slideInFromRight = keyframes`
    from { transform: translateX(100%); opacity: 0.5; }
    to { transform: translateX(0); opacity: 1; }
`;

export const slideOutToLeft = keyframes`
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(-100%); opacity: 0.5; }
`;

export const slideOutToRight = keyframes`
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0.5; }
`;

/* --- Main Modal Styles --- */
export const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    align-items: center;
    z-index: 10000;
    animation: ${fadeIn} 0.3s ease-out;
    overflow: hidden;
`;

export const PreviewMemoCard = styled.div`
    position: absolute;
    top: 50%;
    transform: translateY(-50%) translateX(${props => props.$offset}px);
    width: 95vw;
    max-width: 800px;
    height: 97vh;
    background: ${props => props.$isImportant ? 'linear-gradient(135deg, #3d2a2e, #4a2d32)' : 'linear-gradient(135deg, #2a2d35, #333842)'};
    border-radius: 16px;
    padding: 24px;
    opacity: 0.3;
    filter: blur(2px);
    pointer-events: none;
    z-index: -1;

    @media (min-width: 768px) {
        max-width: 420px;
        border-radius: 20px;
    }

    @media (min-width: 1200px) {
        max-width: 480px;
    }

    @media (min-width: 1900px) {
        max-width: 530px;
    }
`;

export const PreviewContent = styled.div`
    color: #e0e0e0;
    font-size: 14px;
    line-height: 1.6;
    opacity: 0.7;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 15;
    -webkit-box-orient: vertical;
`;

export const ModalContent = styled.div`
    background: ${props => props.$isImportant ? 'linear-gradient(135deg, #3d2a2e, #4a2d32)' : 'linear-gradient(135deg, #2a2d35, #333842)'};
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    position: relative;
    width: 95vw;
    height: 97vh;
    max-width: 800px;

    /* 스와이프 오프셋 적용 */
    transform: translateX(${props => props.$swipeOffset || 0}px);
    transition: ${props => props.$isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)'};

    /* 슬라이드 애니메이션 */
    animation: ${props => {
        if (props.$slideDirection === 'left') return slideOutToLeft;
        if (props.$slideDirection === 'right') return slideOutToRight;
        return slideUp;
    }} ${props => props.$slideDirection ? '0.25s' : '0.3s'} cubic-bezier(0.2, 0, 0, 1);

    /* 가로 모드일 때 padding-bottom을 줄여 공간 확보 */
    @media (orientation: landscape) {
        padding-bottom: 10px;
    }

    /* ✅ PC 화면일 때 (768px 이상) */
    @media (min-width: 768px) {
        max-width: 420px;   /* PC에서 폭 제한 */
        min-height: 70vh;   /* PC에서 조금 더 여유 */
        border-radius: 20px; /* PC에선 더 부드럽게 */
    }

    /* ✅ 큰 데스크탑 화면일 때 */
    @media (min-width: 1200px) {
        max-width: 480px;
    }

    /* ✅ 아주 큰 데스크탑 화면일 때 */
    @media (min-width: 1900px) {
        max-width: 530px;
    }
`;

/* --- History Navigation Buttons --- */
export const HistoryButtonContainer = styled.div`
    position: relative;
    display: flex;
    /* 변경: 중앙 정렬로 고정 */
    justify-content: center;
    align-items: center;
    width: 100%;
    gap: 5px;
    margin-bottom: 15px;
`;

export const CenterButtonWrapper = styled.div`
    display: flex;
    gap: 5px;
    justify-content: center;
    flex-grow: 1;
`;

export const HistoryButton = styled.button`
  background: transparent;
  border: none;
  font-size: 22px;
  cursor: pointer;
  padding: 4px 6px;
  color: #e0e0e0; /* 흰색으로 변경하여 잘 보이도록 */

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  &:focus {
    outline: none;
  }
  &:focus-visible {
    box-shadow: 0 0 0 2px rgba(150, 160, 170, 0.7);
  }
`;

export const HideKeyboardButton = styled.button`
  right: 0;
  background: #333842;
  color: #e0e0e0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 6px 10px;      /* 패딩 축소 */
  font-size: 12px;        /* 글씨 크기 축소 */
  cursor: pointer;
  white-space: nowrap;    /* 텍스트 줄바꿈 방지 */
  min-width: fit-content; /* 내용에 맞게 크기 조정 */
  display: flex;
  align-items: center;
  gap: 4px;

  /* Material Icons 아이콘 크기 조정 */
  .material-icons {
    font-size: 16px;
  }

  /* ▼▼▼ 추가된 포커스 스타일 ▼▼▼ */
  &:focus {
    outline: none;
  }
  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(150, 160, 170, 0.6);
  }
`;

/* --- Form Controls --- */
export const ModalTextarea = styled.textarea`
    flex: 1;
    width: 100%;

    min-height: 200px;

    padding: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    background-color: #333842;
    resize: none;
    font-size: 16px;
    color: #e0e0e0;
    line-height: 1.6;
    outline: none;
    &:focus {
        outline: none;
        border-color: #4a90e2;
    }
`;

export const ButtonContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    flex-shrink: 0;
`;

export const ModalButton = styled.button`
    padding: 10px 20px;     /* 원래 크기로 복원 */
    border: none;
    border-radius: 8px;     /* 원래 둥근 모서리로 복원 */
    font-size: 16px;        /* 원래 글씨 크기로 복원 */
    cursor: pointer;
    transition: background-color 0.2s ease;
    white-space: nowrap;    /* 줄바꿈 방지 */
`;

export const SaveButton = styled(ModalButton)`
    background-color: #4a90e2;
    color: #fff;
    &:hover {
        background-color: #3b78c4;
    }
    &:disabled {
        background-color: #a0aec0;
        cursor: not-allowed;
    }
`;

export const CancelButton = styled(ModalButton)`
    background-color: #333842;
    color: #e0e0e0;
    border: 1px solid rgba(255, 255, 255, 0.1);
    &:hover {
        background-color: #3d424d;
    }
`;

export const DateText = styled.div`
    font-size: 10px;        /* 글씨 크기 더 축소 */
    color: #b0b0b0;
    width: 100%;
    text-align: left;       /* 좌측 정렬 */
    line-height: 1.4;
    margin-bottom: 12px;    /* 텍스트 입력창과의 간격 */
`;

/* --- Checkbox and Radio Controls --- */
export const ImportantCheckWrapper = styled.div`
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
    font-size: 14px;        /* 글씨 크기 축소 */
    color: #e0e0e0;
    flex-shrink: 0;
    white-space: nowrap;    /* 줄바꿈 방지 */
`;

export const ImportantRadioButton = styled.div`
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid ${props => props.$isImportant ? '#e53e3e' : 'rgba(255, 255, 255, 0.3)'};
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 8px;
    transition: border-color 0.2s ease;
`;

export const RadioInnerCircle = styled.div`
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: ${props => props.$isImportant ? '#e53e3e' : 'transparent'};
    transition: background-color 0.2s ease;
`;

export const RightButtonWrapper = styled.div`
    display: flex;
    gap: 8px;
`;

/* --- Grid Layout Containers --- */
export const TopGridContainer = styled.div`
    display: grid;
    /* 좌측 25%, 중앙 50%, 우측 25% 비율 */
    grid-template-columns: 2.5fr 5fr 2.5fr;
    align-items: center;
    gap: 6px;
    width: 100%;
    margin-bottom: 15px; /* 아래 줄과의 간격 */
`;

export const GridArea = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;  /* 버튼 사이 간격 */
`;

export const GridAreaLeft = styled(GridArea)`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 2px;     /* 버튼 간격 최소화 */
    overflow: hidden; /* 혹시 넘치면 잘리게 */
`;

export const GridAreaCenter = styled(GridArea)`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
`;

export const GridAreaRight = styled(GridArea)`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    height: 100%;
    overflow: hidden;   /* 셀 영역을 벗어나지 않도록 */
`;

export const SecondRowContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between; /* 양쪽 끝 정렬 */
    width: 100%;
    margin-bottom: 12px; /* 간격 축소 */
`;

/* --- Share and Folder Badges --- */
export const ShareButton = styled.button`
    background: rgba(94, 190, 38, 0.2);
    border: 1px solid rgba(94, 190, 38, 0.5);
    border-radius: 8px;
    padding: 8px 14px;      /* 패딩 증가 */
    color: #5ebe26;
    font-size: 14px;        /* 글씨 크기 증가 */
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;              /* 간격 증가 */
    transition: all 0.2s;
    white-space: nowrap;   /* 줄바꿈 방지 */
    flex-shrink: 0;        /* 축소 방지 */

    .material-icons {
        font-size: 16px;   /* 아이콘 크기 증가 */
    }

    &:hover {
        background: rgba(94, 190, 38, 0.3);
    }

    &:focus {
        outline: none;
    }
    &:focus-visible {
        box-shadow: 0 0 0 2px rgba(94, 190, 38, 0.5);
    }
`;

export const FolderBadge = styled.div`
    background: rgba(156, 39, 176, 0.15);
    border: 1px solid rgba(156, 39, 176, 0.3);
    border-radius: 8px;
    padding: 6px 12px;
    color: #ba68c8;
    font-size: 13px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
    flex-shrink: 0;
`;

export const SharedBadge = styled.div`
    background: ${props => props.$isPublic
        ? 'rgba(74, 144, 226, 0.2)'  // 공개방: 파란색
        : 'rgba(239, 83, 80, 0.2)'}; // 비공개방: 붉은색
    border: 1px solid ${props => props.$isPublic
        ? 'rgba(74, 144, 226, 0.5)'
        : 'rgba(239, 83, 80, 0.5)'};
    border-radius: 8px;
    padding: 8px 14px;
    color: ${props => props.$isPublic ? '#4a90e2' : '#ef5350'};
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    flex-shrink: 0;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;

    .material-icons {
        font-size: 16px;
    }

    &:hover {
        background: ${props => props.$isPublic
            ? 'rgba(74, 144, 226, 0.3)'
            : 'rgba(239, 83, 80, 0.3)'};
    }
`;

export const UnshareButton = styled.button`
    background: transparent;
    border: none;
    color: inherit;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin-left: 4px;
    opacity: 0.7;
    transition: opacity 0.2s;

    &:hover {
        opacity: 1;
    }

    .material-icons {
        font-size: 16px;
    }
`;

/* --- Confirmation Modal Styles --- */
export const ConfirmOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 11000;
    animation: ${fadeIn} 0.2s ease-out;
`;

export const ConfirmModalBox = styled.div`
    background: #2a2d35;
    border-radius: 12px;
    padding: 24px 30px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    animation: ${slideUp} 0.2s cubic-bezier(0.2, 0, 0, 1);
    width: 90vw;
    max-width: 350px;
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

export const ConfirmMessage = styled.p`
    font-size: 16px;
    color: #e0e0e0;
    margin: 0;
    line-height: 1.5;
    text-align: center;
    word-break: keep-all;
`;

export const ConfirmButtonWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    & > ${ModalButton} {
        flex: 1;
    }
`;

/* --- Toast Notification Styles --- */
export const ToastOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 12000;
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

/* --- Folder Selection Styles --- */
export const FolderSelectContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

export const FolderLabel = styled.span`
  color: #888;
  font-size: 13px;
  white-space: nowrap;
`;

export const FolderSelect = styled.select`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #e0e0e0;
  font-size: 14px;
  cursor: pointer;
  outline: none;

  &:focus {
    border-color: #4a90e2;
  }

  option {
    background: #2a2d35;
    color: #e0e0e0;
  }
`;

/* --- Read Mode Styles --- */
export const ReadModeHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding: 0;
    gap: 8px;
`;

export const ReadModeLeftButtons = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
`;

export const ReadModeRightButtons = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
`;

export const ReadModeButton = styled.button`
    padding: 6px 12px;
    border-radius: 6px;
    background: rgba(74, 144, 226, 0.15);
    border: 1px solid rgba(74, 144, 226, 0.3);
    color: #4a90e2;
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 13px;
    white-space: nowrap;

    &:hover {
        background: rgba(74, 144, 226, 0.25);
        border-color: rgba(74, 144, 226, 0.5);
    }

    &:active {
        transform: scale(0.95);
    }

    .material-icons {
        font-size: 16px;
    }
`;

export const CloseButton = styled(ReadModeButton)`
    background: rgba(158, 158, 158, 0.15);
    border-color: rgba(158, 158, 158, 0.3);
    color: #9e9e9e;

    &:hover {
        background: rgba(158, 158, 158, 0.25);
        border-color: rgba(158, 158, 158, 0.5);
    }
`;

export const ImportantButton = styled(ReadModeButton)`
    background: ${props => props.$isImportant ? 'rgba(239, 83, 80, 0.2)' : 'rgba(74, 144, 226, 0.15)'};
    border-color: ${props => props.$isImportant ? 'rgba(239, 83, 80, 0.4)' : 'rgba(74, 144, 226, 0.3)'};
    color: ${props => props.$isImportant ? '#ef5350' : '#4a90e2'};

    &:hover {
        background: ${props => props.$isImportant ? 'rgba(239, 83, 80, 0.3)' : 'rgba(74, 144, 226, 0.25)'};
        border-color: ${props => props.$isImportant ? 'rgba(239, 83, 80, 0.5)' : 'rgba(74, 144, 226, 0.5)'};
    }
`;

export const ShareBadge = styled.div`
    padding: 6px 10px;
    border-radius: 6px;
    background: rgba(94, 190, 38, 0.15);
    border: 1px solid rgba(94, 190, 38, 0.3);
    color: #5ebe26;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    white-space: nowrap;
    cursor: default;

    .material-icons {
        font-size: 16px;
    }
`;

export const FrozenBadge = styled.div`
    padding: 6px 10px;
    border-radius: 6px;
    background: rgba(74, 144, 226, 0.2);
    border: 1px solid #4a90e2;
    color: #4a90e2;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    white-space: nowrap;
    cursor: default;
    font-weight: 600;
`;

export const ImportantBadge = styled.div`
    padding: 6px 10px;
    border-radius: 6px;
    background: ${props => props.$isImportant ? 'rgba(239, 83, 80, 0.2)' : 'rgba(74, 144, 226, 0.15)'};
    border: 1px solid ${props => props.$isImportant ? 'rgba(239, 83, 80, 0.4)' : 'rgba(74, 144, 226, 0.3)'};
    color: ${props => props.$isImportant ? '#ef5350' : '#4a90e2'};
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    white-space: nowrap;
    cursor: default;

    .material-icons {
        font-size: 16px;
    }
`;

export const ReadModeContainer = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: ${props => props.$isImportant ? '35px 32px 40px 32px' : '35px 32px 40px 32px'};
    background: ${props => props.$isImportant
        ? 'linear-gradient(135deg, #2a1f23 0%, #3d2a2e 50%, #4a2d32 100%)'
        : 'linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 50%, #1e1e1e 100%)'};
    border-radius: 12px;
    margin: 0;
    color: ${props => props.$isImportant ? '#f5f5f5' : '#d0d0d0'};
    line-height: 1.9;
    font-size: 17px;
    font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
    white-space: pre-wrap;
    word-wrap: break-word;
    position: relative;
    user-select: text;
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
    box-sizing: border-box;

    /* 다크 노트북 질감 효과 */
    box-shadow: ${props => props.$isImportant
        ? 'inset 0 0 60px rgba(0, 0, 0, 0.4), inset 0 2px 8px rgba(0, 0, 0, 0.3)'
        : 'inset 0 0 60px rgba(0, 0, 0, 0.5), inset 0 2px 8px rgba(0, 0, 0, 0.4)'};

    /* 다크 노트 라인 효과 - 텍스트 라인과 정확히 맞춤 (17px * 1.9 = 32.3px) */
    background-image: ${props => props.$isImportant
        ? 'repeating-linear-gradient(transparent, transparent calc(17px * 1.9 - 1px), rgba(239, 83, 80, 0.08) calc(17px * 1.9 - 1px), rgba(239, 83, 80, 0.08) calc(17px * 1.9))'
        : 'repeating-linear-gradient(transparent, transparent calc(17px * 1.9 - 1px), rgba(255, 255, 255, 0.05) calc(17px * 1.9 - 1px), rgba(255, 255, 255, 0.05) calc(17px * 1.9))'};

    /* 스크롤바 스타일링 */
    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background: ${props => props.$isImportant ? 'rgba(239, 83, 80, 0.4)' : 'rgba(74, 144, 226, 0.4)'};
        border-radius: 4px;

        &:hover {
            background: ${props => props.$isImportant ? 'rgba(239, 83, 80, 0.6)' : 'rgba(74, 144, 226, 0.6)'};
        }
    }

    /* 이미지 스타일 - 작은 이미지는 원본 크기 유지, 큰 이미지만 100% */
    img {
        max-width: 100% !important;
        height: auto !important;
        border-radius: 8px;
        margin: 0.5em 0;
        cursor: pointer;
        box-sizing: border-box;
        display: block;
        /* 기본은 원본 크기 유지 (작은 이미지가 깨지지 않도록) */
        width: auto !important;
        /* 이미지가 컨테이너보다 큰 경우에만 축소 */
        object-fit: contain;
    }

    /* YouTube 영상 스타일 - 화면에 맞춤 */
    iframe {
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        aspect-ratio: 16 / 9 !important;
        border-radius: 8px;
        margin: 1em 0;
        box-sizing: border-box;
    }
`;

// 이미지 뷰어 모달
export const ImageViewerOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 500000;
    cursor: zoom-out;
    animation: fadeIn 0.2s ease-out;

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
`;

export const ImageViewerContent = styled.div`
    max-width: 95vw;
    max-height: 95vh;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: default;
`;

export const ImageViewerImage = styled.img`
    max-width: 100%;
    max-height: 95vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    cursor: zoom-in;
    touch-action: pinch-zoom;
    user-select: none;
`;

export const ImageViewerCloseButton = styled.button`
    position: fixed;
    top: 20px;
    right: 20px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    z-index: 500001;

    &:hover {
        background: rgba(255, 255, 255, 0.25);
        transform: rotate(90deg);
    }

    &:active {
        transform: rotate(90deg) scale(0.95);
    }
`;
