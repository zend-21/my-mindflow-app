// 📥 초대 코드로 단체방 참여 모달
import { useState } from 'react';
import styled from 'styled-components';
import { X, Key, AlertCircle } from 'lucide-react';
import { joinGroupByInviteCode } from '../../services/groupChatService';
import ConfirmModal from '../ConfirmModal';

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
  max-width: 450px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
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
  color: #e0e0e0;
  padding: 14px 16px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 2px;
  transition: all 0.2s;

  &::placeholder {
    color: #666;
    text-transform: none;
    letter-spacing: normal;
  }

  &:focus {
    outline: none;
    border-color: #667eea;
    background: rgba(255, 255, 255, 0.08);
  }
`;

const InfoText = styled.p`
  font-size: 13px;
  color: #888;
  margin: 12px 0 0 0;
  text-align: center;
  line-height: 1.5;
`;

const ErrorText = styled.p`
  font-size: 13px;
  color: #e57373;
  margin: 12px 0 0 0;
  text-align: center;
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

const JoinButton = styled(Button)`
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

const JoinGroupModal = ({ onClose, showToast }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [blockedConfirm, setBlockedConfirm] = useState({ show: false, blockedNames: '' });

  const handleJoin = async (forceJoin = false) => {
    if (!inviteCode.trim()) {
      setError('초대 코드를 입력해주세요');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userId = localStorage.getItem('firebaseUserId');
      if (!userId) {
        setError('로그인이 필요합니다');
        return;
      }

      const result = await joinGroupByInviteCode(inviteCode.trim(), userId, forceJoin);

      if (result.success) {
        showToast?.(`✅ ${result.message}`);
        onClose();
      }
    } catch (err) {
      console.error('단체방 참여 실패:', err);

      // 차단 사용자가 있는 경우
      if (err.message?.startsWith('BLOCKED_MEMBERS_IN_GROUP:')) {
        const blockedNames = err.message.replace('BLOCKED_MEMBERS_IN_GROUP:', '');
        setBlockedConfirm({ show: true, blockedNames });
        setLoading(false);
        return;
      }

      setError(err.message || '단체방 참여에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleJoin();
    }
  };

  const confirmJoinWithBlocked = async () => {
    setBlockedConfirm({ show: false, blockedNames: '' });
    await handleJoin(true);
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>
            <Key size={24} />
            초대 코드로 참여
          </Title>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </Header>

        <Content>
          <Label>초대 코드</Label>
          <Input
            type="text"
            placeholder="INV-WS90D7"
            value={inviteCode}
            onChange={(e) => {
              setInviteCode(e.target.value);
              setError('');
            }}
            onKeyPress={handleKeyPress}
            maxLength={10}
            autoFocus
          />
          {error ? (
            <ErrorText>{error}</ErrorText>
          ) : (
            <InfoText>
              🌐 공개방의 초대 코드를 입력하세요 (예: INV-WS90D7)<br />
              <span style={{ fontSize: '12px', color: '#666' }}>
                * 비공개방은 초대 코드로 참여할 수 없습니다
              </span>
            </InfoText>
          )}
        </Content>

        <Footer>
          <CancelButton onClick={onClose}>
            취소
          </CancelButton>
          <JoinButton onClick={handleJoin} disabled={loading || !inviteCode.trim()}>
            {loading ? '참여 중...' : '참여하기'}
          </JoinButton>
        </Footer>
      </ModalContainer>

      {blockedConfirm.show && (
        <ConfirmModal
          icon="⚠️"
          title="차단 사용자 포함"
          message={`참여자 중에 차단한 사용자가 있습니다.\n\n차단한 사용자: ${blockedConfirm.blockedNames}\n\n이 방에 참여하시겠습니까?\n(참여하면 이 방에서는 서로 대화할 수 있습니다)`}
          confirmText="참여"
          cancelText="취소"
          onConfirm={confirmJoinWithBlocked}
          onCancel={() => setBlockedConfirm({ show: false, blockedNames: '' })}
        />
      )}
    </ModalOverlay>
  );
};

export default JoinGroupModal;
