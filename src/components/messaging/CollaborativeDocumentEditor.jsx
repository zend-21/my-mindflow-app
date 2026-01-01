// 📝 실시간 협업 문서 편집기 (모바일 최적화)
// 드래그 선택 → 입력 → 자동 형광표시 → 매니저 컨펌 시스템
import { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { ChevronDown, ChevronUp, Save, X, Users, Lock, FolderOpen, Info, Strikethrough, Highlighter, MessageSquare, Maximize2, Eye, Download, Check, FileText, CheckCircle, RotateCcw } from 'lucide-react';
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from '../../firebase/config';

// 스타일 컴포넌트들 (기존과 유사하지만 contentEditable용으로 수정)
const EditorContainer = styled.div`
  position: relative;
  background: linear-gradient(180deg, #2a2d35, #1f2128);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-bottom: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  height: ${props => props.$collapsed ? '56px' : 'auto'};
`;

const EditorHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

const DocumentIcon = styled.div`
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #4a90e2, #357abd);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
`;

const TitleInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.08);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PermissionBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: ${props => {
    if (props.$type === 'manager') return 'rgba(46, 213, 115, 0.15)';
    if (props.$type === 'editor') return 'rgba(74, 144, 226, 0.15)';
    return 'rgba(255, 255, 255, 0.05)';
  }};
  border-radius: 6px;
  color: ${props => {
    if (props.$type === 'manager') return '#2ed573';
    if (props.$type === 'editor') return '#4a90e2';
    return '#888';
  }};
  font-size: 12px;
  font-weight: 600;
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  color: #888;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ToggleButton = styled(IconButton)`
  color: #4a90e2;

  &:hover {
    background: rgba(74, 144, 226, 0.15);
  }
`;

const EditorContent = styled.div`
  display: ${props => props.$collapsed ? 'none' : 'flex'};
  flex-direction: column;
  height: calc(100% - 56px);
  padding: 16px;
  gap: 12px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  flex-wrap: wrap;
`;

const ToolbarButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SaveButton = styled(ToolbarButton)`
  background: linear-gradient(135deg, #2ed573, #26bf62);
  border: none;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(46, 213, 115, 0.3);
  }
`;

const LoadButton = styled(ToolbarButton)`
  background: rgba(74, 144, 226, 0.15);
  border: 1px solid rgba(74, 144, 226, 0.3);
  color: #4a90e2;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover:not(:disabled) {
    background: rgba(74, 144, 226, 0.25);
  }
`;

// contentEditable 영역 (형광펜 표시 포함)
const ContentEditableArea = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  padding: 16px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.8;
  height: 400px;
  overflow-y: auto;
  cursor: default;
  transition: all 0.2s;
  user-select: text;

  /* Placeholder 스타일 (빈 상태일 때) */
  &:empty::before {
    content: '문서가 비어 있습니다...';
    color: #666;
    pointer-events: none;
  }

  /* 형광펜 스타일 (pending 상태) */
  .highlight {
    background: linear-gradient(180deg, rgba(255, 235, 59, 0.35), rgba(255, 193, 7, 0.35));
    border-bottom: 2px solid #ffc107;
    cursor: pointer;
    position: relative;
    padding: 2px 4px;
    border-radius: 3px;
    transition: all 0.2s;

    &:hover {
      background: linear-gradient(180deg, rgba(255, 235, 59, 0.5), rgba(255, 193, 7, 0.5));
    }
  }

  /* 컨펌된 수정 (형광펜 제거) */
  .highlight-confirmed {
    background: none;
    border-bottom: none;
    padding: 0;
  }

  /* 취소선 스타일 (삭제 표시) */
  .strikethrough {
    text-decoration: line-through;
    text-decoration-color: #ff5757;
    text-decoration-thickness: 2px;
    background: rgba(255, 87, 87, 0.1);
    padding: 2px 4px;
    border-radius: 3px;
    cursor: pointer;
    position: relative;
    opacity: 0.7;
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 87, 87, 0.2);
      opacity: 1;
    }
  }

  /* 주석 표시 스타일 */
  .comment {
    background: rgba(139, 92, 246, 0.15);
    border-bottom: 2px dotted #8b5cf6;
    padding: 2px 4px;
    border-radius: 3px;
    cursor: pointer;
    position: relative;
    transition: all 0.2s;

    &:hover {
      background: rgba(139, 92, 246, 0.25);
    }

    &::after {
      content: '💬';
      font-size: 10px;
      margin-left: 2px;
      vertical-align: super;
    }
  }

  /* 스크롤바 */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  font-size: 12px;
  color: #888;
  gap: 12px;
  flex-wrap: wrap;
`;

const PendingEditsCount = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(255, 193, 7, 0.15);
  border-radius: 6px;
  color: #ffc107;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 193, 7, 0.25);
  }
`;

// 수정 이력 모달 (전체 화면 편집 모달보다 위에 표시)
const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  z-index: 400000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: linear-gradient(180deg, #2a2d35, #1f2128);
  border-radius: 16px;
  padding: 24px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const EditInfo = styled.div`
  background: rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #888;

  &:last-child {
    margin-bottom: 0;
  }

  strong {
    color: #ffffff;
    font-weight: 600;
  }
`;

const TextComparison = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ComparisonBox = styled.div`
  padding: 12px;
  border-radius: 8px;
  background: ${props => props.$type === 'old'
    ? 'rgba(255, 87, 87, 0.1)'
    : 'rgba(46, 213, 115, 0.1)'};
  border: 1px solid ${props => props.$type === 'old'
    ? 'rgba(255, 87, 87, 0.3)'
    : 'rgba(46, 213, 115, 0.3)'};
`;

const ComparisonLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.$type === 'old' ? '#ff5757' : '#2ed573'};
  margin-bottom: 8px;
`;

const ComparisonText = styled.div`
  color: #e0e0e0;
  line-height: 1.6;
  word-break: break-word;
`;

