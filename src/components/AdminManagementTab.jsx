// src/components/AdminManagementTab.jsx
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { UserPlus, Trash2, Settings, Check } from 'lucide-react';
import {
  getSubAdmins,
  updateSubAdminPermissions,
  removeSubAdmin,
  PERMISSIONS,
  getPermissionLabel,
  getPermissionDescription
} from '../services/adminManagementService';
import { showAlert } from '../utils/alertModal';
import ConfirmModal from './ConfirmModal';

const Container = styled.div`
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
  margin-bottom: 6px;
`;

const AdminEmail = styled.div`
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
`;

const AdminIdRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
`;

const AdminId = styled.div`
  font-size: 11px;
  color: #888;
  font-family: 'Courier New', monospace;
  background: rgba(255, 255, 255, 0.03);
  padding: 3px 6px;
  border-radius: 4px;
`;

const SmallCopyButton = styled.button`
  background: rgba(74, 144, 226, 0.15);
  border: 1px solid rgba(74, 144, 226, 0.25);
  color: #4a90e2;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(74, 144, 226, 0.25);
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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

const SearchRow = styled.div`
  display: flex;
  gap: 8px;
`;

const SearchButton = styled.button`
  background: #4a90e2;
  border: none;
  color: #fff;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
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

const UserInfoCard = styled.div`
  background: rgba(74, 144, 226, 0.1);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  padding: 16px;
  margin-top: 12px;
`;

const UserInfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const UserInfoLabel = styled.span`
  font-size: 13px;
  color: #888;
  font-weight: 600;
`;

const UserInfoValue = styled.span`
  font-size: 13px;
  color: #e0e0e0;
  font-family: 'Courier New', monospace;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
`;

const UidContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const UidValue = styled.div`
  font-size: 11px;
  color: #e0e0e0;
  font-family: 'Courier New', monospace;
  background: rgba(255, 255, 255, 0.05);
  padding: 8px;
  border-radius: 4px;
  word-break: break-all;
  line-height: 1.4;
