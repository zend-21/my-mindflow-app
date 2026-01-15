// 부방장 임명 모달
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Shield, Check } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';

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
  gap: 10px;
`;

// 부방장 멤버 박스 (2줄 구조)
const SubManagerBox = styled.div`
  background: rgba(34, 197, 94, 0.1);
  border: 2px solid #22c55e;
  border-radius: 12px;
  padding: 14px 16px;
  transition: all 0.2s;
`;

const SubManagerRow1 = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
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

const SelectButton = styled.button`
  background: ${props => props.$selected ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'rgba(255, 255, 255, 0.05)'};
  border: 2px solid ${props => props.$selected ? '#22c55e' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  padding: 0;

  &:hover {
    border-color: #22c55e;
    background: ${props => props.$selected ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'rgba(34, 197, 94, 0.2)'};
  }
`;

const SubManagerRow2 = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const PermissionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #22c55e;
`;

const PermissionTextButton = styled.button`
  background: rgba(34, 197, 94, 0.2);
  border: 1px solid rgba(34, 197, 94, 0.4);
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #22c55e;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(34, 197, 94, 0.3);
  }
`;

// 일반 멤버 박스 (1줄 구조)
const NormalMemberBox = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.2);
  }
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

const SaveButton = styled(Button)`
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(34, 197, 94, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

// 권한 설정 모달
const PermissionModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100001;
  padding: 20px;
`;

const PermissionModalContainer = styled.div`
  background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const PermissionHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const PermissionTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const PermissionContent = styled.div`
  padding: 24px;
`;

const PermissionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PermissionItem = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  cursor: pointer;
  margin-top: 2px;
  accent-color: #22c55e;
`;

const PermissionLabel = styled.div`
  flex: 1;
`;

const PermissionName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 4px;
`;

const PermissionDesc = styled.div`
  font-size: 13px;
  color: #888;
  line-height: 1.5;
`;

const PermissionFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
`;

