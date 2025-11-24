// 📄 공유 폴더 메모 선택 모달
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Search, FileText, Calendar, Folder } from 'lucide-react';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { checkMemoSharedStatus } from '../../services/collaborationRoomService';

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
  padding: 16px 24px;

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
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: #4a90e2;
    transform: translateY(-2px);
  }
`;

const MemoHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
`;

const MemoIcon = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #4a90e2, #357abd);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const MemoInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const MemoTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MemoFolder = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #2ed573;
  font-weight: 500;
`;

const MemoPreview = styled.p`
  font-size: 13px;
  color: #888;
  margin: 8px 0 0 0;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const MemoDate = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  margin-top: 8px;
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

const SharedMemoSelectorModal = ({ onClose, onSelectMemo, showToast }) => {
  const [memos, setMemos] = useState([]);
  const [filteredMemos, setFilteredMemos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSharedMemos();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredMemos(memos);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = memos.filter(memo =>
        memo.title?.toLowerCase().includes(query) ||
        memo.content?.toLowerCase().includes(query)
      );
      setFilteredMemos(filtered);
    }
  }, [searchQuery, memos]);

  const loadSharedMemos = async () => {
    try {
      const userId = localStorage.getItem('firebaseUserId');
      if (!userId) {
        showToast?.('사용자 정보를 찾을 수 없습니다');
        return;
      }

      // 1. 사용자의 모든 메모 가져오기
      const memosRef = collection(db, 'memos');
      const q = query(
        memosRef,
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const allMemos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 2. 공유된 메모 필터링 (메모 페이지와 동일한 로직)
      const sharedMemos = [];
      for (const memo of allMemos) {
        // folderId가 'shared'이거나, collaborationRooms에 연결된 메모
        if (memo.folder === 'shared' || memo.folderId === 'shared') {
          sharedMemos.push(memo);
        } else {
          // collaborationRooms 확인
          const result = await checkMemoSharedStatus(memo.id);
          if (result.isShared && result.room) {
            sharedMemos.push(memo);
          }
        }
      }

      setMemos(sharedMemos);
      setFilteredMemos(sharedMemos);
    } catch (error) {
      console.error('공유 메모 불러오기 실패:', error);
      showToast?.('공유 메모를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMemo = (memo) => {
    onSelectMemo(memo);
    onClose();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
          {loading ? (
            <LoadingState>메모를 불러오는 중...</LoadingState>
          ) : filteredMemos.length === 0 ? (
            <EmptyState>
              <EmptyIcon>📂</EmptyIcon>
              <EmptyText>
                {searchQuery ? '검색 결과가 없습니다' : '공유 폴더에 메모가 없습니다'}
              </EmptyText>
              <EmptyDescription>
                {searchQuery
                  ? '다른 검색어를 입력해보세요'
                  : '메모 페이지에서 공유 폴더에 메모를 추가하세요'}
              </EmptyDescription>
            </EmptyState>
          ) : (
            filteredMemos.map(memo => (
              <MemoItem key={memo.id} onClick={() => handleSelectMemo(memo)}>
                <MemoHeader>
                  <MemoIcon>
                    <FileText size={20} color="#ffffff" />
                  </MemoIcon>
                  <MemoInfo>
                    <MemoTitle>{memo.title || '제목 없음'}</MemoTitle>
                    <MemoFolder>
                      <Folder size={12} />
                      공유
                    </MemoFolder>
                  </MemoInfo>
                </MemoHeader>
                {memo.content && (
                  <MemoPreview>{memo.content}</MemoPreview>
                )}
                <MemoDate>
                  <Calendar size={12} />
                  {formatDate(memo.updatedAt)}
                </MemoDate>
              </MemoItem>
            ))
          )}
        </MemoList>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default SharedMemoSelectorModal;
