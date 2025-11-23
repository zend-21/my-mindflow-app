// 📁 방 탭 - 협업방/그룹 대화 목록
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Search, Plus, Users, Lock, Globe } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';

// 컨테이너
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: transparent;
`;

// 검색 및 필터 섹션
const SearchSection = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.02);
`;

const SearchBar = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
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

const NewRoomButton = styled.button`
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

// 필터 버튼
const FilterBar = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;

  &::-webkit-scrollbar {
    height: 0px;
  }
`;

const FilterButton = styled.button`
  background: ${props => props.$active ? 'rgba(74, 144, 226, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.$active ? 'rgba(74, 144, 226, 0.4)' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.$active ? '#4a90e2' : '#888'};
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: ${props => props.$active ? 'rgba(74, 144, 226, 0.25)' : 'rgba(255, 255, 255, 0.08)'};
  }
`;

// 방 목록
const RoomListContainer = styled.div`
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
`;

// 방 카드
const RoomCard = styled.div`
  margin: 8px 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(74, 144, 226, 0.3);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const RoomHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
  gap: 12px;
`;

const RoomTitleSection = styled.div`
  flex: 1;
  min-width: 0;
`;

const RoomTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
`;

const RoomMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #888;
`;

const RoomType = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: ${props => props.$type === 'open' ? 'rgba(46, 213, 115, 0.15)' : 'rgba(255, 165, 0, 0.15)'};
  border-radius: 6px;
  color: ${props => props.$type === 'open' ? '#2ed573' : '#ffa500'};
  font-weight: 500;
