// src/components/MemoDetailModal.jsx

import React, { useState, useEffect, Fragment, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import Portal from './Portal';
// 🗑️ COLLABORATION REMOVED - 협업방 기능 제거됨
// import RoomSettingsModal from './collaboration/RoomSettingsModal';
// import CollaborationRoom from './collaboration/CollaborationRoom';
// import { createCollaborationRoom, checkMemoSharedStatus } from '../services/collaborationRoomService';
import { useMemoFolders } from '../hooks/useMemoFolders';

/* --- (1) 기존 스타일 및 애니메이션 (모두 동일) --- */
const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const slideUp = keyframes`
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
`;

const slideInFromLeft = keyframes`
    from { transform: translateX(-100%); opacity: 0.5; }
    to { transform: translateX(0); opacity: 1; }
`;

const slideInFromRight = keyframes`
    from { transform: translateX(100%); opacity: 0.5; }
    to { transform: translateX(0); opacity: 1; }
`;

const slideOutToLeft = keyframes`
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(-100%); opacity: 0.5; }
`;

const slideOutToRight = keyframes`
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0.5; }
`;

const Overlay = styled.div`
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

// 다음/이전 메모 미리보기 (배경에 흐릿하게 표시)
const PreviewMemoCard = styled.div`
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

const PreviewContent = styled.div`
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

const ModalContent = styled.div`
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

// ★★★ 수정: justify-content를 space-between으로 변경 ★★★
const HistoryButtonContainer = styled.div`
    position: relative;
    display: flex;
    /* 변경: 중앙 정렬로 고정 */
    justify-content: center;
    align-items: center;
    width: 100%;
    gap: 5px;
    margin-bottom: 15px;
`;

// ★★★ 추가: 중앙 버튼을 감싸는 컨테이너 ★★★
const CenterButtonWrapper = styled.div`
    display: flex;
    gap: 5px;
    justify-content: center;
    flex-grow: 1;
`;

const HistoryButton = styled.button`
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

// ★★★ 추가: 키보드 숨김 버튼 스타일 ★★★
const HideKeyboardButton = styled.button`
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

const ModalTextarea = styled.textarea`
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

const ButtonContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    flex-shrink: 0;
`;

const ModalButton = styled.button`
    padding: 10px 20px;     /* 원래 크기로 복원 */
    border: none;
    border-radius: 8px;     /* 원래 둥근 모서리로 복원 */
    font-size: 16px;        /* 원래 글씨 크기로 복원 */
    cursor: pointer;
    transition: background-color 0.2s ease;
    white-space: nowrap;    /* 줄바꿈 방지 */
`;

const SaveButton = styled(ModalButton)`
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

const CancelButton = styled(ModalButton)`
    background-color: #333842;
    color: #e0e0e0;
    border: 1px solid rgba(255, 255, 255, 0.1);
    &:hover {
        background-color: #3d424d;
    }
`;

const DateText = styled.div`
    font-size: 10px;        /* 글씨 크기 더 축소 */
    color: #b0b0b0;
    width: 100%;
    text-align: left;       /* 좌측 정렬 */
    line-height: 1.4;
    margin-bottom: 12px;    /* 텍스트 입력창과의 간격 */
`;

const ImportantCheckWrapper = styled.div`
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
    font-size: 14px;        /* 글씨 크기 축소 */
    color: #e0e0e0;
    flex-shrink: 0;
    white-space: nowrap;    /* 줄바꿈 방지 */
`;

const ImportantRadioButton = styled.div`
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

const RadioInnerCircle = styled.div`
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: ${props => props.$isImportant ? '#e53e3e' : 'transparent'};
    transition: background-color 0.2s ease;
`;

const RightButtonWrapper = styled.div`
    display: flex;
    gap: 8px;
`;

// 1. 상단 30-40-30 그리드 컨테이너
const TopGridContainer = styled.div`
    display: grid;
    /* 좌측 25%, 중앙 50%, 우측 25% 비율 */
    grid-template-columns: 2.5fr 5fr 2.5fr;
    align-items: center;
    gap: 6px;
    width: 100%;
    margin-bottom: 15px; /* 아래 줄과의 간격 */
`;

// 2. 그리드 각 영역의 정렬을 위한 컨테이너
const GridArea = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;  /* 버튼 사이 간격 */
`;

const GridAreaLeft = styled(GridArea)`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 2px;     /* 버튼 간격 최소화 */
    overflow: hidden; /* 혹시 넘치면 잘리게 */
`;

const GridAreaCenter = styled(GridArea)`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
`;

const GridAreaRight = styled(GridArea)`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    height: 100%;
    overflow: hidden;   /* 셀 영역을 벗어나지 않도록 */
`;

// 3. '중요'와 '공유'를 담는 두 번째 줄 컨테이너
const SecondRowContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between; /* 양쪽 끝 정렬 */
    width: 100%;
    margin-bottom: 12px; /* 간격 축소 */
`;

// 공유 버튼 스타일
const ShareButton = styled.button`
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

// 폴더명 뱃지 스타일
const FolderBadge = styled.div`
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

// 공유됨 뱃지 스타일
const SharedBadge = styled.div`
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

const UnshareButton = styled.button`
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

/* --- (2) 커스텀 확인 모달 스타일 (기존과 동일) --- */
const ConfirmOverlay = styled.div`
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

const ConfirmModalBox = styled.div`
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

const ConfirmMessage = styled.p`
    font-size: 16px;
    color: #e0e0e0;
    margin: 0;
    line-height: 1.5;
    text-align: center;
    word-break: keep-all;
`;

const ConfirmButtonWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    & > ${ModalButton} {
        flex: 1;
    }
`;

/* --- (3) 수정 완료 토스트 스타일 추가 --- */
const ToastOverlay = styled.div`
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

const ToastBox = styled.div`
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 16px 24px;
  border-radius: 8px;
  font-size: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  animation: ${slideUp} 0.3s cubic-bezier(0.2, 0, 0, 1);
`;

/* --- 폴더 선택 스타일 --- */
const FolderSelectContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

const FolderLabel = styled.span`
  color: #888;
  font-size: 13px;
  white-space: nowrap;
`;

const FolderSelect = styled.select`
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
/* --- 스타일 추가 완료 --- */

// ✨ 읽기 모드 스타일
const ReadModeHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding: 0;
    gap: 8px;
`;

const ReadModeLeftButtons = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
`;

const ReadModeRightButtons = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
`;

const ReadModeButton = styled.button`
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

const CloseButton = styled(ReadModeButton)`
    background: rgba(158, 158, 158, 0.15);
    border-color: rgba(158, 158, 158, 0.3);
    color: #9e9e9e;

    &:hover {
        background: rgba(158, 158, 158, 0.25);
        border-color: rgba(158, 158, 158, 0.5);
    }
`;

const ImportantButton = styled(ReadModeButton)`
    background: ${props => props.$isImportant ? 'rgba(239, 83, 80, 0.2)' : 'rgba(74, 144, 226, 0.15)'};
    border-color: ${props => props.$isImportant ? 'rgba(239, 83, 80, 0.4)' : 'rgba(74, 144, 226, 0.3)'};
    color: ${props => props.$isImportant ? '#ef5350' : '#4a90e2'};

    &:hover {
        background: ${props => props.$isImportant ? 'rgba(239, 83, 80, 0.3)' : 'rgba(74, 144, 226, 0.25)'};
        border-color: ${props => props.$isImportant ? 'rgba(239, 83, 80, 0.5)' : 'rgba(74, 144, 226, 0.5)'};
    }
`;

const ShareBadge = styled.div`
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

const ImportantBadge = styled.div`
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

const ReadModeContainer = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: ${props => props.$isImportant ? '40px 32px 40px 48px' : '40px 32px 40px 48px'};
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

    /* 다크 노트북 질감 효과 */
    box-shadow: ${props => props.$isImportant
        ? 'inset 0 0 60px rgba(0, 0, 0, 0.4), inset 0 2px 8px rgba(0, 0, 0, 0.3)'
        : 'inset 0 0 60px rgba(0, 0, 0, 0.5), inset 0 2px 8px rgba(0, 0, 0, 0.4)'};

    /* 노트북 왼쪽 여백선 */
    &::before {
        content: '';
        position: absolute;
        left: 32px;
        top: 0;
        bottom: 0;
        width: 2px;
        background: ${props => props.$isImportant
            ? 'rgba(239, 83, 80, 0.4)'
            : 'rgba(74, 144, 226, 0.4)'};
    }

    /* 다크 노트 라인 효과 */
    background-image: ${props => props.$isImportant
        ? 'repeating-linear-gradient(transparent, transparent 31px, rgba(239, 83, 80, 0.08) 31px, rgba(239, 83, 80, 0.08) 32px)'
        : 'repeating-linear-gradient(transparent, transparent 31px, rgba(255, 255, 255, 0.05) 31px, rgba(255, 255, 255, 0.05) 32px)'};

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
`;


const MemoDetailModal = ({
    isOpen,
    memo,
    memos = [], // 전체 메모 목록 (스와이프 네비게이션용)
    onSave,
    onDelete,
    onClose,
    onCancel,
    onUpdateMemoFolder,
    showToast,
    onNavigate, // 다른 메모로 이동 시 호출되는 콜백
}) => {
    const [editedContent, setEditedContent] = useState('');
    const [isImportant, setIsImportant] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [selectedFolderId, setSelectedFolderId] = useState(null); // 폴더 선택

    // ✨ 읽기/편집 모드 상태
    const [isEditMode, setIsEditMode] = useState(false);

    // ✨ 더블탭 감지 상태
    const [lastTap, setLastTap] = useState(0);

    // ✨ 원본 중요도 상태 (취소 시 복원용)
    const [originalIsImportant, setOriginalIsImportant] = useState(false);

    // 스와이프 상태
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [slideDirection, setSlideDirection] = useState(null); // 'left' | 'right' | null

    // 폴더 목록 가져오기
    const { folders } = useMemoFolders();
    // 🗑️ COLLABORATION REMOVED - 협업방 관련 state 제거됨
    // const [isRoomSettingsOpen, setIsRoomSettingsOpen] = useState(false);
    // const [isCollaborationRoomOpen, setIsCollaborationRoomOpen] = useState(false);
    // const [currentRoomId, setCurrentRoomId] = useState(null);
    const [isShared, setIsShared] = useState(false); // 공유 상태 (폴더 이동용)
    // const [sharedRoom, setSharedRoom] = useState(null); // 공유된 방 정보
    // ★★★ 추가: 키보드 활성화 상태를 관리하는 state ★★★
    const [isKeyboardActive, setIsKeyboardActive] = useState(false);

    const [confirmModalState, setConfirmModalState] = useState({
        isOpen: false,
        message: '',
        onConfirm: () => {},
    });

    const [toastMessage, setToastMessage] = useState(null);
    const textareaRef = useRef(null);
    const modalContentRef = useRef(null);

    useEffect(() => {
        if (isOpen && memo) {
            // 모달이 처음 열리거나 다른 메모로 변경될 때만 초기화
            setEditedContent(memo.content);
            setIsImportant(memo.isImportant);
            setOriginalIsImportant(memo.isImportant); // 원본 중요도 저장
            setSelectedFolderId(memo.folderId || null); // 폴더 ID 초기화
            const initialHistory = [memo.content];
            setHistory(initialHistory);
            setHistoryIndex(0);

            closeConfirmModal();
            setToastMessage(null);

            // ✨ 읽기 모드로 초기화 (편집 모드가 아닐 때만)
            if (!isEditMode) {
                setIsEditMode(false);
            }
            setLastTap(0);

            if (textareaRef.current) {
                textareaRef.current.blur();
            }
            // ★★★ 추가: 모달이 닫힐 때 키보드 상태를 초기화 ★★★
            setIsKeyboardActive(false);

            // 공유 상태 확인 (folderId 기반)
            setIsShared(memo.folderId === 'shared');

            // 🗑️ COLLABORATION REMOVED - 협업방 상태 확인 제거됨
            // 협업방 상태 확인 (참고용 기능 - 현재 비활성화)
            // const checkSharedStatus = async () => {
            //     try {
            //         const result = await checkMemoSharedStatus(memo.id);
            //         setSharedRoom(result.room);
            //     } catch (error) {
            //         console.error('공유 상태 확인 오류:', error);
            //         setSharedRoom(null);
            //     }
            // };
            // checkSharedStatus();
        }
    }, [isOpen, memo]);
    
    if (!isOpen || !memo) {
        return null;
    }

    const handleContentChange = (e) => {
        const newContent = e.target.value;
        setEditedContent(newContent);

        // 히스토리 중간에서 수정한 경우, 이후 히스토리 삭제
        const newHistory = history.slice(0, historyIndex + 1);

        // 마지막 항목과 동일하지 않을 때만 추가
        if (newHistory[newHistory.length - 1] !== newContent) {
            newHistory.push(newContent);
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }
    };

    const handleDoubleClick = () => {
    if (isPristine) {
        handleCancelClick(); // 변경 없으면 닫기
    } else {
        handleSaveClick();   // 변경 있으면 저장
    }
    };   

    const executeSaveAndShowToast = () => {
        onSave(memo.id, editedContent, isImportant, selectedFolderId);
        setOriginalIsImportant(isImportant); // 저장 후 원본 중요도 업데이트
        setToastMessage("메모를 수정했습니다.");
        setTimeout(() => {
            setToastMessage(null);
            setIsEditMode(false); // 읽기 모드로 전환
        }, 1000);
    };

    const handleSaveClick = () => {
        setConfirmModalState({
            isOpen: true,
            message: "변경된 내용으로 수정하시겠습니까?",
            onConfirm: executeSaveAndShowToast,
        });
    };

    // 내용 또는 중요도가 변경되었는지 확인
    const isPristine = editedContent === memo.content && isImportant === originalIsImportant;

    const handleCancelClick = () => {
        // 읽기 모드에서는 바로 닫기
        if (!isEditMode) {
            onCancel();
            return;
        }

        // 편집 모드에서는 읽기 모드로 전환
        if (!isPristine) {
            setConfirmModalState({
                isOpen: true,
                message: "변경사항을 저장하지 않고 읽기 모드로 돌아가시겠습니까?",
                onConfirm: () => {
                    setEditedContent(memo.content); // 원래 내용으로 복원
                    setIsImportant(originalIsImportant); // 원래 중요도로 복원
                    setIsEditMode(false);
                },
            });
        } else {
            setIsEditMode(false);
        }
    };
    
    const closeConfirmModal = () => {
        setConfirmModalState({
            isOpen: false,
            message: '',
            onConfirm: () => {},
        });
    };
    const handleConfirmAction = () => {
        confirmModalState.onConfirm();
        closeConfirmModal();
    };

    // 스와이프 네비게이션 로직
    const getCurrentMemoIndex = () => {
        if (!memo || memos.length === 0) return -1;
        return memos.findIndex(m => m.id === memo.id);
    };

    const canNavigatePrev = () => {
        const currentIndex = getCurrentMemoIndex();
        return currentIndex > 0;
    };

    const canNavigateNext = () => {
        const currentIndex = getCurrentMemoIndex();
        return currentIndex < memos.length - 1 && currentIndex !== -1;
    };

    const navigateToPrevMemo = () => {
        const currentIndex = getCurrentMemoIndex();
        if (canNavigatePrev()) {
            const prevMemo = memos[currentIndex - 1];
            setSlideDirection('right'); // 오른쪽으로 슬라이드
            // 애니메이션이 완전히 끝난 후(250ms) 내용 변경
            setTimeout(() => {
                onNavigate && onNavigate(prevMemo);
                setSlideDirection(null);
            }, 250);
        }
    };

    const navigateToNextMemo = () => {
        const currentIndex = getCurrentMemoIndex();
        if (canNavigateNext()) {
            const nextMemo = memos[currentIndex + 1];
            setSlideDirection('left'); // 왼쪽으로 슬라이드
            // 애니메이션이 완전히 끝난 후(250ms) 내용 변경
            setTimeout(() => {
                onNavigate && onNavigate(nextMemo);
                setSlideDirection(null);
            }, 250);
        }
    };

    // ✨ 더블탭으로 편집 모드 전환
    const handleDoubleTap = () => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (lastTap && (now - lastTap < DOUBLE_TAP_DELAY)) {
            // 더블탭 감지됨
            setIsEditMode(true);
            setLastTap(0); // 다음 더블탭을 위해 리셋
        } else {
            // 첫 번째 탭 또는 시간 초과
            setLastTap(now);
        }
    };

    // 스와이프 이벤트 핸들러 (읽기 모드에서만 작동)
    const handleTouchStart = (e) => {
        // ✨ 편집 모드에서는 스와이프 비활성화
        if (isEditMode) return;

        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
        // 초기에는 스와이프로 간주하지 않음 (탭일 수도 있으므로)
        setIsSwiping(false);
    };

    const handleTouchMove = (e) => {
        // ✨ 편집 모드에서는 스와이프 비활성화
        if (isEditMode) return;
        if (!touchStart) return;

        const currentTouch = e.targetTouches[0].clientX;
        const diff = currentTouch - touchStart;

        // 좌우로 10px 이상 움직였을 때만 스와이프로 간주
        if (Math.abs(diff) > 10) {
            // 스와이프 시작
            if (!isSwiping) {
                setIsSwiping(true);
            }

            // 이전 메모가 없으면 오른쪽 스와이프 제한
            if (diff > 0 && !canNavigatePrev()) {
                setSwipeOffset(Math.min(diff * 0.2, 50)); // 최대 50px까지만
            }
            // 다음 메모가 없으면 왼쪽 스와이프 제한
            else if (diff < 0 && !canNavigateNext()) {
                setSwipeOffset(Math.max(diff * 0.2, -50)); // 최대 -50px까지만
            }
            // 정상적인 스와이프
            else {
                setSwipeOffset(diff);
            }
        }

        setTouchEnd(currentTouch);
    };

    const handleTouchEnd = () => {
        // ✨ 편집 모드에서는 스와이프 비활성화
        if (isEditMode) return;

        if (!touchStart) {
            setIsSwiping(false);
            setSwipeOffset(0);
            return;
        }

        // 스와이프가 아니라 단순 탭이었다면 (10px 미만 이동)
        if (!isSwiping || !touchEnd || Math.abs(touchStart - touchEnd) < 10) {
            // ✨ 읽기 모드에서 탭 감지 → 더블탭 체크
            handleDoubleTap();

            setIsSwiping(false);
            setSwipeOffset(0);
            setTouchStart(null);
            setTouchEnd(null);
            return;
        }

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe && canNavigateNext()) {
            navigateToNextMemo();
        } else if (isRightSwipe && canNavigatePrev()) {
            navigateToPrevMemo();
        }

        setIsSwiping(false);
        setSwipeOffset(0);
        setTouchStart(null);
        setTouchEnd(null);
    };

    const handleImportantToggle = () => {
        const newImportance = !isImportant;
        setIsImportant(newImportance);
        // 중요도 변경은 저장 버튼을 눌러야 저장됨 (편집창은 유지)
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setEditedContent(history[newIndex]);
            setHistoryIndex(newIndex);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setEditedContent(history[newIndex]);
            setHistoryIndex(newIndex);
        }
    };

    // ★★★ onFocus와 onBlur 이벤트 핸들러 추가 ★★★
    const handleTextareaFocus = () => {
        setIsKeyboardActive(true);
        if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = textareaRef.current.value.length;
        }
    };

    const handleTextareaBlur = () => {
        setIsKeyboardActive(false);
    };

    // ★★★ 추가: 키보드 숨김 버튼 클릭 핸들러 ★★★
    const handleHideKeyboardClick = () => {
        if (textareaRef.current) {
            textareaRef.current.blur();
        }
    };

    // 공유 버튼 클릭: 확인 모달 표시
    const handleShareClick = () => {
        setConfirmModalState({
            isOpen: true,
            message: '이 문서를 공유 폴더로 이동할까요?',
            onConfirm: () => {
                // 메모를 공유 폴더로 이동
                if (onUpdateMemoFolder) {
                    onUpdateMemoFolder(memo.id, 'shared', true); // savePrevious = true (원래 폴더 정보 저장)
                    setSelectedFolderId('shared'); // UI 업데이트
                    showToast?.('메모가 공유 폴더로 이동되었습니다');
                }
                closeConfirmModal();
            }
        });
    };

    // 공유 해제: 미분류로 이동
    const handleUnshareClick = () => {
        setConfirmModalState({
            isOpen: true,
            message: '이 문서를 미분류 문서로 이동할까요?',
            onConfirm: () => {
                // 메모를 미분류(null)로 이동
                if (onUpdateMemoFolder) {
                    onUpdateMemoFolder(memo.id, null, false); // folderId를 null로 설정
                    setSelectedFolderId(null); // UI 업데이트
                    showToast?.('메모가 미분류 문서로 이동되었습니다');
                }
                closeConfirmModal();
            }
        });
    };

    // 🗑️ COLLABORATION REMOVED - 협업방 함수 제거됨
    // const handleRoomSettingsConfirm = async (settings) => {
    //     try {
    //         const roomId = await createCollaborationRoom(...);
    //         ...
    //     } catch (error) {
    //         console.error('협업방 생성 실패:', error);
    //     }
    // };

    // const handleCloseCollaborationRoom = () => {
    //     setIsCollaborationRoomOpen(false);
    //     setCurrentRoomId(null);
    // };

    // 다음/이전 메모 가져오기
    const getPrevMemo = () => {
        const currentIndex = getCurrentMemoIndex();
        return currentIndex > 0 ? memos[currentIndex - 1] : null;
    };

    const getNextMemo = () => {
        const currentIndex = getCurrentMemoIndex();
        return currentIndex < memos.length - 1 && currentIndex !== -1 ? memos[currentIndex + 1] : null;
    };

    const prevMemo = getPrevMemo();
    const nextMemo = getNextMemo();

    return (
      <Portal>
        <Fragment>
            <Overlay>
                {/* 이전 메모 미리보기 (오른쪽에서 대기, 스와이프 시 함께 이동) */}
                {prevMemo && swipeOffset > 0 && (
                    <PreviewMemoCard
                        $offset={swipeOffset - window.innerWidth}
                        $isImportant={prevMemo.isImportant}
                    >
                        <PreviewContent>
                            {prevMemo.text}
                        </PreviewContent>
                    </PreviewMemoCard>
                )}

                {/* 다음 메모 미리보기 (왼쪽에서 대기, 스와이프 시 함께 이동) */}
                {nextMemo && swipeOffset < 0 && (
                    <PreviewMemoCard
                        $offset={swipeOffset + window.innerWidth}
                        $isImportant={nextMemo.isImportant}
                    >
                        <PreviewContent>
                            {nextMemo.text}
                        </PreviewContent>
                    </PreviewMemoCard>
                )}

                <ModalContent
                    ref={modalContentRef}
                    $isImportant={isImportant}
                    $swipeOffset={swipeOffset}
                    $isSwiping={isSwiping}
                    $slideDirection={slideDirection}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* ✨ 읽기 모드 */}
                    {!isEditMode ? (
                        <>
                            {/* 읽기 모드 헤더 - 모든 버튼을 한 줄로 */}
                            <ReadModeHeader>
                                <ReadModeLeftButtons>
                                    <CloseButton onClick={handleCancelClick}>
                                        <span className="material-icons">close</span>
                                    </CloseButton>
                                    {isImportant && (
                                        <ImportantBadge $isImportant={isImportant}>
                                            <span className="material-icons">star</span>
                                        </ImportantBadge>
                                    )}
                                    {isShared && (
                                        <ShareBadge>
                                            <span className="material-icons">share</span>
                                        </ShareBadge>
                                    )}
                                </ReadModeLeftButtons>
                                <ReadModeRightButtons>
                                    <ReadModeButton onClick={() => setIsEditMode(true)}>
                                        <span className="material-icons">edit</span>
                                    </ReadModeButton>
                                </ReadModeRightButtons>
                            </ReadModeHeader>

                            {/* 날짜 정보 */}
                            <DateText>
                                {memo.createdAt && (
                                    <>
                                        최초 등록일: {new Date(memo.createdAt).toLocaleString('ko-KR', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                            hour12: false
                                        }).replace(/\. /g, '. ').replace(/\.$/, '')}
                                        {memo.updatedAt && memo.updatedAt !== memo.createdAt && ' / '}
                                    </>
                                )}
                                {memo.updatedAt && memo.createdAt && memo.updatedAt !== memo.createdAt && (
                                    <>
                                        최종 수정일: {new Date(memo.updatedAt).toLocaleString('ko-KR', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                            hour12: false
                                        }).replace(/\. /g, '. ').replace(/\.$/, '')}
                                    </>
                                )}
                            </DateText>

                            {/* 읽기 모드 컨텐츠 */}
                            <ReadModeContainer
                                $isImportant={isImportant}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                            >
                                {editedContent}
                            </ReadModeContainer>
                        </>
                    ) : (
                        <>
                            {/* ✨ 편집 모드 - 기존 UI */}
                            {/* 1. 새로운 상단 그리드 */}
                            <TopGridContainer>
                        {/* 좌측: 되돌리기/다시실행 */}
                        <GridAreaLeft>
                            <HistoryButton onClick={handleUndo} disabled={historyIndex === 0}>
                                <span className="material-icons">undo</span>
                            </HistoryButton>
                            <HistoryButton onClick={handleRedo} disabled={historyIndex === history.length - 1}>
                                <span className="material-icons">redo</span>
                            </HistoryButton>
                        </GridAreaLeft>

                        {/* 중앙: 취소/수정 버튼 */}
                        <GridAreaCenter>
                            <CancelButton onClick={handleCancelClick}>
                                {isPristine ? '닫기' : '취소'}
                            </CancelButton>
                            <SaveButton onClick={handleSaveClick} disabled={isPristine}>
                                수정
                            </SaveButton>
                        </GridAreaCenter>
                        
                        {/* 우측: 자판 숨김 버튼 */}
                        <GridAreaRight>
                            {isKeyboardActive && (
                                <HideKeyboardButton onClick={handleHideKeyboardClick}>
                                    <span className="material-icons">keyboard_hide</span>
                                    숨김
                                </HideKeyboardButton>
                            )}
                        </GridAreaRight>
                    </TopGridContainer>

                    {/* 2. 새로운 두 번째 줄 - 중요와 공유 */}
                    <SecondRowContainer>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '50px', flex: 1 }}>
                            {/* 중요 체크박스 */}
                            <ImportantCheckWrapper onClick={handleImportantToggle}>
                                <ImportantRadioButton $isImportant={isImportant}>
                                    <RadioInnerCircle $isImportant={isImportant} />
                                </ImportantRadioButton>
                                중요
                            </ImportantCheckWrapper>

                            {/* 폴더명 뱃지 - 폴더가 있을 때만 표시 */}
                            {selectedFolderId && (() => {
                                const currentFolder = folders.find(f => f.id === selectedFolderId);
                                return currentFolder ? (
                                    <FolderBadge>
                                        {currentFolder.icon} {currentFolder.name}
                                    </FolderBadge>
                                ) : null;
                            })()}
                        </div>

                        {/* 공유 버튼 또는 공유 해제 버튼 */}
                        {isShared ? (
                            <ShareButton onClick={handleUnshareClick}>
                                <span className="material-icons">close</span>
                                공유 해제
                            </ShareButton>
                        ) : (
                            <ShareButton onClick={handleShareClick}>
                                <span className="material-icons">share</span>
                                공유
                            </ShareButton>
                        )}
                    </SecondRowContainer>

                    {/* 날짜 정보 */}
                    <DateText>
                        {memo.createdAt && (
                            <>
                                최초 등록일: {new Date(memo.createdAt).toLocaleString('ko-KR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: false
                                }).replace(/\. /g, '. ').replace(/\.$/, '')}
                                {memo.updatedAt && memo.updatedAt !== memo.createdAt && ' / '}
                            </>
                        )}
                        {memo.updatedAt && memo.createdAt && memo.updatedAt !== memo.createdAt && (
                            <>
                                최종 수정일: {new Date(memo.updatedAt).toLocaleString('ko-KR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: false
                                }).replace(/\. /g, '. ').replace(/\.$/, '')}
                            </>
                        )}
                    </DateText>

                    <ModalTextarea
                        ref={textareaRef}
                        value={editedContent}
                        onChange={handleContentChange}
                        onFocus={handleTextareaFocus}
                        onBlur={handleTextareaBlur}
                        onDoubleClick={handleDoubleClick}
                    />
                        </>
                    )}
                </ModalContent>
            </Overlay>

            {confirmModalState.isOpen && (
                <ConfirmOverlay>
                    <ConfirmModalBox onClick={e => e.stopPropagation()}>
                        <ConfirmMessage>
                            {confirmModalState.message}
                        </ConfirmMessage>
                        <ConfirmButtonWrapper>
                            <CancelButton onClick={closeConfirmModal}>아니요</CancelButton>
                            <SaveButton onClick={handleConfirmAction}>예</SaveButton>
                        </ConfirmButtonWrapper>
                    </ConfirmModalBox>
                </ConfirmOverlay>
            )}

            {toastMessage && (
                <ToastOverlay>
                    <ToastBox>
                        {toastMessage}
                    </ToastBox>
                </ToastOverlay>
            )}

            {/* 🗑️ COLLABORATION REMOVED - 협업방 UI 제거됨 */}
            {/* <RoomSettingsModal
                isOpen={isRoomSettingsOpen}
                onClose={() => setIsRoomSettingsOpen(false)}
                onConfirm={handleRoomSettingsConfirm}
                defaultTitle={memo?.content?.substring(0, 50) || '제목 없음'}
            /> */}

            {/* {isCollaborationRoomOpen && currentRoomId && (
                <CollaborationRoom
                    roomId={currentRoomId}
                    onClose={handleCloseCollaborationRoom}
                    showToast={(message) => {
                        setToastMessage(message);
                        setTimeout(() => setToastMessage(null), 2000);
                    }}
                />
            )} */}
        </Fragment>
      </Portal>
    );
};

export default MemoDetailModal;