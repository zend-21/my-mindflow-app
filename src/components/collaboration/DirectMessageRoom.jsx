// 1:1 대화방 컴포넌트
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { X, Send, ArrowLeft } from 'lucide-react';
import {
  subscribeToDMRoom,
  subscribeToMessages,
  sendMessage,
  markDMAsRead
} from '../../services/directMessageService';
import { auth } from '../../firebase/config';

const DirectMessageRoom = ({ roomId, onClose }) => {
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // 대화 상대 정보 가져오기
  const getOtherUser = () => {
    if (!room || !auth.currentUser) return null;
    const otherUserId = room.participants.find(id => id !== auth.currentUser.uid);
    return room.participantsInfo?.[otherUserId] || null;
  };

  const otherUser = getOtherUser();

  // 대화방 정보 실시간 구독
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeToDMRoom(roomId, (roomData) => {
      setRoom(roomData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  // 메시지 목록 실시간 구독
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeToMessages(roomId, (messageList) => {
      setMessages(messageList);
      // 읽음 표시 업데이트
      markDMAsRead(roomId);
    });

    return () => unsubscribe();
  }, [roomId]);

  // 새 메시지가 추가되면 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      await sendMessage(roomId, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      alert(error.message || '메시지 전송에 실패했습니다');
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingText>로딩 중...</LoadingText>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <BackButton onClick={onClose}>
          <ArrowLeft size={24} />
        </BackButton>
        <UserInfo>
          <Avatar src={otherUser?.photoURL || '/default-avatar.png'} alt={otherUser?.displayName} />
          <div>
            <UserName>{otherUser?.displayName || '알 수 없는 사용자'}</UserName>
            <UserEmail>{otherUser?.email || ''}</UserEmail>
          </div>
        </UserInfo>
        <CloseButton onClick={onClose}>
          <X size={24} />
        </CloseButton>
      </Header>

      <MessagesContainer>
        {messages.length === 0 ? (
          <EmptyMessage>아직 메시지가 없습니다. 첫 메시지를 보내보세요!</EmptyMessage>
        ) : (
          messages.map((message) => {
            const isMyMessage = message.senderId === auth.currentUser?.uid;
            return (
              <MessageBubble key={message.id} isMyMessage={isMyMessage}>
                <MessageText>{message.text}</MessageText>
                <MessageTime>
                  {message.createdAt?.toDate?.()?.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  }) || '전송 중...'}
                </MessageTime>
              </MessageBubble>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      <InputContainer onSubmit={handleSendMessage}>
        <MessageInput
          type="text"
          placeholder="메시지를 입력하세요..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <SendButton type="submit" disabled={!newMessage.trim()}>
          <Send size={20} />
        </SendButton>
      </InputContainer>
    </Container>
  );
};

// 스타일 정의
const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1a1d24 0%, #2d3139 100%);
  display: flex;
  flex-direction: column;
  z-index: 10000;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;

  &:hover {
    color: white;
  }
`;

const UserInfo = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.1);
`;

const UserName = styled.div`
  color: white;
  font-size: 16px;
  font-weight: 600;
`;

const UserEmail = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;

  &:hover {
    color: white;
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const EmptyMessage = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
  padding: 60px 20px;
  font-size: 15px;
`;

const MessageBubble = styled.div`
  max-width: 70%;
  align-self: ${props => props.isMyMessage ? 'flex-end' : 'flex-start'};
  background: ${props => props.isMyMessage
    ? 'linear-gradient(135deg, #5ebe26 0%, #4fa01f 100%)'
    : 'rgba(255, 255, 255, 0.1)'};
  padding: 12px 16px;
  border-radius: 16px;
  border-bottom-right-radius: ${props => props.isMyMessage ? '4px' : '16px'};
  border-bottom-left-radius: ${props => props.isMyMessage ? '16px' : '4px'};
`;

const MessageText = styled.div`
  color: white;
  font-size: 15px;
  line-height: 1.5;
  word-wrap: break-word;
`;

const MessageTime = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  margin-top: 4px;
  text-align: right;
`;

const InputContainer = styled.form`
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-size: 15px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  &:focus {
    outline: none;
    border-color: #5ebe26;
  }
`;

const SendButton = styled.button`
  padding: 14px 20px;
  background: ${props => props.disabled ? 'rgba(94, 190, 38, 0.3)' : '#5ebe26'};
  border: none;
  border-radius: 12px;
  color: white;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;

  &:hover {
    background: ${props => props.disabled ? 'rgba(94, 190, 38, 0.3)' : '#4fa01f'};
  }
`;

const LoadingText = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 60px 20px;
  font-size: 15px;
`;

export default DirectMessageRoom;
