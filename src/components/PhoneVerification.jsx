// 📱 휴대폰 인증 컴포넌트
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Phone, Lock, ArrowRight, RefreshCw } from 'lucide-react';
import { sendVerificationCode, verifyCode, formatPhoneNumber } from '../services/authService';

const PhoneVerification = ({ onVerified, onCancel, userInfo }) => {
  const [step, setStep] = useState('phone'); // 'phone' | 'code'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // 재발송 타이머
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // 휴대폰 번호 입력 처리
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPhoneNumber(value);
    setError('');
  };

  // 인증번호 입력 처리
  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '').substring(0, 6);
    setVerificationCode(value);
    setError('');
  };

  // 인증 코드 발송
  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('올바른 휴대폰 번호를 입력해주세요');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formatted = formatPhoneNumber(phoneNumber);
      console.log('🔐 인증 코드 발송 시도:', formatted);

      const result = await sendVerificationCode(formatted);
      setConfirmationResult(result);
      setStep('code');
      setResendTimer(60); // 60초 타이머 시작

      console.log('✅ 인증 코드 발송 완료');
    } catch (err) {
      console.error('❌ 인증 코드 발송 실패:', err);

      if (err.code === 'auth/invalid-phone-number') {
        setError('유효하지 않은 휴대폰 번호입니다');
      } else if (err.code === 'auth/too-many-requests') {
        setError('너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요');
      } else if (err.code === 'auth/quota-exceeded') {
        setError('일일 SMS 발송 한도를 초과했습니다');
      } else {
        setError('인증 코드 발송에 실패했습니다. 다시 시도해주세요');
      }
    } finally {
      setLoading(false);
    }
  };

  // 인증 코드 재발송
  const handleResendCode = async () => {
    if (resendTimer > 0) return;

    setVerificationCode('');
    setError('');
    await handleSendCode();
  };

  // 인증 코드 확인
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('6자리 인증번호를 입력해주세요');
      return;
    }

    if (!confirmationResult) {
      setError('인증 세션이 만료되었습니다. 다시 시도해주세요');
      setStep('phone');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔐 인증 코드 확인 시도');

      const result = await verifyCode(confirmationResult, verificationCode);
      const formatted = formatPhoneNumber(phoneNumber);

      console.log('✅ 휴대폰 인증 성공');

      // 부모 컴포넌트로 인증 결과 전달
      onVerified({
        phoneNumber: formatted,
        firebaseUID: result.user.uid,
        userInfo
      });
    } catch (err) {
      console.error('❌ 인증 코드 확인 실패:', err);

      if (err.code === 'auth/invalid-verification-code') {
        setError('잘못된 인증번호입니다');
      } else if (err.code === 'auth/code-expired') {
        setError('인증번호가 만료되었습니다. 다시 발송해주세요');
        setStep('phone');
      } else {
        setError('인증에 실패했습니다. 다시 시도해주세요');
      }
    } finally {
      setLoading(false);
    }
  };

  // Enter 키 처리
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (step === 'phone') {
        handleSendCode();
      } else {
        handleVerifyCode();
      }
    }
  };

  return (
    <Overlay>
      <Container>
        <Header>
          <Title>휴대폰 인증</Title>
          <Description>
            {step === 'phone'
              ? '계정 보안을 위해 휴대폰 번호를 인증해주세요'
              : '인증번호를 입력해주세요'}
          </Description>
        </Header>

        <Content>
          {step === 'phone' ? (
            <>
              <InputGroup>
                <InputLabel>
                  <Phone size={16} />
                  휴대폰 번호
                </InputLabel>
                <PhoneInputWrapper>
                  <CountryCode>🇰🇷 +82</CountryCode>
                  <PhoneInput
                    type="tel"
                    placeholder="01012345678"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                    maxLength={11}
                    autoFocus
                  />
                </PhoneInputWrapper>
                <InputHint>하이픈(-) 없이 입력해주세요</InputHint>
              </InputGroup>

              {error && <ErrorMessage>{error}</ErrorMessage>}

              <ActionButtons>
                <CancelButton onClick={onCancel} disabled={loading}>
                  취소
                </CancelButton>
                <SubmitButton onClick={handleSendCode} disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="spin" />
                      발송 중...
                    </>
                  ) : (
                    <>
                      인증번호 받기
                      <ArrowRight size={18} />
                    </>
                  )}
                </SubmitButton>
              </ActionButtons>
            </>
          ) : (
            <>
              <InputGroup>
                <InputLabel>
                  <Lock size={16} />
                  인증번호
                </InputLabel>
                <CodeInput
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={handleCodeChange}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  maxLength={6}
                  autoFocus
                />
                <InputHint>
                  {phoneNumber}로 발송된 6자리 인증번호를 입력하세요
                </InputHint>
              </InputGroup>

              <ResendSection>
                {resendTimer > 0 ? (
                  <ResendTimer>
                    인증번호 재발송 가능 시간: {resendTimer}초
                  </ResendTimer>
                ) : (
                  <ResendButton onClick={handleResendCode} disabled={loading}>
                    <RefreshCw size={14} />
                    인증번호 재발송
                  </ResendButton>
                )}
              </ResendSection>

              {error && <ErrorMessage>{error}</ErrorMessage>}

              <ActionButtons>
                <CancelButton
                  onClick={() => {
                    setStep('phone');
                    setVerificationCode('');
                    setError('');
                  }}
                  disabled={loading}
                >
                  이전
                </CancelButton>
                <SubmitButton onClick={handleVerifyCode} disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="spin" />
                      확인 중...
                    </>
                  ) : (
                    <>
                      인증 완료
                      <ArrowRight size={18} />
                    </>
                  )}
                </SubmitButton>
              </ActionButtons>
            </>
          )}
        </Content>

        {/* reCAPTCHA 컨테이너 */}
        <div id="recaptcha-container"></div>
      </Container>
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
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000;
  backdrop-filter: blur(8px);
  padding: 20px;
