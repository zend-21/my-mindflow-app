// 개선된 친구 관리 모달 (고유 ID + 초대 링크)
import { toast } from '../../utils/toast';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Search, UserPlus, Users, Share2, Copy, QrCode } from 'lucide-react';
import {
  getFriends,
  sendFriendRequest
} from '../../services/collaborationService';
import { searchByUniqueId, getMyInviteLink } from '../../services/userIdService';

const ImprovedFriendsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'search' | 'invite'
  const [friends, setFriends] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && activeTab === 'friends') {
      loadFriends();
    }
    if (isOpen && activeTab === 'invite') {
      loadInviteLink();
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

  const loadInviteLink = async () => {
    try {
      const link = await getMyInviteLink();
      setInviteLink(link);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async () => {
    if (searchTerm.length < 3) {
      setError('3자 이상 입력해주세요');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const user = await searchByUniqueId(searchTerm);

      if (user) {
        setSearchResult(user);
      } else {
        setError('사용자를 찾을 수 없습니다');
        setSearchResult(null);
      }
    } catch (err) {
      setError('검색에 실패했습니다');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (user) => {
    try {
      await sendFriendRequest(user.id, user.displayName);
      toast(`${user.displayName}님에게 친구 요청을 보냈습니다`);
      setSearchResult(null);
      setSearchTerm('');
    } catch (err) {
      toast(err.message || '친구 요청 실패');
      console.error(err);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast('초대 링크가 복사되었습니다!');
  };

  const shareInviteLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'MindFlow 친구 초대',
        text: 'MindFlow에서 친구가 되어주세요!',
        url: inviteLink
      });
    } else {
      copyInviteLink();
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
            <span>ID 검색</span>
          </Tab>
          <Tab active={activeTab === 'invite'} onClick={() => setActiveTab('invite')}>
            <Share2 size={18} />
            <span>친구 초대</span>
          </Tab>
        </TabBar>

        <Content>
          {/* 친구 목록 탭 */}
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
                      <FriendId>@{friend.uniqueId || 'ID 없음'}</FriendId>
                    </FriendInfo>
                    <OnlineStatus online={friend.onlineStatus === 'online'} />
                  </FriendItem>
                ))
              )}
            </FriendsList>
          )}

          {/* ID 검색 탭 */}
          {activeTab === 'search' && (
            <SearchSection>
              <SearchInfo>
                <InfoIcon>💡</InfoIcon>
                <InfoText>
                  친구의 <strong>고유 ID</strong>를 입력하세요<br/>
                  (예: hong_gildong_a3f2)
                </InfoText>
              </SearchInfo>

              <SearchBar>
                <SearchInput
                  placeholder="고유 ID 입력 (@는 빼고)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <SearchButton onClick={handleSearch}>
                  <Search size={20} />
                </SearchButton>
              </SearchBar>

              {error && <ErrorText>{error}</ErrorText>}

              {searchResult && (
                <SearchResults>
                  <UserItem>
                    <Avatar src={searchResult.photoURL || '/default-avatar.png'} alt={searchResult.displayName} />
                    <UserInfo>
                      <UserName>{searchResult.displayName}</UserName>
                      <UserId>@{searchResult.uniqueId}</UserId>
                    </UserInfo>
                    <AddButton onClick={() => handleSendRequest(searchResult)}>
                      <UserPlus size={18} />
                      <span>추가</span>
                    </AddButton>
                  </UserItem>
                </SearchResults>
              )}
            </SearchSection>
          )}

          {/* 친구 초대 탭 */}
          {activeTab === 'invite' && (
            <InviteSection>
              <InviteInfo>
                <InfoIcon>🎉</InfoIcon>
                <InfoText>
                  <strong>링크를 공유</strong>하여 친구를 초대하세요<br/>
                  카카오톡, 문자 등으로 전송 가능합니다
                </InfoText>
              </InviteInfo>

              <InviteLinkBox>
                <InviteLinkText>{inviteLink}</InviteLinkText>
                <CopyButton onClick={copyInviteLink}>
                  <Copy size={20} />
                </CopyButton>
              </InviteLinkBox>

              <ShareButton onClick={shareInviteLink}>
                <Share2 size={20} />
                <span>공유하기</span>
              </ShareButton>

              <Divider>또는</Divider>

              <QRSection>
                <QRTitle>QR 코드로 공유</QRTitle>
                <QRPlaceholder>
                  <QrCode size={80} />
                  <QRText>QR 코드 (구현 예정)</QRText>
                </QRPlaceholder>
              </QRSection>
            </InviteSection>
          )}
        </Content>
      </Modal>
    </Overlay>
  );
};

// 스타일 정의 (기존 스타일 + 추가)
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
  transition: color 0.2s;
  &:hover { color: white; }
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
  font-size: 14px;
  font-weight: 600;
  &:hover { color: ${props => props.active ? '#5ebe26' : 'rgba(255, 255, 255, 0.8)'}; }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

// 친구 목록
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
  &:hover { background: rgba(255, 255, 255, 0.08); }
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

const FriendId = styled.div`
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
`;

const OnlineStatus = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.online ? '#5ebe26' : 'rgba(255, 255, 255, 0.3)'};
  box-shadow: ${props => props.online ? '0 0 10px rgba(94, 190, 38, 0.5)' : 'none'};
`;

// 검색
const SearchSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SearchInfo = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px;
  background: rgba(94, 190, 38, 0.1);
  border: 1px solid rgba(94, 190, 38, 0.3);
  border-radius: 12px;
`;

const InfoIcon = styled.div`
  font-size: 24px;
`;

const InfoText = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 1.5;
  strong { color: #5ebe26; }
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
  &::placeholder { color: rgba(255, 255, 255, 0.3); }
  &:focus { outline: none; border-color: #5ebe26; }
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
  transition: background 0.2s;
  &:hover { background: #4fa01f; }
`;

const SearchResults = styled.div``;

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

const UserId = styled.div`
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
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
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: rgba(94, 190, 38, 0.3); }
`;

// 초대
const InviteSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InviteLinkBox = styled.div`
  display: flex;
  gap: 12px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
`;

const InviteLinkText = styled.div`
  flex: 1;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  word-break: break-all;
  line-height: 1.5;
`;

const CopyButton = styled.button`
  padding: 8px;
  background: rgba(94, 190, 38, 0.2);
  border: 1px solid #5ebe26;
  border-radius: 8px;
  color: #5ebe26;
  cursor: pointer;
  display: flex;
  transition: all 0.2s;
  &:hover { background: rgba(94, 190, 38, 0.3); }
`;

const ShareButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  background: #5ebe26;
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: #4fa01f; transform: translateY(-2px); }
`;

const Divider = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
  font-size: 14px;
  position: relative;
  &::before, &::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 40%;
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
  }
  &::before { left: 0; }
  &::after { right: 0; }
`;

const QRSection = styled.div`
  text-align: center;
`;

const QRTitle = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  margin-bottom: 16px;
`;

const QRPlaceholder = styled.div`
  padding: 40px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.4);
`;

const QRText = styled.div`
  font-size: 13px;
`;

const ErrorText = styled.div`
  color: #ff6b6b;
  font-size: 14px;
  padding: 12px;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 8px;
  text-align: center;
`;

const LoadingText = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 40px;
`;

const EmptyText = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
  padding: 40px;
`;

export default ImprovedFriendsModal;
