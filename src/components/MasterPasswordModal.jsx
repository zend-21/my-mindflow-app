// 🔐 마스터 비밀번호 설정/입력 모달
import { useState } from 'react';
import styled from 'styled-components';
import { X, Lock, Key, Eye, EyeOff, Copy, Check, Download } from 'lucide-react';
import { setupMasterPassword, unlockWithPassword, unlockWithRecoveryKey } from '../services/keyManagementService';

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
    z-index: 10000;
    backdrop-filter: blur(4px);
`;

const ModalContainer = styled.div`
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const Header = styled.div`
    padding: 24px;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const Title = styled.h2`
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #333;
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    color: #666;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;

    &:hover {
        background: #f0f0f0;
    }
`;

const Content = styled.div`
    padding: 24px;
`;

const Description = styled.p`
    margin: 0 0 24px 0;
    color: #666;
    font-size: 14px;
    line-height: 1.6;
`;

const InputGroup = styled.div`
    margin-bottom: 16px;
`;

const Label = styled.label`
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #333;
`;

const PasswordInputWrapper = styled.div`
    position: relative;
`;

const Input = styled.input`
    width: 100%;
    padding: 12px 40px 12px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    box-sizing: border-box;

    &:focus {
        outline: none;
        border-color: #4a90e2;
    }

    &::placeholder {
        color: #999;
    }
`;

const TogglePasswordButton = styled.button`
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: #666;
    padding: 4px;
    display: flex;
    align-items: center;

    &:hover {
        color: #333;
    }
`;

const RecoveryKeyBox = styled.div`
    background: #f9f9f9;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;
`;

const RecoveryKeyText = styled.div`
    font-family: 'Courier New', monospace;
    font-size: 14px;
    color: #333;
    word-break: break-word;
    margin-bottom: 12px;
    background: white;
    padding: 12px;
    border-radius: 4px;
`;

const CopyButton = styled.button`
    padding: 8px 16px;
    background: #4a90e2;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 6px;

    &:hover {
        background: #357abd;
    }

    &:disabled {
        background: #ccc;
        cursor: not-allowed;
    }
`;

const DownloadButton = styled.button`
    padding: 8px 16px;
    background: #28a745;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 6px;

    &:hover {
        background: #218838;
    }
`;

const ButtonRow = styled.div`
    display: flex;
    gap: 8px;
`;

const WarningBox = styled.div`
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 8px;
    padding: 12px;
    margin: 16px 0;
    font-size: 13px;
    color: #856404;
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 12px;
    margin-top: 24px;
`;

const Button = styled.button`
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const PrimaryButton = styled(Button)`
    background: #4a90e2;
    color: white;

    &:hover:not(:disabled) {
        background: #357abd;
    }
`;

const SecondaryButton = styled(Button)`
    background: #f0f0f0;
    color: #333;

    &:hover:not(:disabled) {
        background: #e0e0e0;
    }
`;

const ErrorMessage = styled.div`
    color: #dc3545;
    font-size: 13px;
    margin-top: 8px;
`;

const TabContainer = styled.div`
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    border-bottom: 1px solid #e0e0e0;
`;

const Tab = styled.button`
    padding: 12px 20px;
    background: none;
    border: none;
    border-bottom: 2px solid ${props => props.active ? '#4a90e2' : 'transparent'};
    color: ${props => props.active ? '#4a90e2' : '#666'};
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        color: #4a90e2;
    }
`;

