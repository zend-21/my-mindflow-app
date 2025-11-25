/*
 * ⚠️ 경고: 이 파일은 현재 사용하지 않는 참고용 파일입니다.
 * ⚠️ WARNING: This file is NOT IN USE - for reference only.
 * ⚠️ 다른 파일과 연동하지 마세요. DO NOT integrate with other files.
 */

// 방 탐색 - 방 코드 입력으로 직접 참가
import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import Portal from '../Portal';
import { getRoomByInviteCode } from '../../services/collaborationRoomService';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10001;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalBox = styled.div`
  background: linear-gradient(135deg, #2a2d35, #333842);
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  animation: ${slideUp} 0.3s cubic-bezier(0.2, 0, 0, 1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  color: #e0e0e0;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #999;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #e0e0e0;
  }
`;

const InfoBox = styled.div`
  background: rgba(74, 144, 226, 0.1);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
`;

const InfoText = styled.p`
  color: #a0c4e8;
  font-size: 13px;
  margin: 0;
  line-height: 1.5;
`;

const InputSection = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  color: #b0b0b0;
  font-size: 14px;
  margin-bottom: 8px;
  font-weight: 500;
`;

const InputWrapper = styled.div`
  display: flex;
  gap: 8px;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: #1a1d24;
  color: #e0e0e0;
  font-size: 16px;
  font-family: 'Roboto Mono', monospace;
  letter-spacing: 0.5px;
  outline: none;

  &:focus {
    border-color: #4a90e2;
  }

  &::placeholder {
    color: #666;
  }
`;

const JoinButton = styled.button`
  padding: 12px 24px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #3b78c4;
  }

  &:disabled {
    background: #555;
    cursor: not-allowed;
  }
`;

const RoomPreview = styled.div`
  background: rgba(74, 144, 226, 0.1);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
`;

const RoomTitle = styled.div`
  color: #e0e0e0;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const RoomMeta = styled.div`
  color: #a0c4e8;
  font-size: 14px;
  margin-bottom: 4px;
`;

const RoomBadge = styled.span`
  display: inline-block;
  background: ${props => props.$roomType === 'open' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(155, 89, 182, 0.2)'};
  color: ${props => props.$roomType === 'open' ? '#2ecc71' : '#9b59b6'};
  border: 1px solid ${props => props.$roomType === 'open' ? 'rgba(46, 204, 113, 0.4)' : 'rgba(155, 89, 182, 0.4)'};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  margin-top: 8px;
`;

const ErrorMessage = styled.div`
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 8px;
  padding: 12px;
  color: #e74c3c;
  font-size: 14px;
  margin-bottom: 16px;
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: #888;
  padding: 20px;
  font-size: 15px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 12px;
  background: #333842;
  color: #e0e0e0;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #3d424d;
  }
`;

const ConfirmButton = styled.button`
  flex: 1;
  padding: 12px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #3b78c4;
  }

  &:disabled {
    background: #555;
    cursor: not-allowed;
  }
`;

const RoomBrowser = ({ isOpen, onClose, onRoomSelect }) => {
  const [roomCode, setRoomCode] = useState('');
  const [roomPreview, setRoomPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!roomCode.trim()) {
      setError('방 코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 방 코드로 방 조회
      const room = await getRoomByInviteCode(roomCode.trim());

      if (!room) {
        throw new Error('방을 찾을 수 없습니다.');
      }

      // 방 상태 확인
      if (room.status === 'archived') {
        throw new Error('폐쇄된 방입니다.');
      }

      setRoomPreview(room);
    } catch (err) {
      console.error('방 조회 오류:', err);
      setError(err.message || '방을 찾을 수 없습니다. 코드를 확인해주세요.');
      setRoomPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = () => {
    if (roomPreview && onRoomSelect) {
      onRoomSelect(roomPreview);
      handleClose();
    }
  };

  const handleClose = () => {
    setRoomCode('');
    setRoomPreview(null);
    setError('');
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <Overlay onClick={handleOverlayClick}>
        <ModalBox onClick={(e) => e.stopPropagation()}>
          <Header>
            <Title>방 탐색</Title>
            <CloseButton onClick={handleClose}>×</CloseButton>
          </Header>

          <InfoBox>
            <InfoText>
              방 코드를 입력하면 해당 협업방에 참가할 수 있습니다.
              방 코드는 방장에게 받을 수 있습니다.
            </InfoText>
          </InfoBox>

          <InputSection>
            <Label>방 코드 입력 (12자리)</Label>
            <InputWrapper>
              <Input
                type="text"
                placeholder="예: PU-A3F9-2B-7X4K1M"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                maxLength={20}
                autoFocus
              />
              <JoinButton onClick={handleSearch} disabled={loading}>
                {loading ? '검색 중...' : '검색'}
              </JoinButton>
            </InputWrapper>
          </InputSection>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          {loading && <LoadingMessage>방을 검색하는 중...</LoadingMessage>}

          {roomPreview && !loading && (
            <>
              <RoomPreview>
                <RoomTitle>{roomPreview.memoTitle}</RoomTitle>
                <RoomMeta>방장: {roomPreview.ownerName}</RoomMeta>
                <RoomMeta>{roomPreview.participants?.length || 0}명 참여 중</RoomMeta>
                <RoomBadge $roomType={roomPreview.roomType}>
                  {roomPreview.roomType === 'open' ? '개방형' : '제한형'}
                </RoomBadge>
              </RoomPreview>

              <ButtonContainer>
                <CancelButton onClick={handleClose}>취소</CancelButton>
                <ConfirmButton onClick={handleJoinRoom}>
                  방 참가하기
                </ConfirmButton>
              </ButtonContainer>
            </>
          )}
        </ModalBox>
      </Overlay>
    </Portal>
  );
};

export default RoomBrowser;