`;

const CopyUidButton = styled.button`
  background: rgba(74, 144, 226, 0.2);
  border: 1px solid rgba(74, 144, 226, 0.3);
  color: #4a90e2;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  align-self: center;

  &:hover {
    background: rgba(74, 144, 226, 0.3);
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ClearButton = styled.button`
  background: rgba(231, 76, 60, 0.2);
  border: 1px solid rgba(231, 76, 60, 0.3);
  color: #e74c3c;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 12px;
  width: 100%;

  &:hover {
    background: rgba(231, 76, 60, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EditButtonRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
`;

const ApplyButton = styled.button`
  flex: 1;
  background: #4a90e2;
  border: none;
  color: #fff;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
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

const AdminManagementTab = ({ userId }) => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [searchedUser, setSearchedUser] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadSubAdmins();
  }, []);

  const loadSubAdmins = async () => {
    try {
      setLoading(true);
      const admins = await getSubAdmins();

      // 각 부관리자의 ShareNote ID와 앱 닉네임 가져오기
      const { collection, query, where, getDocs, doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');

      const adminsWithWorkspaceCode = await Promise.all(
        admins.map(async (admin) => {
          try {
            // ShareNote ID 조회
            const workspacesRef = collection(db, 'workspaces');
            const q = query(workspacesRef, where('userId', '==', admin.userId));
            const snapshot = await getDocs(q);
            const workspaceCode = snapshot.empty ? null : snapshot.docs[0].data().workspaceCode;

            // 앱 닉네임 조회
            let displayName = admin.displayName;
            try {
              const nicknameDocRef = doc(db, 'nicknames', admin.userId);
              const nicknameDoc = await getDoc(nicknameDocRef);
              if (nicknameDoc.exists()) {
                displayName = nicknameDoc.data().nickname || admin.displayName;
              }
            } catch (nicknameError) {
              console.warn('닉네임 조회 실패:', admin.userId, nicknameError);
            }

            return {
              ...admin,
              displayName,
              workspaceCode
            };
          } catch (error) {
            console.error('WorkspaceCode 조회 실패:', admin.userId, error);
            return admin;
          }
        })
      );

      setSubAdmins(adminsWithWorkspaceCode);
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
        return [...prev, permission];
      }
    });
  };

  const handleSearchUser = async () => {
    if (!newAdminEmail.trim()) {
      showAlert('ShareNote ID를 입력해주세요.', '입력 오류');
      return;
    }

    try {
      setSearching(true);

      // friendService의 getUserByWorkspaceCode 사용
      const { getUserByWorkspaceCode } = await import('../services/friendService');

      // 입력값 정규화: ws- 제거 후 대문자로 변환
      const cleanId = newAdminEmail.trim().toUpperCase().replace(/^WS-/, '');
      const workspaceCode = `ws-${cleanId}`;

      console.log('🔍 [Admin] 사용자 검색 시작:', {
        입력값: newAdminEmail.trim(),
        정규화된값: cleanId,
        검색할값: workspaceCode
      });

      const user = await getUserByWorkspaceCode(workspaceCode);

      if (!user) {
        showAlert('해당 ShareNote ID를 가진 사용자를 찾을 수 없습니다.', '검색 실패');
        setSearchedUser(null);
        return;
      }

      console.log('✅ [Admin] 사용자 찾음:', user);

      setSearchedUser({
        uid: user.id,
        displayName: user.displayName || user.email || '익명',
        email: user.email || '',
        workspaceCode: workspaceCode
      });

      showAlert(`사용자를 찾았습니다: ${user.displayName || user.email}`, '검색 성공');
    } catch (error) {
      console.error('사용자 검색 실패:', error);
      showAlert('사용자 검색에 실패했습니다.', '오류');
      setSearchedUser(null);
    } finally {
      setSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchedUser(null);
    setNewAdminEmail('');
    setSelectedPermissions([]);
  };

  const handleCopyUid = async () => {
    if (!searchedUser?.uid) return;

    try {
      await navigator.clipboard.writeText(searchedUser.uid);
      showAlert('UID가 클립보드에 복사되었습니다.', '복사 완료');
    } catch (error) {
      console.error('UID 복사 실패:', error);
      showAlert('UID 복사에 실패했습니다.', '오류');
    }
  };

  const handleCopyWorkspaceCode = async (workspaceCode) => {
    if (!workspaceCode) return;

    try {
      // ws- 접두사 제거 후 복사
      const cleanId = workspaceCode.replace(/^ws-/i, '');
      await navigator.clipboard.writeText(cleanId);
      showAlert('ShareNote ID가 클립보드에 복사되었습니다.', '복사 완료');
    } catch (error) {
      console.error('ShareNote ID 복사 실패:', error);
      showAlert('ShareNote ID 복사에 실패했습니다.', '오류');
    }
  };

  const handleAddAdmin = async () => {
    if (!searchedUser) {
      showAlert('먼저 사용자를 검색해주세요.', '입력 오류');
      return;
    }

    if (selectedPermissions.length === 0) {
      showAlert('최소 1개 이상의 권한을 선택해주세요.', '입력 오류');
      return;
    }

    try {
      setLoading(true);

      // UID를 직접 사용하여 부관리자 추가
      // addSubAdmin 함수를 수정하여 UID를 직접 받도록 변경
      const { addSubAdminByUid } = await import('../services/adminManagementService');
      await addSubAdminByUid(searchedUser.uid, selectedPermissions);

      showAlert('부관리자가 추가되었습니다.', '성공');
      handleClearSearch();
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

      // 토스트 메시지 표시
      const { toast } = await import('../utils/toast');
      toast('✓ 권한이 적용되었습니다');

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

  const canAddMore = subAdmins.length < 3;

  return (
    <>
      <Container>
        {/* 부관리자 추가 */}
        {canAddMore && (
          <Section>
            <SectionTitle>
              <UserPlus size={16} />
              부관리자 추가
            </SectionTitle>
            <LimitText>
              💡 최대 3명까지 지정할 수 있습니다.
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(현재: {subAdmins.length}/3명)
            </LimitText>
            <AddAdminForm>
              {/* Step 1: ShareNote ID 검색 */}
              <FormGroup>
                <Label>Step 1: ShareNote ID 검색</Label>
                <SearchRow>
                  <Input
                    type="text"
                    placeholder="6자리 입력 (예: XD44R0 또는 ws-XD44R0)"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    disabled={loading || searching || searchedUser}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !searchedUser) {
                        handleSearchUser();
                      }
                    }}
                  />
                  <SearchButton
                    onClick={handleSearchUser}
                    disabled={loading || searching || searchedUser || !newAdminEmail.trim()}
                  >
                    {searching ? '검색 중...' : '검색'}
                  </SearchButton>
                </SearchRow>
              </FormGroup>

              {/* 검색된 사용자 정보 표시 */}
              {searchedUser && (
                <FormGroup>
                  <UserInfoCard>
                    <UserInfoRow>
                      <UserInfoLabel>사용자 이름</UserInfoLabel>
                      <UserInfoValue>{searchedUser.displayName}</UserInfoValue>
                    </UserInfoRow>
                    {searchedUser.email && (
                      <UserInfoRow>
                        <UserInfoLabel>이메일</UserInfoLabel>
                        <UserInfoValue>{searchedUser.email}</UserInfoValue>
                      </UserInfoRow>
                    )}
                    <UserInfoRow>
                      <UserInfoLabel>ShareNote ID</UserInfoLabel>
                      <UserInfoValue>{searchedUser.workspaceCode.replace(/^ws-/i, '')}</UserInfoValue>
                    </UserInfoRow>
                    <UserInfoRow style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <UserInfoLabel style={{ marginBottom: '8px' }}>UID</UserInfoLabel>
                      <UidContainer>
                        <UidValue>{searchedUser.uid}</UidValue>
                        <CopyUidButton onClick={handleCopyUid}>
                          UID 값 복사
                        </CopyUidButton>
                      </UidContainer>
                    </UserInfoRow>
                  </UserInfoCard>
                  <ClearButton onClick={handleClearSearch} disabled={loading}>
                    다시 검색
                  </ClearButton>
                </FormGroup>
              )}

              {/* Step 2: 권한 선택 (사용자 검색 후에만 표시) */}
              {searchedUser && (
                <>
                  <FormGroup>
                    <Label>Step 2: 부여할 권한 선택</Label>
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

                  <AddButton onClick={handleAddAdmin} disabled={loading || selectedPermissions.length === 0}>
                    <UserPlus size={18} />
                    {loading ? '추가 중...' : '부관리자 추가'}
                  </AddButton>
                </>
              )}
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
                    {admin.workspaceCode && (
                      <AdminIdRow>
                        <AdminId>{admin.workspaceCode.replace(/^ws-/i, '')}</AdminId>
                        <SmallCopyButton onClick={() => handleCopyWorkspaceCode(admin.workspaceCode)}>
                          복사
                        </SmallCopyButton>
                      </AdminIdRow>
                    )}
                  </AdminInfo>
                  <AdminActions>
                    {editingAdmin === admin.userId ? null : (
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
                  <>
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
                    <EditButtonRow>
                      <ApplyButton onClick={() => handleSavePermissions(admin.userId)} disabled={loading}>
                        {loading ? '적용 중...' : '적용'}
                      </ApplyButton>
                    </EditButtonRow>
                  </>
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
      </Container>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && adminToDelete && (
        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setAdminToDelete(null);
          }}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setAdminToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="⚠️ 부관리자 제거"
          message={`${adminToDelete.displayName}을(를) 부관리자에서 제거하시겠습니까?`}
          confirmText="제거"
          cancelText="취소"
          showCancel={true}
        />
      )}
    </>
  );
};

export default AdminManagementTab;
