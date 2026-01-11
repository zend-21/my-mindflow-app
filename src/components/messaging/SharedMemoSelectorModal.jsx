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
  padding: 12px 12px 12px 40px;
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

    console.log('🔥 실시간 리스너 설정 - 공유 폴더 메모:', sharedMemoIds.length, '개', 'userId:', currentUserId);

    const unsubscribers = [];

    sharedMemoIds.forEach((id) => {
      if (!id) return;

      // mindflowUsers/{currentUserId}/memos/{memoId} 경로의 메모 감시 (본인의 메모만)
      const memoRef = doc(db, 'mindflowUsers', currentUserId, 'memos', id);

      const unsubscribe = onSnapshot(memoRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          console.log(`🔄 실시간 업데이트 - 메모 ${id}:`, {
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

    // 클린업: 모든 리스너 해제
    return () => {
      console.log('🧹 실시간 리스너 해제 -', unsubscribers.length, '개');
      unsubscribers.forEach(unsub => unsub());
    };
  }, [allMemos, currentUserId]); // allMemos 또는 currentUserId가 변경될 때마다 리스너 재설정

  // 프리즌 상태 체크 - pending 편집 기반 판단
  useEffect(() => {
    const checkFrozenStatus = async () => {
      if (sharedMemos.length === 0) return;

      const frozenSet = new Set();
      const pendingInfo = {};

      // 1. 먼저 모든 pending 편집 조회
      try {
        const editHistoryQuery = query(
          collectionGroup(db, 'editHistory'),
          where('status', '==', 'pending')
        );
        const snapshot = await getDocs(editHistoryQuery);

        // 메모별 pending 편집 정보 수집 (어느 방의 편집인지 포함)
        const memoEditInfo = {}; // { memoId: { count: n, chatRoomId: 'xxx' } }

        snapshot.docs.forEach(doc => {
          const pathParts = doc.ref.path.split('/');
          // 경로: chatRooms/{chatRoomId}/documents/{memoId}/editHistory/{editId}
          const editChatRoomId = pathParts[1];
          const memoId = pathParts[3];

          if (!memoEditInfo[memoId]) {
            memoEditInfo[memoId] = {
              count: 0,
              chatRoomId: editChatRoomId
            };
          }
          memoEditInfo[memoId].count++;
        });

        // 2. 각 메모의 상태 판단
        sharedMemos.forEach(memo => {
          const editInfo = memoEditInfo[memo.id];

          if (editInfo) {
            // pending 편집이 있는 메모
            if (editInfo.chatRoomId === chatRoomId) {
              // 현재 방의 편집 → 파란색 배지 (활성)
              console.log(`✅ 현재 방에서 작업 중: ${memo.id} (${editInfo.count}개 대기)`);
              pendingInfo[memo.id] = {
                pendingCount: editInfo.count,
                chatRoomId: editInfo.chatRoomId
              };
            } else {
              // 다른 방의 편집 → 빨간색 배지 (동결)
              console.log(`❄️ 다른 방에서 작업 중 (frozen): ${memo.id} (${editInfo.count}개 대기, 방: ${editInfo.chatRoomId})`);
              frozenSet.add(memo.id);
              pendingInfo[memo.id] = {
                pendingCount: editInfo.count,
                chatRoomId: editInfo.chatRoomId
              };
            }
          } else {
            // pending 편집이 없는 일반 메모
            console.log(`📄 일반 문서 (pending 편집 없음): ${memo.id}`);
          }
        });

        console.log('🔍 프리즌 체크 결과 (pending 편집 기반):', {
          chatRoomId,
          totalMemos: sharedMemos.length,
          frozenMemos: Array.from(frozenSet),
          pendingInfo
        });

        setFrozenMemoIds(frozenSet);
        setFrozenMemoInfo(pendingInfo);
      } catch (error) {
        console.error('프리즌 상태 체크 실패:', error);
      }
    };

    checkFrozenStatus();
  }, [sharedMemos, chatRoomId]);

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
              const isActiveInThisRoom = frozenInfo && !isFrozen; // 현재 방에서 작업 중
              const showBadge = isFrozen || isActiveInThisRoom; // frozen이거나 현재 방에서 작업 중이면 배지 표시

              return (
                <MemoItem
                  key={memo.id}
                  onClick={() => handleSelectMemo(memo)}
                  $frozen={isFrozen}
                >
                  <MemoHeader>
                    <MemoTitle>{getDisplayTitle(memo)}</MemoTitle>
                    {showBadge && (
                      <FrozenBadge $active={isActiveInThisRoom}>
                        {isFrozen && <Lock size={12} />}
                        {frozenInfo?.pendingCount || 0}개 대기
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
