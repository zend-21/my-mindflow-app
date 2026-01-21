// src/components/AdminPanel.jsx
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X } from 'lucide-react';
import AdminInquiryTab from './AdminInquiryTab';
import AdminManagementTab from './AdminManagementTab';
import AdminUserManagementTab from './AdminUserManagementTab';
import AdminSettingsTab from './AdminSettingsTab';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  z-index: 10010;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const Container = styled.div`
  background: linear-gradient(180deg, #2a2d35 0%, #1f2229 100%);
  width: 100%;
  max-width: 1000px;
  max-height: 90vh;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  flex-shrink: 0;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #e0e0e0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const AdminBadge = styled.span`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
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

const TabContainer = styled.div`
  display: flex;
  gap: 0;
  padding: 0 24px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  overflow-x: auto;
  overflow-y: hidden;
  flex-shrink: 0;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const Tab = styled.button`
  background: none;
  border: none;
  color: ${props => props.$active ? '#4a90e2' : '#888'};
  padding: 14px 20px;
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid ${props => props.$active ? '#4a90e2' : 'transparent'};
  position: relative;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    color: ${props => props.$active ? '#4a90e2' : '#aaa'};
  }
`;

const NotificationDot = styled.span`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 8px;
  height: 8px;
  background: #ff4444;
  border-radius: 50%;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

const TabContent = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const AdminPanel = ({ isOpen, onClose, userId, isSuperAdmin, unreadInquiryCount }) => {
  const [activeTab, setActiveTab] = useState('inquiries');

  // 패널이 열릴 때마다 문의관리 탭으로 초기화
  useEffect(() => {
    if (isOpen) {
      setActiveTab('inquiries');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <Overlay onClick={handleOverlayClick}>
      <Container>
        <Header>
          <Title>
            <span>👨‍💼</span>
            {isSuperAdmin ? '최고 관리자' : '부관리자'}
            <AdminBadge>{isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN'}</AdminBadge>
          </Title>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </Header>

        <TabContainer>
          <Tab
            $active={activeTab === 'inquiries'}
            onClick={() => setActiveTab('inquiries')}
          >
            문의관리
            {unreadInquiryCount > 0 && <NotificationDot />}
          </Tab>
          {isSuperAdmin && (
            <>
              <Tab
                $active={activeTab === 'management'}
                onClick={() => setActiveTab('management')}
              >
                부관리자
              </Tab>
              <Tab
                $active={activeTab === 'users'}
                onClick={() => setActiveTab('users')}
              >
                회원관리
              </Tab>
              <Tab
                $active={activeTab === 'settings'}
                onClick={() => setActiveTab('settings')}
              >
                설정
              </Tab>
            </>
          )}
        </TabContainer>

        <TabContent>
          {activeTab === 'inquiries' && (
            <AdminInquiryTab userId={userId} isSuperAdmin={isSuperAdmin} />
          )}
          {activeTab === 'management' && isSuperAdmin && (
            <AdminManagementTab userId={userId} />
          )}
          {activeTab === 'users' && isSuperAdmin && (
            <AdminUserManagementTab userId={userId} />
          )}
          {activeTab === 'settings' && isSuperAdmin && (
            <AdminSettingsTab onClose={onClose} />
          )}
        </TabContent>
      </Container>
    </Overlay>
  );
};

export default AdminPanel;
