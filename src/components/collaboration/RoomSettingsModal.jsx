// 협업방 설정 모달
import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import Portal from '../Portal';

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
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  animation: ${slideUp} 0.3s cubic-bezier(0.2, 0, 0, 1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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

const Section = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  color: #b0b0b0;
  font-size: 14px;
  margin-bottom: 8px;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: #1a1d24;
  color: #e0e0e0;
  font-size: 16px;
  outline: none;

  &:focus {
    border-color: #4a90e2;
  }

  &::placeholder {
    color: #666;
  }
`;

const ToggleOption = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #1a1d24;
  border-radius: 8px;
  margin-bottom: 12px;
`;

const ToggleLabel = styled.div`
  flex: 1;
`;

const ToggleTitle = styled.div`
  color: #e0e0e0;
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 4px;
`;

const ToggleDescription = styled.div`
  color: #888;
  font-size: 13px;
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background-color: #4a90e2;
  }

  &:checked + span:before {
    transform: translateX(22px);
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #444;
  transition: 0.3s;
  border-radius: 28px;

  &:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const Button = styled.button`
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
`;

const CancelButton = styled(Button)`
  background: #333842;
  color: #e0e0e0;

  &:hover {
    background: #3d424d;
  }
`;

const CreateButton = styled(Button)`
  background: #4a90e2;
  color: white;

  &:hover {
    background: #3b78c4;
  }

  &:disabled {
    background: #555;
    cursor: not-allowed;
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

const RoomSettingsModal = ({ isOpen, onClose, onConfirm, defaultTitle = '' }) => {
  const [roomTitle, setRoomTitle] = useState(''); // 빈 문자열로 시작
  const [isPublic, setIsPublic] = useState(false);

  // 메모 첫 줄 추출 (placeholder용)
  const firstLine = defaultTitle.split('\n')[0].trim().substring(0, 50);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!roomTitle.trim()) {
      alert('방 제목을 입력해주세요.');
      return;
    }

    onConfirm({
      title: roomTitle.trim(),
      isPublic,
      allowEdit: false // 기본값: 방장만 편집 가능
    });
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <Portal>
      <Overlay onClick={handleOverlayClick}>
        <ModalBox onClick={(e) => e.stopPropagation()}>
          <Header>
            <Title>협업방 설정</Title>
            <CloseButton onClick={onClose}>×</CloseButton>
          </Header>

          <InfoBox>
            <InfoText>
              협업방을 만들고 친구들과 메모를 함께 작업할 수 있습니다.
              편집 권한은 방 생성 후 협업방 내에서 설정할 수 있습니다.
            </InfoText>
          </InfoBox>

          <Section>
            <Label>방 제목 (메모 첫 줄이 자동으로 제안됩니다)</Label>
            <Input
              type="text"
              placeholder={firstLine || "예: 프로젝트 기획 회의"}
              value={roomTitle}
              onChange={(e) => setRoomTitle(e.target.value)}
              maxLength={100}
              autoFocus
            />
          </Section>

          <Section>
            <Label>공개 설정</Label>

            <ToggleOption>
              <ToggleLabel>
                <ToggleTitle>공개 방</ToggleTitle>
                <ToggleDescription>
                  {isPublic ? '친구 목록에 이 방이 표시됩니다' : '초대받은 사람만 입장할 수 있습니다'}
                </ToggleDescription>
              </ToggleLabel>
              <ToggleSwitch>
                <ToggleInput
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                <ToggleSlider />
              </ToggleSwitch>
            </ToggleOption>
          </Section>

          <ButtonContainer>
            <CancelButton onClick={onClose}>취소</CancelButton>
            <CreateButton onClick={handleConfirm} disabled={!roomTitle.trim()}>
              방 만들기
            </CreateButton>
          </ButtonContainer>
        </ModalBox>
      </Overlay>
    </Portal>
  );
};

export default RoomSettingsModal;
