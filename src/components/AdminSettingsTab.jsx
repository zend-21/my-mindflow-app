// src/components/AdminSettingsTab.jsx
import { useState } from 'react';
import styled from 'styled-components';
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
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #e0e0e0;
`;

const SectionDescription = styled.p`
  margin: 0 0 20px 0;
  font-size: 14px;
  color: #888;
  line-height: 1.6;
`;

const DangerButton = styled.button`
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  color: #ff6b6b;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 107, 107, 0.2);
    border-color: rgba(255, 107, 107, 0.5);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const AdminSettingsTab = () => {
  const [showInitConfirm, setShowInitConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleInitClick = () => {
    setShowInitConfirm(true);
  };

  const confirmInit = async () => {
    setShowInitConfirm(false);

    try {
      const { forceInitializeAdminConfig } = await import('../services/adminManagementService');
      const result = await forceInitializeAdminConfig();

      if (result.success) {
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('❌ 관리자 설정 초기화 실패:', error);
      setErrorMessage(error.message);
      setShowErrorModal(true);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessModal(false);
    window.location.reload();
  };

  return (
    <>
      <Container>
        <Section>
          <SectionTitle>🔧 관리자 설정 초기화</SectionTitle>
          <SectionDescription>
            모든 부관리자 권한이 삭제되고, 현재 로그인한 사용자가 최고 관리자로 설정됩니다.
            <br />
            이 작업은 되돌릴 수 없으므로 신중하게 진행해주세요.
          </SectionDescription>
          <DangerButton onClick={handleInitClick}>
            관리자 설정 초기화
          </DangerButton>
        </Section>
      </Container>

      {showInitConfirm && (
        <ConfirmModal
          isOpen={showInitConfirm}
          onClose={() => setShowInitConfirm(false)}
          onCancel={() => setShowInitConfirm(false)}
          onConfirm={confirmInit}
          title="⚠️ 관리자 설정 초기화"
          message="관리자 설정을 초기화하시겠습니까?\n\n모든 부관리자 권한이 삭제되고, 현재 로그인한 사용자가 최고 관리자로 설정됩니다."
          confirmText="초기화"
          cancelText="취소"
          showCancel={true}
        />
      )}

      {showSuccessModal && (
        <ConfirmModal
          isOpen={showSuccessModal}
          onClose={handleSuccessConfirm}
          onConfirm={handleSuccessConfirm}
          title="✅ 초기화 완료"
          message="관리자 설정이 성공적으로 초기화되었습니다. 페이지를 새로고침합니다."
          confirmText="확인"
          showCancel={false}
        />
      )}

      {showErrorModal && (
        <ConfirmModal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          onConfirm={() => setShowErrorModal(false)}
          title="❌ 초기화 실패"
          message={`관리자 설정 초기화에 실패했습니다.\n\n${errorMessage}`}
          confirmText="확인"
          showCancel={false}
        />
      )}
    </>
  );
};

export default AdminSettingsTab;
