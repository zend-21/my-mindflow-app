// 👥 친구 탭 - 친구 관리 (카카오톡 스타일)
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Search, UserPlus, MessageCircle, UserMinus, Shield, ChevronRight, Settings, TestTube } from 'lucide-react';
import { getMyFriends } from '../../services/friendService';
import { checkVerificationStatus } from '../../services/verificationService';
import { createOrGetDMRoom } from '../../services/directMessageService';
import { addTestFriend, removeAllTestFriends } from '../../services/testFriendService';
import VerificationModal from './VerificationModal';
import ChatRoom from './ChatRoom';

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
  background: ${props => props.$color || 'linear-gradient(135deg, #667eea, #764ba2)'};
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
`;

const SectionTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #888;
`;

const FriendCount = styled.span`
  color: #4a90e2;
  margin-left: 6px;
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
  background: ${props => props.$color || 'linear-gradient(135deg, #667eea, #764ba2)'};
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
  opacity: 0;
  transition: opacity 0.2s;

  ${FriendItem}:hover & {
    opacity: 1;
  }
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

const FriendList = ({ showToast, memos }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    loadMyProfile();
    loadFriends();
  }, []);

  const loadMyProfile = async () => {
    try {
      const userId = localStorage.getItem('firebaseUserId');
      const nickname = localStorage.getItem('userNickname') || '나';

      // 본인인증 상태 확인
      const verificationStatus = await checkVerificationStatus(userId);
      setIsVerified(verificationStatus.verified);

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

      // 각 친구의 인증 상태 확인
      const friendsWithVerification = await Promise.all(
        friendsList.map(async (friend) => {
          const verificationStatus = await checkVerificationStatus(friend.friendId);
          return {
            ...friend,
            verified: verificationStatus.verified
          };
        })
      );

      setFriends(friendsWithVerification);
      setLoading(false);
    } catch (error) {
      console.error('친구 목록 조회 오류:', error);
      setFriends([]);
      setLoading(false);
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
    console.log('친구 삭제:', friend);
    showToast?.('친구 삭제 기능 구현 예정');
  };

  const handleAddFriend = () => {
    showToast?.('친구 추가 기능 구현 예정');
  };

  const handleAddTestFriends = async () => {
    try {
      const userId = localStorage.getItem('firebaseUserId');
      showToast?.('테스트 친구를 추가하는 중...');

      const result = await addTestFriend(userId);

      if (result.success) {
        showToast?.(result.message);
        // 친구 목록 새로고침
        await loadFriends();
      } else {
        showToast?.(result.message);
      }
    } catch (error) {
      console.error('테스트 친구 추가 오류:', error);
      showToast?.('테스트 친구 추가에 실패했습니다');
    }
  };

  const handleRemoveTestFriends = async () => {
    try {
      const userId = localStorage.getItem('firebaseUserId');
      showToast?.('테스트 친구를 삭제하는 중...');

      const result = await removeAllTestFriends(userId);

      if (result.success) {
        showToast?.(result.message);
        // 친구 목록 새로고침
        await loadFriends();
      } else {
        showToast?.(result.message);
      }
    } catch (error) {
      console.error('테스트 친구 삭제 오류:', error);
      showToast?.('테스트 친구 삭제에 실패했습니다');
    }
  };

  // 아바타 색상 생성
  const getAvatarColor = (userId) => {
    const colors = [
      'linear-gradient(135deg, #667eea, #764ba2)',
      'linear-gradient(135deg, #f093fb, #f5576c)',
      'linear-gradient(135deg, #4facfe, #00f2fe)',
      'linear-gradient(135deg, #43e97b, #38f9d7)',
      'linear-gradient(135deg, #fa709a, #fee140)',
      'linear-gradient(135deg, #30cfd0, #330867)',
    ];
    const index = userId ? userId.charCodeAt(0) % colors.length : 0;
    return colors[index];
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
        <IconButton onClick={handleAddTestFriends} title="테스트 친구 추가" style={{ color: '#4a90e2' }}>
          <TestTube size={20} />
        </IconButton>
        <IconButton onClick={handleAddFriend} title="친구 추가">
          <UserPlus size={20} />
        </IconButton>
        <IconButton title="설정">
          <Settings size={20} />
        </IconButton>
      </HeaderSection>

      {/* 내 프로필 */}
      {myProfile && (
        <MyProfileSection>
          <MyProfileContent>
            <MyAvatar $color={getAvatarColor(myProfile.userId)}>
              {myProfile.nickname?.charAt(0).toUpperCase() || '나'}
              {isVerified && (
                <VerifiedBadge>
                  <Shield size={12} />
                </VerifiedBadge>
              )}
            </MyAvatar>
            <MyInfo>
              <MyName>
                {myProfile.nickname}
                {!isVerified && (
                  <VerifyButton onClick={() => setShowVerificationModal(true)}>
                    <Shield size={12} />
                    본인인증
                  </VerifyButton>
                )}
              </MyName>
              {isVerified && (
                <MyStatus>인증된 사용자</MyStatus>
              )}
            </MyInfo>
            <ChevronRight size={20} color="#666" />
          </MyProfileContent>
        </MyProfileSection>
      )}

      {/* 친구 목록 */}
      <FriendListContainer>
        {filteredFriends.length === 0 ? (
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
        ) : (
          <>
            <SectionHeader>
              <SectionTitle>
                친구
                <FriendCount>{filteredFriends.length}</FriendCount>
              </SectionTitle>
            </SectionHeader>

            {filteredFriends.map(friend => (
              <FriendItem key={friend.id}>
                <Avatar $color={getAvatarColor(friend.friendId)}>
                  {friend.friendName?.charAt(0).toUpperCase() || '?'}
                  {friend.verified && (
                    <VerifiedBadge>
                      <Shield size={10} />
                    </VerifiedBadge>
                  )}
                </Avatar>

                <FriendInfo>
                  <FriendName>
                    {friend.friendName || '익명'}
                  </FriendName>
                  <FriendStatus>
                    {friend.friendWorkspaceCode?.toLowerCase() || '-'}
                    {friend.verified && ' • 인증됨'}
                  </FriendStatus>
                </FriendInfo>

                <ActionButtons>
                  <ActionButton
                    $variant="primary"
                    onClick={() => handleStartChat(friend)}
                  >
                    <MessageCircle size={14} />
                  </ActionButton>
                  <ActionButton
                    onClick={() => handleRemoveFriend(friend)}
                  >
                    <UserMinus size={14} />
                  </ActionButton>
                </ActionButtons>
              </FriendItem>
            ))}
          </>
        )}
      </FriendListContainer>

      {/* 본인인증 모달 */}
      {showVerificationModal && (
        <VerificationModal
          onClose={() => setShowVerificationModal(false)}
          onVerified={() => {
            setIsVerified(true);
            loadMyProfile();
            loadFriends(); // 친구 목록도 새로고침
          }}
          showToast={showToast}
        />
      )}

      {/* 채팅방 */}
      {selectedChat && (
        <ChatRoom
          chat={selectedChat}
          onClose={() => setSelectedChat(null)}
          showToast={showToast}
          memos={memos}
        />
      )}
    </Container>
  );
};

export default FriendList;
