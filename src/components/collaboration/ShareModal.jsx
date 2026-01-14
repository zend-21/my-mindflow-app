// 메모/스케줄 공유 모달
import { toast } from '../../utils/toast';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Share2, Check } from 'lucide-react';
import { getFriends, shareNote } from '../../services/collaborationService';

const ShareModal = ({ isOpen, onClose, noteData, noteType = 'memo' }) => {
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFriends();
    }
  }, [isOpen]);

  const loadFriends = async () => {
    try {
      const friendsList = await getFriends();
      setFriends(friendsList);

      // 기본 권한 설정
      const defaultPermissions = {};
      friendsList.forEach(friend => {
        defaultPermissions[friend.id] = 'read';
      });
      setPermissions(defaultPermissions);
    } catch (err) {
      console.error('친구 목록 로딩 실패:', err);
    }
  };

  const toggleFriend = (friendId) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const changePermission = (friendId, permission) => {
    setPermissions(prev => ({
      ...prev,
      [friendId]: permission
    }));
  };

  const handleShare = async () => {
    if (selectedFriends.length === 0) {
      toast('공유할 친구를 선택해주세요');
      return;
    }

    try {
      setLoading(true);

      const participants = selectedFriends.map(friendId => {
        const friend = friends.find(f => f.id === friendId);
        return {
          id: friendId,
          displayName: friend.displayName,
          photoURL: friend.photoURL,
          permission: permissions[friendId] || 'read'
        };
      });

      await shareNote(noteData, participants, noteType);

      toast('공유가 완료되었습니다!');
      onClose();
    } catch (err) {
      toast('공유 실패: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>
          <Title>
            <Share2 size={24} />
            <span>{noteType === 'memo' ? '메모' : '스케줄'} 공유</span>
          </Title>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </Header>

        <Content>
          <PreviewSection>
            <PreviewLabel>공유할 내용</PreviewLabel>
            <PreviewContent>
              <PreviewTitle>{noteData?.title || '제목 없음'}</PreviewTitle>
              <PreviewText>
                {noteData?.content?.substring(0, 100) || '내용 없음'}
                {noteData?.content?.length > 100 && '...'}
              </PreviewText>
            </PreviewContent>
          </PreviewSection>

          <FriendsSection>
            <SectionLabel>친구 선택</SectionLabel>
            {friends.length === 0 ? (
              <EmptyText>친구가 없습니다. 먼저 친구를 추가해주세요.</EmptyText>
            ) : (
              <FriendsList>
                {friends.map(friend => (
                  <FriendItem key={friend.id} selected={selectedFriends.includes(friend.id)}>
                    <Checkbox>
                      <input
                        type="checkbox"
                        checked={selectedFriends.includes(friend.id)}
                        onChange={() => toggleFriend(friend.id)}
                      />
                      <CheckIcon>
                        <Check size={16} />
                      </CheckIcon>
                    </Checkbox>

                    <Avatar src={friend.photoURL || '/default-avatar.png'} alt={friend.displayName} />

                    <FriendInfo>
                      <FriendName>{friend.displayName}</FriendName>
                      <FriendEmail>{friend.email}</FriendEmail>
                    </FriendInfo>

                    {selectedFriends.includes(friend.id) && (
                      <PermissionSelect
                        value={permissions[friend.id] || 'read'}
                        onChange={(e) => changePermission(friend.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="read">읽기</option>
                        <option value="comment">댓글</option>
                        <option value="edit">수정 제안</option>
                      </PermissionSelect>
                    )}
                  </FriendItem>
                ))}
              </FriendsList>
            )}
          </FriendsSection>

          <PermissionInfo>
            <InfoTitle>권한 안내</InfoTitle>
            <InfoList>
              <InfoItem>
                <InfoBadge color="#6366f1">읽기</InfoBadge>
                <InfoText>내용 확인만 가능</InfoText>
              </InfoItem>
              <InfoItem>
                <InfoBadge color="#8b5cf6">댓글</InfoBadge>
                <InfoText>읽기 + 채팅 참여</InfoText>
              </InfoItem>
              <InfoItem>
                <InfoBadge color="#ec4899">수정 제안</InfoBadge>
                <InfoText>읽기 + 채팅 + 수정 제안 (승인 필요)</InfoText>
              </InfoItem>
            </InfoList>
          </PermissionInfo>
        </Content>

        <Footer>
          <CancelButton onClick={onClose}>취소</CancelButton>
          <ShareButton onClick={handleShare} disabled={loading || selectedFriends.length === 0}>
            {loading ? '공유 중...' : `공유하기 (${selectedFriends.length}명)`}
          </ShareButton>
        </Footer>
      </Modal>
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
  max-width: 550px;
  max-height: 85vh;
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
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  font-size: 22px;
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

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const PreviewSection = styled.div`
  background: rgba(94, 190, 38, 0.1);
  border: 1px solid rgba(94, 190, 38, 0.3);
  border-radius: 12px;
  padding: 16px;
`;

const PreviewLabel = styled.div`
  color: #5ebe26;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const PreviewContent = styled.div``;

const PreviewTitle = styled.div`
  color: white;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
`;

const PreviewText = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  line-height: 1.5;
`;

const FriendsSection = styled.div``;

const SectionLabel = styled.div`
  color: white;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
`;

const FriendsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FriendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: ${props => props.selected ? 'rgba(94, 190, 38, 0.15)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.selected ? 'rgba(94, 190, 38, 0.3)' : 'transparent'};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.selected ? 'rgba(94, 190, 38, 0.2)' : 'rgba(255, 255, 255, 0.08)'};
  }
`;

const Checkbox = styled.label`
  position: relative;
  width: 22px;
  height: 22px;
  cursor: pointer;

  input {
    position: absolute;
    opacity: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }

  input:checked + div {
    background: #5ebe26;
    border-color: #5ebe26;

    svg {
      opacity: 1;
    }
  }
`;

const CheckIcon = styled.div`
  width: 22px;
  height: 22px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  transition: all 0.2s;

  svg {
    color: white;
    opacity: 0;
    transition: opacity 0.2s;
  }
`;

const Avatar = styled.img`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.1);
`;

const FriendInfo = styled.div`
  flex: 1;
`;

const FriendName = styled.div`
  color: white;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const FriendEmail = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
`;

const PermissionSelect = styled.select`
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  outline: none;

  option {
    background: #2d3139;
    color: white;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const PermissionInfo = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 16px;
`;

const InfoTitle = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 12px;
`;

const InfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const InfoBadge = styled.div`
  padding: 4px 10px;
  background: ${props => props.color};
  border-radius: 6px;
  color: white;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  min-width: 70px;
  text-align: center;
`;

const InfoText = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
`;

const Footer = styled.div`
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ShareButton = styled.button`
  flex: 2;
  padding: 14px;
  background: linear-gradient(135deg, #5ebe26 0%, #4fa01f 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(94, 190, 38, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyText = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
  padding: 40px 20px;
  font-size: 14px;
  line-height: 1.6;
`;

export default ShareModal;
