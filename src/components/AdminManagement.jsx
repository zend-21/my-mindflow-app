// src/components/AdminManagement.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, UserPlus, Trash2, Shield, Settings, Check } from 'lucide-react';
import {
  getSubAdmins,
  addSubAdmin,
  updateSubAdminPermissions,
  removeSubAdmin,
  PERMISSIONS,
  getPermissionLabel,
  getPermissionDescription,
  isSuperAdmin
} from '../services/adminManagementService';
import { showAlert } from '../utils/alertModal';
import ConfirmModal from './ConfirmModal';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  z-index: 10012;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const Container = styled.div`
  background: linear-gradient(180deg, #2a2d35 0%, #1f2229 100%);
  width: 100%;
  max-width: 700px;
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

const SuperAdminBadge = styled.span`
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
`;

const Section = styled.div`
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #4a90e2;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AddAdminForm = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px 14px;
  color: #e0e0e0;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;

  &:focus {
    border-color: #4a90e2;
    background: rgba(255, 255, 255, 0.08);
  }

  &::placeholder {
    color: #666;
  }
`;

const PermissionsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
`;

const PermissionItem = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid ${props => props.$checked ? '#4a90e2' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: ${props => props.$checked ? '#4a90e2' : 'rgba(255, 255, 255, 0.2)'};
  }
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  margin-top: 2px;
`;

const PermissionInfo = styled.div`
  flex: 1;
`;

const PermissionLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 4px;
`;

const PermissionDescription = styled.div`
  font-size: 12px;
  color: #888;
  line-height: 1.4;
`;

const AddButton = styled.button`
  width: 100%;
  background: #4a90e2;
  border: none;
  color: #fff;
  padding: 12px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;

  &:hover {
    background: #357abd;
  }

  &:disabled {
    background: #555;
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const AdminCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const AdminHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const AdminInfo = styled.div`
  flex: 1;
`;

const AdminName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 4px;
`;

const AdminEmail = styled.div`
  font-size: 13px;
  color: #888;
`;

const AdminActions = styled.div`
  display: flex;
  gap: 8px;
`;

const IconButton = styled.button`
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
    color: ${props => props.$danger ? '#e74c3c' : '#4a90e2'};
  }
`;

const PermissionTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const PermissionTag = styled.span`
  background: rgba(74, 144, 226, 0.2);
  color: #4a90e2;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid rgba(74, 144, 226, 0.3);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #888;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyText = styled.div`
  font-size: 14px;
