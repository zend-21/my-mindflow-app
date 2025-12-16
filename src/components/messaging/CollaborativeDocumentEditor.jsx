// 📝 실시간 협업 문서 편집기 (모바일 최적화)
// 드래그 선택 → 입력 → 자동 형광표시 → 매니저 컨펌 시스템
import { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { ChevronDown, ChevronUp, Save, X, Users, Lock, FolderOpen, Info, Strikethrough, Highlighter, MessageSquare, Maximize2, Eye, Download, Check, FileText, CheckCircle } from 'lucide-react';
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

const CollaborativeDocumentEditor = ({
  chatRoomId,
  currentUserId,
  currentUserName,
  isManager, // 방 매니저 여부 (prop으로 받지만 실시간 갱신)
  canEdit, // 편집 권한 여부 (prop으로 받지만 실시간 갱신)
  chatType, // 1:1 vs 그룹 구분
  showToast,
  onClose,
  onLoadFromShared
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingEdits, setPendingEdits] = useState([]);
  const [selectedEdit, setSelectedEdit] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [actualCanEdit, setActualCanEdit] = useState(canEdit); // 실시간 권한
  const [actualIsManager, setActualIsManager] = useState(isManager); // 실시간 매니저 여부
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [selectedCommentRange, setSelectedCommentRange] = useState(null);
  const [showFullScreenEdit, setShowFullScreenEdit] = useState(false);

  const contentRef = useRef(null);
  const fullScreenContentRef = useRef(null);
  const saveTimeoutRef = useRef(null);

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

      if (docSnap.exists()) {
        const data = docSnap.data();
        setTitle(data.title || '');
        setContent(data.content || '');

        // contentEditable 영역 업데이트
        if (contentRef.current) {
          contentRef.current.innerHTML = data.content || '';
        }
      } else {
        // 문서가 없으면 빈 상태로 초기화
        setTitle('');
        setContent('');
        if (contentRef.current) {
          contentRef.current.innerHTML = '';
        }
      }

      // 편집 이력 로드 (pending 상태만)
      const editsRef = collection(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc', 'editHistory');
      const editsSnap = await getDocs(query(editsRef, where('status', '==', 'pending')));

      const edits = [];
      editsSnap.forEach((doc) => {
        edits.push({ id: doc.id, ...doc.data() });
      });
      setPendingEdits(edits);

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
      await onLoadFromShared();
      // Firestore 저장 완료 후 문서 재로드 (약간의 지연)
      setTimeout(() => {
        loadDocument();
      }, 200);
    }
  };

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
          // Firestore에 편집 이력 저장
          const editHistoryRef = collection(
            db,
            'chatRooms',
            chatRoomId,
            'sharedDocument',
            'currentDoc',
            'editHistory'
          );

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

    // 양쪽 ref 모두 동기화 (전체 화면 모달과 미리보기 모두 업데이트)
    if (showFullScreenEdit && contentRef.current) {
      contentRef.current.innerHTML = newContent;
    } else if (!showFullScreenEdit && fullScreenContentRef.current) {
      fullScreenContentRef.current.innerHTML = newContent;
    }
  }, [actualCanEdit, debouncedSave, lastSelection, chatRoomId, currentUserId, currentUserName, showFullScreenEdit]);

  // 편집 마커 클릭 핸들러 (형광펜, 취소선, 주석 모두 처리)
  const handleEditMarkerClick = useCallback(async (editId) => {
    // pendingEdits에서 먼저 찾기
    let edit = pendingEdits.find(e => e.id === editId);

    // 없으면 Firestore에서 직접 가져오기
    if (!edit) {
      try {
        const editRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc', 'editHistory', editId);
        const editSnap = await getDoc(editRef);
        if (editSnap.exists()) {
          edit = { id: editSnap.id, ...editSnap.data() };
        }
      } catch (error) {
        console.error('편집 이력 로드 실패:', error);
        return;
      }
    }

    if (edit) {
      setSelectedEdit(edit);
      setShowEditModal(true);
    }
  }, [pendingEdits, chatRoomId]);

  // 취소선 적용 핸들러 (편집 권한자만)
  const handleApplyStrikethrough = useCallback(async () => {
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

    try {
      // Firestore에 취소선 편집 이력 저장
      const editHistoryRef = collection(
        db,
        'chatRooms',
        chatRoomId,
        'sharedDocument',
        'currentDoc',
        'editHistory'
      );

      const editDoc = await addDoc(editHistoryRef, {
        editedBy: currentUserId,
        editedByName: currentUserName,
        editedAt: serverTimestamp(),
        type: 'strikethrough', // 취소선 타입
        text: selectedText,
        status: 'pending'
      });

      // 취소선 표시
      const span = document.createElement('span');
      span.className = 'strikethrough';
      span.dataset.editId = editDoc.id;
      span.dataset.editType = 'strikethrough';

      try {
        range.surroundContents(span);
        selection.removeAllRanges();
        showToast?.('삭제 표시를 추가했습니다');

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
      } catch (e) {
        console.warn('취소선 표시 실패:', e);
        showToast?.('취소선을 적용할 수 없습니다');
      }
    } catch (error) {
      console.error('취소선 저장 실패:', error);
      showToast?.('취소선 저장에 실패했습니다');
    }
  }, [actualCanEdit, chatRoomId, currentUserId, currentUserName, showToast, debouncedSave, showFullScreenEdit]);

  // 형광펜 적용 핸들러 (편집 권한자만)
  const handleApplyHighlighter = useCallback(async () => {
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

    try {
      // Firestore에 형광펜 편집 이력 저장
      const editHistoryRef = collection(
        db,
        'chatRooms',
        chatRoomId,
        'sharedDocument',
        'currentDoc',
        'editHistory'
      );

      const editDoc = await addDoc(editHistoryRef, {
        editedBy: currentUserId,
        editedByName: currentUserName,
        editedAt: serverTimestamp(),
        type: 'highlight', // 형광펜 타입
        text: selectedText,
        status: 'pending'
      });

      // 형광펜 표시
      const span = document.createElement('span');
      span.className = 'highlight';
      span.dataset.editId = editDoc.id;
      span.dataset.editType = 'highlight';

      try {
        range.surroundContents(span);
        selection.removeAllRanges();
        showToast?.('형광펜을 적용했습니다');

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
      } catch (e) {
        console.warn('형광펜 표시 실패:', e);
        showToast?.('형광펜을 적용할 수 없습니다');
      }
    } catch (error) {
      console.error('형광펜 저장 실패:', error);
      showToast?.('형광펜 저장에 실패했습니다');
    }
  }, [actualCanEdit, chatRoomId, currentUserId, currentUserName, showToast, debouncedSave, showFullScreenEdit]);

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
      const editHistoryRef = collection(
        db,
        'chatRooms',
        chatRoomId,
        'sharedDocument',
        'currentDoc',
        'editHistory'
      );

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

  // 최종 적용 핸들러 - 모든 마커 처리 (취소선 삭제, 형광펜/주석 제거)
  const handleFinalApply = useCallback(async () => {
    if (!actualIsManager) {
      showToast?.('매니저만 최종 적용할 수 있습니다');
      return;
    }

    setSaving(true);

    try {
      // HTML 파싱
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;

      // 1. 취소선 처리 - 해당 텍스트 삭제
      const strikethroughs = tempDiv.querySelectorAll('.strikethrough');
      strikethroughs.forEach(el => {
        el.remove(); // 취소선 텍스트 완전 삭제
      });

      // 2. 형광펜 처리 - 마커만 제거하고 텍스트 유지
      const highlights = tempDiv.querySelectorAll('.highlight');
      highlights.forEach(el => {
        const textNode = document.createTextNode(el.textContent);
        el.parentNode.replaceChild(textNode, el);
      });

      // 3. 주석 처리 - 마커만 제거하고 텍스트 유지
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
      const editsRef = collection(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc', 'editHistory');
      const editsSnap = await getDocs(query(editsRef, where('status', '==', 'pending')));
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

        {/* contentEditable 영역 - 미리보기는 읽기 전용 */}
        <ContentEditableArea
          ref={contentRef}
          contentEditable={false}
          suppressContentEditableWarning
          onClick={(e) => {
            const editId = e.target.dataset.editId;
            if (editId) {
              handleEditMarkerClick(editId);
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

      {/* 수정 이력 모달 */}
      {showEditModal && selectedEdit && (
        <Modal onClick={() => setShowEditModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>수정 내용 확인</ModalTitle>
              <IconButton onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </IconButton>
            </ModalHeader>

            <ModalBody>
              <EditInfo>
                <InfoRow>
                  <strong>수정자:</strong> {selectedEdit.editedByName}
                </InfoRow>
                <InfoRow>
                  <strong>수정 시각:</strong> {selectedEdit.editedAt?.toDate?.().toLocaleString('ko-KR')}
                </InfoRow>
                {selectedEdit.type && (
                  <InfoRow>
                    <strong>타입:</strong> {
                      selectedEdit.type === 'strikethrough' ? '취소선' :
                      selectedEdit.type === 'highlight' ? '형광펜' :
                      selectedEdit.type === 'comment' ? '주석' : '일반 수정'
                    }
                  </InfoRow>
                )}
                {selectedEdit.comment && (
                  <InfoRow>
                    <strong>주석:</strong> {selectedEdit.comment}
                  </InfoRow>
                )}
              </EditInfo>

              <TextComparison>
                <ComparisonBox $type="old">
                  <ComparisonLabel $type="old">수정 전</ComparisonLabel>
                  <ComparisonText>{selectedEdit.oldText || selectedEdit.text || '(없음)'}</ComparisonText>
                </ComparisonBox>

                <ComparisonBox $type="new">
                  <ComparisonLabel $type="new">수정 후</ComparisonLabel>
                  <ComparisonText>{selectedEdit.newText || selectedEdit.text}</ComparisonText>
                </ComparisonBox>
              </TextComparison>

              <div style={{ padding: '12px', background: 'rgba(74, 144, 226, 0.1)', borderRadius: '8px', marginTop: '12px' }}>
                <span style={{ color: '#4a90e2', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Info size={16} />
                  수정 내용은 팀원들과 검토 후 일괄 적용됩니다
                </span>
              </div>
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
                onInput={handleContentChange}
                onClick={(e) => {
                  const editId = e.target.dataset.editId;
                  if (editId) {
                    handleEditMarkerClick(editId);
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
