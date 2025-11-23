// 💬 대화 탭 - 메시징 허브 (채팅, 친구)
import { useState } from 'react';
import styled from 'styled-components';
import ChatList from './ChatList';
import FriendList from './FriendList';

// 메인 컨테이너
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
`;

// 헤더
const Header = styled.div`
  padding: 0px 20px 0 20px;
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
  gap: 8px;
  padding: 0 20px;
  margin-bottom: 0;
`;

const Tab = styled.button`
  flex: 1;
  background: ${props => props.$active ? 'rgba(74, 144, 226, 0.15)' : 'transparent'};
  border: none;
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

const TabIcon = styled.span`
  font-size: 18px;
`;

const TabLabel = styled.span`
  @media (max-width: 380px) {
    display: none;
  }
`;

// 콘텐츠 영역
const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
  margin-bottom: 130px; /* 푸터(80px) + 광고 배너(50px) = 130px */

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

const MessagingHub = ({ showToast }) => {
  const [activeTab, setActiveTab] = useState('chat'); // chat, friends

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
          </Tab>
          <Tab
            $active={activeTab === 'friends'}
            onClick={() => setActiveTab('friends')}
          >
            <TabIcon>👥</TabIcon>
            <TabLabel>친구</TabLabel>
          </Tab>
        </TabContainer>
      </Header>

      <Content>
        {activeTab === 'chat' && <ChatList showToast={showToast} />}
        {activeTab === 'friends' && <FriendList showToast={showToast} />}
      </Content>
    </Container>
  );
};

export default MessagingHub;
