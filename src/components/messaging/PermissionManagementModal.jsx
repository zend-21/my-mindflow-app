// 🔐 권한 관리 모달 - 매니저가 편집자를 지정하고 권한을 관리
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Users, Crown, Check, UserPlus, UserMinus } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  z-index: 300000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ModalContainer = styled.div`
  background: linear-gradient(180deg, #2a2d35, #1f2128);
  border-radius: 16px;
  padding: 24px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #888;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }
`;

const Section = styled.div`
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #888;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MemberList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MemberItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const MemberInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

const MemberAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.$color || 'linear-gradient(135deg, #667eea, #764ba2)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  flex-shrink: 0;
`;

const MemberDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const MemberName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MemberRole = styled.div`
  font-size: 12px;
  color: #888;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const RoleBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: ${props => {
    if (props.$type === 'manager') return 'rgba(46, 213, 115, 0.15)';
    if (props.$type === 'editor') return 'rgba(74, 144, 226, 0.15)';
    return 'rgba(255, 255, 255, 0.05)';
  }};
  border-radius: 6px;
  color: ${props => {
    if (props.$type === 'manager') return '#2ed573';
    if (props.$type === 'editor') return '#4a90e2';
    return '#888';
  }};
  font-size: 11px;
  font-weight: 600;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: ${props => {
    if (props.$status === 'pending') return 'rgba(255, 193, 7, 0.15)';
    if (props.$status === 'rejected') return 'rgba(255, 87, 87, 0.15)';
    return 'transparent';
  }};
  border-radius: 6px;
  color: ${props => {
    if (props.$status === 'pending') return '#ffc107';
    if (props.$status === 'rejected') return '#ff5757';
    return '#888';
  }};
  font-size: 11px;
  font-weight: 600;
`;

const StrikethroughName = styled.span`
  text-decoration: ${props => props.$rejected ? 'line-through' : 'none'};
  opacity: ${props => props.$rejected ? 0.6 : 1};
`;

const ActionButton = styled.button`
  background: ${props => props.$variant === 'danger'
    ? 'rgba(255, 87, 87, 0.15)'
    : 'rgba(74, 144, 226, 0.15)'};
  border: 1px solid ${props => props.$variant === 'danger'
    ? 'rgba(255, 87, 87, 0.3)'
    : 'rgba(74, 144, 226, 0.3)'};
  color: ${props => props.$variant === 'danger' ? '#ff5757' : '#4a90e2'};
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${props => props.$variant === 'danger'
      ? 'rgba(255, 87, 87, 0.25)'
      : 'rgba(74, 144, 226, 0.25)'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TransferButton = styled(ActionButton)`
  background: rgba(255, 193, 7, 0.15);
  border-color: rgba(255, 193, 7, 0.3);
  color: #ffc107;

  &:hover:not(:disabled) {
    background: rgba(255, 193, 7, 0.25);
  }
`;

const EmptyState = styled.div`
  padding: 40px 20px;
  text-align: center;
  color: #666;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
`;

const EmptyText = styled.div`
  font-size: 14px;
  color: #888;
