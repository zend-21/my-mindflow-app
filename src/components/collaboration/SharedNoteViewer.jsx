// 공유 메모/스케줄 뷰어 (수정 제안 + 실시간 채팅)

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import {
  X,
  MessageCircle,
  Edit3,
  Check,
  XCircle,
  Users,
  Send,
  MoreVertical
} from 'lucide-react';
import {
  getSharedNote,
  subscribeToChatMessages,
  sendChatMessage,
  createEditSuggestion,
  approveEditSuggestion,
  rejectEditSuggestion,
  getEditSuggestions,
  markNoteAsRead
} from '../../services/collaborationService';
import { auth } from '../../firebase/config';

const SharedNoteViewer = ({ isOpen, onClose, noteId }) => {
  const [note, setNote] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editSuggestions, setEditSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'content'

  const messagesEndRef = useRef(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (isOpen && noteId) {
      loadNote();
      subscribeMessages();
      loadEditSuggestions();
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [isOpen, noteId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadNote = async () => {
    try {
      const noteData = await getSharedNote(noteId);
      setNote(noteData);
      setEditedContent(noteData.content);
      await markNoteAsRead(noteId);
    } catch (err) {
      console.error('메모 로딩 실패:', err);
      alert('메모를 불러올 수 없습니다');
      onClose();
    }
  };

  const subscribeMessages = () => {
    unsubscribeRef.current = subscribeToChatMessages(noteId, (msgs) => {
      setMessages(msgs);
    });
  };

  const loadEditSuggestions = async () => {
    try {
      const suggestions = await getEditSuggestions(noteId);
      setEditSuggestions(suggestions);
    } catch (err) {
      console.error('수정 제안 로딩 실패:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await sendChatMessage(noteId, newMessage.trim());
      setNewMessage('');
    } catch (err) {
      alert('메시지 전송 실패');
      console.error(err);
    }
  };

  const handleSubmitEdit = async () => {
    if (editedContent === note.content) {
      alert('변경사항이 없습니다');
      return;
    }

    try {
      setLoading(true);

      // 변경 사항 분석 (간단한 버전)
      const changes = [{
        type: 'modify',
        position: 0,
        oldText: note.content,
        newText: editedContent
      }];

      await createEditSuggestion(noteId, note.content, editedContent, changes);

      alert('수정 제안이 제출되었습니다');
      setIsEditing(false);
      setEditedContent(note.content);
      await loadEditSuggestions();
    } catch (err) {
      alert('수정 제안 실패');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSuggestion = async (suggestionId) => {
    try {
      await approveEditSuggestion(suggestionId);
      alert('수정이 승인되었습니다');
      await loadNote();
      await loadEditSuggestions();
    } catch (err) {
      alert('승인 실패');
      console.error(err);
    }
  };

  const handleRejectSuggestion = async (suggestionId) => {
    try {
      await rejectEditSuggestion(suggestionId);
      alert('수정이 거절되었습니다');
      await loadEditSuggestions();
    } catch (err) {
      alert('거절 실패');
      console.error(err);
    }
  };

  const canEdit = note?.participants[auth.currentUser?.uid]?.permission === 'edit';
  const isOwner = note?.ownerId === auth.currentUser?.uid;

  if (!isOpen || !note) return null;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>
          <TitleSection>
            <NoteTitle>{note.title}</NoteTitle>
            <NoteInfo>
              <OwnerBadge>작성자: {note.ownerName}</OwnerBadge>
              <ParticipantsBadge>
                <Users size={14} />
                <span>{Object.keys(note.participants).length}명</span>
              </ParticipantsBadge>
            </NoteInfo>
          </TitleSection>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </Header>

        <TabBar>
          <Tab active={activeTab === 'content'} onClick={() => setActiveTab('content')}>
            <Edit3 size={16} />
            <span>내용</span>
            {editSuggestions.length > 0 && <Badge>{editSuggestions.length}</Badge>}
          </Tab>
          <Tab active={activeTab === 'chat'} onClick={() => setActiveTab('chat')}>
            <MessageCircle size={16} />
            <span>채팅</span>
            {messages.length > 0 && <Badge>{messages.length}</Badge>}
          </Tab>
        </TabBar>

        <Content>
          {activeTab === 'content' && (
            <ContentSection>
              {/* 원본 내용 */}
              <ContentBlock>
                <ContentLabel>
                  {isEditing ? '원본 내용' : '공유된 내용'}
                </ContentLabel>
                <ContentText editing={isEditing}>
                  {note.content || '내용이 없습니다'}
                </ContentText>
              </ContentBlock>

              {/* 수정 중인 경우 */}
              {isEditing && (
                <ContentBlock>
                  <ContentLabel>수정 제안</ContentLabel>
                  <EditTextarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    placeholder="수정할 내용을 입력하세요..."
                  />
                  <EditActions>
                    <CancelEditButton onClick={() => {
                      setIsEditing(false);
                      setEditedContent(note.content);
                    }}>
                      취소
                    </CancelEditButton>
                    <SubmitEditButton onClick={handleSubmitEdit} disabled={loading}>
                      {loading ? '제출 중...' : '수정 제안하기'}
                    </SubmitEditButton>
                  </EditActions>
                </ContentBlock>
              )}

              {/* 수정 버튼 (권한이 있을 때만) */}
              {!isEditing && canEdit && (
                <EditButton onClick={() => setIsEditing(true)}>
                  <Edit3 size={18} />
                  <span>수정 제안하기</span>
                </EditButton>
              )}

              {/* 수정 제안 목록 (관리자만) */}
              {isOwner && editSuggestions.length > 0 && (
                <SuggestionsSection>
                  <SuggestionLabel>대기 중인 수정 제안</SuggestionLabel>
                  {editSuggestions.map(suggestion => (
                    <SuggestionCard key={suggestion.id}>
                      <SuggestionHeader>
                        <SuggestionUser>
                          <UserAvatar src={suggestion.userPhoto || '/default-avatar.png'} />
                          <span>{suggestion.userName}</span>
                        </SuggestionUser>
                        <SuggestionTime>
                          {new Date(suggestion.createdAt).toLocaleString()}
                        </SuggestionTime>
                      </SuggestionHeader>

                      <ComparisonBox>
                        <ComparisonItem>
                          <ComparisonLabel>원본</ComparisonLabel>
                          <ComparisonText strikethrough>
                            {suggestion.originalContent}
                          </ComparisonText>
                        </ComparisonItem>
                        <ComparisonItem>
                          <ComparisonLabel>수정 제안</ComparisonLabel>
                          <ComparisonText highlight>
                            {suggestion.suggestedContent}
                          </ComparisonText>
                        </ComparisonItem>
                      </ComparisonBox>

                      <SuggestionActions>
                        <RejectButton onClick={() => handleRejectSuggestion(suggestion.id)}>
                          <XCircle size={16} />
                          <span>거절</span>
                        </RejectButton>
                        <ApproveButton onClick={() => handleApproveSuggestion(suggestion.id)}>
                          <Check size={16} />
                          <span>승인</span>
                        </ApproveButton>
                      </SuggestionActions>
                    </SuggestionCard>
                  ))}
                </SuggestionsSection>
              )}
            </ContentSection>
          )}

          {activeTab === 'chat' && (
            <ChatSection>
              <MessagesList>
                {messages.length === 0 ? (
                  <EmptyChat>아직 메시지가 없습니다</EmptyChat>
                ) : (
                  messages.map((msg, idx) => {
                    const isMyMessage = msg.userId === auth.currentUser?.uid;
                    const isSystemMessage = msg.type === 'system';

                    if (isSystemMessage) {
                      return (
                        <SystemMessage key={msg.id}>
                          {msg.content}
                        </SystemMessage>
                      );
                    }

                    return (
                      <MessageItem key={msg.id} isMyMessage={isMyMessage}>
                        {!isMyMessage && (
                          <MessageAvatar src={msg.userPhoto || '/default-avatar.png'} />
                        )}
                        <MessageBubble isMyMessage={isMyMessage}>
                          {!isMyMessage && <MessageUser>{msg.userName}</MessageUser>}
                          <MessageText>{msg.content}</MessageText>
                          <MessageTime>
                            {new Date(msg.createdAt).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </MessageTime>
                        </MessageBubble>
                      </MessageItem>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </MessagesList>

              <ChatInput>
                <ChatTextarea
                  placeholder="메시지를 입력하세요..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={1}
                />
                <SendButton onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send size={20} />
                </SendButton>
              </ChatInput>
            </ChatSection>
          )}
        </Content>
      </Modal>
    </Overlay>
  );
};

// 스타일 정의 (생략된 부분은 이전 스타일과 유사)
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
`;

const Modal = styled.div`
  background: linear-gradient(135deg, #1a1d24 0%, #2d3139 100%);
  border-radius: 20px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const TitleSection = styled.div`
  flex: 1;
`;

const NoteTitle = styled.h2`
  color: white;
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 8px 0;
`;

const NoteInfo = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const OwnerBadge = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
`;

const ParticipantsBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(94, 190, 38, 0.2);
  border-radius: 12px;
  color: #5ebe26;
  font-size: 12px;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 8px;
  display: flex;
  transition: color 0.2s;
  &:hover { color: white; }
`;

const TabBar = styled.div`
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0 24px;
`;

const Tab = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: none;
  border: none;
  color: ${props => props.active ? '#5ebe26' : 'rgba(255, 255, 255, 0.5)'};
  border-bottom: 2px solid ${props => props.active ? '#5ebe26' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s;
  font-size: 15px;
  font-weight: 600;
  position: relative;
`;

const Badge = styled.span`
  background: #ff6b6b;
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 700;
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

const ContentSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ContentBlock = styled.div``;

const ContentLabel = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ContentText = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  color: white;
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
  ${props => props.editing && `
    text-decoration: line-through;
    opacity: 0.5;
  `}
`;

const EditTextarea = styled.textarea`
  width: 100%;
  min-height: 150px;
  background: rgba(94, 190, 38, 0.1);
  border: 2px solid #5ebe26;
  border-radius: 12px;
  padding: 16px;
  color: white;
  font-size: 15px;
  line-height: 1.6;
  resize: vertical;
  &:focus { outline: none; }
`;

const EditActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 12px;
`;

const CancelEditButton = styled.button`
  flex: 1;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: white;
  font-weight: 600;
  cursor: pointer;
`;

const SubmitEditButton = styled.button`
  flex: 2;
  padding: 12px;
  background: #5ebe26;
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: 700;
  cursor: pointer;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const EditButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  background: rgba(94, 190, 38, 0.1);
  border: 1px dashed #5ebe26;
  border-radius: 12px;
  color: #5ebe26;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: rgba(94, 190, 38, 0.2); }
`;

const SuggestionsSection = styled.div`
  margin-top: 20px;
`;

const SuggestionLabel = styled.div`
  color: #ff6b6b;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 12px;
`;

const SuggestionCard = styled.div`
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
`;

const SuggestionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const SuggestionUser = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-weight: 600;
  font-size: 14px;
`;

const UserAvatar = styled.img`
  width: 28px;
  height: 28px;
  border-radius: 50%;
`;

const SuggestionTime = styled.div`
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
`;

const ComparisonBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
`;

const ComparisonItem = styled.div``;

const ComparisonLabel = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ComparisonText = styled.div`
  padding: 10px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  ${props => props.strikethrough && `
    background: rgba(255, 255, 255, 0.03);
    color: rgba(255, 255, 255, 0.4);
    text-decoration: line-through;
  `}
  ${props => props.highlight && `
    background: rgba(94, 190, 38, 0.15);
    color: #5ebe26;
  `}
`;

const SuggestionActions = styled.div`
  display: flex;
  gap: 8px;
`;

const RejectButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  background: rgba(255, 107, 107, 0.2);
  border: 1px solid #ff6b6b;
  border-radius: 8px;
  color: #ff6b6b;
  font-weight: 600;
  cursor: pointer;
`;

const ApproveButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  background: rgba(94, 190, 38, 0.2);
  border: 1px solid #5ebe26;
  border-radius: 8px;
  color: #5ebe26;
  font-weight: 600;
  cursor: pointer;
`;

const ChatSection = styled.div`
  display: flex;
  flex-direction: column;
  height: 500px;
`;

const MessagesList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
`;

const EmptyChat = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
  padding: 60px 20px;
  font-size: 14px;
`;

const MessageItem = styled.div`
  display: flex;
  gap: 10px;
  ${props => props.isMyMessage && `
    flex-direction: row-reverse;
  `}
`;

const MessageAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
`;

const MessageBubble = styled.div`
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 16px;
  ${props => props.isMyMessage ? `
    background: #5ebe26;
    color: white;
    border-bottom-right-radius: 4px;
  ` : `
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border-bottom-left-radius: 4px;
  `}
`;

const MessageUser = styled.div`
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
  opacity: 0.8;
`;

const MessageText = styled.div`
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 4px;
  white-space: pre-wrap;
`;

const MessageTime = styled.div`
  font-size: 11px;
  opacity: 0.6;
  text-align: right;
`;

const SystemMessage = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin: 8px auto;
`;

const ChatInput = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-end;
`;

const ChatTextarea = styled.textarea`
  flex: 1;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-size: 14px;
  resize: none;
  max-height: 100px;
  &:focus { outline: none; border-color: #5ebe26; }
`;

const SendButton = styled.button`
  padding: 12px 16px;
  background: #5ebe26;
  border: none;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  &:hover:not(:disabled) { background: #4fa01f; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

export default SharedNoteViewer;