`;

const Container = styled.div`
  background: linear-gradient(180deg, #2a2d35 0%, #1f2128 100%);
  border-radius: 20px;
  width: 100%;
  max-width: 440px;
  padding: 32px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 32px;
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 12px 0;
`;

const Description = styled.p`
  font-size: 14px;
  color: #888;
  line-height: 1.6;
  margin: 0;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InputLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PhoneInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0 16px;
  transition: all 0.2s;

  &:focus-within {
    border-color: #4a90e2;
    background: rgba(255, 255, 255, 0.08);
  }
`;

const CountryCode = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
  white-space: nowrap;
  padding: 14px 0;
`;

const PhoneInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 16px;
  padding: 14px 0;

  &::placeholder {
    color: #666;
  }

  &:focus {
    outline: none;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CodeInput = styled.input`
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #ffffff;
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  letter-spacing: 8px;
  padding: 16px;
  transition: all 0.2s;

  &::placeholder {
    color: #666;
    letter-spacing: normal;
  }

  &:focus {
    outline: none;
    border-color: #4a90e2;
    background: rgba(255, 255, 255, 0.08);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const InputHint = styled.div`
  font-size: 12px;
  color: #666;
  line-height: 1.4;
`;

const ResendSection = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 0;
`;

const ResendTimer = styled.div`
  font-size: 13px;
  color: #888;
`;

const ResendButton = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #4a90e2;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: rgba(74, 144, 226, 0.1);
    border-color: #4a90e2;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 12px;
  color: #ff6b6b;
  font-size: 14px;
  padding: 12px 16px;
  text-align: center;
`;

const ActionButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 12px;
  margin-top: 12px;
`;

const CancelButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #888;
  font-size: 15px;
  font-weight: 600;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    color: #e0e0e0;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled.button`
  background: linear-gradient(135deg, #4a90e2, #357abd);
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  padding: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #357abd, #2a5d8f);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

export default PhoneVerification;
