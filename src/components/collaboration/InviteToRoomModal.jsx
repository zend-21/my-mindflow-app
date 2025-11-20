// 협업방 친구 초대 모달
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, UserPlus, Check } from 'lucide-react';
import { getFriends } from '../../services/collaborationService';
import { inviteToRoom } from '../../services/collaborationRoomService';

const InviteToRoomModal = ({ isOpen, onClose, roomId, onSuccess }) => {
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadFriends();
    }
  }, [isOpen]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const friendsList = await getFriends();
      setFriends(friendsList);
    } catch (err) {
      setError('친구 목록을 불러오는데 실패했습니다');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFriend = (friendId) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const handleInvite = async () => {
    if (selectedFriends.length === 0) {
      setError('초대할 친구를 선택해주세요');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await inviteToRoom(roomId, selectedFriends);

      onSuccess?.(`${selectedFriends.length}명의 친구를 초대했습니다`);
      onClose();
    } catch (err) {
      setError(err.message || '초대에 실패했습니다');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>
          <Title>
            <UserPlus size={24} />
            <span>친구 초대하기</span>
          </Title>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </Header>

        <Content>
          {error && <ErrorText>{error}</ErrorText>}

          <FriendsList>
            {loading ? (
              <LoadingText>로딩 중...</LoadingText>
            ) : friends.length === 0 ? (
              <EmptyText>친구가 없습니다</EmptyText>
            ) : (
              friends.map(friend => {
                const isSelected = selectedFriends.includes(friend.id);

                return (
                  <FriendItem
                    key={friend.id}
                    onClick={() => toggleFriend(friend.id)}
                    $selected={isSelected}
                  >
                    <Avatar src={friend.photoURL || '/default-avatar.png'} alt={friend.displayName} />
                    <FriendInfo>
                      <FriendName>{friend.displayName}</FriendName>
                      <FriendId>@{friend.uniqueId || 'ID 없음'}</FriendId>
                    </FriendInfo>
                    {isSelected ? (
                      <CheckIcon>
                        <Check size={20} />
                      </CheckIcon>
                    ) : (
                      <Checkbox />
                    )}
                  </FriendItem>
                );
              })
            )}
          </FriendsList>

          <SelectedCount>
            {selectedFriends.length}명 선택됨
          </SelectedCount>

          <InviteButton
            onClick={handleInvite}
            disabled={loading || selectedFriends.length === 0}
          >
            {loading ? '초대 중...' : '초대하기'}
          </InviteButton>
        </Content>
      </Modal>
    </Overlay>
  );
};

// 스타일 (ShareMemoModal과 유사)
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  padding: 20px;
`;

const Modal = styled.div`
  background: linear-gradient(135deg, #1a1d24 0%, #2d3139 100%);
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h2`
  color: white;
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 8px;
  display: flex;
  transition: color 0.2s;
  &:hover { color: white; }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ErrorText = styled.div`
  color: #ff6b6b;
  font-size: 14px;
  padding: 12px;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 8px;
  text-align: center;
`;

const FriendsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
  &::-webkit-scrollbar-thumb {
    background: rgba(94, 190, 38, 0.3);
    border-radius: 3px;
  }
`;

const FriendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: ${props => props.$selected ? 'rgba(94, 190, 38, 0.15)' : 'rgba(255, 255, 255, 0.05)'};
  border: 2px solid ${props => props.$selected ? '#5ebe26' : 'transparent'};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { background: rgba(94, 190, 38, 0.1); }
`;

const Avatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.1);
`;

const FriendInfo = styled.div`
  flex: 1;
`;

const FriendName = styled.div`
  color: white;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const FriendId = styled.div`
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
`;

const Checkbox = styled.div`
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
`;

const CheckIcon = styled.div`
  width: 24px;
  height: 24px;
  background: #5ebe26;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const SelectedCount = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
`;

const InviteButton = styled.button`
  width: 100%;
  padding: 16px;
  background: #5ebe26;
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #4fa01f;
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingText = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 40px;
`;

const EmptyText = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
  padding: 40px;
`;

export default InviteToRoomModal;
