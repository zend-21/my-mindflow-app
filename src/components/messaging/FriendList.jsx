// 👥 친구 탭 - 친구 관리 (카카오톡 스타일)
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Search, UserPlus, MessageCircle, UserMinus, /* Shield, */ ChevronRight, X, UserCheck, MoreHorizontal, Copy, Ban } from 'lucide-react'; // Shield는 MVP에서 본인인증 제외로 미사용
import { getMyFriends, removeFriend, getFriendRequests, acceptFriendRequest, rejectFriendRequest } from '../../services/friendService';
// import { checkVerificationStatus, checkVerificationStatusBatch } from '../../services/verificationService';
import { createOrGetDMRoom } from '../../services/directMessageService';
// import VerificationModal from './VerificationModal'; // MVP에서 제외
import ChatRoom from './ChatRoom';
import AddFriendModal from './AddFriendModal';
import DeletedFriendsModal from './DeletedFriendsModal';
import BlockedUsersModal from './BlockedUsersModal';

// 컨테이너
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: transparent;
`;

// 헤더 (검색 + 설정)
const HeaderSection = styled.div`
  padding: 12px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.02);
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SearchInput = styled.input`
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  padding: 10px 16px 10px 40px;
  border-radius: 20px;
  font-size: 14px;
  transition: all 0.2s;

  &::placeholder {
    color: #666;
  }

  &:focus {
    outline: none;
    border-color: #4a90e2;
    background: rgba(255, 255, 255, 0.08);
  }
`;

const SearchInputWrapper = styled.div`
  position: relative;
  flex: 1;
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  width: 18px;
  height: 18px;
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  color: #888;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
  }
`;

// 내 프로필 섹션
const MyProfileSection = styled.div`
  padding: 20px;
  border-bottom: 8px solid rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }
`;

const MyProfileContent = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const MyAvatar = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: ${props => props.$color || '#5f6368'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.1);
  position: relative;
`;

const VerifiedBadge = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4a90e2, #357abd);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #1a1a1a;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.4);
`;

const MyInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const MyName = styled.div`
  font-size: 17px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const MyStatus = styled.div`
  font-size: 13px;
  color: #888;
`;

const VerifyButton = styled.button`
  background: rgba(74, 144, 226, 0.15);
  border: 1px solid rgba(74, 144, 226, 0.3);
  color: #4a90e2;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background: rgba(74, 144, 226, 0.25);
    border-color: rgba(74, 144, 226, 0.5);
  }
`;

// 친구 목록
const FriendListContainer = styled.div`
  flex: 1;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
`;

const SectionHeader = styled.div`
  padding: 16px 20px 8px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const SectionTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
`;

const FriendCount = styled.span`
  color: #4a90e2;
  margin-left: 6px;
`;

const SectionActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MoreButton = styled.button`
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  transition: color 0.2s;

  &:hover {
    color: #fff;
  }
