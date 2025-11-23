// 1:1 대화방 목록 컴포넌트
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { MessageCircle, X, Search } from 'lucide-react';
import { subscribeToMyDMRooms } from '../../services/directMessageService';
import { auth } from '../../firebase/config';
import DirectMessageRoom from './DirectMessageRoom';

const DirectMessageList = ({ onClose }) => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // 대화방 목록 실시간 구독
  useEffect(() => {
    const unsubscribe = subscribeToMyDMRooms((roomList) => {
      console.log('📨 대화방 목록 업데이트:', roomList);
      setRooms(roomList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 대화 상대 정보 가져오기
  const getOtherUser = (room) => {
    if (!room || !auth.currentUser) return null;
    const otherUserId = room.participants?.find(id => id !== auth.currentUser.uid);
    return room.participantsInfo?.[otherUserId] || null;
  };

  // 검색 필터링
  const filteredRooms = rooms.filter(room => {
    if (!searchTerm.trim()) return true;
    const otherUser = getOtherUser(room);
    const searchLower = searchTerm.toLowerCase();
    return (
      otherUser?.displayName?.toLowerCase().includes(searchLower) ||
      otherUser?.email?.toLowerCase().includes(searchLower) ||
      room.lastMessage?.toLowerCase().includes(searchLower)
    );
  });

  // 대화방 선택
  const handleRoomClick = (roomId) => {
    setSelectedRoomId(roomId);
  };

  // 대화방 닫기
  const handleCloseRoom = () => {
    setSelectedRoomId(null);
  };

  // 선택된 대화방이 있으면 대화방 컴포넌트 렌더링
  if (selectedRoomId) {
    return (
      <DirectMessageRoom
        roomId={selectedRoomId}
        onClose={handleCloseRoom}
      />
    );
  }

  return (
    <Container>
      <Header>
        <HeaderTitle>
          <MessageCircle size={24} />
          <span>대화</span>
        </HeaderTitle>
        <CloseButton onClick={onClose}>
          <X size={24} />
        </CloseButton>
      </Header>

      <SearchSection>
        <SearchInputWrapper>
          <Search size={18} />
          <SearchInput
            type="text"
            placeholder="이름, 이메일, 메시지 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchInputWrapper>
      </SearchSection>

      <RoomListContainer>
        {loading ? (
          <EmptyState>로딩 중...</EmptyState>
        ) : filteredRooms.length === 0 ? (
          <EmptyState>
            {searchTerm ? '검색 결과가 없습니다' : '대화 목록이 비어있습니다'}
          </EmptyState>
        ) : (
          filteredRooms.map((room) => {
            const otherUser = getOtherUser(room);
            const unreadCount = room.unreadCount?.[auth.currentUser?.uid] || 0;
            const lastMessageTime = room.lastMessageTime?.toDate?.();

            return (
              <RoomItem key={room.id} onClick={() => handleRoomClick(room.id)}>
                <Avatar src={otherUser?.photoURL || '/default-avatar.png'} alt={otherUser?.displayName} />
                <RoomInfo>
                  <RoomHeader>
                    <UserName>{otherUser?.displayName || '알 수 없는 사용자'}</UserName>
                    {lastMessageTime && (
                      <TimeStamp>
                        {formatTime(lastMessageTime)}
                      </TimeStamp>
                    )}
                  </RoomHeader>
                  <LastMessage hasUnread={unreadCount > 0}>
                    {room.lastMessage || '메시지가 없습니다'}
                  </LastMessage>
                </RoomInfo>
                {unreadCount > 0 && (
                  <UnreadBadge>{unreadCount > 99 ? '99+' : unreadCount}</UnreadBadge>
                )}
              </RoomItem>
            );
          })
        )}
      </RoomListContainer>
    </Container>
  );
};

// 시간 포맷팅 함수
const formatTime = (date) => {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;

  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric'
  });
};

// 스타일 정의
const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1a1d24 0%, #2d3139 100%);
  display: flex;
  flex-direction: column;
  z-index: 10000;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  font-size: 20px;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;

  &:hover {
    color: white;
  }
`;

const SearchSection = styled.div`
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

const SearchInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.6);

  &:focus-within {
    border-color: #5ebe26;
    color: #5ebe26;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  background: none;
  border: none;
  color: white;
  font-size: 15px;
  outline: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const RoomListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const EmptyState = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
  padding: 60px 20px;
  font-size: 15px;
`;

const RoomItem = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  &:active {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const Avatar = styled.img`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
`;

const RoomInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const RoomHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const UserName = styled.div`
  color: white;
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TimeStamp = styled.div`
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  flex-shrink: 0;
`;

const LastMessage = styled.div`
  color: ${props => props.hasUnread ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)'};
  font-size: 14px;
  font-weight: ${props => props.hasUnread ? '500' : '400'};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const UnreadBadge = styled.div`
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  background: #5ebe26;
  border-radius: 11px;
  color: white;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

export default DirectMessageList;
