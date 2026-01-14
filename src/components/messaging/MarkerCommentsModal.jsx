// 마커 의견 제시 모달
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, MessageCircle, Send } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getUserNickname } from '../../services/nicknameService';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500000;
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
  flex-shrink: 0;
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

const ProposalSection = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
`;

const ProposalTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
  color: #aaa;
  margin-bottom: 12px;
`;

const ProposalTitleLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ProposalTime = styled.div`
  font-size: 11px;
  color: #666;
  font-weight: 400;
`;

const WithdrawButton = styled.button`
  background: ${props => props.$disabled ? 'rgba(255, 107, 107, 0.2)' : 'rgba(255, 107, 107, 0.1)'};
  border: 1px solid ${props => props.$disabled ? 'rgba(255, 107, 107, 0.3)' : 'rgba(255, 107, 107, 0.4)'};
  color: ${props => props.$disabled ? '#999' : '#ff6b6b'};
  font-size: 11px;
  padding: 4px 12px;
  border-radius: 6px;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  font-weight: 500;

  &:hover {
    background: ${props => props.$disabled ? 'rgba(255, 107, 107, 0.2)' : 'rgba(255, 107, 107, 0.15)'};
  }

  &:active {
    transform: ${props => props.$disabled ? 'none' : 'scale(0.95)'};
  }
`;

const ProposalItem = styled.div`
  font-size: 13px;
  color: #e0e0e0;
  margin-bottom: 8px;
  line-height: 1.5;

  &:last-child {
    margin-bottom: 0;
  }

  strong {
    color: #888;
    font-weight: 600;
    display: inline-block;
    min-width: 80px;
  }
`;

const ProposalText = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px 12px;
  color: #e0e0e0;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
`;

const CommentsSection = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;

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

const CommentItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px 14px;
  position: relative;
`;

const CommentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const CommentBody = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
`;

const CommentMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CommentAuthor = styled.div`
  font-size: 13px;
  font-weight: 400;
  color: #e0e0e0;
`;

const CommentTime = styled.div`
  font-size: 11px;
  color: #666;
`;

const DeleteButton = styled.button`
  background: transparent;
  border: none;
  color: #ff6b6b;
  font-size: 11px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 107, 107, 0.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const CommentContent = styled.div`
  font-size: 13px;
  color: #e0e0e0;
  line-height: 1.5;
  word-break: break-word;
  flex: 1;
  max-height: ${props => props.$collapsed ? '21px' : 'none'};
  overflow: hidden;
  white-space: ${props => props.$collapsed ? 'nowrap' : 'pre-wrap'};
  text-overflow: ${props => props.$collapsed ? 'ellipsis' : 'clip'};
`;

const ExpandButton = styled.button`
  background: transparent;
  border: none;
  color: #888;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  margin-left: 8px;
  transition: all 0.2s;
  flex-shrink: 0;
  align-self: flex-start;

  &:hover {
    color: #aaa;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #888;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
`;

const EmptyText = styled.p`
  font-size: 14px;
  color: #888;
  margin: 0;
`;

const InputSection = styled.div`
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
`;

const InputWrapper = styled.div`
  display: flex;
  gap: 8px;
`;

const CommentInput = styled.textarea`
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  color: #e0e0e0;
  font-size: 13px;
  resize: none;
  min-height: 60px;
  font-family: inherit;
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

const SendButton = styled.button`
  background: #4a90e2;
  border: none;
  border-radius: 12px;
  padding: 12px 16px;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background: #357abd;
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ConfirmModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 600000;
  backdrop-filter: blur(4px);
