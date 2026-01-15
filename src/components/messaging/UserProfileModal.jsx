// 사용자 프로필 모달 (프사 탭 시 표시)
import styled from 'styled-components';
import { X, MessageCircle, Ban } from 'lucide-react';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContainer = styled.div`
  width: 85%;
  max-width: 360px;
  height: 70%;
  max-height: 500px;
  background: rgba(30, 30, 35, 0.6);
  border-radius: 24px;
  padding: 32px 24px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: scaleIn 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);

  @keyframes scaleIn {
    from {
      transform: scale(0.9);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  z-index: 1;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }
`;

const ProfileContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const ProfileImageWrapper = styled.div`
  width: 140px;
  height: 140px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.15);
  background: ${props => props.$bgColor || '#667eea'};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ProfileImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ProfileInitial = styled.div`
  font-size: 52px;
  font-weight: 600;
  color: #fff;
`;

const UserName = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  text-align: center;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
  width: 100%;
  justify-content: center;
`;

const ActionButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 28px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  &:active {
    transform: scale(0.98);
  }

  svg {
    opacity: 0.8;
  }
`;

const ActionLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
`;

// 아바타 색상 생성 (userId 기반)
const getAvatarColor = (userId) => {
  if (!userId) return '#667eea';
  const colors = [
    '#667eea', '#f093fb', '#4facfe', '#43e97b',
    '#fa709a', '#fee140', '#a8edea', '#ff9a9e'
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const UserProfileModal = ({
  isOpen,
  onClose,
  userId,
  userName,
  profilePicture,
  isGroupChat = false,
  onStartDM,
  onBlockUser,
  currentUserId
}) => {
  if (!isOpen) return null;

  // 자기 자신인 경우 액션 버튼 숨김
  const isSelf = userId === currentUserId;

  return (
    <Overlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>
          <X size={20} />
        </CloseButton>

        <ProfileContainer>
          <ProfileImageWrapper $bgColor={getAvatarColor(userId)}>
            {profilePicture ? (
              <ProfileImage src={profilePicture} alt={userName} />
            ) : (
              <ProfileInitial>
                {(userName || '?').charAt(0).toUpperCase()}
              </ProfileInitial>
            )}
          </ProfileImageWrapper>

          <UserName>{userName || '사용자'}</UserName>

          {/* 단체방에서만 액션 버튼 표시, 자기 자신 제외 */}
          {isGroupChat && !isSelf && (
            <ActionButtons>
              <ActionButton onClick={() => {
                onStartDM?.(userId, userName);
                onClose();
              }}>
                <MessageCircle size={24} />
                <ActionLabel>1:1 대화</ActionLabel>
              </ActionButton>

              <ActionButton onClick={() => {
                onBlockUser?.(userId, userName);
                onClose();
              }}>
                <Ban size={24} />
                <ActionLabel>차단하기</ActionLabel>
              </ActionButton>
            </ActionButtons>
          )}
        </ProfileContainer>
      </ModalContainer>
    </Overlay>
  );
};

export default UserProfileModal;
