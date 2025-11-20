// 고유 ID 변경 모달

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Check, AlertCircle } from 'lucide-react';
import {
  validateUniqueId,
  checkUniqueIdAvailable,
  setUserUniqueId
} from '../../services/userIdService';

const ChangeUniqueIdModal = ({ isOpen, onClose, currentId, onSuccess }) => {
  const [newId, setNewId] = useState('');
  const [validation, setValidation] = useState({ valid: false, message: '' });
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewId('');
      setValidation({ valid: false, message: '' });
      setAvailable(null);
    }
  }, [isOpen]);

  const handleInputChange = async (value) => {
    const lowerValue = value.toLowerCase();
    setNewId(lowerValue);

    // 유효성 검사
    const result = validateUniqueId(lowerValue);
    setValidation(result);

    // 유효하면 중복 체크
    if (result.valid && lowerValue !== currentId) {
      setChecking(true);
      try {
        const isAvailable = await checkUniqueIdAvailable(lowerValue);
        setAvailable(isAvailable);
      } catch (err) {
        console.error(err);
      } finally {
        setChecking(false);
      }
    } else {
      setAvailable(null);
    }
  };

  const handleSave = async () => {
    if (!validation.valid || available === false) return;

    try {
      setSaving(true);
      await setUserUniqueId(newId);
      alert('고유 ID가 변경되었습니다!');
      onSuccess(newId);
      onClose();
    } catch (err) {
      alert('변경 실패: ' + err.message);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = () => {
    if (!newId) return 'rgba(255, 255, 255, 0.3)';
    if (!validation.valid) return '#ff6b6b';
    if (checking) return '#ffa500';
    if (available === false) return '#ff6b6b';
    if (available === true) return '#5ebe26';
    return 'rgba(255, 255, 255, 0.3)';
  };

  const getStatusMessage = () => {
    if (!newId) return '새로운 ID를 입력하세요';
    if (!validation.valid) return validation.message;
    if (checking) return '중복 확인 중...';
    if (available === false) return '이미 사용 중인 ID입니다';
    if (available === true) return '✅ 사용 가능한 ID입니다!';
    return '';
  };

  if (!isOpen) return null;

  const canSave = validation.valid && available === true && !saving;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>
          <Title>고유 ID 변경</Title>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </Header>

        <Content>
          <InfoBox>
            <InfoIcon>💡</InfoIcon>
            <InfoText>
              <strong>기억하기 쉬운 ID</strong>로 변경하세요<br/>
              친구들이 이 ID로 당신을 찾을 수 있어요
            </InfoText>
          </InfoBox>

          <Section>
            <Label>현재 ID</Label>
            <CurrentIdBox>
              <IdPrefix>@</IdPrefix>
              <IdText>{currentId}</IdText>
            </CurrentIdBox>
          </Section>

          <Section>
            <Label>새로운 ID</Label>
            <InputWrapper statusColor={getStatusColor()}>
              <IdPrefix>@</IdPrefix>
              <Input
                value={newId}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="예: hong_gildong"
                maxLength={20}
              />
              {checking && <Spinner>⏳</Spinner>}
              {available === true && <CheckIcon><Check size={20} /></CheckIcon>}
              {available === false && <ErrorIcon><AlertCircle size={20} /></ErrorIcon>}
            </InputWrapper>
            <StatusMessage color={getStatusColor()}>
              {getStatusMessage()}
            </StatusMessage>
          </Section>

          <RulesBox>
            <RulesTitle>ID 규칙</RulesTitle>
            <RulesList>
              <RuleItem valid={newId.length >= 3 && newId.length <= 20}>
                <RuleIcon>•</RuleIcon>
                3~20자
              </RuleItem>
              <RuleItem valid={/^[a-z0-9_]+$/.test(newId)}>
                <RuleIcon>•</RuleIcon>
                영문 소문자, 숫자, 언더바(_)만 사용
              </RuleItem>
              <RuleItem valid={/^[a-z]/.test(newId)}>
                <RuleIcon>•</RuleIcon>
                첫 글자는 영문
              </RuleItem>
              <RuleItem valid={available === true}>
                <RuleIcon>•</RuleIcon>
                중복되지 않는 ID
              </RuleItem>
            </RulesList>
          </RulesBox>

          <ExampleBox>
            <ExampleTitle>예시</ExampleTitle>
            <Examples>
              <Example onClick={() => handleInputChange('hong_gildong')}>
                hong_gildong
              </Example>
              <Example onClick={() => handleInputChange('john_kim')}>
                john_kim
              </Example>
              <Example onClick={() => handleInputChange('mindflow_user')}>
                mindflow_user
              </Example>
            </Examples>
          </ExampleBox>
        </Content>

        <Footer>
          <CancelButton onClick={onClose}>취소</CancelButton>
          <SaveButton onClick={handleSave} disabled={!canSave}>
            {saving ? '저장 중...' : '변경하기'}
          </SaveButton>
        </Footer>
      </Modal>
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
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
`;

const Modal = styled.div`
  background: linear-gradient(135deg, #1a1d24 0%, #2d3139 100%);
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h2`
  color: white;
  font-size: 22px;
  font-weight: 700;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 8px;
  display: flex;
  transition: color 0.2s;
  &:hover { color: white; }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InfoBox = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px;
  background: rgba(94, 190, 38, 0.1);
  border: 1px solid rgba(94, 190, 38, 0.3);
  border-radius: 12px;
`;

const InfoIcon = styled.div`
  font-size: 24px;
`;

const InfoText = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 1.5;
  strong { color: #5ebe26; }
`;

const Section = styled.div``;

const Label = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const CurrentIdBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
`;

const IdPrefix = styled.span`
  color: rgba(255, 255, 255, 0.5);
  font-size: 18px;
  font-weight: 700;
`;

const IdText = styled.span`
  color: white;
  font-size: 16px;
  font-weight: 600;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid ${props => props.statusColor};
  border-radius: 12px;
  transition: border-color 0.3s;
`;

const Input = styled.input`
  flex: 1;
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  font-weight: 600;
  outline: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const Spinner = styled.span`
  font-size: 18px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const CheckIcon = styled.span`
  color: #5ebe26;
  display: flex;
  align-items: center;
`;

const ErrorIcon = styled.span`
  color: #ff6b6b;
  display: flex;
  align-items: center;
`;

const StatusMessage = styled.div`
  color: ${props => props.color};
  font-size: 13px;
  margin-top: 8px;
  font-weight: 600;
`;

const RulesBox = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 16px;
`;

const RulesTitle = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 12px;
`;

const RulesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const RuleItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${props => props.valid ? '#5ebe26' : 'rgba(255, 255, 255, 0.5)'};
  font-size: 13px;
  transition: color 0.2s;
`;

const RuleIcon = styled.span`
  font-size: 18px;
`;

const ExampleBox = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 16px;
`;

const ExampleTitle = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 12px;
`;

const Examples = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Example = styled.button`
  padding: 8px 14px;
  background: rgba(94, 190, 38, 0.1);
  border: 1px solid rgba(94, 190, 38, 0.3);
  border-radius: 8px;
  color: #5ebe26;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(94, 190, 38, 0.2);
  }
`;

const Footer = styled.div`
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const SaveButton = styled.button`
  flex: 2;
  padding: 14px;
  background: ${props => props.disabled ? 'rgba(94, 190, 38, 0.3)' : '#5ebe26'};
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 15px;
  font-weight: 700;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #4fa01f;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(94, 190, 38, 0.3);
  }
`;

export default ChangeUniqueIdModal;
