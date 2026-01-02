// 📄 공유 폴더 메모 선택 모달
import { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { X, Search, FileText, Calendar, Folder, Snowflake, Lock } from 'lucide-react';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

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
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  align-content: start;

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
  opacity: ${props => props.$frozen ? '0.6' : '1'};
  filter: ${props => props.$frozen ? 'grayscale(0.3)' : 'none'};

  &:hover {
    background: ${props => props.$frozen ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.08)'};
    border-color: ${props => props.$frozen ? 'rgba(255, 255, 255, 0.1)' : '#4a90e2'};
    transform: ${props => props.$frozen ? 'none' : 'translateY(-2px)'};
  }

  &:active {
    transform: ${props => props.$frozen ? 'none' : 'scale(0.98)'};
  }
`;

const FrozenBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(74, 144, 226, 0.2);
  border: 1px solid #4a90e2;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  color: #4a90e2;
  width: fit-content;
`;

const FrozenNote = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #888;
  margin-top: 4px;
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
  word-break: break-all;
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

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100002;
  backdrop-filter: blur(4px);
`;

const WarningModalContent = styled.div`
  background: linear-gradient(180deg, #2a2d35, #1f2128);
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const WarningHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 700;
  color: #4a90e2;
`;

const WarningBody = styled.div`
  color: #e0e0e0;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 20px;
`;

const WarningInfo = styled.div`
  background: rgba(74, 144, 226, 0.1);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  padding: 12px;
  margin: 16px 0;
  font-size: 13px;
  line-height: 1.6;
  color: #e0e0e0;
`;

const WarningButton = styled.button`
  width: 100%;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;

  &:active {
    transform: scale(0.98);
    background: #3a7bc8;
  }
`;

const SharedMemoSelectorModal = ({ onClose, onSelectMemo, showToast, allMemos, chatRoomId }) => {
  const [filteredMemos, setFilteredMemos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [frozenMemos, setFrozenMemos] = useState(new Set()); // 프리즈된 문서 ID 목록
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedFrozenMemo, setSelectedFrozenMemo] = useState(null);

  // allMemos에서 folderId === 'shared'인 메모만 필터링 (useMemo로 메모이제이션)
  const sharedMemos = useMemo(() => {
    return allMemos?.filter(memo => memo.folderId === 'shared') || [];
  }, [allMemos]);

  // 프리즈된 문서 체크 (Firestore에서 편집 이력이 있는 문서)
  useEffect(() => {
    if (!chatRoomId || !sharedMemos.length) return;

    const checkFrozenDocuments = async () => {
      const frozenSet = new Set();

      // 모든 공유 메모에 대해 편집 이력 확인
      for (const memo of sharedMemos) {
        try {
          const editHistoryRef = collection(
            db,
            'chatRooms',
            chatRoomId,
            'documents',
            memo.id,
            'editHistory'
          );
          const q = query(editHistoryRef, where('status', '==', 'pending'));
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            frozenSet.add(memo.id);
          }
        } catch (error) {
          // 편집 이력이 없는 경우 무시
          console.log('편집 이력 체크 중 오류 (정상):', error);
        }
      }

      setFrozenMemos(frozenSet);
    };

    checkFrozenDocuments();
  }, [chatRoomId, sharedMemos]);

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
    // 프리즈된 문서인 경우 경고 모달 표시
    if (frozenMemos.has(memo.id)) {
      setSelectedFrozenMemo(memo);
      setShowWarningModal(true);
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
              const isFrozen = frozenMemos.has(memo.id);
              return (
                <MemoItem
                  key={memo.id}
                  onClick={() => handleSelectMemo(memo)}
                  $frozen={isFrozen}
                >
                  {isFrozen && (
                    <FrozenBadge>
                      <Snowflake size={12} />
                      작업중
                    </FrozenBadge>
                  )}
                  <MemoTitle>{getDisplayTitle(memo)}</MemoTitle>
                  {memo.content && (
                    <MemoPreview>{memo.content}</MemoPreview>
                  )}
                  {isFrozen && (
                    <FrozenNote>
                      <Lock size={10} />
                      대화방에서 편집 중
                    </FrozenNote>
                  )}
                  <MemoDate>
                    {formatDate(memo.updatedAt || memo.createdAt)}
                  </MemoDate>
                </MemoItem>
              );
            })
          )}
        </MemoList>

        {/* 프리즈된 문서 경고 모달 */}
        {showWarningModal && selectedFrozenMemo && (
          <Modal onClick={() => setShowWarningModal(false)}>
            <WarningModalContent onClick={(e) => e.stopPropagation()}>
              <WarningHeader>
                <Snowflake size={20} />
                동결된 문서
              </WarningHeader>
              <WarningBody>
                이 문서는 대화방에서 편집 작업이 진행 중입니다.
              </WarningBody>
              <WarningInfo>
                작업이 완료될 때까지<br />
                <strong>열기·수정·삭제·이동</strong>이 제한됩니다.
              </WarningInfo>
              <WarningButton onClick={() => setShowWarningModal(false)}>
                확인
              </WarningButton>
            </WarningModalContent>
          </Modal>
        )}
      </ModalContainer>
    </ModalOverlay>
  );
};

export default SharedMemoSelectorModal;
