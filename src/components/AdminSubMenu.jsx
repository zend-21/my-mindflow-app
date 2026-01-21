// src/components/AdminSubMenu.jsx
import { useState } from 'react';
import styled from 'styled-components';
import { X } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 10010;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MenuPanel = styled.div`
  background: linear-gradient(135deg, #2a2d35 0%, #1f2229 100%);
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseButton = styled.button`
  background: none;
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
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
`;

const MenuList = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #e0e0e0;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  ${props => props.$danger && `
    background: rgba(255, 107, 107, 0.1);
    border-color: rgba(255, 107, 107, 0.3);
    color: #ff6b6b;

    &:hover {
      background: rgba(255, 107, 107, 0.2);
      border-color: rgba(255, 107, 107, 0.4);
    }
  `}
`;

const MenuIcon = styled.span`
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
`;

const MenuText = styled.span`
  flex: 1;
  text-align: left;
`;

const NotificationBadge = styled.span`
  background: #ff4444;
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: bold;
  min-width: 20px;
  text-align: center;
`;

const Footer = styled.div`
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: center;
`;

const SmallButton = styled.button`
  background: none;
  border: 1px solid rgba(255, 107, 107, 0.3);
  color: rgba(255, 107, 107, 0.6);
  font-size: 11px;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.5;

  &:hover {
    opacity: 1;
    background: rgba(255, 107, 107, 0.1);
    border-color: rgba(255, 107, 107, 0.5);
    color: #ff6b6b;
  }
`;

const AdminSubMenu = ({
  isOpen,
  onClose,
  isSuperAdmin,
  unreadInquiryCount,
  onOpenInquiryPanel,
  onOpenAdminManagement,
  onInitAdmin
}) => {
  const [showInitConfirm, setShowInitConfirm] = useState(false);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleInitClick = () => {
    setShowInitConfirm(true);
  };

  const confirmInit = () => {
    setShowInitConfirm(false);
    onInitAdmin();
  };

  return (
    <>
      <Overlay onClick={handleOverlayClick}>
        <MenuPanel>
          <Header>
            <Title>
              <span>👨‍💼</span>
              {isSuperAdmin ? '최고 관리자' : '부관리자'}
            </Title>
            <CloseButton onClick={onClose}>
              <X size={20} />
            </CloseButton>
          </Header>

          <MenuList>
            <MenuItem onClick={onOpenInquiryPanel}>
              <MenuIcon>💬</MenuIcon>
              <MenuText>문의 관리</MenuText>
              {unreadInquiryCount > 0 && (
                <NotificationBadge>{unreadInquiryCount}</NotificationBadge>
              )}
            </MenuItem>

            {isSuperAdmin && (
              <MenuItem onClick={onOpenAdminManagement}>
                <MenuIcon>⚙️</MenuIcon>
                <MenuText>부관리자 관리</MenuText>
              </MenuItem>
            )}
          </MenuList>

          {isSuperAdmin && (
            <Footer>
              <SmallButton onClick={handleInitClick}>
                🔧 관리자 설정 초기화
              </SmallButton>
            </Footer>
          )}
        </MenuPanel>
      </Overlay>

      {showInitConfirm && (
        <ConfirmModal
          isOpen={showInitConfirm}
          onClose={() => setShowInitConfirm(false)}
          onConfirm={confirmInit}
          title="⚠️ 관리자 설정 초기화"
          message="관리자 설정을 초기화하시겠습니까?\n\n모든 부관리자 권한이 삭제되고, 현재 로그인한 사용자가 최고 관리자로 설정됩니다."
          confirmText="초기화"
          cancelText="취소"
          showCancel={true}
        />
      )}
    </>
  );
};

export default AdminSubMenu;
