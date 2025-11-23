// 친구 관리 모달

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Search, UserPlus, Check, XCircle, Users, QrCode } from 'lucide-react';
import {
  searchUsers,
  sendFriendRequest,
  getFriends,
  acceptFriendRequest,
  rejectFriendRequest
} from '../../services/collaborationService';
import QRScannerModal from './QRScannerModal';
import { auth } from '../../firebase/config';

const FriendsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'search' | 'requests'
  const [friends, setFriends] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'friends') {
      loadFriends();
    }
  }, [isOpen, activeTab]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const friendsList = await getFriends();
      setFriends(friendsList);
    } catch (err) {
      setError('친구 목록을 불러오는데 실패했습니다');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    console.log('🔍 검색 시작:', searchTerm);

    if (searchTerm.length < 2) {
      setError('2자 이상 입력해주세요');
      return;
    }

    try {
      setLoading(true);
      setError('');
      console.log('🔍 searchUsers 호출 중...');
      const results = await searchUsers(searchTerm);
      console.log('🔍 검색 결과:', results);
      setSearchResults(results);

      if (results.length === 0) {
        setError('검색 결과가 없습니다');
      }
    } catch (err) {
      console.error('🔍 검색 오류:', err);
      setError('검색에 실패했습니다: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (user) => {
    try {
      await sendFriendRequest(user.id, user.displayName);
      alert(`${user.displayName}님에게 친구 요청을 보냈습니다`);
      setSearchResults(prev => prev.filter(u => u.id !== user.id));
    } catch (err) {
      alert(err.message || '친구 요청 실패');
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>
          <Title>친구 관리</Title>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </Header>

        <TabBar>
          <Tab active={activeTab === 'friends'} onClick={() => setActiveTab('friends')}>
            <Users size={18} />
            <span>친구 목록</span>
          </Tab>
          <Tab active={activeTab === 'search'} onClick={() => setActiveTab('search')}>
            <Search size={18} />
            <span>친구 찾기</span>
          </Tab>
        </TabBar>

        <Content>
          {activeTab === 'friends' && (
            <FriendsList>
              {loading ? (
                <LoadingText>로딩 중...</LoadingText>
              ) : friends.length === 0 ? (
                <EmptyText>친구가 없습니다</EmptyText>
              ) : (
                friends.map(friend => (
                  <FriendItem key={friend.id}>
                    <Avatar src={friend.photoURL || '/default-avatar.png'} alt={friend.displayName} />
                    <FriendInfo>
                      <FriendName>{friend.displayName}</FriendName>
                      <FriendEmail>{friend.email}</FriendEmail>
                    </FriendInfo>
                    <OnlineStatus online={friend.onlineStatus === 'online'} />
                  </FriendItem>
                ))
              )}
            </FriendsList>
          )}

          {activeTab === 'search' && (
            <SearchSection>
              <SearchBar>
                <SearchInput
                  placeholder="WS 코드 입력 (예: WS-Y3T1ZM)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && searchTerm.trim()) {
                      handleSearch();
                    }
                  }}
                />
                {searchTerm.trim().length > 0 ? (
                  <SearchButton onClick={handleSearch}>
                    <Search size={20} />
                  </SearchButton>
                ) : (
                  <QRButton onClick={() => {
                    console.log('QR 버튼 클릭');
                    setShowQRScanner(true);
                  }} title="QR 코드 스캔">
                    <QrCode size={20} />
                  </QRButton>
                )}
              </SearchBar>

              {error && <ErrorText>{error}</ErrorText>}

              <SearchResults>
                {loading ? (
                  <LoadingText>검색 중...</LoadingText>
                ) : searchResults.length === 0 ? (
                  <EmptyText>검색 결과가 없습니다</EmptyText>
                ) : (
                  searchResults.map(user => (
                    <UserItem key={user.id}>
                      <Avatar src={user.photoURL || '/default-avatar.png'} alt={user.displayName} />
                      <UserInfo>
                        <UserName>
                          {user.displayName}
                          {user.isProfileIncomplete && <IncompleteBadge> (미로그인)</IncompleteBadge>}
                        </UserName>
                        <UserEmail>{user.email}</UserEmail>
                      </UserInfo>
                      <AddButton onClick={() => handleSendRequest(user)}>
                        <UserPlus size={18} />
                        <span>추가</span>
                      </AddButton>
                    </UserItem>
                  ))
                )}
              </SearchResults>
            </SearchSection>
          )}
        </Content>
      </Modal>

      {showQRScanner && (
        <QRScannerModal
          userId={auth.currentUser?.uid}
          onClose={() => setShowQRScanner(false)}
          onCodeScanned={(code) => {
            setSearchTerm(code);
            setShowQRScanner(false);
            // 자동으로 검색 실행
            setTimeout(() => handleSearch(), 100);
          }}
        />
      )}
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
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
`;

const Modal = styled.div`
  background: linear-gradient(135deg, #1a1d24 0%, #2d3139 100%);
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h2`
  color: white;
  font-size: 24px;
  font-weight: 700;
  margin: 0;
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

const TabBar = styled.div`
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0 24px;
`;

const Tab = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: none;
  border: none;
  color: ${props => props.active ? '#5ebe26' : 'rgba(255, 255, 255, 0.5)'};
  border-bottom: 2px solid ${props => props.active ? '#5ebe26' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s;
  font-size: 15px;
  font-weight: 600;

  &:hover {
    color: ${props => props.active ? '#5ebe26' : 'rgba(255, 255, 255, 0.8)'};
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

const FriendsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FriendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const Avatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.1);
`;

const FriendInfo = styled.div`
  flex: 1;
`;

const FriendName = styled.div`
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const FriendEmail = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
`;

const OnlineStatus = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.online ? '#5ebe26' : 'rgba(255, 255, 255, 0.3)'};
  box-shadow: ${props => props.online ? '0 0 10px rgba(94, 190, 38, 0.5)' : 'none'};
`;

const SearchSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SearchBar = styled.div`
  display: flex;
  gap: 12px;
`;

const SearchInput = styled.input`
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

const QRButton = styled.button`
  padding: 14px 20px;
  background: rgba(94, 190, 38, 0.2);
  border: 1px solid #5ebe26;
  border-radius: 12px;
  color: #5ebe26;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: rgba(94, 190, 38, 0.3);
  }
`;

const SearchButton = styled.button`
  padding: 14px 20px;
  background: #5ebe26;
  border: none;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;

  &:hover {
    background: #4fa01f;
  }
`;

const SearchResults = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const UserItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const IncompleteBadge = styled.span`
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  font-weight: 400;
`;

const UserEmail = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(94, 190, 38, 0.2);
  border: 1px solid #5ebe26;
  border-radius: 8px;
  color: #5ebe26;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(94, 190, 38, 0.3);
  }
`;

const LoadingText = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 40px;
  font-size: 15px;
`;

const EmptyText = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
  padding: 40px;
  font-size: 15px;
`;

const ErrorText = styled.div`
  color: #ff6b6b;
  font-size: 14px;
  padding: 12px;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 8px;
  text-align: center;
`;

export default FriendsModal;
