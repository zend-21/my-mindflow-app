// 📁 그룹 생성 모달
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Users, Search, Check } from 'lucide-react';
import { getMyFriends } from '../../services/friendService';
import { createGroupChat } from '../../services/groupChatService';

// 모달 오버레이
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000; /* Higher than footer (9999) and ad banner (10000) */
  padding: 20px;
`;

// 모달 컨테이너
const ModalContainer = styled.div`
  background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

// 헤더
const Header = styled.div`
  padding: 24px 24px 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: #888;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }
`;

// 콘텐츠
const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;

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

// 입력 그룹
const InputGroup = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 15px;
  transition: all 0.2s;

  &::placeholder {
    color: #666;
  }

  &:focus {
    outline: none;
    border-color: #667eea;
    background: rgba(255, 255, 255, 0.08);
  }
`;

// 검색 바
const SearchBar = styled.div`
  position: relative;
  margin-bottom: 16px;
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

const SearchInput = styled.input`
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  padding: 10px 16px 10px 40px;
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.2s;

  &::placeholder {
    color: #666;
  }

  &:focus {
    outline: none;
    border-color: #667eea;
    background: rgba(255, 255, 255, 0.08);
  }
`;

// 친구 목록
const FriendList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding: 2px;

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

const FriendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: ${props => props.$selected ? 'rgba(102, 126, 234, 0.15)' : 'rgba(255, 255, 255, 0.03)'};
  border: 1px solid ${props => props.$selected ? 'rgba(102, 126, 234, 0.4)' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$selected ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
    border-color: ${props => props.$selected ? 'rgba(102, 126, 234, 0.5)' : 'rgba(255, 255, 255, 0.2)'};
  }
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.$color || 'linear-gradient(135deg, #667eea, #764ba2)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.1);
`;

const FriendInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FriendName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FriendCode = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 2px;
`;

const CheckIcon = styled(Check)`
  color: #667eea;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
`;

const SelectedCount = styled.div`
  font-size: 13px;
  color: #888;
  margin-top: 12px;
  text-align: center;
`;

// 빈 상태
const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #666;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
`;

const EmptyText = styled.div`
  font-size: 14px;
  color: #888;
`;

// 푸터
const Footer = styled.div`
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 12px;
`;

const Button = styled.button`
  flex: 1;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background: rgba(255, 255, 255, 0.05);
  color: #e0e0e0;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const CreateButton = styled(Button)`
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const CreateGroupModal = ({ onClose, showToast }) => {
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 친구 목록 불러오기
    const loadFriends = async () => {
      try {
        const friendList = await getMyFriends();
        setFriends(friendList);
      } catch (error) {
        console.error('친구 목록 불러오기 실패:', error);
        showToast?.('친구 목록을 불러올 수 없습니다');
      }
    };

    loadFriends();
  }, [showToast]);

  // 검색 필터링
  const filteredFriends = friends.filter(friend => {
    if (!searchQuery) return true;
    const displayName = friend.displayName || '익명';
    const wsCode = friend.wsCode || '';
    return displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           wsCode.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // 친구 선택/해제
  const toggleFriend = (friendId) => {
    setSelectedFriends(prev => {
      if (prev.includes(friendId)) {
        return prev.filter(id => id !== friendId);
      } else {
        return [...prev, friendId];
      }
    });
  };

  // 그룹 생성
  const handleCreate = async () => {
    if (!groupName.trim()) {
      showToast?.('그룹 이름을 입력해주세요');
      return;
    }

    if (selectedFriends.length === 0) {
      showToast?.('최소 1명의 친구를 선택해주세요');
      return;
    }

    setLoading(true);

    try {
      const currentUserId = localStorage.getItem('firebaseUserId');
      await createGroupChat(currentUserId, groupName.trim(), selectedFriends);
      showToast?.('그룹이 생성되었습니다');
      onClose();
    } catch (error) {
      console.error('그룹 생성 실패:', error);
      showToast?.('그룹 생성에 실패했습니다');
    } finally {
      setLoading(false);
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

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>
            <Users size={24} />
            그룹 만들기
          </Title>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </Header>

        <Content>
          {/* 그룹 이름 입력 */}
          <InputGroup>
            <Label>그룹 이름</Label>
            <Input
              type="text"
              placeholder="그룹 이름을 입력하세요"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={50}
            />
          </InputGroup>

          {/* 친구 선택 */}
          <InputGroup>
            <Label>멤버 선택 ({selectedFriends.length}명)</Label>

            {friends.length > 0 ? (
              <>
                <SearchBar>
                  <SearchIcon />
                  <SearchInput
                    type="text"
                    placeholder="친구 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </SearchBar>

                <FriendList>
                  {filteredFriends.length > 0 ? (
                    filteredFriends.map(friend => {
                      const isSelected = selectedFriends.includes(friend.userId);
                      const displayName = friend.displayName || '익명';

                      return (
                        <FriendItem
                          key={friend.userId}
                          $selected={isSelected}
                          onClick={() => toggleFriend(friend.userId)}
                        >
                          <Avatar $color={getAvatarColor(friend.userId)}>
                            {displayName.charAt(0).toUpperCase()}
                          </Avatar>
                          <FriendInfo>
                            <FriendName>{displayName}</FriendName>
                            <FriendCode>@{friend.wsCode}</FriendCode>
                          </FriendInfo>
                          {isSelected && <CheckIcon />}
                        </FriendItem>
                      );
                    })
                  ) : (
                    <EmptyState>
                      <EmptyIcon>🔍</EmptyIcon>
                      <EmptyText>검색 결과가 없습니다</EmptyText>
                    </EmptyState>
                  )}
                </FriendList>

                {selectedFriends.length > 0 && (
                  <SelectedCount>
                    {selectedFriends.length}명 선택됨
                  </SelectedCount>
                )}
              </>
            ) : (
              <EmptyState>
                <EmptyIcon>👥</EmptyIcon>
                <EmptyText>
                  아직 친구가 없습니다<br />
                  친구 탭에서 친구를 추가해보세요
                </EmptyText>
              </EmptyState>
            )}
          </InputGroup>
        </Content>

        <Footer>
          <CancelButton onClick={onClose}>
            취소
          </CancelButton>
          <CreateButton
            onClick={handleCreate}
            disabled={loading || !groupName.trim() || selectedFriends.length === 0}
          >
            {loading ? '생성 중...' : '생성하기'}
          </CreateButton>
        </Footer>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default CreateGroupModal;
