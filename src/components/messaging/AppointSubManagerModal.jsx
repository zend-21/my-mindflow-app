// 부방장 임명 모달
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Shield, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000;
  padding: 20px;
`;

const ModalContainer = styled.div`
  background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: #888;
  padding: 8px;
  border-radius: 8px;
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

const Content = styled.div`
  padding: 24px;
  overflow-y: auto;
  flex: 1;
`;

const InfoText = styled.p`
  font-size: 14px;
  color: #888;
  margin: 0 0 20px 0;
  line-height: 1.6;
`;

const MemberList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MemberItem = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid ${props => props.$selected ? '#667eea' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: ${props => props.$selected ? '#667eea' : 'rgba(255, 255, 255, 0.2)'};
  }
`;

const MemberInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const MemberName = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: #e0e0e0;
`;

const Badge = styled.span`
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 6px;
  background: ${props => {
    if (props.$type === 'owner') return 'linear-gradient(135deg, #667eea, #764ba2)';
    if (props.$type === 'sub_manager') return 'linear-gradient(135deg, #f093fb, #f5576c)';
    return 'transparent';
  }};
  color: #ffffff;
  font-weight: 600;
`;

const CheckIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${props => props.$checked ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(255, 255, 255, 0.05)'};
  border: 2px solid ${props => props.$checked ? '#667eea' : 'rgba(255, 255, 255, 0.2)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
`;

const PermissionsSection = styled.div`
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const PermissionsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  margin-bottom: 12px;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const PermissionsTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #e0e0e0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PermissionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PermissionItem = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const PermissionLabel = styled.div`
  flex: 1;
`;

const PermissionName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 4px;
`;

const PermissionDesc = styled.div`
  font-size: 12px;
  color: #888;
  line-height: 1.4;
`;

const Footer = styled.div`
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 12px;
`;

const Button = styled.button`
  flex: 1;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background: rgba(255, 255, 255, 0.05);
  color: #e0e0e0;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const AppointButton = styled(Button)`
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

// 사용 가능한 권한 목록
const AVAILABLE_PERMISSIONS = [
  {
    id: 'kick_member',
    name: '멤버 강퇴',
    description: '일반 멤버를 강퇴할 수 있습니다 (방장과 다른 부방장은 강퇴 불가)'
  },
  {
    id: 'manage_settings',
    name: '방 설정 관리',
    description: '방 이름, 프로필 이미지 등을 변경할 수 있습니다'
  },
  {
    id: 'manage_messages',
    name: '메시지 관리',
    description: '부적절한 메시지를 삭제할 수 있습니다'
  }
];

const AppointSubManagerModal = ({ chat, members, currentUserId, onClose, onAppoint }) => {
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [showPermissions, setShowPermissions] = useState(true);
  const [loading, setLoading] = useState(false);

  // 부방장으로 임명 가능한 멤버 필터링
  const eligibleMembers = members.filter(member => {
    // 방장, 본인, 이미 부방장인 사람 제외
    const isOwner = member.userId === chat.creatorId;
    const isSelf = member.userId === currentUserId;
    const isSubManager = chat.subManagers?.[member.userId];

    return !isOwner && !isSelf && !isSubManager && member.status === 'active';
  });

  const handleTogglePermission = (permissionId) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const handleAppoint = async () => {
    if (!selectedMember) {
      return;
    }

    setLoading(true);
    try {
      await onAppoint(selectedMember.userId, selectedPermissions);
      onClose();
    } catch (error) {
      console.error('부방장 임명 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>
            <Shield size={24} />
            부방장 임명
          </Title>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </Header>

        <Content>
          <InfoText>
            부방장은 최대 3명까지 임명할 수 있습니다.<br />
            부방장에게 부여할 권한을 선택해주세요.
          </InfoText>

          {eligibleMembers.length === 0 ? (
            <InfoText style={{ textAlign: 'center', marginTop: '40px' }}>
              부방장으로 임명할 수 있는 멤버가 없습니다.
            </InfoText>
          ) : (
            <>
              <MemberList>
                {eligibleMembers.map(member => (
                  <MemberItem
                    key={member.userId}
                    $selected={selectedMember?.userId === member.userId}
                    onClick={() => setSelectedMember(member)}
                  >
                    <MemberInfo>
                      <MemberName>{member.displayName}</MemberName>
                    </MemberInfo>
                    <CheckIcon $checked={selectedMember?.userId === member.userId}>
                      {selectedMember?.userId === member.userId && <UserCheck size={14} />}
                    </CheckIcon>
                  </MemberItem>
                ))}
              </MemberList>

              {selectedMember && (
                <PermissionsSection>
                  <PermissionsHeader onClick={() => setShowPermissions(!showPermissions)}>
                    <PermissionsTitle>
                      <Shield size={18} />
                      권한 설정
                    </PermissionsTitle>
                    {showPermissions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </PermissionsHeader>

                  {showPermissions && (
                    <PermissionsList>
                      {AVAILABLE_PERMISSIONS.map(permission => (
                        <PermissionItem key={permission.id}>
                          <Checkbox
                            type="checkbox"
                            checked={selectedPermissions.includes(permission.id)}
                            onChange={() => handleTogglePermission(permission.id)}
                          />
                          <PermissionLabel>
                            <PermissionName>{permission.name}</PermissionName>
                            <PermissionDesc>{permission.description}</PermissionDesc>
                          </PermissionLabel>
                        </PermissionItem>
                      ))}
                    </PermissionsList>
                  )}
                </PermissionsSection>
              )}
            </>
          )}
        </Content>

        <Footer>
          <CancelButton onClick={onClose}>
            취소
          </CancelButton>
          <AppointButton
            onClick={handleAppoint}
            disabled={!selectedMember || loading}
          >
            {loading ? '임명 중...' : '임명하기'}
          </AppointButton>
        </Footer>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default AppointSubManagerModal;
