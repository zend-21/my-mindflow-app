// 워크스페이스 설정 - 내 워크스페이스 정보 및 코드 관리
import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import Portal from '../Portal';
import ConfirmModal from '../ConfirmModal';
import {
  getWorkspaceByUserId,
  changeWorkspaceCode,
  updateWorkspaceSettings
} from '../../services/workspaceService';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10001;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalBox = styled.div`
  background: linear-gradient(135deg, #2a2d35, #333842);
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 480px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  animation: ${slideUp} 0.3s cubic-bezier(0.2, 0, 0, 1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  color: #e0e0e0;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #999;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #e0e0e0;
  }
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.div`
  color: #b0b0b0;
  font-size: 14px;
  margin-bottom: 8px;
  font-weight: 500;
`;

const CodeDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: #1a1d24;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-bottom: 12px;
`;

const CodeText = styled.div`
  flex: 1;
  color: #4a90e2;
  font-size: 20px;
  font-weight: 700;
  font-family: 'Roboto Mono', monospace;
  letter-spacing: 2px;
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  color: #999;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    color: #e0e0e0;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: #333842;
  color: #e0e0e0;

  &:hover {
    background: #3d424d;
  }

  &:disabled {
    background: #555;
    cursor: not-allowed;
  }
`;

const DangerButton = styled(Button)`
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.3);

  &:hover {
    background: rgba(231, 76, 60, 0.3);
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
`;

const StatCard = styled.div`
  background: #1a1d24;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
`;

const StatValue = styled.div`
  color: #4a90e2;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  color: #888;
  font-size: 12px;
`;

const InfoBox = styled.div`
  background: rgba(74, 144, 226, 0.1);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
`;

const InfoText = styled.p`
  color: #a0c4e8;
  font-size: 13px;
  margin: 0;
  line-height: 1.5;
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: #888;
  padding: 40px 20px;
  font-size: 15px;
`;

const ErrorMessage = styled.div`
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 8px;
  padding: 12px;
  color: #e74c3c;
  font-size: 14px;
  margin-bottom: 16px;
`;

const SuccessMessage = styled.div`
  background: rgba(46, 204, 113, 0.1);
  border: 1px solid rgba(46, 204, 113, 0.3);
  border-radius: 8px;
  padding: 12px;
  color: #2ecc71;
  font-size: 14px;
  margin-bottom: 16px;
`;

const WorkspaceSettings = ({ isOpen, onClose }) => {
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCodeChangeConfirm, setShowCodeChangeConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadWorkspace();
    }
  }, [isOpen]);

  const loadWorkspace = async () => {
    setLoading(true);
    setError('');

    try {
      const userId = localStorage.getItem('firebaseUserId');
      if (!userId) {
        setError('로그인이 필요합니다.');
        return;
      }

      const result = await getWorkspaceByUserId(userId);
      setWorkspace(result.data);
    } catch (err) {
      console.error('워크스페이스 로드 오류:', err);
      setError('워크스페이스를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (workspace?.workspaceCode) {
      navigator.clipboard.writeText(workspace.workspaceCode);
      setSuccess('워크스페이스 코드가 복사되었습니다!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleChangeCode = () => {
    setShowCodeChangeConfirm(true);
  };

  const confirmChangeCode = async () => {
    setShowCodeChangeConfirm(false);
    setLoading(true);
    setError('');

    try {
      const userId = localStorage.getItem('firebaseUserId');
      const result = await changeWorkspaceCode(workspace.workspaceId, userId);

      // 워크스페이스 새로고침
      await loadWorkspace();

      setSuccess(`새 코드: ${result.newCode}`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('코드 변경 오류:', err);
      setError('코드를 변경할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <Overlay onClick={handleOverlayClick}>
        <ModalBox onClick={(e) => e.stopPropagation()}>
          <Header>
            <Title>내 워크스페이스</Title>
            <CloseButton onClick={onClose}>×</CloseButton>
          </Header>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}

          {loading ? (
            <LoadingMessage>워크스페이스를 불러오는 중...</LoadingMessage>
          ) : workspace ? (
            <>
              <InfoBox>
                <InfoText>
                  워크스페이스 코드를 공유하면 다른 사람들이 당신의 공개 방 목록을 볼 수 있습니다.
                </InfoText>
              </InfoBox>

              <Section>
                <Label>워크스페이스 코드</Label>
                <CodeDisplay>
                  <CodeText>{workspace.workspaceCode}</CodeText>
                  <IconButton onClick={handleCopyCode} title="복사">
                    📋
                  </IconButton>
                </CodeDisplay>
                <DangerButton onClick={handleChangeCode} disabled={loading}>
                  코드 변경하기
                </DangerButton>
              </Section>

              <Section>
                <Label>통계</Label>
                <StatsGrid>
                  <StatCard>
                    <StatValue>{workspace.stats?.totalRooms || 0}</StatValue>
                    <StatLabel>전체 방</StatLabel>
                  </StatCard>
                  <StatCard>
                    <StatValue>{workspace.stats?.publicRooms || 0}</StatValue>
                    <StatLabel>공개 방</StatLabel>
                  </StatCard>
                  <StatCard>
                    <StatValue>{workspace.stats?.privateRooms || 0}</StatValue>
                    <StatLabel>비공개 방</StatLabel>
                  </StatCard>
                </StatsGrid>
              </Section>

              <Section>
                <Label>생성 날짜</Label>
                <InfoText>
                  {workspace.createdAt?.toDate
                    ? new Date(workspace.createdAt.toDate()).toLocaleDateString('ko-KR')
                    : '알 수 없음'}
                </InfoText>
              </Section>
            </>
          ) : null}
        </ModalBox>
      </Overlay>

      {showCodeChangeConfirm && (
        <ConfirmModal
          icon="🔄"
          title="워크스페이스 코드 변경"
          message="워크스페이스 코드를 변경하시겠습니까?\n\n기존 코드로는 더 이상 접근할 수 없게 됩니다."
          confirmText="변경"
          cancelText="취소"
          onConfirm={confirmChangeCode}
          onCancel={() => setShowCodeChangeConfirm(false)}
        />
      )}
    </Portal>
  );
};

export default WorkspaceSettings;