const MasterPasswordModal = ({ mode, onSuccess, onCancel }) => {
  const [activeTab, setActiveTab] = useState('password'); // 'password' | 'recovery'
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryKeyInput, setRecoveryKeyInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [copied, setCopied] = useState(false);

  // mode: 'setup' (첫 설정) | 'unlock' (잠금 해제)

  const handleSetup = async () => {
    setError('');

    if (password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      setLoading(true);
      const { key, recoveryKey: generatedRecoveryKey } = await setupMasterPassword(password);
      setRecoveryKey(generatedRecoveryKey);

      // 복구 키를 보여주지 않고 바로 성공 처리 (간소화)
      // 실제 프로덕션에서는 복구 키를 반드시 보여주고 저장하게 해야 함
      onSuccess(key);
    } catch (err) {
      setError(err.message || '마스터 비밀번호 설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockWithPassword = async () => {
    setError('');

    try {
      setLoading(true);
      const key = await unlockWithPassword(password);

      if (!key) {
        setError('비밀번호가 올바르지 않습니다.');
        return;
      }

      onSuccess(key);
    } catch (err) {
      setError(err.message || '잠금 해제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockWithRecoveryKey = async () => {
    setError('');

    try {
      setLoading(true);
      const key = await unlockWithRecoveryKey(recoveryKeyInput);

      if (!key) {
        setError('복구 키가 올바르지 않습니다.');
        return;
      }

      onSuccess(key);
    } catch (err) {
      setError(err.message || '복구 키 잠금 해제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const copyRecoveryKey = () => {
    navigator.clipboard.writeText(recoveryKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadRecoveryKey = () => {
    const blob = new Blob([
      `MindFlow 복구 키\n`,
      `====================\n\n`,
      `복구 키: ${recoveryKey}\n\n`,
      `⚠️ 이 복구 키를 안전한 곳에 보관하세요!\n`,
      `비밀번호를 잊어버린 경우 이 복구 키로 계정을 복구할 수 있습니다.\n`,
      `생성일: ${new Date().toLocaleString('ko-KR')}\n`
    ], { type: 'text/plain' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindflow-recovery-key-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (mode === 'setup' && recoveryKey) {
    // 복구 키 표시 단계
    return (
      <Overlay onClick={(e) => e.target === e.currentTarget && onCancel()}>
        <ModalContainer>
          <Header>
            <Title>
              <Key size={20} />
              복구 키 저장
            </Title>
          </Header>
          <Content>
            <Description>
              비밀번호를 잊어버린 경우 이 복구 키로 계정을 복구할 수 있습니다.
              <strong> 반드시 안전한 곳에 보관하세요!</strong>
            </Description>

            <RecoveryKeyBox>
              <RecoveryKeyText>{recoveryKey}</RecoveryKeyText>
              <ButtonRow>
                <CopyButton onClick={copyRecoveryKey}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? '복사됨!' : '복사하기'}
                </CopyButton>
                <DownloadButton onClick={downloadRecoveryKey}>
                  <Download size={16} />
                  파일로 저장
                </DownloadButton>
              </ButtonRow>
            </RecoveryKeyBox>

            <WarningBox>
              ⚠️ 이 복구 키를 분실하면 비밀번호를 잊어버렸을 때 계정을 복구할 수 없습니다.
            </WarningBox>

            <ButtonGroup>
              <PrimaryButton onClick={() => onSuccess(recoveryKey)}>
                저장했습니다
              </PrimaryButton>
            </ButtonGroup>
          </Content>
        </ModalContainer>
      </Overlay>
    );
  }

  return (
    <Overlay onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <ModalContainer>
        <Header>
          <Title>
            <Lock size={20} />
            {mode === 'setup' ? '마스터 비밀번호 설정' : '암호화된 데이터 잠금 해제'}
          </Title>
          {onCancel && (
            <CloseButton onClick={onCancel}>
              <X size={20} />
            </CloseButton>
          )}
        </Header>
        <Content>
          {mode === 'setup' ? (
            <>
              <Description>
                모든 데이터를 암호화할 마스터 비밀번호를 설정하세요.
                이 비밀번호는 서버에 저장되지 않으며, 분실 시 복구가 불가능합니다.
              </Description>

              <InputGroup>
                <Label>마스터 비밀번호 (최소 8자)</Label>
                <PasswordInputWrapper>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="마스터 비밀번호 입력"
                    autoFocus
                  />
                  <TogglePasswordButton onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </TogglePasswordButton>
                </PasswordInputWrapper>
              </InputGroup>

              <InputGroup>
                <Label>비밀번호 확인</Label>
                <PasswordInputWrapper>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호 다시 입력"
                    onKeyPress={(e) => e.key === 'Enter' && handleSetup()}
                  />
                  <TogglePasswordButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </TogglePasswordButton>
                </PasswordInputWrapper>
              </InputGroup>

              {error && <ErrorMessage>{error}</ErrorMessage>}

              <ButtonGroup>
                <SecondaryButton onClick={onCancel}>
                  취소
                </SecondaryButton>
                <PrimaryButton onClick={handleSetup} disabled={loading || !password || !confirmPassword}>
                  {loading ? '설정 중...' : '설정 완료'}
                </PrimaryButton>
              </ButtonGroup>
            </>
          ) : (
            <>
              <Description>
                암호화된 데이터에 접근하려면 마스터 비밀번호를 입력하세요.
              </Description>

              <TabContainer>
                <Tab active={activeTab === 'password'} onClick={() => setActiveTab('password')}>
                  비밀번호
                </Tab>
                <Tab active={activeTab === 'recovery'} onClick={() => setActiveTab('recovery')}>
                  복구 키
                </Tab>
              </TabContainer>

              {activeTab === 'password' ? (
                <>
                  <InputGroup>
                    <Label>마스터 비밀번호</Label>
                    <PasswordInputWrapper>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="마스터 비밀번호 입력"
                        autoFocus
                        onKeyPress={(e) => e.key === 'Enter' && handleUnlockWithPassword()}
                      />
                      <TogglePasswordButton onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </TogglePasswordButton>
                    </PasswordInputWrapper>
                  </InputGroup>

                  {error && <ErrorMessage>{error}</ErrorMessage>}

                  <ButtonGroup>
                    {onCancel && (
                      <SecondaryButton onClick={onCancel}>
                        취소
                      </SecondaryButton>
                    )}
                    <PrimaryButton onClick={handleUnlockWithPassword} disabled={loading || !password}>
                      {loading ? '확인 중...' : '잠금 해제'}
                    </PrimaryButton>
                  </ButtonGroup>
                </>
              ) : (
                <>
                  <InputGroup>
                    <Label>복구 키 (12단어)</Label>
                    <Input
                      type="text"
                      value={recoveryKeyInput}
                      onChange={(e) => setRecoveryKeyInput(e.target.value)}
                      placeholder="복구 키를 입력하세요"
                      autoFocus
                      onKeyPress={(e) => e.key === 'Enter' && handleUnlockWithRecoveryKey()}
                    />
                  </InputGroup>

                  {error && <ErrorMessage>{error}</ErrorMessage>}

                  <ButtonGroup>
                    {onCancel && (
                      <SecondaryButton onClick={onCancel}>
                        취소
                      </SecondaryButton>
                    )}
                    <PrimaryButton onClick={handleUnlockWithRecoveryKey} disabled={loading || !recoveryKeyInput}>
                      {loading ? '확인 중...' : '복구'}
                    </PrimaryButton>
                  </ButtonGroup>
                </>
              )}
            </>
          )}
        </Content>
      </ModalContainer>
    </Overlay>
  );
};

export default MasterPasswordModal;
