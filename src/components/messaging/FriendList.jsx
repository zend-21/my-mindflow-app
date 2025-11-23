// 👥 친구 탭 - 친구 관리 및 추가
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { QrCode, Search, UserPlus, MessageCircle, UserMinus, Check, X, Inbox, Copy } from 'lucide-react';
import { getMyFriends } from '../../services/friendService';
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

// 컨테이너
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: transparent;
`;

// 내 친구 코드 섹션
const MyCodeSection = styled.div`
  padding: 12px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(74, 144, 226, 0.05);
`;

const MyCodeBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const MyCodeLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`;

const MyCodeTitle = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MyCodeValue = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #4a90e2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CopyButton = styled.button`
  background: rgba(74, 144, 226, 0.1);
  border: 1px solid rgba(74, 144, 226, 0.3);
  color: #4a90e2;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;

  &:hover {
    background: rgba(74, 144, 226, 0.2);
    border-color: rgba(74, 144, 226, 0.5);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

// 검색 섹션
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

const IconButton = styled.button`
  background: ${props => props.$primary ? 'linear-gradient(135deg, #4a90e2, #357abd)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.$primary ? 'transparent' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.$primary ? '#ffffff' : '#888'};
  padding: 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${props => props.$primary ? '0 4px 12px rgba(74, 144, 226, 0.3)' : 'none'};

  &:hover {
    background: ${props => props.$primary ? 'linear-gradient(135deg, #357abd, #2a5f8f)' : 'rgba(255, 255, 255, 0.08)'};
    transform: ${props => props.$primary ? 'translateY(-2px)' : 'none'};
  }

  &:active {
    transform: translateY(0);
  }
`;

// 친구 요청 알림 섹션
const RequestNotice = styled.div`
  margin: 16px 20px;
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.1), rgba(53, 122, 189, 0.1));
  border: 1px solid rgba(74, 144, 226, 0.2);
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: linear-gradient(135deg, rgba(74, 144, 226, 0.15), rgba(53, 122, 189, 0.15));
    transform: translateY(-2px);
  }
`;

const RequestInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const RequestIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4a90e2, #357abd);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
`;

const RequestText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const RequestTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
`;

const RequestSubtitle = styled.div`
  font-size: 12px;
  color: #888;
`;

const RequestBadge = styled.div`
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 12px;
  min-width: 24px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.4);
`;

// 친구 목록
const FriendListContainer = styled.div`
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
  justify-content: space-between;
  align-items: center;
`;

const FriendCount = styled.span`
  color: #4a90e2;
  font-weight: 700;
`;

// 친구 카드
const FriendCard = styled.div`
  margin: 8px 20px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(74, 144, 226, 0.3);
  }
`;

const FriendCardContent = styled.div`
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
  font-weight: 600;
  color: #ffffff;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.1);
  position: relative;
`;

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: ${props => props.$online ? '#2ed573' : '#666'};
  border: 2px solid #1a1a1a;
`;

const FriendInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FriendName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FriendMeta = styled.div`
  font-size: 12px;
  color: #888;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 6px;
  flex-shrink: 0;
`;

const ActionButton = styled.button`
  background: ${props => {
    if (props.$variant === 'primary') return 'rgba(74, 144, 226, 0.2)';
    if (props.$variant === 'success') return 'rgba(46, 213, 115, 0.2)';
    if (props.$variant === 'danger') return 'rgba(255, 107, 107, 0.2)';
    return 'rgba(255, 255, 255, 0.05)';
  }};
  border: 1px solid ${props => {
    if (props.$variant === 'primary') return 'rgba(74, 144, 226, 0.4)';
    if (props.$variant === 'success') return 'rgba(46, 213, 115, 0.4)';
    if (props.$variant === 'danger') return 'rgba(255, 107, 107, 0.4)';
    return 'rgba(255, 255, 255, 0.1)';
  }};
  color: ${props => {
    if (props.$variant === 'primary') return '#4a90e2';
    if (props.$variant === 'success') return '#2ed573';
    if (props.$variant === 'danger') return '#ff6b6b';
    return '#888';
  }};
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    opacity: 0.8;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
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

const EmptyAction = styled.button`
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

const FriendList = ({ showToast }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState({ received: 0, sent: 0 });
  const [loading, setLoading] = useState(true);
  const [myWsCode, setMyWsCode] = useState(null);

  useEffect(() => {
    loadMyWsCode();
    loadFriends();
    loadFriendRequests();
  }, []);

  const loadMyWsCode = async () => {
    try {
      const userId = localStorage.getItem('firebaseUserId');
      if (!userId) return;

      const workspaceId = `workspace_${userId}`;
      const workspaceRef = doc(db, 'workspaces', workspaceId);
      const workspaceDoc = await getDoc(workspaceRef);

      if (workspaceDoc.exists()) {
        const code = workspaceDoc.data().workspaceCode;
        setMyWsCode(code);
      }
    } catch (error) {
      console.error('WS 코드 로드 오류:', error);
    }
  };

  const loadFriends = async () => {
    try {
      const friendsList = await getMyFriends();
      console.log('👥 친구 목록:', friendsList);
      setFriends(friendsList);
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
      if (!userId) return;

      // 받은 요청
      const receivedQuery = query(
        collection(db, 'friendRequests'),
        where('receiverId', '==', userId),
        where('status', '==', 'pending')
      );

      // 보낸 요청
      const sentQuery = query(
        collection(db, 'friendRequests'),
        where('senderId', '==', userId),
        where('status', '==', 'pending')
      );

      const [receivedSnapshot, sentSnapshot] = await Promise.all([
        getDocs(receivedQuery),
        getDocs(sentQuery)
      ]);

      setFriendRequests({
        received: receivedSnapshot.size,
        sent: sentSnapshot.size
      });
    } catch (error) {
      console.error('친구 요청 조회 오류:', error);
    }
  };

  // 검색 필터링
  const filteredFriends = friends.filter(friend => {
    if (!searchQuery) return true;

    const name = friend.friendName?.toLowerCase() || '';
    const wsCode = friend.friendWorkspaceCode?.toLowerCase() || '';
    const email = friend.friendEmail?.toLowerCase() || '';

    return name.includes(searchQuery.toLowerCase()) ||
           wsCode.includes(searchQuery.toLowerCase()) ||
           email.includes(searchQuery.toLowerCase());
  });

  const handleSearch = () => {
    if (searchQuery.trim().length === 0) {
      showToast?.('검색어를 입력해주세요');
      return;
    }
    // TODO: 친구 검색 모달 열기
    showToast?.('친구 검색 기능 구현 예정');
  };

  const handleQRScan = () => {
    // TODO: QR 스캔 모달 열기
    showToast?.('QR 스캔 기능 구현 예정');
  };

  const handleViewRequests = () => {
    // TODO: 친구 요청 모달 열기
    showToast?.('친구 요청 확인 기능 구현 예정');
  };

  const handleStartChat = (friend) => {
    // TODO: 1:1 대화 시작
    console.log('대화 시작:', friend);
    showToast?.('대화 시작 기능 구현 예정');
  };

  const handleRemoveFriend = (friend) => {
    // TODO: 친구 삭제
    console.log('친구 삭제:', friend);
    showToast?.('친구 삭제 기능 구현 예정');
  };

  const handleCopyMyCode = () => {
    if (myWsCode) {
      navigator.clipboard.writeText(myWsCode.toLowerCase());
      showToast?.('친구 코드가 복사되었습니다');
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
      {/* 내 친구 코드 */}
      {myWsCode && (
        <MyCodeSection>
          <MyCodeBox>
            <MyCodeLabel>
              <MyCodeTitle>내 친구 코드</MyCodeTitle>
              <MyCodeValue>{myWsCode?.toLowerCase()}</MyCodeValue>
            </MyCodeLabel>
            <CopyButton onClick={handleCopyMyCode}>
              <Copy size={14} />
              복사
            </CopyButton>
          </MyCodeBox>
        </MyCodeSection>
      )}

      {/* 검색 바 */}
      <SearchSection>
        <SearchBar>
          <SearchInputWrapper>
            <SearchInput
              type="text"
              placeholder="친구 WS 코드 입력 (예: WS-Y3T1ZM)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
            />
          </SearchInputWrapper>
          {searchQuery.trim().length > 0 ? (
            <IconButton $primary onClick={handleSearch}>
              <Search size={20} />
            </IconButton>
          ) : (
            <IconButton onClick={handleQRScan}>
              <QrCode size={20} />
            </IconButton>
          )}
        </SearchBar>
      </SearchSection>

      {/* 친구 요청 알림 */}
      {friendRequests.received > 0 && (
        <RequestNotice onClick={handleViewRequests}>
          <RequestInfo>
            <RequestIcon>
              <Inbox size={20} />
            </RequestIcon>
            <RequestText>
              <RequestTitle>새로운 친구 요청</RequestTitle>
              <RequestSubtitle>받은 요청 {friendRequests.received}건</RequestSubtitle>
            </RequestText>
          </RequestInfo>
          <RequestBadge>{friendRequests.received}</RequestBadge>
        </RequestNotice>
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
              <EmptyAction onClick={handleQRScan}>
                <QrCode size={18} />
                QR 코드로 친구 추가
              </EmptyAction>
            )}
          </EmptyState>
        ) : (
          <>
            <SectionTitle>
              내 친구
              <FriendCount>{filteredFriends.length}</FriendCount>
            </SectionTitle>

            {filteredFriends.map(friend => (
              <FriendCard key={friend.id}>
                <FriendCardContent>
                  <Avatar $color={getAvatarColor(friend.friendId)}>
                    {friend.friendName?.charAt(0).toUpperCase() || '?'}
                    <OnlineIndicator $online={false} />
                  </Avatar>

                  <FriendInfo>
                    <FriendName>{friend.friendName || '익명'}</FriendName>
                    <FriendMeta>
                      <span>{friend.friendWorkspaceCode?.toLowerCase() || '-'}</span>
                      {friend.friendEmail && (
                        <>
                          <span>•</span>
                          <span>{friend.friendEmail}</span>
                        </>
                      )}
                    </FriendMeta>
                  </FriendInfo>

                  <ActionButtons>
                    <ActionButton
                      $variant="primary"
                      onClick={() => handleStartChat(friend)}
                    >
                      <MessageCircle size={16} />
                      대화
                    </ActionButton>
                    <ActionButton
                      $variant="danger"
                      onClick={() => handleRemoveFriend(friend)}
                    >
                      <UserMinus size={16} />
                    </ActionButton>
                  </ActionButtons>
                </FriendCardContent>
              </FriendCard>
            ))}
          </>
        )}
      </FriendListContainer>
    </Container>
  );
};

export default FriendList;