`;

const PermissionManagementModal = ({
  chatRoomId,
  currentUserId,
  isManager,
  onClose,
  showToast
}) => {
  const [members, setMembers] = useState([]);
  const [permissions, setPermissions] = useState({
    manager: null,
    editors: [],
    viewers: []
  });
  const [loading, setLoading] = useState(true);

  // 채팅방 멤버 및 권한 정보 가져오기
  useEffect(() => {
    const fetchMembersAndPermissions = async () => {
      try {
        // 채팅방 정보 가져오기
        const chatRef = doc(db, 'chatRooms', chatRoomId);
        const chatSnap = await getDoc(chatRef);

        if (!chatSnap.exists()) {
          showToast?.('채팅방 정보를 찾을 수 없습니다');
          return;
        }

        const chatData = chatSnap.data();

        // 멤버 목록 구성
        const memberList = [];
        if (chatData.type === 'group') {
          // 그룹 채팅
          chatData.members?.forEach(memberId => {
            const memberInfo = chatData.membersInfo?.[memberId];
            memberList.push({
              userId: memberId,
              displayName: memberInfo?.displayName || '익명',
              email: memberInfo?.email || '',
              status: memberInfo?.status || 'active' // 멤버 상태 추가
            });
          });
        } else {
          // 1:1 대화
          chatData.participants?.forEach(userId => {
            const userInfo = chatData.participantsInfo?.[userId];
            memberList.push({
              userId: userId,
              displayName: userInfo?.displayName || '익명',
              email: userInfo?.email || ''
            });
          });
        }

        setMembers(memberList);

        // 권한 정보 가져오기
        const permRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'permissions');
        const permSnap = await getDoc(permRef);

        if (permSnap.exists()) {
          setPermissions(permSnap.data());
        } else {
          // 권한 문서가 없으면 방장을 매니저로 설정
          const initialPermissions = {
            manager: chatData.createdBy || chatData.participants?.[0],
            editors: [],
            viewers: memberList.map(m => m.userId).filter(id => id !== (chatData.createdBy || chatData.participants?.[0]))
          };
          setPermissions(initialPermissions);

          // Firestore에 초기 권한 저장
          await updateDoc(permRef, initialPermissions);
        }
      } catch (error) {
        console.error('멤버 및 권한 정보 가져오기 실패:', error);
        showToast?.('정보를 불러오는데 실패했습니다');
      } finally {
        setLoading(false);
      }
    };

    fetchMembersAndPermissions();
  }, [chatRoomId, showToast]);

  // 편집자 추가
  const handleAddEditor = async (userId) => {
    if (!isManager) {
      showToast?.('매니저만 권한을 수정할 수 있습니다');
      return;
    }

    try {
      const newEditors = [...permissions.editors, userId];
      const newViewers = permissions.viewers.filter(id => id !== userId);

      const permRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'permissions');
      await updateDoc(permRef, {
        editors: newEditors,
        viewers: newViewers
      });

      setPermissions({
        ...permissions,
        editors: newEditors,
        viewers: newViewers
      });

      showToast?.('편집 권한이 부여되었습니다');
    } catch (error) {
      console.error('권한 부여 실패:', error);
      showToast?.('권한 부여에 실패했습니다');
    }
  };

  // 편집자 제거
  const handleRemoveEditor = async (userId) => {
    if (!isManager) {
      showToast?.('매니저만 권한을 수정할 수 있습니다');
      return;
    }

    try {
      const newEditors = permissions.editors.filter(id => id !== userId);
      const newViewers = [...permissions.viewers, userId];

      const permRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'permissions');
      await updateDoc(permRef, {
        editors: newEditors,
        viewers: newViewers
      });

      setPermissions({
        ...permissions,
        editors: newEditors,
        viewers: newViewers
      });

      showToast?.('편집 권한이 제거되었습니다');
    } catch (error) {
      console.error('권한 제거 실패:', error);
      showToast?.('권한 제거에 실패했습니다');
    }
  };

  // 매니저 권한 이양
  const handleTransferManager = async (userId) => {
    if (!isManager) {
      showToast?.('매니저만 권한을 이양할 수 있습니다');
      return;
    }

    if (!confirm('정말 매니저 권한을 이양하시겠습니까?\n이양 후에는 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      // 현재 매니저를 뷰어로 변경
      const newViewers = [...permissions.viewers.filter(id => id !== userId), currentUserId];
      const newEditors = permissions.editors.filter(id => id !== userId);

      const permRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'permissions');
      await updateDoc(permRef, {
        manager: userId,
        editors: newEditors,
        viewers: newViewers
      });

      setPermissions({
        manager: userId,
        editors: newEditors,
        viewers: newViewers
      });

      showToast?.('매니저 권한이 이양되었습니다');

      // 모달 닫기
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('권한 이양 실패:', error);
      showToast?.('권한 이양에 실패했습니다');
    }
  };

  // 아바타 색상 생성
  const getAvatarColor = (userId) => {
    const colors = [
      'linear-gradient(135deg, #667eea, #764ba2)',
      'linear-gradient(135deg, #f093fb, #f5576c)',
      'linear-gradient(135deg, #4facfe, #00f2fe)',
      'linear-gradient(135deg, #43e97b, #38f9d7)',
      'linear-gradient(135deg, #fa709a, #fee140)',
      'linear-gradient(135deg, #30cfd0, #330867)',
    ];
    const index = userId ? userId.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  // 역할 판단
  const getUserRole = (userId) => {
    if (userId === permissions.manager) return 'manager';
    if (permissions.editors.includes(userId)) return 'editor';
    return 'viewer';
  };

  if (loading) {
    return (
      <ModalOverlay onClick={onClose}>
        <ModalContainer onClick={(e) => e.stopPropagation()}>
          <EmptyState>
            <EmptyIcon>⏳</EmptyIcon>
            <EmptyText>권한 정보를 불러오는 중...</EmptyText>
          </EmptyState>
        </ModalContainer>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <Users size={20} />
            권한 관리
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        {members.length === 0 ? (
          <EmptyState>
            <EmptyIcon>👥</EmptyIcon>
            <EmptyText>멤버가 없습니다</EmptyText>
          </EmptyState>
        ) : (
          <>
            {/* 매니저 */}
            <Section>
              <SectionTitle>매니저 (1명)</SectionTitle>
              <MemberList>
                {members.filter(m => m.userId === permissions.manager).map(member => (
                  <MemberItem key={member.userId}>
                    <MemberInfo>
                      <MemberAvatar $color={getAvatarColor(member.userId)}>
                        {member.displayName.charAt(0).toUpperCase()}
                      </MemberAvatar>
                      <MemberDetails>
                        <MemberName>
                          <StrikethroughName $rejected={member.status === 'rejected'}>
                            {member.displayName}
                          </StrikethroughName>
                        </MemberName>
                        <MemberRole>
                          <RoleBadge $type="manager">
                            <Crown size={12} />
                            매니저
                          </RoleBadge>
                          {member.status === 'pending' && <StatusBadge $status="pending">초대됨</StatusBadge>}
                          {member.status === 'rejected' && <StatusBadge $status="rejected">거부됨</StatusBadge>}
                          {member.userId === currentUserId && ' (나)'}
                        </MemberRole>
                      </MemberDetails>
                    </MemberInfo>
                  </MemberItem>
                ))}
              </MemberList>
            </Section>

            {/* 편집자 */}
            <Section>
              <SectionTitle>편집자 ({permissions.editors.length}명)</SectionTitle>
              {permissions.editors.length === 0 ? (
                <EmptyState style={{ padding: '20px' }}>
                  <EmptyText>편집자가 없습니다</EmptyText>
                </EmptyState>
              ) : (
                <MemberList>
                  {members.filter(m => permissions.editors.includes(m.userId)).map(member => (
                    <MemberItem key={member.userId}>
                      <MemberInfo>
                        <MemberAvatar $color={getAvatarColor(member.userId)}>
                          {member.displayName.charAt(0).toUpperCase()}
                        </MemberAvatar>
                        <MemberDetails>
                          <MemberName>
                            <StrikethroughName $rejected={member.status === 'rejected'}>
                              {member.displayName}
                            </StrikethroughName>
                          </MemberName>
                          <MemberRole>
                            <RoleBadge $type="editor">
                              <Check size={12} />
                              편집자
                            </RoleBadge>
                            {member.status === 'pending' && <StatusBadge $status="pending">초대됨</StatusBadge>}
                            {member.status === 'rejected' && <StatusBadge $status="rejected">거부됨</StatusBadge>}
                            {member.userId === currentUserId && ' (나)'}
                          </MemberRole>
                        </MemberDetails>
                      </MemberInfo>
                      {isManager && (
                        <>
                          <ActionButton
                            $variant="danger"
                            onClick={() => handleRemoveEditor(member.userId)}
                          >
                            <UserMinus size={14} />
                            제거
                          </ActionButton>
                          <TransferButton onClick={() => handleTransferManager(member.userId)}>
                            <Crown size={14} />
                            매니저 이양
                          </TransferButton>
                        </>
                      )}
                    </MemberItem>
                  ))}
                </MemberList>
              )}
            </Section>

            {/* 뷰어 */}
            <Section>
              <SectionTitle>뷰어 ({permissions.viewers.length}명)</SectionTitle>
              {permissions.viewers.length === 0 ? (
                <EmptyState style={{ padding: '20px' }}>
                  <EmptyText>뷰어가 없습니다</EmptyText>
                </EmptyState>
              ) : (
                <MemberList>
                  {members.filter(m => permissions.viewers.includes(m.userId)).map(member => (
                    <MemberItem key={member.userId}>
                      <MemberInfo>
                        <MemberAvatar $color={getAvatarColor(member.userId)}>
                          {member.displayName.charAt(0).toUpperCase()}
                        </MemberAvatar>
                        <MemberDetails>
                          <MemberName>
                            <StrikethroughName $rejected={member.status === 'rejected'}>
                              {member.displayName}
                            </StrikethroughName>
                          </MemberName>
                          <MemberRole>
                            <RoleBadge>읽기 전용</RoleBadge>
                            {member.status === 'pending' && <StatusBadge $status="pending">초대됨</StatusBadge>}
                            {member.status === 'rejected' && <StatusBadge $status="rejected">거부됨</StatusBadge>}
                            {member.userId === currentUserId && ' (나)'}
                          </MemberRole>
                        </MemberDetails>
                      </MemberInfo>
                      {isManager && (
                        <>
                          <ActionButton onClick={() => handleAddEditor(member.userId)}>
                            <UserPlus size={14} />
                            편집자 지정
                          </ActionButton>
                          <TransferButton onClick={() => handleTransferManager(member.userId)}>
                            <Crown size={14} />
                            매니저 이양
                          </TransferButton>
                        </>
                      )}
                    </MemberItem>
                  ))}
                </MemberList>
              )}
            </Section>
          </>
        )}
      </ModalContainer>
    </ModalOverlay>
  );
};

export default PermissionManagementModal;
