// 메모 선택 모달 - 기존 메모를 채팅방에 첨부
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Search, FileText, Calendar } from 'lucide-react';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100001;
  padding: 20px;
  backdrop-filter: blur(5px);
`;

const Modal = styled.div`
  background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Header = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
  }
`;

const SearchSection = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

const SearchInputWrapper = styled.div`
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

const Content = styled.div`
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

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const MemoItem = styled.div`
  padding: 16px 24px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
  display: flex;
  gap: 12px;
  align-items: flex-start;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-left-color: #4a90e2;
  }

  &:active {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const MemoIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #4a90e2, #357abd);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #ffffff;
`;

const MemoInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const MemoTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MemoPreview = styled.div`
  font-size: 13px;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MemoDate = styled.div`
  font-size: 12px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
`;

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

const MemoSelectorModal = ({ onClose, onSelectMemo, showToast }) => {
  const [memos, setMemos] = useState([]);
  const [filteredMemos, setFilteredMemos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemos();
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

  const loadMemos = async () => {
    try {
      const userId = localStorage.getItem('firebaseUserId');
      if (!userId) return;

      const memosRef = collection(db, 'memos');
      const q = query(
        memosRef,
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const loadedMemos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setMemos(loadedMemos);
      setFilteredMemos(loadedMemos);
    } catch (error) {
      console.error('메모 불러오기 실패:', error);
      showToast?.('메모를 불러오는데 실패했습니다');
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

  const getPreview = (content) => {
    if (!content) return '내용 없음';
    return content.replace(/\n/g, ' ').substring(0, 100);
  };

  return (
    <Overlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <Modal>
        <Header>
          <Title>메모 선택</Title>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </Header>

        <SearchSection>
          <SearchInputWrapper>
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder="메모 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchInputWrapper>
        </SearchSection>

        <Content>
          {loading ? (
            <EmptyState>
              <EmptyIcon>📝</EmptyIcon>
              <EmptyTitle>메모를 불러오는 중...</EmptyTitle>
            </EmptyState>
          ) : filteredMemos.length === 0 ? (
            <EmptyState>
              <EmptyIcon>📝</EmptyIcon>
              <EmptyTitle>
                {searchQuery ? '검색 결과 없음' : '메모가 없습니다'}
              </EmptyTitle>
              <EmptyDescription>
                {searchQuery
                  ? '다른 검색어를 입력해보세요'
                  : '메모 탭에서 메모를 작성해보세요'}
              </EmptyDescription>
            </EmptyState>
          ) : (
            filteredMemos.map(memo => (
              <MemoItem
                key={memo.id}
                onClick={() => handleSelectMemo(memo)}
              >
                <MemoIcon>
                  <FileText size={20} />
                </MemoIcon>
                <MemoInfo>
                  <MemoTitle>{memo.title || '제목 없음'}</MemoTitle>
                  <MemoPreview>{getPreview(memo.content)}</MemoPreview>
                  <MemoDate>
                    <Calendar size={12} />
                    {formatDate(memo.updatedAt || memo.createdAt)}
                  </MemoDate>
                </MemoInfo>
              </MemoItem>
            ))
          )}
        </Content>
      </Modal>
    </Overlay>
  );
};

export default MemoSelectorModal;