const ConfirmButton = styled.button`
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #ffffff;

  &:hover {
    transform: translateY(-1px);
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
    id: 'manage_messages',
    name: '메시지 관리',
    description: '부적절한 메시지를 삭제할 수 있습니다'
  }
];

const AppointSubManagerModal = ({ chat, members, currentUserId, onClose, onAppoint, onRemoveSubManager }) => {
  // 부방장 선택 상태: { oderId: [권한 배열] }
  const [selectedSubManagers, setSelectedSubManagers] = useState({});
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [tempPermissions, setTempPermissions] = useState([]);
  const [loading, setLoading] = useState(false);

  // 초기화: 기존 부방장 정보 로드
  useEffect(() => {
    if (chat.subManagers) {
      const initial = {};
      Object.entries(chat.subManagers).forEach(([userId, data]) => {
        initial[userId] = data.permissions || [];
      });
      setSelectedSubManagers(initial);
    }
  }, [chat.subManagers]);

  // 참여 중인 멤버만 필터링 (방장, 본인, 강퇴자, 탈퇴자, 초대대기/거부 제외)
  const eligibleMembers = members.filter(member => {
    const isOwner = member.userId === chat.creatorId;
    const isSelf = member.userId === currentUserId;
    const isKicked = chat.kickedUsers && chat.kickedUsers.includes(member.userId);
    const isStillInRoom = chat.members && chat.members.includes(member.userId);
    const isActiveStatus = member.status === 'active';

    return !isOwner && !isSelf && !isKicked && isStillInRoom && isActiveStatus;
  });

  // 부방장 선택/해제 토글
  const handleToggleSubManager = (memberId) => {
    setSelectedSubManagers(prev => {
      const newState = { ...prev };
      if (newState[memberId] !== undefined) {
        // 이미 부방장이면 제거
        delete newState[memberId];
      } else {
        // 부방장 추가 (최대 3명 체크)
        if (Object.keys(newState).length >= 3) {
          return prev; // 3명 초과 방지
        }
        newState[memberId] = [];
      }
      return newState;
    });
  };

  // 권한 설정 모달 열기
  const handleOpenPermissionModal = (memberId) => {
    setEditingMemberId(memberId);
    setTempPermissions(selectedSubManagers[memberId] || []);
    setShowPermissionModal(true);
  };

  // 권한 토글
  const handleTogglePermission = (permissionId) => {
    setTempPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  // 권한 저장
  const handleSavePermissions = () => {
    if (editingMemberId) {
      setSelectedSubManagers(prev => ({
        ...prev,
        [editingMemberId]: tempPermissions
      }));
    }
    setShowPermissionModal(false);
    setEditingMemberId(null);
  };

  // 저장 처리
  const handleSave = async () => {
    setLoading(true);
    try {
      // 기존 부방장 목록
      const existingSubManagers = chat.subManagers ? Object.keys(chat.subManagers) : [];

      // 새로 추가된 부방장
      const newSubManagers = Object.keys(selectedSubManagers).filter(
        id => !existingSubManagers.includes(id)
      );

      // 제거된 부방장
      const removedSubManagers = existingSubManagers.filter(
        id => !Object.keys(selectedSubManagers).includes(id)
      );

      // 부방장 추가
      for (const userId of newSubManagers) {
        await onAppoint(userId, selectedSubManagers[userId]);
      }

      // 부방장 제거
      for (const userId of removedSubManagers) {
        if (onRemoveSubManager) {
          await onRemoveSubManager(userId);
        }
      }

      // 권한 업데이트 (기존 부방장 중 권한이 변경된 경우)
      for (const userId of Object.keys(selectedSubManagers)) {
        if (existingSubManagers.includes(userId)) {
          const existingPermissions = chat.subManagers[userId]?.permissions || [];
          const newPermissions = selectedSubManagers[userId];

          // 권한이 변경된 경우에만 업데이트
          if (JSON.stringify(existingPermissions.sort()) !== JSON.stringify(newPermissions.sort())) {
            await onAppoint(userId, newPermissions);
          }
        }
      }

      onClose();
    } catch (error) {
      console.error('부방장 설정 저장 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 권한 요약 텍스트
  const getPermissionSummary = (permissions) => {
    if (!permissions || permissions.length === 0) {
      return '권한 없음';
    }
    return permissions.map(id => {
      const perm = AVAILABLE_PERMISSIONS.find(p => p.id === id);
      return perm?.name || id;
    }).join(', ');
  };

  // 부방장 목록 (선택된 순서대로)
  const subManagerMembers = eligibleMembers.filter(m => selectedSubManagers[m.userId] !== undefined);
  // 일반 멤버 목록
  const normalMembers = eligibleMembers.filter(m => selectedSubManagers[m.userId] === undefined);

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>
            <Shield size={24} />
            부방장 관리
          </Title>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </Header>

        <Content>
          <InfoText>
            부방장은 최대 3명까지 임명할 수 있습니다.<br />
            현재 {Object.keys(selectedSubManagers).length}/3명 선택됨
          </InfoText>

          {eligibleMembers.length === 0 ? (
            <InfoText style={{ textAlign: 'center', marginTop: '40px' }}>
              부방장으로 임명할 수 있는 멤버가 없습니다.
            </InfoText>
          ) : (
            <MemberList>
              {/* 부방장으로 선택된 멤버들 (최상단) */}
              {subManagerMembers.map(member => (
                <SubManagerBox key={member.userId}>
                  <SubManagerRow1>
                    <MemberInfo>
                      <UserAvatar
                        userId={member.userId}
                        fallbackText={member.displayName}
                        size="40px"
                        fontSize="16px"
                      />
                      <MemberName>{member.displayName}</MemberName>
                    </MemberInfo>
                    <SelectButton
                      $selected={true}
                      onClick={() => handleToggleSubManager(member.userId)}
                    >
                      <Check size={16} />
                    </SelectButton>
                  </SubManagerRow1>
                  <SubManagerRow2>
                    <PermissionInfo>
                      <Shield size={14} />
                      부여된 권한: {getPermissionSummary(selectedSubManagers[member.userId])}
                    </PermissionInfo>
                    <PermissionTextButton onClick={() => handleOpenPermissionModal(member.userId)}>
                      권한
                    </PermissionTextButton>
                  </SubManagerRow2>
                </SubManagerBox>
              ))}

              {/* 일반 멤버들 */}
              {normalMembers.map(member => (
                <NormalMemberBox key={member.userId}>
                  <MemberInfo>
                    <UserAvatar
                      userId={member.userId}
                      fallbackText={member.displayName}
                      size="40px"
                      fontSize="16px"
                    />
                    <MemberName>{member.displayName}</MemberName>
                  </MemberInfo>
                  <SelectButton
                    $selected={false}
                    onClick={() => handleToggleSubManager(member.userId)}
                    disabled={Object.keys(selectedSubManagers).length >= 3}
                    style={Object.keys(selectedSubManagers).length >= 3 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  />
                </NormalMemberBox>
              ))}
            </MemberList>
          )}
        </Content>

        <Footer>
          <CancelButton onClick={onClose}>
            취소
          </CancelButton>
          <SaveButton
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? '저장 중...' : '저장'}
          </SaveButton>
        </Footer>
      </ModalContainer>

      {/* 권한 설정 모달 */}
      {showPermissionModal && (
        <PermissionModalOverlay onClick={() => setShowPermissionModal(false)}>
          <PermissionModalContainer onClick={(e) => e.stopPropagation()}>
            <PermissionHeader>
              <PermissionTitle>
                <Shield size={20} />
                권한 설정
              </PermissionTitle>
              <CloseButton onClick={() => setShowPermissionModal(false)}>
                <X size={18} />
              </CloseButton>
            </PermissionHeader>

            <PermissionContent>
              <PermissionsList>
                {AVAILABLE_PERMISSIONS.map(permission => (
                  <PermissionItem key={permission.id}>
                    <Checkbox
                      type="checkbox"
                      checked={tempPermissions.includes(permission.id)}
                      onChange={() => handleTogglePermission(permission.id)}
                    />
                    <PermissionLabel>
                      <PermissionName>{permission.name}</PermissionName>
                      <PermissionDesc>{permission.description}</PermissionDesc>
                    </PermissionLabel>
                  </PermissionItem>
                ))}
              </PermissionsList>
            </PermissionContent>

            <PermissionFooter>
              <ConfirmButton onClick={handleSavePermissions}>
                확인
              </ConfirmButton>
            </PermissionFooter>
          </PermissionModalContainer>
        </PermissionModalOverlay>
      )}
    </ModalOverlay>
  );
};

export default AppointSubManagerModal;
