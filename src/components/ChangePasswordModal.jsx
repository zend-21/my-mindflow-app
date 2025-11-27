import React, { useState } from 'react';
import styled from 'styled-components';
import { X, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { changeMasterPassword } from '../services/keyManagementService';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 32px;
  border-radius: 16px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: bold;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 4px;

  &:hover {
    color: #333;
  }
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #555;
  margin-bottom: 8px;
`;

const PasswordInputWrapper = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 40px 12px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #007bff;
  }

  &.error {
    border-color: #dc3545;
  }
`;

const TogglePasswordButton = styled.button`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 4px;

  &:hover {
    color: #333;
  }
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #dc3545;
  font-size: 13px;
  margin-top: 8px;
`;

const SuccessMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #28a745;
  font-size: 13px;
  margin-top: 8px;
`;

const PasswordHint = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 6px;
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
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &.primary {
    background: #007bff;
    color: white;

    &:hover:not(:disabled) {
      background: #0056b3;
    }

    &:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  }

  &.secondary {
    background: #f0f0f0;
    color: #333;

    &:hover {
      background: #e0e0e0;
    }
  }
`;

const ChangePasswordModal = ({ onClose, onSuccess }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setSuccess(false);

    // 유효성 검사
    if (!currentPassword) {
      setError('현재 비밀번호를 입력하세요.');
      return;
    }

    if (!newPassword) {
      setError('새 비밀번호를 입력하세요.');
      return;
    }

    if (newPassword.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (currentPassword === newPassword) {
      setError('새 비밀번호는 현재 비밀번호와 달라야 합니다.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await changeMasterPassword(currentPassword, newPassword);

      if (result) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      } else {
        setError('현재 비밀번호가 올바르지 않습니다.');
      }
    } catch (err) {
      console.error('비밀번호 변경 오류:', err);
      setError('비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <Title>
            <Lock size={24} />
            비밀번호 변경
          </Title>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </ModalHeader>

        <InputGroup>
          <Label>현재 비밀번호</Label>
          <PasswordInputWrapper>
            <Input
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="현재 비밀번호를 입력하세요"
              className={error && !currentPassword ? 'error' : ''}
            />
            <TogglePasswordButton
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              type="button"
            >
              {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </TogglePasswordButton>
          </PasswordInputWrapper>
        </InputGroup>

        <InputGroup>
          <Label>새 비밀번호</Label>
          <PasswordInputWrapper>
            <Input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새 비밀번호를 입력하세요 (최소 8자)"
              className={error && newPassword.length < 8 ? 'error' : ''}
            />
            <TogglePasswordButton
              onClick={() => setShowNewPassword(!showNewPassword)}
              type="button"
            >
              {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </TogglePasswordButton>
          </PasswordInputWrapper>
          <PasswordHint>최소 8자 이상의 비밀번호를 사용하세요</PasswordHint>
        </InputGroup>

        <InputGroup>
          <Label>새 비밀번호 확인</Label>
          <PasswordInputWrapper>
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="새 비밀번호를 다시 입력하세요"
              className={error && newPassword !== confirmPassword ? 'error' : ''}
            />
            <TogglePasswordButton
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              type="button"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </TogglePasswordButton>
          </PasswordInputWrapper>
        </InputGroup>

        {error && (
          <ErrorMessage>
            <AlertCircle size={16} />
            {error}
          </ErrorMessage>
        )}

        {success && (
          <SuccessMessage>
            <CheckCircle size={16} />
            비밀번호가 성공적으로 변경되었습니다!
          </SuccessMessage>
        )}

        <ButtonGroup>
          <Button className="secondary" onClick={onClose} disabled={isLoading}>
            취소
          </Button>
          <Button
            className="primary"
            onClick={handleSubmit}
            disabled={isLoading || success}
          >
            {isLoading ? '변경 중...' : success ? '완료!' : '비밀번호 변경'}
          </Button>
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ChangePasswordModal;
