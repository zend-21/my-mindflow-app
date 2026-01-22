// 전체화면 채팅방 컴포넌트
import { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import Portal from '../Portal';
import * as S from './ChatRoom.styles';
import { ArrowLeft, Send, MoreVertical, Users, Smile, FileText, Settings, X, UserCog, UserPlus, Trash2, Mail, Copy, Shield, Volume2, VolumeX, Edit3, Search, ChevronUp, ChevronDown } from 'lucide-react';
// 🆕 통합 채팅 서비스 (1:1 + 그룹)
import {
  sendMessage as sendUnifiedMessage,
  subscribeToMessages as subscribeToUnifiedMessages,
  markAsRead as markUnifiedAsRead,
  markAllMessagesAsRead as markAllUnifiedMessagesAsRead,
  enterChatRoom as enterUnifiedChatRoom,
  exitChatRoom as exitUnifiedChatRoom,
  deleteMessageByAdmin
} from '../../services/unifiedChatService';
// 개별 서비스 (그룹 관리 기능용)
import { subscribeToDMRoom } from '../../services/directMessageService';
import { acceptInvitation, rejectInvitation, inviteMembersToGroup, transferRoomOwnership, removeMemberFromGroup, deleteGroupChat, cancelInvitation, updateGroupRoomType, appointSubManager, removeSubManager, updateGroupImage, updateGroupName, subscribeToGroupRoom, muteUserInGroup, unmuteUserInGroup, getMutedUsersInGroup } from '../../services/groupChatService';
import { getMyFriends, getUserByWorkspaceCode } from '../../services/friendService';
import { getUserNickname } from '../../services/nicknameService';
import { isUserBlocked, blockUser, unblockUser, getBlockedUsers } from '../../services/userManagementService';
import { playChatMessageSound, getNotificationSettings, notificationSettings } from '../../utils/notificationSounds';
import { setCurrentChatRoom, clearCurrentChatRoom } from '../../utils/currentChatRoom';
import CollaborativeDocumentEditor from './CollaborativeDocumentEditor';
import SharedMemoSelectorModal from './SharedMemoSelectorModal';
import AppointSubManagerModal from './AppointSubManagerModal';
import UserProfileModal from './UserProfileModal';
import { db } from '../../firebase/config';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { getCurrentUserId, getCurrentUserData, getRoomReceiveSoundMuted, setRoomReceiveSoundMuted } from '../../utils/userStorage';
import { avatarList } from '../avatars/AvatarIcons';


const ChatRoom = ({ chat, onClose, showToast, memos, onUpdateMemoPendingFlag, syncMemo }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDocument, setShowDocument] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null); // 현재 편집중인 문서
  const [hasSharedDocument, setHasSharedDocument] = useState(false); // Firestore에 공유 문서가 있는지 여부
  const [showSharedMemoSelector, setShowSharedMemoSelector] = useState(false); // 공유 폴더 메모 선택 모달
  const [permissions, setPermissions] = useState({ editors: [], manager: null }); // 권한 정보
  const [selectedMemoToLoad, setSelectedMemoToLoad] = useState(null); // CollaborativeDocumentEditor에 전달할 메모
  const [isPageVisible, setIsPageVisible] = useState(!document.hidden); // 🆕 페이지 가시성 상태
  const [processingInvitation, setProcessingInvitation] = useState(false); // 초대 처리 중
  const [myMemberStatus, setMyMemberStatus] = useState(null); // 내 멤버 상태 (active/pending/rejected)
  const [showMemberListModal, setShowMemberListModal] = useState(false); // 참여자 목록 모달
  const [showMenuDropdown, setShowMenuDropdown] = useState(false); // 점 세개 드롭다운
  const [showSearchBar, setShowSearchBar] = useState(false); // 검색창 표시 여부
  const [searchQuery, setSearchQuery] = useState(''); // 검색어
  const [searchResults, setSearchResults] = useState([]); // 검색 결과 (메시지 인덱스 배열)
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0); // 현재 검색 결과 인덱스
  const [showInviteMembersModal, setShowInviteMembersModal] = useState(false); // 멤버 초대 모달
  const [showTransferOwnerModal, setShowTransferOwnerModal] = useState(false); // 방장 위임 모달
  const [showAppointSubManagerModal, setShowAppointSubManagerModal] = useState(false); // 부방장 임명 모달
  const [showInviteCodeModal, setShowInviteCodeModal] = useState(false); // 초대 코드 보기 모달
  const [friends, setFriends] = useState([]); // 친구 목록 (멤버 초대용)
  const [selectedFriendsToInvite, setSelectedFriendsToInvite] = useState([]); // 초대할 친구 선택
  const [searchQueryInvite, setSearchQueryInvite] = useState(''); // 초대 모달 검색어
  const [inviteTab, setInviteTab] = useState('friends'); // 'friends' | 'search'
  const [workspaceIdInput, setWorkspaceIdInput] = useState(''); // 아이디 입력
  const [searchedUser, setSearchedUser] = useState(null); // 검색된 사용자
  const [searchingUser, setSearchingUser] = useState(false); // 사용자 검색 중
  const [selectedMemberToTransfer, setSelectedMemberToTransfer] = useState(null); // 위임할 멤버 선택
  const [loadingInvite, setLoadingInvite] = useState(false); // 초대 중
  const [loadingTransfer, setLoadingTransfer] = useState(false); // 위임 중
  // memberNicknames는 userNicknames로 통합됨 (실시간 구독)
  const [nicknamesLoaded, setNicknamesLoaded] = useState(false); // 닉네임 로딩 완료 여부
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false); // 강퇴 확인 모달
  const [memberToRemove, setMemberToRemove] = useState(null); // 강퇴할 멤버 { id, name }
  const [showMemberDetailModal, setShowMemberDetailModal] = useState(false); // 멤버 상세 정보 모달
  const [selectedMemberDetail, setSelectedMemberDetail] = useState(null); // 선택된 멤버 { id, name, workspaceId }
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false); // 단체방 삭제 확인 모달 (1단계)
  const [showDeleteGroupFinalModal, setShowDeleteGroupFinalModal] = useState(false); // 단체방 삭제 최종 확인 모달 (2단계)
  const [showRoomTypeModal, setShowRoomTypeModal] = useState(false); // 🆕 방 타입 변경 모달
  const [selectedRoomType, setSelectedRoomType] = useState(null); // 선택된 방 타입 (null | true | false)
  const [showRoomTypeConfirmModal, setShowRoomTypeConfirmModal] = useState(false); // 방 타입 변경 최종 확인 모달
  const [showLeaveGroupModal, setShowLeaveGroupModal] = useState(false); // 그룹 나가기 확인 모달
  const [leaveAfterTransfer, setLeaveAfterTransfer] = useState(false); // 위임 후 나가기 플래그
  const [showOwnerLeaveGuideModal, setShowOwnerLeaveGuideModal] = useState(false); // 방장 나가기 안내 모달
  const [showTransferConfirmModal, setShowTransferConfirmModal] = useState(false); // 위임 최종 확인 모달
  const [isOtherUserBlocked, setIsOtherUserBlocked] = useState(false); // 내가 상대방을 차단했는지 여부 (일방향 - 조용히 차단)
  const [showBlockedJoinConfirm, setShowBlockedJoinConfirm] = useState({ show: false, blockedNames: '' }); // 차단 사용자 있는 방 참여 확인
  const [showCancelInviteConfirm, setShowCancelInviteConfirm] = useState({ show: false, targetId: null, targetName: '' }); // 초대 취소 확인
  const [checkingBlockStatus, setCheckingBlockStatus] = useState(true); // 차단 상태 확인 중
  const [groupDeletionInfo, setGroupDeletionInfo] = useState(null); // 그룹 삭제 정보 { deleterName, countdown }
  const [collapsibleMessages, setCollapsibleMessages] = useState(new Set()); // 접을 수 있는 메시지 ID (18줄 이상)
  const [showFullMessageModal, setShowFullMessageModal] = useState(false); // 전체 메시지 모달
  const [fullMessageContent, setFullMessageContent] = useState(''); // 전체 메시지 내용
  const [firstUnreadIndex, setFirstUnreadIndex] = useState(-1); // 첫 번째 안 읽은 메시지 인덱스 (-1이면 모두 읽음)
  const [messageLimit, setMessageLimit] = useState(30); // 메시지 로드 개수 제한
  const [hasMoreMessages, setHasMoreMessages] = useState(false); // 더 많은 메시지가 있는지 여부
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false); // 이전 메시지 로딩 중
  const [initialMessageCount, setInitialMessageCount] = useState(0); // 초기 로드된 메시지 개수 (이전 대화 경계 표시용)
  const [hasLoadedOlderMessages, setHasLoadedOlderMessages] = useState(false); // 이전 메시지를 추가로 로드했는지 여부
  const [dividerMessageIds, setDividerMessageIds] = useState([]); // 구분선을 표시할 메시지 ID 배열
  const [avatarContextMenu, setAvatarContextMenu] = useState({ show: false, x: 0, y: 0, messageId: null, senderId: null, senderName: '', isDeleted: false }); // 프사 컨텍스트 메뉴
  const [userProfileModal, setUserProfileModal] = useState({ show: false, userId: null, userName: '', profilePicture: null }); // 프로필 모달
  const [mutedUsers, setMutedUsers] = useState([]); // 이 채팅방에서 내가 차단한 사용자 목록 (단체방 메시지 차단)
  const [blockedUserIds, setBlockedUserIds] = useState([]); // 전체 앱에서 차단한 사용자 ID 목록
  const [showRenameRoomModal, setShowRenameRoomModal] = useState(false); // 방 이름 변경 모달
  const [newRoomName, setNewRoomName] = useState(''); // 새 방 이름
  const [blockConfirmModal, setBlockConfirmModal] = useState({ show: false, userId: null, userName: '', isUnblock: false }); // 차단 확인 모달
  const [isReceiveSoundMuted, setIsReceiveSoundMuted] = useState(false); // 채팅중 수신음 소거 상태
  const [showMacroModal, setShowMacroModal] = useState(false); // 매크로 선택 모달
  const [macros, setMacros] = useState([]); // 매크로 목록
  const [showMacroButton, setShowMacroButton] = useState(() => {
    const saved = localStorage.getItem('chatRoom_showMacroButton');
    return saved !== 'false'; // 기본값: true (ON)
  });
  // 대화방 색상 설정
  const [roomBgColor, setRoomBgColor] = useState(() => {
    return localStorage.getItem('chatRoom_bgColor') || '#1a1a1a';
  });
  const [myBubbleColor, setMyBubbleColor] = useState(() => {
    return localStorage.getItem('chatRoom_myBubbleColor') || '#4a90e2';
  });
  const [otherBubbleColor, setOtherBubbleColor] = useState(() => {
    return localStorage.getItem('chatRoom_otherBubbleColor') || 'rgba(255, 255, 255, 0.08)';
  });
  const [myTextColor, setMyTextColor] = useState(() => {
    return localStorage.getItem('chatRoom_myTextColor') || '#ffffff';
  });
  const [otherTextColor, setOtherTextColor] = useState(() => {
    return localStorage.getItem('chatRoom_otherTextColor') || '#ffffff';
  });
  const [headerBgColor, setHeaderBgColor] = useState(() => {
    return localStorage.getItem('chatRoom_headerBg') || '#2a2a2a';
  });
  const [headerTextColor, setHeaderTextColor] = useState(() => {
    return localStorage.getItem('chatRoom_headerText') || '#ffffff';
  });
  const [inputBgColor, setInputBgColor] = useState(() => {
    return localStorage.getItem('chatRoom_inputBg') || '#2a2a2a';
  });
  const [inputTextColor, setInputTextColor] = useState(() => {
    return localStorage.getItem('chatRoom_inputText') || '#999999';
  });
  const [sendButtonBgColor, setSendButtonBgColor] = useState(() => {
    return localStorage.getItem('chatRoom_sendButtonBg') || '#4a90e2';
  });
  const [sendButtonIconColor, setSendButtonIconColor] = useState(() => {
    return localStorage.getItem('chatRoom_sendButtonIcon') || '#ffffff';
  });
  const [inputFieldBgColor, setInputFieldBgColor] = useState(() => {
    return localStorage.getItem('chatRoom_inputFieldBg') || 'rgba(255, 255, 255, 0.05)';
  });
  const longPressTimerRef = useRef(null); // 길게 누르기 타이머
  const messagesEndRef = useRef(null);
  const unreadMarkerRef = useRef(null); // 안 읽은 메시지 마커 참조
  const messagesContainerRef = useRef(null); // 메시지 컨테이너 참조 (스크롤 위치 보존용)
  const inputRef = useRef(null);
  const imageInputRef = useRef(null); // 프로필 이미지 업로드용

  // 🔐 계정별 localStorage에서 사용자 정보 가져오기
  const currentUserId = getCurrentUserId() || localStorage.getItem('firebaseUserId'); // fallback
  const currentUserName = getCurrentUserData('displayName') || localStorage.getItem('userDisplayName') || '익명';

  // 이모티콘 카테고리별 분류
  const emojiCategories = {
    '😊 표정': [
      '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊',
      '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘',
      '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪',
      '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒',
      '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖',
      '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡',
      '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰',
      '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶',
      '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮',
      '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴',
      '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠'
    ],
    '👋 손동작': [
      '👍', '👎', '👌', '✌️', '🤞', '🤝', '👏', '🙌',
      '👐', '🤲', '🙏', '✍️', '💪', '🦵', '🦶', '👂',
      '🦻', '👃', '👋', '🤚', '🖐️', '✋', '🖖', '👌',
      '🤏', '✌️', '🤘', '🤙', '👈', '👉', '👆', '🖕',
      '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜',
      '👏', '🙌', '👐', '🤝', '🙏'
    ],
    '❤️ 하트': [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
      '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️',
      '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈',
      '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
      '♑', '♒', '♓'
    ],
    '🐶 동물': [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
      '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵',
      '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤',
      '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗',
      '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜',
      '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎'
    ],
    '🍕 음식': [
      '🍕', '🍔', '🍟', '🍿', '🥤', '🍰', '🎂', '🍩',
      '🍪', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛',
      '☕', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺',
      '🍻', '🥂', '🥃', '🍎', '🍏', '🍊', '🍋', '🍌',
      '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍',
      '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒'
    ],
    '⚽ 활동': [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
      '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
      '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊',
      '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿',
      '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '⛹️',
      '🤾', '🏌️', '🏇', '🧘', '🏊', '🤽', '🚣', '🧗'
    ],
    '🚗 여행': [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑',
      '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', '🦽',
      '🦼', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔',
      '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋',
      '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇',
      '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🛰️'
    ],
    '🌸 자연': [
      '🌸', '🌺', '🌻', '🌹', '🌷', '🌲', '🌳', '🌴',
      '🌱', '🌿', '☘️', '🍀', '🎍', '🎋', '🍃', '🍂',
      '🍁', '🍄', '🌾', '💐', '🌵', '🌾', '🌿', '☘️',
      '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖',
      '🌙', '🌚', '🌛', '🌜', '🌝', '🌞', '⭐', '🌟',
      '✨', '⚡', '☄️', '💫', '🔥', '💧', '🌊', '🌈'
    ],
    '✨ 기호': [
      '✅', '❌', '⭐', '💯', '🔥', '💧', '⚡', '🌈',
      '☀️', '⛅', '☁️', '🌧️', '⛈️', '🌩️', '🌨️', '☃️',
      '⛄', '❄️', '🌬️', '💨', '💦', '☔', '☂️', '🌊',
      '🌫️', '🌪️', '🌀', '🌁', '🌆', '🌇', '🌃', '🌌',
      '🌉', '🌄', '🌅', '🎆', '🎇', '🌠', '🎉', '🎊',
      '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀'
    ]
  };

  // 선택된 이모지 카테고리 상태
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState('😊 표정');

  // 🔇 채팅중 수신음 소거 상태 로드
  useEffect(() => {
    if (!chat.id) return;

    // 방별 설정 확인
    const isMuted = getRoomReceiveSoundMuted(chat.id);
    setIsReceiveSoundMuted(isMuted);
    console.log(`${isMuted ? '🔇' : '🔊'} [ChatRoom useEffect] 채팅방 ${chat.id} 수신음 상태 로드: ${isMuted ? '소거됨' : '활성화됨'} - localStorage 값:`, isMuted);
  }, [chat.id]);

  // 대화방 색상 설정 변경 감지
  useEffect(() => {
    const handleStorageChange = () => {
      const bgColor = localStorage.getItem('chatRoom_bgColor') || '#1a1a1a';
      const myColor = localStorage.getItem('chatRoom_myBubbleColor') || '#4a90e2';
      const otherColor = localStorage.getItem('chatRoom_otherBubbleColor') || 'rgba(255, 255, 255, 0.08)';
      const myText = localStorage.getItem('chatRoom_myTextColor') || '#ffffff';
      const otherText = localStorage.getItem('chatRoom_otherTextColor') || '#ffffff';
      const headerBg = localStorage.getItem('chatRoom_headerBg') || '#2a2a2a';
      const headerText = localStorage.getItem('chatRoom_headerText') || '#ffffff';
      const inputBg = localStorage.getItem('chatRoom_inputBg') || '#2a2a2a';
      const inputText = localStorage.getItem('chatRoom_inputText') || '#999999';
      const sendBtnBg = localStorage.getItem('chatRoom_sendButtonBg') || '#4a90e2';
      const sendBtnIcon = localStorage.getItem('chatRoom_sendButtonIcon') || '#ffffff';
      const inputFieldBg = localStorage.getItem('chatRoom_inputFieldBg') || 'rgba(255, 255, 255, 0.05)';

      setRoomBgColor(bgColor);
      setMyBubbleColor(myColor);
      setOtherBubbleColor(otherColor);
      setMyTextColor(myText);
      setOtherTextColor(otherText);
      setHeaderBgColor(headerBg);
      setHeaderTextColor(headerText);
      setInputBgColor(inputBg);
      setInputTextColor(inputText);
      setSendButtonBgColor(sendBtnBg);
      setSendButtonIconColor(sendBtnIcon);
      setInputFieldBgColor(inputFieldBg);
    };

    // storage 이벤트 리스너 등록 (다른 탭에서의 변경 감지)
    window.addEventListener('storage', handleStorageChange);
    // 같은 탭에서의 변경 감지를 위한 커스텀 이벤트 리스너
    window.addEventListener('chatRoomColorChange', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('chatRoomColorChange', handleStorageChange);
    };
  }, []);

  // 매크로 버튼 표시 설정 변경 감지
  useEffect(() => {
    const handleMacroButtonChange = () => {
      const saved = localStorage.getItem('chatRoom_showMacroButton');
      setShowMacroButton(saved !== 'false');
    };

    window.addEventListener('chatRoomMacroButtonChange', handleMacroButtonChange);
    window.addEventListener('storage', handleMacroButtonChange);

    return () => {
      window.removeEventListener('chatRoomMacroButtonChange', handleMacroButtonChange);
      window.removeEventListener('storage', handleMacroButtonChange);
    };
  }, []);

  // ⚡ 권한 정보 실시간 구독 (그룹 채팅만) - 최적화: 2개 리스너 통합
  useEffect(() => {
    if (!chat.id || chat.type !== 'group') return;

    let isMounted = true;
    const unsubscribers = [];

    // 권한 문서 구독
    const permRef = doc(db, 'chatRooms', chat.id, 'sharedDocument', 'permissions');
    const unsubscribePerm = onSnapshot(permRef, (permDoc) => {
      if (!isMounted) return;
      const permData = permDoc.data();
      setPermissions(prev => ({
        ...prev,
        editors: permData?.editors || []
      }));
    });
    unsubscribers.push(unsubscribePerm);

    // 문서 정보 구독
    const docRef = doc(db, 'chatRooms', chat.id, 'sharedDocument', 'currentDoc');
    const unsubscribeDoc = onSnapshot(docRef, (docSnapshot) => {
      if (!isMounted) return;
      const docData = docSnapshot.data();
      if (docData?.lastEditedBy) {
        setPermissions(prev => ({
          ...prev,
          manager: docData.lastEditedBy
        }));
      }
      // 문서 내용이 실제로 있는지 확인 (공유 문서 표시용)
      const hasContent = !!(docData?.content && docData.content.trim().length > 0);
      setHasSharedDocument(hasContent);
    });
    unsubscribers.push(unsubscribeDoc);

    return () => {
      isMounted = false;
      unsubscribers.forEach(unsub => unsub());
    };
  }, [chat.id, chat.type]);

  // 📄 DM용 공유 문서 상태 구독
  useEffect(() => {
    if (!chat.id || chat.type === 'group') return; // DM만 (그룹은 위에서 처리)

    let isMounted = true;
    const docRef = doc(db, 'chatRooms', chat.id, 'sharedDocument', 'currentDoc');
    const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
      if (!isMounted) return;
      const docData = docSnapshot.data();
      const hasContent = !!(docData?.content && docData.content.trim().length > 0);
      setHasSharedDocument(hasContent);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [chat.id, chat.type]);

  // 🚨 그룹 삭제 감지 및 메시지 구독 (실시간)
  // ref로 최신 값 유지 (의존성 배열에서 제외하여 리스너 재생성 방지)
  const messagesRef = useRef(messages);
  const membersInfoRef = useRef(chat.membersInfo);
  const groupDeletionInfoRef = useRef(groupDeletionInfo);
  const onCloseRef = useRef(onClose);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { membersInfoRef.current = chat.membersInfo; }, [chat.membersInfo]);
  useEffect(() => { groupDeletionInfoRef.current = groupDeletionInfo; }, [groupDeletionInfo]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!chat.id || chat.type !== 'group') return;

    let isMounted = true;
    const groupRef = doc(db, 'groupChats', chat.id);
    let countdownInterval = null;

    const unsubscribe = onSnapshot(
      groupRef,
      (docSnapshot) => {
        if (!isMounted) return;

        // 그룹이 삭제된 경우
        if (!docSnapshot.exists()) {
          // 이미 카운트다운 중이면 무시 (중복 방지)
          if (groupDeletionInfoRef.current) return;

          // 마지막 메시지에서 삭제자 이름 확인
          const lastMessage = messagesRef.current[messagesRef.current.length - 1];
          let deleterName = '방장';

          if (lastMessage?.metadata?.action === 'group_deleted') {
            const deleterId = lastMessage.metadata.actorId;
            deleterName = membersInfoRef.current?.[deleterId]?.displayName || '방장';
          }

          // 10초 카운트다운 시작
          setGroupDeletionInfo({ deleterName, countdown: 10 });

          let remaining = 10;
          countdownInterval = setInterval(() => {
            remaining--;
            if (remaining > 0 && isMounted) {
              setGroupDeletionInfo({ deleterName, countdown: remaining });
            } else {
              clearInterval(countdownInterval);
              if (isMounted) {
                onCloseRef.current?.();
              }
            }
          }, 1000);
        }
      },
      (error) => {
        console.error('그룹 문서 구독 에러:', error);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [chat.id, chat.type]); // 핵심 식별자만 의존성으로 유지

  // 그룹 채팅에서 내 멤버 상태 확인 (초기값)
  useEffect(() => {
    if (!chat.id || chat.type !== 'group' || !currentUserId) return;

    // chat에서 초기 상태 확인
    const myStatus = chat.membersInfo?.[currentUserId]?.status;
    setMyMemberStatus(myStatus || 'active');
  }, [chat.id, chat.type, chat.membersInfo, currentUserId]);

  // DM 방에서 차단 상태 확인 (일방향 - 조용히 차단)
  // 카카오톡 방식: 내가 차단한 경우만 확인, 상대가 나를 차단해도 메시지 전송은 가능
  useEffect(() => {
    if (chat.type === 'group') {
      setCheckingBlockStatus(false);
      return;
    }

    const checkBlockStatus = async () => {
      try {
        setCheckingBlockStatus(true);
        const otherUserId = chat.participants?.find(id => id !== currentUserId);
        if (!otherUserId) {
          setIsOtherUserBlocked(false);
          return;
        }

        // 일방향 차단 확인: 내가 상대를 차단한 경우만 확인
        // 상대가 나를 차단해도 메시지 전송은 가능 (조용히 차단)
        const iBlockedThem = await isUserBlocked(currentUserId, otherUserId);

        setIsOtherUserBlocked(iBlockedThem);
      } catch (error) {
        console.error('차단 상태 확인 오류:', error);
        setIsOtherUserBlocked(false);
      } finally {
        setCheckingBlockStatus(false);
      }
    };

    checkBlockStatus();
  }, [chat.type, chat.participants, currentUserId]);

  // 친구 목록 불러오기 (멤버 초대용)
  useEffect(() => {
    if (!showInviteMembersModal || !currentUserId) return;

    const loadFriends = async () => {
      try {
        const friendList = await getMyFriends(currentUserId);
        setFriends(friendList);
      } catch (error) {
        console.error('친구 목록 불러오기 실패:', error);
        showToast?.('친구 목록을 불러올 수 없습니다');
      }
    };

    loadFriends();
  }, [showInviteMembersModal, currentUserId, showToast]);

  // 1:1 채팅방 데이터 실시간 구독 (lastAccessTime 업데이트 감지)
  const [chatRoomData, setChatRoomData] = useState(chat);
  const [userProfilePictures, setUserProfilePictures] = useState({}); // userId -> profilePictureUrl 매핑
  const [userAvatarSettings, setUserAvatarSettings] = useState({}); // userId -> {selectedAvatarId, avatarBgColor} 매핑
  const [userNicknames, setUserNicknames] = useState({}); // userId -> 닉네임 매핑
  const [userDisplayNames, setUserDisplayNames] = useState({}); // userId -> 구글 displayName 매핑 (fallback용)

  // 상대방 정보 가져오기 (useMemo로 닉네임 로드 후 재계산)
  const otherUser = useMemo(() => {
    if (chat.type === 'group') {
      // 실제 활성화된 멤버 수 계산 (pending, rejected 제외)
      const activeMemberCount = chat.membersInfo
        ? Object.values(chat.membersInfo).filter(memberInfo => memberInfo.status === 'active').length
        : 0;

      return {
        name: chat.groupName || '이름 없는 그룹',
        isGroup: true,
        memberCount: activeMemberCount
      };
    }

    const otherUserId = chat.participants?.find(id => id !== currentUserId);

    // 나와의 대화인 경우 (otherUserId가 없음)
    if (!otherUserId) {
      const myInfo = chat.participantsInfo?.[currentUserId];
      // 1순위: 앱 닉네임, 2순위: 구글 displayName, 3순위: '나'
      const myDisplayName = userNicknames[currentUserId] || userDisplayNames[currentUserId] || '나';
      return {
        name: `${myDisplayName} (나)`,
        userId: currentUserId,
        isGroup: false,
        isSelfChat: true
      };
    }

    const otherUserInfo = chat.participantsInfo?.[otherUserId];
    // 1순위: 앱 닉네임, 2순위: 구글 displayName
    const nickname = userNicknames[otherUserId];
    const googleDisplayName = userDisplayNames[otherUserId];
    const displayName = nickname || googleDisplayName;
    return {
      name: displayName,
      userId: otherUserId,
      isGroup: false,
      isSelfChat: false
    };
  }, [chat.type, chat.groupName, chat.membersInfo, chat.participants, chat.participantsInfo, currentUserId, userNicknames, userDisplayNames]);

  useEffect(() => {
    if (!chat.id) {
      setChatRoomData(chat);
      return;
    }

    // 채팅방 데이터 실시간 구독 (그룹/1:1 모두)
    let unsubscribe;

    if (chat.type === 'group') {
      // 그룹 채팅방 실시간 구독
      unsubscribe = subscribeToGroupRoom(chat.id, (updatedChat) => {
        setChatRoomData(updatedChat);

        // 강퇴 또는 초대 거부 감지 시 방 강제 퇴장
        const isKicked = updatedChat?.kickedUsers?.includes(currentUserId);
        const myMemberInfo = updatedChat?.membersInfo?.[currentUserId];
        const isRejected = myMemberInfo?.status === 'rejected';

        if (isKicked) {
          showToast?.('방에서 강퇴되었습니다');
          onClose?.();
          return;
        }

        if (isRejected) {
          onClose?.();
          return;
        }

        // mutedUsers 업데이트 (내 membersInfo에서 가져옴)
        if (myMemberInfo?.mutedUsers) {
          setMutedUsers(myMemberInfo.mutedUsers);
        } else {
          setMutedUsers([]);
        }
      });
    } else {
      // 1:1 채팅방 데이터 실시간 구독
      unsubscribe = subscribeToDMRoom(chat.id, (updatedChat) => {
        setChatRoomData(updatedChat);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chat.id, chat.type]);

  // 전체 앱 차단 사용자 목록 가져오기
  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        const blockedUsers = await getBlockedUsers(currentUserId);
        setBlockedUserIds(blockedUsers.map(user => user.userId));
      } catch (error) {
        console.error('차단된 사용자 목록 조회 실패:', error);
        setBlockedUserIds([]);
      }
    };

    fetchBlockedUsers();
  }, [currentUserId]);

  // 매크로 목록 로드
  useEffect(() => {
    const loadMacros = () => {
      try {
        const savedMacros = JSON.parse(localStorage.getItem('macroTexts') || '[]');
        // 빈 문자열 제외하고 내용이 있는 매크로만 필터링
        setMacros(savedMacros.filter(m => m && m.trim()).slice(0, 7));
      } catch (error) {
        console.error('매크로 로드 실패:', error);
        setMacros([]);
      }
    };

    loadMacros();

    // localStorage 변경 감지 (다른 탭에서 매크로 수정 시)
    const handleStorageChange = (e) => {
      if (e.key === 'macroTexts') {
        loadMacros();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 🔥 메시지 개수 추적 (useRef로 변경하여 리렌더링 시에도 값 유지)
  const prevMessageCountRef = useRef(0);
  const lastMessageIdRef = useRef(null); // 마지막 메시지 ID 추적 (페이지네이션으로 개수가 고정되어도 새 메시지 감지)
  const loadingOlderMessagesRef = useRef(false); // 이전 메시지 로드 중 플래그
  const olderMessagesDividerRef = useRef(null); // 이전 대화 보기 구분선 참조
  const shouldScrollToDividerRef = useRef(false); // 메시지 로드 후 구분선으로 스크롤해야 하는지 플래그

  // 메시지 실시간 구독
  useEffect(() => {
    if (!chat.id) return;

    let isMounted = true;
    let unsubscribe = null;

    // 약간의 지연을 두고 구독 시작 (Firestore 내부 상태 안정화)
    const timeoutId = setTimeout(() => {
      if (!isMounted) return;

      // 🆕 통합 메시지 구독 (1:1과 그룹 모두 지원) + 페이지네이션
      unsubscribe = subscribeToUnifiedMessages(
        chat.id,
        chat.type,
        currentUserId,
        async (newMessages, metadata) => {
          if (!isMounted) return;

          // 더 많은 메시지 유무 체크
          if (metadata?.hasMore !== undefined) {
            setHasMoreMessages(metadata.hasMore);
            console.log('📊 더 많은 메시지 있음:', metadata.hasMore);
          }

          // 새 메시지 도착 시 페이지가 보이는 경우에만 읽음 처리
          // ⚠️ pending 상태(초대 수락 전)에서는 읽음 처리 안 함
          const myStatus = chat.membersInfo?.[currentUserId]?.status;
          if (prevMessageCountRef.current > 0 && newMessages.length > prevMessageCountRef.current && myStatus !== 'pending') {
            markUnifiedAsRead(chat.id, chat.type, currentUserId, isPageVisible);
          }

        // ⭐ 첫 번째 안 읽은 메시지 인덱스 계산 (최초 입장 시에만)
        // 내가 보낸 메시지는 제외 - 상대가 보낸 메시지 중 내가 안 읽은 것만 마커 표시
        if (prevMessageCountRef.current === 0 && newMessages.length > 0) {
          // chatRoomData에서 내 lastAccessTime 가져오기
          const myLastAccessTime = chatRoomData?.lastAccessTime?.[currentUserId];

          if (myLastAccessTime) {
            // lastAccessTime 이후의 첫 번째 "상대가 보낸" 메시지 찾기
            const lastAccessDate = myLastAccessTime.toDate ? myLastAccessTime.toDate() : new Date(myLastAccessTime);
            const unreadIndex = newMessages.findIndex(msg => {
              // 내가 보낸 메시지는 스킵 (당연히 읽은 것)
              if (msg.senderId === currentUserId) return false;
              const msgDate = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt);
              return msgDate > lastAccessDate;
            });

            // 안 읽은 메시지가 5개 이상일 때만 마커 표시 (카카오톡 방식)
            // 상대가 보낸 안 읽은 메시지 개수 계산
            const unreadFromOthers = newMessages.filter((msg, idx) => {
              if (msg.senderId === currentUserId) return false;
              const msgDate = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt);
              return msgDate > lastAccessDate;
            }).length;

            if (unreadIndex >= 0 && unreadFromOthers >= 5) {
              setFirstUnreadIndex(unreadIndex);
              console.log('📊 상대가 보낸 안 읽은 메시지가 많음 - 마커 표시:', unreadIndex, '/', unreadFromOthers, '개');
            } else {
              setFirstUnreadIndex(-1);
              console.log('📊 상대가 보낸 안 읽은 메시지 적음 - 맨 아래로 스크롤');
            }
          } else {
            // lastAccessTime이 없으면 상대가 보낸 메시지만 안 읽은 것으로 간주
            const messagesFromOthers = newMessages.filter(msg => msg.senderId !== currentUserId);
            if (messagesFromOthers.length >= 5) {
              // 첫 번째 상대 메시지 위치 찾기
              const firstOtherIndex = newMessages.findIndex(msg => msg.senderId !== currentUserId);
              setFirstUnreadIndex(firstOtherIndex);
              console.log('📊 lastAccessTime 없음 - 상대 메시지부터 안 읽음:', firstOtherIndex);
            } else {
              setFirstUnreadIndex(-1);
              console.log('📊 상대 메시지 적음 - 맨 아래로 스크롤');
            }
          }
        }

        // 초기 로드된 메시지 개수 저장 (이전 대화 경계 표시용)
        if (prevMessageCountRef.current === 0 && newMessages.length > 0) {
          setInitialMessageCount(newMessages.length);
          console.log('📊 초기 메시지 개수 저장:', newMessages.length);
        }

        // 🆕 조용히 차단: DM 방에서 내가 차단한 사용자의 메시지 필터링
        // 상대가 메시지를 보내도 나에게는 안 보임 (상대는 정상 전송된 것처럼 보임)
        let filteredMessages = newMessages;
        if (chat.type !== 'group') {
          const otherUserId = chat.participants?.find(id => id !== currentUserId);
          if (otherUserId) {
            const iBlockedThem = await isUserBlocked(currentUserId, otherUserId);
            if (iBlockedThem) {
              // 내가 차단한 상대의 메시지 필터링 (내가 보낸 메시지만 표시)
              filteredMessages = newMessages.filter(msg => msg.senderId === currentUserId);
              console.log('🚫 조용히 차단: 차단한 사용자의 메시지 필터링됨');
            }
          }
        } else if (chat.type === 'group') {
          // 🆕 단체방 차단 처리
          // ⚠️ 중요: 차단은 일방향이지만, 메시지 필터링은 양방향으로 동작
          // - A가 B를 차단하면: A는 B의 메시지를 "차단한 사용자의 메시지입니다"로 표시
          // - 동시에 B는 A의 메시지를 전혀 볼 수 없음 (차단 사실을 모름)
          //
          // 구현 방법:
          // - 각 사용자는 자신이 차단한 사람 목록만 확인 (다른 사람의 차단 목록은 읽지 않음)
          // - 내가 차단한 사람의 메시지는 "차단한 사용자의 메시지입니다"로 표시 (렌더링 시 처리)
          // - 내가 차단한 사람에게는 내 메시지가 보이지 않음
          //   => 하지만 클라이언트에서는 상대방의 화면을 제어할 수 없으므로,
          //   => 차단된 사람도 자신의 클라이언트에서 "내가 차단한 사람" 목록을 확인해야 함
          //   => 즉, B의 클라이언트에서도 B가 차단한 사람 목록을 확인하고 필터링

          // 실제로는 이 방법으로는 일방향 차단을 완벽하게 구현할 수 없습니다.
          // 왜냐하면 B가 A의 메시지를 숨기려면, B가 "A가 나를 차단했는지" 확인해야 하는데,
          // 이는 A의 차단 목록을 읽어야 하므로 차단 사실이 노출되기 때문입니다.

          // 따라서 여기서는 차단을 확인하지 않고, 렌더링 시에만 "차단한 사용자의 메시지입니다"로 표시합니다.
          // 차단된 사람에게 내 메시지를 숨기는 것은 메시지 전송 시 처리하거나,
          // 서버 측(Cloud Functions)에서 처리해야 합니다.
        }

        // 🔊 새 메시지 감지 및 효과음 재생
        // ✅ 메시지 ID 기반 감지 (페이지네이션으로 개수가 고정되어도 새 메시지 감지 가능)
        const latestMessage = newMessages.length > 0 ? newMessages[newMessages.length - 1] : null;
        const latestMessageId = latestMessage?.id;
        // 초기 로드 판단: 메시지 카운트가 0이거나 lastMessageId가 null인 경우 (방금 입장한 경우)
        const isInitialLoad = prevMessageCountRef.current === 0 || lastMessageIdRef.current === null;
        const isNewMessage = !isInitialLoad && latestMessageId && latestMessageId !== lastMessageIdRef.current;

        console.log('🔍 [ChatRoom] 메시지 수신 감지:', {
          isInitialLoad,
          isNewMessage,
          prevCount: prevMessageCountRef.current,
          newCount: newMessages.length,
          lastMessageId: lastMessageIdRef.current,
          latestMessageId,
          currentUserId,
          latestSenderId: latestMessage?.senderId
        });

        // 새 메시지가 도착했고, 내가 보낸 메시지가 아니면 효과음 재생
        if (isNewMessage && latestMessage?.senderId !== currentUserId) {
          // ⚠️ React state가 아닌 localStorage에서 직접 최신 값을 가져와서 체크 (상태 업데이트 타이밍 이슈 해결)
          const currentMuteState = getRoomReceiveSoundMuted(chat.id);

          console.log('🔍 [ChatRoom] 새 메시지 감지 (상대방):', {
            latestMessageId: latestMessage?.id,
            latestSenderId: latestMessage?.senderId,
            chatType: chat.type,
            currentMuteState,
            chatId: chat.id
          });

          // 방별 소거가 활성화되어 있으면 재생 안 함 (localStorage 직접 체크)
          if (currentMuteState) {
            console.log('🔇 [ChatRoom] 방별 수신음 소거됨 - 재생 안 함 (localStorage 확인)');
          } else {
            console.log('💬 [ChatRoom] 채팅중 수신음 재생!');
            playChatMessageSound(null); // 전체 설정 음량 사용 (playChatMessageSound 내부에서 전역 설정 체크)
          }
        } else if (isNewMessage && latestMessage?.senderId === currentUserId) {
          console.log('🚫 [ChatRoom] 내가 보낸 메시지 - 소리 재생 안 함');
        }

        // ✅ 메시지 개수 및 마지막 메시지 ID 업데이트
        if (newMessages.length !== prevMessageCountRef.current) {
          console.log('📊 [ChatRoom] 메시지 카운트 업데이트:', prevMessageCountRef.current, '->', newMessages.length);
          prevMessageCountRef.current = newMessages.length;
        }
        if (latestMessageId !== lastMessageIdRef.current) {
          console.log('📊 [ChatRoom] 마지막 메시지 ID 업데이트:', lastMessageIdRef.current, '->', latestMessageId);
          lastMessageIdRef.current = latestMessageId;
        }

        setMessages(filteredMessages);

        // 🆕 메시지 발신자들의 닉네임 동적 로드
        const senderIds = new Set(newMessages.map(msg => msg.senderId).filter(Boolean));
        for (const senderId of senderIds) {
          // 이미 로드된 사용자는 스킵
          if (userNicknames[senderId] !== undefined || userDisplayNames[senderId] !== undefined) continue;

          try {
            // 1순위: nicknames 컬렉션에서 앱 닉네임
            const nickname = await getUserNickname(senderId);
            setUserNicknames(prev => ({ ...prev, [senderId]: nickname }));

            // 2순위(fallback): settings에서 구글 displayName
            const settingsRef = doc(db, 'mindflowUsers', senderId, 'userData', 'settings');
            const settingsSnap = await getDoc(settingsRef);
            if (settingsSnap.exists()) {
              setUserDisplayNames(prev => ({ ...prev, [senderId]: settingsSnap.data().displayName || null }));
            }
          } catch (error) {
            console.error(`메시지 발신자 닉네임 로드 실패 (${senderId}):`, error);
          }
        }

        // ⭐ 스크롤 위치 결정: 안 읽은 메시지가 많으면 마커로, 적으면 맨 아래로
        // requestAnimationFrame 2번으로 DOM 렌더링 완료 후 스크롤
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (isMounted) {
              const isInitialLoad = prevMessageCountRef.current === newMessages.length;
              const container = messagesContainerRef.current;

              if (!container) return;

              // 이전 메시지 로드 중이면 스크롤 위치 유지 (자동 스크롤 안 함)
              if (loadingOlderMessagesRef.current) {
                console.log('⏸️ 이전 메시지 로드 중 - 스크롤 위치 유지');
                return;
              }

              // 최초 입장 시 안 읽은 메시지가 5개 이상이면 unreadMarkerRef로 스크롤
              if (isInitialLoad && firstUnreadIndex >= 0 && unreadMarkerRef.current) {
                // 마커 위치로 부드럽게 스크롤
                const markerTop = unreadMarkerRef.current.offsetTop;
                container.scrollTo({
                  top: markerTop - 100,
                  behavior: 'smooth'
                });
              } else if (isInitialLoad) {
                // 초기 로드 - 즉시 맨 아래로
                container.scrollTop = container.scrollHeight;
              } else {
                // 새 메시지 도착 시 - 즉시 맨 아래로
                container.scrollTop = container.scrollHeight;
              }
            }
          });
        });
        },
        messageLimit // 메시지 로드 제한
      );

      // 🆕 읽음 표시 (통합 함수 사용 - 페이지 가시성 확인)
      // ⚠️ pending 상태(초대 수락 전)에서는 읽음 처리 안 함
      const myStatus = chat.membersInfo?.[currentUserId]?.status;
      if (myStatus !== 'pending') {
        markUnifiedAsRead(chat.id, chat.type, currentUserId, isPageVisible);
        markAllUnifiedMessagesAsRead(chat.id, chat.type, currentUserId, isPageVisible);
      }
    }, 50);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);

      if (unsubscribe && typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch (e) {
          console.error('구독 해제 중 오류:', e);
        }
      }
    };
  }, [chat.id, chat.type, currentUserId, messageLimit]); // 🔥 불필요한 의존성 제거 (userNicknames, userDisplayNames, chatRoomData 제거 - Firestore 중복 조회 방지)

  // 이전 메시지 로드 후 구분선으로 스크롤 (메시지 업데이트 감지)
  useEffect(() => {
    if (!shouldScrollToDividerRef.current) return;
    if (!loadingOlderMessagesRef.current) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    // 이전 메시지 로드 버튼을 눌렀을 때만 구분선으로 스크롤
    if (!shouldScrollToDividerRef.current) return;

    // 메시지가 실제로 업데이트되었는지 확인 (메시지 개수 변경 감지)
    const scrollToTopDivider = () => {
      // 이미지 로드 등을 기다리기 위해 약간의 지연 추가
      setTimeout(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const dividers = container.querySelectorAll('[data-older-messages-divider]');

            if (dividers.length > 0) {
              // 가장 첫 번째(최상단) 구분선으로 스크롤
              const topDivider = dividers[0];
              const containerRect = container.getBoundingClientRect();
              const dividerRect = topDivider.getBoundingClientRect();
              const relativeTop = dividerRect.top - containerRect.top;

              const targetScrollTop = container.scrollTop + relativeTop - 25;
              container.scrollTop = targetScrollTop;

              console.log('📍 [useEffect] 최상단 "이전 대화 보기" 구분선으로 스크롤:', targetScrollTop, '| 총', dividers.length, '개 구분선');

              // 플래그 초기화
              shouldScrollToDividerRef.current = false;
              loadingOlderMessagesRef.current = false;
              setLoadingOlderMessages(false);
            }
          });
        });
      }, 50); // 50ms 지연
    };

    scrollToTopDivider();
  }, [messages.length]); // 메시지 개수 변경 시 실행

  // 🔥 참여자 ID 목록을 안정적인 문자열로 메모이제이션 (프로필 로드용)
  const profileIdsKey = useMemo(() => {
    const userIds = new Set();

    // 본인 ID 추가
    if (currentUserId) {
      userIds.add(currentUserId);
    }

    // 1:1 채팅인 경우
    if (chat.type !== 'group') {
      chat.participants?.forEach(userId => userIds.add(userId));
    } else {
      // 그룹 채팅인 경우
      Object.keys(chat.membersInfo || {}).forEach(userId => {
        userIds.add(userId);
      });
    }

    return Array.from(userIds).sort().join(',');
  }, [chat.type, chat.participants, chat.membersInfo, currentUserId]);

  // 채팅방 참여자 프로필 사진 로드 (참여자가 실제로 변경될 때만 실행)
  useEffect(() => {
    const userIds = profileIdsKey ? new Set(profileIdsKey.split(',')) : new Set();

    if (userIds.size === 0) return;

    // 각 참여자의 프로필 설정 로드
    const loadProfiles = async () => {
      const { getProfileImageUrl } = await import('../../utils/storageService');

      console.log('🔍 [ChatRoom] 프로필 로드 시작:', { userIds: Array.from(userIds), currentUserId });

      for (const userId of userIds) {
        try {
          const settingsRef = doc(db, 'users', userId, 'settings', 'profile');
          const docSnap = await getDoc(settingsRef);

          console.log(`📄 [ChatRoom] ${userId} 프로필 문서:`, {
            exists: docSnap.exists(),
            data: docSnap.data()
          });

          if (docSnap.exists()) {
            const settings = docSnap.data();
            const imageType = settings.profileImageType || 'avatar';
            const version = settings.profileImageVersion || null;
            const selectedAvatarId = settings.selectedAvatarId || null;
            const avatarBgColor = settings.avatarBgColor || 'none';
            const avatarCustomColor = settings.avatarCustomColor || '#FF1493';

            // 'photo' 모드면 버전 기반 URL 사용
            if (imageType === 'photo') {
              const imageUrl = getProfileImageUrl(userId, version);
              console.log(`✅ [ChatRoom] 프로필 URL 생성:`, { userId, imageUrl });
              setUserProfilePictures(prev => ({
                ...prev,
                [userId]: imageUrl
              }));
              // 아바타 설정 제거
              setUserAvatarSettings(prev => {
                const newState = { ...prev };
                delete newState[userId];
                return newState;
              });
            } else {
              // 아바타 모드면 아바타 설정 저장, 프로필 사진 제거
              console.log(`⚠️ [ChatRoom] 아바타 모드:`, { userId, selectedAvatarId, avatarBgColor, avatarCustomColor });
              setUserProfilePictures(prev => {
                const newState = { ...prev };
                delete newState[userId];
                return newState;
              });
              if (selectedAvatarId) {
                setUserAvatarSettings(prev => ({
                  ...prev,
                  [userId]: { selectedAvatarId, avatarBgColor, avatarCustomColor }
                }));
              }
            }
          }
        } catch (error) {
          console.error(`프로필 로드 실패 (${userId}):`, error);
        }
      }
    };

    loadProfiles();
  }, [profileIdsKey]);

  // 🔥 참여자 ID 목록을 안정적인 문자열로 메모이제이션 (불필요한 재실행 방지)
  const participantIdsKey = useMemo(() => {
    const userIds = new Set();

    if (chat.type !== 'group') {
      chat.participants?.forEach(userId => userIds.add(userId));
    } else {
      Object.keys(chat.membersInfo || {}).forEach(userId => {
        userIds.add(userId);
      });
    }

    // 정렬된 ID 배열을 문자열로 변환 (참여자가 실제로 바뀔 때만 변경됨)
    return Array.from(userIds).sort().join(',');
  }, [chat.type, chat.participants, chat.membersInfo]);

  // 🆕 채팅방 참여자만 닉네임 실시간 구독 (효율적) - 초기 로드 후 실시간 구독
  useEffect(() => {
    // 닉네임 로딩 상태 초기화
    setNicknamesLoaded(false);

    // 참여자 ID를 키에서 다시 파싱
    const userIds = participantIdsKey ? new Set(participantIdsKey.split(',')) : new Set();

    if (userIds.size === 0) {
      setNicknamesLoaded(true); // 참여자가 없으면 로딩 완료 처리
      return;
    }

    const unsubscribers = [];
    let isMounted = true;

    // 🔥 초기 닉네임 로드 (nicknames 컬렉션에서 앱 닉네임, settings에서 구글 displayName)
    const loadInitialNicknames = async () => {
      console.log('📥 초기 닉네임 로드 시작:', Array.from(userIds));

      const nicknamePromises = Array.from(userIds).map(async (userId) => {
        try {
          // 1순위: nicknames 컬렉션에서 앱 닉네임 가져오기
          const nickname = await getUserNickname(userId);

          // 2순위(fallback): mindflowUsers/.../settings에서 구글 displayName 가져오기
          let displayName = null;
          try {
            const settingsRef = doc(db, 'mindflowUsers', userId, 'userData', 'settings');
            const settingsSnap = await getDoc(settingsRef);
            if (settingsSnap.exists()) {
              displayName = settingsSnap.data().displayName || null;
            }
          } catch (settingsError) {
            console.error(`settings displayName 로드 실패 (${userId}):`, settingsError);
          }

          console.log(`✅ 초기 닉네임: ${userId} → ${nickname} (구글: ${displayName})`);
          return { userId, nickname, displayName };
        } catch (error) {
          console.error(`❌ 초기 닉네임 로드 오류 (${userId}):`, error);
          return { userId, nickname: null, displayName: null };
        }
      });

      const results = await Promise.all(nicknamePromises);

      if (isMounted) {
        const nicknamesMap = {};
        const displayNamesMap = {};
        results.forEach(({ userId, nickname, displayName }) => {
          nicknamesMap[userId] = nickname;
          displayNamesMap[userId] = displayName;
        });
        setUserNicknames(nicknamesMap);
        setUserDisplayNames(displayNamesMap);
        setNicknamesLoaded(true); // 닉네임 로드 완료
        console.log('✅ 초기 닉네임 로드 완료:', nicknamesMap);
        console.log('✅ 구글 displayName 로드 완료:', displayNamesMap);
      }
    };

    // 초기 로드 후 실시간 리스너 시작
    loadInitialNicknames().then(() => {
      if (!isMounted) return;

      console.log('🔥 닉네임 실시간 리스너 시작:', Array.from(userIds));

      // 각 참여자의 닉네임 실시간 구독 (nicknames 컬렉션)
      userIds.forEach(userId => {
        const nicknameRef = doc(db, 'nicknames', userId);

        const unsubscribe = onSnapshot(nicknameRef, async (docSnap) => {
          let nickname = null;
          if (docSnap.exists()) {
            nickname = docSnap.data().nickname || null;
          }
          console.log(`🔄 닉네임 실시간 업데이트: ${userId} → ${nickname}`);
          setUserNicknames(prev => ({
            ...prev,
            [userId]: nickname
          }));
        }, (error) => {
          console.error(`❌ nicknames 리스너 오류 (${userId}):`, error);
        });

        unsubscribers.push(unsubscribe);

        // displayName은 자주 변경되지 않으므로 settings도 구독 (구글 displayName fallback용)
        const settingsRef = doc(db, 'mindflowUsers', userId, 'userData', 'settings');
        const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
          if (docSnap.exists()) {
            const displayName = docSnap.data().displayName || null;
            setUserDisplayNames(prev => ({
              ...prev,
              [userId]: displayName
            }));
          }
        }, (error) => {
          console.error(`❌ settings 리스너 오류 (${userId}):`, error);
        });

        unsubscribers.push(unsubscribeSettings);
      });
    });

    return () => {
      isMounted = false;
      setNicknamesLoaded(false); // 컴포넌트 언마운트 시 로딩 상태 초기화
      console.log('🧹 닉네임 실시간 리스너 해제:', unsubscribers.length, '개');
      unsubscribers.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, [participantIdsKey]);

  // 🆕 chat.isPublic이 변경되면 selectedRoomType 자동 업데이트
  useEffect(() => {
    if (chat.type === 'group') {
      setSelectedRoomType(chat.isPublic);
    }
  }, [chat.isPublic, chat.type]);

  // 초기 닉네임 로딩은 실시간 리스너가 처리 (위의 useEffect 참조)

  // 방장 여부 확인 (그룹 채팅인 경우 creatorId가 방장, DM은 모두 방장)
  // ⚠️ chatRoomData 사용 (실시간 업데이트된 방장 정보 필요 - 방장 위임 시)
  const isRoomOwner = chatRoomData?.type === 'group'
    ? (chatRoomData.creatorId === currentUserId || chatRoomData.createdBy === currentUserId) // creatorId와 createdBy 둘 다 체크
    : true; // DM은 모두 편집 가능

  // 사용자 역할 확인 함수 (그룹 채팅방 역할만 표시)
  const getUserRole = (userId) => {
    // 1:1 채팅은 역할 표시 안 함
    if (chat.type !== 'group') return null;

    // 그룹 채팅방 방장 체크
    if (chatRoomData?.creatorId === userId) {
      return { type: 'owner', icon: <UserCog size={10} color="#fbbf24" />, label: '방장' };
    }

    // 그룹 채팅방 부방장 체크
    if (chatRoomData?.subManagers?.[userId]) {
      return { type: 'subManager', icon: <Shield size={10} color="#60a5fa" />, label: '부방장' };
    }

    // 일반 멤버는 배지 없음
    return null;
  };

  // 초대 수락 핸들러
  const handleAcceptInvitation = async (forceAccept = false) => {
    setProcessingInvitation(true);
    try {
      await acceptInvitation(chat.id, currentUserId, forceAccept);
      setMyMemberStatus('active');
      showToast?.('✅ 단체방에 참여했습니다');
    } catch (error) {
      console.error('초대 수락 실패:', error);

      // 차단 사용자가 있는 경우
      if (error.message?.startsWith('BLOCKED_MEMBERS_IN_GROUP:')) {
        const blockedNames = error.message.replace('BLOCKED_MEMBERS_IN_GROUP:', '');
        setShowBlockedJoinConfirm({ show: true, blockedNames });
        setProcessingInvitation(false);
        return;
      }

      showToast?.('❌ 초대 수락에 실패했습니다');
    } finally {
      setProcessingInvitation(false);
    }
  };

  // 초대 거부 핸들러
  const handleRejectInvitation = async () => {
    setProcessingInvitation(true);
    try {
      await rejectInvitation(chat.id, currentUserId);
      setMyMemberStatus('rejected');
      showToast?.('초대를 거부했습니다');
      // 거부 후 채팅방 즉시 닫기
      onClose();
    } catch (error) {
      console.error('초대 거부 실패:', error);
      showToast?.('❌ 초대 거부에 실패했습니다');
    } finally {
      setProcessingInvitation(false);
    }
  };

  // 🆕 Page Visibility API - 페이지 가시성 감지
  useEffect(() => {
    const handleVisibilityChange = async () => {
      const visible = !document.hidden;
      setIsPageVisible(visible);
      console.log(`📱 페이지 가시성 변경: ${visible ? '보임' : '숨김'}`);

      if (visible) {
        // 페이지가 다시 보이면: inRoom = true로 설정 + 읽음 처리
        await enterUnifiedChatRoom(chat.id, chat.type, currentUserId);
        // ⚠️ pending 상태(초대 수락 전)에서는 읽음 처리 안 함
        const myStatus = chat.membersInfo?.[currentUserId]?.status;
        if (myStatus !== 'pending') {
          markUnifiedAsRead(chat.id, chat.type, currentUserId, true);
          markAllUnifiedMessagesAsRead(chat.id, chat.type, currentUserId, true);
        }
      } else {
        // 페이지가 숨겨지면: inRoom = false로 설정
        await exitUnifiedChatRoom(chat.id, chat.type, currentUserId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [chat.id, chat.type, currentUserId]);

  // 🆕 채팅방 입장/퇴장 처리 (통합)
  useEffect(() => {
    // enterUnifiedChatRoom이 완료될 때까지 기다린 후 setCurrentChatRoom 호출
    // 이렇게 하면 inRoom 상태가 Firestore에 반영된 후 메시지 구독이 시작됨
    const enterRoom = async () => {
      await enterUnifiedChatRoom(chat.id, chat.type, currentUserId);
      setCurrentChatRoom(chat.id); // 현재 채팅방 ID 저장 (포그라운드 알림 소리 제어용)

      // 🎵 AudioContext 활성화 (사용자 제스처 후 실행되므로 안전)
      try {
        const { initializeAudioContext } = await import('../../utils/notificationSounds');
        await initializeAudioContext();
        console.log('✅ [ChatRoom] AudioContext 활성화 완료');
      } catch (error) {
        console.warn('⚠️ [ChatRoom] AudioContext 활성화 실패:', error);
      }
    };

    enterRoom();

    return () => {
      exitUnifiedChatRoom(chat.id, chat.type, currentUserId);
      clearCurrentChatRoom(); // 채팅방 나갈 때 ID 제거
    };
  }, [chat.id, chat.type, currentUserId]);

  // ⭐ 이전 메시지 더 불러오기
  const handleLoadMoreMessages = () => {
    if (loadingOlderMessages) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    // 현재 가장 오래된 메시지 ID를 구분선 위치로 저장
    const oldestMessageId = messages.length > 0 ? messages[0].id : null;
    console.log('📊 이전 대화 로드 시작 - 가장 오래된 메시지 ID:', oldestMessageId);

    setLoadingOlderMessages(true);
    loadingOlderMessagesRef.current = true;
    setHasLoadedOlderMessages(true);
    shouldScrollToDividerRef.current = true; // 메시지 업데이트 후 스크롤하도록 플래그 설정

    // 가장 오래된 메시지 ID를 구분선 위치로 추가
    if (oldestMessageId) {
      setDividerMessageIds(prev => {
        console.log('📊 구분선 메시지 ID 추가:', oldestMessageId, '| 기존:', prev);
        return [...prev, oldestMessageId];
      });
    }

    // 30개씩 추가로 불러오기
    setMessageLimit(prev => {
      const newLimit = prev + 30;
      console.log('📊 메시지 로드 한도 증가:', prev, '→', newLimit);
      return newLimit;
    });
  };

  // 메시지 전송 (통합)
  const handleSendMessage = async () => {
    if (!inputText.trim() || sending) return;

    // DM 방에서 차단된 경우 전송 차단
    if (chat.type !== 'group' && isOtherUserBlocked) {
      showToast?.('차단된 사용자와는 메시지를 주고받을 수 없습니다');
      return;
    }

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      // 🆕 통합 메시지 전송
      await sendUnifiedMessage(chat.id, chat.type, currentUserId, textToSend, chatRoomData);

      // 스크롤을 맨 아래로 (즉시 - 깜빡임 방지)
      setTimeout(() => {
        const container = messagesContainerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      // Firestore 차단 규칙에 의한 에러인 경우 특별한 메시지 표시
      if (error.code === 'permission-denied') {
        showToast?.('차단된 사용자와는 메시지를 주고받을 수 없습니다');
      } else {
        showToast?.('메시지 전송에 실패했습니다');
      }
      setInputText(textToSend); // 실패 시 텍스트 복구
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // 이모티콘 선택 핸들러
  const handleEmojiSelect = (emoji) => {
    setInputText(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  // 대화 검색
  const handleSearch = (query) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const results = [];

    messages.forEach((msg, index) => {
      const messageText = msg.text || msg.content || '';
      if (messageText.toLowerCase().includes(lowerQuery)) {
        results.push(index);
      }
    });

    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? 0 : -1);

    // 첫 번째 검색 결과로 스크롤
    if (results.length > 0) {
      scrollToSearchResult(results[0]);
    }
  };

  // 검색 결과로 스크롤
  const scrollToSearchResult = (messageIndex) => {
    const messageElement = document.querySelector(`[data-message-index="${messageIndex}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // 하이라이트 효과
      messageElement.style.backgroundColor = 'rgba(74, 144, 226, 0.2)';
      setTimeout(() => {
        messageElement.style.backgroundColor = '';
      }, 2000);
    }
  };

  // 다음 검색 결과
  const handleNextSearch = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    scrollToSearchResult(searchResults[nextIndex]);
  };

  // 이전 검색 결과
  const handlePrevSearch = () => {
    if (searchResults.length === 0) return;
    const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    setCurrentSearchIndex(prevIndex);
    scrollToSearchResult(searchResults[prevIndex]);
  };

  // 검색창 닫기
  const handleCloseSearch = () => {
    setShowSearchBar(false);
    setSearchQuery('');
    setSearchResults([]);
    setCurrentSearchIndex(0);
  };

  // 문서창 토글 (처음 열 때 빈 문서로 시작)
  const handleToggleDocument = () => {
    if (!showDocument) {
      // 문서창을 여는 경우 - 빈 문서로 시작
      setCurrentDocument({
        title: '',
        content: '',
        originalMemoId: null
      });
    }
    setShowDocument(!showDocument);
  };

  // 공유 폴더에서 문서 불러오기
  const handleLoadFromShared = () => {
    setShowSharedMemoSelector(true);
  };

  // 공유 메모 선택 핸들러
  const handleSelectSharedMemo = (memo) => {
    // 🆕 먼저 null로 리셋한 후 메모 설정 (React가 변경을 확실히 감지하도록)
    // 같은 메모를 여러 번 선택해도 매번 useEffect가 트리거됨
    setSelectedMemoToLoad(null);

    // CollaborativeDocumentEditor에 메모 전달 (확인 로직은 에디터에서 처리)
    setTimeout(() => {
      setSelectedMemoToLoad(memo);
    }, 0);

    setShowSharedMemoSelector(false);

    // 문서창이 닫혀있으면 열기
    if (!showDocument) {
      setShowDocument(true);
    }
  };

  // 문서 업데이트 핸들러
  const handleDocumentUpdated = (updatedDoc) => {
    setCurrentDocument(updatedDoc);
  };

  // Enter 키로 전송 (Shift+Enter는 줄바꿈)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 시간 포맷
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? '오후' : '오전';
    const displayHours = hours % 12 || 12;

    return `${ampm} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
  };

  // 날짜 포맷 (구분선용)
  const formatDate = (timestamp) => {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    // 오늘과 어제를 정확히 비교하기 위해 시간을 00:00:00으로 설정
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const messageDate = new Date(date);
    messageDate.setHours(0, 0, 0, 0);

    if (messageDate.getTime() === today.getTime()) {
      return '오늘';
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return '어제';
    } else {
      return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  // 날짜 구분선을 표시할 메시지 인덱스들을 미리 계산 (메모이제이션)
  const dateSeparatorIndices = useMemo(() => {
    const indices = new Set();
    for (let i = 0; i < messages.length; i++) {
      const currentMsg = messages[i];
      const prevMsg = messages[i - 1];

      if (!prevMsg) {
        indices.add(i); // 첫 번째 메시지는 항상 날짜 표시
        continue;
      }

      const currentDate = currentMsg.createdAt?.toDate?.() || new Date(currentMsg.createdAt);
      const prevDate = prevMsg.createdAt?.toDate?.() || new Date(prevMsg.createdAt);

      if (currentDate.toDateString() !== prevDate.toDateString()) {
        indices.add(i);
      }
    }
    return indices;
  }, [messages]);

  // 아이디로 사용자 검색 핸들러
  const handleSearchUserById = async () => {
    if (!workspaceIdInput.trim()) {
      showToast?.('아이디를 입력해주세요');
      return;
    }

    if (workspaceIdInput.trim().length !== 6) {
      showToast?.('아이디는 6자리입니다');
      return;
    }

    setSearchingUser(true);
    try {
      const wsCode = `WS-${workspaceIdInput.trim().toUpperCase()}`;
      const user = await getUserByWorkspaceCode(wsCode);

      if (!user) {
        showToast?.('사용자를 찾을 수 없습니다');
        setSearchedUser(null);
        return;
      }

      // 자기 자신 체크
      if (user.id === currentUserId) {
        showToast?.('자신을 초대할 수 없습니다');
        setSearchedUser(null);
        return;
      }

      // 이미 그룹 멤버인지 체크
      if (chat.members?.includes(user.id)) {
        showToast?.('이미 그룹 멤버입니다');
        setSearchedUser(null);
        return;
      }

      setSearchedUser(user);
    } catch (error) {
      console.error('사용자 검색 실패:', error);
      showToast?.('사용자 검색에 실패했습니다');
      setSearchedUser(null);
    } finally {
      setSearchingUser(false);
    }
  };

  // 검색된 사용자 초대 핸들러
  const handleInviteSearchedUser = async () => {
    if (!searchedUser) return;

    setLoadingInvite(true);
    try {
      await inviteMembersToGroup(chat.id, currentUserId, [searchedUser.id]);
      showToast?.(`${searchedUser.displayName || '사용자'}님을 초대했습니다`);
      setShowInviteMembersModal(false);
      setWorkspaceIdInput('');
      setSearchedUser(null);
      setInviteTab('friends');
    } catch (error) {
      console.error('멤버 초대 실패:', error);
      showToast?.(error.message || '멤버 초대에 실패했습니다');
    } finally {
      setLoadingInvite(false);
    }
  };

  // 멤버 초대 핸들러 (친구 목록)
  const handleInviteMembers = async () => {
    if (selectedFriendsToInvite.length === 0) {
      showToast?.('최소 1명의 친구를 선택해주세요');
      return;
    }

    // 이미 그룹에 있는 친구 필터링
    const alreadyMembers = selectedFriendsToInvite.filter(friendId =>
      chat.members?.includes(friendId)
    );

    if (alreadyMembers.length > 0) {
      showToast?.('이미 그룹에 있는 친구가 포함되어 있습니다');
      return;
    }

    setLoadingInvite(true);
    try {
      await inviteMembersToGroup(chat.id, currentUserId, selectedFriendsToInvite);
      showToast?.(`${selectedFriendsToInvite.length}명을 초대했습니다`);
      setShowInviteMembersModal(false);
      setSelectedFriendsToInvite([]);
      setSearchQueryInvite('');
    } catch (error) {
      console.error('멤버 초대 실패:', error);
      showToast?.(error.message || '멤버 초대에 실패했습니다');
    } finally {
      setLoadingInvite(false);
    }
  };

  // 부방장 임명 핸들러
  const handleAppointSubManager = async (subManagerId, permissions) => {
    try {
      await appointSubManager(chat.id, currentUserId, subManagerId, permissions);
      const subManagerName = chat.membersInfo?.[subManagerId]?.displayName || '익명';
      showToast?.(`${subManagerName}님을 부방장으로 임명했습니다`);
    } catch (error) {
      console.error('부방장 임명 실패:', error);
      showToast?.(error.message || '부방장 임명에 실패했습니다');
      throw error;
    }
  };

  // 부방장 해임 핸들러
  const handleRemoveSubManager = async (subManagerId) => {
    try {
      await removeSubManager(chat.id, currentUserId, subManagerId);
      const subManagerName = chat.membersInfo?.[subManagerId]?.displayName || '익명';
      showToast?.(`${subManagerName}님의 부방장 권한을 해제했습니다`);
    } catch (error) {
      console.error('부방장 해임 실패:', error);
      showToast?.(error.message || '부방장 해임에 실패했습니다');
      throw error;
    }
  };

  // 메시지 삭제 권한 체크 (방장: 모두, 부방장: manage_messages 권한 + 일반멤버만)
  // ⚠️ chatRoomData 사용 (실시간 업데이트된 subManagers 정보 필요)
  const canDeleteMessage = (messageSenderId) => {
    // 1:1 DM인 경우: 삭제 기능 비활성화
    if (chat?.type === 'dm' || chatRoomData?.type === 'dm') {
      return false;
    }

    // 그룹 채팅인 경우
    // 자신의 메시지는 삭제 가능
    if (messageSenderId === currentUserId) return true;

    // 방장인 경우: 모든 메시지 삭제 가능
    if (isRoomOwner) return true;

    // 부방장인 경우 (실시간 데이터에서 확인)
    const subManagerData = chatRoomData?.subManagers?.[currentUserId];
    if (subManagerData) {
      // manage_messages 권한이 있는지 체크
      if (!subManagerData.permissions?.includes('manage_messages')) {
        return false; // 권한 없음
      }
      // 삭제 대상이 방장이면 불가
      if (messageSenderId === chatRoomData.creatorId) return false;
      // 삭제 대상이 다른 부방장이면 불가
      if (chatRoomData?.subManagers?.[messageSenderId]) return false;
      // 일반 멤버 메시지만 삭제 가능
      return true;
    }

    return false;
  };

  // 강퇴 권한 체크 (방장: 모두(부방장 포함), 부방장: kick_member 권한 + 일반멤버만)
  // ⚠️ chatRoomData 사용 (실시간 업데이트된 subManagers 정보 필요)
  const canKickMember = (targetMemberId) => {
    if (chatRoomData?.type !== 'group') return false; // 그룹 채팅에서만 가능

    // 자기 자신은 강퇴 불가
    if (targetMemberId === currentUserId) return false;

    // 방장인 경우: 부방장 포함 모든 멤버 강퇴 가능
    if (isRoomOwner) {
      // 방장 자신은 제외
      return targetMemberId !== chatRoomData.creatorId;
    }

    // 부방장인 경우 (실시간 데이터에서 확인)
    const subManagerData = chatRoomData?.subManagers?.[currentUserId];
    if (subManagerData) {
      // kick_member 권한이 있는지 체크
      if (!subManagerData.permissions?.includes('kick_member')) {
        return false; // 권한 없음
      }
      // 강퇴 대상이 방장이면 불가
      if (targetMemberId === chatRoomData.creatorId) return false;
      // 강퇴 대상이 다른 부방장이면 불가
      if (chatRoomData?.subManagers?.[targetMemberId]) return false;
      // 일반 멤버만 강퇴 가능
      return true;
    }

    return false;
  };

  // 아바타 터치 정보
  const avatarTouchInfoRef = useRef({ userId: null, userName: null, profilePicture: null });

  // 아바타 탭 - 프로필 모달 (PC용)
  const handleAvatarClick = (userId, userName, profilePicture) => {
    setUserProfileModal({ show: true, userId, userName, profilePicture });
  };

  // 아바타 터치 시작 (모바일용)
  const handleAvatarTouchStart = (e, messageId, senderId, senderName, profilePicture, isDeleted = false) => {
    avatarTouchInfoRef.current = { userId: senderId, userName: senderName, profilePicture };

    // 그룹 채팅에서는 삭제 권한 또는 차단 기능 사용 가능
    // (삭제된 메시지라도 차단 기능은 사용 가능하도록 메뉴 표시)
    // 1:1 채팅에서는 삭제 권한만
    const canShowMenu = chat.type === 'group' ? (canDeleteMessage(senderId) || senderId !== currentUserId) : canDeleteMessage(senderId);

    if (canShowMenu) {
      const target = e.currentTarget || e.target;
      const rect = target?.getBoundingClientRect();
      if (rect) {
        longPressTimerRef.current = setTimeout(() => {
          avatarTouchInfoRef.current = { userId: null, userName: null, profilePicture: null };
          longPressTimerRef.current = null;
          setAvatarContextMenu({
            show: true,
            x: rect.left,
            y: rect.bottom + 8,
            messageId,
            senderId,
            senderName,
            isDeleted
          });
        }, 500);
      }
    }
  };

  // 아바타 터치 종료 (모바일용)
  const handleAvatarTouchEnd = (e) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const { userId, userName, profilePicture } = avatarTouchInfoRef.current;
    if (userId) {
      e.preventDefault();
      setUserProfileModal({ show: true, userId, userName, profilePicture });
    }

    avatarTouchInfoRef.current = { userId: null, userName: null, profilePicture: null };
  };

  // 아바타 터치 취소
  const handleAvatarTouchCancel = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    avatarTouchInfoRef.current = { userId: null, userName: null, profilePicture: null };
  };

  // 컨텍스트 메뉴 닫기
  const closeAvatarContextMenu = () => {
    setAvatarContextMenu({ show: false, x: 0, y: 0, messageId: null, senderId: null, senderName: '', isDeleted: false });
  };

  // 메시지 삭제 처리
  const handleDeleteMessage = async () => {
    if (!avatarContextMenu.messageId) return;

    try {
      const deleterName = userNicknames[currentUserId] || currentUserName || '관리자';
      await deleteMessageByAdmin(chat.id, chat.type, avatarContextMenu.messageId, deleterName);
      closeAvatarContextMenu();
    } catch (error) {
      console.error('메시지 삭제 실패:', error);
      showToast?.('메시지 삭제에 실패했습니다');
    }
  };

  // 이 사용자 메시지 차단 처리
  const handleMuteUser = async () => {
    if (!avatarContextMenu.senderId) return;

    try {
      await muteUserInGroup(chat.id, currentUserId, avatarContextMenu.senderId);
      showToast?.(`${avatarContextMenu.senderName}님의 메시지를 차단했습니다`);
      closeAvatarContextMenu();
    } catch (error) {
      console.error('사용자 메시지 차단 실패:', error);
      showToast?.('메시지 차단에 실패했습니다');
    }
  };

  // 이 사용자 메시지 차단 해제 처리
  const handleUnmuteUser = async () => {
    if (!avatarContextMenu.senderId) return;

    try {
      await unmuteUserInGroup(chat.id, currentUserId, avatarContextMenu.senderId);
      showToast?.(`${avatarContextMenu.senderName}님의 메시지 차단을 해제했습니다`);
      closeAvatarContextMenu();
    } catch (error) {
      console.error('사용자 메시지 차단 해제 실패:', error);
      showToast?.('메시지 차단 해제에 실패했습니다');
    }
  };

  // 프로필 모달에서 1:1 대화 시작
  const handleStartDMFromProfile = async (targetUserId, targetUserName) => {
    // TODO: 1:1 대화방 생성 또는 기존 방으로 이동
    showToast?.(`${targetUserName}님과의 1:1 대화 기능은 준비 중입니다`);
  };

  // 프로필 모달에서 차단하기 (확인 모달 표시)
  const handleBlockFromProfile = (targetUserId, targetUserName) => {
    setBlockConfirmModal({
      show: true,
      userId: targetUserId,
      userName: targetUserName,
      isUnblock: false
    });
  };

  // 프로필 모달에서 차단 해제하기 (확인 모달 표시)
  const handleUnblockFromProfile = (targetUserId, targetUserName) => {
    setBlockConfirmModal({
      show: true,
      userId: targetUserId,
      userName: targetUserName,
      isUnblock: true
    });
  };

  // 차단 확인 모달에서 확인 버튼 클릭
  const handleConfirmBlock = async () => {
    const { userId: targetUserId, userName: targetUserName, isUnblock } = blockConfirmModal;

    try {
      if (isUnblock) {
        // 차단 해제
        await unblockUser(currentUserId, targetUserId);
        showToast?.(`${targetUserName}님을 차단 해제했습니다`);

        // blockedUserIds 업데이트
        setBlockedUserIds(prev => prev.filter(id => id !== targetUserId));
      } else {
        // 차단
        const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));
        const targetUserData = targetUserDoc.exists() ? targetUserDoc.data() : {};

        await blockUser(currentUserId, targetUserId, {
          userName: targetUserName,
          userEmail: targetUserData.email || '',
          userWorkspaceCode: targetUserData.workspaceCode || ''
        });
        showToast?.(`${targetUserName}님을 차단했습니다`);

        // blockedUserIds 업데이트
        setBlockedUserIds(prev => [...prev, targetUserId]);
      }
    } catch (error) {
      console.error('차단 처리 실패:', error);
      showToast?.(isUnblock ? '차단 해제에 실패했습니다' : '차단에 실패했습니다');
    } finally {
      setBlockConfirmModal({ show: false, userId: null, userName: '', isUnblock: false });
    }
  };

  // 단체방 상단 프로필 이미지 변경 핸들러
  const handleHeaderAvatarClick = () => {
    // 단체방이고 방장인 경우에만 이미지 변경 가능
    if (chat.type === 'group' && isRoomOwner) {
      imageInputRef.current?.click();
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast?.('이미지 크기는 5MB 이하여야 합니다');
      return;
    }

    // 이미지 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      showToast?.('이미지 파일만 업로드할 수 있습니다');
      return;
    }

    try {
      // R2에 이미지 업로드 (Base64가 아닌 R2 URL 사용)
      const { uploadImage } = await import('../../utils/storageService');
      showToast?.('이미지 업로드 중...');
      const imageUrl = await uploadImage(file, 'group-profile-images');

      // R2 URL을 Firestore에 저장
      await updateGroupImage(chat.id, currentUserId, imageUrl);
      showToast?.('프로필 이미지가 변경되었습니다');
    } catch (error) {
      console.error('프로필 이미지 업데이트 실패:', error);
      showToast?.(error.message || '프로필 이미지 변경에 실패했습니다');
    }

    // input 초기화
    e.target.value = '';
  };

  // 방 이름 변경 핸들러
  const handleRenameRoom = async () => {
    if (!newRoomName.trim()) {
      showToast?.('방 이름을 입력해주세요');
      return;
    }

    if (newRoomName.trim().length > 12) {
      showToast?.('방 이름은 12자 이내로 입력해주세요');
      return;
    }

    try {
      await updateGroupName(chat.id, currentUserId, newRoomName.trim());
      showToast?.('방 이름이 변경되었습니다');
      setShowRenameRoomModal(false);
      setNewRoomName('');
    } catch (error) {
      console.error('방 이름 변경 실패:', error);
      showToast?.(error.message || '방 이름 변경에 실패했습니다');
    }
  };

  // 방장 위임 핸들러 - 최종 확인 모달 표시
  const handleTransferOwnership = () => {
    if (!selectedMemberToTransfer) {
      showToast?.('위임할 멤버를 선택해주세요');
      return;
    }

    if (selectedMemberToTransfer === currentUserId) {
      showToast?.('자기 자신에게는 위임할 수 없습니다');
      return;
    }

    // 최종 확인 모달 표시
    setShowTransferConfirmModal(true);
  };

  // 방장 위임 최종 확인
  const handleConfirmTransferOwnership = async () => {
    setLoadingTransfer(true);
    try {
      await transferRoomOwnership(chat.id, currentUserId, selectedMemberToTransfer);
      // 최신 닉네임 사용
      const transferredMemberName = userNicknames[selectedMemberToTransfer] || userDisplayNames[selectedMemberToTransfer] || chat.membersInfo?.[selectedMemberToTransfer]?.displayName || '알 수 없음';
      showToast?.(`${transferredMemberName}님에게 방장 권한을 위임했습니다`);
      setShowTransferConfirmModal(false);
      setShowTransferOwnerModal(false);
      setSelectedMemberToTransfer(null);

      // 위임 후 나가기 플래그가 설정되어 있으면 자동으로 나가기
      if (leaveAfterTransfer) {
        setLeaveAfterTransfer(false);
        // 잠깐 대기 후 나가기 (위임 완료 후)
        setTimeout(async () => {
          try {
            const { leaveGroup } = await import('../../services/groupChatService');
            await leaveGroup(chat.id, currentUserId);
            showToast?.('그룹을 나갔습니다');
            onClose(); // 채팅방 닫기
          } catch (error) {
            console.error('그룹 나가기 실패:', error);
            showToast?.(error.message || '그룹 나가기에 실패했습니다');
          }
        }, 500);
      }
    } catch (error) {
      console.error('방장 위임 실패:', error);
      showToast?.(error.message || '방장 위임에 실패했습니다');
      setLeaveAfterTransfer(false); // 실패 시 플래그 초기화
    } finally {
      setLoadingTransfer(false);
    }
  };

  // 멤버 강퇴 핸들러 - 모달 열기
  const handleRemoveMember = (targetId, targetName) => {
    setMemberToRemove({ id: targetId, name: targetName });
    setShowRemoveMemberModal(true);
  };

  // 멤버 강퇴 확인
  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      await removeMemberFromGroup(chat.id, currentUserId, memberToRemove.id);
      showToast?.(`${memberToRemove.name}님을 강퇴했습니다`);
      setShowRemoveMemberModal(false);
      setMemberToRemove(null);
    } catch (error) {
      console.error('멤버 강퇴 실패:', error);
      showToast?.(error.message || '멤버 강퇴에 실패했습니다');
    }
  };

  // 초대 취소 핸들러 (pending/rejected 멤버만)
  const handleCancelInvitation = async (targetId, targetName) => {
    setShowCancelInviteConfirm({ show: true, targetId, targetName });
  };

  const confirmCancelInvitation = async () => {
    const { targetId, targetName } = showCancelInviteConfirm;
    setShowCancelInviteConfirm({ show: false, targetId: null, targetName: '' });

    try {
      await cancelInvitation(chat.id, currentUserId, targetId);
      showToast?.(`${targetName}님의 초대를 취소했습니다`);
    } catch (error) {
      console.error('초대 취소 실패:', error);
      showToast?.(error.message || '초대 취소에 실패했습니다');
    }
  };

  // 멤버 상세 정보 보기
  const handleShowMemberDetail = async (memberId, memberName) => {
    try {
      // Firestore에서 워크스페이스 코드 조회
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const workspacesRef = collection(db, 'workspaces');
      const q = query(workspacesRef, where('userId', '==', memberId));
      const snapshot = await getDocs(q);

      let workspaceCode = '정보 없음';
      if (!snapshot.empty) {
        workspaceCode = snapshot.docs[0].data().workspaceCode || '정보 없음';
      }

      setSelectedMemberDetail({
        id: memberId,
        name: memberName,
        workspaceId: workspaceCode
      });
      setShowMemberDetailModal(true);
    } catch (error) {
      console.error('워크스페이스 코드 조회 실패:', error);
      // 실패해도 모달은 띄움
      setSelectedMemberDetail({
        id: memberId,
        name: memberName,
        workspaceId: '정보 없음'
      });
      setShowMemberDetailModal(true);
    }
  };

  // 워크스페이스 ID 복사
  const handleCopyWorkspaceId = () => {
    if (selectedMemberDetail?.workspaceId && selectedMemberDetail.workspaceId !== '정보 없음') {
      // WS- 제거하고 6자리만 복사
      const idOnly = selectedMemberDetail.workspaceId.replace('WS-', '');
      navigator.clipboard.writeText(idOnly);
      showToast?.('셰어노트 ID가 복사되었습니다');
    }
  };

  // 초대 코드 복사 핸들러
  const handleCopyInviteCode = () => {
    if (chat.inviteCode) {
      navigator.clipboard.writeText(chat.inviteCode);
      showToast?.('초대 코드가 복사되었습니다');
    }
  };

  // 첫 번째 모달에서 확인 버튼 클릭 (최종 확인 모달 띄우기)
  const handleRoomTypeSelectConfirm = () => {
    if (selectedRoomType === null || selectedRoomType === chat.isPublic) {
      // 변경사항이 없으면 그냥 닫기
      setShowRoomTypeModal(false);
      setSelectedRoomType(null);
      return;
    }

    // 최종 확인 모달 열기
    setShowRoomTypeModal(false);
    setShowRoomTypeConfirmModal(true);
  };

  // 최종 확인 모달에서 확인 버튼 클릭 (실제 변경 수행)
  const handleFinalConfirmRoomTypeChange = async () => {
    try {
      await updateGroupRoomType(chat.id, currentUserId, selectedRoomType);
      setShowRoomTypeConfirmModal(false);
      setSelectedRoomType(null);
    } catch (error) {
      console.error('방 타입 변경 실패:', error);
      showToast?.(error.message || '방 타입 변경에 실패했습니다');
      setShowRoomTypeConfirmModal(false);
      setSelectedRoomType(null);
    }
  };

  // 채팅중 수신음 소거/소거해제 핸들러
  const handleToggleReceiveSound = async () => {
    const newMutedState = !isReceiveSoundMuted;

    // 상태 업데이트
    setIsReceiveSoundMuted(newMutedState);

    // localStorage에 저장
    await setRoomReceiveSoundMuted(chat.id, newMutedState);

    // 메뉴 닫기
    setShowMenuDropdown(false);

    console.log(`${newMutedState ? '🔇' : '🔊'} [handleToggleReceiveSound] 채팅방 ${chat.id} 수신음 ${newMutedState ? '소거' : '소거 해제'} - 상태 저장 완료`);
  };

  // 단체방 삭제 핸들러
  const handleDeleteGroup = () => {
    setShowDeleteGroupModal(true);
  };

  // 단체방 삭제 1단계 확인 → 2단계 모달로 이동
  const handleConfirmDeleteGroup = () => {
    setShowDeleteGroupModal(false);
    setShowDeleteGroupFinalModal(true);
  };

  // 단체방 삭제 최종 확인 (2단계)
  const handleFinalConfirmDeleteGroup = async () => {
    try {
      await deleteGroupChat(chat.id, currentUserId);
      showToast?.('단체방이 삭제되었습니다');
      setShowDeleteGroupFinalModal(false);
      onClose(); // 채팅방 닫기
    } catch (error) {
      console.error('단체방 삭제 실패:', error);
      showToast?.(error.message || '단체방 삭제에 실패했습니다');
    }
  };

  // 그룹 나가기 핸들러
  const handleLeaveGroup = () => {
    // 방장인지 확인
    if (isRoomOwner && chat.membersInfo) {
      // active 멤버가 있는지 확인 (방장 본인 제외)
      const hasActiveMember = Object.entries(chat.membersInfo).some(
        ([memberId, memberInfo]) =>
          memberId !== currentUserId && memberInfo.status === 'active'
      );

      if (hasActiveMember) {
        // active 멤버가 있으면 위임 안내 모달
        setShowOwnerLeaveGuideModal(true);
      } else {
        // active 멤버가 없으면 (pending만 있거나 아무도 없으면) 안내
        showToast?.('위임할 수 있는 참여자가 없습니다.\n단체방 삭제를 이용하세요');
      }
      return;
    }

    // 마지막 멤버이거나 일반 멤버인 경우 → 바로 나가기 모달
    setShowLeaveGroupModal(true);
  };

  // 방장 나가기 안내 모달에서 "위임하기" 클릭
  const handleStartTransferForLeave = () => {
    setShowOwnerLeaveGuideModal(false);
    setLeaveAfterTransfer(true);
    setShowTransferOwnerModal(true);
  };

  // 그룹 나가기 확인
  const handleConfirmLeaveGroup = async () => {
    try {
      const { leaveGroup } = await import('../../services/groupChatService');
      await leaveGroup(chat.id, currentUserId);
      showToast?.('그룹을 나갔습니다');
      setShowLeaveGroupModal(false);
      onClose(); // 채팅방 닫기
    } catch (error) {
      console.error('그룹 나가기 실패:', error);
      showToast?.(error.message || '그룹 나가기에 실패했습니다');
    }
  };

  // 마지막 active 멤버 여부 확인
  const isLastMember = chat.type === 'group' && chat.membersInfo &&
    Object.values(chat.membersInfo).filter(memberInfo => memberInfo.status === 'active').length === 1;

  // 아바타 배경색 매핑
  const BACKGROUND_COLORS = {
    'none': 'transparent',
    'lavender': 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    'peach': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'mint': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'sunset': 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
    'ocean': 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    'pink': '#FF69B4',
    'blue': '#4169E1',
    'yellow': '#FFD700',
    'green': '#32CD32',
    'purple': '#9370DB',
  };

  // 아바타 배경색 조회 헬퍼 함수
  const getAvatarBgColor = (avatarSettings) => {
    const bgColorKey = avatarSettings?.avatarBgColor || 'none';
    // custom인 경우 avatarCustomColor 직접 사용
    if (bgColorKey === 'custom') {
      return avatarSettings?.avatarCustomColor || '#FF1493';
    }
    return BACKGROUND_COLORS[bgColorKey] || BACKGROUND_COLORS['none'];
  };

  // 사용자별 아바타 색상 캐싱 (불필요한 반복 계산 방지)
  const userAvatarColors = useMemo(() => {
    const colors = {};
    Object.keys(userAvatarSettings).forEach(userId => {
      const avatarSettings = userAvatarSettings[userId];
      if (avatarSettings?.selectedAvatarId) {
        colors[userId] = getAvatarBgColor(avatarSettings);
      } else {
        colors[userId] = '#1E90FF'; // 기본 파란색
      }
    });
    return colors;
  }, [userAvatarSettings]);

  // 아바타 색상 조회 - 캐시된 값 사용
  const getAvatarColor = (userId) => {
    return userAvatarColors[userId] || '#1E90FF';
  };

  // 아바타 아이콘 렌더링
  const renderAvatarIcon = (userId) => {
    const avatarSettings = userAvatarSettings[userId];
    if (!avatarSettings?.selectedAvatarId) return null;

    const avatar = avatarList.find(a => a.id === avatarSettings.selectedAvatarId);
    if (!avatar) return null;

    const AvatarComponent = avatar.component;
    const bgColor = getAvatarBgColor(avatarSettings);

    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bgColor,
        borderRadius: '50%'
      }}>
        <div style={{ width: '70%', height: '70%' }}>
          <AvatarComponent />
        </div>
      </div>
    );
  };

  return createPortal(
    <S.FullScreenContainer $bgColor={roomBgColor}>
      {/* 헤더 */}
      <S.Header $bgColor={headerBgColor} $textColor={headerTextColor}>
        <S.HeaderLeft>
          <S.BackButton onClick={onClose}>
            <ArrowLeft size={24} />
          </S.BackButton>
          <S.Avatar
            $color={otherUser.isGroup ? 'linear-gradient(135deg, #667eea, #764ba2)' : getAvatarColor(otherUser.userId)}
            $clickable={otherUser.isGroup && isRoomOwner}
            onClick={handleHeaderAvatarClick}
            title={otherUser.isGroup && isRoomOwner ? '프로필 이미지 변경' : ''}
            style={
              chat.groupImage
                ? { backgroundImage: `url(${chat.groupImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : (!otherUser.isGroup && userProfilePictures[otherUser.userId])
                ? { backgroundImage: `url(${userProfilePictures[otherUser.userId]})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : {}
            }
          >
            {!chat.groupImage && !userProfilePictures[otherUser.userId] && !otherUser.isGroup && userAvatarSettings[otherUser.userId] && renderAvatarIcon(otherUser.userId)}
            {!chat.groupImage && !userProfilePictures[otherUser.userId] && !userAvatarSettings[otherUser.userId] && (otherUser.isGroup ? <Users size={20} /> : (nicknamesLoaded ? otherUser.name.charAt(0).toUpperCase() : '...'))}
            {/* ⚠️ 공개방/비공개방 배지 임시 비활성화 (2026-01-16)
                - 현재 공개방 기능을 사용하지 않아 자물쇠 표시 불필요
                - 향후 공개방 운영 시 아래 주석 해제하여 재활성화 가능
            {otherUser.isGroup && (
              <S.AvatarBadge title={chat.isPublic ? '공개방' : '비공개방'}>
                {chat.isPublic ? '🌐' : '🔒'}
              </S.AvatarBadge>
            )}
            */}
          </S.Avatar>
          <S.ChatInfo>
            <S.ChatName $textColor={headerTextColor}>
              {nicknamesLoaded
                ? (otherUser.name.length > 10 ? otherUser.name.substring(0, 10) + '...' : otherUser.name)
                : '로딩 중...'}
            </S.ChatName>
            <S.ChatStatus>
              {otherUser.isGroup ? `멤버 ${otherUser.memberCount}명` : ''}
            </S.ChatStatus>
          </S.ChatInfo>
        </S.HeaderLeft>
        <S.HeaderRight>
          {chat.type === 'group' && !chat.isPublic && (
            <S.MenuButton onClick={() => setShowMemberListModal(true)} title="참여자 목록">
              <Users size={20} />
            </S.MenuButton>
          )}
          {!otherUser.isSelfChat && (
            <S.MenuButton onClick={handleToggleDocument} title="공유 문서" $hasDocument={hasSharedDocument}>
              <FileText size={20} />
            </S.MenuButton>
          )}
          <div style={{ position: 'relative' }}>
            <S.MenuButton
              onClick={() => {
                setShowMenuDropdown(!showMenuDropdown);
              }}
              title="메뉴"
            >
              <MoreVertical size={20} />
            </S.MenuButton>
            {/* 드롭다운 메뉴 */}
            {showMenuDropdown && (
              <S.DropdownMenu onClick={(e) => e.stopPropagation()}>
                {/* 대화 검색 (공통) */}
                <S.DropdownItem
                  onClick={() => {
                    setShowSearchBar(true);
                    setShowMenuDropdown(false);
                  }}
                >
                  <Search size={16} />
                  대화 검색
                </S.DropdownItem>

                {chat.type === 'group' && (
                  <>
                    <S.DropdownDivider />
                    {/* 방장 전용 메뉴 */}
                    {isRoomOwner && (
                    <>
                      {/* 멤버 초대 */}
                      <S.DropdownItem
                        onClick={() => {
                          setShowInviteMembersModal(true);
                          setShowMenuDropdown(false);
                        }}
                      >
                        <Users size={16} />
                        멤버 초대
                      </S.DropdownItem>
                      {/* 방장 위임 */}
                      <S.DropdownItem
                        onClick={() => {
                          setShowTransferOwnerModal(true);
                          setShowMenuDropdown(false);
                        }}
                      >
                        <UserCog size={16} />
                        방장 위임
                      </S.DropdownItem>
                      {/* 부방장 임명 */}
                      <S.DropdownItem
                        onClick={() => {
                          setShowAppointSubManagerModal(true);
                          setShowMenuDropdown(false);
                        }}
                      >
                        <Shield size={16} />
                        부방장 임명
                      </S.DropdownItem>
                      {/* 그룹명 변경 */}
                      <S.DropdownItem
                        onClick={() => {
                          setNewRoomName(otherUser.name);
                          setShowRenameRoomModal(true);
                          setShowMenuDropdown(false);
                        }}
                      >
                        <Edit3 size={16} />
                        그룹명 변경
                      </S.DropdownItem>
                      {/* 수신음 소거/소거해제 */}
                      <S.DropdownItem onClick={handleToggleReceiveSound}>
                        {isReceiveSoundMuted ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        {isReceiveSoundMuted ? '수신음 소거해제' : '수신음 소거'}
                      </S.DropdownItem>
                      {/* 구분자 */}
                      <S.DropdownDivider />
                      {/* 현 단체방 나가기 (방장) */}
                      <S.DropdownItem
                        onClick={() => {
                          setShowMenuDropdown(false);
                          handleLeaveGroup();
                        }}
                        style={{ color: '#ef4444' }}
                      >
                        <Trash2 size={16} />
                        현 단체방 나가기
                      </S.DropdownItem>
                    </>
                  )}

                  {/* 일반 참여자용 메뉴 */}
                  {!isRoomOwner && (
                    <>
                      {/* 수신음 소거/소거해제 */}
                      <S.DropdownItem onClick={handleToggleReceiveSound}>
                        {isReceiveSoundMuted ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        {isReceiveSoundMuted ? '수신음 소거해제' : '수신음 소거'}
                      </S.DropdownItem>
                      {/* 구분자 */}
                      <S.DropdownDivider />
                      {/* 현 단체방 나가기 */}
                      <S.DropdownItem
                        onClick={() => {
                          setShowMenuDropdown(false);
                          handleLeaveGroup();
                        }}
                        style={{ color: '#ef4444' }}
                      >
                        <Trash2 size={16} />
                        현 단체방 나가기
                      </S.DropdownItem>
                    </>
                  )}
                  </>
                )}
              </S.DropdownMenu>
            )}
          </div>
        </S.HeaderRight>
      </S.Header>

      {/* 검색창 */}
      {showSearchBar && (
        <S.SearchBar>
          <S.SearchInput
            type="text"
            placeholder="대화 내용 검색..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
          />
          {searchResults.length > 0 && (
            <S.SearchResultInfo>
              {currentSearchIndex + 1} / {searchResults.length}
            </S.SearchResultInfo>
          )}
          <S.SearchButtons>
            <S.SearchButton onClick={handlePrevSearch} disabled={searchResults.length === 0} title="이전">
              <ChevronUp size={18} />
            </S.SearchButton>
            <S.SearchButton onClick={handleNextSearch} disabled={searchResults.length === 0} title="다음">
              <ChevronDown size={18} />
            </S.SearchButton>
            <S.SearchButton onClick={handleCloseSearch} title="닫기">
              <X size={18} />
            </S.SearchButton>
          </S.SearchButtons>
        </S.SearchBar>
      )}

      {/* 초대 수락/거부 배너 (pending 상태일 때만 표시) */}
      {chat.type === 'group' && myMemberStatus === 'pending' && (
        <S.InvitationBanner>
          <S.InvitationText>
            <strong>{chat.groupName}</strong> 단체방에 초대되었습니다.<br />
            참여하시겠습니까?
          </S.InvitationText>
          <S.InvitationActions>
            <S.RejectButton
              onClick={handleRejectInvitation}
              disabled={processingInvitation}
            >
              {processingInvitation ? '처리 중...' : '거부'}
            </S.RejectButton>
            <S.AcceptButton
              onClick={handleAcceptInvitation}
              disabled={processingInvitation}
            >
              {processingInvitation ? '처리 중...' : '수락'}
            </S.AcceptButton>
          </S.InvitationActions>
        </S.InvitationBanner>
      )}

      {/* 협업 문서 (펼쳤을 때만 표시) */}
      {showDocument && (
        <div style={{ padding: '12px 20px', maxHeight: '500px', overflowY: 'auto' }}>
          <CollaborativeDocumentEditor
            key={currentDocument?.originalMemoId || 'default'} // 문서 변경 시 재마운트
            chatRoomId={chat.id}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            isManager={isRoomOwner}
            canEdit={true} // 1:1은 자동 편집 권한, 그룹은 권한 시스템 적용
            chatType={chat.type} // 1:1 vs 그룹 구분
            showToast={showToast}
            onClose={() => {
              setShowDocument(false);
            }}
            onLoadFromShared={handleLoadFromShared}
            selectedMemo={selectedMemoToLoad}
            onUpdateMemoPendingFlag={onUpdateMemoPendingFlag}
            syncMemo={syncMemo}
          />
        </div>
      )}

      {/* 메시지 목록 */}
      <S.MessagesContainer ref={messagesContainerRef} $blurred={chat.type === 'group' && myMemberStatus === 'pending'}>
        {/* 그룹 삭제 알림 (카운트다운) */}
        {groupDeletionInfo && (
          <S.DeletionNotice>
            <S.DeletionTitle>
              ⚠️ 단체방 삭제 안내
            </S.DeletionTitle>
            <S.DeletionMessage>
              {groupDeletionInfo.deleterName}님에 의해<br />
              대화방이 삭제되었습니다.
            </S.DeletionMessage>
            <S.DeletionCountdown>
              {groupDeletionInfo.countdown}초 후 방이 사라집니다
            </S.DeletionCountdown>
          </S.DeletionNotice>
        )}

        {messages.length === 0 ? (
          <S.EmptyState>
            <S.EmptyIcon>💬</S.EmptyIcon>
            <S.EmptyTitle>대화를 시작해보세요</S.EmptyTitle>
            <S.EmptyDescription>
              첫 메시지를 보내고<br />대화를 시작해보세요
            </S.EmptyDescription>
          </S.EmptyState>
        ) : (
          <>
            {/* ⭐ 이전 대화 불러오기 버튼 */}
            {hasMoreMessages && !loadingOlderMessages && (
              <S.LoadMoreButton onClick={handleLoadMoreMessages}>
                ↑ 이전 대화 불러오기
              </S.LoadMoreButton>
            )}
            {loadingOlderMessages && (
              <S.LoadMoreButton disabled>
                불러오는 중...
              </S.LoadMoreButton>
            )}

            {messages.map((message, index) => {
              const isMine = message.senderId === currentUserId;
              const showDate = dateSeparatorIndices.has(index);

              // 프로필 표시 조건
              const showAvatar = !isMine && (() => {
                if (chat.type === 'group') {
                  return true; // 그룹 채팅: 항상 표시
                }

                // 1:1 채팅: 이전 메시지와 발신자가 다르거나, 시간이 다를 때 표시
                const prevMessage = messages[index - 1];
                if (!prevMessage || prevMessage.senderId !== message.senderId) {
                  return true; // 이전 메시지 발신자가 다름
                }

                // 시간 비교 (분 단위까지만)
                const currentTime = formatMessageTime(message.createdAt);
                const prevTime = formatMessageTime(prevMessage.createdAt);
                return currentTime !== prevTime; // 시간이 다르면 표시
              })();

              // 시간 표시 조건
              const showTime = (() => {
                if (chat.type === 'group') {
                  return true; // 그룹 채팅: 항상 표시
                }

                // 1:1 채팅: 다음 메시지와 발신자가 다르거나, 시간이 다를 때 표시 (마지막 메시지)
                const nextMessage = messages[index + 1];
                if (!nextMessage || nextMessage.senderId !== message.senderId) {
                  return true; // 다음 메시지 발신자가 다름 (현재 메시지가 마지막)
                }

                // 시간 비교 (분 단위까지만)
                const currentTime = formatMessageTime(message.createdAt);
                const nextTime = formatMessageTime(nextMessage.createdAt);
                return currentTime !== nextTime; // 시간이 다르면 표시 (현재 메시지가 시간 그룹의 마지막)
              })();

              // 상대방 ID 찾기
              const otherUserId = chat.participants?.find(id => id !== currentUserId);

              // 읽음 여부 판단: 방에 있는 모든 사람에게 표시
              let isUnreadByOther = false;
              let unreadCount = 0;

              if (chatRoomData.type !== 'group') {
                // 1:1 채팅: message.read 필드로 직접 확인 (즉시 반영)
                // 내가 보낸 메시지만 표시 (상대방이 안 읽었는지)
                if (isMine) {
                  isUnreadByOther = message.read === false;
                }
              } else {
                // 그룹 채팅: 방에 있는 사람은 누구나 안 읽은 사람 수 표시
                const activeMembers = chat.members?.filter(memberId => {
                  const memberStatus = chat.membersInfo?.[memberId]?.status;
                  return memberStatus === 'active' && memberId !== currentUserId;
                }) || [];

                // readBy 배열에 없는 멤버 수만 카운트
                const readByArray = message.readBy || [];
                unreadCount = activeMembers.filter(memberId => {
                  return !readByArray.includes(memberId);
                }).length;

                isUnreadByOther = unreadCount > 0;
              }

              const userRole = getUserRole(message.senderId);

              // 시스템 메시지인 경우
              if (message.type === 'system') {
                return (
                  <div key={message.id} data-message-id={message.id}>
                    {showDate && (
                      <S.DateSeparator>
                        <S.DateText>{formatDate(message.createdAt)}</S.DateText>
                      </S.DateSeparator>
                    )}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      margin: '16px 0',
                      padding: '0 20px'
                    }}>
                      <div style={{
                        flex: 1,
                        height: '1px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        minWidth: '12px'
                      }} />
                      <div style={{
                        fontSize: '13px',
                        color: '#999',
                        wordBreak: 'break-word',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        textAlign: 'center',
                        maxWidth: '80%'
                      }}>
                        {message.content}
                      </div>
                      <div style={{
                        flex: 1,
                        height: '1px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        minWidth: '12px'
                      }} />
                    </div>
                  </div>
                );
              }

              // 삭제된 메시지인지 확인
              const isDeleted = message.deleted === true;

              // 차단 상태 확인 (그룹 채팅에서만)
              const isMutedUser = chat.type === 'group' && mutedUsers.includes(message.senderId); // 그룹 메시지 차단
              const isBlockedUser = chat.type === 'group' && blockedUserIds.includes(message.senderId); // 전체 앱 차단

              // 일반 메시지
              // 삭제된 메시지: 본인에게는 "관리자에 의해", 다른 사람에게는 삭제자 이름 표시
              const deletedText = message.senderId === currentUserId
                ? '관리자에 의해 메시지가 삭제되었습니다'
                : `${message.deletedByName || '관리자'}님에 의해 메시지가 삭제되었습니다`;
              const messageText = isDeleted
                ? deletedText
                : isBlockedUser
                  ? '차단한 사용자의 메시지입니다'
                  : isMutedUser
                    ? '메시지를 차단했습니다'
                    : (message.text || message.content || '');
              const isCollapsible = !isDeleted && collapsibleMessages.has(message.id);

              const handleShowFullMessage = () => {
                setFullMessageContent(messageText);
                setShowFullMessageModal(true);
              };

              // ref callback으로 높이 체크
              const handleTextContentRef = (element) => {
                if (element) {
                  const lineHeight = 1.5 * 14; // line-height * font-size
                  const maxHeight = lineHeight * 18;
                  const actualHeight = element.scrollHeight;

                  if (actualHeight > maxHeight && !collapsibleMessages.has(message.id)) {
                    setCollapsibleMessages(prev => {
                      const newSet = new Set(prev);
                      newSet.add(message.id);
                      return newSet;
                    });
                  }
                }
              };

              return (
                <div key={message.id} data-message-id={message.id} data-message-index={index}>
                  {showDate && (
                    <S.DateSeparator>
                      <S.DateText>{formatDate(message.createdAt)}</S.DateText>
                    </S.DateSeparator>
                  )}
                  {/* ⭐ 이전 대화 경계 구분선들 (메시지 ID 기반) */}
                  {hasLoadedOlderMessages && dividerMessageIds.includes(message.id) && (
                    <S.OlderMessagesDivider data-older-messages-divider>
                      <S.OlderMessagesDividerText>══════ 이전 대화 보기 ══════</S.OlderMessagesDividerText>
                    </S.OlderMessagesDivider>
                  )}
                  {/* ⭐ 안 읽은 메시지 마커 표시 */}
                  {index === firstUnreadIndex && firstUnreadIndex >= 0 && (
                    <S.UnreadMarker ref={unreadMarkerRef}>
                      <S.UnreadMarkerText>여기까지 읽음</S.UnreadMarkerText>
                    </S.UnreadMarker>
                  )}
                  <S.MessageItem $isMine={isMine}>
                    {!isMine && showAvatar && (
                      <S.MessageAvatar
                        $color={getAvatarColor(message.senderId)}
                        style={{
                          ...(userProfilePictures[message.senderId] ? { backgroundImage: `url(${userProfilePictures[message.senderId]})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}),
                          cursor: 'pointer'
                        }}
                        onClick={() => handleAvatarClick(message.senderId, userNicknames[message.senderId] || userDisplayNames[message.senderId] || message.senderName || '사용자', userProfilePictures[message.senderId])}
                        onTouchStart={(e) => handleAvatarTouchStart(e, message.id, message.senderId, userNicknames[message.senderId] || userDisplayNames[message.senderId] || message.senderName || '사용자', userProfilePictures[message.senderId], isDeleted)}
                        onTouchEnd={handleAvatarTouchEnd}
                        onTouchCancel={handleAvatarTouchCancel}
                        onContextMenu={(e) => e.preventDefault()}
                      >
                        {!userProfilePictures[message.senderId] && userAvatarSettings[message.senderId] && renderAvatarIcon(message.senderId)}
                        {!userProfilePictures[message.senderId] && !userAvatarSettings[message.senderId] && (userNicknames[message.senderId] || userDisplayNames[message.senderId] || '사').charAt(0).toUpperCase()}
                        {userRole && (
                          <S.RoleBadge title={userRole.label}>
                            {userRole.icon}
                          </S.RoleBadge>
                        )}
                      </S.MessageAvatar>
                    )}
                    {!isMine && !showAvatar && <div style={{ width: '38px' }} />}
                    <S.MessageContent $isMine={isMine}>
                      {!isMine && showAvatar && <S.SenderName>{userNicknames[message.senderId] || userDisplayNames[message.senderId] || message.senderName || '사용자'}</S.SenderName>}
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', flexDirection: isMine ? 'row-reverse' : 'row' }}>
                        <div style={{ position: 'relative' }}>
                          <S.MessageBubble
                            $isMine={isMine}
                            $myBubbleColor={myBubbleColor}
                            $otherBubbleColor={otherBubbleColor}
                            $myTextColor={myTextColor}
                            $otherTextColor={otherTextColor}
                            $collapsed={isCollapsible}
                            data-message-id={message.id}
                            style={isDeleted ? { background: 'rgba(180, 60, 60, 0.25)', border: '1px dashed rgba(255, 100, 100, 0.3)' } : isBlockedUser ? { background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' } : isMutedUser ? { background: 'rgba(100, 100, 100, 0.3)', border: '1px dashed rgba(255, 255, 255, 0.2)' } : {}}
                          >
                            <S.MessageTextContent
                              ref={(isDeleted || isMutedUser || isBlockedUser) ? undefined : handleTextContentRef}
                              $collapsed={isCollapsible}
                              $isMine={isMine}
                              style={isDeleted ? { color: '#e57373', fontStyle: 'italic', fontSize: '13px' } : isBlockedUser ? { color: '#ef4444', fontStyle: 'italic', fontSize: '13px' } : isMutedUser ? { color: '#888', fontStyle: 'italic', fontSize: '13px' } : {}}
                            >
                              {messageText}
                            </S.MessageTextContent>
                          </S.MessageBubble>
                          {isCollapsible && (
                            <S.ShowMoreOverlay
                              $isMine={isMine}
                              $myBubbleColor={myBubbleColor}
                              $otherBubbleColor={otherBubbleColor}
                            >
                              <S.ShowMoreButton
                                onClick={handleShowFullMessage}
                                $isMine={isMine}
                              >
                                전체보기
                              </S.ShowMoreButton>
                            </S.ShowMoreOverlay>
                          )}
                        </div>
                        <S.MessageMeta style={{ marginBottom: '3px' }} $isMine={isMine}>
                          {/* 내가 보낸 메시지 중 읽지 않은 사람이 있는 경우 표시 */}
                          {isUnreadByOther && (
                            <S.UnreadBadge>
                              {chat.type === 'group' ? unreadCount : 1}
                            </S.UnreadBadge>
                          )}
                          <S.MessageTime style={{ visibility: showTime ? 'visible' : 'hidden' }}>{formatMessageTime(message.createdAt)}</S.MessageTime>
                        </S.MessageMeta>
                      </div>
                    </S.MessageContent>
                  </S.MessageItem>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}

        {/* 프사 길게 누르기 컨텍스트 메뉴 */}
        {avatarContextMenu.show && (
          <>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99998,
                background: 'rgba(0, 0, 0, 0.3)'
              }}
              onClick={closeAvatarContextMenu}
            />
            <div
              style={{
                position: 'fixed',
                top: Math.min(avatarContextMenu.y, window.innerHeight - 120),
                left: avatarContextMenu.x,
                zIndex: 99999,
                background: 'linear-gradient(180deg, #2a2a2a 0%, #1f1f1f 100%)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                minWidth: '160px',
                overflow: 'hidden'
              }}
            >
              {/* 삭제 권한이 있고, 아직 삭제되지 않은 경우에만 삭제 메뉴 표시 */}
              {canDeleteMessage(avatarContextMenu.senderId) && !avatarContextMenu.isDeleted && (
                <S.DropdownItem onClick={handleDeleteMessage}>
                  <Trash2 size={16} />
                  메시지 삭제
                </S.DropdownItem>
              )}
              {/* 그룹 채팅에서 다른 사람의 메시지인 경우 차단/해제 메뉴 표시 */}
              {chat.type === 'group' && avatarContextMenu.senderId !== currentUserId && (
                mutedUsers.includes(avatarContextMenu.senderId) ? (
                  <S.DropdownItem onClick={handleUnmuteUser}>
                    <Volume2 size={16} />
                    메시지 차단 해제
                  </S.DropdownItem>
                ) : (
                  <S.DropdownItem onClick={handleMuteUser}>
                    <VolumeX size={16} />
                    이 사용자 메시지 차단
                  </S.DropdownItem>
                )
              )}
            </div>
          </>
        )}
      </S.MessagesContainer>

      {/* 입력 영역 */}
      <S.InputContainer $bgColor={inputBgColor}>
        {/* 차단된 경우 메시지 표시 (DM 전용) */}
        {chat.type !== 'group' && isOtherUserBlocked ? (
          <S.BlockedMessage>
            🚫 차단된 사용자와는 메시지를 주고받을 수 없습니다
          </S.BlockedMessage>
        ) : (
          <>
            {/* 이모티콘 선택기 */}
            {showEmojiPicker && (
              <S.EmojiPicker>
                <S.EmojiHeader>
                  <S.EmojiTitle>이모티콘 선택</S.EmojiTitle>
                  <S.IconButton onClick={() => setShowEmojiPicker(false)}>
                    <X size={18} />
                  </S.IconButton>
                </S.EmojiHeader>

                {/* 카테고리 탭 */}
                <S.EmojiCategoryTabs>
                  {Object.keys(emojiCategories).map((category) => (
                    <S.CategoryTab
                      key={category}
                      $active={selectedEmojiCategory === category}
                      onClick={() => setSelectedEmojiCategory(category)}
                    >
                      {category.split(' ')[0]}
                    </S.CategoryTab>
                  ))}
                </S.EmojiCategoryTabs>

                {/* 선택된 카테고리의 이모지 그리드 */}
                <S.EmojiGrid>
                  {emojiCategories[selectedEmojiCategory].map((emoji, index) => (
                    <S.EmojiButton
                      key={index}
                      onClick={() => handleEmojiSelect(emoji)}
                    >
                      {emoji}
                    </S.EmojiButton>
                  ))}
                </S.EmojiGrid>
              </S.EmojiPicker>
            )}

            <S.InputWrapper>
              <S.InputGroup>
                <S.TextInputWrapper $bgColor={inputFieldBgColor}>
                  <S.IconButton
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    title="이모티콘"
                  >
                    <Smile size={20} />
                  </S.IconButton>
                  <S.TextInput
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="메시지를 입력하세요..."
                    rows={1}
                    disabled={sending}
                    $textColor={inputTextColor}
                  />
                  {showMacroButton && (
                    <S.MacroButton
                      onClick={() => {
                        if (macros.length > 0) {
                          setShowMacroModal(true);
                        } else {
                          showToast?.('매크로가 등록되지 않았습니다.\n사이드 메뉴에서 매크로를 등록하세요');
                        }
                      }}
                      title="매크로"
                    >
                      macro
                    </S.MacroButton>
                  )}
                </S.TextInputWrapper>
              </S.InputGroup>
              <S.SendButton
                onClick={handleSendMessage}
                disabled={!inputText.trim() || sending}
                $bgColor={sendButtonBgColor}
                $iconColor={sendButtonIconColor}
              >
                <Send size={20} />
              </S.SendButton>
            </S.InputWrapper>
          </>
        )}
      </S.InputContainer>

      {/* 매크로 선택 모달 */}
      {showMacroModal && (
        <S.MacroModalOverlay onClick={() => setShowMacroModal(false)}>
          <S.MacroModalContent onClick={(e) => e.stopPropagation()}>
            <S.MacroModalTitle>매크로 선택</S.MacroModalTitle>
            <S.MacroGrid>
              {macros.length > 0 ? (
                macros.map((macroText, index) => (
                  <S.MacroItem
                    key={index}
                    onClick={() => {
                      setInputText(prev => prev + macroText);
                      setShowMacroModal(false);
                      inputRef.current?.focus();
                    }}
                  >
                    {index + 1}. {macroText}
                  </S.MacroItem>
                ))
              ) : (
                <S.MacroEmptyMessage>
                  등록된 매크로가 없습니다.<br />
                  사이드 메뉴 → 매크로에서 등록하세요.
                </S.MacroEmptyMessage>
              )}
            </S.MacroGrid>
          </S.MacroModalContent>
        </S.MacroModalOverlay>
      )}

      {/* 공유 폴더 메모 선택 모달 */}
      {showSharedMemoSelector && (
        <SharedMemoSelectorModal
          onClose={() => setShowSharedMemoSelector(false)}
          onSelectMemo={handleSelectSharedMemo}
          showToast={showToast}
          allMemos={memos}
          chatRoomId={chat.id}
          chatType={chat.type}
          currentUserId={currentUserId}
        />
      )}

      {/* 참여자 목록 모달 */}
      {showMemberListModal && chat.type === 'group' && (
        <S.ModalOverlay onClick={() => setShowMemberListModal(false)}>
          <S.ModalContainer onClick={(e) => e.stopPropagation()}>
            <S.ModalHeader>
              <S.ModalTitle>
                <Users size={24} />
                참여자 목록 ({chatRoomData?.membersInfo ? Object.entries(chatRoomData.membersInfo).filter(([memberId, m]) => {
                  // active 상태이고, 강퇴되지 않았고, 방에 아직 있는 멤버만 카운트
                  const isKicked = chatRoomData.kickedUsers && chatRoomData.kickedUsers.includes(memberId);
                  const isStillInRoom = chatRoomData.members && chatRoomData.members.includes(memberId);
                  return m.status === 'active' && !isKicked && isStillInRoom;
                }).length : 0})
              </S.ModalTitle>
              <S.CloseButton onClick={() => setShowMemberListModal(false)}>
                <X size={20} />
              </S.CloseButton>
            </S.ModalHeader>
            <S.ModalContent>
              {/* 멤버 정렬: 각 그룹(방장/부방장/일반/기타) 내에서 나를 가장 위에, 나머지는 가나다순 */}
              {chatRoomData?.membersInfo && (() => {
                const membersArray = Object.entries(chatRoomData.membersInfo).map(([memberId, memberInfo]) => {
                  const displayName = userNicknames[memberId] || userDisplayNames[memberId] || memberInfo.displayName || '사용자';
                  const memberStatus = memberInfo.status || 'active';
                  const isOwner = memberId === chatRoomData.creatorId;
                  const isSubManager = chatRoomData.subManagers?.[memberId];
                  const isMe = memberId === currentUserId;
                  const isKicked = chatRoomData.kickedUsers && chatRoomData.kickedUsers.includes(memberId);
                  const isStillInRoom = chatRoomData.members && chatRoomData.members.includes(memberId);
                  const hasLeftAfterKick = isKicked && !isStillInRoom;
                  const hasLeft = !isStillInRoom && !isKicked; // 자발적 탈퇴

                  // 정렬 우선순위: 0=방장, 1=부방장, 2=일반멤버(active & 방에 있음), 99=맨아래(초대대기/거부/강퇴/탈퇴)
                  let sortPriority = 2;
                  if (isOwner && isStillInRoom) sortPriority = 0;
                  else if (isSubManager && memberStatus === 'active' && isStillInRoom && !isKicked) sortPriority = 1;
                  else if (memberStatus === 'active' && isStillInRoom && !isKicked) sortPriority = 2;
                  else sortPriority = 99; // 초대대기, 거부, 강퇴, 탈퇴 모두 맨 아래

                  // 부방장 권한 정보 (내가 부방장인 경우만 표시)
                  const subManagerPermissions = isMe && isSubManager ? chatRoomData.subManagers[memberId]?.permissions || [] : [];

                  return { memberId, memberInfo, displayName, memberStatus, isOwner, isSubManager, isMe, isKicked, isStillInRoom, hasLeftAfterKick, hasLeft, sortPriority, subManagerPermissions };
                });

                // 정렬: 우선순위 > 같은 우선순위 내에서 나를 먼저 > 이름 가나다순
                membersArray.sort((a, b) => {
                  if (a.sortPriority !== b.sortPriority) return a.sortPriority - b.sortPriority;
                  // 같은 우선순위 내에서 나를 가장 위로
                  if (a.isMe) return -1;
                  if (b.isMe) return 1;
                  return a.displayName.localeCompare(b.displayName, 'ko');
                });

                // 권한 이름 매핑
                const permissionLabels = {
                  kick_member: '강퇴',
                  manage_messages: '메시지 관리',
                  invite_member: '초대'
                };

                return membersArray.map(({ memberId, memberInfo, displayName, memberStatus, isOwner, isSubManager, isMe, isKicked, isStillInRoom, hasLeftAfterKick, hasLeft, subManagerPermissions }) => {
                  // 상태 표시
                  let statusText = null;
                  if (memberStatus === 'pending') statusText = '초대 대기중';
                  else if (memberStatus === 'rejected') statusText = '초대 거부';
                  else if (hasLeft) statusText = '탈퇴함';

                  // 흐리게 표시할 조건: 강퇴됨, 탈퇴함, 초대 대기/거부
                  const shouldDim = hasLeftAfterKick || hasLeft || memberStatus === 'pending' || memberStatus === 'rejected';

                  // 권한 텍스트 (내가 부방장인 경우만)
                  const permissionText = subManagerPermissions.length > 0
                    ? subManagerPermissions.map(p => permissionLabels[p] || p).join(', ')
                    : null;

                  return (
                    <S.MemberItem
                      key={memberId}
                      style={{ opacity: shouldDim ? 0.5 : 1, cursor: 'pointer' }}
                      onClick={(e) => {
                        if (e.target.closest('button')) return;
                        handleShowMemberDetail(memberId, displayName);
                      }}
                    >
                      <S.MemberAvatarWrapper>
                        <S.MemberAvatar
                          $color={getAvatarColor(memberId)}
                          style={{
                            opacity: shouldDim ? 0.6 : 1,
                            ...(userProfilePictures[memberId] ? { backgroundImage: `url(${userProfilePictures[memberId]})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {})
                          }}
                        >
                          {!userProfilePictures[memberId] && userAvatarSettings[memberId] && renderAvatarIcon(memberId)}
                          {!userProfilePictures[memberId] && !userAvatarSettings[memberId] && displayName.charAt(0).toUpperCase()}
                        </S.MemberAvatar>
                        {blockedUserIds.includes(memberId) && <S.BlockedBadge />}
                      </S.MemberAvatarWrapper>
                      <S.MemberInfo>
                        <S.MemberName style={{ opacity: shouldDim ? 0.7 : 1 }}>
                          {displayName}{isMe && ' (나)'}
                          {isOwner && isStillInRoom && <S.OwnerBadge>방장</S.OwnerBadge>}
                          {isSubManager && !isOwner && isStillInRoom && !isKicked && (
                            <>
                              <S.OwnerBadge style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>부방장</S.OwnerBadge>
                              {isMe && permissionText && (
                                <S.OwnerBadge style={{ background: 'rgba(100, 116, 139, 0.15)', color: '#94a3b8', fontSize: '10px', marginLeft: '4px' }}>
                                  {permissionText}
                                </S.OwnerBadge>
                              )}
                            </>
                          )}
                          {isKicked && <S.OwnerBadge style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', marginLeft: '6px' }}>강퇴됨</S.OwnerBadge>}
                        </S.MemberName>
                        {statusText && (
                          <S.MemberStatus $status={hasLeftAfterKick || hasLeft ? 'rejected' : memberStatus}>
                            {statusText}
                          </S.MemberStatus>
                        )}
                      </S.MemberInfo>
                      {memberStatus === 'active' && !isKicked && !isOwner && isStillInRoom && !isMe && canKickMember(memberId) && (
                        <S.RemoveButton onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMember(memberId, displayName);
                        }}>
                          강퇴
                        </S.RemoveButton>
                      )}
                      {isRoomOwner && (memberStatus === 'pending' || memberStatus === 'rejected') && (
                        <S.CancelInviteButton onClick={(e) => {
                          e.stopPropagation();
                          handleCancelInvitation(memberId, displayName);
                        }}>
                          초대 취소
                        </S.CancelInviteButton>
                      )}
                    </S.MemberItem>
                  );
                });
              })()}
            </S.ModalContent>
          </S.ModalContainer>
        </S.ModalOverlay>
      )}

      {/* 멤버 초대 모달 */}
      {showInviteMembersModal && (
        <S.ModalOverlay onClick={() => {
          setShowInviteMembersModal(false);
          setSelectedFriendsToInvite([]);
          setSearchQueryInvite('');
          setWorkspaceIdInput('');
          setSearchedUser(null);
          setInviteTab('friends');
        }}>
          <S.ModalContainer onClick={(e) => e.stopPropagation()}>
            <S.ModalHeader>
              <S.ModalTitle>
                <UserPlus size={24} />
                멤버 초대
              </S.ModalTitle>
              <S.CloseButton onClick={() => {
                setShowInviteMembersModal(false);
                setSelectedFriendsToInvite([]);
                setSearchQueryInvite('');
                setWorkspaceIdInput('');
                setSearchedUser(null);
                setInviteTab('friends');
              }}>
                <X size={20} />
              </S.CloseButton>
            </S.ModalHeader>

            {/* 탭 버튼 */}
            <S.TabContainer>
              <S.TabButton $active={inviteTab === 'friends'} onClick={() => setInviteTab('friends')}>
                친구 목록
              </S.TabButton>
              <S.TabButton $active={inviteTab === 'search'} onClick={() => setInviteTab('search')}>
                아이디로 검색
              </S.TabButton>
            </S.TabContainer>

            <S.ModalContent>
              {/* 친구 목록 탭 */}
              {inviteTab === 'friends' && (
                friends.length > 0 ? (
                  <>
                    {/* 검색 바 */}
                    <S.SearchBarWrapper>
                      <S.FriendSearchInput
                        type="text"
                        placeholder="친구의 아이디나 닉네임으로 검색..."
                        value={searchQueryInvite}
                        onChange={(e) => setSearchQueryInvite(e.target.value)}
                      />
                      {searchQueryInvite && (
                        <S.SearchClearButton onClick={() => setSearchQueryInvite('')}>
                          <X size={12} />
                        </S.SearchClearButton>
                      )}
                    </S.SearchBarWrapper>

                    {/* 친구 목록 */}
                    <S.FriendListWrapper>
                      {friends
                        .filter(friend => {
                          if (!searchQueryInvite) return true;
                          const displayName = friend.friendName || friend.displayName || '익명';
                          const wsCode = friend.friendWorkspaceCode || friend.wsCode || '';
                          return displayName.toLowerCase().includes(searchQueryInvite.toLowerCase()) ||
                                 wsCode.toLowerCase().includes(searchQueryInvite.toLowerCase());
                        })
                        .filter(friend => {
                          // 이미 그룹 멤버인 친구는 제외
                          const friendId = friend.friendId || friend.id;
                          return !chat.members?.includes(friendId);
                        })
                        .map(friend => {
                          const friendId = friend.friendId || friend.id;
                          const isSelected = selectedFriendsToInvite.includes(friendId);
                          const displayName = friend.friendName || friend.displayName || '익명';
                          const wsCode = friend.friendWorkspaceCode || friend.wsCode || '';

                          return (
                            <S.SelectableMemberItem
                              key={friendId}
                              $selected={isSelected}
                              onClick={() => {
                                setSelectedFriendsToInvite(prev =>
                                  prev.includes(friendId)
                                    ? prev.filter(id => id !== friendId)
                                    : [...prev, friendId]
                                );
                              }}
                            >
                              <S.MemberAvatar
                                $color={getAvatarColor(friendId)}
                                style={userProfilePictures[friendId] ? { backgroundImage: `url(${userProfilePictures[friendId]})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                              >
                                {!userProfilePictures[friendId] && userAvatarSettings[friendId] && renderAvatarIcon(friendId)}
                                {!userProfilePictures[friendId] && !userAvatarSettings[friendId] && displayName.charAt(0).toUpperCase()}
                              </S.MemberAvatar>
                              <S.MemberInfo>
                                <S.MemberName>{displayName}</S.MemberName>
                                <S.MemberStatus>@{wsCode.replace('WS-', '')}</S.MemberStatus>
                              </S.MemberInfo>
                              {isSelected && <S.CheckMark>✓</S.CheckMark>}
                            </S.SelectableMemberItem>
                          );
                        })}
                    </S.FriendListWrapper>

                    {selectedFriendsToInvite.length > 0 && (
                      <S.SelectedInfo>{selectedFriendsToInvite.length}명 선택됨</S.SelectedInfo>
                    )}
                  </>
                ) : (
                  <S.EmptyStateContainer>
                    <S.EmptyIcon>👥</S.EmptyIcon>
                    <S.EmptyTitle>친구가 없습니다</S.EmptyTitle>
                    <S.EmptyDescription>
                      친구 탭에서 친구를 추가해보세요
                    </S.EmptyDescription>
                  </S.EmptyStateContainer>
                )
              )}

              {/* 아이디로 검색 탭 */}
              {inviteTab === 'search' && (
                <S.SearchByIdContainer>
                  <S.IdInputWrapper>
                    <S.IdInput
                      type="text"
                      placeholder="아이디 (6자리)"
                      value={workspaceIdInput}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                        if (value.length <= 6) {
                          setWorkspaceIdInput(value);
                        }
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchUserById()}
                      maxLength={6}
                    />
                    <S.IdSearchButton
                      onClick={handleSearchUserById}
                      disabled={searchingUser || workspaceIdInput.trim().length !== 6}
                    >
                      {searchingUser ? '검색 중...' : '검색'}
                    </S.IdSearchButton>
                  </S.IdInputWrapper>

                  {searchedUser && (
                    <S.UserCardContainer>
                      <S.MemberAvatar
                        $color={getAvatarColor(searchedUser.id)}
                        style={userProfilePictures[searchedUser.id] ? { backgroundImage: `url(${userProfilePictures[searchedUser.id]})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                      >
                        {!userProfilePictures[searchedUser.id] && userAvatarSettings[searchedUser.id] && renderAvatarIcon(searchedUser.id)}
                        {!userProfilePictures[searchedUser.id] && !userAvatarSettings[searchedUser.id] && (searchedUser.displayName || '익명').charAt(0).toUpperCase()}
                      </S.MemberAvatar>
                      <S.MemberInfo>
                        <S.MemberName>{searchedUser.displayName || '익명'}</S.MemberName>
                        <S.MemberStatus>@{searchedUser.workspaceCode?.replace('WS-', '')}</S.MemberStatus>
                      </S.MemberInfo>
                      <S.InviteButton
                        onClick={handleInviteSearchedUser}
                        disabled={loadingInvite}
                      >
                        {loadingInvite ? '초대 중...' : '초대'}
                      </S.InviteButton>
                    </S.UserCardContainer>
                  )}
                </S.SearchByIdContainer>
              )}
            </S.ModalContent>
            {inviteTab === 'friends' && (
              <S.ModalFooter>
                <S.CancelButton onClick={() => {
                  setShowInviteMembersModal(false);
                  setSelectedFriendsToInvite([]);
                  setSearchQueryInvite('');
                  setInviteTab('friends');
                }}>
                  취소
                </S.CancelButton>
                <S.ConfirmButton
                  onClick={handleInviteMembers}
                  disabled={loadingInvite || selectedFriendsToInvite.length === 0}
                >
                  {loadingInvite ? '초대 중...' : '초대하기'}
                </S.ConfirmButton>
              </S.ModalFooter>
            )}
          </S.ModalContainer>
        </S.ModalOverlay>
      )}

      {/* 방장 위임 모달 */}
      {showTransferOwnerModal && (
        <S.ModalOverlay onClick={() => {
          setShowTransferOwnerModal(false);
          setSelectedMemberToTransfer(null);
          setLeaveAfterTransfer(false);
        }}>
          <S.ModalContainer onClick={(e) => e.stopPropagation()}>
            <S.ModalHeader>
              <S.ModalTitle>
                <UserCog size={24} />
                방장 위임
              </S.ModalTitle>
              <S.CloseButton onClick={() => {
                setShowTransferOwnerModal(false);
                setSelectedMemberToTransfer(null);
                setLeaveAfterTransfer(false);
              }}>
                <X size={20} />
              </S.CloseButton>
            </S.ModalHeader>
            <S.ModalContent>
              {leaveAfterTransfer && (
                <S.WarningMessage>
                  💡 방장 위임 후 자동으로 채팅방을 나갑니다
                </S.WarningMessage>
              )}

              {/* 멤버 목록 (방장 제외, active 상태만) */}
              <S.FriendListWrapper>
                {chat.membersInfo && Object.entries(chat.membersInfo)
                  .filter(([memberId, memberInfo]) => {
                    // 방장 본인 제외, active 상태만
                    return memberId !== chat.creatorId &&
                           memberId !== currentUserId &&
                           memberInfo.status === 'active';
                  })
                  .map(([memberId, memberInfo]) => {
                    const isSelected = selectedMemberToTransfer === memberId;
                    // 최신 닉네임 사용 (1순위: 앱 닉네임, 2순위: 구글 displayName, 3순위: 기존 displayName)
                    const displayName = userNicknames[memberId] || userDisplayNames[memberId] || memberInfo.displayName || '익명';

                    return (
                      <S.SelectableMemberItem
                        key={memberId}
                        $selected={isSelected}
                        onClick={() => setSelectedMemberToTransfer(memberId)}
                      >
                        <S.MemberAvatar
                          $color={getAvatarColor(memberId)}
                          style={userProfilePictures[memberId] ? { backgroundImage: `url(${userProfilePictures[memberId]})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                        >
                          {!userProfilePictures[memberId] && userAvatarSettings[memberId] && renderAvatarIcon(memberId)}
                          {!userProfilePictures[memberId] && !userAvatarSettings[memberId] && displayName.charAt(0).toUpperCase()}
                        </S.MemberAvatar>
                        <S.MemberInfo>
                          <S.MemberName>{displayName}</S.MemberName>
                          <S.MemberStatus $status="active">
                            {memberInfo.status === 'pending' ? '초대 대기중' : '참여중'}
                          </S.MemberStatus>
                        </S.MemberInfo>
                        {isSelected && <S.CheckMark>✓</S.CheckMark>}
                      </S.SelectableMemberItem>
                    );
                  })}
              </S.FriendListWrapper>

              {selectedMemberToTransfer && (
                <S.SelectedInfo>
                  {userNicknames[selectedMemberToTransfer] || userDisplayNames[selectedMemberToTransfer] || chat.membersInfo?.[selectedMemberToTransfer]?.displayName || '사용자'}님을 새 방장으로 선택했습니다
                </S.SelectedInfo>
              )}
            </S.ModalContent>
            <S.ModalFooter>
              <S.CancelButton onClick={() => {
                setShowTransferOwnerModal(false);
                setSelectedMemberToTransfer(null);
                setLeaveAfterTransfer(false);
              }}>
                취소
              </S.CancelButton>
              <S.ConfirmButton
                onClick={handleTransferOwnership}
                disabled={loadingTransfer || !selectedMemberToTransfer}
              >
                {loadingTransfer ? '위임 중...' : leaveAfterTransfer ? '위임 후 나가기' : '위임하기'}
              </S.ConfirmButton>
            </S.ModalFooter>
          </S.ModalContainer>
        </S.ModalOverlay>
      )}

      {/* 초대 코드 보기 모달 */}
      {showInviteCodeModal && (
        <S.ModalOverlay onClick={() => setShowInviteCodeModal(false)}>
          <S.ModalContainer onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <S.ModalHeader>
              <S.ModalTitle>
                <Mail size={24} />
                초대 코드
              </S.ModalTitle>
              <S.CloseButton onClick={() => setShowInviteCodeModal(false)}>
                <X size={20} />
              </S.CloseButton>
            </S.ModalHeader>
            <S.ModalContent>
              <S.InviteCodeContainer>
                <S.InviteCodeLabel>단체방 초대 코드</S.InviteCodeLabel>
                <S.InviteCodeDisplay>
                  <S.InviteCodeText>{chat.inviteCode || 'INV-XXXXXX'}</S.InviteCodeText>
                </S.InviteCodeDisplay>
                <S.CopyButton onClick={handleCopyInviteCode}>
                  <Copy size={16} />
                  코드 복사
                </S.CopyButton>
              </S.InviteCodeContainer>
              <S.InviteCodeDescription>
                이 코드를 친구에게 공유하면 단체방에 참여할 수 있습니다.<br />
                친구는 채팅 탭에서 "초대 코드로 참여" 버튼을 눌러 코드를 입력하면 됩니다.
              </S.InviteCodeDescription>
            </S.ModalContent>
          </S.ModalContainer>
        </S.ModalOverlay>
      )}

      {/* 멤버 강퇴 확인 모달 */}
      {showRemoveMemberModal && memberToRemove && (
        <S.ModalOverlay onClick={() => {
          setShowRemoveMemberModal(false);
          setMemberToRemove(null);
        }}>
          <S.ModalContainer onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <S.ModalHeader>
              <S.ModalTitle>멤버 강퇴</S.ModalTitle>
              <S.CloseButton onClick={() => {
                setShowRemoveMemberModal(false);
                setMemberToRemove(null);
              }}>
                <X size={20} />
              </S.CloseButton>
            </S.ModalHeader>
            <S.ModalContent style={{ padding: '24px' }}>
              <div style={{
                textAlign: 'center',
                fontSize: '15px',
                lineHeight: '1.6',
                color: '#e0e0e0'
              }}>
                <strong style={{ color: '#4a90e2' }}>{memberToRemove.name}</strong>님을<br />
                단체방에서 강퇴하시겠습니까?
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: 'rgba(255, 165, 0, 0.1)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#ffa500'
                }}>
                  강퇴된 멤버는 다시 초대하여 참여시킬 수 있습니다.
                </div>
              </div>
            </S.ModalContent>
            <S.ModalFooter>
              <S.CancelButton onClick={() => {
                setShowRemoveMemberModal(false);
                setMemberToRemove(null);
              }}>
                취소
              </S.CancelButton>
              <S.ConfirmButton
                onClick={handleConfirmRemoveMember}
                style={{
                  background: 'linear-gradient(135deg, #f56565, #e53e3e)',
                  boxShadow: '0 2px 8px rgba(245, 101, 101, 0.3)'
                }}
              >
                강퇴하기
              </S.ConfirmButton>
            </S.ModalFooter>
          </S.ModalContainer>
        </S.ModalOverlay>
      )}

      {/* 멤버 상세 정보 모달 */}
      {showMemberDetailModal && selectedMemberDetail && (
        <S.ModalOverlay onClick={() => {
          setShowMemberDetailModal(false);
          setSelectedMemberDetail(null);
        }}>
          <S.ModalContainer onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <S.ModalHeader>
              <S.ModalTitle>멤버 정보</S.ModalTitle>
              <S.CloseButton onClick={() => {
                setShowMemberDetailModal(false);
                setSelectedMemberDetail(null);
              }}>
                <X size={20} />
              </S.CloseButton>
            </S.ModalHeader>
            <S.ModalContent style={{ padding: '24px' }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                {/* 대화명 */}
                <div>
                  <div style={{
                    fontSize: '13px',
                    color: '#999',
                    marginBottom: '8px'
                  }}>
                    대화명
                  </div>
                  <div style={{
                    fontSize: '16px',
                    color: '#e0e0e0',
                    fontWeight: '500'
                  }}>
                    {selectedMemberDetail.name}
                  </div>
                </div>

                {/* 셰어노트 ID */}
                <div>
                  <div style={{
                    fontSize: '13px',
                    color: '#999',
                    marginBottom: '8px'
                  }}>
                    셰어노트 ID
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    background: 'rgba(74, 144, 226, 0.1)',
                    border: '1px solid rgba(74, 144, 226, 0.2)',
                    borderRadius: '8px'
                  }}>
                    <div style={{
                      flex: 1,
                      fontSize: '16px',
                      color: '#4a90e2',
                      fontWeight: '600',
                      letterSpacing: '1px'
                    }}>
                      {selectedMemberDetail.workspaceId === '정보 없음' ? '정보 없음' : selectedMemberDetail.workspaceId.replace('WS-', '')}
                    </div>
                    {selectedMemberDetail.workspaceId !== '정보 없음' && (
                      <button
                        onClick={handleCopyWorkspaceId}
                        style={{
                          padding: '6px 12px',
                          background: 'linear-gradient(135deg, #4a90e2, #357abd)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        복사
                      </button>
                    )}
                  </div>
                </div>

                {/* 차단된 사용자 알림 */}
                {blockedUserIds.includes(selectedMemberDetail.id) && (
                  <div style={{
                    padding: '12px 16px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#ef4444',
                    fontWeight: '500',
                    lineHeight: '1.5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ flexShrink: 0 }}>🚫</span>
                    <span>차단한 사용자입니다</span>
                  </div>
                )}

                {/* 안내 메시지 */}
                {selectedMemberDetail.workspaceId !== '정보 없음' && (
                  <div style={{
                    padding: '12px',
                    background: 'rgba(74, 144, 226, 0.1)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#4a90e2',
                    lineHeight: '1.5',
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <span style={{ flexShrink: 0 }}>💡</span>
                    <span>강퇴된 멤버는 다시 초대하여 참여시킬 수 있습니다</span>
                  </div>
                )}
              </div>
            </S.ModalContent>
            <S.ModalFooter>
              <S.ConfirmButton onClick={() => {
                setShowMemberDetailModal(false);
                setSelectedMemberDetail(null);
              }}>
                확인
              </S.ConfirmButton>
            </S.ModalFooter>
          </S.ModalContainer>
        </S.ModalOverlay>
      )}

      {/* 단체방 삭제 확인 모달 */}
      {showDeleteGroupModal && (
        <S.ModalOverlay onClick={() => setShowDeleteGroupModal(false)}>
          <S.ModalContainer onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <S.ModalHeader>
              <S.ModalTitle>단체방 삭제</S.ModalTitle>
              <S.CloseButton onClick={() => setShowDeleteGroupModal(false)}>
                <X size={20} />
              </S.CloseButton>
            </S.ModalHeader>
            <S.ModalContent style={{ padding: '24px' }}>
              <div style={{
                textAlign: 'center',
                fontSize: '15px',
                lineHeight: '1.6',
                color: '#e0e0e0'
              }}>
                정말로 <strong style={{ color: '#4a90e2' }}>"{chat.groupName}"</strong> 단체방을<br />
                삭제하시겠습니까?
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: 'rgba(229, 62, 62, 0.1)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#e53e3e'
                }}>
                  ⚠️ 삭제하면 모든 대화 내용을 다시 볼 수 없습니다
                </div>
              </div>
            </S.ModalContent>
            <S.ModalFooter>
              <S.CancelButton onClick={() => setShowDeleteGroupModal(false)}>
                취소
              </S.CancelButton>
              <S.ConfirmButton
                onClick={handleConfirmDeleteGroup}
                style={{
                  background: 'linear-gradient(135deg, #f56565, #e53e3e)',
                  boxShadow: '0 2px 8px rgba(245, 101, 101, 0.3)'
                }}
              >
                삭제하기
              </S.ConfirmButton>
            </S.ModalFooter>
          </S.ModalContainer>
        </S.ModalOverlay>
      )}

      {/* 단체방 삭제 최종 확인 모달 (2단계) */}
      {showDeleteGroupFinalModal && (
        <S.ModalOverlay onClick={() => setShowDeleteGroupFinalModal(false)}>
          <S.ModalContainer onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <S.ModalHeader>
              <S.ModalTitle>⚠️ 최종 확인</S.ModalTitle>
              <S.CloseButton onClick={() => setShowDeleteGroupFinalModal(false)}>
                <X size={20} />
              </S.CloseButton>
            </S.ModalHeader>
            <S.ModalContent style={{ padding: '24px' }}>
              <div style={{
                fontSize: '15px',
                lineHeight: '1.8',
                color: '#e0e0e0'
              }}>
                <div style={{
                  marginBottom: '20px',
                  textAlign: 'center',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#f56565'
                }}>
                  정말로 단체방을 삭제하시겠습니까?
                </div>

                <div style={{
                  padding: '16px',
                  background: 'rgba(74, 144, 226, 0.1)',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '8px', color: '#4a90e2' }}>
                    📢 삭제 안내
                  </div>
                  <div style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}>
                    <span style={{ flexShrink: 0 }}>•</span>
                    <span>현재 대화 중인 참여자에게 방 삭제 메시지가 전송됩니다</span>
                  </div>
                  <div style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}>
                    <span style={{ flexShrink: 0 }}>•</span>
                    <span>10초 카운트 후 방이 완전히 삭제됩니다</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ flexShrink: 0 }}>•</span>
                    <span>현재 방에 없는 참여자는 대화방 목록 접속 시 삭제 알림을 1회 확인할 수 있습니다</span>
                  </div>
                </div>

                <div style={{
                  padding: '12px',
                  background: 'rgba(229, 62, 62, 0.1)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#e53e3e',
                  textAlign: 'center'
                }}>
                  ⚠️ 삭제 후에는 모든 대화 내용을 복구할 수 없습니다
                </div>
              </div>
            </S.ModalContent>
            <S.ModalFooter>
              <S.CancelButton onClick={() => setShowDeleteGroupFinalModal(false)}>
                취소
              </S.CancelButton>
              <S.ConfirmButton
                onClick={handleFinalConfirmDeleteGroup}
                style={{
                  background: 'linear-gradient(135deg, #f56565, #e53e3e)',
                  boxShadow: '0 2px 8px rgba(245, 101, 101, 0.3)'
                }}
              >
                확인
              </S.ConfirmButton>
            </S.ModalFooter>
          </S.ModalContainer>
        </S.ModalOverlay>
      )}

      {/* 🆕 방 공개 설정 변경 모달 (1단계: 선택) */}
      {showRoomTypeModal && (
        <S.ModalOverlay onClick={() => { setShowRoomTypeModal(false); setSelectedRoomType(null); }}>
          <S.ModalContainer onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <S.ModalHeader>
              <S.ModalTitle>
                <Settings size={24} />
                방 공개 설정
              </S.ModalTitle>
              <S.CloseButton onClick={() => { setShowRoomTypeModal(false); setSelectedRoomType(null); }}>
                <X size={20} />
              </S.CloseButton>
            </S.ModalHeader>
            <S.ModalContent style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px', fontSize: '14px', color: '#aaa', lineHeight: '1.6' }}>
                현재: <strong style={{ color: '#4a90e2' }}>{chat.isPublic ? '🌐 공개방' : '🔒 비공개방'}</strong>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  onClick={() => setSelectedRoomType(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '16px',
                    background: (selectedRoomType === false) ? 'rgba(74, 144, 226, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: `2px solid ${(selectedRoomType === false) ? '#4a90e2' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: `2px solid ${(selectedRoomType === false) ? '#4a90e2' : '#666'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    {(selectedRoomType === false) && (
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: '#4a90e2'
                      }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#e0e0e0', marginBottom: '6px' }}>
                      🔒 비공개방
                    </div>
                    <div style={{ fontSize: '13px', color: '#888', lineHeight: '1.5' }}>
                      친구를 직접 초대해서 참여시킬 수 있습니다
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setSelectedRoomType(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '16px',
                    background: (selectedRoomType === true) ? 'rgba(74, 144, 226, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: `2px solid ${(selectedRoomType === true) ? '#4a90e2' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: `2px solid ${(selectedRoomType === true) ? '#4a90e2' : '#666'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    {(selectedRoomType === true) && (
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: '#4a90e2'
                      }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#e0e0e0', marginBottom: '6px' }}>
                      🌐 공개방
                    </div>
                    <div style={{ fontSize: '13px', color: '#888', lineHeight: '1.5' }}>
                      초대 코드를 공유하여 누구나 참여할 수 있습니다
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: '20px',
                padding: '12px',
                background: 'rgba(74, 144, 226, 0.1)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#4a90e2',
                lineHeight: '1.6'
              }}>
                <div style={{ marginBottom: '6px', paddingLeft: '1.5em', textIndent: '-1.5em' }}>
                  💡 비공개방에서 공개방으로 변경하면 초대 코드가 자동 생성됩니다.
                </div>
                <div style={{ paddingLeft: '1.5em', textIndent: '-1.5em' }}>
                  💡 공개방에서 비공개방으로 변경하면 초대 코드가 비활성화됩니다.
                </div>
              </div>
            </S.ModalContent>
            <S.ModalFooter>
              <S.CancelButton onClick={() => { setShowRoomTypeModal(false); setSelectedRoomType(null); }}>
                취소
              </S.CancelButton>
              <S.ConfirmButton
                onClick={handleRoomTypeSelectConfirm}
                disabled={selectedRoomType === null}
              >
                확인
              </S.ConfirmButton>
            </S.ModalFooter>
          </S.ModalContainer>
        </S.ModalOverlay>
      )}

      {/* 🆕 방 공개 설정 변경 최종 확인 모달 (2단계: 최종 확인) */}
      {showRoomTypeConfirmModal && (
        <S.ModalOverlay onClick={() => { setShowRoomTypeConfirmModal(false); setSelectedRoomType(null); }}>
          <S.ModalContainer onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <S.ModalHeader>
              <S.ModalTitle>
                <Settings size={24} />
                방 설정 변경 확인
              </S.ModalTitle>
              <S.CloseButton onClick={() => { setShowRoomTypeConfirmModal(false); setSelectedRoomType(null); }}>
                <X size={20} />
              </S.CloseButton>
            </S.ModalHeader>
            <S.ModalContent style={{ padding: '24px' }}>
              <div style={{
                textAlign: 'center',
                fontSize: '15px',
                lineHeight: '1.6',
                color: '#e0e0e0'
              }}>
                방 설정을 <strong style={{ color: '#4a90e2' }}>
                  {selectedRoomType ? '🌐 공개방' : '🔒 비공개방'}
                </strong>으로 변경할까요?
              </div>
              {selectedRoomType && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: 'rgba(74, 144, 226, 0.1)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#4a90e2',
                  lineHeight: '1.5',
                  textAlign: 'center'
                }}>
                  초대 코드가 자동으로 생성됩니다
                </div>
              )}
              {!selectedRoomType && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: 'rgba(74, 144, 226, 0.1)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#4a90e2',
                  lineHeight: '1.5',
                  textAlign: 'center'
                }}>
                  초대 코드가 비활성화됩니다
                </div>
              )}
            </S.ModalContent>
            <S.ModalFooter>
              <S.CancelButton onClick={() => { setShowRoomTypeConfirmModal(false); setSelectedRoomType(null); }}>
                취소
              </S.CancelButton>
              <S.ConfirmButton onClick={handleFinalConfirmRoomTypeChange}>
                확인
              </S.ConfirmButton>
            </S.ModalFooter>
          </S.ModalContainer>
        </S.ModalOverlay>
      )}

      {/* 방장 나가기 안내 모달 */}
      {showOwnerLeaveGuideModal && (
        <S.ModalOverlay onClick={() => setShowOwnerLeaveGuideModal(false)}>
          <S.ModalContainer onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <S.ModalHeader>
              <S.ModalTitle>채팅방 나가기</S.ModalTitle>
              <S.CloseButton onClick={() => setShowOwnerLeaveGuideModal(false)}>
                <X size={20} />
              </S.CloseButton>
            </S.ModalHeader>
            <S.ModalContent style={{ padding: '24px' }}>
              <div style={{
                textAlign: 'center',
                fontSize: '15px',
                lineHeight: '1.6',
                color: '#e0e0e0'
              }}>
                방장은 다른 참여자에게 방장권한을 위임한 후<br />
                단체방에서 나갈 수 있습니다
              </div>
            </S.ModalContent>
            <S.ModalFooter>
              <S.CancelButton onClick={() => setShowOwnerLeaveGuideModal(false)}>
                취소
              </S.CancelButton>
              <S.ConfirmButton onClick={handleStartTransferForLeave}>
                위임하기
              </S.ConfirmButton>
            </S.ModalFooter>
          </S.ModalContainer>
        </S.ModalOverlay>
      )}

      {/* 그룹 나가기 확인 모달 */}
      {showLeaveGroupModal && (
        <S.ModalOverlay onClick={() => setShowLeaveGroupModal(false)}>
          <S.ModalContainer onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <S.ModalHeader>
              <S.ModalTitle>채팅방 나가기</S.ModalTitle>
              <S.CloseButton onClick={() => setShowLeaveGroupModal(false)}>
                <X size={20} />
              </S.CloseButton>
            </S.ModalHeader>
            <S.ModalContent style={{ padding: '24px' }}>
              <div style={{
                textAlign: 'center',
                fontSize: '15px',
                lineHeight: '1.6',
                color: '#e0e0e0'
              }}>
                정말로 <strong style={{ color: '#4a90e2' }}>"{chat.groupName}"</strong> 채팅방을<br />
                나가시겠습니까?
                {isLastMember ? (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: 'rgba(229, 62, 62, 0.1)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#e53e3e',
                    lineHeight: '1.5'
                  }}>
                    ⚠️ 마지막 멤버가 나가면 이 방은 삭제되며<br />
                    모든 대화 내용을 다시 볼 수 없습니다
                  </div>
                ) : (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: 'rgba(255, 165, 0, 0.1)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#ffa500'
                  }}>
                    나간 후에는 초대를 통해서만 다시 참여할 수 있습니다
                  </div>
                )}
              </div>
            </S.ModalContent>
            <S.ModalFooter>
              <S.CancelButton onClick={() => setShowLeaveGroupModal(false)}>
                취소
              </S.CancelButton>
              <S.ConfirmButton
                onClick={handleConfirmLeaveGroup}
                style={{
                  background: 'linear-gradient(135deg, #f56565, #e53e3e)',
                  boxShadow: '0 2px 8px rgba(245, 101, 101, 0.3)'
                }}
              >
                나가기
              </S.ConfirmButton>
            </S.ModalFooter>
          </S.ModalContainer>
        </S.ModalOverlay>
      )}

      {/* 방장 위임 최종 확인 모달 */}
      {/* 부방장 임명 모달 */}
      {showAppointSubManagerModal && (
        <AppointSubManagerModal
          chat={chat}
          members={Object.entries(chat.membersInfo || {}).map(([userId, memberInfo]) => ({
            userId,
            ...memberInfo,
            // 최신 닉네임으로 덮어쓰기 (1순위: 앱 닉네임, 2순위: 구글 displayName, 3순위: 기존 displayName)
            displayName: userNicknames[userId] || userDisplayNames[userId] || memberInfo.displayName           }))}
          currentUserId={currentUserId}
          onClose={() => setShowAppointSubManagerModal(false)}
          onAppoint={handleAppointSubManager}
          onRemoveSubManager={handleRemoveSubManager}
        />
      )}

      {showTransferConfirmModal && selectedMemberToTransfer && (
        <S.ModalOverlay onClick={() => setShowTransferConfirmModal(false)}>
          <S.ModalContainer onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <S.ModalHeader>
              <S.ModalTitle>방장 위임 확인</S.ModalTitle>
              <S.CloseButton onClick={() => setShowTransferConfirmModal(false)}>
                <X size={20} />
              </S.CloseButton>
            </S.ModalHeader>
            <S.ModalContent style={{ padding: '24px' }}>
              <div style={{
                textAlign: 'center',
                fontSize: '15px',
                lineHeight: '1.6',
                color: '#e0e0e0'
              }}>
                <strong style={{ color: '#4a90e2' }}>
                  {chat.membersInfo?.[selectedMemberToTransfer]?.displayName || '알 수 없음'}
                </strong>님에게<br />
                방장 권한을 위임하시겠습니까?
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: 'rgba(255, 165, 0, 0.1)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#ffa500'
                }}>
                  위임하면 당신은 일반 참여자가 됩니다
                </div>
              </div>
            </S.ModalContent>
            <S.ModalFooter>
              <S.CancelButton onClick={() => setShowTransferConfirmModal(false)}>
                취소
              </S.CancelButton>
              <S.ConfirmButton
                onClick={handleConfirmTransferOwnership}
                disabled={loadingTransfer}
              >
                {loadingTransfer ? '위임 중...' : '위임하기'}
              </S.ConfirmButton>
            </S.ModalFooter>
          </S.ModalContainer>
        </S.ModalOverlay>
      )}

      {/* 프로필 이미지 업로드용 숨겨진 input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageSelect}
      />

      {/* 전체 메시지 보기 모달 */}
      {showFullMessageModal && (
        <S.ModalOverlay onClick={() => setShowFullMessageModal(false)}>
          <S.ModalContainer onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '95vh' }}>
            <S.ModalHeader>
              <S.ModalTitle>전체 메시지</S.ModalTitle>
              <S.IconButton onClick={() => setShowFullMessageModal(false)}>
                <X size={20} />
              </S.IconButton>
            </S.ModalHeader>
            <S.ModalContent style={{ maxHeight: '85vh', overflow: 'auto' }}>
              <div style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: '1.6',
                fontSize: '14px',
                color: '#e0e0e0'
              }}>
                {fullMessageContent}
              </div>
            </S.ModalContent>
          </S.ModalContainer>
        </S.ModalOverlay>
      )}

      {/* 차단 사용자 있는 방 참여 확인 모달 */}
      {showBlockedJoinConfirm.show && (
        <S.ModalOverlay onClick={() => setShowBlockedJoinConfirm({ show: false, blockedNames: '' })}>
          <S.ModalContainer onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <S.ModalHeader>
              <S.ModalTitle>참여 확인</S.ModalTitle>
              <S.IconButton onClick={() => setShowBlockedJoinConfirm({ show: false, blockedNames: '' })}>
                <X size={20} />
              </S.IconButton>
            </S.ModalHeader>
            <S.ModalContent>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                <div style={{ color: '#e0e0e0', marginBottom: '12px', fontWeight: '600' }}>
                  참여자 중에 차단한 사용자가 있습니다
                </div>
                <div style={{ color: '#ff9800', marginBottom: '16px' }}>
                  차단한 사용자: {showBlockedJoinConfirm.blockedNames}
                </div>
                <div style={{ color: '#888', fontSize: '13px', lineHeight: '1.6' }}>
                  이 방에 참여하시겠습니까?<br />
                  (참여하면 이 방에서는 서로 대화할 수 있습니다)
                </div>
              </div>
            </S.ModalContent>
            <S.ModalFooter>
              <S.CancelButton onClick={() => setShowBlockedJoinConfirm({ show: false, blockedNames: '' })}>
                취소
              </S.CancelButton>
              <S.ConfirmButton onClick={() => {
                setShowBlockedJoinConfirm({ show: false, blockedNames: '' });
                handleAcceptInvitation(true);
              }}>
                참여하기
              </S.ConfirmButton>
            </S.ModalFooter>
          </S.ModalContainer>
        </S.ModalOverlay>
      )}

      {/* 초대 취소 확인 모달 */}
      {showCancelInviteConfirm.show && (
        <S.ModalOverlay onClick={() => setShowCancelInviteConfirm({ show: false, targetId: null, targetName: '' })}>
          <S.ModalContainer onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <S.ModalHeader>
              <S.ModalTitle>초대 취소</S.ModalTitle>
              <S.IconButton onClick={() => setShowCancelInviteConfirm({ show: false, targetId: null, targetName: '' })}>
                <X size={20} />
              </S.IconButton>
            </S.ModalHeader>
            <S.ModalContent>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
                <div style={{ color: '#e0e0e0', marginBottom: '16px' }}>
                  <strong>{showCancelInviteConfirm.targetName}</strong>님의 초대를 취소하시겠습니까?
                </div>
                <div style={{ color: '#888', fontSize: '13px' }}>
                  목록에서 완전히 제거됩니다.
                </div>
              </div>
            </S.ModalContent>
            <S.ModalFooter>
              <S.CancelButton onClick={() => setShowCancelInviteConfirm({ show: false, targetId: null, targetName: '' })}>
                아니오
              </S.CancelButton>
              <S.ConfirmButton onClick={confirmCancelInvitation}>
                취소하기
              </S.ConfirmButton>
            </S.ModalFooter>
          </S.ModalContainer>
        </S.ModalOverlay>
      )}

      {/* 🔊 현 단체방 알림음 설정 모달 */}
      {/* 그룹명 변경 모달 */}
      {showRenameRoomModal && (
        <S.ModalOverlay onClick={() => setShowRenameRoomModal(false)}>
          <S.ModalContainer onClick={(e) => e.stopPropagation()}>
            <S.ModalHeader>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#ffffff' }}>그룹명 변경</h3>
              <S.CloseButton onClick={() => setShowRenameRoomModal(false)}>
                <X size={20} />
              </S.CloseButton>
            </S.ModalHeader>
            <S.ModalContent>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  color: '#e0e0e0',
                  fontWeight: '500'
                }}>
                  새 그룹명
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleRenameRoom();
                      }
                    }}
                    placeholder="그룹명을 입력하세요 (최대 12자)"
                    maxLength={12}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '12px',
                      paddingRight: newRoomName.length > 0 ? '40px' : '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  {newRoomName.length > 0 && (
                    <button
                      onClick={() => setNewRoomName('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#888',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                        e.target.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.target.style.color = '#888';
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div style={{
                  marginTop: '6px',
                  fontSize: '12px',
                  color: '#888',
                  textAlign: 'right'
                }}>
                  {newRoomName.length} / 12
                </div>
              </div>
              <div style={{
                padding: '12px',
                background: 'rgba(102, 126, 234, 0.1)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#888',
                lineHeight: '1.5'
              }}>
                • 그룹명은 한글기준 12자까지 가능합니다<br />
                • 특수문자와 이모지를 사용할 수 있습니다
              </div>
            </S.ModalContent>
            <S.ModalFooter>
              <S.CancelButton onClick={() => setShowRenameRoomModal(false)}>
                취소
              </S.CancelButton>
              <S.ConfirmButton onClick={handleRenameRoom}>
                변경
              </S.ConfirmButton>
            </S.ModalFooter>
          </S.ModalContainer>
        </S.ModalOverlay>
      )}

      {/* 사용자 프로필 모달 */}
      <UserProfileModal
        isOpen={userProfileModal.show}
        onClose={() => setUserProfileModal({ show: false, userId: null, userName: '', profilePicture: null })}
        userId={userProfileModal.userId}
        userName={userProfileModal.userName}
        profilePicture={userProfileModal.profilePicture}
        isGroupChat={chat?.type === 'group'}
        onStartDM={handleStartDMFromProfile}
        onBlockUser={handleBlockFromProfile}
        onUnblockUser={handleUnblockFromProfile}
        blockedUserIds={blockedUserIds}
        currentUserId={currentUserId}
        showToast={showToast}
      />

      {/* 차단 확인 모달 */}
      {blockConfirmModal.show && (
        <S.ModalOverlay onClick={() => setBlockConfirmModal({ show: false, userId: null, userName: '', isUnblock: false })}>
          <S.ModalContainer onClick={(e) => e.stopPropagation()}>
            <S.ModalHeader>
              <S.ModalTitle>
                {blockConfirmModal.isUnblock ? '차단 해제' : '사용자 차단'}
              </S.ModalTitle>
            </S.ModalHeader>
            <S.ModalContent>
              {blockConfirmModal.isUnblock ? (
                <div>
                  <strong>{blockConfirmModal.userName}</strong>님을 차단 해제하시겠습니까?
                  <br /><br />
                  차단을 해제하면 이 사용자와 다시 상호작용할 수 있습니다.
                </div>
              ) : (
                <div>
                  <strong>{blockConfirmModal.userName}</strong>님을 차단하시겠습니까?
                  <br /><br />
                  차단하면:
                  <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: '1.6' }}>
                    <li>친구 목록에서 제거됩니다</li>
                    <li>1:1 대화에서 메시지를 주고받을 수 없습니다</li>
                    <li>단체방에서 상대의 메시지가 차단됩니다</li>
                  </ul>
                  <div style={{ marginTop: '12px', marginLeft: '8px', fontSize: '13px', color: '#ff9800', lineHeight: '1.5', paddingLeft: '1.5em', textIndent: '-1.5em' }}>
                    ⚠️ 주의: 단체방에서 차단된 상대가 내 메시지를 볼 수 있습니다
                  </div>
                </div>
              )}
            </S.ModalContent>
            <S.ModalFooter>
              <S.CancelButton onClick={() => setBlockConfirmModal({ show: false, userId: null, userName: '', isUnblock: false })}>
                취소
              </S.CancelButton>
              <S.ConfirmButton onClick={handleConfirmBlock}>
                {blockConfirmModal.isUnblock ? '차단 해제' : '차단하기'}
              </S.ConfirmButton>
            </S.ModalFooter>
          </S.ModalContainer>
        </S.ModalOverlay>
      )}
    </S.FullScreenContainer>,
    document.body
  );
};

export default ChatRoom;
