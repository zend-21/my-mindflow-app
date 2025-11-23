// 💬 채팅 탭 - 최근 대화 목록
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { subscribeToMyDMRooms } from '../../services/directMessageService';
import { Search, Plus, Pin } from 'lucide-react';

// 컨테이너
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: transparent;
`;

// 검색 바 영역
const SearchSection = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.02);
`;

const SearchBar = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const SearchInputWrapper = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 12px;
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
    border-color: #4a90e2;
    background: rgba(255, 255, 255, 0.08);
  }
`;

const NewChatButton = styled.button`
  background: linear-gradient(135deg, #4a90e2, #357abd);
  border: none;
  color: #ffffff;
  padding: 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(74, 144, 226, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

// 대화 목록
const ChatListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;

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

// 섹션 타이틀
const SectionTitle = styled.div`
  padding: 12px 20px 8px 20px;
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

// 대화 아이템
const ChatItem = styled.div`
  padding: 14px 20px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
  position: relative;
  background: ${props => props.$unread ? 'rgba(74, 144, 226, 0.03)' : 'transparent'};

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-left-color: #4a90e2;
  }

  &:active {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const ChatItemContent = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const Avatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${props => props.$color || 'linear-gradient(135deg, #667eea, #764ba2)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.1);
`;

const ChatInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
`;

const ChatName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ChatTime = styled.div`
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
`;

const ChatPreview = styled.div`
  font-size: 13px;
  color: ${props => props.$unread ? '#b0b0b0' : '#666'};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: ${props => props.$unread ? '500' : '400'};
`;

const UnreadBadge = styled.div`
  position: absolute;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
  background: linear-gradient(135deg, #4a90e2, #357abd);
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
  min-width: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.4);
`;

const PinIcon = styled(Pin)`
  width: 14px;
  height: 14px;
  color: #4a90e2;
  flex-shrink: 0;
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
`;

const ChatList = ({ showToast }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1:1 대화방 목록 실시간 구독
    const unsubscribe = subscribeToMyDMRooms((rooms) => {
      console.log('📬 대화방 목록 업데이트:', rooms);
      setChatRooms(rooms);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 검색 필터링
  const filteredChats = chatRooms.filter(room => {
    if (!searchQuery) return true;

    const otherUserId = room.participants?.find(id => id !== localStorage.getItem('firebaseUserId'));
    const otherUserInfo = room.participantsInfo?.[otherUserId];
    const displayName = otherUserInfo?.displayName || '익명';

    return displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // 고정된 대화와 일반 대화 분리 (나중에 구현)
  const pinnedChats = filteredChats.filter(chat => chat.pinned);
  const regularChats = filteredChats.filter(chat => !chat.pinned);

  const handleChatClick = (room) => {
    // TODO: 대화방 열기
    console.log('대화방 클릭:', room);
    showToast?.('대화방 기능 구현 예정');
  };

  const handleNewChat = () => {
    // TODO: 새 대화 시작
    showToast?.('새 대화 시작 기능 구현 예정');
  };

  // 시간 포맷 함수
  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;

    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
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
          <EmptyIcon>💬</EmptyIcon>
          <EmptyTitle>대화 목록을 불러오는 중...</EmptyTitle>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      {/* 검색 바 */}
      <SearchSection>
        <SearchBar>
          <SearchInputWrapper>
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder="대화 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchInputWrapper>
          <NewChatButton onClick={handleNewChat}>
            <Plus size={20} />
          </NewChatButton>
        </SearchBar>
      </SearchSection>

      {/* 대화 목록 */}
      <ChatListContainer>
        {filteredChats.length === 0 ? (
          <EmptyState>
            <EmptyIcon>💬</EmptyIcon>
            <EmptyTitle>
              {searchQuery ? '검색 결과 없음' : '아직 대화가 없습니다'}
            </EmptyTitle>
            <EmptyDescription>
              {searchQuery
                ? '다른 검색어를 입력해보세요'
                : '친구 탭에서 친구를 추가하고\n대화를 시작해보세요'}
            </EmptyDescription>
          </EmptyState>
        ) : (
          <>
            {/* 고정된 대화 */}
            {pinnedChats.length > 0 && (
              <>
                <SectionTitle>
                  <PinIcon />
                  고정된 대화
                </SectionTitle>
                {pinnedChats.map(room => {
                  const currentUserId = localStorage.getItem('firebaseUserId');
                  const otherUserId = room.participants?.find(id => id !== currentUserId);
                  const otherUserInfo = room.participantsInfo?.[otherUserId];
                  const displayName = otherUserInfo?.displayName || '익명';
                  const unreadCount = room.unreadCount?.[currentUserId] || 0;

                  return (
                    <ChatItem
                      key={room.id}
                      $unread={unreadCount > 0}
                      onClick={() => handleChatClick(room)}
                    >
                      <ChatItemContent>
                        <Avatar $color={getAvatarColor(otherUserId)}>
                          {displayName.charAt(0).toUpperCase()}
                        </Avatar>
                        <ChatInfo>
                          <ChatHeader>
                            <ChatName>{displayName}</ChatName>
                            <ChatTime>{formatTime(room.lastMessageTime)}</ChatTime>
                          </ChatHeader>
                          <ChatPreview $unread={unreadCount > 0}>
                            {room.lastMessage || '대화를 시작해보세요'}
                          </ChatPreview>
                        </ChatInfo>
                      </ChatItemContent>
                      {unreadCount > 0 && (
                        <UnreadBadge>{unreadCount > 99 ? '99+' : unreadCount}</UnreadBadge>
                      )}
                    </ChatItem>
                  );
                })}
              </>
            )}

            {/* 최근 대화 */}
            {regularChats.length > 0 && (
              <>
                <SectionTitle>최근 대화</SectionTitle>
                {regularChats.map(room => {
                  const currentUserId = localStorage.getItem('firebaseUserId');
                  const otherUserId = room.participants?.find(id => id !== currentUserId);
                  const otherUserInfo = room.participantsInfo?.[otherUserId];
                  const displayName = otherUserInfo?.displayName || '익명';
                  const unreadCount = room.unreadCount?.[currentUserId] || 0;

                  return (
                    <ChatItem
                      key={room.id}
                      $unread={unreadCount > 0}
                      onClick={() => handleChatClick(room)}
                    >
                      <ChatItemContent>
                        <Avatar $color={getAvatarColor(otherUserId)}>
                          {displayName.charAt(0).toUpperCase()}
                        </Avatar>
                        <ChatInfo>
                          <ChatHeader>
                            <ChatName>{displayName}</ChatName>
                            <ChatTime>{formatTime(room.lastMessageTime)}</ChatTime>
                          </ChatHeader>
                          <ChatPreview $unread={unreadCount > 0}>
                            {room.lastMessage || '대화를 시작해보세요'}
                          </ChatPreview>
                        </ChatInfo>
                      </ChatItemContent>
                      {unreadCount > 0 && (
                        <UnreadBadge>{unreadCount > 99 ? '99+' : unreadCount}</UnreadBadge>
                      )}
                    </ChatItem>
                  );
                })}
              </>
            )}
          </>
        )}
      </ChatListContainer>
    </Container>
  );
};

export default ChatList;