`;

// 친구 아이템
const FriendItem = styled.div`
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  &:active {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const Avatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${props => props.$color || '#5f6368'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.1);
  position: relative;
`;

const FriendInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FriendName = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const FriendStatus = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 2px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  position: relative;
`;

const ActionButton = styled.button`
  background: ${props => props.$variant === 'primary' ? 'rgba(74, 144, 226, 0.2)' : 'rgba(255, 107, 107, 0.2)'};
  border: 1px solid ${props => props.$variant === 'primary' ? 'rgba(74, 144, 226, 0.4)' : 'rgba(255, 107, 107, 0.4)'};
  color: ${props => props.$variant === 'primary' ? '#4a90e2' : '#ff6b6b'};
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    opacity: 0.8;
  }
`;

const MoreMenuButton = styled.button`
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: #2a2a2a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 160px;
  z-index: 1000;
  overflow: hidden;
  animation: slideDown 0.2s ease-out;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  color: ${props => props.$danger ? '#ff6b6b' : '#e0e0e0'};
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 10px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
`;

// 빈 상태
const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  text-align: center;
  color: #666;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #888;
  margin-bottom: 8px;
`;

const EmptyDescription = styled.div`
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 20px;
`;

const AddFriendButton = styled.button`
  background: linear-gradient(135deg, #4a90e2, #357abd);
  border: none;
  color: #ffffff;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(74, 144, 226, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

// 모달 관련 스타일
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
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

const ModalContainer = styled.div`
  background: #2a2a2a;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ModalHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;

  &:hover {
    color: #fff;
  }
`;

const ModalContent = styled.div`
  padding: 24px;
`;

const ModalFooter = styled.div`
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 10px;
  justify-content: flex-end;
`;

const CancelButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const ConfirmButton = styled.button`
  background: linear-gradient(135deg, #f56565, #e53e3e);
  border: none;
  color: #ffffff;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(245, 101, 101, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const FriendList = ({ showToast, memos, requirePhoneAuth }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState(null);
  // MVP에서 본인인증 제외
  // const [isVerified, setIsVerified] = useState(false);
  // const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [showDeleteFriendModal, setShowDeleteFriendModal] = useState(false);
  const [friendToDelete, setFriendToDelete] = useState(null);
  const [deletingFriend, setDeletingFriend] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null); // 드롭다운 메뉴 열림 상태
  const [showMyProfileMenu, setShowMyProfileMenu] = useState(false); // 내 프로필 메뉴
  const [showDeletedFriendsModal, setShowDeletedFriendsModal] = useState(false); // 친구삭제 목록 모달
  const [showBlockedUsersModal, setShowBlockedUsersModal] = useState(false); // 차단 목록 모달

  useEffect(() => {
    loadMyProfile();
    loadFriends();
    loadFriendRequests();
  }, []);

  // 드롭다운 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) {
        setOpenMenuId(null);
      }
      if (showMyProfileMenu) {
        setShowMyProfileMenu(false);
      }
    };

    if (openMenuId || showMyProfileMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openMenuId, showMyProfileMenu]);

  const loadMyProfile = async () => {
    try {
      const userId = localStorage.getItem('firebaseUserId');

      // ⚡ 최적화: localStorage 우선, Firestore는 fallback
      let nickname = localStorage.getItem('userNickname') || '나';

      // localStorage에 닉네임이 없는 경우에만 Firestore 조회
      if (nickname === '나') {
        try {
          const { getUserNickname } = await import('../../services/nicknameService');
          const firestoreNickname = await getUserNickname(userId);
          if (firestoreNickname) {
            nickname = firestoreNickname;
            // localStorage에 캐싱
            localStorage.setItem('userNickname', firestoreNickname);
          }
        } catch (error) {
          console.error('닉네임 로드 실패:', error);
        }
      }

      // 본인인증 상태 확인 - MVP에서 제외
      // const verificationStatus = await checkVerificationStatus(userId);
      // setIsVerified(verificationStatus.verified);

      setMyProfile({
        nickname,
        userId
      });
    } catch (error) {
      console.error('프로필 로드 오류:', error);
    }
  };

  const loadFriends = async () => {
    try {
      const userId = localStorage.getItem('firebaseUserId');
      const friendsList = await getMyFriends(userId);

      console.log('📋 [DEBUG] 내 친구 목록:', friendsList);
      console.log('📋 [DEBUG] Firebase 경로: users/' + userId + '/friends');

      // ⚡ 배치로 모든 친구의 인증 상태 확인 (N개 개별 조회 → 1회 배치 조회)
      // MVP에서 본인인증 제외
      // const friendIds = friendsList.map(f => f.friendId);
      // const verificationMap = await checkVerificationStatusBatch(friendIds);

      // 인증 상태를 친구 정보에 병합
      // const friendsWithVerification = friendsList.map(friend => ({
      //   ...friend,
      //   verified: verificationMap.get(friend.friendId)?.verified || false
      // }));

      setFriends(friendsList); // 인증 상태 없이 그대로 사용
      setLoading(false);
    } catch (error) {
      console.error('친구 목록 조회 오류:', error);
      setFriends([]);
      setLoading(false);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const userId = localStorage.getItem('firebaseUserId');
      const requestsList = await getFriendRequests(userId);

      console.log('📬 [DEBUG] 친구 요청 목록:', requestsList);
      console.log('📬 [DEBUG] Firebase 경로: users/' + userId + '/friendRequests');

      setFriendRequests(requestsList);
    } catch (error) {
      console.error('친구 요청 목록 조회 오류:', error);
      setFriendRequests([]);
    }
  };

  // 검색 필터링
  const filteredFriends = friends.filter(friend => {
    if (!searchQuery) return true;

    const name = friend.friendName?.toLowerCase() || '';
    const wsCode = friend.friendWorkspaceCode?.toLowerCase() || '';

    return name.includes(searchQuery.toLowerCase()) ||
           wsCode.includes(searchQuery.toLowerCase());
  });

  const handleStartChat = async (friend) => {
    try {
      showToast?.('대화방을 여는 중...');

      // 1:1 대화방 생성 또는 가져오기
      const result = await createOrGetDMRoom(friend.friendId, {
        displayName: friend.friendName,
        email: friend.friendEmail,
        photoURL: ''
      });

      if (result.success) {
        // ChatRoom 열기
        setSelectedChat({
          id: result.roomId,
          type: 'dm',
          ...result.data
        });
      }
    } catch (error) {
      console.error('대화 시작 오류:', error);
      showToast?.('대화 시작에 실패했습니다');
    }
  };

  const handleRemoveFriend = (friend) => {
    setFriendToDelete(friend);
    setShowDeleteFriendModal(true);
  };

  const confirmDeleteFriend = async () => {
    if (!friendToDelete) return;

    setDeletingFriend(true);
    try {
      const userId = localStorage.getItem('firebaseUserId');
      const result = await removeFriend(userId, friendToDelete.friendId);

      if (result.success) {
        showToast?.(`${friendToDelete.friendName || '친구'}를 삭제했습니다`);
        // 친구 목록 새로고침
        await loadFriends();
        setShowDeleteFriendModal(false);
        setFriendToDelete(null);
      } else {
        showToast?.(result.error || '친구 삭제에 실패했습니다');
      }
    } catch (error) {
      console.error('친구 삭제 오류:', error);
      showToast?.('친구 삭제에 실패했습니다');
    } finally {
      setDeletingFriend(false);
    }
  };

  const handleAcceptFriendRequest = async (request) => {
    try {
      const userId = localStorage.getItem('firebaseUserId');
      const result = await acceptFriendRequest(userId, request.requesterId);

      if (result.success) {
        showToast?.(`${request.requesterName}님을 친구로 추가했습니다`);
        // 친구 목록 및 요청 목록 새로고침
        await loadFriends();
        await loadFriendRequests();
      } else {
        showToast?.(result.error || '친구 추가에 실패했습니다');
      }
    } catch (error) {
      console.error('친구 요청 수락 오류:', error);
      showToast?.('친구 추가에 실패했습니다');
    }
  };

  const handleRejectFriendRequest = async (request) => {
    try {
      const userId = localStorage.getItem('firebaseUserId');
      const result = await rejectFriendRequest(userId, request.requesterId);

      if (result.success) {
        showToast?.('친구 요청을 숨겼습니다');
        await loadFriendRequests();
      } else {
        showToast?.(result.error || '요청 숨기기에 실패했습니다');
      }
    } catch (error) {
      console.error('친구 요청 거절 오류:', error);
      showToast?.('요청 숨기기에 실패했습니다');
    }
  };

  const handleCopyWorkspaceCode = async (workspaceCode, friendName) => {
    try {
      await navigator.clipboard.writeText(workspaceCode);
      showToast?.(`${friendName}님의 아이디를 복사했습니다`);
      setOpenMenuId(null);
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
      showToast?.('아이디 복사에 실패했습니다');
    }
  };

  const handleBlockFriend = (friend) => {
    // 차단 기능 구현 예정
    showToast?.('차단 기능은 준비 중입니다');
    setOpenMenuId(null);
  };

  const handleMenuToggle = (friendId, e) => {
    e.stopPropagation(); // 부모 클릭 이벤트 방지
    setOpenMenuId(openMenuId === friendId ? null : friendId);
  };

  const handleAddFriend = () => {
    // 🔐 휴대폰 인증 필요
    if (requirePhoneAuth) {
      requirePhoneAuth('친구 추가', () => {
        // 인증 후 실행
        setIsAddFriendModalOpen(true);
      });
    } else {
      // requirePhoneAuth가 없으면 바로 실행 (fallback)
      setIsAddFriendModalOpen(true);
    }
  };

  // 나와의 채팅 (나에게 보내기)
  const handleOpenMeChat = async () => {
    try {
      const userId = localStorage.getItem('firebaseUserId');
      showToast?.('나와의 대화방을 여는 중...');

      // 나 자신과의 1:1 대화방 생성
      const result = await createOrGetDMRoom(userId, {
        displayName: myProfile.nickname || '나',
        email: '',
        photoURL: ''
      });

      if (result.success) {
        setSelectedChat({
          id: result.roomId,
          type: 'dm',
          ...result.data
        });
      }
    } catch (error) {
      console.error('나와의 대화 시작 오류:', error);
      showToast?.('대화 시작에 실패했습니다');
    }
  };

  // 프로필 메뉴 토글
  const handleToggleMyProfileMenu = (e) => {
    e.stopPropagation();
    setShowMyProfileMenu(!showMyProfileMenu);
  };

  // 전체 친구 삭제 (데이터 초기화)
  const handleClearAllFriends = async () => {
    if (!window.confirm('정말로 모든 친구를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      const userId = localStorage.getItem('firebaseUserId');
      showToast?.('친구 목록을 초기화하는 중...');

      // 모든 친구 삭제
      for (const friend of friends) {
        await removeFriend(userId, friend.friendId);
      }

      showToast?.('✅ 모든 친구가 삭제되었습니다');
      await loadFriends();
      setShowMyProfileMenu(false);
    } catch (error) {
      console.error('친구 목록 초기화 오류:', error);
      showToast?.('❌ 초기화 중 오류가 발생했습니다');
    }
  };

  // 아바타 색상 생성 - 모던하고 심플한 단색 사용 (기본값)
  const getAvatarColor = () => {
    // 모던한 회색 계열 단색 (사용자가 색상을 지정하지 않은 경우의 기본값)
    return '#5f6368';
  };

  if (loading) {
    return (
      <Container>
        <EmptyState>
          <EmptyIcon>👥</EmptyIcon>
          <EmptyTitle>친구 목록을 불러오는 중...</EmptyTitle>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      {/* 헤더 */}
      <HeaderSection>
        <SearchInputWrapper>
          <SearchIcon />
          <SearchInput
            type="text"
            placeholder="친구 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchInputWrapper>
        <IconButton onClick={handleAddFriend} title="친구 추가">
          <UserPlus size={20} />
        </IconButton>
      </HeaderSection>

      {/* 내 프로필 */}
      {myProfile && (
        <MyProfileSection style={{ position: 'relative' }}>
          <MyProfileContent onClick={handleOpenMeChat} style={{ cursor: 'pointer' }}>
            <MyAvatar $color={getAvatarColor(myProfile.userId)}>
              {myProfile.nickname?.charAt(0).toUpperCase() || '나'}
            </MyAvatar>
            <MyInfo>
              <MyName>{myProfile.nickname} (나)</MyName>
            </MyInfo>
            <ChevronRight
              size={20}
              color="#666"
              onClick={handleToggleMyProfileMenu}
              style={{ cursor: 'pointer' }}
            />
          </MyProfileContent>

          {/* 프로필 메뉴 드롭다운 */}
          {showMyProfileMenu && (
            <DropdownMenu
              onClick={(e) => e.stopPropagation()}
              style={{ top: '100%', right: '10px', marginTop: '4px' }}
            >
              <DropdownItem onClick={() => {
                setShowMyProfileMenu(false);
                handleClearAllFriends();
              }}>
                <UserMinus size={16} />
                전체 친구 삭제
              </DropdownItem>
              <DropdownItem onClick={() => {
                setShowMyProfileMenu(false);
                setShowDeletedFriendsModal(true);
              }}>
                <UserMinus size={16} />
                친구삭제 목록
              </DropdownItem>
              <DropdownItem onClick={() => {
                setShowMyProfileMenu(false);
                setShowBlockedUsersModal(true);
              }}>
                <Ban size={16} />
                차단 목록
              </DropdownItem>
            </DropdownMenu>
          )}
        </MyProfileSection>
      )}

      {/* 친구 목록 */}
      <FriendListContainer>
        {/* 나를 친구 추가한 사람 섹션 */}
        {friendRequests.length > 0 && (
          <>
            <SectionHeader>
              <SectionTitle>
                나를 친구 추가한 사람
                <FriendCount>{friendRequests.length}</FriendCount>
              </SectionTitle>
              <SectionActions>
                <MoreButton>
                  <MoreHorizontal size={18} />
                </MoreButton>
              </SectionActions>
            </SectionHeader>

            {friendRequests.map(request => (
              <FriendItem key={request.id}>
                <Avatar $color={getAvatarColor(request.requesterId)}>
                  {request.requesterName?.charAt(0).toUpperCase() || '?'}
                </Avatar>

                <FriendInfo>
                  <FriendName>
                    {request.requesterName || '익명'}
                  </FriendName>
                  <FriendStatus>
                    {request.requesterWorkspaceCode?.replace('WS-', '') || '-'}
                  </FriendStatus>
                </FriendInfo>

                <ActionButtons>
                  <ActionButton
                    $variant="primary"
                    onClick={() => handleAcceptFriendRequest(request)}
                  >
                    <UserCheck size={14} />
                  </ActionButton>
                  <ActionButton
                    onClick={() => handleRejectFriendRequest(request)}
                  >
                    <X size={14} />
                  </ActionButton>
                </ActionButtons>
              </FriendItem>
            ))}
          </>
        )}

        {/* 친구 섹션 */}
        {filteredFriends.length === 0 && friendRequests.length === 0 ? (
          <EmptyState>
            <EmptyIcon>👥</EmptyIcon>
            <EmptyTitle>
              {searchQuery ? '검색 결과 없음' : '아직 친구가 없습니다'}
            </EmptyTitle>
            <EmptyDescription>
              {searchQuery
                ? '다른 검색어를 입력해보세요'
                : 'WS 코드를 입력하거나 QR 스캔으로\n친구를 추가해보세요'}
            </EmptyDescription>
            {!searchQuery && (
              <AddFriendButton onClick={handleAddFriend}>
                <UserPlus size={18} />
                친구 추가
              </AddFriendButton>
            )}
          </EmptyState>
        ) : filteredFriends.length > 0 ? (
          <>
            <SectionHeader>
              <SectionTitle>
                친구
                <FriendCount>{filteredFriends.length}</FriendCount>
              </SectionTitle>
            </SectionHeader>

            {filteredFriends.map(friend => (
              <FriendItem
                key={friend.id}
                onClick={() => handleStartChat(friend)}
                style={{ cursor: 'pointer' }}
              >
                <Avatar $color={getAvatarColor(friend.friendId)}>
                  {friend.friendName?.charAt(0).toUpperCase() || '?'}
                </Avatar>

                <FriendInfo>
                  <FriendName>
                    {friend.friendName || '익명'}
                  </FriendName>
                  <FriendStatus>
                    {friend.friendWorkspaceCode?.replace('WS-', '') || '-'}
                  </FriendStatus>
                </FriendInfo>

                <ActionButtons>
                  <MoreMenuButton onClick={(e) => handleMenuToggle(friend.id, e)}>
                    <MoreHorizontal size={18} />
                  </MoreMenuButton>

                  {openMenuId === friend.id && (
                    <DropdownMenu onClick={(e) => e.stopPropagation()}>
                      <DropdownItem onClick={() => handleCopyWorkspaceCode(friend.friendWorkspaceCode, friend.friendName)}>
                        <Copy size={16} />
                        아이디 복사
                      </DropdownItem>
                      <DropdownItem
                        $danger
                        onClick={() => {
                          setOpenMenuId(null);
                          handleRemoveFriend(friend);
                        }}
                      >
                        <UserMinus size={16} />
                        친구 삭제
                      </DropdownItem>
                      <DropdownItem
                        $danger
                        onClick={() => handleBlockFriend(friend)}
                      >
                        <Ban size={16} />
                        차단
                      </DropdownItem>
                    </DropdownMenu>
                  )}
                </ActionButtons>
              </FriendItem>
            ))}
          </>
        ) : null}
      </FriendListContainer>

      {/* 본인인증 모달 - MVP에서 제외
      {showVerificationModal && (
        <VerificationModal
          onClose={() => setShowVerificationModal(false)}
          onVerified={() => {
            // ⚡ 최적화: 불필요한 재로드 제거
            // 본인 인증 완료 시 상태만 업데이트 (Firestore 조회 불필요)
            setIsVerified(true);
            setShowVerificationModal(false);
          }}
          showToast={showToast}
        />
      )}
      */}

      {/* 채팅방 */}
      {selectedChat && (
        <ChatRoom
          chat={selectedChat}
          onClose={() => setSelectedChat(null)}
          showToast={showToast}
          memos={memos}
        />
      )}

      {/* 친구 추가 모달 */}
      {isAddFriendModalOpen && (
        <AddFriendModal
          onClose={() => setIsAddFriendModalOpen(false)}
          userId={myProfile?.userId}
          showToast={showToast}
          onFriendAdded={loadFriends}
        />
      )}

      {/* 친구 삭제 확인 모달 */}
      {showDeleteFriendModal && friendToDelete && (
        <ModalOverlay onClick={() => !deletingFriend && setShowDeleteFriendModal(false)}>
          <ModalContainer onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>친구 삭제</ModalTitle>
              <CloseButton onClick={() => !deletingFriend && setShowDeleteFriendModal(false)}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            <ModalContent>
              <div style={{
                textAlign: 'center',
                fontSize: '15px',
                lineHeight: '1.6',
                color: '#e0e0e0'
              }}>
                <strong style={{ color: '#4a90e2' }}>
                  {friendToDelete.friendName || '이 친구'}
                </strong>를<br />
                친구 목록에서 삭제하시겠습니까?
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: 'rgba(136, 136, 136, 0.1)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#999'
                }}>
                  상대방은 여전히 회원님을 친구로 볼 수 있습니다
                </div>
              </div>
            </ModalContent>
            <ModalFooter>
              <CancelButton
                onClick={() => setShowDeleteFriendModal(false)}
                disabled={deletingFriend}
              >
                취소
              </CancelButton>
              <ConfirmButton
                onClick={confirmDeleteFriend}
                disabled={deletingFriend}
              >
                {deletingFriend ? '삭제 중...' : '삭제하기'}
              </ConfirmButton>
            </ModalFooter>
          </ModalContainer>
        </ModalOverlay>
      )}

      {/* 친구삭제 목록 모달 */}
      <DeletedFriendsModal
        isOpen={showDeletedFriendsModal}
        onClose={() => setShowDeletedFriendsModal(false)}
        showToast={showToast}
        onFriendAdded={loadFriends}
      />

      {/* 차단 목록 모달 */}
      <BlockedUsersModal
        isOpen={showBlockedUsersModal}
        onClose={() => setShowBlockedUsersModal(false)}
        showToast={showToast}
        onFriendAdded={loadFriends}
      />
    </Container>
  );
};

export default FriendList;
