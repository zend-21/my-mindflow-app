// 💬 채팅 탭 - 최근 대화 목록 (1:1 + 그룹)
import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { subscribeToMyDMRooms } from '../../services/directMessageService';
import { subscribeToMyGroupChats } from '../../services/groupChatService';
import { playNewMessageNotification, notificationSettings } from '../../utils/notificationSounds';
import { Search, Plus, Pin, Users } from 'lucide-react';
import CreateGroupModal from './CreateGroupModal';
import ChatRoom from './ChatRoom';

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

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const NewChatButton = styled.button`
  background: linear-gradient(135deg, #4a90e2, #357abd);
  border: none;
  color: #ffffff;
  padding: 10px 14px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
  font-size: 13px;
  font-weight: 600;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(74, 144, 226, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

const NewGroupButton = styled.button`
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  color: #ffffff;
  padding: 10px 14px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  font-size: 13px;
  font-weight: 600;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
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

const GroupBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  background: rgba(102, 126, 234, 0.15);
  border-radius: 6px;
  color: #667eea;
  font-size: 11px;
  font-weight: 600;
  margin-left: 6px;
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

const ChatList = ({ showToast, memos, requirePhoneAuth }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [chatRooms, setChatRooms] = useState([]);
  const [groupChats, setGroupChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);

  // 이전 읽지 않은 메시지 개수 추적 (알림음 재생 여부 판단)
  const prevUnreadCountRef = useRef({});

  useEffect(() => {
    let dmLoaded = false;
    let groupLoaded = false;
    const currentUserId = localStorage.getItem('firebaseUserId');

    // 1:1 대화방 목록 실시간 구독
    const unsubscribeDM = subscribeToMyDMRooms((rooms) => {
      console.log('📬 1:1 대화방 목록 업데이트:', rooms);
      console.log('👤 현재 사용자 ID (localStorage):', currentUserId);

      // unreadCount 상세 로그
      rooms.forEach(room => {
        // 상대방 ID 찾기
        const otherUserId = room.participants?.find(id => id !== currentUserId);

        console.log('📊 대화방 unreadCount 상세 분석:', {
          roomId: room.id,
          currentUserId: currentUserId,
          otherUserId: otherUserId,
          unreadCountObject: room.unreadCount,
          unreadCountKeys: room.unreadCount ? Object.keys(room.unreadCount) : [],
          myUnreadCount: room.unreadCount?.[currentUserId],
          otherUnreadCount: room.unreadCount?.[otherUserId],
          calculatedUnread: room.unreadCount?.[otherUserId] || 0  // 상대방이 읽지 않은 개수!
        });

        const unread = room.unreadCount?.[otherUserId] || 0;  // 상대방이 읽지 않은 개수
        if (unread > 0) {
          console.log('🔴 상대방이 읽지 않은 메시지 발견!:', {
            roomId: room.id,
            otherUserId: otherUserId,
            unreadCount: unread,
            fullUnreadData: room.unreadCount
          });
        }
      });

      // 새 메시지 알림음 재생 (읽지 않은 메시지가 증가한 경우)
      if (dmLoaded && notificationSettings.enabled && currentUserId) {
        rooms.forEach(room => {
          const currentUnread = room.unreadCount?.[currentUserId] || 0;
          const prevUnread = prevUnreadCountRef.current[room.id] || 0;

          // 읽지 않은 메시지가 증가했으면 알림음 재생
          if (currentUnread > prevUnread && currentUnread > 0) {
            playNewMessageNotification();
          }

          prevUnreadCountRef.current[room.id] = currentUnread;
        });
      }

      setChatRooms(rooms);
      dmLoaded = true;
      if (groupLoaded) setLoading(false);
    });

    // 그룹 채팅방 목록 실시간 구독
    const unsubscribeGroup = subscribeToMyGroupChats((groups) => {
      console.log('📁 그룹 채팅방 목록 업데이트:', groups);

      // 그룹 채팅도 동일하게 알림음 재생
      if (groupLoaded && notificationSettings.enabled && currentUserId) {
        groups.forEach(group => {
          const currentUnread = group.unreadCount?.[currentUserId] || 0;
          const prevUnread = prevUnreadCountRef.current[group.id] || 0;

          if (currentUnread > prevUnread && currentUnread > 0) {
            playNewMessageNotification();
          }

          prevUnreadCountRef.current[group.id] = currentUnread;
        });
      }

      setGroupChats(groups);
      groupLoaded = true;
      if (dmLoaded) setLoading(false);
    });

    return () => {
      try {
        if (unsubscribeDM && typeof unsubscribeDM === 'function') {
          unsubscribeDM();
        }
      } catch (e) {
        console.error('DM 구독 해제 중 오류:', e);
      }

      try {
        if (unsubscribeGroup && typeof unsubscribeGroup === 'function') {
          unsubscribeGroup();
        }
      } catch (e) {
        console.error('그룹 구독 해제 중 오류:', e);
      }
    };
  }, []);

  // 1:1 대화 검색 필터링
  const filteredDMs = chatRooms.filter(room => {
    if (!searchQuery) return true;

    const otherUserId = room.participants?.find(id => id !== localStorage.getItem('firebaseUserId'));
    const otherUserInfo = room.participantsInfo?.[otherUserId];
    const displayName = otherUserInfo?.displayName || '익명';

    return displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // 그룹 채팅 검색 필터링
  const filteredGroups = groupChats.filter(group => {
    if (!searchQuery) return true;
    return group.groupName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // 전체 대화 목록 (1:1 + 그룹) - 최신순 정렬
  const allChats = [
    ...filteredDMs.map(room => ({ ...room, type: 'dm' })),
    ...filteredGroups.map(group => ({ ...group, type: 'group' }))
  ].sort((a, b) => {
    const aTime = a.lastMessageTime?.toMillis?.() || 0;
    const bTime = b.lastMessageTime?.toMillis?.() || 0;
    return bTime - aTime;
  });

  // 고정된 대화와 일반 대화 분리
  const pinnedChats = allChats.filter(chat => chat.pinned);
  const regularChats = allChats.filter(chat => !chat.pinned);

  const handleChatClick = (chat) => {
    console.log('대화방 클릭:', chat);
    setSelectedChat(chat);
  };

  const handleNewChat = () => {
    // 🔐 휴대폰 인증 필요
    if (requirePhoneAuth) {
      requirePhoneAuth('새 대화 시작', () => {
        // 인증 후 실행
        showToast?.('새 대화 시작 기능 구현 예정');
      });
    } else {
      // requirePhoneAuth가 없으면 바로 실행 (fallback)
      showToast?.('새 대화 시작 기능 구현 예정');
    }
  };

  const handleNewGroup = () => {
    // 🔐 휴대폰 인증 필요
    if (requirePhoneAuth) {
      requirePhoneAuth('그룹 채팅 생성', () => {
        // 인증 후 실행
        setShowCreateGroupModal(true);
      });
    } else {
      // requirePhoneAuth가 없으면 바로 실행 (fallback)
      setShowCreateGroupModal(true);
    }
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
          <ActionButtons>
            <NewChatButton onClick={handleNewChat} title="새 대화">
              <Plus size={18} />
            </NewChatButton>
            <NewGroupButton onClick={handleNewGroup} title="그룹 만들기">
              <Users size={18} />
            </NewGroupButton>
          </ActionButtons>
        </SearchBar>
      </SearchSection>

      {/* 대화 목록 */}
      <ChatListContainer>
        {allChats.length === 0 ? (
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
                {pinnedChats.map(chat => {
                  const currentUserId = localStorage.getItem('firebaseUserId');

                  // 1:1 대화인 경우
                  if (chat.type === 'dm') {
                    const otherUserId = chat.participants?.find(id => id !== currentUserId);
                    const otherUserInfo = chat.participantsInfo?.[otherUserId];
                    const displayName = otherUserInfo?.displayName || '익명';
                    const unreadCount = chat.unreadCount?.[currentUserId] || 0;

                    return (
                      <ChatItem
                        key={chat.id}
                        $unread={unreadCount > 0}
                        onClick={() => handleChatClick(chat)}
                      >
                        <ChatItemContent>
                          <Avatar $color={getAvatarColor(otherUserId)}>
                            {displayName.charAt(0).toUpperCase()}
                          </Avatar>
                          <ChatInfo>
                            <ChatHeader>
                              <ChatName>{displayName}</ChatName>
                              <ChatTime>{formatTime(chat.lastMessageTime)}</ChatTime>
                            </ChatHeader>
                            <ChatPreview $unread={unreadCount > 0}>
                              {chat.lastMessage || '대화를 시작해보세요'}
                            </ChatPreview>
                          </ChatInfo>
                        </ChatItemContent>
                        {unreadCount > 0 && (
                          <UnreadBadge>{unreadCount > 99 ? '99+' : unreadCount}</UnreadBadge>
                        )}
                      </ChatItem>
                    );
                  }

                  // 그룹 채팅인 경우
                  const groupName = chat.groupName || '이름 없는 그룹';
                  const unreadCount = chat.unreadCount?.[currentUserId] || 0;
                  const memberCount = chat.members?.length || 0;

                  return (
                    <ChatItem
                      key={chat.id}
                      $unread={unreadCount > 0}
                      onClick={() => handleChatClick(chat)}
                    >
                      <ChatItemContent>
                        <Avatar $color="linear-gradient(135deg, #667eea, #764ba2)">
                          <Users size={24} />
                        </Avatar>
                        <ChatInfo>
                          <ChatHeader>
                            <ChatName>
                              {groupName}
                              <GroupBadge>
                                <Users size={10} />
                                {memberCount}
                              </GroupBadge>
                            </ChatName>
                            <ChatTime>{formatTime(chat.lastMessageTime)}</ChatTime>
                          </ChatHeader>
                          <ChatPreview $unread={unreadCount > 0}>
                            {chat.lastMessage || '대화를 시작해보세요'}
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
                {regularChats.map(chat => {
                  const currentUserId = localStorage.getItem('firebaseUserId');

                  // 1:1 대화인 경우
                  if (chat.type === 'dm') {
                    const otherUserId = chat.participants?.find(id => id !== currentUserId);
                    const otherUserInfo = chat.participantsInfo?.[otherUserId];
                    const displayName = otherUserInfo?.displayName || '익명';
                    const unreadCount = chat.unreadCount?.[currentUserId] || 0;

                    return (
                      <ChatItem
                        key={chat.id}
                        $unread={unreadCount > 0}
                        onClick={() => handleChatClick(chat)}
                      >
                        <ChatItemContent>
                          <Avatar $color={getAvatarColor(otherUserId)}>
                            {displayName.charAt(0).toUpperCase()}
                          </Avatar>
                          <ChatInfo>
                            <ChatHeader>
                              <ChatName>{displayName}</ChatName>
                              <ChatTime>{formatTime(chat.lastMessageTime)}</ChatTime>
                            </ChatHeader>
                            <ChatPreview $unread={unreadCount > 0}>
                              {chat.lastMessage || '대화를 시작해보세요'}
                            </ChatPreview>
                          </ChatInfo>
                        </ChatItemContent>
                        {unreadCount > 0 && (
                          <UnreadBadge>{unreadCount > 99 ? '99+' : unreadCount}</UnreadBadge>
                        )}
                      </ChatItem>
                    );
                  }

                  // 그룹 채팅인 경우
                  const groupName = chat.groupName || '이름 없는 그룹';
                  const unreadCount = chat.unreadCount?.[currentUserId] || 0;
                  const memberCount = chat.members?.length || 0;

                  return (
                    <ChatItem
                      key={chat.id}
                      $unread={unreadCount > 0}
                      onClick={() => handleChatClick(chat)}
                    >
                      <ChatItemContent>
                        <Avatar $color="linear-gradient(135deg, #667eea, #764ba2)">
                          <Users size={24} />
                        </Avatar>
                        <ChatInfo>
                          <ChatHeader>
                            <ChatName>
                              {groupName}
                              <GroupBadge>
                                <Users size={10} />
                                {memberCount}
                              </GroupBadge>
                            </ChatName>
                            <ChatTime>{formatTime(chat.lastMessageTime)}</ChatTime>
                          </ChatHeader>
                          <ChatPreview $unread={unreadCount > 0}>
                            {chat.lastMessage || '대화를 시작해보세요'}
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

      {/* 그룹 생성 모달 */}
      {showCreateGroupModal && (
        <CreateGroupModal
          onClose={() => setShowCreateGroupModal(false)}
          showToast={showToast}
        />
      )}

      {/* 채팅방 전체화면 */}
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

export default ChatList;
