// 💬 대화 탭 - 메시징 허브 (채팅, 친구)
import { useState, useCallback, forwardRef, useEffect } from 'react';
import styled from 'styled-components';
import { Settings } from 'lucide-react';
import ChatList from './ChatList';
import FriendList from './FriendList';
import ChatSettingsModal from './ChatSettingsModal';
import AdBanner from './AdBanner';

// 메인 컨테이너
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
`;

// 헤더
const Header = styled.div`
  padding: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #888;
  margin: 0 0 20px 0;
`;

// 탭 컨테이너
const TabContainer = styled.div`
  display: flex;
  gap: 0;
  padding: 0;
  margin-bottom: 0;
`;

const Tab = styled.button`
  flex: 1;
  background: ${props => props.$active ? 'rgba(74, 144, 226, 0.15)' : 'transparent'};
  border: none;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 3px solid ${props => props.$active ? '#4a90e2' : 'transparent'};
  color: ${props => props.$active ? '#4a90e2' : '#888'};
  padding: 6px 16px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover {
    color: #4a90e2;
    background: rgba(74, 144, 226, 0.08);
  }

  @media (max-width: 768px) {
    font-size: 14px;
    padding: 4px 12px;
  }
`;

const SettingsTab = styled.button`
  flex: 0 0 60px; /* 고정 너비 60px */
  background: ${props => props.$active ? 'rgba(74, 144, 226, 0.15)' : 'transparent'};
  border: none;
  border-bottom: 3px solid ${props => props.$active ? '#4a90e2' : 'transparent'};
  color: ${props => props.$active ? '#4a90e2' : '#888'};
  padding: 6px 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #4a90e2;
    background: rgba(74, 144, 226, 0.08);
  }
`;

const TabIcon = styled.span`
  font-size: 18px;
`;

const TabLabel = styled.span`
  @media (max-width: 380px) {
    display: none;
  }
`;

const Badge = styled.span`
  background: #ff4757;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
`;

// 콘텐츠 영역
const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
  margin-bottom: 110px; /* 푸터(60px) + 광고 배너(50px) = 110px */

  /* 스크롤바 스타일 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

// 탭 콘텐츠 래퍼 (display로 보이기/숨기기)
const TabContent = styled.div`
  display: ${props => props.$active ? 'flex' : 'none'};
  flex-direction: column;
  height: 100%;
`;

const MessagingHub = forwardRef(({ showToast, memos, requirePhoneAuth, onUpdateMemoPendingFlag, syncMemo, resetToChat }, ref) => {
  const [activeTab, setActiveTab] = useState('chat'); // chat, friends
  const [showSettings, setShowSettings] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0); // 읽지 않은 채팅 수
  const [friendRequestCount, setFriendRequestCount] = useState(0); // 친구 요청 수

  // 다른 카테고리에서 대화 카테고리로 돌아올 때 항상 채팅 목록으로 리셋
  useEffect(() => {
    if (resetToChat) {
      setActiveTab('chat');
    }
  }, [resetToChat]);

  // ChatList로부터 읽지 않은 메시지 수 업데이트
  const handleUnreadCountChange = useCallback((count) => {
    setUnreadChatCount(count);
  }, []);

  // FriendList로부터 친구 요청 수 업데이트
  const handleFriendRequestCountChange = useCallback((count) => {
    setFriendRequestCount(count);
  }, []);

  return (
    <Container>
      <Header>
        <TabContainer>
          <Tab
            $active={activeTab === 'chat'}
            onClick={() => setActiveTab('chat')}
          >
            <TabIcon>💬</TabIcon>
            <TabLabel>채팅</TabLabel>
            {unreadChatCount > 0 && <Badge>{unreadChatCount > 99 ? '99+' : unreadChatCount}</Badge>}
          </Tab>
          <Tab
            $active={activeTab === 'friends'}
            onClick={() => setActiveTab('friends')}
          >
            <TabIcon>👥</TabIcon>
            <TabLabel>친구</TabLabel>
            {friendRequestCount > 0 && <Badge>{friendRequestCount > 99 ? '99+' : friendRequestCount}</Badge>}
          </Tab>
          <SettingsTab
            onClick={() => setShowSettings(true)}
            title="채팅 설정"
          >
            <Settings size={20} />
          </SettingsTab>
        </TabContainer>
      </Header>

      <Content>
        {/* 두 컴포넌트를 모두 마운트하여 실시간 구독 유지, display로 보이기/숨기기 */}
        <TabContent $active={activeTab === 'chat'}>
          <ChatList ref={ref} showToast={showToast} memos={memos} requirePhoneAuth={requirePhoneAuth} onUpdateMemoPendingFlag={onUpdateMemoPendingFlag} onUnreadCountChange={handleUnreadCountChange} syncMemo={syncMemo} />
        </TabContent>
        <TabContent $active={activeTab === 'friends'}>
          <FriendList showToast={showToast} memos={memos} requirePhoneAuth={requirePhoneAuth} onFriendRequestCountChange={handleFriendRequestCountChange} />
        </TabContent>
      </Content>

      {/* 광고 배너 - 채팅/친구 탭별 분리 (display 토글로 re-render 방지) */}
      <div style={{ display: activeTab === 'chat' ? 'block' : 'none' }}>
        <AdBanner adSlot="chat-list" />
      </div>
      <div style={{ display: activeTab === 'friends' ? 'block' : 'none' }}>
        <AdBanner adSlot="friend-list" />
      </div>

      {/* 설정 모달 */}
      {showSettings && (
        <ChatSettingsModal onClose={() => setShowSettings(false)} />
      )}
    </Container>
  );
});

export default MessagingHub;