`;

const ConfirmBox = styled.div`
  background: linear-gradient(180deg, #2a2d35, #1f2128);
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ConfirmTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 12px 0;
`;

const ConfirmMessage = styled.p`
  font-size: 14px;
  color: #e0e0e0;
  margin: 0 0 20px 0;
  line-height: 1.5;
`;

const ConfirmButtons = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const ConfirmButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  ${props => props.$primary ? `
    background: #ff6b6b;
    color: #ffffff;

    &:hover {
      background: #ff5252;
    }
  ` : `
    background: rgba(255, 255, 255, 0.1);
    color: #e0e0e0;

    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  `}

  &:active {
    transform: scale(0.95);
  }
`;

const MarkerCommentsModal = ({
  onClose,
  chatRoomId,
  memoId,
  editId,
  markerData,
  currentUserId,
  currentUserName,
  showToast
}) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userNicknames, setUserNicknames] = useState({});
  const [userWorkspaceCodes, setUserWorkspaceCodes] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  // 의견 목록 실시간 구독
  useEffect(() => {
    if (!chatRoomId || !memoId || !editId) return;

    const commentsRef = collection(
      db,
      'chatRooms',
      chatRoomId,
      'documents',
      memoId,
      'editHistory',
      editId,
      'comments'
    );
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const loadedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(loadedComments);
      setLoading(false);

      // 댓글 작성자들의 닉네임과 워크스페이스 코드 가져오기
      const userIds = [...new Set(loadedComments.map(c => c.userId))];
      const nicknames = {};
      const workspaceCodes = {};

      for (const userId of userIds) {
        try {
          // 닉네임 가져오기
          const nickname = await getUserNickname(userId);
          if (nickname) {
            nicknames[userId] = nickname;
          }

          // 워크스페이스 코드 가져오기
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const wsCode = userDoc.data().workspaceCode;
            if (wsCode) {
              workspaceCodes[userId] = wsCode.replace('WS-', '');
            }
          }
        } catch (error) {
          console.error('사용자 정보 로드 실패:', userId, error);
        }
      }

      setUserNicknames(nicknames);
      setUserWorkspaceCodes(workspaceCodes);
    }, (error) => {
      console.error('의견 목록 로드 실패:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatRoomId, memoId, editId]);

  // 의견 작성
  const handleSendComment = async () => {
    if (!newComment.trim() || sending) return;

    try {
      setSending(true);

      // 현재 사용자의 닉네임과 워크스페이스 코드 가져오기
      const nickname = await getUserNickname(currentUserId);
      const userDoc = await getDoc(doc(db, 'users', currentUserId));
      const workspaceCode = userDoc.exists() ? userDoc.data().workspaceCode : '';

      const commentsRef = collection(
        db,
        'chatRooms',
        chatRoomId,
        'documents',
        memoId,
        'editHistory',
        editId,
        'comments'
      );

      const commentData = {
        userId: currentUserId,
        userName: currentUserName,
        userNickname: nickname || currentUserName,
        content: newComment.trim(),
        createdAt: serverTimestamp()
      };

      // workspaceCode가 있을 때만 추가
      if (workspaceCode) {
        commentData.userWorkspaceCode = workspaceCode;
      }

      await addDoc(commentsRef, commentData);

      setNewComment('');
      showToast?.('의견이 작성되었습니다');
    } catch (error) {
      console.error('의견 작성 실패:', error);
      showToast?.('의견 작성에 실패했습니다');
    } finally {
      setSending(false);
    }
  };

  // 의견 삭제
  const handleDeleteComment = async (commentId) => {
    setCommentToDelete(commentId);
    setShowDeleteConfirm(true);
  };

  // 의견 삭제 확인
  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;

    try {
      const commentRef = doc(
        db,
        'chatRooms',
        chatRoomId,
        'documents',
        memoId,
        'editHistory',
        editId,
        'comments',
        commentToDelete
      );

      await deleteDoc(commentRef);
      showToast?.('의견이 삭제되었습니다');
      setShowDeleteConfirm(false);
      setCommentToDelete(null);
    } catch (error) {
      console.error('의견 삭제 실패:', error);
      showToast?.('의견 삭제에 실패했습니다');
      setShowDeleteConfirm(false);
      setCommentToDelete(null);
    }
  };

  // 제안 철회
  const handleWithdrawProposal = async () => {
    // 댓글이 있으면 철회 불가
    if (comments.length > 0) {
      showToast?.('의견 제시가 달린 제안은 철회할 수 없습니다');
      return;
    }

    if (!window.confirm('이 제안을 철회하시겠습니까?')) return;

    try {
      const editRef = doc(
        db,
        'chatRooms',
        chatRoomId,
        'documents',
        memoId,
        'editHistory',
        editId
      );

      await deleteDoc(editRef);
      showToast?.('제안이 철회되었습니다');
      onClose(); // 모달 닫기
    } catch (error) {
      console.error('제안 철회 실패:', error);
      showToast?.('제안 철회에 실패했습니다');
    }
  };

  // 날짜 포맷팅
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  // Enter 키로 전송
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <MessageCircle size={20} />
            의견 및 제안
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <ProposalSection>
          <ProposalTitle>
            <ProposalTitleLeft>
              <span>📝 원본 수정 제안</span>
              {markerData?.editedAt && (
                <ProposalTime>{formatTime(markerData.editedAt)}</ProposalTime>
              )}
            </ProposalTitleLeft>
            {markerData?.editedBy === currentUserId && (
              <WithdrawButton
                $disabled={comments.length > 0}
                onClick={handleWithdrawProposal}
              >
                제안 철회
              </WithdrawButton>
            )}
          </ProposalTitle>
          <ProposalItem>
            <strong>유형:</strong> {markerData?.type === 'strikethrough' ? '✂️ 취소선 (삭제 제안)' : '✨ 형광펜 (수정 제안)'}
          </ProposalItem>
          <ProposalItem>
            <strong>원본:</strong> {markerData?.oldText || markerData?.originalText || '-'}
          </ProposalItem>
          {markerData?.newText && (
            <ProposalItem>
              <strong>제안:</strong> {markerData.newText}
            </ProposalItem>
          )}
          {markerData?.description && (
            <ProposalItem style={{ marginTop: '12px' }}>
              <strong>설명:</strong>
              <ProposalText>{markerData.description}</ProposalText>
            </ProposalItem>
          )}
        </ProposalSection>

        <CommentsSection>
          {loading ? (
            <EmptyState>
              <EmptyText>의견을 불러오는 중...</EmptyText>
            </EmptyState>
          ) : comments.length === 0 ? (
            <EmptyState>
              <EmptyIcon>💬</EmptyIcon>
              <EmptyText>아직 작성된 의견이 없습니다</EmptyText>
            </EmptyState>
          ) : (
            comments.map((comment) => {
              // 닉네임 우선, fallback으로 저장된 닉네임, 마지막으로 userName 사용
              const displayNickname = userNicknames[comment.userId] || comment.userNickname || comment.userName || '익명';
              // 워크스페이스 코드 (저장된 값 우선, fallback으로 실시간 조회 값)
              const displayWsCode = comment.userWorkspaceCode?.replace('WS-', '') || userWorkspaceCodes[comment.userId] || '';
              // 최종 표시명: "닉네임 (워크스페이스코드)"
              const displayName = displayWsCode ? `${displayNickname} (${displayWsCode})` : displayNickname;

              const isMyComment = comment.userId === currentUserId;
              const isExpanded = expandedComments[comment.id];
              const needsExpand = comment.content.includes('\n') || comment.content.length > 50;

              return (
                <CommentItem key={comment.id}>
                  <CommentHeader>
                    <CommentMeta>
                      <CommentAuthor>{displayName}</CommentAuthor>
                      <CommentTime>{formatTime(comment.createdAt)}</CommentTime>
                    </CommentMeta>
                    {isMyComment && (
                      <DeleteButton onClick={() => handleDeleteComment(comment.id)}>
                        삭제
                      </DeleteButton>
                    )}
                  </CommentHeader>
                  <CommentBody>
                    <CommentContent $collapsed={!isExpanded && needsExpand}>
                      {comment.content}
                    </CommentContent>
                    {needsExpand && (
                      <ExpandButton onClick={() => setExpandedComments(prev => ({
                        ...prev,
                        [comment.id]: !prev[comment.id]
                      }))}>
                        {isExpanded ? '▲' : '▼'}
                      </ExpandButton>
                    )}
                  </CommentBody>
                </CommentItem>
              );
            })
          )}
        </CommentsSection>

        <InputSection>
          <InputWrapper>
            <CommentInput
              placeholder="의견을 입력하세요... (Shift+Enter: 줄바꿈)"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <SendButton
              onClick={handleSendComment}
              disabled={!newComment.trim() || sending}
            >
              <Send size={18} />
            </SendButton>
          </InputWrapper>
        </InputSection>
      </ModalContainer>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <ConfirmModal onClick={() => {
          setShowDeleteConfirm(false);
          setCommentToDelete(null);
        }}>
          <ConfirmBox onClick={(e) => e.stopPropagation()}>
            <ConfirmTitle>의견 삭제</ConfirmTitle>
            <ConfirmMessage>이 의견을 삭제하시겠습니까?</ConfirmMessage>
            <ConfirmButtons>
              <ConfirmButton onClick={() => {
                setShowDeleteConfirm(false);
                setCommentToDelete(null);
              }}>
                취소
              </ConfirmButton>
              <ConfirmButton $primary onClick={confirmDeleteComment}>
                삭제
              </ConfirmButton>
            </ConfirmButtons>
          </ConfirmBox>
        </ConfirmModal>
      )}
    </ModalOverlay>
  );
};

export default MarkerCommentsModal;
