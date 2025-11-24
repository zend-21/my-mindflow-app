// 본인인증 모달
import { useState } from 'react';
import styled from 'styled-components';
import { X, Shield, Phone, CreditCard, CheckCircle } from 'lucide-react';
import { verifyPhone, saveVerification } from '../../services/verificationService';

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
  z-index: 10002;
  padding: 20px;
`;

const Modal = styled.div`
  background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
  border-radius: 16px;
  width: 100%;
  max-width: 450px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
`;

const Header = styled.div`
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 700;
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
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
  }
`;

const Content = styled.div`
  padding: 24px;
`;

const Description = styled.p`
  font-size: 14px;
  color: #888;
  line-height: 1.6;
  margin: 0 0 24px 0;
`;

const MethodSelector = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
`;

const MethodButton = styled.button`
  background: ${props => props.$active ? 'rgba(74, 144, 226, 0.15)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.$active ? '#4a90e2' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.$active ? '#4a90e2' : '#ffffff'};
  padding: 16px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
  font-size: 15px;
  font-weight: 600;

  &:hover {
    background: rgba(74, 144, 226, 0.1);
    border-color: #4a90e2;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MethodIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.$active ? 'rgba(74, 144, 226, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const MethodInfo = styled.div`
  flex: 1;
  text-align: left;
`;

const MethodName = styled.div`
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const MethodDesc = styled.div`
  font-size: 12px;
  color: #888;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #b0b0b0;
`;

const Input = styled.input`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffffff;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;

  &::placeholder {
    color: #666;
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

const Notice = styled.div`
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 8px;
  padding: 12px;
  font-size: 12px;
  color: #ffc107;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const Button = styled.button`
  flex: 1;
  padding: 14px;
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
  color: #888;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
  }
`;

const SubmitButton = styled(Button)`
  background: linear-gradient(135deg, #4a90e2, #357abd);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(74, 144, 226, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const SuccessMessage = styled.div`
  text-align: center;
  padding: 40px 20px;
`;

const SuccessIcon = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2ed573, #38f9d7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  box-shadow: 0 8px 24px rgba(46, 213, 115, 0.4);
`;

const SuccessTitle = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 8px;
`;

const SuccessDesc = styled.div`
  font-size: 14px;
  color: #888;
  line-height: 1.6;
`;

const VerificationModal = ({ onClose, onVerified, showToast }) => {
  const [method, setMethod] = useState('phone');
  const [formData, setFormData] = useState({
    phoneNumber: '',
    name: '',
    birthYear: ''
  });
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.phoneNumber || !formData.name || !formData.birthYear) {
      showToast?.('모든 정보를 입력해주세요');
      return;
    }

    // 전화번호 형식 검증
    const phoneRegex = /^010\d{8}$/;
    if (!phoneRegex.test(formData.phoneNumber.replace(/-/g, ''))) {
      showToast?.('올바른 전화번호를 입력해주세요 (010-XXXX-XXXX)');
      return;
    }

    // 생년 검증
    const currentYear = new Date().getFullYear();
    const year = parseInt(formData.birthYear);
    if (year < 1900 || year > currentYear) {
      showToast?.('올바른 생년을 입력해주세요');
      return;
    }

    setLoading(true);

    try {
      // 본인인증 API 호출 (더미)
      const result = await verifyPhone(
        formData.phoneNumber,
        formData.name,
        formData.birthYear
      );

      if (result.success) {
        // Firebase에 인증 정보 저장
        const userId = localStorage.getItem('firebaseUserId');
        await saveVerification(userId, {
          method: 'phone',
          name: formData.name,
          birthYear: formData.birthYear
        });

        setVerified(true);
        showToast?.('본인인증이 완료되었습니다');

        // 2초 후 모달 닫기
        setTimeout(() => {
          onVerified?.();
          onClose();
        }, 2000);
      } else {
        showToast?.(result.error || '본인인증에 실패했습니다');
      }
    } catch (error) {
      console.error('본인인증 오류:', error);
      showToast?.('본인인증 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (verified) {
    return (
      <Overlay onClick={(e) => e.target === e.currentTarget && onClose()}>
        <Modal>
          <SuccessMessage>
            <SuccessIcon>
              <CheckCircle size={48} />
            </SuccessIcon>
            <SuccessTitle>본인인증 완료</SuccessTitle>
            <SuccessDesc>
              본인인증이 성공적으로 완료되었습니다.<br />
              인증 뱃지가 부여되었습니다.
            </SuccessDesc>
          </SuccessMessage>
        </Modal>
      </Overlay>
    );
  }

  return (
    <Overlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <Modal>
        <Header>
          <Title>
            <Shield size={24} />
            본인인증
          </Title>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </Header>

        <Content>
          <Description>
            본인인증을 완료하면 인증 뱃지가 부여되며, 더욱 안전한 서비스 이용이 가능합니다.
          </Description>

          <MethodSelector>
            <MethodButton
              $active={method === 'phone'}
              onClick={() => setMethod('phone')}
              type="button"
            >
              <MethodIcon $active={method === 'phone'}>
                <Phone size={20} />
              </MethodIcon>
              <MethodInfo>
                <MethodName>휴대폰 인증</MethodName>
                <MethodDesc>휴대폰 번호로 본인인증</MethodDesc>
              </MethodInfo>
            </MethodButton>

            <MethodButton
              $active={method === 'ipin'}
              onClick={() => setMethod('ipin')}
              type="button"
              disabled
            >
              <MethodIcon $active={method === 'ipin'}>
                <CreditCard size={20} />
              </MethodIcon>
              <MethodInfo>
                <MethodName>아이핀 인증</MethodName>
                <MethodDesc>준비 중입니다</MethodDesc>
              </MethodInfo>
            </MethodButton>
          </MethodSelector>

          {method === 'phone' && (
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label>이름</Label>
                <Input
                  type="text"
                  name="name"
                  placeholder="홍길동"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>휴대폰 번호</Label>
                <Input
                  type="tel"
                  name="phoneNumber"
                  placeholder="010-1234-5678"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>생년 (4자리)</Label>
                <Input
                  type="number"
                  name="birthYear"
                  placeholder="1990"
                  value={formData.birthYear}
                  onChange={handleInputChange}
                  disabled={loading}
                  min="1900"
                  max={new Date().getFullYear()}
                  required
                />
              </FormGroup>

              <Notice>
                ⚠️ 본인인증은 1회만 가능하며, 입력하신 정보는 암호화되어 안전하게 저장됩니다.
                실제 서비스에서는 NICE, KCB 등 공인 인증기관을 통해 인증됩니다.
              </Notice>

              <ButtonGroup>
                <CancelButton type="button" onClick={onClose} disabled={loading}>
                  취소
                </CancelButton>
                <SubmitButton type="submit" disabled={loading}>
                  {loading ? '인증 중...' : '인증하기'}
                </SubmitButton>
              </ButtonGroup>
            </Form>
          )}
        </Content>
      </Modal>
    </Overlay>
  );
};

export default VerificationModal;
