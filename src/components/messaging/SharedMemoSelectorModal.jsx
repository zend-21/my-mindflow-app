// 📄 공유 폴더 메모 선택 모달
import { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { X, Search, FileText, Calendar, Folder, Lock } from 'lucide-react';
import { checkFrozenDocuments } from '../../utils/frozenDocumentUtils';
import { collection, collectionGroup, query, where, getDocs, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';

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
  z-index: 100001;
  backdrop-filter: blur(4px);
`;

const ModalContainer = styled.div`
  background: linear-gradient(180deg, #2a2d35, #1f2128);
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseButton = styled.button`
  background: transparent;
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

const SearchContainer = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const SearchWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  color: #888;
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px 36px 12px 40px;
  color: #e0e0e0;
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

const SearchClearButton = styled.button`
  position: absolute;
  right: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #888;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }
`;

const MemoList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px 24px 24px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-auto-rows: minmax(min-content, max-content);
  column-gap: 12px;
  row-gap: 12px;
  align-content: flex-start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const MemoItem = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  cursor: ${props => props.$frozen ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: fit-content;
  min-width: 0;
  overflow: hidden;
  margin-bottom: 0;
  opacity: ${props => props.$frozen ? 0.5 : 1};
  position: relative;

  ${props => props.$frozen && `
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 12px;
    }
  `}

  &:hover {
    background: ${props => props.$frozen ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.08)'};
    border-color: ${props => props.$frozen ? 'rgba(255, 255, 255, 0.1)' : '#4a90e2'};
    transform: ${props => props.$frozen ? 'none' : 'translateY(-2px)'};
  }

  &:active {
    transform: ${props => props.$frozen ? 'none' : 'scale(0.98)'};
  }
`;

const MemoHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  position: relative;
  z-index: 1;
`;

const MemoTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
  overflow-wrap: break-word;
  flex: 1;
`;

const FrozenBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background: ${props => props.$active ? 'rgba(74, 144, 226, 0.15)' : 'rgba(255, 68, 68, 0.15)'};
  border: 1px solid ${props => props.$active ? 'rgba(74, 144, 226, 0.3)' : 'rgba(255, 68, 68, 0.3)'};
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
  color: ${props => props.$active ? '#4a90e2' : '#ff6b6b'};
  white-space: nowrap;
  flex-shrink: 0;
  position: relative;
  z-index: 2;
`;

const DownloadedBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(76, 175, 80, 0.15);
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
  color: #4caf50;
  white-space: nowrap;
  flex-shrink: 0;
`;

const MemoPreview = styled.p`
  font-size: 11px;
  color: #888;
  margin: 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
`;

const MemoDate = styled.div`
  font-size: 11px;
  color: #666;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #888;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyText = styled.p`
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const EmptyDescription = styled.p`
  font-size: 13px;
  color: #666;
  margin: 0;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #888;
  font-size: 14px;
`;

const SharedMemoSelectorModal = ({ onClose, onSelectMemo, showToast, allMemos, chatRoomId, chatType, currentUserId }) => {
  const [filteredMemos, setFilteredMemos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [frozenMemoIds, setFrozenMemoIds] = useState(new Set());
  const [frozenMemoInfo, setFrozenMemoInfo] = useState({});
  const [realtimeMemoData, setRealtimeMemoData] = useState({}); // 실시간 메모 데이터 (currentWorkingRoomId, hasPendingEdits)

  // allMemos에서 folderId === 'shared'인 메모만 필터링 (useMemo로 메모이제이션)
  const sharedMemos = useMemo(() => {
    const filtered = allMemos?.filter(memo => memo.folderId === 'shared') || [];
    // 실시간 데이터와 병합
    return filtered.map(memo => ({
      ...memo,
      ...(realtimeMemoData[memo.id] || {})
    }));
  }, [allMemos, realtimeMemoData]);

  // 🔥 실시간 리스너: shared 폴더 메모들의 currentWorkingRoomId와 hasPendingEdits 감시
  useEffect(() => {
    const sharedMemoIds = allMemos?.filter(memo => memo.folderId === 'shared').map(memo => memo.id) || [];

    if (sharedMemoIds.length === 0 || !currentUserId) return;

    console.log('🔥 [실시간 리스너] 시작 - 메모 개수:', sharedMemoIds.length);

    const unsubscribers = [];

    sharedMemoIds.forEach((id) => {
      if (!id) return;

      const memoRef = doc(db, 'mindflowUsers', currentUserId, 'memos', id);

      const unsubscribe = onSnapshot(memoRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();

          console.log('📡 [실시간 업데이트] 메모:', id, {
            currentWorkingRoomId: data.currentWorkingRoomId,
            hasPendingEdits: data.hasPendingEdits
          });

          setRealtimeMemoData(prev => ({
            ...prev,
            [id]: {
              currentWorkingRoomId: data.currentWorkingRoomId,
              hasPendingEdits: data.hasPendingEdits
            }
          }));
        }
      }, (error) => {
        console.error(`실시간 리스너 오류 (메모 ${id}):`, error);
      });

      unsubscribers.push(unsubscribe);
    });

    return () => {
      console.log('🔇 [실시간 리스너] 종료');
      unsubscribers.forEach(unsub => unsub());
    };
  }, [allMemos, currentUserId]);

  // 프리즌 상태 체크 - 실제 editHistory 개수 조회
  useEffect(() => {
    const checkFrozenStatus = async () => {
      if (sharedMemos.length === 0 || !currentUserId) return;

      // ⚠️ [중요] 실시간 리스너가 초기 데이터를 받을 때까지 약간 대기
      // 그렇지 않으면 allMemos의 오래된 currentWorkingRoomId를 사용함
      await new Promise(resolve => setTimeout(resolve, 100));

      const frozenSet = new Set();
      const pendingInfo = {};

      console.log('🔍 [Frozen 체크] 시작 - chatRoomId:', chatRoomId);

      // 각 메모의 실제 editHistory 개수 조회
      for (const memo of sharedMemos) {
        // ⚠️ [중요] 실시간 데이터를 우선 사용 (realtimeMemoData가 가장 최신 상태)
        // null도 유효한 값이므로 undefined와 구분해야 함 (null은 "협업 안 함" 상태)
        const realtimeData = realtimeMemoData[memo.id];
        // realtimeData가 존재하고, currentWorkingRoomId 키가 명시적으로 있을 때만 실시간 값 사용
        const workingRoomId = (realtimeData && 'currentWorkingRoomId' in realtimeData)
          ? realtimeData.currentWorkingRoomId
          : memo.currentWorkingRoomId;

        console.log('🔍 [Frozen 체크] 메모:', memo.id, {
          memoWorkingRoomId: memo.currentWorkingRoomId,
          realtimeWorkingRoomId: realtimeMemoData[memo.id]?.currentWorkingRoomId,
          finalWorkingRoomId: workingRoomId,
          currentChatRoomId: chatRoomId
        });

        if (!workingRoomId) {
          console.log('✅ [Frozen 체크] 스킵 (workingRoomId 없음):', memo.id);
          continue;
        }

        try {
          // 실제 editHistory 문서 개수 조회
          const editsRef = collection(db, 'chatRooms', workingRoomId, 'documents', memo.id, 'editHistory');
          const pendingQuery = query(editsRef, where('status', '==', 'pending'));
          const snapshot = await getDocs(pendingQuery);
          const actualCount = snapshot.size;

          console.log('📊 [Frozen 체크] editHistory 개수:', memo.id, actualCount);

          if (workingRoomId === chatRoomId) {
            // 현재 방에서 열어놓은 문서
            if (actualCount === 0) {
              // 마커 없음 → 배지 표시 안 함
              console.log('✅ [Frozen 체크] 현재 방 - 마커 없음 - 배지 없음:', memo.id);
              continue;
            }
            // 마커 있음 → "N개 대기" 파란색 배지 (실시간 개수 표시)
            console.log('📝 [Frozen 체크] 현재 방 - 작업 중:', memo.id, `(${actualCount}개 대기 - 파란색)`);
            pendingInfo[memo.id] = {
              pendingCount: actualCount,
              chatRoomId: workingRoomId,
              isWorkingInOtherRoom: false
            };
          } else {
            // 다른 방에서 열어놓은 문서 (동결)
            // ⚠️ actualCount와 무관하게 frozen 상태 & 배지 표시
            // - actualCount > 0: "N개 대기" 빨간색 배지
            // - actualCount === 0: "협업 대기중" 빨간색 배지
            console.log('🔒 [Frozen 체크] 다른 방 - frozen:', memo.id,
              actualCount > 0 ? `(${actualCount}개 대기 - 빨간색)` : '(협업 대기중 - 빨간색)');
            frozenSet.add(memo.id);
            pendingInfo[memo.id] = {
              pendingCount: actualCount,
              chatRoomId: workingRoomId,
              isWorkingInOtherRoom: true
            };
          }
        } catch (error) {
          console.error(`메모 ${memo.id} 체크 실패:`, error);
        }
      }

      setFrozenMemoIds(frozenSet);
      setFrozenMemoInfo(pendingInfo);
    };

    checkFrozenStatus();
  }, [sharedMemos, chatRoomId, currentUserId, realtimeMemoData]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredMemos(sharedMemos);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = sharedMemos.filter(memo =>
        memo.title?.toLowerCase().includes(query) ||
        memo.content?.toLowerCase().includes(query)
      );
      setFilteredMemos(filtered);
    }
  }, [searchQuery, sharedMemos]);

  const handleSelectMemo = (memo) => {
    // 다른 대화방에서 편집 중인 문서는 불러올 수 없음
    if (frozenMemoIds.has(memo.id)) {
      showToast?.('이 문서는 다른방에서 협업중인 문서로 불러올 수 없습니다.');
      return;
    }

    onSelectMemo(memo);
    onClose();
  };

  // 제목이 없으면 메모 첫 줄에서 10자 추출
  const getDisplayTitle = (memo) => {
    if (memo.title && memo.title.trim() !== '') {
      return memo.title;
    }
    if (memo.content && memo.content.trim() !== '') {
      const firstLine = memo.content.split('\n')[0].trim();
      return firstLine.substring(0, 10) || '제목 없음';
    }
    return '제목 없음';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <Folder size={20} />
            공유 폴더에서 불러오기
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <SearchContainer>
          <SearchWrapper>
            <SearchIcon>
              <Search size={18} />
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder="메모 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <SearchClearButton onClick={() => setSearchQuery('')}>
                <X size={12} />
              </SearchClearButton>
            )}
          </SearchWrapper>
        </SearchContainer>

        <MemoList>
          {filteredMemos.length === 0 ? (
            <EmptyState>
              <EmptyIcon>📂</EmptyIcon>
              <EmptyText>
                {searchQuery ? '검색 결과가 없습니다' : '공유 폴더에 문서가 없습니다'}
              </EmptyText>
              <EmptyDescription>
                {searchQuery
                  ? '다른 검색어를 입력해보세요'
                  : '메모 페이지에서 공유 폴더에 문서를 추가하세요'}
              </EmptyDescription>
            </EmptyState>
          ) : (
            filteredMemos.map(memo => {
              const isFrozen = frozenMemoIds.has(memo.id);
              const frozenInfo = frozenMemoInfo[memo.id];
              const pendingCount = frozenInfo?.pendingCount || 0;
              const isActiveInThisRoom = frozenInfo && !isFrozen; // 현재 방에서 작업 중

              // ⚠️ [중요] 배지 표시 조건:
              // 1. 다른 방에서 불러온 상태 (isFrozen = true) → 항상 표시 ("협업 대기중")
              // 2. 현재 방에서 작업 중 (isActiveInThisRoom = true) AND pendingCount > 0 → 표시 ("N개 대기")
              // 3. 현재 방에서 작업 중이지만 pendingCount = 0 (모두 승인/거절) → 표시 안 함 (일반 문서로 복귀)
              const showBadge = isFrozen || (isActiveInThisRoom && pendingCount > 0);

              // 배지 텍스트 결정
              const getBadgeText = () => {
                if (!frozenInfo) return '';
                // 다른 방에서 불러온 상태 (수정 없음)
                if (pendingCount === 0 && isFrozen) return '협업 대기중';
                // 수정 대기중
                return `${pendingCount}개 대기`;
              };

              return (
                <MemoItem
                  key={memo.id}
                  onClick={() => handleSelectMemo(memo)}
                  $frozen={isFrozen}
                >
                  <MemoHeader>
                    <MemoTitle>{getDisplayTitle(memo)}</MemoTitle>
                    {memo.isDownloaded && (
                      <DownloadedBadge>다운로드</DownloadedBadge>
                    )}
                    {showBadge && (
                      <FrozenBadge $active={isActiveInThisRoom}>
                        {isFrozen && <Lock size={12} />}
                        {getBadgeText()}
                      </FrozenBadge>
                    )}
                  </MemoHeader>
                  {memo.content && (
                    <MemoPreview>{memo.content}</MemoPreview>
                  )}
                  <MemoDate>
                    {formatDate(memo.updatedAt || memo.createdAt)}
                  </MemoDate>
                </MemoItem>
              );
            })
          )}
        </MemoList>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default SharedMemoSelectorModal;
