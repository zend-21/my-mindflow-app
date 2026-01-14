// 👥 친구 탭 - 친구 관리 (카카오톡 스타일)
import { useState, useEffect } from 'react';
import { UserPlus, MessageCircle, UserMinus, /* Shield, */ ChevronRight, X, UserCheck, MoreHorizontal, Copy, Ban, EyeOff } from 'lucide-react'; // Shield는 MVP에서 본인인증 제외로 미사용
import { getMyFriends, removeFriend, getFriendRequests, acceptFriendRequest, rejectFriendRequest } from '../../services/friendService';
// import { checkVerificationStatus, checkVerificationStatusBatch } from '../../services/verificationService';
import { createOrGetDMRoom } from '../../services/directMessageService';
// import VerificationModal from './VerificationModal'; // MVP에서 제외
import ChatRoom from './ChatRoom';
import AddFriendModal from './AddFriendModal';
import DeletedFriendsModal from './DeletedFriendsModal';
import BlockedUsersModal from './BlockedUsersModal';
import HiddenRequestsModal from './HiddenRequestsModal';
import { avatarList } from '../avatars/AvatarIcons';
import * as S from './FriendList.styles';

const FriendList = ({ showToast, memos, requirePhoneAuth, onFriendRequestCountChange }) => {
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
  const [showHiddenRequestsModal, setShowHiddenRequestsModal] = useState(false); // 숨긴 요청 목록 모달
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, request: null }); // 친구 요청 확인 모달
  const [userProfilePictures, setUserProfilePictures] = useState({}); // 친구 프로필 사진
  const [userAvatarSettings, setUserAvatarSettings] = useState({}); // 친구 아바타 설정

  useEffect(() => {
    loadMyProfile();
    loadFriends();
    loadFriendRequests();
  }, []);

  // 친구 요청 수를 부모로 전달
  useEffect(() => {
    if (onFriendRequestCountChange) {
      onFriendRequestCountChange(friendRequests.length);
    }
  }, [friendRequests, onFriendRequestCountChange]);

  // 본인 + 친구들 + 친구 요청자들의 프로필 사진 실시간 구독
  // 친구 목록은 실시간 업데이트가 중요하므로 onSnapshot 사용
  useEffect(() => {
    const myUserId = localStorage.getItem('firebaseUserId');
    const friendIds = friends.map(f => f.friendId);
    const requesterIds = friendRequests.map(r => r.requesterId);

    // 본인 ID + 친구 ID + 요청자 ID 모두 포함
    const allUserIds = myUserId ? [myUserId, ...friendIds, ...requesterIds] : [...friendIds, ...requesterIds];
    if (allUserIds.length === 0) {
      return;
    }

    const unsubscribers = [];

    // 각 유저의 프로필 설정 실시간 구독
    const setupListeners = async () => {
      const { doc, onSnapshot } = await import('firebase/firestore');
      const { db } = await import('../../firebase/config');
      const { getProfileImageUrl } = await import('../../utils/storageService');

      for (const userId of allUserIds) {
        try {
          const settingsRef = doc(db, 'users', userId, 'settings', 'profile');

          const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
              const settings = docSnap.data();
              const imageType = settings.profileImageType || 'avatar';
              const version = settings.profileImageVersion || null;
              const selectedAvatarId = settings.selectedAvatarId || null;
              const avatarBgColor = settings.avatarBgColor || 'none';

              if (imageType === 'photo') {
                const imageUrl = getProfileImageUrl(userId, version);
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
                // 아바타 모드면 프로필 사진 제거, 아바타 설정 저장
                setUserProfilePictures(prev => {
                  const newState = { ...prev };
                  delete newState[userId];
                  return newState;
                });
                if (selectedAvatarId) {
                  setUserAvatarSettings(prev => ({
                    ...prev,
                    [userId]: { selectedAvatarId, avatarBgColor }
                  }));
                }
              }
            }
          });

          unsubscribers.push(unsubscribe);
        } catch (error) {
          console.error(`프로필 리스너 설정 실패 (${userId}):`, error);
        }
      }
    };

    setupListeners();

    return () => {
      unsubscribers.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, [friends, friendRequests]);

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

      // ⚡ nicknames 컬렉션에서 앱 닉네임 로드, 없으면 구글 displayName 사용
      let nickname = localStorage.getItem('userName'); // 구글 displayName fallback

      try {
        const { getUserNickname } = await import('../../services/nicknameService');
        const appNickname = await getUserNickname(userId);

        if (appNickname) {
          nickname = appNickname;
          // localStorage에 캐싱
          localStorage.setItem('userNickname', appNickname);
        }
      } catch (error) {
        console.error('닉네임 로드 실패:', error);
        // 실패 시 localStorage fallback
        nickname = localStorage.getItem('userNickname') || localStorage.getItem('userName');
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

      // ⚡ 스마트 캐싱: 1분간 캐시 사용으로 데이터 사용량 90% 절감
      const CACHE_KEY = 'friendNicknamesCache';
      const CACHE_DURATION = 60 * 1000; // 1분

      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../../firebase/config');

      // 캐시 확인
      let nicknameCache = {};
      let useCachedData = false;

      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { nicknames, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            nicknameCache = nicknames;
            useCachedData = true;
            console.log('📦 캐시된 닉네임 사용 (1분 이내)');
          } else {
            console.log('⏰ 캐시 만료 - Firestore에서 새로 로드');
          }
        }
      } catch (error) {
        console.error('캐시 로드 오류:', error);
      }

      const friendsWithLatestNicknames = await Promise.all(
        friendsList.map(async (friend) => {
          // 캐시에 있으면 사용 (Firestore 읽기 0회)
          if (useCachedData && nicknameCache[friend.friendId]) {
            return {
              ...friend,
              friendName: nicknameCache[friend.friendId]
            };
          }

          // nicknames 컬렉션에서 가져오기
          try {
            const { getUserNickname } = await import('../../services/nicknameService');
            const nickname = await getUserNickname(friend.friendId);

            if (nickname) {
              console.log(`✅ nicknames에서 로드: ${friend.friendId} → ${nickname}`);
              nicknameCache[friend.friendId] = nickname;
              return {
                ...friend,
                friendName: nickname
              };
            }
          } catch (error) {
            console.error(`친구 닉네임 로드 실패 (${friend.friendId}):`, error);
          }
          return friend;
        })
      );

      // 캐시 저장 (새로 불러온 경우만)
      if (!useCachedData) {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            nicknames: nicknameCache,
            timestamp: Date.now()
          }));
          console.log('💾 닉네임 캐시 저장 완료');
        } catch (error) {
          console.error('캐시 저장 오류:', error);
        }
      }

      setFriends(friendsWithLatestNicknames);
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

      // ⚡ 스마트 캐싱: 1분간 캐시 사용 (친구 목록과 동일한 캐시)
      const CACHE_KEY = 'friendNicknamesCache';
      const CACHE_DURATION = 60 * 1000; // 1분

      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../../firebase/config');

      // 캐시 확인
      let nicknameCache = {};
      let useCachedData = false;

      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { nicknames, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            nicknameCache = nicknames;
            useCachedData = true;
            console.log('📦 캐시된 닉네임 사용 (친구 요청)');
          }
        }
      } catch (error) {
        console.error('캐시 로드 오류:', error);
      }

      const requestsWithLatestNicknames = await Promise.all(
        requestsList.map(async (request) => {
          // 캐시에 있으면 사용
          if (useCachedData && nicknameCache[request.requesterId]) {
            return {
              ...request,
              requesterName: nicknameCache[request.requesterId]
            };
          }

          // nicknames 컬렉션에서 가져오기
          try {
            const { getUserNickname } = await import('../../services/nicknameService');
            const nickname = await getUserNickname(request.requesterId);

            if (nickname) {
              console.log(`✅ 요청자 nicknames 로드: ${request.requesterId} → ${nickname}`);
              nicknameCache[request.requesterId] = nickname;
              return {
                ...request,
                requesterName: nickname
              };
            }
          } catch (error) {
            console.error(`요청자 닉네임 로드 실패 (${request.requesterId}):`, error);
          }
          return request;
        })
      );

      // 캐시 업데이트 (새로 불러온 경우)
      if (!useCachedData && Object.keys(nicknameCache).length > 0) {
        try {
          // 기존 캐시와 병합
          const existingCache = localStorage.getItem(CACHE_KEY);
          if (existingCache) {
            const { nicknames: existingNicknames } = JSON.parse(existingCache);
            nicknameCache = { ...existingNicknames, ...nicknameCache };
          }

          localStorage.setItem(CACHE_KEY, JSON.stringify({
            nicknames: nicknameCache,
            timestamp: Date.now()
          }));
          console.log('💾 요청자 닉네임 캐시 업데이트 완료');
        } catch (error) {
          console.error('캐시 저장 오류:', error);
        }
      }

      // hidden이 true인 요청은 제외 (숨긴 요청)
      const visibleRequests = requestsWithLatestNicknames.filter(request => request.hidden !== true);

      setFriendRequests(visibleRequests);
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

  // 친구 추가 확인 모달 열기
  const handleAcceptFriendRequest = (request) => {
    setConfirmModal({ isOpen: true, type: 'accept', request });
  };

  // 친구 거절 확인 모달 열기
  const handleRejectFriendRequest = (request) => {
    setConfirmModal({ isOpen: true, type: 'reject', request });
  };

  // 친구 추가 실행
  const confirmAcceptFriend = async () => {
    try {
      const { request } = confirmModal;
      const userId = localStorage.getItem('firebaseUserId');
      const result = await acceptFriendRequest(userId, request.requesterId);

      if (result.success) {
        showToast?.(`${request.requesterName}님을 친구로 추가했습니다`);
        await loadFriends();
        await loadFriendRequests();
      } else {
        showToast?.(result.error || '친구 추가에 실패했습니다');
      }
    } catch (error) {
      console.error('친구 요청 수락 오류:', error);
      showToast?.('친구 추가에 실패했습니다');
    } finally {
      setConfirmModal({ isOpen: false, type: null, request: null });
    }
  };

  // 친구 거절 실행
  const confirmRejectFriend = async () => {
    try {
      const { request } = confirmModal;
      const userId = localStorage.getItem('firebaseUserId');
      const result = await rejectFriendRequest(userId, request.requesterId);

      if (result.success) {
        showToast?.('친구 요청을 거절했습니다');
        await loadFriendRequests();
      } else {
        showToast?.(result.error || '요청 거절에 실패했습니다');
      }
    } catch (error) {
      console.error('친구 요청 거절 오류:', error);
      showToast?.('요청 거절에 실패했습니다');
    } finally {
      setConfirmModal({ isOpen: false, type: null, request: null });
    }
  };

  const handleCopyWorkspaceCode = async (workspaceCode, friendName) => {
    try {
      // WS- 접두사 제거
      const cleanCode = workspaceCode?.replace('WS-', '') || workspaceCode;
      await navigator.clipboard.writeText(cleanCode);
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

  // 아바타 색상 생성 - 모던하고 심플한 단색 사용 (기본값)
  const getAvatarColor = () => {
    // 모던한 회색 계열 단색 (사용자가 색상을 지정하지 않은 경우의 기본값)
    return '#5f6368';
  };

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

  // 아바타 아이콘 렌더링
  const renderAvatarIcon = (userId) => {
    const avatarSettings = userAvatarSettings[userId];
    if (!avatarSettings?.selectedAvatarId) return null;

    const avatar = avatarList.find(a => a.id === avatarSettings.selectedAvatarId);
    if (!avatar) return null;

    const AvatarComponent = avatar.component;
    const bgColor = BACKGROUND_COLORS[avatarSettings.avatarBgColor] || BACKGROUND_COLORS['none'];

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

  if (loading) {
    return (
      <S.Container>
        <S.EmptyState>
          <S.EmptyIcon>👥</S.EmptyIcon>
          <S.EmptyTitle>친구 목록을 불러오는 중...</S.EmptyTitle>
        </S.EmptyState>
      </S.Container>
    );
  }

  return (
    <S.Container>
      {/* 헤더 */}
      <S.HeaderSection>
        <S.SearchInputWrapper>
          <S.SearchIcon />
          <S.SearchInput
            type="text"
            placeholder="친구 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </S.SearchInputWrapper>
        <S.IconButton onClick={handleAddFriend} title="친구 추가">
          <UserPlus size={20} />
        </S.IconButton>
      </S.HeaderSection>

      {/* 내 프로필 */}
      {myProfile && (
        <S.MyProfileSection style={{ position: 'relative' }}>
          <S.MyProfileContent onClick={handleOpenMeChat} style={{ cursor: 'pointer' }}>
            <S.MyAvatar
              $color={getAvatarColor(myProfile.userId)}
              style={userProfilePictures[myProfile.userId] ? {
                backgroundImage: `url(${userProfilePictures[myProfile.userId]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              } : {}}
            >
              {!userProfilePictures[myProfile.userId] && userAvatarSettings[myProfile.userId] && renderAvatarIcon(myProfile.userId)}
              {!userProfilePictures[myProfile.userId] && !userAvatarSettings[myProfile.userId] && (myProfile.nickname?.charAt(0).toUpperCase() || '나')}
            </S.MyAvatar>
            <S.MyInfo>
              <S.MyName>{myProfile.nickname} (나)</S.MyName>
            </S.MyInfo>
            <ChevronRight
              size={20}
              color="#666"
              onClick={handleToggleMyProfileMenu}
              style={{ cursor: 'pointer' }}
            />
          </S.MyProfileContent>

          {/* 프로필 메뉴 드롭다운 */}
          {showMyProfileMenu && (
            <S.DropdownMenu
              onClick={(e) => e.stopPropagation()}
              style={{ top: '100%', right: '10px', marginTop: '4px' }}
            >
              <S.DropdownItem onClick={() => {
                setShowMyProfileMenu(false);
                setShowHiddenRequestsModal(true);
              }}>
                <EyeOff size={16} />
                친구 거절 목록
              </S.DropdownItem>
              <S.DropdownItem onClick={() => {
                setShowMyProfileMenu(false);
                setShowDeletedFriendsModal(true);
              }}>
                <UserMinus size={16} />
                친구삭제 목록
              </S.DropdownItem>
              <S.DropdownItem onClick={() => {
                setShowMyProfileMenu(false);
                setShowBlockedUsersModal(true);
              }}>
                <Ban size={16} />
                차단 목록
              </S.DropdownItem>
            </S.DropdownMenu>
          )}
        </S.MyProfileSection>
      )}

      {/* 친구 목록 */}
      <S.FriendListContainer>
        {/* 나를 친구 추가한 사람 섹션 */}
        {friendRequests.length > 0 && (
          <>
            <S.SectionHeader>
              <S.SectionTitle>
                나를 친구 추가한 사람
                <S.FriendCount>{friendRequests.length}</S.FriendCount>
              </S.SectionTitle>
              <S.SectionActions>
                <S.MoreButton>
                  <MoreHorizontal size={18} />
                </S.MoreButton>
              </S.SectionActions>
            </S.SectionHeader>

            {friendRequests.map(request => (
              <S.FriendItem key={request.id}>
                <S.Avatar
                  $color={getAvatarColor(request.requesterId)}
                  style={userProfilePictures[request.requesterId] ? {
                    backgroundImage: `url(${userProfilePictures[request.requesterId]})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  } : {}}
                >
                  {!userProfilePictures[request.requesterId] && userAvatarSettings[request.requesterId] && renderAvatarIcon(request.requesterId)}
                  {!userProfilePictures[request.requesterId] && !userAvatarSettings[request.requesterId] && (request.requesterName?.charAt(0).toUpperCase() || '?')}
                </S.Avatar>

                <S.FriendInfo>
                  <S.FriendName>
                    {request.requesterName || '익명'}
                  </S.FriendName>
                  <S.FriendStatus>
                    {request.requesterWorkspaceCode?.replace('WS-', '') || '-'}
                  </S.FriendStatus>
                </S.FriendInfo>

                <S.ActionButtons>
                  <S.ActionButton
                    $variant="primary"
                    onClick={() => handleAcceptFriendRequest(request)}
                  >
                    <UserCheck size={14} />
                  </S.ActionButton>
                  <S.ActionButton
                    onClick={() => handleRejectFriendRequest(request)}
                  >
                    <X size={14} />
                  </S.ActionButton>
                </S.ActionButtons>
              </S.FriendItem>
            ))}
          </>
        )}

        {/* 친구 섹션 */}
        {filteredFriends.length === 0 && friendRequests.length === 0 ? (
          <S.EmptyState>
            <S.EmptyIcon>👥</S.EmptyIcon>
            <S.EmptyTitle>
              {searchQuery ? '검색 결과 없음' : '아직 친구가 없습니다'}
            </S.EmptyTitle>
            <S.EmptyDescription>
              {searchQuery
                ? '다른 검색어를 입력해보세요'
                : 'WS 코드를 입력하거나 QR 스캔으로\n친구를 추가해보세요'}
            </S.EmptyDescription>
            {!searchQuery && (
              <S.AddFriendButton onClick={handleAddFriend}>
                <UserPlus size={18} />
                친구 추가
              </S.AddFriendButton>
            )}
          </S.EmptyState>
        ) : filteredFriends.length > 0 ? (
          <>
            <S.SectionHeader>
              <S.SectionTitle>
                친구
                <S.FriendCount>{filteredFriends.length}</S.FriendCount>
              </S.SectionTitle>
            </S.SectionHeader>

            {filteredFriends.map(friend => (
              <S.FriendItem
                key={friend.id}
                onClick={() => handleStartChat(friend)}
                style={{ cursor: 'pointer' }}
              >
                <S.Avatar
                  $color={getAvatarColor(friend.friendId)}
                  style={userProfilePictures[friend.friendId] ? {
                    backgroundImage: `url(${userProfilePictures[friend.friendId]})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  } : {}}
                >
                  {!userProfilePictures[friend.friendId] && userAvatarSettings[friend.friendId] && renderAvatarIcon(friend.friendId)}
                  {!userProfilePictures[friend.friendId] && !userAvatarSettings[friend.friendId] && (friend.friendName?.charAt(0).toUpperCase() || '?')}
                </S.Avatar>

                <S.FriendInfo>
                  <S.FriendName>
                    {friend.friendName || '익명'}
                  </S.FriendName>
                  <S.FriendStatus>
                    {friend.friendWorkspaceCode?.replace('WS-', '') || '-'}
                  </S.FriendStatus>
                </S.FriendInfo>

                <S.ActionButtons>
                  <S.MoreMenuButton onClick={(e) => handleMenuToggle(friend.id, e)}>
                    <MoreHorizontal size={18} />
                  </S.MoreMenuButton>

                  {openMenuId === friend.id && (
                    <S.DropdownMenu onClick={(e) => e.stopPropagation()}>
                      <S.DropdownItem onClick={() => handleCopyWorkspaceCode(friend.friendWorkspaceCode, friend.friendName)}>
                        <Copy size={16} />
                        아이디 복사
                      </S.DropdownItem>
                      <S.DropdownItem
                        $danger
                        onClick={() => {
                          setOpenMenuId(null);
                          handleRemoveFriend(friend);
                        }}
                      >
                        <UserMinus size={16} />
                        친구 삭제
                      </S.DropdownItem>
                      <S.DropdownItem
                        $danger
                        onClick={() => handleBlockFriend(friend)}
                      >
                        <Ban size={16} />
                        차단
                      </S.DropdownItem>
                    </S.DropdownMenu>
                  )}
                </S.ActionButtons>
              </S.FriendItem>
            ))}
          </>
        ) : null}
      </S.FriendListContainer>

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
        <S.ModalOverlay onClick={() => !deletingFriend && setShowDeleteFriendModal(false)}>
          <S.ModalContainer onClick={(e) => e.stopPropagation()}>
            <S.ModalHeader>
              <S.ModalTitle>친구 삭제</S.ModalTitle>
              <S.CloseButton onClick={() => !deletingFriend && setShowDeleteFriendModal(false)}>
                <X size={20} />
              </S.CloseButton>
            </S.ModalHeader>
            <S.ModalContent>
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
            </S.ModalContent>
            <S.ModalFooter>
              <S.CancelButton
                onClick={() => setShowDeleteFriendModal(false)}
                disabled={deletingFriend}
              >
                취소
              </S.CancelButton>
              <S.ConfirmButton
                onClick={confirmDeleteFriend}
                disabled={deletingFriend}
              >
                {deletingFriend ? '삭제 중...' : '삭제하기'}
              </S.ConfirmButton>
            </S.ModalFooter>
          </S.ModalContainer>
        </S.ModalOverlay>
      )}

      {/* 숨긴 친구 요청 모달 */}
      <HiddenRequestsModal
        isOpen={showHiddenRequestsModal}
        onClose={() => setShowHiddenRequestsModal(false)}
        showToast={showToast}
        onRequestsUpdated={loadFriendRequests}
      />

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

      {/* 친구 요청 확인 모달 */}
      {confirmModal.isOpen && (
        <S.ModalOverlay onClick={() => setConfirmModal({ isOpen: false, type: null, request: null })}>
          <S.ModalContainer onClick={(e) => e.stopPropagation()}>
            <S.ModalHeader>
              <S.ModalTitle>
                {confirmModal.type === 'accept' ? '친구 추가' : '친구 거절'}
              </S.ModalTitle>
            </S.ModalHeader>
            <S.ModalBody style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '15px', color: '#333', marginBottom: '8px' }}>
                {confirmModal.request?.requesterName || '익명'}님을
              </p>
              <p style={{ fontSize: '15px', color: '#333' }}>
                {confirmModal.type === 'accept' ? '친구로 추가하시겠습니까?' : '거절하시겠습니까?'}
              </p>
            </S.ModalBody>
            <S.ModalFooter>
              <S.Button
                onClick={() => setConfirmModal({ isOpen: false, type: null, request: null })}
                style={{ background: '#e0e0e0', color: '#666' }}
              >
                취소
              </S.Button>
              <S.Button
                onClick={confirmModal.type === 'accept' ? confirmAcceptFriend : confirmRejectFriend}
                style={{
                  background: confirmModal.type === 'accept' ? '#667eea' : '#ff4757',
                  color: 'white'
                }}
              >
                {confirmModal.type === 'accept' ? '추가' : '거절'}
              </S.Button>
            </S.ModalFooter>
          </S.ModalContainer>
        </S.ModalOverlay>
      )}
    </S.Container>
  );
};

export default FriendList;
