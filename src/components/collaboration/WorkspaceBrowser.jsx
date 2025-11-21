// 워크스페이스 탐색기 - 워크스페이스 코드로 공개방 목록 보기
import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import Portal from '../Portal';
import { getWorkspaceByCode, getPublicRoomsInWorkspace } from '../../services/workspaceService';

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
  max-width: 520px;
  max-height: 80vh;
  overflow-y: auto;
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

const InputSection = styled.div`
  margin-bottom: 24px;
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
  text-transform: uppercase;
  outline: none;

  &:focus {
    border-color: #4a90e2;
  }

  &::placeholder {
    color: #666;
  }
`;

const SearchButton = styled.button`
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

const WorkspaceInfo = styled.div`
  background: rgba(74, 144, 226, 0.1);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
`;

const WorkspaceName = styled.div`
  color: #e0e0e0;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const WorkspaceCode = styled.div`
  color: #a0c4e8;
  font-size: 14px;
  margin-bottom: 4px;
`;

const WorkspaceStats = styled.div`
  color: #888;
  font-size: 13px;
`;

const RoomsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const RoomCard = styled.div`
  background: #1a1d24;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #22252d;
    border-color: #4a90e2;
  }
`;

const RoomTitle = styled.div`
  color: #e0e0e0;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
`;

const RoomMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #888;
  font-size: 13px;
`;

const RoomOwner = styled.span`
  color: #a0c4e8;
`;

const EmptyMessage = styled.div`
  text-align: center;
  color: #888;
  padding: 40px 20px;
  font-size: 15px;
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

const WorkspaceBrowser = ({ isOpen, onClose, onRoomSelect }) => {
  const [workspaceCode, setWorkspaceCode] = useState('');
  const [workspace, setWorkspace] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!workspaceCode.trim()) {
      setError('워크스페이스 코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 워크스페이스 조회
      const workspaceResult = await getWorkspaceByCode(workspaceCode.trim());
      setWorkspace(workspaceResult.data);

      // 공개 방 목록 조회
      const roomsResult = await getPublicRoomsInWorkspace(workspaceResult.data.workspaceId);
      setRooms(roomsResult.rooms);
    } catch (err) {
      console.error('워크스페이스 조회 오류:', err);
      setError('워크스페이스를 찾을 수 없습니다. 코드를 확인해주세요.');
      setWorkspace(null);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomClick = (room) => {
    if (onRoomSelect) {
      onRoomSelect(room);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <Overlay onClick={handleOverlayClick}>
        <ModalBox onClick={(e) => e.stopPropagation()}>
          <Header>
            <Title>워크스페이스 탐색</Title>
            <CloseButton onClick={onClose}>×</CloseButton>
          </Header>

          <InputSection>
            <Label>워크스페이스 코드 입력</Label>
            <InputWrapper>
              <Input
                type="text"
                placeholder="예: WORK-A3F9"
                value={workspaceCode}
                onChange={(e) => setWorkspaceCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                maxLength={20}
                autoFocus
              />
              <SearchButton onClick={handleSearch} disabled={loading}>
                {loading ? '검색 중...' : '검색'}
              </SearchButton>
            </InputWrapper>
          </InputSection>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          {workspace && (
            <WorkspaceInfo>
              <WorkspaceName>{workspace.ownerName}님의 워크스페이스</WorkspaceName>
              <WorkspaceCode>코드: {workspace.workspaceCode}</WorkspaceCode>
              <WorkspaceStats>
                공개 방 {workspace.stats?.publicRooms || 0}개 ·
                전체 방 {workspace.stats?.totalRooms || 0}개
              </WorkspaceStats>
            </WorkspaceInfo>
          )}

          {loading ? (
            <LoadingMessage>워크스페이스를 검색하는 중...</LoadingMessage>
          ) : workspace ? (
            rooms.length > 0 ? (
              <RoomsList>
                {rooms.map((room) => (
                  <RoomCard key={room.id} onClick={() => handleRoomClick(room)}>
                    <RoomTitle>{room.memoTitle}</RoomTitle>
                    <RoomMeta>
                      <RoomOwner>방장: {room.ownerName}</RoomOwner>
                      <span>{room.participants?.length || 0}명 참여 중</span>
                    </RoomMeta>
                  </RoomCard>
                ))}
              </RoomsList>
            ) : (
              <EmptyMessage>
                이 워크스페이스에는 공개 방이 없습니다.
              </EmptyMessage>
            )
          ) : null}
        </ModalBox>
      </Overlay>
    </Portal>
  );
};

export default WorkspaceBrowser;
