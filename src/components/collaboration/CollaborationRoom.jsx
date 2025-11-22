// 협업방 - 채팅 + 슬라이딩 메모
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { X, Send, ChevronUp, ChevronDown, Users, Lock, Edit3, Eye, Globe, LockKeyhole } from 'lucide-react';
import { subscribeToRoom, updateRoomMemo, leaveRoom, setEditPermission, setAllEditPermission, lockRoom, toggleRoomPublicity } from '../../services/collaborationRoomService';
import { subscribeToMessages, sendMessage, sendSystemMessage, sendEditNotification } from '../../services/chatService';

const CollaborationRoom = ({ roomId, onClose, showToast }) => {
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [memoExpanded, setMemoExpanded] = useState(true);
  const [memoContent, setMemoContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showPublicityConfirm, setShowPublicityConfirm] = useState(false);

  const messagesEndRef = useRef(null);
  const currentUserId = localStorage.getItem('firebaseUserId');

  // 방 정보 실시간 구독
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeToRoom(roomId, (roomData) => {
      setRoom(roomData);
      setMemoContent(roomData.memoContent || '');
    });

    return () => unsubscribe();
  }, [roomId]);

  // 메시지 실시간 구독
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeToMessages(roomId, (newMessages) => {
      setMessages(newMessages);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [roomId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    try {
      await sendMessage(roomId, inputMessage.trim());
      setInputMessage('');
    } catch (err) {
      console.error(err);
      showToast?.('메시지 전송 실패');
    }
  };

  const handleSaveMemo = async () => {
    try {
      await updateRoomMemo(roomId, memoContent);
      setIsEditing(false);

      // 편집 알림 전송
      const userName = room.participants.find(p => p.userId === currentUserId)?.displayName || '알 수 없음';
      await sendEditNotification(roomId, userName);

      showToast?.('메모가 저장되었습니다');
    } catch (err) {
      console.error(err);
      showToast?.(err.message || '메모 저장 실패');
    }
  };

  const handleLeaveRoom = async () => {
    if (!confirm('방을 나가시겠습니까?')) return;

    try {
      const userName = room.participants.find(p => p.userId === currentUserId)?.displayName || '알 수 없음';
      await sendSystemMessage(roomId, `${userName}님이 나갔습니다`);
      await leaveRoom(roomId);
      onClose();
    } catch (err) {
      console.error(err);
      showToast?.('방 나가기 실패');
    }
  };

  const toggleEditPermission = async (userId) => {
    try {
      const hasPermission = room.permissions.editableUsers.includes(userId);
      await setEditPermission(roomId, userId, !hasPermission);
      showToast?.(hasPermission ? '편집 권한 해제' : '편집 권한 부여');
    } catch (err) {
      console.error(err);
      showToast?.(err.message);
    }
  };

  const toggleAllEditPermission = async () => {
    try {
      await setAllEditPermission(roomId, !room.permissions.allCanEdit);
      showToast?.(room.permissions.allCanEdit ? '모두 편집 권한 해제' : '모두 편집 권한 부여');
    } catch (err) {
      console.error(err);
      showToast?.(err.message);
    }
  };

  const toggleLock = async () => {
    try {
      await lockRoom(roomId, !room.isLocked);
      showToast?.(room.isLocked ? '방 잠금 해제' : '방 잠금');
    } catch (err) {
      console.error(err);
      showToast?.(err.message);
    }
  };

  const handlePublicityClick = () => {
    setShowPublicityConfirm(true);
  };

  const confirmTogglePublicity = async () => {
    try {
      await toggleRoomPublicity(roomId, !room.isPublic);
      showToast?.(room.isPublic ? '비공개 방으로 변경' : '공개 방으로 변경');
      setShowPublicityConfirm(false);
    } catch (err) {
      console.error(err);
      showToast?.(err.message);
      setShowPublicityConfirm(false);
    }
  };

  if (!room) {
    return (
      <Overlay>
        <Container>
          <LoadingText>방 정보를 불러오는 중...</LoadingText>
        </Container>
      </Overlay>
    );
  }

  const isOwner = room.ownerId === currentUserId;
  const canEdit = isOwner ||
                  room.permissions.allCanEdit ||
                  room.permissions.editableUsers.includes(currentUserId);

  return (
    <Overlay>
      <Container>
        {/* 헤더 */}
        <Header>
          <HeaderLeft>
            <Title>{room.memoTitle}</Title>
            {room.isLocked && <Lock size={16} color="#ff6b6b" />}
          </HeaderLeft>
          <HeaderRight>
            <IconButton onClick={() => setShowParticipants(!showParticipants)}>
              <Users size={20} />
              <Badge>{room.participants.length}</Badge>
            </IconButton>
            <IconButton onClick={onClose}>
              <X size={24} />
            </IconButton>
          </HeaderRight>
        </Header>

        {/* 슬라이딩 메모 패널 */}
        <MemoPanel $expanded={memoExpanded}>
          <MemoPanelHeader onClick={() => setMemoExpanded(!memoExpanded)}>
            <MemoPanelTitle>
              {canEdit ? <Edit3 size={16} /> : <Eye size={16} />}
              <span>공유된 메모 {canEdit && '(편집 가능)'}</span>
            </MemoPanelTitle>
            {memoExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </MemoPanelHeader>

          {memoExpanded && (
            <MemoContent>
              {canEdit ? (
                <>
                  <MemoTextarea
                    value={memoContent}
                    onChange={(e) => {
                      setMemoContent(e.target.value);
                      setIsEditing(true);
                    }}
                    placeholder="메모 내용을 입력하세요..."
                  />
                  {isEditing && (
                    <SaveButton onClick={handleSaveMemo}>
                      저장
                    </SaveButton>
                  )}
                </>
              ) : (
                <MemoReadOnly>{memoContent || '메모 내용이 없습니다'}</MemoReadOnly>
              )}
            </MemoContent>
          )}
        </MemoPanel>

        {/* 채팅 영역 */}
        <ChatArea>
          <MessagesList>
            {messages.map(msg => (
              <MessageItem key={msg.id} $isOwn={msg.userId === currentUserId} $type={msg.type}>
                {msg.type === 'system' ? (
                  <SystemMessage>{msg.message}</SystemMessage>
                ) : msg.type === 'edit' ? (
                  <EditMessage>📝 {msg.message}</EditMessage>
                ) : (
                  <>
                    {msg.userId !== currentUserId && (
                      <Avatar src={msg.userPhoto || '/default-avatar.png'} alt={msg.userName} />
                    )}
                    <MessageBubble $isOwn={msg.userId === currentUserId}>
                      {msg.userId !== currentUserId && (
                        <MessageAuthor>{msg.userName}</MessageAuthor>
                      )}
                      <MessageText>{msg.message}</MessageText>
                      <MessageTime>
                        {new Date(msg.createdAt).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </MessageTime>
                    </MessageBubble>
                  </>
                )}
              </MessageItem>
            ))}
            <div ref={messagesEndRef} />
          </MessagesList>

          <InputArea>
            <MessageInput
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="메시지를 입력하세요..."
            />
            <SendButton onClick={handleSendMessage}>
              <Send size={20} />
            </SendButton>
          </InputArea>
        </ChatArea>

        {/* 참여자 패널 */}
        {showParticipants && (
          <>
            <PanelOverlay onClick={() => setShowParticipants(false)} />
            <ParticipantsPanel>
              <PanelHeader>
                <PanelTitle>참여자 ({room.participants.length})</PanelTitle>
                <PanelHeaderRight>
                  {isOwner && (
                    <PermissionToggle onClick={toggleAllEditPermission}>
                      {room.permissions.allCanEdit ? '모두 편집 불가' : '모두 편집 가능'}
                    </PermissionToggle>
                  )}
                  <CloseButton onClick={() => setShowParticipants(false)}>
                    <X size={18} />
                  </CloseButton>
                </PanelHeaderRight>
              </PanelHeader>

            {room.participants.map(participant => (
              <ParticipantItem key={participant.userId}>
                <Avatar src={participant.photoURL || '/default-avatar.png'} alt={participant.displayName} />
                <ParticipantInfo>
                  <ParticipantName>
                    {participant.displayName}
                    {participant.role === 'owner' && <OwnerBadge>방장</OwnerBadge>}
                  </ParticipantName>
                  <ParticipantStatus>
                    {room.permissions.allCanEdit || room.permissions.editableUsers.includes(participant.userId)
                      ? '편집 가능' : '읽기 전용'}
                  </ParticipantStatus>
                </ParticipantInfo>
                {isOwner && participant.userId !== currentUserId && (
                  <PermissionButton
                    onClick={() => toggleEditPermission(participant.userId)}
                    $hasPermission={room.permissions.editableUsers.includes(participant.userId)}
                  >
                    {room.permissions.editableUsers.includes(participant.userId) ? (
                      <Edit3 size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </PermissionButton>
                )}
              </ParticipantItem>
            ))}

            <PanelFooter>
              {isOwner && (
                <>
                  <PublicityButton onClick={handlePublicityClick} $isPublic={room.isPublic}>
                    {room.isPublic ? <Globe size={16} /> : <LockKeyhole size={16} />}
                    {room.isPublic ? '공개 방' : '비공개 방'}
                  </PublicityButton>
                  <LockButton onClick={toggleLock} $isLocked={room.isLocked}>
                    <Lock size={16} />
                    {room.isLocked ? '방 잠금 해제' : '방 잠그기'}
                  </LockButton>
                </>
              )}
              <LeaveButton onClick={handleLeaveRoom}>
                방 나가기
              </LeaveButton>
            </PanelFooter>
            </ParticipantsPanel>
          </>
        )}

        {/* 공개/비공개 전환 확인 모달 */}
        {showPublicityConfirm && (
          <ConfirmModalOverlay onClick={() => setShowPublicityConfirm(false)}>
            <ConfirmModalBox onClick={(e) => e.stopPropagation()}>
              <ConfirmModalTitle>공개 설정 변경</ConfirmModalTitle>
              <ConfirmModalMessage>
                이 방을 <strong>{room.isPublic ? '비공개' : '공개'}</strong> 방으로 변경하시겠습니까?
                {'\n\n'}
                {room.isPublic
                  ? '비공개로 변경하면 방 코드를 가진 사람만 참여할 수 있습니다.'
                  : '공개로 변경하면 모든 사용자가 방 코드로 참여할 수 있습니다.'}
              </ConfirmModalMessage>
              <ConfirmModalButtons>
                <CancelButton onClick={() => setShowPublicityConfirm(false)}>
                  취소
                </CancelButton>
                <ConfirmButton onClick={confirmTogglePublicity}>
                  {room.isPublic ? '비공개로 변경' : '공개로 변경'}
                </ConfirmButton>
              </ConfirmModalButtons>
            </ConfirmModalBox>
          </ConfirmModalOverlay>
        )}
      </Container>
    </Overlay>
  );
};

// 스타일 정의
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
  z-index: 10000;
  padding: 20px;
`;

const Container = styled.div`
  background: linear-gradient(135deg, #1a1d24 0%, #2d3139 100%);
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  position: relative;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HeaderRight = styled.div`
  display: flex;
  gap: 12px;
`;

const Title = styled.h2`
  color: white;
  font-size: 18px;
  font-weight: 700;
  margin: 0;
`;

const IconButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: background 0.2s;
  &:hover { background: rgba(255, 255, 255, 0.15); }
`;

const Badge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  background: #5ebe26;
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
`;

const MemoPanel = styled.div`
  background: rgba(94, 190, 38, 0.05);
  border-bottom: 1px solid rgba(94, 190, 38, 0.2);
  transition: max-height 0.3s ease;
  max-height: ${props => props.$expanded ? '300px' : '48px'};
  overflow: hidden;
  flex-shrink: 0;
`;

const MemoPanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 24px;
  cursor: pointer;
  &:hover { background: rgba(94, 190, 38, 0.08); }
`;

const MemoPanelTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #5ebe26;
  font-size: 14px;
  font-weight: 600;
`;

const MemoContent = styled.div`
  padding: 0 24px 16px;
  position: relative;
`;

const MemoTextarea = styled.textarea`
  width: 100%;
  min-height: 200px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  padding: 12px;
  resize: vertical;
  font-family: inherit;
  &:focus { outline: none; border-color: #5ebe26; }
`;

const MemoReadOnly = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
`;

const SaveButton = styled.button`
  margin-top: 8px;
  padding: 8px 16px;
  background: #5ebe26;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #4fa01f; }
`;

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const MessagesList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
  &::-webkit-scrollbar-thumb {
    background: rgba(94, 190, 38, 0.3);
    border-radius: 3px;
  }
`;

const MessageItem = styled.div`
  display: flex;
  gap: 8px;
  align-items: ${props => props.$type === 'system' || props.$type === 'edit' ? 'center' : 'flex-start'};
  justify-content: ${props => {
    if (props.$type === 'system' || props.$type === 'edit') return 'center';
    return props.$isOwn ? 'flex-end' : 'flex-start';
  }};
`;

const Avatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
`;

const MessageBubble = styled.div`
  max-width: 70%;
  background: ${props => props.$isOwn ? '#5ebe26' : 'rgba(255, 255, 255, 0.1)'};
  padding: 10px 14px;
  border-radius: ${props => props.$isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px'};
`;

const MessageAuthor = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
`;

const MessageText = styled.div`
  color: white;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
`;

const MessageTime = styled.div`
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
  text-align: right;
`;

const SystemMessage = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
`;

const EditMessage = styled.div`
  font-size: 12px;
  color: #5ebe26;
  text-align: center;
  padding: 4px 12px;
  background: rgba(94, 190, 38, 0.1);
  border-radius: 12px;
`;

const InputArea = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
`;

const MessageInput = styled.textarea`
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-size: 14px;
  padding: 12px;
  resize: none;
  height: 40px;
  font-family: inherit;
  &:focus { outline: none; border-color: #5ebe26; }
`;

const SendButton = styled.button`
  background: #5ebe26;
  border: none;
  color: white;
  cursor: pointer;
  padding: 12px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  &:hover { background: #4fa01f; }
`;

const PanelOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
`;

const ParticipantsPanel = styled.div`
  position: absolute;
  top: 70px;
  right: 24px;
  width: 360px;
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  z-index: 100;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const PanelTitle = styled.div`
  color: white;
  font-size: 14px;
  font-weight: 600;
`;

const PanelHeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  &:hover { background: rgba(255, 255, 255, 0.2); }
`;

const PermissionToggle = styled.button`
  background: rgba(94, 190, 38, 0.2);
  border: 1px solid #5ebe26;
  color: #5ebe26;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  &:hover { background: rgba(94, 190, 38, 0.3); }
`;

const ParticipantItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:last-child { border-bottom: none; }
`;

const ParticipantInfo = styled.div`
  flex: 1;
`;

const ParticipantName = styled.div`
  color: white;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const OwnerBadge = styled.span`
  background: #5ebe26;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
`;

const ParticipantStatus = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  margin-top: 2px;
`;

const PermissionButton = styled.button`
  background: ${props => props.$hasPermission ? 'rgba(94, 190, 38, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid ${props => props.$hasPermission ? '#5ebe26' : 'rgba(255, 255, 255, 0.2)'};
  color: ${props => props.$hasPermission ? '#5ebe26' : 'rgba(255, 255, 255, 0.6)'};
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  &:hover { opacity: 0.8; }
`;

const PanelFooter = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const PublicityButton = styled.button`
  flex: 1;
  min-width: 100px;
  padding: 10px;
  background: ${props => props.$isPublic ? 'rgba(74, 144, 226, 0.2)' : 'rgba(239, 83, 80, 0.2)'};
  border: 1px solid ${props => props.$isPublic ? '#4a90e2' : '#ef5350'};
  color: ${props => props.$isPublic ? '#4a90e2' : '#ef5350'};
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  &:hover { opacity: 0.8; }
`;

const LockButton = styled.button`
  flex: 1;
  padding: 10px;
  background: ${props => props.$isLocked ? 'rgba(255, 107, 107, 0.2)' : 'rgba(94, 190, 38, 0.2)'};
  border: 1px solid ${props => props.$isLocked ? '#ff6b6b' : '#5ebe26'};
  color: ${props => props.$isLocked ? '#ff6b6b' : '#5ebe26'};
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  &:hover { opacity: 0.8; }
`;

const LeaveButton = styled.button`
  flex: 1;
  padding: 10px;
  background: rgba(255, 107, 107, 0.2);
  border: 1px solid #ff6b6b;
  color: #ff6b6b;
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  &:hover { background: rgba(255, 107, 107, 0.3); }
`;

const LoadingText = styled.div`
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  padding: 40px;
`;

const ConfirmModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
`;

const ConfirmModalBox = styled.div`
  background: linear-gradient(135deg, #1a1d24 0%, #2d3139 100%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`;

const ConfirmModalTitle = styled.h3`
  color: white;
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 16px 0;
  text-align: center;
`;

const ConfirmModalMessage = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 24px 0;
  white-space: pre-line;
  text-align: center;

  strong {
    color: white;
    font-weight: 600;
  }
`;

const ConfirmModalButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: rgba(255, 255, 255, 0.15); }
`;

const ConfirmButton = styled.button`
  flex: 1;
  padding: 12px;
  background: #5ebe26;
  border: none;
  color: white;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #4fa01f; }
`;

export default CollaborationRoom;
