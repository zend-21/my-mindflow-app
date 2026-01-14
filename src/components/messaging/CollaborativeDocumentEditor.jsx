// 📝 실시간 협업 문서 편집기 (모바일 최적화)
// 드래그 선택 → 입력 → 자동 형광표시 → 매니저 컨펌 시스템
import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ChevronUp, Save, X, Users, Lock, FolderOpen, Info, Strikethrough, Highlighter, Maximize2, Eye, Download, Check, FileText, CheckCircle, RotateCcw, ChevronLeft, ChevronRight, UserCog, HelpCircle, MessageCircle } from 'lucide-react';
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  collectionGroup,
  addDoc,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getUserNickname } from '../../services/nicknameService';
import { getAbsoluteOffset, getNodeAndOffset, rangeToAbsoluteOffset, absoluteOffsetToRange } from '../../utils/rangeUtils';
import MarkerCommentsModal from './MarkerCommentsModal';
import CollaborationMemoModal from './CollaborationMemoModal';
import * as S from './CollaborativeDocumentEditor.styles';

// ===== 전역 문서 캐시 (컴포넌트 인스턴스 간 공유) =====
// 컴포넌트가 언마운트되어도 캐시가 유지되도록 전역으로 관리
const globalDocumentCache = new Map();

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
  selectedMemo, // 외부에서 선택한 메모 (불러오기 요청)
  onUpdateMemoPendingFlag, // App.jsx에서 메모 state 업데이트
  onCreateMemoInSharedFolder, // 공유 폴더에 메모 생성 요청
  syncMemo // 메모 동기화 함수
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingEdits, setPendingEdits] = useState([]);
  const [selectedEdits, setSelectedEdits] = useState([]); // 여러 편집 내역 배열
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCommentCounts, setEditCommentCounts] = useState({}); // 각 편집의 댓글 개수
  const [actualCanEdit, setActualCanEdit] = useState(canEdit); // 실시간 권한
  const [actualIsManager, setActualIsManager] = useState(isManager); // 실시간 매니저 여부
  const [actualIsSubManager, setActualIsSubManager] = useState(false); // 실시간 부방장 여부
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [selectedCommentRange, setSelectedCommentRange] = useState(null);
  const [showFullScreenEdit, setShowFullScreenEdit] = useState(false);
  const [showEditInputModal, setShowEditInputModal] = useState(false); // 수정 내용 입력 모달
  const [editInputText, setEditInputText] = useState(''); // 수정할 텍스트 (형광펜: 대체 텍스트)
  const [editReasonText, setEditReasonText] = useState(''); // 설명/이유 (취소선: 삭제 이유, 형광펜: 설명)
  const [pendingMarker, setPendingMarker] = useState(null); // 대기 중인 마커 정보
  const [showImageViewer, setShowImageViewer] = useState(false); // 이미지 원본 보기 모달
  const [viewerImageSrc, setViewerImageSrc] = useState(''); // 보기 중인 이미지 URL
  const [showLoadConfirmModal, setShowLoadConfirmModal] = useState(false); // 문서 불러오기 확인 모달
  const [pendingLoadMemo, setPendingLoadMemo] = useState(null); // 불러오려는 메모 정보
  const [currentDocId, setCurrentDocId] = useState(null); // 현재 열린 문서 ID
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false); // 전체 리셋 확인 모달
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false); // 문서 비우기 확인 모달
  const [editNicknames, setEditNicknames] = useState({}); // 편집 이력의 닉네임 { userId: nickname }
  const [showMarkerDetailModal, setShowMarkerDetailModal] = useState(false); // 마커 상세 정보 모달
  const [selectedMarkerDetail, setSelectedMarkerDetail] = useState(null); // 선택된 마커 정보
  const [showUserIdModal, setShowUserIdModal] = useState(false); // 사용자 ID 복사 모달
  const [selectedUserId, setSelectedUserId] = useState(''); // 선택된 사용자 ID
  const [showApproveAllModal, setShowApproveAllModal] = useState(false); // 전체 승인 확인 모달
  const [showPermissionModal, setShowPermissionModal] = useState(false); // 권한 관리 모달
  const [participants, setParticipants] = useState([]); // 대화방 참여자 목록
  const [isOneOnOneChat, setIsOneOnOneChat] = useState(false); // 1:1 대화방 여부
  const [invitePermission, setInvitePermission] = useState('managers_and_submanagers'); // 초대 권한 설정
  const [showPermissionGuideModal, setShowPermissionGuideModal] = useState(false); // 권한 안내 모달
  const [documentOwner, setDocumentOwner] = useState(null); // 현재 문서 소유자 정보 { userId, nickname, wsCode }
  const [originalOwner, setOriginalOwner] = useState(null); // 원본 작성자 정보 { userId, nickname, wsCode }
  const [showOwnerModal, setShowOwnerModal] = useState(false); // 문서 소유자 ID 모달
  const [showRejectConfirmModal, setShowRejectConfirmModal] = useState(false); // 거부 확인 모달
  const [showApproveConfirmModal, setShowApproveConfirmModal] = useState(false); // 승인 확인 모달
  const [pendingAction, setPendingAction] = useState(null); // 대기 중인 작업 정보
  const [showTempDocLoadWarningModal, setShowTempDocLoadWarningModal] = useState(false); // 임시 문서 불러오기 경고 모달
  const [showMarkerCommentsModal, setShowMarkerCommentsModal] = useState(false); // 마커 의견 제시 모달
  const [selectedMarkerForComments, setSelectedMarkerForComments] = useState(null); // 의견을 볼 마커 정보
  const [showNewMemoModal, setShowNewMemoModal] = useState(false); // 새 문서 작성 모달
  const [showWithdrawConfirmModal, setShowWithdrawConfirmModal] = useState(false); // 제안 철회 확인 모달
  const [pendingWithdrawEdit, setPendingWithdrawEdit] = useState(null); // 철회 대기 중인 편집 정보
  const [downloadEnabled, setDownloadEnabled] = useState(false); // 다운로드 허용 여부
  const [canDownload, setCanDownload] = useState(false); // 현재 사용자가 다운로드 가능한지 여부
  const [showDownloadConfirmModal, setShowDownloadConfirmModal] = useState(false); // 다운로드 허용 확인 모달

  const contentRef = useRef(null);
  const fullScreenContentRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const savedRangeRef = useRef(null); // 선택 영역 저장용
  const programmaticChangeRef = useRef(false); // 프로그래밍 방식 변경 플래그
  // documentCache는 이제 전역 변수 globalDocumentCache 사용 (컴포넌트 언마운트 시에도 유지)

  // 키보드 선택 모드 상태
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionType, setSelectionType] = useState(null); // 'strikethrough' | 'highlight'
  const selectionStartRef = useRef(null); // 선택 시작 위치
  const currentSelectionRef = useRef(null); // 현재 선택 범위
  const tempMarkerRef = useRef(null); // 임시 마커 (시각 효과용)

  // 수정 영역 네비게이션 상태
  const [currentEditIndex, setCurrentEditIndex] = useState(0);

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

  // 권한 확인 - 통합 로직 (1:1 및 그룹 모두 문서 소유자 기반)
  useEffect(() => {
    if (!chatRoomId || !currentUserId) return;

    let isMounted = true;

    // 통합된 권한 로드 함수
    const loadDocumentPermissions = async () => {
      try {
        // 1. 대화방 정보 조회
        const roomRef = doc(db, 'chatRooms', chatRoomId);
        const roomSnap = await getDoc(roomRef);

        if (!isMounted || !roomSnap.exists()) return;

        const roomData = roomSnap.data();
        const isOneOnOne = roomData.type !== 'group' && !roomData.isGroupChat;
        setIsOneOnOneChat(isOneOnOne);

        // 2. 문서 정보 조회
        const docRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc');
        const docSnap = await getDoc(docRef);

        if (isMounted && docSnap.exists()) {
          // 문서가 존재하는 경우
          const docData = docSnap.data();
          const isDocOwner = docData.lastEditedBy === currentUserId;

          // 1:1 대화방: 모두 마커 추가 가능
          // 그룹 대화방: 문서 소유자만 편집 가능
          const canEditDoc = isOneOnOne ? true : isDocOwner;

          setActualCanEdit(canEditDoc);
          setActualIsManager(isDocOwner);

          console.log('📋 문서 기반 권한 설정:', {
            chatType: isOneOnOne ? '1:1' : '그룹',
            documentOwner: docData.lastEditedBy,
            currentUser: currentUserId,
            isDocOwner,
            canEdit: canEditDoc
          });
        } else {
          // 문서가 없는 경우: 모두 편집 가능 (누구든 문서를 불러올 수 있음)
          setActualCanEdit(true);
          setActualIsManager(true);

          console.log('📋 문서 없음 - 모두 편집 가능:', {
            chatType: isOneOnOne ? '1:1' : '그룹'
          });
        }

        // 3. 그룹 채팅인 경우 추가 권한 정보 로드 (초대 권한 등)
        if (!isOneOnOne) {
          const isActualSubManager = roomData.subManagers?.includes(currentUserId) || false;
          setActualIsSubManager(isActualSubManager);

          // 초대 권한 설정 로드
          const invitePerm = roomData.invitePermission || 'managers_and_submanagers';
          setInvitePermission(invitePerm);
        } else {
          setActualIsSubManager(false);
        }

      } catch (error) {
        if (error.code !== 'permission-denied') {
          console.error('권한 로드 오류:', error);
        }
        // 오류 시 기본값 설정
        setActualCanEdit(true);
        setActualIsManager(true);
      }
    };

    loadDocumentPermissions();

    return () => {
      isMounted = false;
    };
  }, [chatRoomId, currentUserId, chatType]);

  // 임시 문서 감지 (상대방이 작성 중인 경우)
  useEffect(() => {
    if (!chatRoomId || !isOneOnOneChat) return;

    const docRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();

        // 상대방이 임시 문서를 생성한 경우
        if (data.isTemporary && data.createdBy !== currentUserId) {
          // 임시 문서 ID 설정 (상대방 작성 중 표시용)
          if (!currentDocId) {
            setCurrentDocId(data.tempDocId);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [chatRoomId, currentUserId, isOneOnOneChat, currentDocId]);

  // 편집 이력의 닉네임 실시간 가져오기
  useEffect(() => {
    const fetchNicknames = async () => {
      const userIds = [...new Set(pendingEdits.map(edit => edit.editedBy))];
      const nicknameMap = {};

      for (const userId of userIds) {
        if (userId) {
          const nickname = await getUserNickname(userId);
          nicknameMap[userId] = nickname || '익명';
        }
      }

      setEditNicknames(nicknameMap);
    };

    if (pendingEdits.length > 0) {
      fetchNicknames();
    }
  }, [pendingEdits]);

  // 사용자의 쉐어노트 ID 가져오기
  const getUserWorkspaceId = async (userId) => {
    try {
      const workspaceId = `workspace_${userId}`;
      const workspaceRef = doc(db, 'workspaces', workspaceId);
      const workspaceDoc = await getDoc(workspaceRef);

      if (workspaceDoc.exists()) {
        const wsCode = workspaceDoc.data().workspaceCode;
        // "WS-Y3T1ZM"에서 "Y3T1ZM"만 추출
        const idOnly = (wsCode?.split('-')[1] || wsCode || '').toUpperCase();
        return idOnly;
      }
      return null;
    } catch (error) {
      console.error('워크스페이스 ID 조회 실패:', error);
      return null;
    }
  };

  // 메모 문서의 hasPendingEdits 플래그 업데이트
  const updateMemoPendingFlag = async (memoId, hasPending) => {
    if (!memoId || !currentUserId) return;

    // 임시 문서는 스킵 (아직 Firestore에 저장되지 않음)
    if (memoId.startsWith('temp_')) {
      return;
    }

    try {
      const memoRef = doc(db, 'mindflowUsers', currentUserId, 'memos', memoId);

      // 먼저 문서가 존재하는지 확인
      const memoSnap = await getDoc(memoRef);
      if (!memoSnap.exists()) {
        console.error(`❌ 메모 문서가 존재하지 않음: ${memoId}`);
        return;
      }

      // hasPendingEdits와 currentWorkingRoomId를 함께 업데이트
      const updateData = {
        hasPendingEdits: hasPending
      };

      // pending 상태이면 currentWorkingRoomId도 설정
      if (hasPending) {
        console.log('🔧 [updateMemoPendingFlag] chatRoomId 설정:', chatRoomId);
        updateData.currentWorkingRoomId = chatRoomId;
      }

      console.log('💾 [updateMemoPendingFlag] Firestore 업데이트 데이터:', updateData);
      await updateDoc(memoRef, updateData);

      // 저장 후 다시 읽어서 확인
      const updatedSnap = await getDoc(memoRef);
      const actualValue = updatedSnap.data()?.hasPendingEdits;
      console.log(`✏️ 메모 ${memoId} pending 플래그 업데이트:`, hasPending, '/ 실제 저장된 값:', actualValue);

      // ⭐ App.jsx의 메모 state도 즉시 업데이트 (새로고침 없이 배지 표시)
      if (onUpdateMemoPendingFlag) {
        onUpdateMemoPendingFlag(memoId, hasPending);
      }
    } catch (error) {
      console.error('메모 pending 플래그 업데이트 실패:', error);
    }
  };

  // 문서 및 편집 이력 로드 (일회성 읽기)
  const loadDocument = useCallback(async () => {
    if (!chatRoomId) return;

    try {
      const docRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc');
      const docSnap = await getDoc(docRef);

      let memoId = null;

      if (docSnap.exists()) {
        const data = docSnap.data();

        // 첫 번째 줄을 제목으로 자동 설정 (16자 제한)
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = data.content || '';
        const textContent = tempDiv.textContent || '';
        const firstLine = textContent.split('\n')[0].trim();
        const autoTitle = firstLine && firstLine.length > 0
          ? (firstLine.length > 16 ? firstLine.substring(0, 16) : firstLine)
          : (data.title || '');

        setTitle(autoTitle);
        setContent(data.content || '');
        setCurrentDocId(data.originalMemoId || null);
        memoId = data.originalMemoId;

        // contentEditable 영역 업데이트
        if (contentRef.current) {
          contentRef.current.innerHTML = data.content || '';
        }

        // 문서 소유자 정보 설정 (Firestore의 lastEditedBy 사용)
        const hasActualContent = (data.content && data.content.trim()) || data.originalMemoId;
        if (hasActualContent && data.lastEditedBy) {
          // 문서 소유자의 최신 닉네임 조회
          let ownerNickname = data.lastEditedByName || '알 수 없음';
          try {
            const latestNickname = await getUserNickname(data.lastEditedBy);
            if (latestNickname) {
              ownerNickname = latestNickname;
            }
          } catch (error) {
            console.log('닉네임 조회 실패, Firestore 값 사용:', error);
          }

          // 워크스페이스 코드 가져오기
          let wsCode = null;
          try {
            const workspaceId = `workspace_${data.lastEditedBy}`;
            const workspaceRef = doc(db, 'workspaces', workspaceId);
            const workspaceSnap = await getDoc(workspaceRef);
            if (workspaceSnap.exists()) {
              wsCode = workspaceSnap.data().workspaceCode || null;
            }
          } catch (error) {
            console.log('워크스페이스 코드 조회 실패:', error);
          }

          // 최신 닉네임으로 문서 소유자 정보 설정
          setDocumentOwner({
            userId: data.lastEditedBy,
            nickname: ownerNickname,
            wsCode: wsCode
          });

          console.log('📋 초기 문서 로드 - 문서 소유자:', {
            userId: data.lastEditedBy,
            nickname: ownerNickname,
            wsCode,
            currentUserId
          });
        } else {
          // 내용이 없으면 소유자 정보도 없음
          setDocumentOwner(null);
        }
      } else {
        // 문서가 없으면 빈 상태로 초기화
        setTitle('');
        setContent('');
        setCurrentDocId(null);
        setDocumentOwner(null);
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
  }, [chatRoomId, currentUserId, currentUserName]);

  // 초기 로드
  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  // 실시간 편집 이력 구독 (댓글 개수 포함)
  useEffect(() => {
    if (!chatRoomId || !currentDocId) return;

    const editsRef = collection(db, 'chatRooms', chatRoomId, 'documents', currentDocId, 'editHistory');
    const q = query(editsRef, where('status', '==', 'pending'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const edits = [];

      for (const docSnap of snapshot.docs) {
        const editData = { id: docSnap.id, ...docSnap.data() };

        // 각 편집의 댓글 개수 조회
        const commentsRef = collection(db, 'chatRooms', chatRoomId, 'documents', currentDocId, 'editHistory', docSnap.id, 'comments');
        const commentsSnapshot = await getDocs(commentsRef);
        editData.commentCount = commentsSnapshot.size;

        edits.push(editData);
      }

      setPendingEdits(edits);
    });

    return () => unsubscribe();
  }, [chatRoomId, currentDocId]);

  // pendingMarker의 commentCount 업데이트
  useEffect(() => {
    if (!pendingMarker || !pendingMarker.id) return;

    const updatedEdit = pendingEdits.find(edit => edit.id === pendingMarker.id);
    if (updatedEdit && updatedEdit.commentCount !== pendingMarker.commentCount) {
      setPendingMarker(prev => ({
        ...prev,
        commentCount: updatedEdit.commentCount
      }));
    }
  }, [pendingEdits, pendingMarker]);

  // selectedMarkerDetail의 commentCount 업데이트
  useEffect(() => {
    if (!selectedMarkerDetail || !selectedMarkerDetail.id) return;

    const updatedEdit = pendingEdits.find(edit => edit.id === selectedMarkerDetail.id);
    if (updatedEdit && updatedEdit.commentCount !== undefined) {
      // commentCount가 다를 때만 업데이트
      if (selectedMarkerDetail.commentCount !== updatedEdit.commentCount) {
        setSelectedMarkerDetail(prev => ({
          ...prev,
          commentCount: updatedEdit.commentCount
        }));
      }
    }
  }, [pendingEdits]);

  // 참여자 목록 로드
  const loadParticipants = useCallback(async () => {
    if (!chatRoomId) return;

    try {
      const roomRef = doc(db, 'chatRooms', chatRoomId);
      const roomSnap = await getDoc(roomRef);

      if (roomSnap.exists()) {
        const roomData = roomSnap.data();
        const participantIds = roomData.participants || [];

        // 각 참여자의 정보 가져오기
        const participantList = await Promise.all(
          participantIds.map(async (userId) => {
            try {
              // 닉네임 가져오기
              const nickname = await getNickname(userId);

              // 권한 정보 확인
              const isManager = roomData.managers?.includes(userId) || false;
              const isSubManager = roomData.subManagers?.includes(userId) || false;
              const isEditor = roomData.editors?.includes(userId) || false;

              return {
                userId,
                nickname,
                isManager,
                isSubManager,
                isEditor,
                isViewer: !isManager && !isSubManager && !isEditor
              };
            } catch (error) {
              console.error('참여자 정보 로드 실패:', userId, error);
              return {
                userId,
                nickname: '알 수 없음',
                isManager: false,
                isSubManager: false,
                isEditor: false,
                isViewer: true
              };
            }
          })
        );

        setParticipants(participantList);
      }
    } catch (error) {
      console.error('참여자 목록 로드 실패:', error);
    }
  }, [chatRoomId]);

  // 권한 변경 함수
  const handlePermissionChange = useCallback(async (userId, newRole) => {
    // 방장이 아니고 부방장도 아니면 권한 없음
    if (!actualIsManager && !actualIsSubManager) return;
    if (!chatRoomId) return;

    // 부방장은 편집자/뷰어만 변경 가능
    if (actualIsSubManager && !actualIsManager) {
      if (newRole !== 'editor' && newRole !== 'viewer') {
        showToast?.('부방장은 편집자 권한만 관리할 수 있습니다');
        return;
      }
    }

    try {
      const roomRef = doc(db, 'chatRooms', chatRoomId);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        showToast?.('대화방 정보를 찾을 수 없습니다');
        return;
      }

      const roomData = roomSnap.data();
      let managers = roomData.managers || [];
      let subManagers = roomData.subManagers || [];
      let editors = roomData.editors || [];

      // 기존 권한 제거
      managers = managers.filter(id => id !== userId);
      subManagers = subManagers.filter(id => id !== userId);
      editors = editors.filter(id => id !== userId);

      // 새 권한 추가
      if (newRole === 'manager') {
        managers.push(userId);
      } else if (newRole === 'submanager') {
        subManagers.push(userId);
      } else if (newRole === 'editor') {
        editors.push(userId);
      }
      // viewer는 별도 배열 없이 managers, subManagers, editors에 없으면 자동으로 viewer

      // Firestore 업데이트
      await setDoc(roomRef, {
        managers,
        subManagers,
        editors
      }, { merge: true });

      // 참여자 목록 새로고침
      await loadParticipants();

      showToast?.('권한이 변경되었습니다');
    } catch (error) {
      console.error('권한 변경 실패:', error);
      showToast?.('권한 변경에 실패했습니다');
    }
  }, [actualIsManager, actualIsSubManager, chatRoomId, showToast, loadParticipants]);

  // 초대 권한 설정 변경 (방장만 가능)
  const handleInvitePermissionChange = useCallback(async (newPermission) => {
    if (!actualIsManager) {
      showToast?.('방장만 초대 권한을 변경할 수 있습니다');
      return;
    }

    if (!chatRoomId) return;

    try {
      const roomRef = doc(db, 'chatRooms', chatRoomId);
      await setDoc(roomRef, {
        invitePermission: newPermission
      }, { merge: true });

      setInvitePermission(newPermission);
      showToast?.('초대 권한 설정이 변경되었습니다');
    } catch (error) {
      console.error('초대 권한 변경 실패:', error);
      showToast?.('초대 권한 변경에 실패했습니다');
    }
  }, [actualIsManager, chatRoomId, showToast]);

  // 문서 불러오기 버튼 클릭 시 실행될 핸들러
  const handleLoadClick = async () => {
    // 임시 문서가 있으면 경고 모달 표시
    if (currentDocId && currentDocId.startsWith('temp_') && content && content.trim()) {
      setShowTempDocLoadWarningModal(true);
      return;
    }

    if (onLoadFromShared) {
      // 공유 폴더 메모 선택 모달 열기
      await onLoadFromShared();
    }
  };

  // 임시 문서 경고 무시하고 불러오기 진행
  const proceedLoadFromShared = async () => {
    setShowTempDocLoadWarningModal(false);
    if (onLoadFromShared) {
      await onLoadFromShared();
    }
  };

  // 🔧 마커 재생성 함수 - editHistory를 기반으로 HTML에 마커 복원
  const reconstructMarkersFromEditHistory = useCallback((htmlContent, edits) => {
    if (!edits || edits.length === 0) return htmlContent;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // editHistory를 순회하며 마커 재생성
    edits.forEach(edit => {
      const { id, type, oldText } = edit;

      // oldText와 일치하는 텍스트 노드를 찾아서 마커로 감싸기
      const walker = document.createTreeWalker(
        tempDiv,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }

      for (const textNode of textNodes) {
        const text = textNode.textContent;
        if (text && text.includes(oldText)) {
          const parent = textNode.parentNode;

          // 이미 마커로 감싸져 있는지 확인
          if (parent.dataset && parent.dataset.editId) {
            continue;
          }

          const index = text.indexOf(oldText);
          if (index !== -1) {
            // 텍스트를 3부분으로 분할: 이전 | 마커 대상 | 이후
            const before = text.substring(0, index);
            const match = text.substring(index, index + oldText.length);
            const after = text.substring(index + oldText.length);

            const fragment = document.createDocumentFragment();

            if (before) {
              fragment.appendChild(document.createTextNode(before));
            }

            // 마커 span 생성
            const markerSpan = document.createElement('span');
            markerSpan.dataset.editId = id;
            markerSpan.dataset.editType = type || 'highlight';
            markerSpan.className = type || 'highlight';
            markerSpan.textContent = match;
            fragment.appendChild(markerSpan);

            if (after) {
              fragment.appendChild(document.createTextNode(after));
            }

            parent.replaceChild(fragment, textNode);
            break; // 각 edit는 한 번만 적용
          }
        }
      }
    });

    return tempDiv.innerHTML;
  }, []);

  // 실제 문서 로드 수행
  const performLoadDocument = useCallback(async (memo) => {
    try {
      const currentDocRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc');

      // 1. 편집 이력 먼저 로드 (마커 재생성을 위해)
      const editsRef = collection(db, 'chatRooms', chatRoomId, 'documents', memo.id, 'editHistory');
      const editsSnap = await getDocs(query(editsRef, where('status', '==', 'pending')));

      const edits = [];
      editsSnap.forEach((doc) => {
        edits.push({ id: doc.id, ...doc.data() });
      });

      console.log('📝 편집 이력 먼저 로드 - 개수:', edits.length);

      // 2. 로컬 캐시에서 편집 중인 버전 확인 (우선순위 1)
      // 원본 메모의 최신 데이터 가져오기 (승인된 내용 반영)
      let memoData = memo;
      try {
        const memoRef = doc(db, 'mindflowUsers', currentUserId, 'memos', memo.id);
        const memoSnap = await getDoc(memoRef);
        if (memoSnap.exists()) {
          memoData = { id: memo.id, ...memoSnap.data() };
          console.log('📄 Firestore에서 최신 메모 데이터 로드:', memo.id);

          // ⭐ 다른 방에서 협업 중인지 확인
          if (memoData.currentWorkingRoomId && memoData.currentWorkingRoomId !== chatRoomId) {
            showToast?.('이 문서는 다른 대화방에서 협업 중입니다. 먼저 해당 대화방에서 문서를 비우거나 승인해주세요.');
            console.warn('❌ 다른 방에서 협업 중:', memoData.currentWorkingRoomId);
            return;
          }
        }
      } catch (error) {
        console.error('원본 메모 로드 실패, 전달된 memo 사용:', error);
      }

      let contentToLoad = memoData.content || '';
      let titleToLoad = extractTitleFromContent(memoData.content || '');

      console.log('📄 문서 불러오기 시작 - ID:', memo.id);
      console.log('📄 원본 memo.content 길이:', memoData.content?.length || 0);
      console.log('📄 원본 컨텐츠에 마커 포함?', memoData.content?.includes('data-edit-id') || false);

      if (globalDocumentCache.has(memo.id)) {
        const cached = globalDocumentCache.get(memo.id);
        contentToLoad = cached.content;
        titleToLoad = cached.title;
        console.log('✅ 캐시에서 편집 중이던 문서 복원:', memo.id);
        console.log('📄 캐시 컨텐츠 길이:', contentToLoad.length);
        console.log('📄 캐시 컨텐츠에 마커 포함?', contentToLoad.includes('data-edit-id'));
      } else {
        // 3. currentDoc에서 편집 중인 버전 확인 (우선순위 2)
        const currentDocSnap = await getDoc(currentDocRef);
        if (currentDocSnap.exists()) {
          const currentDocData = currentDocSnap.data();
          if (currentDocData.originalMemoId === memo.id && currentDocData.content) {
            contentToLoad = currentDocData.content;
            titleToLoad = currentDocData.title || titleToLoad;
            console.log('✅ Firestore에서 편집 중이던 문서 복원:', memo.id);
            console.log('📄 Firestore 컨텐츠 길이:', contentToLoad.length);
            console.log('📄 Firestore 컨텐츠에 마커 포함?', contentToLoad.includes('data-edit-id'));
          } else {
            console.log('⚠️ currentDoc에 해당 문서 없음, 원본 사용');
          }
        } else {
          console.log('⚠️ currentDoc 자체가 없음, 원본 사용');
        }
      }

      // 4. ⭐ 마커 재생성: editHistory가 있는데 HTML에 마커가 없으면 재생성
      if (edits.length > 0 && !contentToLoad.includes('data-edit-id')) {
        console.log('🔧 마커 정보가 손실됨 - editHistory 기반으로 마커 재생성 시작');
        contentToLoad = reconstructMarkersFromEditHistory(contentToLoad, edits);
        console.log('✅ 마커 재생성 완료');
        console.log('📄 재생성 후 컨텐츠에 마커 포함?', contentToLoad.includes('data-edit-id'));

        // 재생성된 content를 캐시에 저장
        globalDocumentCache.set(memo.id, {
          title: titleToLoad,
          content: contentToLoad
        });
        console.log('💾 재생성된 마커를 캐시에 저장:', memo.id);
      }

      // 5. 원본 문서의 소유자 정보 가져오기 (memoData.userId)
      const originalOwnerId = memoData.userId || currentUserId;
      let ownerNickname;
      let wsCode = null;

      try {
        // 원본 문서 작성자의 닉네임 조회
        ownerNickname = await getUserNickname(originalOwnerId);

        // 원본 문서 작성자의 워크스페이스 코드 조회
        const workspaceId = `workspace_${originalOwnerId}`;
        const workspaceRef = doc(db, 'workspaces', workspaceId);
        const workspaceSnap = await getDoc(workspaceRef);
        wsCode = workspaceSnap.exists() ? workspaceSnap.data().workspaceCode : null;

        console.log('✅ 원본 문서 소유자 정보:', { userId: originalOwnerId, nickname: ownerNickname, wsCode });
      } catch (error) {
        console.error('문서 소유자 정보 조회 실패:', error);
        ownerNickname = currentUserName;
      }

      // 6. currentDoc 업데이트 (문서 불러오기 - 원본 소유자 유지)
      // 기존 문서의 소유자 정보 확인
      const existingDocSnap = await getDoc(currentDocRef);
      const existingData = existingDocSnap.exists() ? existingDocSnap.data() : {};

      // 문서 소유자는 원본 문서의 소유자로 설정 (기존에 있으면 기존 유지, 없으면 원본 소유자)
      const docOwner = existingData.lastEditedBy || originalOwnerId;
      const docOwnerName = existingData.lastEditedByName || (ownerNickname || currentUserName);

      await setDoc(currentDocRef, {
        title: titleToLoad,
        content: contentToLoad,
        originalMemoId: memo.id,
        lastEditedBy: docOwner,
        lastEditedByName: docOwnerName,
        lastEditedAt: existingData.lastEditedAt || serverTimestamp()
      }, { merge: true });

      // 6-1. 원본 메모에 currentWorkingRoomId 설정 (현재 대화방에서 작업 중임을 표시)
      try {
        // memo.userId가 없으면 currentUserId 사용 (공유 폴더 메모는 현재 사용자의 memos에 저장됨)
        const ownerUserId = memo.userId || currentUserId;
        const memoRef = doc(db, 'mindflowUsers', ownerUserId, 'memos', memo.id);

        await setDoc(memoRef, {
          currentWorkingRoomId: chatRoomId,
          hasPendingEdits: edits.length > 0
        }, { merge: true });
        console.log('✅ 원본 메모에 currentWorkingRoomId 설정:', memo.id, '→', chatRoomId, 'hasPendingEdits:', edits.length > 0, '(edits:', edits.length, '개)', '경로:', memoRef.path);
      } catch (error) {
        console.error('원본 메모 currentWorkingRoomId 설정 실패:', error);
      }

      // 7. 로컬 상태 업데이트
      setTitle(titleToLoad);
      setContent(contentToLoad);
      setCurrentDocId(memo.id);

      // 8. contentEditable 영역 업데이트
      if (contentRef.current) {
        contentRef.current.innerHTML = contentToLoad;
      }
      if (fullScreenContentRef.current) {
        fullScreenContentRef.current.innerHTML = contentToLoad;
      }

      // 9. pendingEdits 업데이트
      setPendingEdits(edits.length > 0 ? edits : []);

      // 10. documentOwner 설정 (문서를 불러온 사람)
      setDocumentOwner({
        userId: currentUserId,
        nickname: ownerNickname || currentUserName || '알 수 없음',
        wsCode: wsCode
      });

      showToast?.('문서를 불러왔습니다');
      setShowLoadConfirmModal(false);
      setPendingLoadMemo(null);
    } catch (error) {
      console.error('문서 불러오기 실패:', error);
      showToast?.('문서 불러오기에 실패했습니다');
    }
  }, [chatRoomId, currentUserId, currentUserName, showToast, reconstructMarkersFromEditHistory]);

  // 실제 문서 불러오기 처리 (ChatRoom에서 호출)
  const handleLoadDocument = useCallback(async (memo) => {
    if (!memo) return;

    // 동일한 문서를 다시 불러오는 경우 체크
    // 단, currentDocId가 null이 아니고, 내용이 실제로 있을 때만 차단
    const hasContent = (content && content.trim()) || (title && title.trim());
    if (currentDocId && currentDocId === memo.id && hasContent) {
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

  // 이미지 클릭 시 원본 보기
  const handleImageClick = useCallback((imgSrc) => {
    setViewerImageSrc(imgSrc);
    setShowImageViewer(true);
  }, []);

  // 이미지 뷰어 닫기
  const handleCloseImageViewer = useCallback(() => {
    setShowImageViewer(false);
    setViewerImageSrc('');
  }, []);

  // 이미지 클릭 이벤트 리스너 등록
  useEffect(() => {
    const handleClick = (e) => {
      if (e.target.tagName === 'IMG') {
        e.preventDefault();
        handleImageClick(e.target.src);
      }
    };

    const contentElement = contentRef.current;
    const fullScreenElement = fullScreenContentRef.current;

    if (contentElement) {
      contentElement.addEventListener('click', handleClick);
    }
    if (fullScreenElement) {
      fullScreenElement.addEventListener('click', handleClick);
    }

    return () => {
      if (contentElement) {
        contentElement.removeEventListener('click', handleClick);
      }
      if (fullScreenElement) {
        fullScreenElement.removeEventListener('click', handleClick);
      }
    };
  }, [handleImageClick, showFullScreenEdit]);

  // 이미지 뷰어에서 ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showImageViewer) {
        handleCloseImageViewer();
      }
    };

    if (showImageViewer) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showImageViewer, handleCloseImageViewer]);

  // 외부에서 메모를 선택했을 때 처리
  const lastSelectedMemoIdRef = useRef(null);

  // 수정 영역으로 이동하는 함수
  const scrollToEdit = useCallback((index) => {
    if (pendingEdits.length === 0) return;

    const editId = pendingEdits[index]?.id;
    if (!editId) return;

    // 편집 마커 찾기
    const activeRef = showFullScreenEdit ? fullScreenContentRef : contentRef;
    if (!activeRef.current) return;

    const marker = activeRef.current.querySelector(`[data-edit-id="${editId}"]`);
    if (marker) {
      // 부드럽게 스크롤
      marker.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // 임시로 하이라이트 효과
      marker.style.transition = 'all 0.3s';
      marker.style.transform = 'scale(1.1)';
      marker.style.boxShadow = '0 0 10px rgba(255, 193, 7, 0.8)';

      setTimeout(() => {
        marker.style.transform = 'scale(1)';
        marker.style.boxShadow = 'none';
      }, 500);
    }
  }, [pendingEdits, showFullScreenEdit]);

  // 다음 수정 영역으로 이동
  const handleNextEdit = useCallback(() => {
    if (pendingEdits.length === 0) return;

    const nextIndex = (currentEditIndex + 1) % pendingEdits.length;
    setCurrentEditIndex(nextIndex);
    scrollToEdit(nextIndex);
  }, [currentEditIndex, pendingEdits.length, scrollToEdit]);

  // 이전 수정 영역으로 이동
  const handlePrevEdit = useCallback(() => {
    if (pendingEdits.length === 0) return;

    const prevIndex = currentEditIndex === 0 ? pendingEdits.length - 1 : currentEditIndex - 1;
    setCurrentEditIndex(prevIndex);
    scrollToEdit(prevIndex);
  }, [currentEditIndex, pendingEdits.length, scrollToEdit]);

  // pendingEdits 변경 시 인덱스 초기화
  useEffect(() => {
    if (pendingEdits.length === 0) {
      setCurrentEditIndex(0);
    } else if (currentEditIndex >= pendingEdits.length) {
      setCurrentEditIndex(pendingEdits.length - 1);
    }
  }, [pendingEdits.length, currentEditIndex]);

  useEffect(() => {
    if (selectedMemo && selectedMemo.id !== lastSelectedMemoIdRef.current) {
      lastSelectedMemoIdRef.current = selectedMemo.id;
      handleLoadDocument(selectedMemo);
    }
    // handleLoadDocument는 의존성에서 제외 (무한 루프 방지)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMemo]);

  // 실시간 편집 이력 감시
  useEffect(() => {
    if (!currentDocId || !chatRoomId) {
      setPendingEdits([]);
      return;
    }

    const editHistoryRef = collection(
      db,
      'chatRooms',
      chatRoomId,
      'documents',
      currentDocId,
      'editHistory'
    );

    const q = query(editHistoryRef, where('status', '==', 'pending'));
    const commentUnsubscribers = new Map();

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const currentEditIds = new Set();

      snapshot.forEach((docSnap) => {
        currentEditIds.add(docSnap.id);

        // 이미 리스너가 있는 경우 스킵
        if (commentUnsubscribers.has(docSnap.id)) {
          return;
        }

        // 각 edit의 comments에 대한 실시간 리스너 추가
        const commentsRef = collection(
          db,
          'chatRooms',
          chatRoomId,
          'documents',
          currentDocId,
          'editHistory',
          docSnap.id,
          'comments'
        );

        const commentUnsub = onSnapshot(commentsRef, (commentsSnap) => {
          const commentCount = commentsSnap.size;

          // pendingEdits 업데이트
          setPendingEdits(prev => {
            const existingEdit = prev.find(e => e.id === docSnap.id);
            if (existingEdit) {
              // 기존 edit의 commentCount만 업데이트
              return prev.map(edit =>
                edit.id === docSnap.id
                  ? { ...edit, commentCount }
                  : edit
              );
            } else {
              // 새 edit 추가
              return [...prev, { id: docSnap.id, ...docSnap.data(), commentCount }];
            }
          });
        });

        commentUnsubscribers.set(docSnap.id, commentUnsub);
      });

      // 삭제된 edit 제거 및 리스너 정리
      setPendingEdits(prev => {
        const filtered = prev.filter(edit => {
          if (currentEditIds.has(edit.id)) {
            return true;
          } else {
            // 리스너 정리
            const unsub = commentUnsubscribers.get(edit.id);
            if (unsub) {
              unsub();
              commentUnsubscribers.delete(edit.id);
            }
            return false;
          }
        });
        return filtered;
      });
    }, (error) => {
      if (error.code !== 'permission-denied') {
        console.error('편집 이력 실시간 감시 오류:', error);
      }
    });

    return () => {
      unsubscribe();
      // 모든 댓글 리스너 정리
      commentUnsubscribers.forEach(unsub => unsub());
      commentUnsubscribers.clear();
    };
  }, [currentDocId, chatRoomId]);

  // 실시간 문서 내용 및 마커 감시 (chatRoomId만 의존)
  useEffect(() => {
    if (!chatRoomId) {
      return;
    }

    const docRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc');

    console.log('🔊 실시간 리스너 시작 - chatRoomId:', chatRoomId);

    const unsubscribe = onSnapshot(docRef, async (snapshot) => {
      // 문서가 삭제된 경우 (다른 사용자가 문서 비우기 수행)
      if (!snapshot.exists()) {
        console.log('📡 문서 삭제 감지 - 실시간 비우기');
        programmaticChangeRef.current = true;
        setContent('');
        setTitle('');
        setCurrentDocId(null);
        setPendingEdits([]);
        setDocumentOwner(null);

        // 통합 권한 업데이트: 문서가 없으면 모두 편집 가능 (1:1 및 그룹 모두 동일)
        setActualCanEdit(true);
        setActualIsManager(true);
        console.log('📡 문서 비움 → 모두 편집 가능 (누구든 문서를 불러올 수 있음)');

        if (contentRef.current) {
          contentRef.current.innerHTML = '';
        }
        if (fullScreenContentRef.current) {
          fullScreenContentRef.current.innerHTML = '';
        }
        return;
      }

      // 문서가 존재하는 경우 (업데이트 또는 불러오기)
      const data = snapshot.data();

      // 다운로드 허용 상태 업데이트
      setDownloadEnabled(data.downloadEnabled || false);
      setCanDownload(data.downloadEnabled && data.lastEditedBy !== currentUserId);

      // 내용이 변경된 경우 반영 (다른 사용자의 마커 추가 포함)
      const hasContentChanged = data.content !== content;
      const isDifferentUser = data.lastEditedBy && data.lastEditedBy !== currentUserId;
      const incomingDocId = data.memoId || data.originalMemoId;

      // 현재 작업 중인 문서와 다른 문서가 들어오면 무시 (자동 전환 방지)
      if (currentDocId && incomingDocId && currentDocId !== incomingDocId) {
        console.log('⚠️ 다른 문서 감지 - 자동 전환 방지:', {
          current: currentDocId,
          incoming: incomingDocId,
          message: '현재 작업 중인 문서를 유지합니다'
        });
        return;
      }

      if (isDifferentUser || hasContentChanged) {
        console.log('📡 문서 실시간 업데이트 감지:', incomingDocId,
          isDifferentUser ? `from user: ${data.lastEditedBy}` : '(content changed)');

        // 임시 문서는 동기화하지 않음
        if (data.memoId?.startsWith('temp_')) {
          console.log('⏭️ 임시 문서 무시');
          return;
        }

        // content와 title 업데이트
        programmaticChangeRef.current = true;
        setContent(data.content || '');
        setTitle(data.title || '');
        setCurrentDocId(incomingDocId);

        // 문서 소유자의 최신 닉네임 조회
        let ownerNickname = data.lastEditedByName || '알 수 없음';
        try {
          const latestNickname = await getUserNickname(data.lastEditedBy);
          if (latestNickname) {
            ownerNickname = latestNickname;
          }
        } catch (error) {
          console.log('닉네임 조회 실패, Firestore 값 사용:', error);
        }

        // 워크스페이스 코드 가져오기
        let wsCode = null;
        try {
          const workspaceId = `workspace_${data.lastEditedBy}`;
          const workspaceRef = doc(db, 'workspaces', workspaceId);
          const workspaceSnap = await getDoc(workspaceRef);
          if (workspaceSnap.exists()) {
            wsCode = workspaceSnap.data().workspaceCode || null;
          }
        } catch (error) {
          console.log('워크스페이스 코드 조회 실패:', error);
        }

        // documentOwner 객체로 설정 (userId, nickname, wsCode)
        setDocumentOwner({
          userId: data.lastEditedBy,
          nickname: ownerNickname,
          wsCode: wsCode
        });

        // 통합 권한 업데이트: 문서 소유자만 편집 가능 (1:1 및 그룹 모두 동일)
        // 다른 사용자가 문서를 불러오면 내 편집 권한이 없어짐
        const isDocOwner = data.lastEditedBy === currentUserId;
        setActualCanEdit(isDocOwner);
        setActualIsManager(isDocOwner);
        console.log('📡 편집 권한 실시간 업데이트:', {
          documentOwner: data.lastEditedBy,
          currentUser: currentUserId,
          isDocOwner,
          permission: isDocOwner ? '편집 가능' : '읽기 전용 (마커만 가능)'
        });

        // contentRef 업데이트
        if (contentRef.current) {
          contentRef.current.innerHTML = data.content || '';
        }
        if (fullScreenContentRef.current) {
          fullScreenContentRef.current.innerHTML = data.content || '';
        }

        // markers 업데이트 (여기가 핵심!)
        if (data.markers) {
          console.log('📍 마커 실시간 동기화:', data.markers.length, '개');
          // markers는 이미 state로 관리되고 있으므로 여기서 업데이트하지 않음
          // 대신 handleLoadDocument에서 처리하도록 재호출
          // 또는 별도의 state를 추가하여 관리
        }
      }
    }, (error) => {
      if (error.code !== 'permission-denied') {
        console.error('문서 실시간 감시 오류:', error);
      }
    });

    return () => {
      console.log('🔇 실시간 리스너 종료 - chatRoomId:', chatRoomId);
      unsubscribe();
    };
  }, [chatRoomId, currentUserId, chatType]);

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

  // 🔧 content에서 첫 줄 추출하여 제목으로 설정 (16자 제한)
  const extractTitleFromContent = useCallback((htmlContent) => {
    if (!htmlContent || htmlContent.trim() === '') {
      return '제목 없음';
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // HTML을 순회하면서 첫 번째 줄바꿈 전까지의 텍스트만 추출
    let titleText = '';
    const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_ALL);
    let node;

    while ((node = walker.nextNode())) {
      // 줄바꿈 요소를 만나면 중단 (br, div, p 등)
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.nodeName.toLowerCase();
        if (tagName === 'br' || tagName === 'div' || tagName === 'p') {
          // 이미 텍스트가 있으면 중단, 없으면 계속 (첫 번째 요소일 수 있음)
          if (titleText.trim()) break;
        }
      }
      // 텍스트 노드면 추가
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        titleText += node.textContent;
        // \n을 만나면 그 전까지만 사용
        if (titleText.includes('\n')) {
          titleText = titleText.split('\n')[0];
          break;
        }
      }
    }

    const firstLine = titleText.trim();
    if (!firstLine) {
      return '제목 없음';
    }

    // 첫 줄을 제목으로 사용 (최대 16자)
    return firstLine.length > 16 ? firstLine.substring(0, 16) : firstLine;
  }, []);

  // 🔧 content 변경 시 자동으로 제목 업데이트
  useEffect(() => {
    if (content) {
      const newTitle = extractTitleFromContent(content);
      setTitle(newTitle);
    } else {
      setTitle(''); // 🆕 빈 문자열로 설정 (문서 비우기 후 재로드 가능하도록)
    }
  }, [content, extractTitleFromContent]);

  // 디바운스 저장 (500ms) - 로컬 캐시 + Firestore 저장
  const debouncedSave = useCallback((newContent, newTitle) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (!currentDocId) {
        console.warn('문서 ID가 없어 임시 저장할 수 없습니다');
        return;
      }

      const titleToSave = newTitle !== undefined ? newTitle : title;

      try {
        // 1. 로컬 캐시에 저장 (즉시)
        globalDocumentCache.set(currentDocId, {
          title: titleToSave,
          content: newContent
        });
        console.log('💾 로컬 캐시 저장 완료:', currentDocId);

        // 2. Firestore currentDoc에도 저장 (소유자 정보는 유지)
        const currentDocRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc');

        // 기존 문서 소유자 정보 유지
        const existingDoc = await getDoc(currentDocRef);
        const existingOwner = existingDoc.exists() ? existingDoc.data().lastEditedBy : currentUserId;
        const existingOwnerName = existingDoc.exists() ? existingDoc.data().lastEditedByName : currentUserName;

        await setDoc(currentDocRef, {
          title: titleToSave,
          content: newContent,
          originalMemoId: currentDocId,
          lastEditedBy: existingOwner,
          lastEditedByName: existingOwnerName,
          lastEditedAt: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.error('임시 저장 실패:', error);
      }
    }, 500);
  }, [chatRoomId, title, currentUserId, currentUserName, currentDocId]);

  // 제목 변경 핸들러 (더 이상 사용하지 않음 - 자동 생성)
  const handleTitleChange = useCallback((newTitle) => {
    // 제목은 자동 생성되므로 이 함수는 사용하지 않음
    // setTitle(newTitle);
    // debouncedSave(content, newTitle);
  }, []);

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

  // 닉네임 클릭 시 사용자 ID 표시
  const handleNicknameClick = useCallback(async (userId, nickname) => {
    // 쉐어노트 ID 가져오기
    const workspaceId = await getUserWorkspaceId(userId);

    if (workspaceId) {
      showToast?.(`${nickname} (ID: ${workspaceId})`);
    } else {
      showToast?.(`${nickname} (ID 조회 실패)`);
    }
  }, [showToast]);

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
            editedAt: serverTimestamp(),
            oldText: oldText,
            newText: newText,
            status: 'pending'
          });

          // 메모 문서에 pending 플래그 설정
          await updateMemoPendingFlag(currentDocId, true);

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

    // 첫 번째 줄을 제목으로 자동 설정 (16자 제한)
    const textContent = activeRef.current.textContent || '';
    const firstLine = textContent.split('\n')[0].trim();
    if (firstLine) {
      const autoTitle = firstLine.length > 16 ? firstLine.substring(0, 16) : firstLine;
      setTitle(autoTitle);
      debouncedSave(newContent, autoTitle);
    } else {
      debouncedSave(newContent);
    }
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
        editedAt: serverTimestamp(),
        type: selectionType,
        oldText: selectedText,
        newText: '', // 일단 빈 값
        status: 'pending'
      };

      const editDoc = await addDoc(editHistoryRef, editData);

      // 메모 문서에 pending 플래그 설정
      await updateMemoPendingFlag(currentDocId, true);

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
        const editRef = doc(db, 'chatRooms', chatRoomId, 'documents', currentDocId, 'editHistory', pendingMarker.id);

        // 타입별로 다른 필드 업데이트
        const updateData = {
          lastModifiedAt: serverTimestamp()
        };

        if (pendingMarker.type === 'strikethrough') {
          updateData.reason = editReasonText || '';
        } else if (pendingMarker.type === 'highlight') {
          updateData.newText = editInputText.trim() || pendingMarker.editData.oldText;
          updateData.description = editReasonText || '';
        }

        await setDoc(editRef, updateData, { merge: true });

        showToast?.('수정 내용이 업데이트되었습니다');

        // 모달 닫기
        setShowEditInputModal(false);
        setPendingMarker(null);
        setEditInputText('');
        setEditReasonText('');

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
        editedAt: serverTimestamp(),
        type: pendingMarker.type,
        status: 'pending'
      };

      if (pendingMarker.type === 'strikethrough') {
        // 취소선: 원본 텍스트 + 삭제 이유
        editData.oldText = pendingMarker.text;
        editData.reason = editReasonText || ''; // 삭제 이유
      } else if (pendingMarker.type === 'highlight') {
        // 형광펜: 원본 텍스트 + 대체 텍스트 + 설명
        // 대체 텍스트가 비어있으면 주석 기능으로 활용
        editData.oldText = pendingMarker.text;
        editData.newText = editInputText.trim() || pendingMarker.text; // 대체 텍스트 (비어있으면 원본 유지)
        editData.description = editReasonText || ''; // 설명
      }

      const editDoc = await addDoc(editHistoryRef, editData);

      // 메모 문서에 pending 플래그 설정
      await updateMemoPendingFlag(currentDocId, true);

      // 프로그래밍 방식 변경 플래그 설정
      programmaticChangeRef.current = true;

      // 취소선/형광펜: 절대 오프셋에서 Range 복원하여 마커 삽입
      if (pendingMarker.absoluteOffsets && pendingMarker.containerRef) {
        const container = pendingMarker.containerRef.current;
        const { startOffset, endOffset } = pendingMarker.absoluteOffsets;

        // 컨테이너가 유효한지 확인
        if (!container || !container.isConnected) {
          console.error('❌ 컨테이너가 유효하지 않습니다');
          showToast?.('마커 삽입에 실패했습니다');
          return;
        }

        // 절대 오프셋에서 Range 복원
        console.log('🔄 Range 복원 시도:', {
          startOffset,
          endOffset,
          containerTextLength: container.textContent.length,
          containerHTML: container.innerHTML.substring(0, 200)
        });
        const range = absoluteOffsetToRange(container, startOffset, endOffset);

        // Range 검증: startContainer와 endContainer가 유효한 노드인지 확인
        if (!range.startContainer || !range.endContainer) {
          console.error('❌ Range의 컨테이너가 유효하지 않습니다');
          showToast?.('마커 삽입에 실패했습니다');
          return;
        }

        // Range가 document나 body를 직접 참조하는 경우 에러
        if (range.startContainer === document || range.startContainer === document.body ||
            range.endContainer === document || range.endContainer === document.body) {
          console.error('❌ Range가 document/body를 참조하고 있습니다');
          showToast?.('마커를 삽입할 수 없습니다. 텍스트를 다시 선택해주세요');
          return;
        }

        // Range가 contentEditable 영역 내에 있는지 확인
        let node = range.startContainer;
        let isInContainer = false;
        while (node) {
          if (node === container) {
            isInContainer = true;
            break;
          }
          node = node.parentNode;
        }
        if (!isInContainer) {
          console.error('❌ Range가 contentEditable 영역 밖에 있습니다');
          showToast?.('마커를 삽입할 수 없습니다. 텍스트를 다시 선택해주세요');
          return;
        }

        // 디버깅: 마커 적용 시 range 정보 출력
        console.log('🎯 마커 적용 시도:', {
          type: pendingMarker.type,
          absoluteOffsets: pendingMarker.absoluteOffsets,
          startContainer: range.startContainer,
          startOffset: range.startOffset,
          endContainer: range.endContainer,
          endOffset: range.endOffset,
          text: pendingMarker.text,
          textLength: pendingMarker.text.length,
          rangeText: range.toString(),
          rangeTextLength: range.toString().length
        });

        const markerSpan = document.createElement('span');

        if (pendingMarker.type === 'strikethrough') {
          markerSpan.className = 'strikethrough';
          markerSpan.dataset.editId = editDoc.id;
          markerSpan.dataset.editType = 'strikethrough';
          markerSpan.dataset.canEdit = actualCanEdit ? 'true' : 'false';
          markerSpan.textContent = pendingMarker.text;
        } else if (pendingMarker.type === 'highlight') {
          markerSpan.className = 'highlight';
          markerSpan.dataset.editId = editDoc.id;
          markerSpan.dataset.editType = 'highlight';
          markerSpan.dataset.canEdit = actualCanEdit ? 'true' : 'false';
          // 승인 전까지는 원본 텍스트 표시
          markerSpan.textContent = pendingMarker.text;
        }

        try {
          range.surroundContents(markerSpan);

          // 마커 삽입 후 정리 작업
          const parent = markerSpan.parentNode;

          // 1. 마커 다음의 빈 텍스트 노드 제거
          let nextSibling = markerSpan.nextSibling;
          while (nextSibling) {
            const next = nextSibling.nextSibling;
            if (nextSibling.nodeType === Node.TEXT_NODE && nextSibling.textContent.trim() === '') {
              nextSibling.remove();
              nextSibling = next;
            } else if (nextSibling.nodeName === 'BR' && !next) {
              // 마지막 <br> 제거
              nextSibling.remove();
              break;
            } else {
              break;
            }
          }

          // 2. 부모 노드 정규화 (인접한 텍스트 노드 병합)
          if (parent) {
            parent.normalize();
          }

        } catch (error) {
          // surroundContents 실패 시 대체 방법 사용
          try {
            // 선택 영역의 HTML 구조 추출 (cloneContents 사용)
            const clonedContents = range.cloneContents();
            const tempDiv = document.createElement('div');
            tempDiv.appendChild(clonedContents);

            // 선택된 내용을 텍스트로만 추출
            const selectedText = range.toString();

            // ⭐ [중요] HTML 구조가 있는 경우 (태그가 포함된 경우)
            // 한글 텍스트가 <li>, <dt>, <dd>, <blockquote> 등의 블록 요소에 포함된 경우
            // range.deleteContents()를 사용하면 HTML 구조가 파괴되어 줄바꿈이 발생함
            // 따라서 extractContents()로 DOM 구조를 보존하면서 텍스트 노드만 마커로 감싸야 함
            // ⚠️ 이 로직을 수정하면 한글 마커 삽입 시 줄바꿈 문제가 재발할 수 있음!
            if (tempDiv.innerHTML.includes('<')) {
              // 🔍 디버깅: 마커 삽입 전 주변 HTML 구조 확인
              const beforeContainer = range.commonAncestorContainer;
              const beforeDiv = document.createElement('div');
              if (beforeContainer.nodeType === Node.ELEMENT_NODE) {
                beforeDiv.innerHTML = beforeContainer.innerHTML;
              } else if (beforeContainer.parentElement) {
                beforeDiv.innerHTML = beforeContainer.parentElement.innerHTML;
              }
              console.log('🔍 [삽입 전] 주변 HTML 구조:', beforeDiv.innerHTML);

              // ⭐ [중요] extractContents 대신 deleteContents 사용
              // extractContents는 DOM 구조를 제거해버려 삽입 위치가 잘못됨
              // deleteContents는 내용만 제거하고 위치는 유지
              const selectedText = range.toString();
              markerSpan.textContent = selectedText;

              range.deleteContents();
              range.insertNode(markerSpan);

              // 🔍 디버깅: 마커 삽입 후 주변 HTML 구조 확인
              const afterContainer = markerSpan.parentElement || markerSpan.parentNode;
              const afterDiv = document.createElement('div');
              if (afterContainer) {
                afterDiv.innerHTML = afterContainer.innerHTML;
              }
              console.log('🔍 [삽입 후] 주변 HTML 구조:', afterDiv.innerHTML);
            } else {
              // 순수 텍스트만 있는 경우 (기존 로직 유지)
              markerSpan.textContent = selectedText;
              range.deleteContents();
              range.insertNode(markerSpan);
            }

            // 삽입 후 부모가 <ul>이나 <ol>인지 확인 (잘못된 구조)
            const parentNode = markerSpan.parentNode;
            if (parentNode && (parentNode.nodeName === 'UL' || parentNode.nodeName === 'OL')) {
              // <ul> 바로 아래에 삽입된 경우: <li><p> 구조로 감싸기
              const liElement = document.createElement('li');
              const pElement = document.createElement('p');
              parentNode.insertBefore(liElement, markerSpan);
              liElement.appendChild(pElement);
              pElement.appendChild(markerSpan);

              // 마커 다음의 모든 형제 노드들을 같은 <p> 안으로 이동
              let nextSibling = markerSpan.nextSibling;
              while (nextSibling && nextSibling.nodeName !== 'LI') {
                const next = nextSibling.nextSibling;
                pElement.appendChild(nextSibling);
                nextSibling = next;
              }

              // 다음 <li>가 있고, 그 안에 <p>만 있다면 병합
              const nextLi = liElement.nextSibling;
              if (nextLi && nextLi.nodeName === 'LI') {
                const nextP = nextLi.querySelector('p');
                if (nextP) {
                  // 다음 <li>의 <p> 내용을 현재 <p>로 이동
                  while (nextP.firstChild) {
                    pElement.appendChild(nextP.firstChild);
                  }
                  // 빈 <li> 제거
                  nextLi.remove();
                }
              }
            } else if (parentNode && (parentNode.nodeName === 'LI' || parentNode.nodeName === 'DT' || parentNode.nodeName === 'DD' || parentNode.nodeName === 'BLOCKQUOTE')) {
              // ⭐ [중요] <li>, <dt>, <dd>, <blockquote> 바로 아래에 삽입된 경우: <p>로 감싸기
              // 이 블록 요소들은 자동으로 줄바꿈을 생성하므로, 마커가 직접 삽입되면 레이아웃이 깨짐
              // 반드시 <p> 태그로 감싸서 정상적인 문단 구조를 유지해야 함
              // ⚠️ 이 로직을 제거하면 한글 마커 삽입 시 줄바꿈 문제가 재발함!
              const pElement = document.createElement('p');
              parentNode.insertBefore(pElement, markerSpan);
              pElement.appendChild(markerSpan);

              // 마커 다음의 모든 형제 노드들을 같은 <p> 안으로 이동
              let nextSibling = markerSpan.nextSibling;
              while (nextSibling) {
                const next = nextSibling.nextSibling;
                pElement.appendChild(nextSibling);
                nextSibling = next;
              }
            }

            // 삽입 후 정리 작업
            const parent = markerSpan.parentNode;

            // 1. 마커 앞뒤의 빈 텍스트 노드 제거
            let prevSibling = markerSpan.previousSibling;
            if (prevSibling && prevSibling.nodeType === Node.TEXT_NODE && prevSibling.textContent === '') {
              prevSibling.remove();
            }

            let nextSibling = markerSpan.nextSibling;
            while (nextSibling) {
              const next = nextSibling.nextSibling;
              if (nextSibling.nodeType === Node.TEXT_NODE) {
                if (nextSibling.textContent === '') {
                  // 완전히 빈 텍스트 노드 제거
                  nextSibling.remove();
                  nextSibling = next;
                  continue;
                } else if (nextSibling.textContent.trim() === '' && !next) {
                  // 공백만 있는 마지막 텍스트 노드 제거
                  nextSibling.remove();
                  break;
                }
              } else if (nextSibling.nodeName === 'BR' && !next) {
                // 마지막 BR 제거
                nextSibling.remove();
                break;
              }
              break;
            }

            // 2. 부모 노드 정규화 (인접한 텍스트 노드 병합)
            if (parent) {
              parent.normalize();
            }

            // 3. contentEditable 전체 정규화
            if (activeRef.current) {
              activeRef.current.normalize();
            }

            console.log(`✅ ${pendingMarker.type} 마커 삽입 완료 (대체 방법)`);
            console.log('📄 삽입 직후 HTML:', activeRef.current.innerHTML.substring(0, 500));
          } catch (fallbackError) {
            console.error('❌ 마커 삽입 완전 실패:', fallbackError);
            // Firestore에서 방금 추가한 편집 이력 삭제
            try {
              await deleteDoc(doc(db, 'chatRooms', chatRoomId, 'documents', currentDocId, 'editHistory', editDoc.id));
              await updateMemoPendingFlag(currentDocId, false);
              console.log('🗑️ 실패한 편집 이력 삭제 완료');
            } catch (deleteError) {
              console.error('편집 이력 삭제 실패:', deleteError);
            }
            showToast?.('마커 삽입에 실패했습니다');
            return;
          }
        }
      }

      // 콘텐츠 state 업데이트 - 정리 작업 직후 즉시 HTML 캡처
      const finalHTML = activeRef.current.innerHTML;
      console.log('📄 캡처된 HTML:', finalHTML.substring(0, 500));
      console.log('📄 이전 content:', content.substring(0, 500));
      console.log('📄 HTML 동일 여부:', finalHTML === content);
      setContent(finalHTML);
      debouncedSave(finalHTML);

      // 모달 닫기
      setShowEditInputModal(false);
      setPendingMarker(null);
      setEditInputText('');
      setEditReasonText('');
      savedRangeRef.current = null;

      showToast?.('편집 표시를 추가했습니다');
    } catch (error) {
      console.error('편집 저장 실패:', error);
      showToast?.('편집 저장에 실패했습니다');
    }
  }, [pendingMarker, editInputText, editReasonText, chatRoomId, currentUserId, currentUserName, showFullScreenEdit, debouncedSave, showToast, currentDocId, getEditHistoryRef, actualCanEdit]);

  // 전체화면 편집창 닫기 핸들러
  const handleCloseFullScreenEdit = useCallback(async () => {
    // 편집창 닫기 전에 content 동기화
    if (fullScreenContentRef.current) {
      const currentContent = fullScreenContentRef.current.innerHTML;
      setContent(currentContent);
      // 미리보기 영역에도 반영
      if (contentRef.current) {
        contentRef.current.innerHTML = currentContent;
      }
    }
    setShowFullScreenEdit(false);
  }, []);

  // 새 문서 작성 시작 핸들러 - NewMemoModal 열기
  const handleCreateNewDocument = useCallback(() => {
    setShowNewMemoModal(true);
  }, []);

  // CollaborationMemoModal에서 저장 시 공유 폴더에 저장하고 협업 문서로 로드
  const handleSaveNewMemo = useCallback(async (memoContent) => {
    try {
      console.log('💾 새 협업 문서 저장 시작');
      console.log('📄 memoContent:', memoContent);

      // 새 메모 ID와 타임스탬프 생성
      const now = Date.now();
      const newMemoId = `m${now}`;

      // 로컬 메모 객체 생성 (App.jsx 형식에 맞춤)
      const newMemo = {
        id: newMemoId,
        content: memoContent,
        date: now,
        createdAt: now,
        displayDate: new Date(now).toLocaleString(),
        folderId: 'shared', // 공유 폴더
        currentWorkingRoomId: null, // 초기값 명시
        hasPendingEdits: false // 초기값 명시
      };

      // syncMemo로 즉시 로컬 상태 업데이트 + Firestore 저장
      if (syncMemo) {
        syncMemo(newMemo);
      }

      console.log('✅ 공유 폴더에 저장 완료:', newMemoId);
      showToast?.('공유 폴더에 문서가 저장되었습니다');

      // 저장된 문서를 현재 문서로 불러오기
      const savedMemo = {
        id: newMemoId,
        content: memoContent,
        userId: currentUserId
      };

      // performLoadDocument 호출하여 문서 불러오기
      await performLoadDocument(savedMemo);

    } catch (error) {
      console.error('❌ 문서 저장 실패:', error);
      showToast?.('문서 저장에 실패했습니다');
    }
  }, [currentUserId, showToast, performLoadDocument, syncMemo]);

  // 임시 문서 저장 핸들러
  const handleSaveTempDocument = useCallback(async () => {
    if (!currentUserId || !content || !content.trim()) {
      showToast?.('저장할 내용이 없습니다');
      return;
    }

    if (!currentDocId || !currentDocId.startsWith('temp_')) {
      showToast?.('임시 문서가 아닙니다');
      return;
    }

    try {
      // 1. 새 메모 ID 생성
      const newMemoId = `m${Date.now()}`;

      // 2. 공유 폴더에 메모 저장
      const memoRef = doc(db, 'mindflowUsers', currentUserId, 'memos', newMemoId);

      // 3. 문서 제목 생성 (첫 줄바꿈 전까지의 텍스트 추출)
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;

      // HTML을 순회하면서 첫 번째 줄바꿈 전까지의 텍스트만 추출
      let titleText = '';
      const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_ALL);
      let node;

      while ((node = walker.nextNode())) {
        // 줄바꿈 요소를 만나면 중단 (br, div, p 등)
        if (node.nodeType === Node.ELEMENT_NODE) {
          const tagName = node.nodeName.toLowerCase();
          if (tagName === 'br' || tagName === 'div' || tagName === 'p') {
            // 이미 텍스트가 있으면 중단, 없으면 계속 (첫 번째 요소일 수 있음)
            if (titleText.trim()) break;
          }
        }
        // 텍스트 노드면 추가
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          titleText += node.textContent;
          // \n을 만나면 그 전까지만 사용
          if (titleText.includes('\n')) {
            titleText = titleText.split('\n')[0];
            break;
          }
        }
      }

      const documentTitle = (titleText.trim() || '제목 없음').substring(0, 50); // 최대 50자

      // 4. 메모 데이터 저장
      await setDoc(memoRef, {
        id: newMemoId,
        title: documentTitle,
        content: content,
        category: '공유',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isShared: true,
        sharedWith: [], // 초기에는 비어있음
        color: '#4a90e2'
      });

      // 5. 현재 문서 ID를 임시에서 영구로 변경
      setCurrentDocId(newMemoId);
      setTitle(documentTitle);

      // 6. 문서 소유자 정보 설정 (임시 문서는 작성자가 원본 소유자)
      try {
        const ownerNickname = await getUserNickname(currentUserId);
        const workspaceId = `workspace_${currentUserId}`;
        const workspaceRef = doc(db, 'workspaces', workspaceId);
        const workspaceSnap = await getDoc(workspaceRef);
        const wsCode = workspaceSnap.exists() ? workspaceSnap.data().workspaceCode : null;

        const ownerInfo = {
          userId: currentUserId,
          nickname: ownerNickname || currentUserName || '알 수 없음',
          wsCode: wsCode
        };

        setDocumentOwner(ownerInfo);
        setOriginalOwner(ownerInfo); // 임시 문서는 작성자가 원본 소유자
      } catch (error) {
        console.error('문서 소유자 정보 조회 실패:', error);
      }

      // 7. Firestore chatRoom의 임시 플래그 제거 및 정식 문서 정보 업데이트
      if (chatRoomId) {
        try {
          const docRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc');

          const ownerNickname = await getUserNickname(currentUserId);
          const workspaceId = `workspace_${currentUserId}`;
          const workspaceRef = doc(db, 'workspaces', workspaceId);
          const workspaceSnap = await getDoc(workspaceRef);
          const wsCode = workspaceSnap.exists() ? workspaceSnap.data().workspaceCode : null;

          await setDoc(docRef, {
            isTemporary: false,
            memoId: newMemoId,
            originalMemoId: newMemoId,
            content: content,
            title: documentTitle,
            lastEditedBy: currentUserId,
            lastEditedAt: serverTimestamp(),
            // 원본 소유자 정보 (변경 불가)
            originalOwnerId: currentUserId,
            originalOwnerNickname: ownerNickname || currentUserName || '알 수 없음',
            originalOwnerCode: wsCode
          });
        } catch (error) {
          console.error('대화방 문서 업데이트 실패:', error);
        }
      }

      showToast?.('문서가 공유 폴더에 저장되었습니다');
    } catch (error) {
      console.error('임시 문서 저장 실패:', error);
      showToast?.('문서 저장에 실패했습니다');
    }
  }, [currentUserId, content, currentDocId, showToast, currentUserName, chatRoomId]);

  // 편집 마커 클릭 핸들러 - 수정 모달 열기
  const handleEditMarkerClick = useCallback(async (clickedEditId, markerElement) => {
    // 모바일에서 자판이 뜨는 것을 방지
    if (contentRef.current) {
      contentRef.current.blur();
    }
    if (fullScreenContentRef.current) {
      fullScreenContentRef.current.blur();
    }

    if (!currentDocId) {
      showToast?.('문서 ID가 없습니다');
      return;
    }

    try {
      // 올바른 경로로 편집 이력 가져오기
      const editRef = doc(db, 'chatRooms', chatRoomId, 'documents', currentDocId, 'editHistory', clickedEditId);
      const editSnap = await getDoc(editRef);

      if (!editSnap.exists()) {
        showToast?.('편집 내역을 찾을 수 없습니다');
        return;
      }

      const editData = editSnap.data();

      // 편집창에서 편집 권한이 있으면 수정 가능한 입력 모달 표시
      if (showFullScreenEdit && actualCanEdit) {
        // 마커 텍스트 가져오기
        const markerText = markerElement?.textContent || editData.oldText || '';

        // wsCode 가져오기 (participants에서 조회 또는 Firestore에서 직접 조회)
        let wsCode = null;
        const participant = participants.find(p => p.userId === editData.editedBy);
        wsCode = participant?.wsCode;

        // participants에 없으면 Firestore에서 직접 조회
        if (!wsCode && editData.editedBy) {
          try {
            const userDoc = await getDoc(doc(db, 'users', editData.editedBy));
            if (userDoc.exists()) {
              wsCode = userDoc.data().workspaceCode;
            }
          } catch (error) {
            console.error('wsCode 조회 실패:', error);
          }
        }

        // 댓글 개수 조회
        const commentsRef = collection(db, 'chatRooms', chatRoomId, 'documents', currentDocId, 'editHistory', clickedEditId, 'comments');
        const commentsSnapshot = await getDocs(commentsRef);
        const commentCount = commentsSnapshot.size;

        // 수정 가능한 입력 모달 표시
        setPendingMarker({
          id: clickedEditId,
          type: editData.type,
          text: markerText,
          commentCount: commentCount,
          editData: {
            ...editData,
            wsCode: wsCode
          }
        });

        // 기존 데이터 불러오기
        if (editData.type === 'strikethrough') {
          setEditReasonText(editData.reason || '');
        } else if (editData.type === 'highlight') {
          setEditInputText(editData.newText || '');
          setEditReasonText(editData.description || '');
        } else if (editData.type === 'comment') {
          setEditInputText(editData.text || '');
        }

        setShowEditInputModal(true);
      } else {
        // 댓글 개수 조회
        const commentsRef = collection(db, 'chatRooms', chatRoomId, 'documents', currentDocId, 'editHistory', clickedEditId, 'comments');
        const commentsSnapshot = await getDocs(commentsRef);
        const commentCount = commentsSnapshot.size;

        // 미리보기 또는 권한 없으면 조회 전용 모달 표시
        setSelectedEdits([{ id: clickedEditId, ...editData, commentCount: commentCount }]);
        setShowEditModal(true);
      }

      // 포커스 제거하여 키보드 숨김
      document.activeElement?.blur();

    } catch (error) {
      console.error('편집 이력 로드 실패:', error);
      showToast?.('편집 이력을 불러올 수 없습니다');
    }
  }, [chatRoomId, currentDocId, showToast, showFullScreenEdit, actualCanEdit]);

  // 취소선 적용 핸들러 - 즉시 입력창 표시
  const handleApplyStrikethrough = useCallback(() => {
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

    // 선택 범위를 절대 오프셋으로 저장 (DOM 변경에 안전)
    const absoluteOffsets = rangeToAbsoluteOffset(range, activeRef.current);

    // 겹치는 마커 체크
    const container = activeRef.current;
    const markers = container.querySelectorAll('.strikethrough, .highlight');
    for (const marker of markers) {
      const markerRange = document.createRange();
      markerRange.selectNodeContents(marker);

      // range와 markerRange가 겹치는지 확인
      const comparison = range.compareBoundaryPoints(Range.END_TO_START, markerRange);
      const comparison2 = range.compareBoundaryPoints(Range.START_TO_END, markerRange);

      if (comparison < 0 && comparison2 > 0) {
        // 겹침 발생
        showToast?.('이미 마커가 있는 영역입니다\n기존 마커에 의견을 남겨주세요');
        return;
      }
    }

    // 디버깅: range 정보 출력
    console.log('🔍 취소선 range 저장:', {
      startContainer: range.startContainer,
      startOffset: range.startOffset,
      endContainer: range.endContainer,
      endOffset: range.endOffset,
      text: selectedText,
      length: selectedText.length,
      absoluteOffsets: absoluteOffsets,
      startParentTag: range.startContainer.parentNode?.tagName,
      endParentTag: range.endContainer.parentNode?.tagName,
      startText: range.startContainer.textContent?.substring(0, 50),
      endText: range.endContainer.textContent?.substring(0, 50)
    });

    // 입력 모달 표시 (취소선 - 삭제 이유 입력)
    setPendingMarker({
      type: 'strikethrough',
      text: selectedText,
      absoluteOffsets: absoluteOffsets,
      containerRef: activeRef
    });
    setEditInputText('');
    setShowEditInputModal(true);
  }, [showFullScreenEdit, showToast]);

  // 형광펜 적용 핸들러 - 즉시 입력창 표시
  const handleApplyHighlighter = useCallback(() => {
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

    // 선택 범위를 절대 오프셋으로 저장 (DOM 변경에 안전)
    const absoluteOffsets = rangeToAbsoluteOffset(range, activeRef.current);

    // 겹치는 마커 체크
    const container = activeRef.current;
    const markers = container.querySelectorAll('.strikethrough, .highlight');
    for (const marker of markers) {
      const markerRange = document.createRange();
      markerRange.selectNodeContents(marker);

      // range와 markerRange가 겹치는지 확인
      const comparison = range.compareBoundaryPoints(Range.END_TO_START, markerRange);
      const comparison2 = range.compareBoundaryPoints(Range.START_TO_END, markerRange);

      if (comparison < 0 && comparison2 > 0) {
        // 겹침 발생
        showToast?.('이미 마커가 있는 영역입니다\n기존 마커에 의견을 남겨주세요');
        return;
      }
    }

    // 디버깅: range 정보 출력
    console.log('🔍 형광펜 range 저장:', {
      startContainer: range.startContainer,
      startOffset: range.startOffset,
      endContainer: range.endContainer,
      endOffset: range.endOffset,
      text: selectedText,
      length: selectedText.length,
      absoluteOffsets: absoluteOffsets
    });

    // 입력 모달 표시 (형광펜 - 대체 텍스트 + 설명 입력)
    setPendingMarker({
      type: 'highlight',
      text: selectedText,
      absoluteOffsets: absoluteOffsets,
      containerRef: activeRef
    });
    setEditInputText('');
    setShowEditInputModal(true);
  }, [showFullScreenEdit, showToast]);

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

  // 다운로드 허용 토글 핸들러 (문서 소유자만)
  const handleToggleDownload = useCallback(() => {
    if (!currentDocId || !chatRoomId) {
      showToast?.('문서가 없습니다');
      return;
    }

    if (documentOwner?.userId !== currentUserId) {
      showToast?.('문서 소유자만 다운로드를 허용할 수 있습니다');
      return;
    }

    // 비활성화는 바로 처리, 활성화는 확인 모달 표시
    if (downloadEnabled) {
      confirmToggleDownload();
    } else {
      setShowDownloadConfirmModal(true);
    }
  }, [currentDocId, chatRoomId, documentOwner, currentUserId, downloadEnabled, showToast]);

  // 다운로드 허용 토글 확정 실행
  const confirmToggleDownload = useCallback(async () => {
    try {
      const docRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc');
      const newDownloadEnabled = !downloadEnabled;

      await updateDoc(docRef, {
        downloadEnabled: newDownloadEnabled
      });

      setDownloadEnabled(newDownloadEnabled);
      showToast?.(newDownloadEnabled ? '다운로드가 허용되었습니다' : '다운로드가 비활성화되었습니다');
    } catch (error) {
      console.error('다운로드 허용 토글 실패:', error);
      showToast?.('다운로드 설정에 실패했습니다');
    }
  }, [chatRoomId, downloadEnabled, showToast]);

  // 다운로드 핸들러 - 협업 참여자용 (공유 폴더에 다운로드, 이미지/비디오 URL 유지)
  const handleDownloadDocument = useCallback(async () => {
    if (!canDownload || !currentDocId) {
      showToast?.('다운로드할 수 없습니다');
      return;
    }

    // 용량 체크 (200KB 제한)
    const contentSize = new Blob([content]).size;
    const maxSize = 200 * 1024; // 200KB

    if (contentSize > maxSize) {
      showToast?.(`문서 용량이 너무 큽니다 (최대 200KB, 현재 ${Math.round(contentSize / 1024)}KB)`);
      return;
    }

    setSaving(true);

    try {
      // 새 메모 ID 생성
      const newMemoId = `m${Date.now()}`;

      // 공유 폴더에 저장 (HTML 그대로, 이미지/비디오 URL 유지)
      const memoRef = doc(db, 'mindflowUsers', currentUserId, 'memos', newMemoId);

      await setDoc(memoRef, {
        id: newMemoId,
        title: `${title} (다운로드)`,
        content: content, // HTML 그대로 저장 (이미지/비디오 URL 포함)
        folderId: 'shared',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isShared: true,
        color: '#4a90e2'
      });

      // 로컬 상태도 업데이트
      if (syncMemo) {
        syncMemo(newMemoId, {
          id: newMemoId,
          title: `${title} (다운로드)`,
          content: content,
          folderId: 'shared',
          date: Date.now(),
          createdAt: Date.now(),
          displayDate: new Date().toLocaleString()
        });
      }

      showToast?.('문서가 공유 폴더에 다운로드되었습니다');
    } catch (error) {
      console.error('문서 다운로드 실패:', error);
      showToast?.('문서 다운로드에 실패했습니다');
    } finally {
      setSaving(false);
    }
  }, [canDownload, currentDocId, title, content, currentUserId, showToast, syncMemo]);

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
    if (!actualIsManager && !actualIsSubManager) {
      showToast?.('방장 또는 부방장만 임시저장할 수 있습니다');
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
        content: content, // HTML 그대로 저장 (마커 포함)
        contentType: 'html', // HTML 타입 표시
        folder: 'shared',
        userId: currentUserId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        tags: ['임시저장', '대화방편집중'],
        temporarySave: true,
        chatRoomId: chatRoomId,
        // 편집 이력 정보 저장
        hasPendingEdits: pendingEdits.length > 0,
        pendingEditsCount: pendingEdits.length
      };

      const memoDoc = await addDoc(memosRef, newMemo);

      // 편집 이력도 함께 복사 (currentDocId가 있고 편집 이력이 있는 경우)
      if (currentDocId && pendingEdits.length > 0) {
        // 원본 편집 이력 경로
        const sourceEditHistoryRef = collection(
          db,
          'chatRooms',
          chatRoomId,
          'documents',
          currentDocId,
          'editHistory'
        );

        // 대상 편집 이력 경로 (새로 저장된 메모)
        const targetEditHistoryRef = collection(
          db,
          'chatRooms',
          chatRoomId,
          'documents',
          memoDoc.id,
          'editHistory'
        );

        // 모든 pending 편집 이력 복사
        const editsSnap = await getDocs(query(sourceEditHistoryRef, where('status', '==', 'pending')));
        const copyPromises = [];
        editsSnap.forEach((editDoc) => {
          copyPromises.push(addDoc(targetEditHistoryRef, editDoc.data()));
        });
        await Promise.all(copyPromises);
      }

      showToast?.(`"${tempTitle}"이(가) 임시저장되었습니다 (${pendingEdits.length}개 수정 대기)`);
    } catch (error) {
      console.error('임시저장 실패:', error);
      showToast?.('임시저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  }, [actualIsManager, actualIsSubManager, title, content, currentUserId, chatRoomId, currentDocId, pendingEdits, showToast]);

  // 중간 적용 핸들러 - 현재 상태 그대로 저장 (모든 마커 유지)
  const handlePartialApply = useCallback(async () => {
    if (!actualIsManager && !actualIsSubManager) {
      showToast?.('방장 또는 부방장만 중간 적용할 수 있습니다');
      return;
    }

    setSaving(true);

    try {
      // 현재 HTML 상태 그대로 Firestore에 저장
      const docRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc');
      // 기존 문서 소유자 정보 유지
      const existingDoc = await getDoc(docRef);
      const existingOwner = existingDoc.exists() ? existingDoc.data().lastEditedBy : currentUserId;
      const existingOwnerName = existingDoc.exists() ? existingDoc.data().lastEditedByName : currentUserName;

      await setDoc(docRef, {
        title,
        content: content, // 모든 마커가 포함된 HTML
        lastEditedBy: existingOwner,
        lastEditedByName: existingOwnerName,
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
  }, [actualIsManager, actualIsSubManager, title, content, currentUserId, currentUserName, chatRoomId, showToast]);

  // 개별 편집 승인 핸들러 (매니저만)
  const handleApproveEdit = useCallback(async (editId) => {
    if (!actualIsManager) {
      showToast?.('매니저만 승인할 수 있습니다');
      return;
    }

    if (!currentDocId) {
      console.error('문서 ID가 없습니다. currentDocId:', currentDocId);
      showToast?.('문서 ID가 없습니다');
      return;
    }

    try {
      // 1. 편집 이력 가져오기
      const editHistoryRef = getEditHistoryRef(currentDocId);
      if (!editHistoryRef) {
        showToast?.('편집 이력을 찾을 수 없습니다');
        return;
      }
      const editRef = doc(editHistoryRef, editId);
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
        // 기존 문서 소유자 정보 유지
        const existingDoc = await getDoc(docRef);
        const existingOwner = existingDoc.exists() ? existingDoc.data().lastEditedBy : currentUserId;
        const existingOwnerName = existingDoc.exists() ? existingDoc.data().lastEditedByName : currentUserName;

        await setDoc(docRef, {
          title,
          content: newContent,
          lastEditedBy: existingOwner,
          lastEditedByName: existingOwnerName,
          lastEditedAt: serverTimestamp(),
          version: (await getDoc(docRef)).data()?.version || 0 + 1
        }, { merge: true });

        // 5. 편집 이력 삭제
        await deleteDoc(editRef);

        // 6. 캐시 업데이트
        if (currentDocId) {
          globalDocumentCache.set(currentDocId, {
            title: title,
            content: newContent
          });
          console.log('💾 개별 승인 후 캐시 업데이트:', currentDocId);
        }

        // 7. 원본 메모 업데이트
        const isLastEdit = pendingEdits.length === 1;
        if (currentDocId) {
          try {
            const memoRef = doc(db, 'mindflowUsers', currentUserId, 'memos', currentDocId);

            // ⚠️ [중요] 원본 메모에 저장할 때는 모든 마커를 제거해야 함
            // newContent는 현재 마커만 제거된 상태이므로, 다른 pending 마커들이 남아있음
            // 따라서 모든 마커를 제거한 cleanContent를 사용
            const cleanDiv = document.createElement('div');
            cleanDiv.innerHTML = newContent;
            const remainingMarkers = cleanDiv.querySelectorAll('[data-edit-id]');
            remainingMarkers.forEach(marker => {
              const textNode = document.createTextNode(marker.textContent);
              marker.parentNode.replaceChild(textNode, marker);
            });
            const cleanContentForMemo = cleanDiv.innerHTML;

            await setDoc(memoRef, {
              title: title,
              content: cleanContentForMemo, // 모든 마커 제거된 content 사용
              hasPendingEdits: !isLastEdit,
              currentWorkingRoomId: isLastEdit ? null : chatRoomId
            }, { merge: true });
            console.log('✅ 개별 승인 - 원본 메모 업데이트:', currentDocId, '(모든 마커 제거됨)');
          } catch (error) {
            console.error('원본 메모 업데이트 실패:', error);
          }
        }

        // 8. UI 업데이트
        setPendingEdits(prev => {
          const updated = prev.filter(e => e.id !== editId);
          // 더 이상 pending 편집이 없으면 플래그 제거
          if (updated.length === 0) {
            updateMemoPendingFlag(currentDocId, false);
          }
          return updated;
        });
        setSelectedEdits(prev => prev.filter(e => e.id !== editId));

        // 모든 편집이 승인되었으면 모달 닫기
        if (selectedEdits.length <= 1) {
          setShowEditModal(false);
        }

        // 성공 알림 - 한 번만
        showToast?.('편집이 승인되었습니다');
      } else {
        // 마커를 찾지 못한 경우
        console.warn('마커를 찾을 수 없습니다:', editId);
        showToast?.('해당 편집을 찾을 수 없습니다');
      }
    } catch (error) {
      console.error('편집 승인 실패:', error);
      showToast?.('편집 승인에 실패했습니다');
    }
  }, [actualIsManager, content, chatRoomId, currentDocId, title, currentUserId, currentUserName, selectedEdits, showToast, getEditHistoryRef, pendingEdits]);

  // 전체 승인 버튼 클릭 - 확인 모달 표시
  const handleFinalApply = useCallback(() => {
    if (!actualIsManager) {
      showToast?.('매니저만 전체 승인할 수 있습니다');
      return;
    }
    setShowApproveAllModal(true);
  }, [actualIsManager, showToast]);

  // 전체 승인 실행 - 모든 마커 처리 (편집 이력 기반)
  const performApproveAll = useCallback(async () => {
    setSaving(true);
    setShowApproveAllModal(false);

    try {
      // 1. 모든 pending 편집 이력 가져오기 (문서별로)
      const editsRef = getEditHistoryRef(currentDocId);
      if (!editsRef) {
        showToast?.('문서 ID가 없어 전체 승인할 수 없습니다');
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

      // Firestore에 전체 승인된 내용 저장
      const docRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc');
      // 기존 문서 소유자 정보 유지
      const existingDoc = await getDoc(docRef);
      const existingOwner = existingDoc.exists() ? existingDoc.data().lastEditedBy : currentUserId;
      const existingOwnerName = existingDoc.exists() ? existingDoc.data().lastEditedByName : currentUserName;

      await setDoc(docRef, {
        title,
        content: finalContent,
        lastEditedBy: existingOwner,
        lastEditedByName: existingOwnerName,
        lastEditedAt: serverTimestamp(),
        finalApplied: true, // 전체 승인 표시
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

      // 캐시에서 해당 문서 제거 (승인된 내용은 원본 메모에 반영되므로)
      if (currentDocId && globalDocumentCache.has(currentDocId)) {
        globalDocumentCache.delete(currentDocId);
        console.log('🗑️ 전체 승인 완료 - 캐시에서 문서 제거:', currentDocId);
      }

      // ⭐ 원본 메모의 hasPendingEdits 플래그를 false로 업데이트 (얼음 결정 배지 제거)
      if (currentDocId && onUpdateMemoPendingFlag) {
        onUpdateMemoPendingFlag(currentDocId, false);
        console.log('✅ 원본 메모의 hasPendingEdits 플래그 업데이트:', currentDocId, false);
      }

      // ⭐ 원본 메모 업데이트 (content, title, 플래그 모두 업데이트)
      if (currentDocId) {
        try {
          const memoRef = doc(db, 'mindflowUsers', currentUserId, 'memos', currentDocId);
          await setDoc(memoRef, {
            title: title,
            content: finalContent,
            currentWorkingRoomId: null,
            hasPendingEdits: false
          }, { merge: true });
          console.log('✅ 전체 승인 - 원본 메모 업데이트:', currentDocId);
        } catch (error) {
          console.error('원본 메모 업데이트 실패:', error);
        }
      }

      showToast?.('모든 수정 제안이 승인되었습니다');
    } catch (error) {
      console.error('전체 승인 실패:', error);
      showToast?.('전체 승인에 실패했습니다');
    } finally {
      setSaving(false);
    }
  }, [title, content, currentUserId, currentUserName, chatRoomId, showToast, currentDocId, getEditHistoryRef, onUpdateMemoPendingFlag]);

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
      console.log('🔍 [전체 리셋] 원본 content:', content.substring(0, 200));

      // 모든 편집 마커 제거
      const markers = tempDiv.querySelectorAll('[data-edit-id]');
      console.log('🔍 [전체 리셋] 찾은 마커 개수:', markers.length);
      markers.forEach(marker => {
        console.log('🗑️ [전체 리셋] 마커 제거:', marker.dataset.editId, marker.textContent);
        const textNode = document.createTextNode(marker.textContent);
        marker.parentNode.replaceChild(textNode, marker);
      });

      const cleanContent = tempDiv.innerHTML;
      console.log('🔍 [전체 리셋] 정리된 content:', cleanContent.substring(0, 200));

      // 2. Firestore의 편집 이력 모두 삭제 (현재 대화방의 현재 문서만)
      // ⚠️ status 조건 없이 모든 editHistory 삭제 (승인된 것도 포함)
      const editHistoryRef = collection(db, 'chatRooms', chatRoomId, 'documents', currentDocId, 'editHistory');
      const allEditsSnap = await getDocs(editHistoryRef);

      console.log('🔍 [전체 리셋] 삭제 대상 editHistory 개수:', allEditsSnap.size);

      const deletePromises = [];
      allEditsSnap.forEach((editDoc) => {
        console.log('🗑️ editHistory 삭제 예정:', editDoc.id, editDoc.data());
        deletePromises.push(deleteDoc(editDoc.ref));
      });

      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
        console.log(`✅ 총 ${deletePromises.length}개의 editHistory 삭제 완료`);
      } else {
        console.log('⚠️ 삭제할 editHistory가 없습니다');
      }

      // 3. Firestore 문서 업데이트 (마커 제거된 내용으로)
      const docRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc');
      // 현재 사용자의 닉네임 조회
      const userNickname = await getUserNickname(currentUserId);

      await setDoc(docRef, {
        title,
        content: cleanContent,
        lastEditedBy: currentUserId,
        lastEditedByName: userNickname || currentUserName,
        lastEditedAt: serverTimestamp(),
        version: (await getDoc(docRef)).data()?.version || 0 + 1
      }, { merge: true });

      // 4. 캐시 업데이트
      if (currentDocId) {
        globalDocumentCache.set(currentDocId, {
          title: title,
          content: cleanContent
        });
        console.log('💾 전체 리셋 후 캐시 업데이트:', currentDocId);
      }

      // 5. UI 업데이트
      setContent(cleanContent);
      if (contentRef.current) {
        contentRef.current.innerHTML = cleanContent;
      }
      if (fullScreenContentRef.current) {
        fullScreenContentRef.current.innerHTML = cleanContent;
      }
      setPendingEdits([]);

      // ⭐ 원본 메모의 hasPendingEdits 플래그를 false로 업데이트 (얼음 결정 배지 제거)
      if (currentDocId && onUpdateMemoPendingFlag) {
        onUpdateMemoPendingFlag(currentDocId, false);
        console.log('✅ 원본 메모의 hasPendingEdits 플래그 업데이트:', currentDocId, false);
      }

      // ⭐ 원본 메모 업데이트
      // ⚠️ [중요] 전체 리셋 시 원본 메모의 content도 cleanContent로 업데이트해야 함
      // 그렇지 않으면 문서를 비우고 다시 불러올 때 마커가 포함된 원본이 로드됨
      // ⚠️ [중요] 현재 방의 마커는 삭제되지만, 다른 방에 마커가 남아있을 수 있음
      if (currentDocId) {
        try {
          // 다른 방에 pending 마커가 있는지 확인
          const chatRoomsRef = collection(db, 'chatRooms');
          const chatRoomsSnapshot = await getDocs(chatRoomsRef);

          let hasMarkerInOtherRoom = false;
          let otherRoomId = null;

          for (const roomDoc of chatRoomsSnapshot.docs) {
            const roomId = roomDoc.id;
            if (roomId === chatRoomId) continue; // 현재 방은 스킵 (방금 삭제했으므로)

            const editsRef = collection(db, 'chatRooms', roomId, 'documents', currentDocId, 'editHistory');
            const pendingQuery = query(editsRef, where('status', '==', 'pending'));
            const pendingSnapshot = await getDocs(pendingQuery);

            if (pendingSnapshot.size > 0) {
              hasMarkerInOtherRoom = true;
              otherRoomId = roomId;
              console.log(`📌 전체 리셋 후 다른 방에 마커 발견: ${roomId} (${pendingSnapshot.size}개)`);
              break;
            }
          }

          const memoRef = doc(db, 'mindflowUsers', currentUserId, 'memos', currentDocId);
          await setDoc(memoRef, {
            title: title,
            content: cleanContent, // 모든 마커 제거된 content로 업데이트
            currentWorkingRoomId: hasMarkerInOtherRoom ? otherRoomId : null,
            hasPendingEdits: hasMarkerInOtherRoom
          }, { merge: true });

          if (hasMarkerInOtherRoom) {
            console.log('✅ 전체 리셋 완료 - 다른 방에 마커 존재, currentWorkingRoomId 유지:', otherRoomId);
          } else {
            console.log('✅ 전체 리셋 완료 - 모든 마커 제거, 일반 문서로 복원:', currentDocId);
          }
        } catch (error) {
          console.error('원본 메모 전체 리셋 실패:', error);
        }
      }

      showToast?.('모든 수정 표시가 삭제되었습니다');
    } catch (error) {
      console.error('전체 리셋 실패:', error);
      showToast?.('리셋에 실패했습니다');
    } finally {
      setSaving(false);
      setShowResetConfirmModal(false);
    }
  }, [currentDocId, content, title, currentUserId, currentUserName, chatRoomId, showToast, getEditHistoryRef, onUpdateMemoPendingFlag]);

  // 개별 수정 취소 핸들러
  const handleCancelEdit = useCallback(async (editId) => {
    if (!actualCanEdit) {
      showToast?.('편집 권한이 없습니다');
      return;
    }

    if (!currentDocId) {
      showToast?.('문서 ID가 없습니다');
      return;
    }

    try {
      // 1. HTML에서 해당 마커 제거
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;

      const marker = tempDiv.querySelector(`[data-edit-id="${editId}"]`);
      if (marker) {
        // 마커를 텍스트로 교체
        const textNode = document.createTextNode(marker.textContent);
        marker.parentNode.replaceChild(textNode, marker);
      }

      const updatedContent = tempDiv.innerHTML;

      // 2. Firestore의 편집 이력 삭제
      const editHistoryRef = getEditHistoryRef(currentDocId);
      if (editHistoryRef) {
        const editDocRef = doc(editHistoryRef, editId);
        await deleteDoc(editDocRef);
      }

      // 3. Firestore 문서 업데이트
      const docRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc');
      // 기존 문서 소유자 정보 유지
      const existingDoc = await getDoc(docRef);
      const existingOwner = existingDoc.exists() ? existingDoc.data().lastEditedBy : currentUserId;
      const existingOwnerName = existingDoc.exists() ? existingDoc.data().lastEditedByName : currentUserName;

      await setDoc(docRef, {
        content: updatedContent,
        lastEditedBy: existingOwner,
        lastEditedByName: existingOwnerName,
        lastEditedAt: serverTimestamp(),
      }, { merge: true });

      // 4. 캐시 업데이트
      if (currentDocId) {
        globalDocumentCache.set(currentDocId, {
          title: title,
          content: updatedContent
        });
        console.log('💾 개별 취소 후 캐시 업데이트:', currentDocId);
      }

      // 5. UI 업데이트
      setContent(updatedContent);
      if (contentRef.current) {
        contentRef.current.innerHTML = updatedContent;
      }
      if (fullScreenContentRef.current) {
        fullScreenContentRef.current.innerHTML = updatedContent;
      }

      // 6. 수정 내역 모달 닫기 (모달이 열려있던 경우)
      setShowEditModal(false);

      // 성공 알림 제거 - 호출하는 쪽에서 처리
      // showToast?.('수정 표시가 취소되었습니다');
    } catch (error) {
      console.error('수정 취소 실패:', error);
      showToast?.('수정 취소에 실패했습니다');
    }
  }, [actualCanEdit, currentDocId, content, currentUserId, currentUserName, chatRoomId, showToast, getEditHistoryRef]);

  // 문서 비우기 핸들러
  const handleClearDocument = useCallback(() => {
    if (!actualCanEdit) {
      showToast?.('편집 권한이 없습니다');
      return;
    }

    // 비우기 확인 모달 표시
    setShowClearConfirmModal(true);
  }, [actualCanEdit, showToast]);

  // 문서 비우기 확정 실행
  const performClearDocument = useCallback(async () => {
    // ⭐ 모달을 먼저 닫아서 사용자에게 즉각 피드백
    setShowClearConfirmModal(false);

    const docIdToClose = currentDocId;

    // contentRef 비우기
    if (contentRef.current) {
      contentRef.current.innerHTML = '';
    }
    if (fullScreenContentRef.current) {
      fullScreenContentRef.current.innerHTML = '';
    }

    // 상태 업데이트
    setContent('');
    setTitle('');
    setPendingEdits([]);
    setCurrentDocId(null);
    setDocumentOwner(null); // 문서 소유자 정보 초기화

    // 🆕 lastSelectedMemoIdRef 리셋 (같은 문서 재로드 가능하도록)
    lastSelectedMemoIdRef.current = null;

    // Firestore의 currentDoc 완전히 삭제 (빈 객체로 설정하면 불러오기 시 문제 발생)
    try {
      const currentDocRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc');
      await deleteDoc(currentDocRef);
      console.log('✅ Firestore currentDoc 삭제 완료');
    } catch (error) {
      console.error('❌ Firestore currentDoc 삭제 실패:', error);
    }

    // 캐시에서도 제거 (수정 대기중이었다면 마커 정보가 유지되도록 하지 않음)
    // 비우기는 완전히 새로 시작하는 것이므로 캐시도 삭제
    if (docIdToClose) {
      globalDocumentCache.delete(docIdToClose);
      console.log('🗑️ 캐시에서 문서 삭제:', docIdToClose);

      // ⭐ [중요] 비우기 시 원본 메모 업데이트
      // 비우기는 로컬 상태만 초기화하는 것이므로, editHistory는 그대로 유지됨
      // → 현재 방에 마커가 있는지만 확인 (다른 방은 검색 불필요 - 데이터 낭비 방지)
      try {
        // 현재 방의 editHistory만 검색하여 pending 마커가 있는지 확인
        const editsRef = collection(db, 'chatRooms', chatRoomId, 'documents', docIdToClose, 'editHistory');
        const pendingQuery = query(editsRef, where('status', '==', 'pending'));
        const pendingSnapshot = await getDocs(pendingQuery);

        const hasMarker = pendingSnapshot.size > 0;

        const memoRef = doc(db, 'mindflowUsers', currentUserId, 'memos', docIdToClose);
        await setDoc(memoRef, {
          currentWorkingRoomId: hasMarker ? chatRoomId : null,
          hasPendingEdits: hasMarker
        }, { merge: true });

        if (hasMarker) {
          console.log(`✅ 비우기 - 현재 방에 마커 존재 (${pendingSnapshot.size}개), currentWorkingRoomId 유지:`, chatRoomId);
        } else {
          console.log('✅ 비우기 - 마커 없음, 원본 메모 초기화 완료:', docIdToClose);
        }

        // 즉시 메모 동기화 (공유 폴더에서 배지 업데이트)
        if (syncMemo) {
          syncMemo(docIdToClose, {
            currentWorkingRoomId: hasMarker ? chatRoomId : null,
            hasPendingEdits: hasMarker
          });
        }
      } catch (error) {
        console.error('❌ 비우기 - 원본 메모 업데이트 실패:', error);
      }
    }

    showToast?.('문서가 비워졌습니다');
  }, [currentDocId, chatRoomId, currentUserId, currentUserName, showToast, pendingEdits]);

  // 제안 철회 핸들러
  const handleWithdrawProposal = useCallback(async (edit) => {
    try {
      // 댓글이 있는지 확인
      const commentsRef = collection(db, 'chatRooms', chatRoomId, 'documents', currentDocId, 'editHistory', edit.id, 'comments');
      const commentsSnapshot = await getDocs(commentsRef);

      if (!commentsSnapshot.empty) {
        showToast?.('의견이 달린 제안은 철회할 수 없습니다');
        return;
      }

      // 모달 표시
      setPendingWithdrawEdit({
        id: edit.id,
        markerType: edit.type
      });
      setShowWithdrawConfirmModal(true);
      setShowEditModal(false);
    } catch (error) {
      console.error('제안 철회 확인 실패:', error);
      showToast?.('제안 철회에 실패했습니다');
    }
  }, [chatRoomId, currentDocId, showToast]);

  // 마커 클릭 이벤트 핸들러 (상세 정보 모달 표시)
  useEffect(() => {
    const handleMarkerClick = async (e) => {
      const target = e.target;

      // 마커 요소인지 확인
      if (target.classList.contains('strikethrough') || target.classList.contains('highlight')) {
        const editId = target.dataset.editId;
        if (!editId) return;

        e.preventDefault();
        e.stopPropagation();

        // Firestore에서 편집 정보 가져오기
        try {
          const editRef = doc(db, 'chatRooms', chatRoomId, 'documents', currentDocId, 'editHistory', editId);
          const editSnap = await getDoc(editRef);

          if (editSnap.exists()) {
            const editData = editSnap.data();

            // 댓글 개수 조회
            const commentsRef = collection(db, 'chatRooms', chatRoomId, 'documents', currentDocId, 'editHistory', editId, 'comments');
            const commentsSnapshot = await getDocs(commentsRef);
            const commentCount = commentsSnapshot.size;
            console.log('📊 댓글 개수 조회:', {
              chatRoomId,
              currentDocId,
              editId,
              commentCount,
              commentsPath: `chatRooms/${chatRoomId}/documents/${currentDocId}/editHistory/${editId}/comments`
            });

            // 제안자의 WS 코드 조회
            let wsCode = null;
            if (editData.editedBy) {
              try {
                const workspaceId = `workspace_${editData.editedBy}`;
                const workspaceRef = doc(db, 'workspaces', workspaceId);
                const workspaceSnap = await getDoc(workspaceRef);
                if (workspaceSnap.exists()) {
                  wsCode = workspaceSnap.data().workspaceCode;
                }
              } catch (wsError) {
                console.error('WS 코드 조회 실패:', wsError);
              }
            }

            setSelectedMarkerDetail({
              id: editId,
              ...editData,
              wsCode: wsCode, // WS 코드 추가
              commentCount: commentCount, // 댓글 개수 추가
              markerType: target.classList.contains('strikethrough') ? 'strikethrough' : 'highlight'
            });
            setShowMarkerDetailModal(true);
          }
        } catch (error) {
          console.error('마커 정보 로드 실패:', error);
        }
      }
    };

    // 일반 편집 영역
    const contentEl = contentRef.current;
    if (contentEl) {
      contentEl.addEventListener('click', handleMarkerClick);
    }

    // 전체화면 편집 영역
    const fullScreenEl = fullScreenContentRef.current;
    if (fullScreenEl) {
      fullScreenEl.addEventListener('click', handleMarkerClick);
    }

    return () => {
      if (contentEl) {
        contentEl.removeEventListener('click', handleMarkerClick);
      }
      if (fullScreenEl) {
        fullScreenEl.removeEventListener('click', handleMarkerClick);
      }
    };
  }, [chatRoomId, currentDocId]);

  // 권한 타입 결정
  const permissionType = actualIsManager ? 'manager' : actualCanEdit ? 'editor' : 'viewer';
  const permissionLabel = actualIsManager ? '매니저' : actualCanEdit ? '편집자' : '읽기 전용';
  const PermissionIcon = actualIsManager ? Lock : actualCanEdit ? Users : Info;

  return (
    <S.EditorContainer $collapsed={collapsed}>
      {/* 헤더 */}
      <S.EditorHeader onClick={() => !collapsed && setCollapsed(false)}>
        <S.HeaderLeft>
          <S.DocumentIcon>📄</S.DocumentIcon>
          {!content && !title && !currentDocId ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCreateNewDocument();
              }}
              style={{
                flex: 1,
                maxWidth: '300px',
                background: 'transparent',
                border: 'none',
                color: '#4a90e2',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                textAlign: 'left',
                padding: '4px 8px'
              }}
            >
              + 새 문서 작성
            </button>
          ) : !content && !title ? null : (
            <S.TitleInput
              value={title}
              disabled
              readOnly
              onClick={(e) => e.stopPropagation()}
              style={{ cursor: 'default' }}
            />
          )}
        </S.HeaderLeft>

        <S.HeaderRight onClick={(e) => e.stopPropagation()}>
          {onClose && (
            <S.IconButton onClick={onClose} title="닫기">
              <X size={18} />
            </S.IconButton>
          )}

          <S.ToggleButton
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(!collapsed);
            }}
            title={collapsed ? '펼치기' : '접기'}
          >
            {collapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </S.ToggleButton>
        </S.HeaderRight>
      </S.EditorHeader>

      {/* 콘텐츠 */}
      <S.EditorContent $collapsed={collapsed}>
        {/* 문서 소유자 정보 또는 임시 문서 표시 */}
        {currentDocId && currentDocId.startsWith('temp_') && content && content.trim() ? (
          <div
            style={{
              padding: '8px 16px',
              background: 'rgba(255, 193, 7, 0.1)',
              borderBottom: '1px solid rgba(255, 193, 7, 0.3)',
              fontSize: '12px',
              color: '#ffc107',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} />
              새 문서(임시 문서)
            </div>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                await handleSaveTempDocument();
              }}
              style={{
                background: 'linear-gradient(135deg, #4a90e2, #357abd)',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              title="문서 저장"
            >
              <Save size={14} />
              저장
            </button>
          </div>
        ) : documentOwner && currentDocId && !currentDocId.startsWith('temp_') ? (
          <div
            style={{
              padding: '8px 16px',
              background: 'rgba(74, 144, 226, 0.1)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '12px',
              color: '#4a90e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}
          >
            <div
              onClick={() => setShowOwnerModal(true)}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flex: 1
              }}
              title="클릭하여 사용자 ID 확인"
            >
              <Users size={14} />
              문서 소유자: {documentOwner.nickname}{documentOwner.userId === currentUserId ? ' (나)' : ''}
            </div>
            {/* 다운로드 허용/다운로드 버튼 */}
            {documentOwner.userId === currentUserId ? (
              <button
                onClick={handleToggleDownload}
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  background: downloadEnabled ? '#4a90e2' : '#666',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                title={downloadEnabled ? '다운로드 비활성화' : '다운로드 허용'}
              >
                {downloadEnabled ? '다운로드 활성화됨' : '다운로드 허용'}
              </button>
            ) : canDownload ? (
              <button
                onClick={handleDownloadDocument}
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  background: '#4a90e2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                title="공유 폴더에 다운로드"
              >
                📥 다운로드
              </button>
            ) : null}
          </div>
        ) : null}

        {/* 도구 모음 */}
        <S.Toolbar>
          {/* 첫 번째 줄: 불러오기(아이콘만), 편집(아이콘만), 전체승인, 전체리셋 */}
          <S.ToolbarRow key="toolbar-row-1">
            {onLoadFromShared && (
              <S.LoadButton
                onClick={((actualIsManager || actualIsSubManager) || (!content && !title)) ? handleLoadClick : undefined}
                title={((actualIsManager || actualIsSubManager) || (!content && !title)) ? "공유 폴더에서 불러오기" : "권한 없음"}
                disabled={!((actualIsManager || actualIsSubManager) || (!content && !title))}
                style={{
                  opacity: ((actualIsManager || actualIsSubManager) || (!content && !title)) ? 1 : 0.5,
                  cursor: ((actualIsManager || actualIsSubManager) || (!content && !title)) ? 'pointer' : 'not-allowed'
                }}
              >
                📂
              </S.LoadButton>
            )}

            {actualCanEdit ? (
              <S.EditButton
                onClick={() => setShowFullScreenEdit(true)}
                title="큰 화면에서 편집하기"
                disabled={!content && !title}
                style={{ opacity: (!content && !title) ? 0.5 : 1, cursor: (!content && !title) ? 'not-allowed' : 'pointer' }}
              >
                📝
              </S.EditButton>
            ) : (
              <S.EditButton
                onClick={() => setShowFullScreenEdit(true)}
                title="큰 화면에서 보기"
                disabled={!content && !title}
                style={{ opacity: (!content && !title) ? 0.5 : 1, cursor: (!content && !title) ? 'not-allowed' : 'pointer' }}
              >
                📝
              </S.EditButton>
            )}

            <S.ClearButton
              onClick={(actualCanEdit && (content || title)) ? handleClearDocument : undefined}
              title={(actualCanEdit && (content || title)) ? "문서 비우기" : (!actualCanEdit ? "권한 없음" : "문서가 비어있습니다")}
              disabled={!actualCanEdit || (!content && !title)}
              style={{ opacity: (actualCanEdit && (content || title)) ? 1 : 0.5, cursor: (actualCanEdit && (content || title)) ? 'pointer' : 'not-allowed' }}
            >
              🧹
            </S.ClearButton>

            <S.FinalApplyButton
              onClick={actualIsManager ? handleFinalApply : undefined}
              disabled={!actualIsManager || saving || !title.trim() || pendingEdits.length === 0}
              title={actualIsManager ? "전체 승인 (모든 수정 제안 승인)" : "권한 없음"}
              style={{ opacity: (actualIsManager && !saving && title.trim() && pendingEdits.length > 0) ? 1 : 0.5 }}
            >
              전체승인
            </S.FinalApplyButton>

            <S.ResetButton
              onClick={actualIsManager ? handleResetAll : undefined}
              disabled={!actualIsManager || saving || pendingEdits.length === 0}
              title={actualIsManager ? "모든 수정 표시 삭제" : "권한 없음"}
              style={{ opacity: (actualIsManager && !saving && pendingEdits.length > 0) ? 1 : 0.5 }}
            >
              전체리셋
            </S.ResetButton>
          </S.ToolbarRow>

          {/* 두 번째 줄: 수정 대기중 표시, 위치찾기, 권한 관리 */}
          {(pendingEdits.length > 0 || actualIsManager || actualIsSubManager) && (
            <S.ToolbarRow key="toolbar-row-2">
              {pendingEdits.length > 0 ? (
                <>
                  <S.PendingEditsCount title="대기 중인 수정 사항">
                    <Info size={14} />
                    {pendingEdits.length}개 수정 대기중
                  </S.PendingEditsCount>

                  <S.EditNavigationGroup>
                    <S.EditNavigationButton
                      onClick={handlePrevEdit}
                      disabled={pendingEdits.length === 0}
                      title="이전 수정 영역"
                    >
                      <ChevronLeft size={14} />
                    </S.EditNavigationButton>

                    <S.EditNavigationButton
                      style={{ minWidth: '40px' }}
                      disabled
                      title={`${currentEditIndex + 1} / ${pendingEdits.length}`}
                    >
                      {currentEditIndex + 1}/{pendingEdits.length}
                    </S.EditNavigationButton>

                    <S.EditNavigationButton
                      onClick={handleNextEdit}
                      disabled={pendingEdits.length === 0}
                      title="다음 수정 영역"
                    >
                      <ChevronRight size={14} />
                    </S.EditNavigationButton>

                    {(actualIsManager || actualIsSubManager) && !isOneOnOneChat && (
                      <S.EditNavigationButton
                        onClick={() => {
                          setShowPermissionModal(true);
                          loadParticipants();
                        }}
                        title="권한 관리"
                        style={{
                          background: 'rgba(74, 144, 226, 0.15)',
                          borderColor: 'rgba(74, 144, 226, 0.3)',
                          color: '#4a90e2'
                        }}
                      >
                        <UserCog size={14} />
                      </S.EditNavigationButton>
                    )}
                  </S.EditNavigationGroup>
                </>
              ) : (actualIsManager || actualIsSubManager) && !isOneOnOneChat ? (
                <S.EditNavigationGroup>
                  <S.EditNavigationButton
                    onClick={() => {
                      setShowPermissionModal(true);
                      loadParticipants();
                    }}
                    title="권한 관리"
                    style={{
                      background: 'rgba(74, 144, 226, 0.15)',
                      borderColor: 'rgba(74, 144, 226, 0.3)',
                      color: '#4a90e2'
                    }}
                  >
                    <UserCog size={14} />
                  </S.EditNavigationButton>
                </S.EditNavigationGroup>
              ) : null}
            </S.ToolbarRow>
          )}
        </S.Toolbar>

        {/* contentEditable 영역 - 미리보기에서는 읽기 전용 */}
        <S.ContentEditableArea
          ref={contentRef}
          contentEditable={false}
          suppressContentEditableWarning
          onInput={(e) => {
            // 프로그래밍 방식 변경은 허용
            if (programmaticChangeRef.current) {
              programmaticChangeRef.current = false;
              return;
            }
            // 사용자 입력은 방지
            e.preventDefault();
            if (contentRef.current) {
              contentRef.current.innerHTML = content;
            }
          }}
          onKeyDown={(e) => {
            // 텍스트 수정 키는 모두 막기 (선택 키는 허용)
            const allowedKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'];
            const isSelectionKey = e.shiftKey || e.ctrlKey || e.metaKey;

            if (!allowedKeys.includes(e.key) && !isSelectionKey) {
              e.preventDefault();
            }
          }}
          onPaste={(e) => {
            // 붙여넣기 방지
            e.preventDefault();
          }}
          onCut={(e) => {
            // 잘라내기 방지
            e.preventDefault();
          }}
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
        <S.Footer>
          <span>{content.replace(/<[^>]*>/g, '').length} 글자</span>
          <span>실시간 협업 활성화</span>
        </S.Footer>
      </S.EditorContent>

      {/* 수정 이력 모달 - 여러 편집 표시 */}
      {showEditModal && selectedEdits.length > 0 && (
        <S.Modal onClick={() => setShowEditModal(false)}>
          <S.ModalContent onClick={(e) => e.stopPropagation()}>
            <S.ModalHeader>
              <S.ModalTitle>
                수정 내용 확인
                {selectedEdits.length > 1 && (
                  <span style={{ marginLeft: '8px', fontSize: '14px', color: '#ffc107' }}>
                    ({selectedEdits.length}명의 편집)
                  </span>
                )}
              </S.ModalTitle>
              <S.IconButton onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </S.IconButton>
            </S.ModalHeader>

            <S.ModalBody>
              {selectedEdits.map((edit, index) => (
                <div key={edit.id} style={{ marginBottom: index < selectedEdits.length - 1 ? '20px' : '0' }}>
                  <S.EditInfo>
                    <S.InfoRow style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <strong>제안자:</strong>{' '}
                        <span
                          onClick={() => handleNicknameClick(edit.editedBy, editNicknames[edit.editedBy] || '익명')}
                          style={{
                            cursor: 'pointer',
                            color: '#4a90e2',
                            textDecoration: 'underline',
                            fontWeight: '600'
                          }}
                        >
                          {editNicknames[edit.editedBy] || '익명'}
                        </span>
                      </div>
                      {edit.editedBy === currentUserId && (
                        <button
                          onClick={() => handleWithdrawProposal(edit)}
                          style={{
                            background: edit.commentCount > 0 ? 'rgba(255, 107, 107, 0.2)' : 'rgba(255, 107, 107, 0.1)',
                            border: `1px solid ${edit.commentCount > 0 ? 'rgba(255, 107, 107, 0.3)' : 'rgba(255, 107, 107, 0.4)'}`,
                            color: edit.commentCount > 0 ? '#999' : '#ff6b6b',
                            fontSize: '11px',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            cursor: edit.commentCount > 0 ? 'not-allowed' : 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          제안 철회
                        </button>
                      )}
                    </S.InfoRow>
                    <S.InfoRow>
                      <strong>제안 시각:</strong> {edit.editedAt?.toDate?.().toLocaleString('ko-KR')}
                    </S.InfoRow>
                    {edit.type && (
                      <S.InfoRow>
                        <strong>타입:</strong> {
                          edit.type === 'strikethrough' ? '취소선' :
                          edit.type === 'highlight' ? '형광펜' :
                          edit.type === 'comment' ? '주석' : '일반 수정'
                        }
                      </S.InfoRow>
                    )}
                  </S.EditInfo>

                  {/* 취소선: 원본 텍스트 + 삭제 이유 */}
                  {edit.type === 'strikethrough' && (
                    <>
                      <S.TextComparison>
                        <S.ComparisonBox $type="old">
                          <S.ComparisonLabel $type="old">삭제할 텍스트</S.ComparisonLabel>
                          <S.ComparisonText>{edit.oldText || '(없음)'}</S.ComparisonText>
                        </S.ComparisonBox>
                      </S.TextComparison>
                      {edit.reason && (
                        <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '8px', borderLeft: '3px solid #ffc107' }}>
                          <div style={{ fontSize: '12px', color: '#ffc107', marginBottom: '4px', fontWeight: '600' }}>삭제 이유</div>
                          <div style={{ color: '#e0e0e0', fontSize: '14px' }}>{edit.reason}</div>
                        </div>
                      )}
                    </>
                  )}

                  {/* 형광펜: 원본 텍스트 → 대체 텍스트 + 설명 */}
                  {edit.type === 'highlight' && (
                    <>
                      <S.TextComparison>
                        <S.ComparisonBox $type="old">
                          <S.ComparisonLabel $type="old">수정 전</S.ComparisonLabel>
                          <S.ComparisonText>{edit.oldText || '(없음)'}</S.ComparisonText>
                        </S.ComparisonBox>

                        <S.ComparisonBox $type="new">
                          <S.ComparisonLabel $type="new">수정 후</S.ComparisonLabel>
                          <S.ComparisonText>{edit.newText || '(없음)'}</S.ComparisonText>
                        </S.ComparisonBox>
                      </S.TextComparison>
                      {edit.description && (
                        <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '8px', borderLeft: '3px solid #4caf50' }}>
                          <div style={{ fontSize: '12px', color: '#4caf50', marginBottom: '4px', fontWeight: '600' }}>설명</div>
                          <div style={{ color: '#e0e0e0', fontSize: '14px' }}>{edit.description}</div>
                        </div>
                      )}
                    </>
                  )}

                  {/* 주석: 주석 내용만 */}
                  {edit.type === 'comment' && (
                    <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(33, 150, 243, 0.1)', borderRadius: '8px', borderLeft: '3px solid #2196f3' }}>
                      <div style={{ fontSize: '12px', color: '#2196f3', marginBottom: '4px', fontWeight: '600' }}>주석 내용</div>
                      <div style={{ color: '#e0e0e0', fontSize: '14px' }}>{edit.text || '(없음)'}</div>
                    </div>
                  )}

                  {/* 기타 타입 (하위 호환성) */}
                  {!edit.type && (
                    <S.TextComparison>
                      <S.ComparisonBox $type="old">
                        <S.ComparisonLabel $type="old">수정 전</S.ComparisonLabel>
                        <S.ComparisonText>{edit.oldText || edit.text || '(없음)'}</S.ComparisonText>
                      </S.ComparisonBox>

                      <S.ComparisonBox $type="new">
                        <S.ComparisonLabel $type="new">수정 후</S.ComparisonLabel>
                        <S.ComparisonText>{edit.newText || edit.text}</S.ComparisonText>
                      </S.ComparisonBox>
                    </S.TextComparison>
                  )}

                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* 의견 제시 버튼 - 취소선 또는 형광펜 타입만 */}
                    {(edit.type === 'strikethrough' || edit.type === 'highlight') && (
                      <button
                        onClick={() => {
                          setSelectedMarkerForComments({
                            chatRoomId,
                            memoId: currentDocId,
                            editId: edit.id,
                            markerData: {
                              type: edit.type,
                              oldText: edit.oldText,
                              newText: edit.newText || '',
                              description: edit.description || edit.reason || ''
                            }
                          });
                          setShowMarkerCommentsModal(true);
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'rgba(74, 144, 226, 0.15)',
                          border: '1px solid rgba(74, 144, 226, 0.3)',
                          borderRadius: '8px',
                          color: '#4a90e2',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(74, 144, 226, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(74, 144, 226, 0.15)';
                        }}
                      >
                        <MessageCircle size={16} />
                        의견 제시 ({edit.commentCount || 0})
                      </button>
                    )}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {actualIsManager && (
                        <S.ConfirmButton onClick={() => handleApproveEdit(edit.id)}>
                          <Check size={18} />
                          이 편집 승인
                        </S.ConfirmButton>
                      )}
                      {actualCanEdit && (
                        <S.RejectButton onClick={async () => {
                          try {
                            await handleCancelEdit(edit.id);
                            showToast?.('수정 표시가 취소되었습니다');
                          } catch (error) {
                            console.error('취소 실패:', error);
                          }
                        }}>
                          <X size={18} />
                          이 편집 취소
                        </S.RejectButton>
                      )}
                    </div>
                  </div>

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
            </S.ModalBody>
          </S.ModalContent>
        </S.Modal>
      )}

      {/* 주석 입력 모달 */}
      {showCommentModal && (
        <S.Modal onClick={() => setShowCommentModal(false)}>
          <S.ModalContent onClick={(e) => e.stopPropagation()}>
            <S.ModalHeader>
              <S.ModalTitle>주석 입력</S.ModalTitle>
              <S.IconButton onClick={() => {
                setShowCommentModal(false);
                setCommentText('');
                setSelectedCommentRange(null);
              }}>
                <X size={20} />
              </S.IconButton>
            </S.ModalHeader>

            <S.ModalBody>
              <S.EditInfo>
                <S.InfoRow>
                  <strong>선택한 텍스트:</strong> {selectedCommentRange?.text}
                </S.InfoRow>
              </S.EditInfo>

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

              <S.ModalActions>
                <S.ConfirmButton onClick={handleSaveComment} disabled={!commentText.trim()}>
                  <Check size={18} />
                  주석 추가
                </S.ConfirmButton>
                <S.RejectButton onClick={() => {
                  setShowCommentModal(false);
                  setCommentText('');
                  setSelectedCommentRange(null);
                }}>
                  <X size={18} />
                  취소
                </S.RejectButton>
              </S.ModalActions>
            </S.ModalBody>
          </S.ModalContent>
        </S.Modal>
      )}

      {/* 편집 내용 입력 모달 (키보드 기반 편집용) */}
      {showEditInputModal && pendingMarker && (
        <S.Modal onClick={() => {
          setShowEditInputModal(false);
          setPendingMarker(null);
          setEditInputText('');
          setEditReasonText('');
        }}>
          <S.ModalContent onClick={(e) => e.stopPropagation()}>
            <S.ModalHeader>
              <S.ModalTitle>
                {pendingMarker.type === 'strikethrough' && '취소선 - 수정 내용 입력'}
                {pendingMarker.type === 'highlight' && '형광펜 - 수정 내용 입력'}
                {pendingMarker.type === 'comment' && '주석 입력'}
              </S.ModalTitle>
              <S.IconButton onClick={() => {
                setShowEditInputModal(false);
                setPendingMarker(null);
                setEditInputText('');
                setEditReasonText('');
              }}>
                <X size={20} />
              </S.IconButton>
            </S.ModalHeader>

            {pendingMarker.editData && (
              <S.ModalSubtitle>
                <S.SubtitleRow style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong>제안자:</strong>
                    <span
                      onClick={() => {
                        if (pendingMarker.editData.wsCode) {
                          setSelectedUserId(pendingMarker.editData.wsCode);
                          setShowUserIdModal(true);
                        }
                      }}
                      style={{ cursor: 'pointer', textDecoration: 'underline', marginLeft: '8px' }}
                      title="클릭하여 사용자 ID 확인"
                    >
                      {editNicknames[pendingMarker.editData.editedBy] || '알 수 없음'}
                    </span>
                  </div>
                  {pendingMarker.editData.editedBy === currentUserId && (
                    <button
                      onClick={async () => {
                        // 댓글 개수 확인
                        try {
                          const commentsRef = collection(
                            db,
                            'chatRooms',
                            chatRoomId,
                            'documents',
                            currentDocId,
                            'editHistory',
                            pendingMarker.id,
                            'comments'
                          );
                          const commentsSnap = await getDocs(commentsRef);

                          if (commentsSnap.size > 0) {
                            showToast?.('의견이 달린 제안은 철회할 수 없습니다');
                            return;
                          }

                          // 모달 표시
                          setPendingWithdrawEdit({
                            id: pendingMarker.id,
                            markerType: pendingMarker.type
                          });
                          setShowWithdrawConfirmModal(true);
                          setShowEditInputModal(false);
                        } catch (error) {
                          console.error('제안 철회 확인 실패:', error);
                          showToast?.('제안 철회에 실패했습니다');
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(255, 107, 107, 0.15)',
                        border: '1px solid rgba(255, 107, 107, 0.3)',
                        borderRadius: '6px',
                        color: '#ff6b6b',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontWeight: '500'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 107, 107, 0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255, 107, 107, 0.15)';
                      }}
                    >
                      제안 철회
                    </button>
                  )}
                </S.SubtitleRow>
                <S.SubtitleRow>
                  <strong>제안 시각:</strong>
                  <span style={{ marginLeft: '8px' }}>
                    {pendingMarker.editData.editedAt?.toDate
                      ? pendingMarker.editData.editedAt.toDate().toLocaleString('ko-KR')
                      : '알 수 없음'}
                  </span>
                </S.SubtitleRow>
              </S.ModalSubtitle>
            )}

            <S.ModalBody>
              {pendingMarker.text && pendingMarker.type !== 'comment' && (
                <S.EditInfo>
                  <S.InfoRow>
                    <strong>원본 텍스트:</strong> {pendingMarker.text}
                  </S.InfoRow>
                </S.EditInfo>
              )}

              {/* 취소선 - 삭제 이유만 입력 */}
              {pendingMarker.type === 'strikethrough' && (
                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#e0e0e0', fontSize: '14px', fontWeight: '600' }}>
                    삭제 이유
                  </label>
                  <textarea
                    value={editReasonText}
                    onChange={(e) => setEditReasonText(e.target.value)}
                    placeholder="삭제하는 이유를 입력하세요..."
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
              )}

              {/* 형광펜 - 대체 텍스트 + 설명 입력 */}
              {pendingMarker.type === 'highlight' && (
                <>
                  <div style={{ marginTop: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#e0e0e0', fontSize: '14px', fontWeight: '600' }}>
                      대체 텍스트 (선택사항)
                    </label>
                    <textarea
                      value={editInputText}
                      onChange={(e) => setEditInputText(e.target.value)}
                      placeholder="변경할 텍스트를 입력하세요. 아니면 공란으로 두고 하단 설명란에 주석을 넣어 주석용으로 활용할 수 있습니다."
                      style={{
                        width: '100%',
                        minHeight: '80px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 0.1)',
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
                  <div style={{ marginTop: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#e0e0e0', fontSize: '14px', fontWeight: '600' }}>
                      설명 (선택)
                    </label>
                    <textarea
                      value={editReasonText}
                      onChange={(e) => setEditReasonText(e.target.value)}
                      placeholder="수정 이유나 설명을 입력하세요..."
                      style={{
                        width: '100%',
                        minHeight: '60px',
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
                </>
              )}

              {/* 주석 - 주석 내용만 입력 */}
              {pendingMarker.type === 'comment' && (
                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#e0e0e0', fontSize: '14px', fontWeight: '600' }}>
                    주석 내용
                  </label>
                  <textarea
                    value={editInputText}
                    onChange={(e) => setEditInputText(e.target.value)}
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
              )}

              {/* 의견 제시 버튼 (기존 마커를 클릭한 경우만 표시) */}
              {pendingMarker.editData && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <button
                    onClick={() => {
                      setSelectedMarkerForComments({
                        chatRoomId,
                        memoId: currentDocId,
                        editId: pendingMarker.id,
                        markerData: {
                          type: pendingMarker.type,
                          oldText: pendingMarker.text,
                          newText: pendingMarker.editData.newText,
                          description: pendingMarker.editData.description || pendingMarker.editData.reason
                        }
                      });
                      setShowMarkerCommentsModal(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(74, 144, 226, 0.15)',
                      border: '1px solid rgba(74, 144, 226, 0.3)',
                      borderRadius: '8px',
                      color: '#4a90e2',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <MessageCircle size={16} />
                    의견 제시 ({pendingMarker.commentCount || 0})
                  </button>
                </div>
              )}

              <S.ModalActions>
                <S.ConfirmButton onClick={handleConfirmEditInput}>
                  <Check size={18} />
                  확인
                </S.ConfirmButton>
                <S.RejectButton onClick={() => {
                  setShowEditInputModal(false);
                  setPendingMarker(null);
                  setEditInputText('');
                  setEditReasonText('');
                }}>
                  <X size={18} />
                  취소
                </S.RejectButton>
              </S.ModalActions>
            </S.ModalBody>
          </S.ModalContent>
        </S.Modal>
      )}

      {/* 문서 불러오기 확인 모달 */}
      {showLoadConfirmModal && pendingLoadMemo && (
        <S.Modal onClick={handleCancelLoad}>
          <S.ModalContent onClick={(e) => e.stopPropagation()}>
            <S.ModalHeader>
              <S.ModalTitle>문서 불러오기 확인</S.ModalTitle>
              <S.IconButton onClick={handleCancelLoad}>
                <X size={20} />
              </S.IconButton>
            </S.ModalHeader>

            <S.ModalBody>
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

              <S.ModalActions>
                <S.ConfirmButton onClick={handleKeepAndLoad}>
                  <Check size={18} />
                  기존 문서 유지하고 새 문서 열기
                </S.ConfirmButton>
                <S.RejectButton onClick={handleCancelLoad}>
                  <X size={18} />
                  취소
                </S.RejectButton>
              </S.ModalActions>
            </S.ModalBody>
          </S.ModalContent>
        </S.Modal>
      )}

      {/* 전체 승인 확인 모달 */}
      {showApproveAllModal && (
        <S.Modal onClick={() => setShowApproveAllModal(false)}>
          <S.ModalContent onClick={(e) => e.stopPropagation()}>
            <S.ModalHeader>
              <S.ModalTitle>✨ 전체 승인 확인</S.ModalTitle>
              <S.IconButton onClick={() => setShowApproveAllModal(false)}>
                <X size={20} />
              </S.IconButton>
            </S.ModalHeader>

            <S.ModalBody>
              <div style={{
                marginBottom: '20px',
                fontSize: '15px',
                lineHeight: '1.8',
                color: '#e0e0e0'
              }}>
                현재 <strong style={{ color: '#4a90e2' }}>{pendingEdits.length}개의 수정 제안</strong>을 모두 승인하시겠습니까?
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
                <div style={{ fontWeight: '600', marginBottom: '12px', color: '#4a90e2', fontSize: '14px' }}>
                  📋 승인 시 처리 내용
                </div>
                <div style={{ marginBottom: '6px' }}>
                  • <strong>취소선</strong>: 대체 텍스트로 교체하거나 삭제됩니다
                </div>
                <div style={{ marginBottom: '6px' }}>
                  • <strong>형광펜</strong>: 대체 텍스트로 교체하거나 마커만 제거됩니다
                </div>
                <div>
                  • 모든 수정 제안이 문서에 <strong>확정 반영</strong>됩니다
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 193, 7, 0.1)',
                border: '1px solid rgba(255, 193, 7, 0.3)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
                fontSize: '13px',
                lineHeight: '1.8',
                color: '#e0e0e0'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: '#ffc107' }}>
                  ⚠️ 주의
                </div>
                <div style={{ marginBottom: '6px' }}>
                  • 이 작업은 <strong style={{ color: '#ffc107' }}>되돌릴 수 없습니다</strong>
                </div>
                <div>
                  • 개별 검토가 필요한 경우 마커를 클릭하여 하나씩 승인하세요
                </div>
              </div>

              <S.ModalActions>
                <S.RejectButton onClick={() => setShowApproveAllModal(false)}>
                  <X size={18} />
                  취소
                </S.RejectButton>
                <S.ConfirmButton onClick={performApproveAll}>
                  <CheckCircle size={18} />
                  실행
                </S.ConfirmButton>
              </S.ModalActions>
            </S.ModalBody>
          </S.ModalContent>
        </S.Modal>
      )}

      {/* 전체 리셋 확인 모달 */}
      {showResetConfirmModal && (
        <S.Modal onClick={() => setShowResetConfirmModal(false)}>
          <S.ModalContent onClick={(e) => e.stopPropagation()}>
            <S.ModalHeader>
              <S.ModalTitle>전체 리셋 확인</S.ModalTitle>
              <S.IconButton onClick={() => setShowResetConfirmModal(false)}>
                <X size={20} />
              </S.IconButton>
            </S.ModalHeader>

            <S.ModalBody>
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

              <S.ModalActions>
                <S.RejectButton onClick={() => setShowResetConfirmModal(false)}>
                  <X size={18} />
                  취소
                </S.RejectButton>
                <S.ConfirmButton
                  onClick={performResetAll}
                  style={{ background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)' }}
                >
                  <RotateCcw size={18} />
                  실행
                </S.ConfirmButton>
              </S.ModalActions>
            </S.ModalBody>
          </S.ModalContent>
        </S.Modal>
      )}

      {/* 문서 비우기 확인 모달 */}
      {showClearConfirmModal && (
        <S.Modal onClick={() => setShowClearConfirmModal(false)}>
          <S.ModalContent onClick={(e) => e.stopPropagation()}>
            <S.ModalHeader>
              <S.ModalTitle>문서 비우기</S.ModalTitle>
              <S.IconButton onClick={() => setShowClearConfirmModal(false)}>
                <X size={20} />
              </S.IconButton>
            </S.ModalHeader>

            <S.ModalBody>
              {currentDocId && currentDocId.startsWith('temp_') ? (
                <>
                  {/* 임시 문서인 경우 */}
                  <div style={{ marginBottom: '16px', lineHeight: '1.6' }}>
                    <div style={{ marginBottom: '12px', color: '#e0e0e0' }}>
                      저장하지 않은 임시 문서를 비우시겠습니까?
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
                      ⚠️ 경고
                    </div>
                    <div style={{ marginBottom: '6px', paddingLeft: '1em', textIndent: '-1em' }}>
                      • 임시 문서이므로 작업한 내용이 완전히 사라집니다
                    </div>
                    <div style={{ marginBottom: '6px', paddingLeft: '1em', textIndent: '-1em' }}>
                      • <strong style={{ color: '#ff5757' }}>복구할 수 없습니다</strong>
                    </div>
                    <div style={{ paddingLeft: '1em', textIndent: '-1em' }}>
                      • 문서를 비우기 전에 이 임시 문서를 저장하면 공유 폴더에 저장되며 수정 작업 그대로 보존되어 다음에 작업을 이어갈 수 있습니다
                    </div>
                  </div>
                </>
              ) : pendingEdits.length > 0 ? (
                <>
                  {/* 수정 대기중인 문서인 경우 */}
                  <div style={{ marginBottom: '16px', lineHeight: '1.6' }}>
                    <div style={{ marginBottom: '12px', color: '#e0e0e0' }}>
                      수정 대기중인 문서는 수정 정보가 자동 저장되어 다음에 불러오기를 할 때 수정 정보를 그대로 불러옵니다.
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
                      ℹ️ 안내
                    </div>
                    <div style={{ marginBottom: '6px' }}>
                      • 현재 문서: <strong>{title || '(제목 없음)'}</strong>
                    </div>
                    <div style={{ marginBottom: '6px' }}>
                      • 수정 대기 중: <strong style={{ color: '#4a90e2' }}>{pendingEdits.length}개</strong>
                    </div>
                    <div>
                      • 수정 정보는 자동 저장되며, 다음에 이 문서를 불러올 때 그대로 표시됩니다
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* 원본 문서이거나 수정 대기가 없는 경우 */}
                  <div style={{ marginBottom: '16px', color: '#e0e0e0' }}>
                    현재 문서를 닫고 문서창을 비울까요?
                  </div>

                  <div style={{
                    background: 'rgba(255, 193, 7, 0.1)',
                    border: '1px solid rgba(255, 193, 7, 0.3)',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '16px',
                    fontSize: '13px',
                    lineHeight: '1.8',
                    color: '#e0e0e0'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '8px', color: '#ffc107' }}>
                      ℹ️ 안내
                    </div>
                    <div style={{ marginBottom: '6px' }}>
                      • 현재 문서: <strong>{title || '(제목 없음)'}</strong>
                    </div>
                    <div>
                      • 문서창이 비워지며, 필요 시 다시 불러올 수 있습니다
                    </div>
                  </div>
                </>
              )}

              <S.ModalActions>
                <S.RejectButton onClick={() => setShowClearConfirmModal(false)}>
                  <X size={18} />
                  취소
                </S.RejectButton>
                <S.ConfirmButton
                  onClick={performClearDocument}
                  style={{ background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)' }}
                >
                  🧹
                  비우기
                </S.ConfirmButton>
              </S.ModalActions>
            </S.ModalBody>
          </S.ModalContent>
        </S.Modal>
      )}

      {/* 임시 문서 불러오기 경고 모달 */}
      {showTempDocLoadWarningModal && (
        <S.Modal onClick={() => setShowTempDocLoadWarningModal(false)}>
          <S.ModalContent onClick={(e) => e.stopPropagation()}>
            <S.ModalHeader>
              <S.ModalTitle>문서 불러오기</S.ModalTitle>
              <S.IconButton onClick={() => setShowTempDocLoadWarningModal(false)}>
                <X size={20} />
              </S.IconButton>
            </S.ModalHeader>

            <S.ModalBody>
              <div style={{ marginBottom: '16px', lineHeight: '1.6' }}>
                <div style={{ marginBottom: '12px', color: '#e0e0e0' }}>
                  저장하지 않은 임시 문서가 있습니다. 다른 문서를 불러오시겠습니까?
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
                  ⚠️ 경고
                </div>
                <div style={{ marginBottom: '6px', paddingLeft: '1em', textIndent: '-1em' }}>
                  • 임시 문서이므로 작업한 내용이 완전히 사라집니다
                </div>
                <div style={{ marginBottom: '6px', paddingLeft: '1em', textIndent: '-1em' }}>
                  • <strong style={{ color: '#ff5757' }}>복구할 수 없습니다</strong>
                </div>
                <div style={{ paddingLeft: '1em', textIndent: '-1em' }}>
                  • 문서를 불러오기 전에 이 임시 문서를 저장하면 공유 폴더에 저장되며 수정 작업 그대로 보존되어 다음에 작업을 이어갈 수 있습니다
                </div>
              </div>

              <S.ModalActions>
                <S.RejectButton onClick={() => setShowTempDocLoadWarningModal(false)}>
                  <X size={18} />
                  취소
                </S.RejectButton>
                <S.ConfirmButton
                  onClick={proceedLoadFromShared}
                  style={{ background: 'linear-gradient(135deg, #4a90e2, #357abd)' }}
                >
                  <FolderOpen size={18} />
                  불러오기
                </S.ConfirmButton>
              </S.ModalActions>
            </S.ModalBody>
          </S.ModalContent>
        </S.Modal>
      )}

      {/* 문서 소유자 ID 모달 */}
      {showOwnerModal && documentOwner && (
        <S.Modal onClick={() => setShowOwnerModal(false)}>
          <S.ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <S.ModalHeader>
              <S.ModalTitle>
                <Users size={18} color="#4a90e2" style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                문서 소유자 정보
              </S.ModalTitle>
              <S.IconButton onClick={() => setShowOwnerModal(false)}>
                <X size={20} />
              </S.IconButton>
            </S.ModalHeader>

            <S.ModalBody>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '12px', color: '#e0e0e0' }}>
                  <strong>닉네임:</strong> {documentOwner.nickname}
                </div>
                {documentOwner.wsCode ? (
                  <div style={{ marginBottom: '12px', color: '#e0e0e0' }}>
                    <strong>쉐어노트 ID:</strong>
                    <div style={{
                      marginTop: '8px',
                      padding: '12px',
                      background: 'rgba(74, 144, 226, 0.1)',
                      border: '1px solid rgba(74, 144, 226, 0.3)',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      letterSpacing: '2px',
                      textAlign: 'center',
                      color: '#4a90e2'
                    }}>
                      {documentOwner.wsCode.replace('WS-', '')}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#999' }}>쉐어노트 ID를 찾을 수 없습니다</div>
                )}
              </div>

              <S.ModalActions>
                <S.RejectButton onClick={() => setShowOwnerModal(false)}>
                  <X size={18} />
                  닫기
                </S.RejectButton>
                {documentOwner.wsCode && (
                  <S.ConfirmButton
                    onClick={() => {
                      navigator.clipboard.writeText(documentOwner.wsCode.replace('WS-', ''));
                      showToast?.('쉐어노트 ID가 복사되었습니다');
                      setShowOwnerModal(false);
                    }}
                    style={{ background: 'linear-gradient(135deg, #4a90e2, #357abd)' }}
                  >
                    📋
                    ID 복사
                  </S.ConfirmButton>
                )}
              </S.ModalActions>
            </S.ModalBody>
          </S.ModalContent>
        </S.Modal>
      )}

      {/* 거부 확인 모달 */}
      {showRejectConfirmModal && (
        <S.Modal onClick={() => setShowRejectConfirmModal(false)} style={{ zIndex: 500000 }}>
          <S.ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <S.ModalHeader>
              <S.ModalTitle>
                <X size={18} color="#ff5757" style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                수정 제안 거부
              </S.ModalTitle>
              <S.IconButton onClick={() => setShowRejectConfirmModal(false)}>
                <X size={20} />
              </S.IconButton>
            </S.ModalHeader>

            <S.ModalBody>
              <div style={{ marginBottom: '12px', color: '#e0e0e0', lineHeight: '1.6' }}>
                수정 제안을 거부하고 원본을 유지하겠습니까?
              </div>
              <div style={{ marginBottom: '20px', color: '#ff5757', fontSize: '13px' }}>
                ⚠️ 이 작업은 되돌릴 수 없습니다
              </div>

              <S.ModalActions>
                <S.RejectButton onClick={() => setShowRejectConfirmModal(false)}>
                  취소
                </S.RejectButton>
                <S.ConfirmButton
                  onClick={async () => {
                    try {
                      await handleCancelEdit(pendingAction.editId);
                    } catch (error) {
                      console.error('거부 실패:', error);
                    } finally {
                      setShowRejectConfirmModal(false);
                      setShowMarkerDetailModal(false);
                      setSelectedMarkerDetail(null);
                      setPendingAction(null);
                    }
                  }}
                  style={{ background: 'linear-gradient(135deg, #ff5757, #cc4545)' }}
                >
                  거부
                </S.ConfirmButton>
              </S.ModalActions>
            </S.ModalBody>
          </S.ModalContent>
        </S.Modal>
      )}

      {/* 승인 확인 모달 */}
      {showApproveConfirmModal && (
        <S.Modal onClick={() => setShowApproveConfirmModal(false)} style={{ zIndex: 500000 }}>
          <S.ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <S.ModalHeader>
              <S.ModalTitle>
                <Check size={18} color="#4a90e2" style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                수정 승인
              </S.ModalTitle>
              <S.IconButton onClick={() => setShowApproveConfirmModal(false)}>
                <X size={20} />
              </S.IconButton>
            </S.ModalHeader>

            <S.ModalBody>
              <div style={{ marginBottom: '12px', color: '#e0e0e0', lineHeight: '1.6' }}>
                수정을 받아들여 문구를 수정하시겠습니까?
              </div>
              <div style={{ marginBottom: '20px', color: '#ff5757', fontSize: '13px' }}>
                ⚠️ 이 작업은 되돌릴 수 없습니다
              </div>

              <S.ModalActions>
                <S.RejectButton onClick={() => setShowApproveConfirmModal(false)}>
                  취소
                </S.RejectButton>
                <S.ConfirmButton
                  onClick={async () => {
                    try {
                      await handleApproveEdit(pendingAction.editId);
                    } catch (error) {
                      console.error('승인 실패:', error);
                    } finally {
                      setShowApproveConfirmModal(false);
                      setShowMarkerDetailModal(false);
                      setSelectedMarkerDetail(null);
                      setPendingAction(null);
                    }
                  }}
                  style={{ background: 'linear-gradient(135deg, #4a90e2, #357abd)' }}
                >
                  승인
                </S.ConfirmButton>
              </S.ModalActions>
            </S.ModalBody>
          </S.ModalContent>
        </S.Modal>
      )}

      {/* 권한 관리 모달 */}
      {showPermissionModal && (
        <S.Modal onClick={() => setShowPermissionModal(false)}>
          <S.ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <S.ModalHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <S.ModalTitle>
                  <Users size={18} color="#4a90e2" style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  권한 관리
                </S.ModalTitle>
                <S.IconButton
                  onClick={() => setShowPermissionGuideModal(true)}
                  title="권한 안내"
                  style={{
                    padding: '4px',
                    background: 'rgba(74, 144, 226, 0.15)',
                    borderRadius: '50%'
                  }}
                >
                  <HelpCircle size={16} color="#4a90e2" />
                </S.IconButton>
              </div>
              <S.IconButton onClick={() => {
                setShowPermissionModal(false);
              }}>
                <X size={20} />
              </S.IconButton>
            </S.ModalHeader>

            <S.ModalBody>
              <div style={{ marginBottom: '16px', fontSize: '13px', color: '#888' }}>
                참여자의 권한을 관리할 수 있습니다
              </div>

              {participants.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#666' }}>
                  참여자 정보를 불러오는 중...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {participants.map((participant) => (
                    <div
                      key={participant.userId}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#e0e0e0', marginBottom: '4px' }}>
                          {participant.isManager && '👑 '}
                          {participant.isSubManager && '🎖️ '}
                          {participant.isEditor && '✏️ '}
                          {participant.isViewer && '👁️ '}
                          {participant.nickname}
                        </div>
                        <div style={{ fontSize: '11px', color: '#888' }}>
                          {participant.isManager && '방장'}
                          {participant.isSubManager && '부방장'}
                          {participant.isEditor && '편집자'}
                          {participant.isViewer && '뷰어'}
                        </div>
                      </div>

                      {participant.userId !== currentUserId && (
                        <select
                          value={
                            participant.isManager ? 'manager' :
                            participant.isSubManager ? 'submanager' :
                            participant.isEditor ? 'editor' : 'viewer'
                          }
                          onChange={(e) => handlePermissionChange(participant.userId, e.target.value)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            color: '#e0e0e0',
                            padding: '6px 12px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="manager" disabled={actualIsSubManager && !actualIsManager}>👑 방장</option>
                          <option value="submanager" disabled={actualIsSubManager && !actualIsManager}>🎖️ 부방장</option>
                          <option value="editor">✏️ 편집자</option>
                          <option value="viewer">👁️ 뷰어</option>
                        </select>
                      )}

                      {participant.userId === currentUserId && (
                        <div style={{ fontSize: '11px', color: '#4a90e2', fontWeight: '600' }}>
                          나
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 초대 권한 설정 (방장만) */}
              {actualIsManager && (
                <div style={{
                  marginTop: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#e0e0e0', marginBottom: '8px' }}>
                    ⚙️ 방 설정
                  </div>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                    초대 권한: 누가 새로운 사람을 초대할 수 있나요?
                  </div>
                  <select
                    value={invitePermission}
                    onChange={(e) => handleInvitePermissionChange(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#e0e0e0',
                      padding: '8px 12px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="managers_only">👑 방장만</option>
                    <option value="managers_and_submanagers">👑🎖️ 방장 + 부방장</option>
                    <option value="editors_allowed">✏️ 편집자 이상</option>
                    <option value="everyone">👥 모든 참여자</option>
                  </select>
                </div>
              )}
            </S.ModalBody>
          </S.ModalContent>
        </S.Modal>
      )}

      {/* 권한 안내 모달 */}
      {showPermissionGuideModal && (
        <S.Modal onClick={() => setShowPermissionGuideModal(false)}>
          <S.ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <S.ModalHeader>
              <S.ModalTitle>ℹ️ 권한 안내</S.ModalTitle>
              <S.IconButton onClick={() => setShowPermissionGuideModal(false)}>
                <X size={20} />
              </S.IconButton>
            </S.ModalHeader>

            <S.ModalBody>
              <div style={{
                background: 'rgba(74, 144, 226, 0.1)',
                border: '1px solid rgba(74, 144, 226, 0.3)',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '13px',
                lineHeight: '1.8',
                color: '#e0e0e0'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '12px', color: '#4a90e2', fontSize: '14px' }}>
                  단체방 권한 체계
                </div>
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>👑</span>
                  <div>
                    <strong>방장</strong>
                    <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>
                      편집 + 승인/거부 + 모든 권한 관리
                    </div>
                  </div>
                </div>
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>🎖️</span>
                  <div>
                    <strong>부방장</strong>
                    <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>
                      편집 + 수정 제안 + 편집자 관리
                    </div>
                  </div>
                </div>
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>✏️</span>
                  <div>
                    <strong>편집자</strong>
                    <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>
                      편집 + 수정 제안
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>👁️</span>
                  <div>
                    <strong>뷰어</strong>
                    <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>
                      읽기 전용 + 채팅
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: '16px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '12px',
                color: '#aaa',
                lineHeight: '1.6'
              }}>
                <div style={{ marginBottom: '6px' }}>
                  💡 <strong style={{ color: '#e0e0e0' }}>1:1 대화방</strong>에서는 참여자 모두 최고 권한(방장 권한)을 가지게 됩니다.
                </div>
                <div>
                  권한 관리 기능은 단체방에서만 사용할 수 있습니다.
                </div>
              </div>
            </S.ModalBody>
          </S.ModalContent>
        </S.Modal>
      )}

      {/* 마커 상세 정보 모달 */}
      {showMarkerDetailModal && selectedMarkerDetail && (
        <S.Modal onClick={() => {
          setShowMarkerDetailModal(false);
          setSelectedMarkerDetail(null);
        }}>
          <S.ModalContent onClick={(e) => e.stopPropagation()}>
            <S.ModalHeader>
              <S.ModalTitle>
                {selectedMarkerDetail.markerType === 'strikethrough' ? '✏️ 취소선 수정 제안' : '💡 형광펜 수정 제안'}
              </S.ModalTitle>
              <S.IconButton onClick={() => {
                setShowMarkerDetailModal(false);
                setSelectedMarkerDetail(null);
              }}>
                <X size={20} />
              </S.IconButton>
            </S.ModalHeader>

            <S.ModalBody>
              <S.EditInfo>
                <S.InfoRow style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong>제안자:</strong>{' '}
                    <span
                      onClick={() => {
                        if (selectedMarkerDetail.wsCode) {
                          setSelectedUserId(selectedMarkerDetail.wsCode);
                          setShowUserIdModal(true);
                        }
                      }}
                      style={{ cursor: 'pointer', textDecoration: 'underline' }}
                      title="클릭하여 사용자 ID 확인"
                    >
                      {editNicknames[selectedMarkerDetail.editedBy] || '알 수 없음'}
                    </span>
                  </div>
                  {selectedMarkerDetail.editedBy === currentUserId && (
                    <button
                      onClick={() => {
                        // 댓글이 있으면 철회 불가
                        if (selectedMarkerDetail.commentCount > 0) {
                          showToast?.('의견이 달린 제안은 철회할 수 없습니다');
                          return;
                        }

                        // 모달 표시
                        setPendingWithdrawEdit(selectedMarkerDetail);
                        setShowWithdrawConfirmModal(true);
                      }}
                      style={{
                        padding: '6px 12px',
                        background: selectedMarkerDetail.commentCount > 0 ? 'rgba(255, 107, 107, 0.2)' : 'rgba(255, 107, 107, 0.1)',
                        border: `1px solid ${selectedMarkerDetail.commentCount > 0 ? 'rgba(255, 107, 107, 0.3)' : 'rgba(255, 107, 107, 0.4)'}`,
                        borderRadius: '6px',
                        color: selectedMarkerDetail.commentCount > 0 ? '#999' : '#ff6b6b',
                        fontSize: '11px',
                        cursor: selectedMarkerDetail.commentCount > 0 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        fontWeight: '500'
                      }}
                    >
                      제안 철회
                    </button>
                  )}
                </S.InfoRow>
                <S.InfoRow>
                  <strong>제안 시각:</strong>{' '}
                  {selectedMarkerDetail.editedAt?.toDate
                    ? selectedMarkerDetail.editedAt.toDate().toLocaleString('ko-KR')
                    : '알 수 없음'}
                </S.InfoRow>
                <S.InfoRow>
                  <strong>
                    {selectedMarkerDetail.markerType === 'strikethrough'
                      ? '원본 텍스트(삭제할 텍스트):'
                      : '원본 텍스트:'}
                  </strong>{' '}
                  {selectedMarkerDetail.oldText || '(없음)'}
                </S.InfoRow>

                {selectedMarkerDetail.markerType === 'strikethrough' && (
                  <S.InfoRow>
                    <strong>삭제 이유:</strong> {selectedMarkerDetail.reason || '(이유 없음)'}
                  </S.InfoRow>
                )}

                {selectedMarkerDetail.markerType === 'highlight' && (
                  <>
                    <S.InfoRow>
                      <strong>대체 텍스트:</strong> {selectedMarkerDetail.newText || '(공란)'}
                    </S.InfoRow>
                    {selectedMarkerDetail.description && (
                      <S.InfoRow>
                        <strong>설명:</strong> {selectedMarkerDetail.description}
                      </S.InfoRow>
                    )}
                  </>
                )}
              </S.EditInfo>

              {/* 의견 제시 댓글 보기 버튼 */}
              <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                <button
                  onClick={() => {
                    // MarkerCommentsModal 열기
                    setSelectedMarkerForComments({
                      chatRoomId,
                      memoId: currentDocId,
                      editId: selectedMarkerDetail.id,
                      markerData: {
                        type: selectedMarkerDetail.markerType,
                        oldText: selectedMarkerDetail.oldText,
                        newText: selectedMarkerDetail.newText,
                        reason: selectedMarkerDetail.reason,
                        description: selectedMarkerDetail.description
                      }
                    });
                    setShowMarkerCommentsModal(true);
                    // 현재 모달 닫기
                    setShowMarkerDetailModal(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(74, 144, 226, 0.15)',
                    border: '1px solid rgba(74, 144, 226, 0.3)',
                    borderRadius: '8px',
                    color: '#4a90e2',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(74, 144, 226, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(74, 144, 226, 0.15)';
                  }}
                >
                  💬 의견 제시 ({selectedMarkerDetail.commentCount || 0})
                </button>
              </div>

              {actualIsManager && (
                <S.ModalActions>
                  <S.RejectButton onClick={() => {
                    // 거부 확인 모달 표시
                    setPendingAction({
                      type: 'reject',
                      editId: selectedMarkerDetail.id
                    });
                    setShowRejectConfirmModal(true);
                  }}>
                    <X size={18} />
                    거부
                  </S.RejectButton>
                  <S.ConfirmButton onClick={() => {
                    // 승인 확인 모달 표시
                    setPendingAction({
                      type: 'approve',
                      editId: selectedMarkerDetail.id
                    });
                    setShowApproveConfirmModal(true);
                  }}>
                    <Check size={18} />
                    승인
                  </S.ConfirmButton>
                </S.ModalActions>
              )}
            </S.ModalBody>
          </S.ModalContent>
        </S.Modal>
      )}

      {/* 사용자 ID 복사 모달 */}
      {showUserIdModal && selectedUserId && (
        <S.Modal onClick={() => setShowUserIdModal(false)}>
          <S.ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <S.ModalHeader>
              <S.ModalTitle>사용자 ID</S.ModalTitle>
              <S.IconButton onClick={() => setShowUserIdModal(false)}>
                <X size={20} />
              </S.IconButton>
            </S.ModalHeader>

            <S.ModalBody>
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '13px',
                  color: '#888',
                  marginBottom: '8px'
                }}>
                  쉐어노트 ID
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#4a90e2',
                  fontFamily: 'monospace',
                  letterSpacing: '2px'
                }}>
                  {(selectedUserId.split('-')[1] || selectedUserId.slice(0, 6)).toUpperCase()}
                </div>
              </div>

              <S.ModalActions>
                <S.ConfirmButton onClick={() => {
                  const shortId = (selectedUserId.split('-')[1] || selectedUserId.slice(0, 6)).toUpperCase();
                  navigator.clipboard.writeText(shortId);
                  showToast?.(`ID 복사됨: ${shortId}`);
                  setShowUserIdModal(false);
                }}>
                  복사
                </S.ConfirmButton>
              </S.ModalActions>
            </S.ModalBody>
          </S.ModalContent>
        </S.Modal>
      )}

      {/* 전체 화면 편집 모달 */}
      {showFullScreenEdit && (
        <S.FullScreenModal onClick={handleCloseFullScreenEdit}>
          <S.FullScreenEditorContainer onClick={(e) => e.stopPropagation()}>
            {/* 헤더 */}
            <S.FullScreenHeader>
              <S.FullScreenTitle>
                <S.DocumentIcon>📄</S.DocumentIcon>
                <S.FullScreenTitleInput
                  value={title}
                  disabled
                  readOnly
                  style={{ cursor: 'default' }}
                />
              </S.FullScreenTitle>

              <S.IconButton onClick={handleCloseFullScreenEdit} title="닫기" style={{ position: 'relative', right: '-15px' }}>
                <X size={24} />
              </S.IconButton>
            </S.FullScreenHeader>

            {/* 문서 소유자 정보 또는 임시 문서 표시 */}
            {currentDocId && currentDocId.startsWith('temp_') && content && content.trim() ? (
              <div
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255, 193, 7, 0.1)',
                  borderBottom: '1px solid rgba(255, 193, 7, 0.3)',
                  fontSize: '11px',
                  color: '#ffc107',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FileText size={12} />
                새 문서(임시 문서)
              </div>
            ) : documentOwner && currentDocId && !currentDocId.startsWith('temp_') ? (
              <div
                onClick={() => setShowOwnerModal(true)}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(74, 144, 226, 0.1)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '11px',
                  color: '#4a90e2',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="클릭하여 사용자 ID 확인"
              >
                <Users size={12} />
                문서 소유자: {documentOwner.nickname}{documentOwner.userId === currentUserId ? ' (나)' : ''}
              </div>
            ) : null}

            {/* 툴바 - 2줄 레이아웃 (모든 사용자에게 표시) */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* 첫 번째 줄: 취소선, 형광펜 */}
              <S.FullScreenToolbar style={{ borderBottom: 'none', paddingBottom: '7px' }}>
                <S.ToolbarButton onClick={handleApplyStrikethrough} title="선택한 텍스트에 취소선 적용">
                  <Strikethrough size={16} />
                  취소선
                </S.ToolbarButton>

                <S.ToolbarButton onClick={handleApplyHighlighter} title="선택한 텍스트에 형광펜 적용">
                  <Highlighter size={16} />
                  형광펜
                </S.ToolbarButton>
              </S.FullScreenToolbar>

              {/* 두 번째 줄: 수정 대기중, 위치 찾기 */}
              {pendingEdits.length > 0 && (
                <S.FullScreenToolbar style={{ paddingTop: '7px' }}>
                  <S.PendingEditsCount title="대기 중인 수정 사항">
                    <Info size={16} />
                    {pendingEdits.length}개 수정 대기중
                  </S.PendingEditsCount>

                  <S.EditNavigationGroup>
                    <S.EditNavigationButton
                      onClick={handlePrevEdit}
                      disabled={pendingEdits.length === 0}
                      title="이전 수정 영역"
                    >
                      <ChevronLeft size={14} />
                    </S.EditNavigationButton>

                    <S.EditNavigationButton
                      style={{ minWidth: '40px' }}
                      disabled
                      title={`${currentEditIndex + 1} / ${pendingEdits.length}`}
                    >
                      {currentEditIndex + 1}/{pendingEdits.length}
                    </S.EditNavigationButton>

                    <S.EditNavigationButton
                      onClick={handleNextEdit}
                      disabled={pendingEdits.length === 0}
                      title="다음 수정 영역"
                    >
                      <ChevronRight size={14} />
                    </S.EditNavigationButton>
                  </S.EditNavigationGroup>
                </S.FullScreenToolbar>
              )}
            </div>

            {/* 편집 영역 */}
            <S.FullScreenContent>
              <S.FullScreenEditArea
                ref={fullScreenContentRef}
                contentEditable={false}
                suppressContentEditableWarning
                onInput={(e) => {
                  // 대화방에서는 항상 읽기 전용 - 직접 편집 차단
                  e.preventDefault();
                  if (fullScreenContentRef.current) {
                    fullScreenContentRef.current.innerHTML = content;
                  }
                }}
                onKeyDown={(e) => {
                  // 대화방에서는 항상 텍스트 수정 차단 (선택 키는 허용)
                  const allowedKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'];
                  const isSelectionKey = e.shiftKey || e.ctrlKey || e.metaKey;

                  if (!allowedKeys.includes(e.key) && !isSelectionKey) {
                    e.preventDefault();
                  }
                }}
                onPaste={(e) => {
                  // 대화방에서는 항상 붙여넣기 차단
                  e.preventDefault();
                }}
                onCut={(e) => {
                  // 대화방에서는 항상 잘라내기 차단
                  e.preventDefault();
                }}
                onClick={(e) => {
                  const editId = e.target.dataset.editId;
                  if (editId) {
                    handleEditMarkerClick(editId, e.target);
                  }
                }}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </S.FullScreenContent>

            {/* 하단 정보 */}
            <S.FullScreenFooter>
              <span>{content.replace(/<[^>]*>/g, '').length} 글자</span>
              <span>
                {actualCanEdit ? '편집 모드' : '읽기 전용 모드'}
                {' • '}
                실시간 협업 활성화
              </span>
            </S.FullScreenFooter>
          </S.FullScreenEditorContainer>
        </S.FullScreenModal>
      )}

      {/* 마커 의견 제시 모달 */}
      {showMarkerCommentsModal && selectedMarkerForComments && (
        <MarkerCommentsModal
          onClose={() => {
            setShowMarkerCommentsModal(false);
            setSelectedMarkerForComments(null);
          }}
          chatRoomId={selectedMarkerForComments.chatRoomId}
          memoId={selectedMarkerForComments.memoId}
          editId={selectedMarkerForComments.editId}
          markerData={selectedMarkerForComments.markerData}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          showToast={showToast}
        />
      )}

      {/* 제안 철회 확인 모달 */}
      {showWithdrawConfirmModal && pendingWithdrawEdit && (
        <S.Modal onClick={() => setShowWithdrawConfirmModal(false)} style={{ zIndex: 500000 }}>
          <S.ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <S.ModalHeader>
              <S.ModalTitle>
                <X size={18} color="#ff6b6b" style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                제안 철회 확인
              </S.ModalTitle>
              <S.IconButton onClick={() => setShowWithdrawConfirmModal(false)}>
                <X size={20} />
              </S.IconButton>
            </S.ModalHeader>

            <S.ModalBody>
              <div style={{ marginBottom: '12px', color: '#e0e0e0', lineHeight: '1.6' }}>
                이 제안을 철회하시겠습니까?
              </div>
              <div style={{ marginBottom: '20px', color: '#ff6b6b', fontSize: '13px' }}>
                ⚠️ 철회된 제안은 복구할 수 없습니다
              </div>

              <S.ModalActions>
                <S.RejectButton onClick={() => {
                  setShowWithdrawConfirmModal(false);
                  setPendingWithdrawEdit(null);
                }}>
                  취소
                </S.RejectButton>
                <S.ConfirmButton
                  onClick={async () => {
                    try {
                      // 1. DOM에서 마커 제거
                      const container = showFullScreenEdit ? fullScreenContentRef.current : contentRef.current;
                      if (container) {
                        const markerClass = pendingWithdrawEdit.markerType === 'strikethrough' ? 'strikethrough' : 'highlight';
                        const markers = container.querySelectorAll(`.${markerClass}[data-edit-id="${pendingWithdrawEdit.id}"]`);
                        markers.forEach(marker => {
                          const parent = marker.parentNode;
                          const textNode = document.createTextNode(marker.textContent);
                          parent.replaceChild(textNode, marker);
                          parent.normalize();
                        });

                        // 2. Firestore의 sharedDocument에도 마커 제거된 HTML 저장
                        const updatedContent = container.innerHTML;
                        const docRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc');
                        await updateDoc(docRef, {
                          content: updatedContent,
                          lastEditedBy: currentUserId,
                          lastEditedAt: serverTimestamp()
                        });
                      }

                      // 3. Firestore에서 제안 삭제
                      const editRef = doc(
                        db,
                        'chatRooms',
                        chatRoomId,
                        'documents',
                        currentDocId,
                        'editHistory',
                        pendingWithdrawEdit.id
                      );
                      await deleteDoc(editRef);

                      showToast?.('제안이 철회되었습니다');
                      setShowWithdrawConfirmModal(false);
                      setPendingWithdrawEdit(null);
                      setShowMarkerDetailModal(false);
                      setSelectedMarkerDetail(null);
                      setShowEditInputModal(false);
                      setPendingMarker(null);
                    } catch (error) {
                      console.error('제안 철회 실패:', error);
                      showToast?.('제안 철회에 실패했습니다');
                    }
                  }}
                  style={{ background: 'linear-gradient(135deg, #ff6b6b, #ff5252)' }}
                >
                  철회
                </S.ConfirmButton>
              </S.ModalActions>
            </S.ModalBody>
          </S.ModalContent>
        </S.Modal>
      )}

      {/* 다운로드 허용 확인 모달 */}
      {showDownloadConfirmModal && (
        <S.Modal onClick={() => setShowDownloadConfirmModal(false)} style={{ zIndex: 500000 }}>
          <S.ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <S.ModalHeader>
              <S.ModalTitle>
                <Download size={18} color="#4a90e2" style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                다운로드 허용 확인
              </S.ModalTitle>
              <S.IconButton onClick={() => setShowDownloadConfirmModal(false)}>
                <X size={20} />
              </S.IconButton>
            </S.ModalHeader>

            <S.ModalBody>
              <div style={{ marginBottom: '16px', color: '#e0e0e0', lineHeight: '1.6', fontSize: '14px' }}>
                현재 열어놓은 문서를 상대방(멤버)이 다운로드할 수 있도록 하겠습니까?
              </div>
              <div style={{ marginBottom: '16px', color: '#b0b0b0', fontSize: '13px', lineHeight: '1.5' }}>
                수정 대기중인 문서라면 마커 정보도 함께 다운로드됩니다.
              </div>
              <div style={{ marginBottom: '20px', color: '#ff6b6b', fontSize: '13px', lineHeight: '1.5', fontWeight: '600' }}>
                ⚠️ 다운로드를 허용하기전에 민감한 내용이나 개인정보 등의 중요한 내용이 없는지 반드시 확인하세요.
              </div>

              <S.ModalActions>
                <S.RejectButton onClick={() => setShowDownloadConfirmModal(false)}>
                  취소
                </S.RejectButton>
                <S.ConfirmButton
                  onClick={() => {
                    confirmToggleDownload();
                    setShowDownloadConfirmModal(false);
                  }}
                  style={{ background: 'linear-gradient(135deg, #4a90e2, #357abd)' }}
                >
                  허용
                </S.ConfirmButton>
              </S.ModalActions>
            </S.ModalBody>
          </S.ModalContent>
        </S.Modal>
      )}

      {/* 새 문서 작성 모달 */}
      <CollaborationMemoModal
        isOpen={showNewMemoModal}
        onSave={handleSaveNewMemo}
        onCancel={() => setShowNewMemoModal(false)}
      />

      {/* 이미지 뷰어 모달 */}
      {showImageViewer && (
        <S.ImageViewerOverlay onClick={handleCloseImageViewer}>
          <S.ImageViewerContent onClick={(e) => e.stopPropagation()}>
            <S.ImageViewerImage src={viewerImageSrc} alt="Full size" />
            <S.ImageViewerCloseButton onClick={handleCloseImageViewer}>
              <X size={24} />
            </S.ImageViewerCloseButton>
          </S.ImageViewerContent>
        </S.ImageViewerOverlay>
      )}
    </S.EditorContainer>
  );
};

export default CollaborativeDocumentEditor;