`;

const RoomStats = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #888;
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
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

const RoomList = ({ showToast }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, my, joined
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('firebaseUserId');
    if (!userId) {
      setLoading(false);
      return;
    }

    // 내가 만든 방 + 참여중인 방 모두 가져오기
    const roomsRef = collection(db, 'collaborationRooms');

    // 두 가지 쿼리 결합: 내가 만든 방 + 참여중인 방
    const q1 = query(
      roomsRef,
      where('ownerId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    const q2 = query(
      roomsRef,
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    // 두 쿼리를 동시에 구독
    const unsubscribe1 = onSnapshot(q1, (snapshot1) => {
      const unsubscribe2 = onSnapshot(q2, (snapshot2) => {
        const ownedRooms = snapshot1.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isOwner: true
        }));

        const joinedRooms = snapshot2.docs
          .filter(doc => doc.data().ownerId !== userId) // 중복 제거
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            isOwner: false
          }));

        const allRooms = [...ownedRooms, ...joinedRooms]
          .sort((a, b) => {
            const aTime = a.updatedAt?.toMillis?.() || 0;
            const bTime = b.updatedAt?.toMillis?.() || 0;
            return bTime - aTime;
          });

        setRooms(allRooms);
        setLoading(false);
      });

      return unsubscribe2;
    });

    return () => {
      if (typeof unsubscribe1 === 'function') unsubscribe1();
    };
  }, []);

  // 필터링
  const filteredRooms = rooms.filter(room => {
    // 검색 필터
    if (searchQuery) {
      const matchTitle = room.memoTitle?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchTitle) return false;
    }

    // 소유권 필터
    if (filter === 'my') return room.isOwner;
    if (filter === 'joined') return !room.isOwner;

    return true;
  });

  // 내가 만든 방 / 참여중인 방 분리
  const myRooms = filteredRooms.filter(room => room.isOwner);
  const joinedRooms = filteredRooms.filter(room => !room.isOwner);

  const handleRoomClick = (room) => {
    // TODO: 방 입장
    console.log('방 클릭:', room);
    showToast?.('방 입장 기능 구현 예정');
  };

  const handleNewRoom = () => {
    // TODO: 새 방 만들기
    showToast?.('새 방 만들기 기능 구현 예정');
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

  if (loading) {
    return (
      <Container>
        <EmptyState>
          <EmptyIcon>📁</EmptyIcon>
          <EmptyTitle>방 목록을 불러오는 중...</EmptyTitle>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      {/* 검색 및 필터 */}
      <SearchSection>
        <SearchBar>
          <SearchInputWrapper>
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder="방 코드 또는 이름 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchInputWrapper>
          <NewRoomButton onClick={handleNewRoom}>
            <Plus size={20} />
          </NewRoomButton>
        </SearchBar>

        <FilterBar>
          <FilterButton
            $active={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            전체 ({rooms.length})
          </FilterButton>
          <FilterButton
            $active={filter === 'my'}
            onClick={() => setFilter('my')}
          >
            내가 만든 방 ({myRooms.length})
          </FilterButton>
          <FilterButton
            $active={filter === 'joined'}
            onClick={() => setFilter('joined')}
          >
            참여중인 방 ({joinedRooms.length})
          </FilterButton>
        </FilterBar>
      </SearchSection>

      {/* 방 목록 */}
      <RoomListContainer>
        {filteredRooms.length === 0 ? (
          <EmptyState>
            <EmptyIcon>📁</EmptyIcon>
            <EmptyTitle>
              {searchQuery ? '검색 결과 없음' : '참여중인 방이 없습니다'}
            </EmptyTitle>
            <EmptyDescription>
              {searchQuery
                ? '다른 검색어를 입력해보세요'
                : '새 방을 만들거나\n친구로부터 초대를 받아보세요'}
            </EmptyDescription>
          </EmptyState>
        ) : (
          <>
            {/* 내가 만든 방 */}
            {(filter === 'all' || filter === 'my') && myRooms.length > 0 && (
              <>
                <SectionTitle>내가 만든 방</SectionTitle>
                {myRooms.map(room => (
                  <RoomCard key={room.id} onClick={() => handleRoomClick(room)}>
                    <RoomHeader>
                      <RoomTitleSection>
                        <RoomTitle>{room.memoTitle || '제목 없음'}</RoomTitle>
                        <RoomMeta>
                          <RoomType $type={room.roomType}>
                            {room.roomType === 'open' ? (
                              <>
                                <Globe size={12} />
                                개방형
                              </>
                            ) : (
                              <>
                                <Lock size={12} />
                                제한형
                              </>
                            )}
                          </RoomType>
                          {room.status === 'archived' && (
                            <span style={{ color: '#ff6b6b' }}>• 폐쇄됨</span>
                          )}
                        </RoomMeta>
                      </RoomTitleSection>
                    </RoomHeader>

                    <RoomStats>
                      <StatItem>
                        <Users size={14} />
                        {room.participants?.length || 0}명 참여
                      </StatItem>
                      <StatItem>
                        • {formatTime(room.updatedAt)}
                      </StatItem>
                    </RoomStats>
                  </RoomCard>
                ))}
              </>
            )}

            {/* 참여중인 방 */}
            {(filter === 'all' || filter === 'joined') && joinedRooms.length > 0 && (
              <>
                <SectionTitle>참여중인 방</SectionTitle>
                {joinedRooms.map(room => (
                  <RoomCard key={room.id} onClick={() => handleRoomClick(room)}>
                    <RoomHeader>
                      <RoomTitleSection>
                        <RoomTitle>{room.memoTitle || '제목 없음'}</RoomTitle>
                        <RoomMeta>
                          <RoomType $type={room.roomType}>
                            {room.roomType === 'open' ? (
                              <>
                                <Globe size={12} />
                                개방형
                              </>
                            ) : (
                              <>
                                <Lock size={12} />
                                제한형
                              </>
                            )}
                          </RoomType>
                          {room.status === 'archived' && (
                            <span style={{ color: '#ff6b6b' }}>• 폐쇄됨</span>
                          )}
                        </RoomMeta>
                      </RoomTitleSection>
                    </RoomHeader>

                    <RoomStats>
                      <StatItem>
                        <Users size={14} />
                        {room.participants?.length || 0}명 참여
                      </StatItem>
                      <StatItem>
                        • {formatTime(room.updatedAt)}
                      </StatItem>
                    </RoomStats>
                  </RoomCard>
                ))}
              </>
            )}
          </>
        )}
      </RoomListContainer>
    </Container>
  );
};

export default RoomList;