// 전체 화면 편집 모달
const FullScreenModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  z-index: 300000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1vh;
`;

const FullScreenEditorContainer = styled.div`
  width: 98%;
  height: 98%;
  background: linear-gradient(180deg, #2a2d35, #1f2128);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`;

const FullScreenHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
`;

const FullScreenTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
`;

const FullScreenTitleInput = styled.input`
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.1);
    border-color: #4a90e2;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const FullScreenToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-wrap: wrap;
  flex-shrink: 0;
`;

const FullScreenContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const FullScreenEditArea = styled.div`
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  color: #e0e0e0;
  padding: 24px;
  font-size: 16px;
  line-height: 1.8;
  overflow-y: auto;
  cursor: text;

  &:focus {
    outline: none;
  }

  /* Placeholder 스타일 */
  &:empty::before {
    content: '문서 내용을 입력하세요...';
    color: #666;
    pointer-events: none;
  }

  /* 취소선 스타일 */
  .strikethrough {
    text-decoration: line-through;
    text-decoration-color: #ff5757;
    text-decoration-thickness: 2px;
    background: rgba(255, 87, 87, 0.1);
    padding: 2px 4px;
    border-radius: 3px;
    cursor: pointer;
    position: relative;
    opacity: 0.7;
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 87, 87, 0.2);
      opacity: 1;
    }
  }

  /* 형광펜 스타일 */
  .highlight {
    background: linear-gradient(180deg, rgba(255, 235, 59, 0.35), rgba(255, 193, 7, 0.35));
    border-bottom: 2px solid #ffc107;
    cursor: pointer;
    position: relative;
    padding: 2px 4px;
    border-radius: 3px;
    transition: all 0.2s;

    &:hover {
      background: linear-gradient(180deg, rgba(255, 235, 59, 0.5), rgba(255, 193, 7, 0.5));
    }
  }

  .highlight-confirmed {
    background: none;
    border-bottom: none;
    padding: 0;
  }

  /* 주석 스타일 */
  .comment {
    background: rgba(139, 92, 246, 0.15);
    border-bottom: 2px dotted #8b5cf6;
    padding: 2px 4px;
    border-radius: 3px;
    cursor: pointer;
    position: relative;
    transition: all 0.2s;

    &:hover {
      background: rgba(139, 92, 246, 0.25);
    }

    &::after {
      content: '💬';
      font-size: 12px;
      margin-left: 4px;
      vertical-align: super;
    }
  }

  /* 스크롤바 */
  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 5px;
  }
`;

const FullScreenFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 13px;
  color: #888;
  flex-shrink: 0;
`;

const EditButton = styled(ToolbarButton)`
  background: rgba(74, 144, 226, 0.15);
  border: 1px solid rgba(74, 144, 226, 0.3);
  color: #4a90e2;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover:not(:disabled) {
    background: rgba(74, 144, 226, 0.25);
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
`;

const ConfirmButton = styled.button`
  flex: 1;
  background: linear-gradient(135deg, #2ed573, #26bf62);
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(46, 213, 115, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RejectButton = styled.button`
  flex: 1;
  background: rgba(255, 87, 87, 0.15);
  border: 1px solid rgba(255, 87, 87, 0.3);
  border-radius: 8px;
  color: #ff5757;
  font-size: 14px;
  font-weight: 600;
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 87, 87, 0.25);
  }
`;

const PartialApplyButton = styled(ToolbarButton)`
  background: rgba(255, 193, 7, 0.15);
  border: 1px solid rgba(255, 193, 7, 0.3);
  color: #ffc107;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover:not(:disabled) {
    background: rgba(255, 193, 7, 0.25);
  }
`;

const FinalApplyButton = styled(ToolbarButton)`
  background: linear-gradient(135deg, #2ed573, #26bf62);
  border: none;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(46, 213, 115, 0.3);
  }
`;

const ResetButton = styled(ToolbarButton)`
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  border: none;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
  }
`;

const CollaborativeDocumentEditor = ({
  chatRoomId,
  currentUserId,
  currentUserName,
  isManager, // 방 매니저 여부 (prop으로 받지만 실시간 갱신)
  canEdit, // 편집 권한 여부 (prop으로 받지만 실시간 갱신)
  chatType, // 1:1 vs 그룹 구분
  showToast,
  onClose,
  onLoadFromShared,
  selectedMemo // 외부에서 선택한 메모 (불러오기 요청)
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingEdits, setPendingEdits] = useState([]);
  const [selectedEdits, setSelectedEdits] = useState([]); // 여러 편집 내역 배열
  const [showEditModal, setShowEditModal] = useState(false);
  const [actualCanEdit, setActualCanEdit] = useState(canEdit); // 실시간 권한
  const [actualIsManager, setActualIsManager] = useState(isManager); // 실시간 매니저 여부
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [selectedCommentRange, setSelectedCommentRange] = useState(null);
  const [showFullScreenEdit, setShowFullScreenEdit] = useState(false);
  const [showEditInputModal, setShowEditInputModal] = useState(false); // 수정 내용 입력 모달
  const [editInputText, setEditInputText] = useState(''); // 수정할 텍스트 (형광펜: 대체 텍스트)
  const [editReasonText, setEditReasonText] = useState(''); // 설명/이유 (취소선: 삭제 이유, 형광펜: 설명)
  const [pendingMarker, setPendingMarker] = useState(null); // 대기 중인 마커 정보
  const [showLoadConfirmModal, setShowLoadConfirmModal] = useState(false); // 문서 불러오기 확인 모달
  const [pendingLoadMemo, setPendingLoadMemo] = useState(null); // 불러오려는 메모 정보
  const [currentDocId, setCurrentDocId] = useState(null); // 현재 열린 문서 ID
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false); // 전체 리셋 확인 모달

  const contentRef = useRef(null);
  const fullScreenContentRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const savedRangeRef = useRef(null); // 선택 영역 저장용

  // 키보드 선택 모드 상태
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionType, setSelectionType] = useState(null); // 'strikethrough' | 'highlight'
  const selectionStartRef = useRef(null); // 선택 시작 위치
  const currentSelectionRef = useRef(null); // 현재 선택 범위
  const tempMarkerRef = useRef(null); // 임시 마커 (시각 효과용)

  // 임시 마커 CSS 스타일 적용
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .temp-strikethrough {
        text-decoration: line-through;
        text-decoration-color: #ff5757;
        text-decoration-thickness: 2px;
        background: rgba(255, 87, 87, 0.1);
      }
      .temp-highlight {
        background: rgba(255, 193, 7, 0.3);
        border-bottom: 2px solid #ffc107;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 권한 확인 (1:1은 자동 편집 권한, 그룹은 권한 시스템 적용)
  useEffect(() => {
    if (!chatRoomId || !currentUserId) return;

    let isMounted = true;

    // 1:1 채팅인 경우 자동으로 편집 권한 부여
    if (chatType === '1:1' || chatType === 'direct') {
      setActualCanEdit(true); // 1:1은 무조건 편집 가능

      // 매니저는 문서를 올린 사람인지 확인
      const loadManagerStatus = async () => {
        try {
          const docRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc');
          const docSnap = await getDoc(docRef);

          if (isMounted && docSnap.exists()) {
            const docData = docSnap.data();
            setActualIsManager(docData.lastEditedBy === currentUserId);
          } else {
            // 문서가 없으면 기본값 사용
            setActualIsManager(isManager);
          }
        } catch (error) {
          if (error.code !== 'permission-denied') {
            console.error('매니저 상태 로드 오류:', error);
          }
          setActualIsManager(isManager);
        }
      };

      loadManagerStatus();
      return () => {
        isMounted = false;
      };
    }

    // 그룹 채팅인 경우 기존 권한 시스템 사용
    setActualIsManager(isManager);
    setActualCanEdit(canEdit);

    // 권한 문서 읽기 (실시간 리스너 대신 일회성)
    const loadPermissions = async () => {
      try {
        const permRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'permissions');
        const permSnap = await getDoc(permRef);

        if (isMounted && permSnap.exists()) {
          const permissions = permSnap.data();
          const isActualManager = permissions.manager === currentUserId;
          const isEditor = permissions.editors?.includes(currentUserId) || false;

          setActualIsManager(isActualManager);
          setActualCanEdit(isActualManager || isEditor);
        }
      } catch (error) {
        if (error.code !== 'permission-denied') {
          console.error('권한 로드 오류:', error);
        }
      }
    };

    loadPermissions();

    return () => {
      isMounted = false;
    };
  }, [chatRoomId, currentUserId, isManager, canEdit, chatType]);

  // 문서 및 편집 이력 로드 (일회성 읽기)
  const loadDocument = useCallback(async () => {
    if (!chatRoomId) return;

    try {
      const docRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc');
      const docSnap = await getDoc(docRef);

      let memoId = null;

      if (docSnap.exists()) {
        const data = docSnap.data();
        setTitle(data.title || '');
        setContent(data.content || '');
        setCurrentDocId(data.originalMemoId || null);
        memoId = data.originalMemoId;

        // contentEditable 영역 업데이트
        if (contentRef.current) {
          contentRef.current.innerHTML = data.content || '';
        }
      } else {
        // 문서가 없으면 빈 상태로 초기화
        setTitle('');
        setContent('');
        setCurrentDocId(null);
        if (contentRef.current) {
          contentRef.current.innerHTML = '';
        }
      }

      // 편집 이력 로드 (문서별로 저장된 이력 로드)
      if (memoId) {
        const editsRef = collection(db, 'chatRooms', chatRoomId, 'documents', memoId, 'editHistory');
        const editsSnap = await getDocs(query(editsRef, where('status', '==', 'pending')));

        const edits = [];
        editsSnap.forEach((doc) => {
          edits.push({ id: doc.id, ...doc.data() });
        });
        setPendingEdits(edits);
      } else {
        // 문서 ID가 없으면 편집 이력도 없음
        setPendingEdits([]);
      }

    } catch (error) {
      if (error.code !== 'permission-denied') {
        console.error('문서 로드 오류:', error);
      }
    }
  }, [chatRoomId]);

  // 초기 로드
  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  // 문서 불러오기 버튼 클릭 시 실행될 핸들러
  const handleLoadClick = async () => {
    if (onLoadFromShared) {
      // 공유 폴더 메모 선택 모달 열기
      await onLoadFromShared();
    }
  };

  // 실제 문서 로드 수행
  const performLoadDocument = useCallback(async (memo) => {
    try {
      // Firestore의 currentDoc에 저장
      const docRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc');
      await setDoc(docRef, {
        title: memo.title || '제목 없음',
        content: memo.content || '',
        originalMemoId: memo.id,
        lastEditedBy: currentUserId,
        lastEditedByName: currentUserName,
        lastEditedAt: serverTimestamp(),
        version: 1
      });

      // 로컬 상태 업데이트
      setTitle(memo.title || '제목 없음');
      setContent(memo.content || '');
      setCurrentDocId(memo.id);

      // contentEditable 영역 업데이트
      if (contentRef.current) {
        contentRef.current.innerHTML = memo.content || '';
      }

      // 새 문서의 편집 이력 로드
      const editsRef = collection(db, 'chatRooms', chatRoomId, 'documents', memo.id, 'editHistory');
      const editsSnap = await getDocs(query(editsRef, where('status', '==', 'pending')));

      const edits = [];
      editsSnap.forEach((doc) => {
        edits.push({ id: doc.id, ...doc.data() });
      });

      // 항상 새로운 배열로 설정 (이전 문서의 편집 이력이 남지 않도록)
      setPendingEdits(edits.length > 0 ? edits : []);

      showToast?.('문서를 불러왔습니다');
      setShowLoadConfirmModal(false);
      setPendingLoadMemo(null);
    } catch (error) {
      console.error('문서 불러오기 실패:', error);
      showToast?.('문서 불러오기에 실패했습니다');
    }
  }, [chatRoomId, currentUserId, currentUserName, showToast]);

  // 실제 문서 불러오기 처리 (ChatRoom에서 호출)
  const handleLoadDocument = useCallback(async (memo) => {
    if (!memo) return;

    // 동일한 문서를 다시 불러오는 경우 - 아무 작업 없이 그대로 유지
    if (currentDocId && currentDocId === memo.id) {
      showToast?.('이미 열려있는 문서입니다');
      return;
    }

    // 기존 문서가 있고 (제목이나 내용이 있고), 수정 대기 사항이 있는 경우
    const hasExistingDocument = title.trim() || content.trim();
    const hasUnconfirmedEdits = pendingEdits.length > 0;

    if (hasExistingDocument && hasUnconfirmedEdits) {
      // 확인 모달 표시
      setPendingLoadMemo(memo);
      setShowLoadConfirmModal(true);
    } else {
      // 바로 불러오기
      await performLoadDocument(memo);
    }
  }, [currentDocId, title, content, pendingEdits, showToast, performLoadDocument]);

  // 기존 문서 보존하고 새 문서 열기
  const handleKeepAndLoad = async () => {
    if (!pendingLoadMemo) return;

    // 기존 문서는 이미 Firestore에 저장되어 있음
    // 새 문서를 불러오기
    await performLoadDocument(pendingLoadMemo);
  };

  // 확인 모달 닫기
  const handleCancelLoad = () => {
    setShowLoadConfirmModal(false);
    setPendingLoadMemo(null);
  };

  // 외부에서 메모를 선택했을 때 처리
  const lastSelectedMemoIdRef = useRef(null);

  useEffect(() => {
    if (selectedMemo && selectedMemo.id !== lastSelectedMemoIdRef.current) {
      lastSelectedMemoIdRef.current = selectedMemo.id;
      handleLoadDocument(selectedMemo);
    }
    // handleLoadDocument는 의존성에서 제외 (무한 루프 방지)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMemo]);

  // 문서별 편집 이력 컬렉션 참조 가져오기
  const getEditHistoryRef = useCallback((memoId) => {
    if (!memoId) {
      console.warn('메모 ID가 없어 편집 이력을 저장할 수 없습니다');
      return null;
    }
    return collection(
      db,
      'chatRooms',
      chatRoomId,
      'documents',
      memoId,
      'editHistory'
    );
  }, [chatRoomId]);

  // 디바운스 저장 (500ms)
  const debouncedSave = useCallback((newContent) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const docRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc');
        await setDoc(docRef, {
          title,
          content: newContent,
          lastEditedBy: currentUserId,
          lastEditedByName: currentUserName,
          lastEditedAt: serverTimestamp(),
          version: (await getDoc(docRef)).data()?.version || 0 + 1
        }, { merge: true });
      } catch (error) {
        console.error('문서 저장 실패:', error);
      }
    }, 500);
  }, [chatRoomId, title, currentUserId, currentUserName]);

  // 텍스트 선택 추적
  const [lastSelection, setLastSelection] = useState(null);

  // 선택 영역 추적 (드래그할 때)
  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();

      if (selectedText.trim() && contentRef.current?.contains(range.commonAncestorContainer)) {
        setLastSelection({
          range: range.cloneRange(),
          text: selectedText
        });
      }
    }
  }, []);

  // 선택 이벤트 리스너 등록
  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  // contentEditable 변경 핸들러 (형광펜 표시 로직 포함)
  const handleContentChange = useCallback(async () => {
    // 전체 화면 모달이 열려있으면 fullScreenContentRef 사용, 아니면 contentRef 사용
    const activeRef = showFullScreenEdit ? fullScreenContentRef : contentRef;
    if (!activeRef.current || !actualCanEdit) return;

    const selection = window.getSelection();

    // 선택된 텍스트가 있고, 변경이 발생한 경우
    if (lastSelection && lastSelection.text) {
      const oldText = lastSelection.text;
      const range = lastSelection.range;

      try {
        // 선택 영역의 새로운 텍스트 가져오기
        const newText = selection.toString() || activeRef.current.textContent;

        // 변경 사항이 있으면 형광펜 표시
        if (oldText !== newText) {
          // Firestore에 편집 이력 저장 (문서별로)
          const editHistoryRef = getEditHistoryRef(currentDocId);
          if (!editHistoryRef) {
            console.warn('문서 ID가 없어 편집 이력을 저장할 수 없습니다');
            return;
          }

          const editDoc = await addDoc(editHistoryRef, {
            editedBy: currentUserId,
            editedByName: currentUserName,
            editedAt: serverTimestamp(),
            oldText: oldText,
            newText: newText,
            status: 'pending'
          });

          // 선택 영역을 형광펜으로 표시
          if (range) {
            const span = document.createElement('span');
            span.className = 'highlight';
            span.dataset.editId = editDoc.id;

            try {
              range.surroundContents(span);
            } catch (e) {
              // surroundContents가 실패하면 수동으로 처리
              console.warn('형광펜 표시 실패:', e);
            }
          }

          // 선택 해제
          selection.removeAllRanges();
          setLastSelection(null);
        }
      } catch (error) {
        console.error('편집 이력 저장 실패:', error);
      }
    }

    // 전체 콘텐츠 저장 (디바운싱)
    const newContent = activeRef.current.innerHTML;
    setContent(newContent);
    debouncedSave(newContent);
  }, [actualCanEdit, debouncedSave, lastSelection, chatRoomId, currentUserId, currentUserName, showFullScreenEdit]);

  // 선택 확정 (마커 생성)
  const finalizeSelection = useCallback(async () => {
    if (!isSelecting || !currentSelectionRef.current || !selectionType) return;

    const activeRef = showFullScreenEdit ? fullScreenContentRef : contentRef;

    // 임시 마커가 있으면 그것의 텍스트를 사용
    let selectedText = '';
    let targetElement = null;

    if (tempMarkerRef.current) {
      selectedText = tempMarkerRef.current.textContent;
      targetElement = tempMarkerRef.current;
    } else {
      selectedText = currentSelectionRef.current.toString();
    }

    if (!selectedText.trim()) {
      // 선택된 텍스트가 없으면 취소
      if (tempMarkerRef.current) {
        const parent = tempMarkerRef.current.parentNode;
        while (tempMarkerRef.current.firstChild) {
          parent.insertBefore(tempMarkerRef.current.firstChild, tempMarkerRef.current);
        }
        parent.removeChild(tempMarkerRef.current);
        tempMarkerRef.current = null;
      }

      setIsSelecting(false);
      setSelectionType(null);
      selectionStartRef.current = null;
      currentSelectionRef.current = null;
      return;
    }

    try {
      // Firestore에 편집 이력 저장 (문서별로)
      const editHistoryRef = getEditHistoryRef(currentDocId);
      if (!editHistoryRef) {
        showToast?.('문서 ID가 없어 편집 이력을 저장할 수 없습니다');
        return;
      }
      const editData = {
        editedBy: currentUserId,
        editedByName: currentUserName,
        editedAt: serverTimestamp(),
        type: selectionType,
        oldText: selectedText,
        newText: '', // 일단 빈 값
        status: 'pending'
      };

      const editDoc = await addDoc(editHistoryRef, editData);

      // 임시 마커를 영구 마커로 교체
      if (targetElement) {
        // 임시 마커가 있으면 속성만 변경
        targetElement.dataset.editId = editDoc.id;
        targetElement.dataset.editType = selectionType;
        targetElement.className = selectionType;
        delete targetElement.dataset.tempMarker;
      } else {
        // 임시 마커가 없으면 새로 생성
        const span = document.createElement('span');
        span.dataset.editId = editDoc.id;
        span.dataset.editType = selectionType;
        span.className = selectionType;
        span.textContent = selectedText;

        try {
          currentSelectionRef.current.surroundContents(span);
        } catch (e) {
          console.warn('마커 적용 실패:', e);
        }
      }

      // 콘텐츠 저장
      const newContent = activeRef.current.innerHTML;
      setContent(newContent);
      debouncedSave(newContent);

      // 선택 모드 종료
      setIsSelecting(false);
      setSelectionType(null);
      selectionStartRef.current = null;
      currentSelectionRef.current = null;
      tempMarkerRef.current = null;

      // 선택 해제
      const selection = window.getSelection();
      selection.removeAllRanges();

    } catch (error) {
      console.error('편집 저장 실패:', error);
      showToast?.('편집 저장에 실패했습니다');
    }
  }, [isSelecting, selectionType, chatRoomId, currentUserId, currentUserName, showFullScreenEdit, debouncedSave, showToast]);

  // 키보드 기반 편집 핸들러
  const handleKeyDown = useCallback((e) => {
    if (!actualCanEdit) {
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
      }
      return;
    }

    const activeRef = showFullScreenEdit ? fullScreenContentRef : contentRef;
    const selection = window.getSelection();

    // Backspace: 왼쪽으로 선택 확장 (취소선)
    if (e.key === 'Backspace') {
      e.preventDefault();
      e.stopPropagation();

      // 이미 선택 중이고 다른 타입이면 먼저 확정
      if (isSelecting && selectionType !== 'strikethrough') {
        finalizeSelection();
        return;
      }

      // 선택 모드 시작
      if (!isSelecting) {
        setIsSelecting(true);
        setSelectionType('strikethrough');

        // 현재 커서 위치 저장
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          selectionStartRef.current = range.cloneRange();
        }
      }

      // 왼쪽으로 한 글자 확장
      if (selection.rangeCount > 0) {
        // 기존 임시 마커 제거
        if (tempMarkerRef.current) {
          const parent = tempMarkerRef.current.parentNode;
          while (tempMarkerRef.current.firstChild) {
            parent.insertBefore(tempMarkerRef.current.firstChild, tempMarkerRef.current);
          }
          parent.removeChild(tempMarkerRef.current);
          tempMarkerRef.current = null;
        }

        // 왼쪽으로 확장
        selection.modify('extend', 'backward', 'character');

        // 현재 선택 범위 저장 및 시각 효과 적용
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          currentSelectionRef.current = range.cloneRange();

          // 선택된 텍스트가 있으면 임시 마커 적용
          const selectedText = range.toString();
          if (selectedText) {
            try {
              // 임시 스팬 생성
              const span = document.createElement('span');
              span.className = 'temp-strikethrough';
              span.dataset.tempMarker = 'true';

              // 선택 영역을 span으로 감싸기
              const newRange = range.cloneRange();
              newRange.surroundContents(span);

              tempMarkerRef.current = span;

              // 선택 영역을 span 끝으로 이동
              selection.removeAllRanges();
              const restoreRange = document.createRange();
              restoreRange.selectNodeContents(span);
              restoreRange.collapse(false);
              selection.addRange(restoreRange);
            } catch (err) {
              console.warn('임시 마커 적용 실패:', err);
            }
          }
        }
      }

      return;
    }

    // Space: 오른쪽으로 선택 확장 (형광펜)
    if (e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();

      // 이미 선택 중이고 다른 타입이면 먼저 확정
      if (isSelecting && selectionType !== 'highlight') {
        finalizeSelection();
        return;
      }

      // 선택 모드 시작
      if (!isSelecting) {
        setIsSelecting(true);
        setSelectionType('highlight');

        // 현재 커서 위치 저장
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          selectionStartRef.current = range.cloneRange();
        }
      }

      // 오른쪽으로 한 글자 확장
      if (selection.rangeCount > 0) {
        // 기존 임시 마커 제거
        if (tempMarkerRef.current) {
          const parent = tempMarkerRef.current.parentNode;
          while (tempMarkerRef.current.firstChild) {
            parent.insertBefore(tempMarkerRef.current.firstChild, tempMarkerRef.current);
          }
          parent.removeChild(tempMarkerRef.current);
          tempMarkerRef.current = null;
        }

        // 오른쪽으로 확장
        selection.modify('extend', 'forward', 'character');

        // 현재 선택 범위 저장 및 시각 효과 적용
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          currentSelectionRef.current = range.cloneRange();

          // 선택된 텍스트가 있으면 임시 마커 적용
          const selectedText = range.toString();
          if (selectedText) {
            try {
              // 임시 스팬 생성
              const span = document.createElement('span');
              span.className = 'temp-highlight';
              span.dataset.tempMarker = 'true';

              // 선택 영역을 span으로 감싸기
              const newRange = range.cloneRange();
              newRange.surroundContents(span);

              tempMarkerRef.current = span;

              // 선택 영역을 span 끝으로 이동
              selection.removeAllRanges();
              const restoreRange = document.createRange();
              restoreRange.selectNodeContents(span);
              restoreRange.collapse(false);
              selection.addRange(restoreRange);
            } catch (err) {
              console.warn('임시 마커 적용 실패:', err);
            }
          }
        }
      }

      return;
    }

    // Enter: 주석 추가 또는 선택 확정
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();

      if (isSelecting) {
        // 선택 중이면 확정
        finalizeSelection();
      } else {
        // 주석 추가
        if (!selection || !selection.rangeCount) {
          showToast?.('커서 위치를 지정해주세요');
          return;
        }

        const range = selection.getRangeAt(0);

        if (!activeRef.current?.contains(range.commonAncestorContainer)) {
          showToast?.('유효한 위치에 커서를 두세요');
          return;
        }

        // 커서 위치 저장
        savedRangeRef.current = range.cloneRange();
        setPendingMarker({
          type: 'comment',
          text: '',
          range: savedRangeRef.current
        });
        setEditInputText('');
        setShowEditInputModal(true);
      }

      return;
    }

    // 기타 모든 키: 선택 확정
    if (isSelecting) {
      e.preventDefault();
      e.stopPropagation();
      finalizeSelection();
      return;
    }

    // Ctrl/Cmd 조합 허용
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        showToast?.('붙여넣기는 지원되지 않습니다');
        return;
      }
      return;
    }

    // 기타 모든 키 입력 차단
    e.preventDefault();
    e.stopPropagation();
  }, [actualCanEdit, showFullScreenEdit, showToast, isSelecting, selectionType, finalizeSelection]);

  // 편집 입력 모달 확인 핸들러
  const handleConfirmEditInput = useCallback(async () => {
    if (!pendingMarker) return;

    const activeRef = showFullScreenEdit ? fullScreenContentRef : contentRef;

    try {
      // 기존 마커 수정 (id가 있으면)
      if (pendingMarker.id) {
        const editRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc', 'editHistory', pendingMarker.id);

        // newText만 업데이트
        await setDoc(editRef, {
          newText: editInputText,
          lastModifiedAt: serverTimestamp()
        }, { merge: true });

        showToast?.('수정 내용이 업데이트되었습니다');

        // 모달 닫기
        setShowEditInputModal(false);
        setPendingMarker(null);
        setEditInputText('');

        return;
      }

      // 새 마커 생성 (주석용) - 문서별로 저장
      const editHistoryRef = getEditHistoryRef(currentDocId);
      if (!editHistoryRef) {
        showToast?.('문서 ID가 없어 편집 이력을 저장할 수 없습니다');
        setShowEditInputModal(false);
        return;
      }
      const editData = {
        editedBy: currentUserId,
        editedByName: currentUserName,
        editedAt: serverTimestamp(),
        type: pendingMarker.type,
        status: 'pending'
      };

      if (pendingMarker.type === 'comment') {
        editData.text = editInputText; // 주석 내용
      } else {
        editData.oldText = pendingMarker.text; // 원본 텍스트
        editData.newText = editInputText; // 수정할 텍스트
      }

      const editDoc = await addDoc(editHistoryRef, editData);

      // 마커 생성
      const span = document.createElement('span');
      span.dataset.editId = editDoc.id;
      span.dataset.editType = pendingMarker.type;

      if (pendingMarker.type === 'strikethrough') {
        span.className = 'strikethrough';
        span.textContent = pendingMarker.text;
      } else if (pendingMarker.type === 'highlight') {
        span.className = 'highlight';
        span.textContent = pendingMarker.text;
      } else if (pendingMarker.type === 'comment') {
        span.className = 'comment';
        span.textContent = '[주석]';
      }

      // 선택 영역에 마커 삽입
      const range = savedRangeRef.current;
      if (range) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        if (pendingMarker.type === 'comment') {
          // 주석은 커서 위치에 삽입
          range.insertNode(span);

          // 주석 마커 다음으로 커서 이동
          const newRange = document.createRange();
          newRange.setStartAfter(span);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } else {
          // 취소선/형광펜은 선택 영역을 감싸기
          try {
            range.surroundContents(span);

            // 마커 다음으로 커서 이동
            const newRange = document.createRange();
            newRange.setStartAfter(span);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          } catch (e) {
            console.warn('마커 적용 실패:', e);
            showToast?.('마커를 적용할 수 없습니다');
            return;
          }
        }
      }

      // 콘텐츠 저장 (현재 활성 ref의 내용만 저장)
      const newContent = activeRef.current.innerHTML;
      setContent(newContent);
      debouncedSave(newContent);

      // 모달 닫기
      setShowEditInputModal(false);
      setPendingMarker(null);
      setEditInputText('');
      savedRangeRef.current = null;

      showToast?.('편집 표시를 추가했습니다');
    } catch (error) {
      console.error('편집 저장 실패:', error);
      showToast?.('편집 저장에 실패했습니다');
    }
  }, [pendingMarker, editInputText, chatRoomId, currentUserId, currentUserName, showFullScreenEdit, debouncedSave, showToast]);

  // 편집 마커 클릭 핸들러 - 수정 모달 열기
  const handleEditMarkerClick = useCallback(async (clickedEditId, markerElement) => {
    try {
      // 편집 이력 가져오기
      const editRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc', 'editHistory', clickedEditId);
      const editSnap = await getDoc(editRef);

      if (!editSnap.exists()) {
        showToast?.('편집 내역을 찾을 수 없습니다');
        return;
      }

      const editData = editSnap.data();
      const editType = editData.type;

      // 마커 텍스트 가져오기
      const markerText = markerElement?.textContent || editData.oldText || '';

      // 수정 모달 열기
      setPendingMarker({
        id: clickedEditId,
        type: editType,
        text: markerText,
        editData: editData
      });
      setEditInputText(editData.newText || '');
      setShowEditInputModal(true);

    } catch (error) {
      console.error('편집 이력 로드 실패:', error);
      showToast?.('편집 이력을 불러올 수 없습니다');
    }
  }, [chatRoomId, showToast]);

  // 취소선 적용 핸들러 - 즉시 입력창 표시
  const handleApplyStrikethrough = useCallback(() => {
    if (!actualCanEdit) {
      showToast?.('편집 권한이 없습니다');
      return;
    }

    const activeRef = showFullScreenEdit ? fullScreenContentRef : contentRef;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      showToast?.('텍스트를 선택해주세요');
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (!selectedText.trim() || !activeRef.current?.contains(range.commonAncestorContainer)) {
      showToast?.('유효한 텍스트를 선택해주세요');
      return;
    }

    // 선택 범위 저장
    savedRangeRef.current = range.cloneRange();

    // 입력 모달 표시 (취소선 - 삭제 이유 입력)
    setPendingMarker({
      type: 'strikethrough',
      text: selectedText,
      range: savedRangeRef.current
    });
    setEditInputText('');
    setShowEditInputModal(true);
  }, [actualCanEdit, showFullScreenEdit, showToast]);

  // 형광펜 적용 핸들러 - 즉시 입력창 표시
  const handleApplyHighlighter = useCallback(() => {
    if (!actualCanEdit) {
      showToast?.('편집 권한이 없습니다');
      return;
    }

    const activeRef = showFullScreenEdit ? fullScreenContentRef : contentRef;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      showToast?.('텍스트를 선택해주세요');
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (!selectedText.trim() || !activeRef.current?.contains(range.commonAncestorContainer)) {
      showToast?.('유효한 텍스트를 선택해주세요');
      return;
    }

    // 선택 범위 저장
    savedRangeRef.current = range.cloneRange();

    // 입력 모달 표시 (형광펜 - 대체 텍스트 + 설명 입력)
    setPendingMarker({
      type: 'highlight',
      text: selectedText,
      range: savedRangeRef.current
    });
    setEditInputText('');
    setShowEditInputModal(true);
  }, [actualCanEdit, showFullScreenEdit, showToast]);

  // 주석 적용 핸들러 (편집 권한자만)
  const handleApplyComment = useCallback(() => {
    if (!actualCanEdit) {
      showToast?.('편집 권한이 없습니다');
      return;
    }

    const activeRef = showFullScreenEdit ? fullScreenContentRef : contentRef;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      showToast?.('텍스트를 선택해주세요');
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (!selectedText.trim() || !activeRef.current?.contains(range.commonAncestorContainer)) {
      showToast?.('유효한 텍스트를 선택해주세요');
      return;
    }

    // 주석 입력 모달 표시
    setSelectedCommentRange({ range: range.cloneRange(), text: selectedText });
    setShowCommentModal(true);
  }, [actualCanEdit, showToast, showFullScreenEdit]);

  // 주석 저장 핸들러
  const handleSaveComment = useCallback(async () => {
    if (!selectedCommentRange || !commentText.trim()) {
      showToast?.('주석 내용을 입력해주세요');
      return;
    }

    const activeRef = showFullScreenEdit ? fullScreenContentRef : contentRef;

    try {
      // Firestore에 주석 편집 이력 저장
      const editHistoryRef = getEditHistoryRef(currentDocId);
      if (!editHistoryRef) {
        showToast?.('문서 ID가 없어 편집 이력을 저장할 수 없습니다');
        setShowCommentModal(false);
        return;
      }

      const editDoc = await addDoc(editHistoryRef, {
        editedBy: currentUserId,
        editedByName: currentUserName,
        editedAt: serverTimestamp(),
        type: 'comment', // 주석 타입
        text: selectedCommentRange.text,
        comment: commentText, // 주석 내용
        status: 'pending'
      });

      // 주석 표시
      const span = document.createElement('span');
      span.className = 'comment';
      span.dataset.editId = editDoc.id;
      span.dataset.editType = 'comment';
      span.dataset.comment = commentText;

      try {
        selectedCommentRange.range.surroundContents(span);
        window.getSelection()?.removeAllRanges();
        showToast?.('주석을 추가했습니다');

        // 콘텐츠 저장
        const newContent = activeRef.current.innerHTML;
        setContent(newContent);
        debouncedSave(newContent);

        // 양쪽 ref 동기화
        if (showFullScreenEdit && contentRef.current) {
          contentRef.current.innerHTML = newContent;
        } else if (!showFullScreenEdit && fullScreenContentRef.current) {
          fullScreenContentRef.current.innerHTML = newContent;
        }

        // 모달 닫기 및 초기화
        setShowCommentModal(false);
        setCommentText('');
        setSelectedCommentRange(null);
      } catch (e) {
        console.warn('주석 표시 실패:', e);
        showToast?.('주석을 적용할 수 없습니다');
      }
    } catch (error) {
      console.error('주석 저장 실패:', error);
      showToast?.('주석 저장에 실패했습니다');
    }
  }, [selectedCommentRange, commentText, chatRoomId, currentUserId, currentUserName, showToast, debouncedSave, showFullScreenEdit]);

  // 저장 핸들러 - 공유 폴더에 수정본 저장 (매니저만 가능)
  const handleSaveToShared = useCallback(async () => {
    if (!actualIsManager) {
      showToast?.('매니저만 저장할 수 있습니다');
      return;
    }

    if (!title.trim()) {
      showToast?.('제목을 입력하세요');
      return;
    }

    setSaving(true);

    try {
      // HTML 태그 제거한 순수 텍스트 추출
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const plainTextContent = tempDiv.textContent || tempDiv.innerText || '';

      // 공유 폴더에 수정본 저장
      const memosRef = collection(db, 'memos');

      // 수정본 제목 생성 (이미 "-수정본"이 있는지 확인)
      let modifiedTitle = title;
      if (!title.includes('-수정본')) {
        // 같은 제목의 수정본 개수 확인
        const existingMemosSnapshot = await getDocs(
          query(memosRef, where('title', '>=', title + '-수정본'), where('title', '<', title + '-수정본\uf8ff'))
        );
        const count = existingMemosSnapshot.size;
        modifiedTitle = count > 0 ? `${title}-수정본(${count + 1})` : `${title}-수정본`;
      }

      const newMemo = {
        title: modifiedTitle,
        content: plainTextContent,
        folder: 'shared',
        userId: currentUserId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        tags: ['대화방수정본'],
        modifiedInChatRoom: true,
        chatRoomId: chatRoomId
      };

      await addDoc(memosRef, newMemo);

      showToast?.(`"${modifiedTitle}"이(가) 공유 폴더에 저장되었습니다`);
    } catch (error) {
      console.error('문서 저장 실패:', error);
      showToast?.('문서 저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  }, [actualIsManager, title, content, currentUserId, chatRoomId, showToast]);

  // 다운로드 핸들러 - 일반 사용자용 (공유 폴더에 다운로드)
  const handleDownloadToShared = useCallback(async () => {
    if (!title.trim()) {
      showToast?.('제목을 입력하세요');
      return;
    }

    setSaving(true);

    try {
      // HTML 태그 제거한 순수 텍스트 추출
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const plainTextContent = tempDiv.textContent || tempDiv.innerText || '';

      // 공유 폴더에 다운로드
      const memosRef = collection(db, 'memos');

      // 다운로드 제목 생성 (이미 "-dn"이 있는지 확인)
      let downloadTitle = title;
      if (!title.includes('-dn')) {
        // 같은 제목의 다운로드 개수 확인
        const existingMemosSnapshot = await getDocs(
          query(memosRef, where('title', '>=', title + '-dn'), where('title', '<', title + '-dn\uf8ff'))
        );
        const count = existingMemosSnapshot.size;
        downloadTitle = count > 0 ? `${title}-dn(${count + 1})` : `${title}-dn`;
      }

      const newMemo = {
        title: downloadTitle,
        content: plainTextContent,
        folder: 'shared',
        userId: currentUserId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        tags: ['대화방다운로드'],
        downloadedFromChatRoom: true,
        chatRoomId: chatRoomId
      };

      await addDoc(memosRef, newMemo);

      showToast?.(`"${downloadTitle}"이(가) 공유 폴더에 다운로드되었습니다`);
    } catch (error) {
      console.error('문서 다운로드 실패:', error);
      showToast?.('문서 다운로드에 실패했습니다');
    } finally {
      setSaving(false);
    }
  }, [title, content, currentUserId, chatRoomId, showToast]);

  // 임시저장 핸들러 - HTML 그대로 저장하며 [임시] 태그 추가
  const handleTemporarySave = useCallback(async () => {
    if (!actualIsManager) {
      showToast?.('매니저만 임시저장할 수 있습니다');
      return;
    }

    if (!title.trim()) {
      showToast?.('제목을 입력하세요');
      return;
    }

    setSaving(true);

    try {
      // 공유 폴더에 HTML 그대로 저장
      const memosRef = collection(db, 'memos');

      // 임시저장 제목 생성 ([임시] 접두어 추가)
      let tempTitle = title;
      if (!title.startsWith('[임시]')) {
        tempTitle = `[임시] ${title}`;
      }

      const newMemo = {
        title: tempTitle,
        content: content, // HTML 그대로 저장
        contentType: 'html', // HTML 타입 표시
        folder: 'shared',
        userId: currentUserId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        tags: ['임시저장', '대화방편집중'],
        temporarySave: true,
        chatRoomId: chatRoomId
      };

      await addDoc(memosRef, newMemo);

      showToast?.(`"${tempTitle}"이(가) 임시저장되었습니다`);
    } catch (error) {
      console.error('임시저장 실패:', error);
      showToast?.('임시저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  }, [actualIsManager, title, content, currentUserId, chatRoomId, showToast]);

  // 중간 적용 핸들러 - 현재 상태 그대로 저장 (모든 마커 유지)
  const handlePartialApply = useCallback(async () => {
    if (!actualIsManager) {
      showToast?.('매니저만 중간 적용할 수 있습니다');
      return;
    }

    setSaving(true);

    try {
      // 현재 HTML 상태 그대로 Firestore에 저장
      const docRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc');
      await setDoc(docRef, {
        title,
        content: content, // 모든 마커가 포함된 HTML
        lastEditedBy: currentUserId,
        lastEditedByName: currentUserName,
        lastEditedAt: serverTimestamp(),
        partialApplied: true, // 중간 적용 표시
        version: (await getDoc(docRef)).data()?.version || 0 + 1
      }, { merge: true });

      showToast?.('현재 상태가 중간 적용되었습니다');
    } catch (error) {
      console.error('중간 적용 실패:', error);
      showToast?.('중간 적용에 실패했습니다');
    } finally {
      setSaving(false);
    }
  }, [actualIsManager, title, content, currentUserId, currentUserName, chatRoomId, showToast]);

  // 개별 편집 승인 핸들러 (매니저만)
  const handleApproveEdit = useCallback(async (editId) => {
    if (!actualIsManager) {
      showToast?.('매니저만 승인할 수 있습니다');
      return;
    }

    try {
      // 1. 편집 이력 가져오기
      const editRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc', 'editHistory', editId);
      const editSnap = await getDoc(editRef);

      if (!editSnap.exists()) {
        showToast?.('편집 내역을 찾을 수 없습니다');
        return;
      }

      const editData = editSnap.data();

      // 2. HTML에서 해당 마커 찾아서 처리
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;

      // editId로 마커 찾기
      const marker = tempDiv.querySelector(`[data-edit-id="${editId}"]`);

      if (marker) {
        const editType = editData.type;

        if (editType === 'strikethrough') {
          // 취소선: newText가 있으면 교체, 없으면 삭제
          if (editData.newText && editData.newText.trim()) {
            const textNode = document.createTextNode(editData.newText);
            marker.parentNode.replaceChild(textNode, marker);
          } else {
            marker.remove();
          }
        } else if (editType === 'highlight') {
          // 형광펜: newText가 있으면 교체, 없으면 마커만 제거
          if (editData.newText && editData.newText.trim()) {
            const textNode = document.createTextNode(editData.newText);
            marker.parentNode.replaceChild(textNode, marker);
          } else {
            const textNode = document.createTextNode(marker.textContent);
            marker.parentNode.replaceChild(textNode, marker);
          }
        } else if (editType === 'comment') {
          // 주석: 마커만 제거
          const textNode = document.createTextNode(marker.textContent);
          marker.parentNode.replaceChild(textNode, marker);
        }

        // 3. 변경된 HTML 저장
        const newContent = tempDiv.innerHTML;
        setContent(newContent);

        if (contentRef.current) {
          contentRef.current.innerHTML = newContent;
        }
        if (fullScreenContentRef.current) {
          fullScreenContentRef.current.innerHTML = newContent;
        }

        // 4. Firestore에 저장
        const docRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc');
        await setDoc(docRef, {
          title,
          content: newContent,
          lastEditedBy: currentUserId,
          lastEditedByName: currentUserName,
          lastEditedAt: serverTimestamp(),
          version: (await getDoc(docRef)).data()?.version || 0 + 1
        }, { merge: true });

        // 5. 편집 이력 삭제
        await deleteDoc(editRef);

        // 6. UI 업데이트
        setPendingEdits(prev => prev.filter(e => e.id !== editId));
        setSelectedEdits(prev => prev.filter(e => e.id !== editId));

        // 모든 편집이 승인되었으면 모달 닫기
        if (selectedEdits.length <= 1) {
          setShowEditModal(false);
        }

        showToast?.('편집이 승인되었습니다');
      }
    } catch (error) {
      console.error('편집 승인 실패:', error);
      showToast?.('편집 승인에 실패했습니다');
    }
  }, [actualIsManager, content, chatRoomId, title, currentUserId, currentUserName, selectedEdits, showToast]);

  // 최종 적용 핸들러 - 모든 마커 처리 (편집 이력 기반)
  const handleFinalApply = useCallback(async () => {
    if (!actualIsManager) {
      showToast?.('매니저만 최종 적용할 수 있습니다');
      return;
    }

    setSaving(true);

    try {
      // 1. 모든 pending 편집 이력 가져오기 (문서별로)
      const editsRef = getEditHistoryRef(currentDocId);
      if (!editsRef) {
        showToast?.('문서 ID가 없어 최종 적용할 수 없습니다');
        setSaving(false);
        return;
      }
      const editsSnap = await getDocs(query(editsRef, where('status', '==', 'pending')));

      const editHistoryMap = new Map();
      editsSnap.forEach((doc) => {
        editHistoryMap.set(doc.id, doc.data());
      });

      // 2. HTML 파싱
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;

      // 3. 취소선 처리 - 수정내용이 있으면 교체, 없으면 삭제
      const strikethroughs = tempDiv.querySelectorAll('.strikethrough');
      strikethroughs.forEach(el => {
        const editId = el.dataset.editId;
        const editData = editHistoryMap.get(editId);

        if (editData && editData.newText && editData.newText.trim()) {
          // 수정내용이 있으면 교체
          const textNode = document.createTextNode(editData.newText);
          el.parentNode.replaceChild(textNode, el);
        } else {
          // 수정내용이 없으면 삭제
          el.remove();
        }
      });

      // 4. 형광펜 처리 - 수정내용이 있으면 교체, 없으면 마커만 제거
      const highlights = tempDiv.querySelectorAll('.highlight');
      highlights.forEach(el => {
        const editId = el.dataset.editId;
        const editData = editHistoryMap.get(editId);

        if (editData && editData.newText && editData.newText.trim()) {
          // 수정내용이 있으면 교체
          const textNode = document.createTextNode(editData.newText);
          el.parentNode.replaceChild(textNode, el);
        } else {
          // 수정내용이 없으면 마커만 제거하고 원본 유지
          const textNode = document.createTextNode(el.textContent);
          el.parentNode.replaceChild(textNode, el);
        }
      });

      // 5. 주석 처리 - 마커만 제거하고 텍스트 유지
      const comments = tempDiv.querySelectorAll('.comment');
      comments.forEach(el => {
        const textNode = document.createTextNode(el.textContent);
        el.parentNode.replaceChild(textNode, el);
      });

      const finalContent = tempDiv.innerHTML;

      // Firestore에 최종 적용된 내용 저장
      const docRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc');
      await setDoc(docRef, {
        title,
        content: finalContent,
        lastEditedBy: currentUserId,
        lastEditedByName: currentUserName,
        lastEditedAt: serverTimestamp(),
        finalApplied: true, // 최종 적용 표시
        partialApplied: false,
        version: (await getDoc(docRef)).data()?.version || 0 + 1
      }, { merge: true });

      // 모든 pending 편집 이력 삭제
      const deletePromises = [];
      editsSnap.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });
      await Promise.all(deletePromises);

      // UI 업데이트
      setContent(finalContent);
      if (contentRef.current) {
        contentRef.current.innerHTML = finalContent;
      }
      if (fullScreenContentRef.current) {
        fullScreenContentRef.current.innerHTML = finalContent;
      }
      setPendingEdits([]);

      showToast?.('모든 수정사항이 최종 적용되었습니다');
    } catch (error) {
      console.error('최종 적용 실패:', error);
      showToast?.('최종 적용에 실패했습니다');
    } finally {
      setSaving(false);
    }
  }, [actualIsManager, title, content, currentUserId, currentUserName, chatRoomId, showToast]);

  // 전체 리셋 핸들러 - 모든 수정 마커를 제거하고 원본 텍스트로 복원
  const handleResetAll = useCallback(() => {
    if (!currentDocId) {
      showToast?.('문서 ID가 없습니다');
      return;
    }

    // 확인 모달 표시
    setShowResetConfirmModal(true);
  }, [currentDocId, showToast]);

  // 전체 리셋 확정 실행
  const performResetAll = useCallback(async () => {
    setSaving(true);
    try {
      // 1. HTML에서 모든 마커 제거 (텍스트만 남김)
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;

      // 모든 편집 마커 제거
      const markers = tempDiv.querySelectorAll('[data-edit-id]');
      markers.forEach(marker => {
        const textNode = document.createTextNode(marker.textContent);
        marker.parentNode.replaceChild(textNode, marker);
      });

      const cleanContent = tempDiv.innerHTML;

      // 2. Firestore의 편집 이력 모두 삭제
      const editHistoryRef = getEditHistoryRef(currentDocId);
      if (editHistoryRef) {
        const editsSnap = await getDocs(query(editHistoryRef, where('status', '==', 'pending')));
        const deletePromises = [];
        editsSnap.forEach((doc) => {
          deletePromises.push(deleteDoc(doc.ref));
        });
        await Promise.all(deletePromises);
      }

      // 3. Firestore 문서 업데이트 (마커 제거된 내용으로)
      const docRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc');
      await setDoc(docRef, {
        title,
        content: cleanContent,
        lastEditedBy: currentUserId,
        lastEditedByName: currentUserName,
        lastEditedAt: serverTimestamp(),
        version: (await getDoc(docRef)).data()?.version || 0 + 1
      }, { merge: true });

      // 4. UI 업데이트
      setContent(cleanContent);
      if (contentRef.current) {
        contentRef.current.innerHTML = cleanContent;
      }
      if (fullScreenContentRef.current) {
        fullScreenContentRef.current.innerHTML = cleanContent;
      }
      setPendingEdits([]);

      showToast?.('모든 수정 표시가 삭제되었습니다');
    } catch (error) {
      console.error('전체 리셋 실패:', error);
      showToast?.('리셋에 실패했습니다');
    } finally {
      setSaving(false);
      setShowResetConfirmModal(false);
    }
  }, [currentDocId, content, title, currentUserId, currentUserName, chatRoomId, showToast, getEditHistoryRef]);

  // 권한 타입 결정
  const permissionType = actualIsManager ? 'manager' : actualCanEdit ? 'editor' : 'viewer';
  const permissionLabel = actualIsManager ? '매니저' : actualCanEdit ? '편집자' : '읽기 전용';
  const PermissionIcon = actualIsManager ? Lock : actualCanEdit ? Users : Info;

  return (
    <EditorContainer $collapsed={collapsed}>
      {/* 헤더 */}
      <EditorHeader onClick={() => !collapsed && setCollapsed(false)}>
        <HeaderLeft>
          <DocumentIcon>📄</DocumentIcon>
          {collapsed ? (
            <TitleInput
              value={title}
              disabled
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <TitleInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="문서 제목을 입력하세요"
              onClick={(e) => e.stopPropagation()}
              disabled={!actualCanEdit}
            />
          )}
        </HeaderLeft>

        <HeaderRight onClick={(e) => e.stopPropagation()}>
          <PermissionBadge $type={permissionType}>
            <PermissionIcon size={14} />
            {permissionLabel}
          </PermissionBadge>

          {onClose && (
            <IconButton onClick={onClose} title="닫기">
              <X size={18} />
            </IconButton>
          )}

          <ToggleButton
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(!collapsed);
            }}
            title={collapsed ? '펼치기' : '접기'}
          >
            {collapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </ToggleButton>
        </HeaderRight>
      </EditorHeader>

      {/* 콘텐츠 */}
      <EditorContent $collapsed={collapsed}>
        {/* 도구 모음 */}
        <Toolbar>
          {onLoadFromShared && actualIsManager && (
            <LoadButton onClick={handleLoadClick} title="공유 폴더에서 불러오기">
              <FolderOpen size={14} />
              불러오기
            </LoadButton>
          )}

          {actualCanEdit ? (
            <EditButton onClick={() => setShowFullScreenEdit(true)} title="큰 화면에서 편집하기">
              <Maximize2 size={14} />
              편집
            </EditButton>
          ) : (
            <EditButton onClick={() => setShowFullScreenEdit(true)} title="큰 화면에서 보기">
              <Eye size={14} />
              크게보기
            </EditButton>
          )}

          {actualIsManager && (
            <>
              <SaveButton
                onClick={handleTemporarySave}
                disabled={saving || !title.trim()}
                title="임시저장 (HTML 마커 유지)"
              >
                <FileText size={14} />
                {saving ? '저장 중...' : '임시저장'}
              </SaveButton>

              <PartialApplyButton
                onClick={handlePartialApply}
                disabled={saving || !title.trim()}
                title="중간 적용 (현재 상태 저장)"
              >
                <Save size={14} />
                중간 적용
              </PartialApplyButton>

              <FinalApplyButton
                onClick={handleFinalApply}
                disabled={saving || !title.trim() || pendingEdits.length === 0}
                title="최종 적용 (모든 마커 처리)"
              >
                <CheckCircle size={14} />
                최종 적용
              </FinalApplyButton>

              <ResetButton
                onClick={handleResetAll}
                disabled={saving || pendingEdits.length === 0}
                title="모든 수정 표시 삭제"
              >
                <RotateCcw size={14} />
                전체 리셋
              </ResetButton>
            </>
          )}

          {!actualIsManager && (
            <SaveButton
              onClick={handleDownloadToShared}
              disabled={saving || !title.trim()}
              title="공유 폴더에 다운로드"
            >
              <Download size={14} />
              {saving ? '다운로드 중...' : '다운로드'}
            </SaveButton>
          )}

          {pendingEdits.length > 0 && (
            <PendingEditsCount title="대기 중인 수정 사항">
              <Info size={14} />
              {pendingEdits.length}개 수정 대기중
            </PendingEditsCount>
          )}

          {!actualCanEdit && (
            <span style={{ color: '#888', fontSize: '12px' }}>
              • 읽기 전용 모드
            </span>
          )}
        </Toolbar>

        {/* contentEditable 영역 - 미리보기에서는 읽기 전용 */}
        <ContentEditableArea
          ref={contentRef}
          contentEditable={false}
          suppressContentEditableWarning
          onClick={(e) => {
            const editId = e.target.dataset.editId;
            if (editId) {
              handleEditMarkerClick(editId, e.target);
            }
          }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
        {/* Placeholder는 CSS ::before로 처리 */}

        {/* 하단 정보 */}
        <Footer>
          <span>{content.replace(/<[^>]*>/g, '').length} 글자</span>
          <span>실시간 협업 활성화</span>
        </Footer>
      </EditorContent>

      {/* 수정 이력 모달 - 여러 편집 표시 */}
      {showEditModal && selectedEdits.length > 0 && (
        <Modal onClick={() => setShowEditModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                수정 내용 확인
                {selectedEdits.length > 1 && (
                  <span style={{ marginLeft: '8px', fontSize: '14px', color: '#ffc107' }}>
                    ({selectedEdits.length}명의 편집)
                  </span>
                )}
              </ModalTitle>
              <IconButton onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </IconButton>
            </ModalHeader>

            <ModalBody>
              {selectedEdits.map((edit, index) => (
                <div key={edit.id} style={{ marginBottom: index < selectedEdits.length - 1 ? '20px' : '0' }}>
                  <EditInfo>
                    <InfoRow>
                      <strong>수정자:</strong> {edit.editedByName}
                    </InfoRow>
                    <InfoRow>
                      <strong>수정 시각:</strong> {edit.editedAt?.toDate?.().toLocaleString('ko-KR')}
                    </InfoRow>
                    {edit.type && (
                      <InfoRow>
                        <strong>타입:</strong> {
                          edit.type === 'strikethrough' ? '취소선' :
                          edit.type === 'highlight' ? '형광펜' :
                          edit.type === 'comment' ? '주석' : '일반 수정'
                        }
                      </InfoRow>
                    )}
                    {edit.comment && (
                      <InfoRow>
                        <strong>주석:</strong> {edit.comment}
                      </InfoRow>
                    )}
                  </EditInfo>

                  <TextComparison>
                    <ComparisonBox $type="old">
                      <ComparisonLabel $type="old">수정 전</ComparisonLabel>
                      <ComparisonText>{edit.oldText || edit.text || '(없음)'}</ComparisonText>
                    </ComparisonBox>

                    <ComparisonBox $type="new">
                      <ComparisonLabel $type="new">수정 후</ComparisonLabel>
                      <ComparisonText>{edit.newText || edit.text}</ComparisonText>
                    </ComparisonBox>
                  </TextComparison>

                  {actualIsManager && (
                    <div style={{ marginTop: '12px' }}>
                      <ConfirmButton onClick={() => handleApproveEdit(edit.id)}>
                        <Check size={18} />
                        이 편집 승인
                      </ConfirmButton>
                    </div>
                  )}

                  {index < selectedEdits.length - 1 && (
                    <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '16px 0' }} />
                  )}
                </div>
              ))}

              {!actualIsManager && (
                <div style={{ padding: '12px', background: 'rgba(74, 144, 226, 0.1)', borderRadius: '8px', marginTop: '12px' }}>
                  <span style={{ color: '#4a90e2', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={16} />
                    수정 내용은 매니저가 검토 후 승인합니다
                  </span>
                </div>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* 주석 입력 모달 */}
      {showCommentModal && (
        <Modal onClick={() => setShowCommentModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>주석 입력</ModalTitle>
              <IconButton onClick={() => {
                setShowCommentModal(false);
                setCommentText('');
                setSelectedCommentRange(null);
              }}>
                <X size={20} />
              </IconButton>
            </ModalHeader>

            <ModalBody>
              <EditInfo>
                <InfoRow>
                  <strong>선택한 텍스트:</strong> {selectedCommentRange?.text}
                </InfoRow>
              </EditInfo>

              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#e0e0e0', fontSize: '14px', fontWeight: '600' }}>
                  주석 내용
                </label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="주석 내용을 입력하세요..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#e0e0e0',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <ModalActions>
                <ConfirmButton onClick={handleSaveComment} disabled={!commentText.trim()}>
                  <Check size={18} />
                  주석 추가
                </ConfirmButton>
                <RejectButton onClick={() => {
                  setShowCommentModal(false);
                  setCommentText('');
                  setSelectedCommentRange(null);
                }}>
                  <X size={18} />
                  취소
                </RejectButton>
              </ModalActions>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* 편집 내용 입력 모달 (키보드 기반 편집용) */}
      {showEditInputModal && pendingMarker && (
        <Modal onClick={() => {
          setShowEditInputModal(false);
          setPendingMarker(null);
          setEditInputText('');
        }}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {pendingMarker.type === 'strikethrough' && '취소선 - 수정 내용 입력'}
                {pendingMarker.type === 'highlight' && '형광펜 - 수정 내용 입력'}
                {pendingMarker.type === 'comment' && '주석 입력'}
              </ModalTitle>
              <IconButton onClick={() => {
                setShowEditInputModal(false);
                setPendingMarker(null);
                setEditInputText('');
              }}>
                <X size={20} />
              </IconButton>
            </ModalHeader>

            <ModalBody>
              {pendingMarker.text && (
                <EditInfo>
                  <InfoRow>
                    <strong>원본 텍스트:</strong> {pendingMarker.text}
                  </InfoRow>
                </EditInfo>
              )}

              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#e0e0e0', fontSize: '14px', fontWeight: '600' }}>
                  {pendingMarker.type === 'comment' ? '주석 내용' : '수정할 내용 (비어있으면 삭제)'}
                </label>
                <textarea
                  value={editInputText}
                  onChange={(e) => setEditInputText(e.target.value)}
                  placeholder={
                    pendingMarker.type === 'comment'
                      ? '주석 내용을 입력하세요...'
                      : '수정할 내용을 입력하세요 (비워두면 삭제)'
                  }
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#e0e0e0',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  autoFocus
                />
              </div>

              <ModalActions>
                <ConfirmButton onClick={handleConfirmEditInput}>
                  <Check size={18} />
                  확인
                </ConfirmButton>
                <RejectButton onClick={() => {
                  setShowEditInputModal(false);
                  setPendingMarker(null);
                  setEditInputText('');
                }}>
                  <X size={18} />
                  취소
                </RejectButton>
              </ModalActions>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* 문서 불러오기 확인 모달 */}
      {showLoadConfirmModal && pendingLoadMemo && (
        <Modal onClick={handleCancelLoad}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>문서 불러오기 확인</ModalTitle>
              <IconButton onClick={handleCancelLoad}>
                <X size={20} />
              </IconButton>
            </ModalHeader>

            <ModalBody>
              <div style={{ marginBottom: '16px', color: '#ffc107' }}>
                ⚠️ 현재 열린 문서에 수정 대기 중인 내용이 있습니다.
              </div>

              <div style={{ marginBottom: '16px', lineHeight: '1.6' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>현재 문서:</strong> {title || '(제목 없음)'}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>불러올 문서:</strong> {pendingLoadMemo.title || '(제목 없음)'}
                </div>
                <div style={{ color: '#888', fontSize: '13px' }}>
                  • 수정 대기 중인 내용: {pendingEdits.length}개
                </div>
              </div>

              <div style={{
                background: 'rgba(74, 144, 226, 0.1)',
                border: '1px solid rgba(74, 144, 226, 0.3)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
                fontSize: '13px',
                lineHeight: '1.8',
                color: '#e0e0e0'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: '#4a90e2' }}>
                  📌 수정 내용은 어떻게 되나요?
                </div>
                <div style={{ marginBottom: '6px' }}>
                  ✅ 현재 문서의 수정 대기 내용은 <strong>자동으로 저장</strong>됩니다
                </div>
                <div style={{ marginBottom: '6px' }}>
                  ✅ 나중에 이 문서를 다시 열면 <strong>수정 표시가 그대로</strong> 보입니다
                </div>
                <div>
                  ✅ 새로운 문서는 <strong>깨끗한 상태</strong>로 시작됩니다
                </div>
              </div>

              <ModalActions>
                <ConfirmButton onClick={handleKeepAndLoad}>
                  <Check size={18} />
                  기존 문서 유지하고 새 문서 열기
                </ConfirmButton>
                <RejectButton onClick={handleCancelLoad}>
                  <X size={18} />
                  취소
                </RejectButton>
              </ModalActions>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* 전체 리셋 확인 모달 */}
      {showResetConfirmModal && (
        <Modal onClick={() => setShowResetConfirmModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>전체 리셋 확인</ModalTitle>
              <IconButton onClick={() => setShowResetConfirmModal(false)}>
                <X size={20} />
              </IconButton>
            </ModalHeader>

            <ModalBody>
              <div style={{ marginBottom: '16px', color: '#ff5757' }}>
                ⚠️ 모든 수정 표시를 삭제하고 원본 상태로 되돌립니다.
              </div>

              <div style={{ marginBottom: '16px', lineHeight: '1.6' }}>
                <div style={{ marginBottom: '8px', color: '#888', fontSize: '13px' }}>
                  • 현재 문서: <strong>{title || '(제목 없음)'}</strong>
                </div>
                <div style={{ color: '#888', fontSize: '13px' }}>
                  • 삭제될 수정 표시: <strong style={{ color: '#ff5757' }}>{pendingEdits.length}개</strong>
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 87, 87, 0.1)',
                border: '1px solid rgba(255, 87, 87, 0.3)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
                fontSize: '13px',
                lineHeight: '1.8',
                color: '#e0e0e0'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: '#ff5757' }}>
                  ⚠️ 주의사항
                </div>
                <div style={{ marginBottom: '6px' }}>
                  • 모든 취소선, 형광펜, 주석 표시가 <strong>완전히 삭제</strong>됩니다
                </div>
                <div style={{ marginBottom: '6px' }}>
                  • 삭제된 내용은 <strong>복구할 수 없습니다</strong>
                </div>
                <div>
                  • 원본 텍스트만 남은 깨끗한 상태가 됩니다
                </div>
              </div>

              <ModalActions>
                <RejectButton onClick={() => setShowResetConfirmModal(false)}>
                  <X size={18} />
                  취소
                </RejectButton>
                <ConfirmButton
                  onClick={performResetAll}
                  style={{ background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)' }}
                >
                  <RotateCcw size={18} />
                  전체 리셋 실행
                </ConfirmButton>
              </ModalActions>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* 전체 화면 편집 모달 */}
      {showFullScreenEdit && (
        <FullScreenModal onClick={() => setShowFullScreenEdit(false)}>
          <FullScreenEditorContainer onClick={(e) => e.stopPropagation()}>
            {/* 헤더 */}
            <FullScreenHeader>
              <FullScreenTitle>
                <DocumentIcon>📄</DocumentIcon>
                <FullScreenTitleInput
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="문서 제목을 입력하세요"
                  disabled={!actualCanEdit}
                />
                <PermissionBadge $type={permissionType}>
                  <PermissionIcon size={16} />
                  {permissionLabel}
                </PermissionBadge>
              </FullScreenTitle>

              <IconButton onClick={() => setShowFullScreenEdit(false)} title="닫기">
                <X size={24} />
              </IconButton>
            </FullScreenHeader>

            {/* 툴바 - 편집 권한자에게만 표시 */}
            {actualCanEdit && (
              <FullScreenToolbar>
                <ToolbarButton onClick={handleApplyStrikethrough} title="선택한 텍스트에 취소선 적용">
                  <Strikethrough size={16} />
                  취소선
                </ToolbarButton>

                <ToolbarButton onClick={handleApplyHighlighter} title="선택한 텍스트에 형광펜 적용">
                  <Highlighter size={16} />
                  형광펜
                </ToolbarButton>

                <ToolbarButton onClick={handleApplyComment} title="선택한 텍스트에 주석 추가">
                  <MessageSquare size={16} />
                  주석
                </ToolbarButton>

                {pendingEdits.length > 0 && (
                  <PendingEditsCount title="대기 중인 수정 사항">
                    <Info size={16} />
                    {pendingEdits.length}개 수정 대기중
                  </PendingEditsCount>
                )}
              </FullScreenToolbar>
            )}

            {/* 편집 영역 */}
            <FullScreenContent>
              <FullScreenEditArea
                ref={fullScreenContentRef}
                contentEditable={actualCanEdit}
                suppressContentEditableWarning
                onKeyDown={handleKeyDown}
                onClick={(e) => {
                  const editId = e.target.dataset.editId;
                  if (editId) {
                    handleEditMarkerClick(editId, e.target);
                  }
                }}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </FullScreenContent>

            {/* 하단 정보 */}
            <FullScreenFooter>
              <span>{content.replace(/<[^>]*>/g, '').length} 글자</span>
              <span>
                {actualCanEdit ? '편집 모드' : '읽기 전용 모드'}
                {' • '}
                실시간 협업 활성화
              </span>
            </FullScreenFooter>
          </FullScreenEditorContainer>
        </FullScreenModal>
      )}
    </EditorContainer>
  );
};

export default CollaborativeDocumentEditor;