`;

const LimitText = styled.div`
  font-size: 13px;
  color: #888;
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const AdminManagement = ({ isOpen, onClose, currentUserId }) => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadSubAdmins();
    }
  }, [isOpen]);

  const loadSubAdmins = async () => {
    try {
      setLoading(true);
      const admins = await getSubAdmins();
      setSubAdmins(admins);
    } catch (error) {
      console.error('부관리자 목록 로드 실패:', error);
      showAlert('부관리자 목록을 불러오는데 실패했습니다.', '오류');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permission) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permission)) {
        return prev.filter(p => p !== permission);
      } else {
        const newPermissions = [...prev, permission];
        // 답변 권한 추가 시 알림 권한 자동 추가
        if (permission === PERMISSIONS.REPLY && !newPermissions.includes(PERMISSIONS.NOTIFICATIONS)) {
          newPermissions.push(PERMISSIONS.NOTIFICATIONS);
        }
        return newPermissions;
      }
    });
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      showAlert('사용자 UID를 입력해주세요.', '입력 오류');
      return;
    }

    if (selectedPermissions.length === 0) {
      showAlert('최소 1개 이상의 권한을 선택해주세요.', '입력 오류');
      return;
    }

    try {
      setLoading(true);
      await addSubAdmin(newAdminEmail.trim(), selectedPermissions);
      showAlert('부관리자가 추가되었습니다.', '성공');
      setNewAdminEmail('');
      setSelectedPermissions([]);
      await loadSubAdmins();
    } catch (error) {
      console.error('부관리자 추가 실패:', error);
      showAlert(error.message || '부관리자 추가에 실패했습니다.', '오류');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPermissions = (admin) => {
    setEditingAdmin(admin.userId);
    setSelectedPermissions(admin.permissions);
  };

  const handleSavePermissions = async (userId) => {
    try {
      setLoading(true);
      await updateSubAdminPermissions(userId, selectedPermissions);
      showAlert('권한이 수정되었습니다.', '성공');
      setEditingAdmin(null);
      setSelectedPermissions([]);
      await loadSubAdmins();
    } catch (error) {
      console.error('권한 수정 실패:', error);
      showAlert('권한 수정에 실패했습니다.', '오류');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (admin) => {
    setAdminToDelete(admin);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!adminToDelete) return;

    try {
      setLoading(true);
      await removeSubAdmin(adminToDelete.userId);
      showAlert('부관리자가 제거되었습니다.', '성공');
      setShowDeleteConfirm(false);
      setAdminToDelete(null);
      await loadSubAdmins();
    } catch (error) {
      console.error('부관리자 제거 실패:', error);
      showAlert('부관리자 제거에 실패했습니다.', '오류');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const canAddMore = subAdmins.length < 3;

  return (
    <>
      <Overlay onClick={handleOverlayClick}>
        <Container>
          <Header>
            <Title>
              <Shield size={20} />
              부관리자 관리
              <SuperAdminBadge>SUPER ADMIN</SuperAdminBadge>
            </Title>
            <CloseButton onClick={onClose}>
              <X size={20} />
            </CloseButton>
          </Header>

          <Content>
            {/* 부관리자 추가 */}
            {canAddMore && (
              <Section>
                <SectionTitle>
                  <UserPlus size={16} />
                  부관리자 추가
                </SectionTitle>
                <LimitText>
                  💡 최대 3명까지 부관리자를 지정할 수 있습니다. (현재: {subAdmins.length}/3)
                </LimitText>
                <AddAdminForm>
                  <FormGroup>
                    <Label>사용자 UID</Label>
                    <Input
                      type="text"
                      placeholder="Firebase UID 입력 (예: abc123def456...)"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      disabled={loading}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>부여할 권한</Label>
                    <PermissionsGrid>
                      {Object.values(PERMISSIONS).map((permission) => (
                        <PermissionItem
                          key={permission}
                          $checked={selectedPermissions.includes(permission)}
                        >
                          <Checkbox
                            type="checkbox"
                            checked={selectedPermissions.includes(permission)}
                            onChange={() => handlePermissionToggle(permission)}
                            disabled={loading}
                          />
                          <PermissionInfo>
                            <PermissionLabel>{getPermissionLabel(permission)}</PermissionLabel>
                            <PermissionDescription>
                              {getPermissionDescription(permission)}
                            </PermissionDescription>
                          </PermissionInfo>
                        </PermissionItem>
                      ))}
                    </PermissionsGrid>
                  </FormGroup>

                  <AddButton onClick={handleAddAdmin} disabled={loading}>
                    <UserPlus size={18} />
                    {loading ? '추가 중...' : '부관리자 추가'}
                  </AddButton>
                </AddAdminForm>
              </Section>
            )}

            {/* 현재 부관리자 목록 */}
            <Section>
              <SectionTitle>
                <Settings size={16} />
                현재 부관리자 ({subAdmins.length}/3)
              </SectionTitle>

              {loading && subAdmins.length === 0 ? (
                <EmptyState>
                  <EmptyText>부관리자 목록을 불러오는 중...</EmptyText>
                </EmptyState>
              ) : subAdmins.length === 0 ? (
                <EmptyState>
                  <EmptyIcon>👥</EmptyIcon>
                  <EmptyText>아직 부관리자가 없습니다</EmptyText>
                </EmptyState>
              ) : (
                subAdmins.map((admin) => (
                  <AdminCard key={admin.userId}>
                    <AdminHeader>
                      <AdminInfo>
                        <AdminName>{admin.displayName}</AdminName>
                        {admin.email && <AdminEmail>{admin.email}</AdminEmail>}
                      </AdminInfo>
                      <AdminActions>
                        {editingAdmin === admin.userId ? (
                          <IconButton onClick={() => handleSavePermissions(admin.userId)} disabled={loading}>
                            <Check size={18} />
                          </IconButton>
                        ) : (
                          <IconButton onClick={() => handleEditPermissions(admin)} disabled={loading}>
                            <Settings size={18} />
                          </IconButton>
                        )}
                        <IconButton
                          $danger
                          onClick={() => handleDeleteClick(admin)}
                          disabled={loading}
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </AdminActions>
                    </AdminHeader>

                    {editingAdmin === admin.userId ? (
                      <PermissionsGrid>
                        {Object.values(PERMISSIONS).map((permission) => (
                          <PermissionItem
                            key={permission}
                            $checked={selectedPermissions.includes(permission)}
                          >
                            <Checkbox
                              type="checkbox"
                              checked={selectedPermissions.includes(permission)}
                              onChange={() => handlePermissionToggle(permission)}
                              disabled={loading}
                            />
                            <PermissionInfo>
                              <PermissionLabel>{getPermissionLabel(permission)}</PermissionLabel>
                              <PermissionDescription>
                                {getPermissionDescription(permission)}
                              </PermissionDescription>
                            </PermissionInfo>
                          </PermissionItem>
                        ))}
                      </PermissionsGrid>
                    ) : (
                      <PermissionTags>
                        {admin.permissions.map((permission) => (
                          <PermissionTag key={permission}>
                            {getPermissionLabel(permission)}
                          </PermissionTag>
                        ))}
                      </PermissionTags>
                    )}
                  </AdminCard>
                ))
              )}
            </Section>
          </Content>
        </Container>
      </Overlay>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && adminToDelete && (
        <ConfirmModal
          icon="⚠️"
          title="부관리자 제거"
          message={`${adminToDelete.displayName}을(를) 부관리자에서 제거하시겠습니까?`}
          confirmText="제거"
          cancelText="취소"
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setAdminToDelete(null);
          }}
        />
      )}
    </>
  );
};

export default AdminManagement;
