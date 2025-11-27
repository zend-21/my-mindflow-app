// src/components/secret/PinChangeModal.jsx
// PIN 변경 모달 컴포넌트

import React, { useState } from 'react';
import styled from 'styled-components';
import Portal from '../Portal';

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 20100;
    display: flex;
    justify-content: center;
    align-items: center;
    touch-action: none;
    overscroll-behavior: contain;
`;

const Modal = styled.div`
    background: linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%);
    border-radius: 16px;
    width: 90vw;
    max-width: 400px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Header = styled.div`
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const Title = styled.h2`
    font-size: 20px;
    font-weight: 600;
    color: #ffffff;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    font-size: 28px;
    color: #ffffff;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        opacity: 1;
    }
`;

const Body = styled.div`
    padding: 24px;
    overflow-y: auto;
    flex: 1;

    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(240, 147, 251, 0.3);
        border-radius: 4px;
    }
`;

const FormGroup = styled.div`
    margin-bottom: 20px;
`;

const Label = styled.label`
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #d0d0d0;
    margin-bottom: 8px;
`;

const InputWrapper = styled.div`
    position: relative;
    width: 100%;
`;

const Input = styled.input`
    width: 100%;
    padding: 12px 16px;
    padding-right: ${props => props.$hasValue ? '40px' : '16px'};
    border-radius: 8px;
    border: 1px solid ${props => props.$error ? 'rgba(255, 107, 107, 0.5)' : 'rgba(255, 255, 255, 0.15)'};
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
    font-size: 16px;
    transition: all 0.2s;
    box-sizing: border-box;
    letter-spacing: 0.5em;
    text-align: center;

    &:focus {
        outline: none;
        border-color: ${props => props.$error ? 'rgba(255, 107, 107, 0.8)' : 'rgba(240, 147, 251, 0.5)'};
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 0 0 3px ${props => props.$error ? 'rgba(255, 107, 107, 0.1)' : 'rgba(240, 147, 251, 0.1)'};
    }

    &::placeholder {
        letter-spacing: normal;
        text-align: left;
    }

    /* 숫자 입력 전용 */
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
`;

const ClearButton = styled.button`
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: #ffffff;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    opacity: ${props => props.$visible ? '1' : '0'};
    pointer-events: ${props => props.$visible ? 'auto' : 'none'};

    &:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-50%) scale(1.1);
    }

    &:active {
        transform: translateY(-50%) scale(0.95);
    }
`;

const ErrorText = styled.div`
    color: #ff6b6b;
    font-size: 13px;
    margin-top: 6px;
    line-height: 1.4;
`;

const HelperText = styled.div`
    color: #808080;
    font-size: 12px;
    margin-top: 6px;
    line-height: 1.4;
`;

const WarningBox = styled.div`
    background: rgba(255, 193, 7, 0.1);
    border: 1px solid rgba(255, 193, 7, 0.3);
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
`;

const WarningIcon = styled.div`
    font-size: 20px;
    flex-shrink: 0;
`;

const WarningText = styled.div`
    color: #ffc107;
    font-size: 13px;
    line-height: 1.5;
`;

const Footer = styled.div`
    padding: 16px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    gap: 12px;
    justify-content: flex-end;
`;

const Button = styled.button`
    padding: 10px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;

    ${props => props.$primary ? `
        background: linear-gradient(135deg, rgba(240, 147, 251, 0.8), rgba(245, 87, 108, 0.8));
        color: white;
        border: 1px solid rgba(240, 147, 251, 0.5);

        &:hover {
            background: linear-gradient(135deg, rgba(240, 147, 251, 0.9), rgba(245, 87, 108, 0.9));
            box-shadow: 0 4px 12px rgba(240, 147, 251, 0.3);
        }

        &:active {
            transform: translateY(1px);
        }

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    ` : `
        background: rgba(255, 255, 255, 0.1);
        color: #d0d0d0;
        border: 1px solid rgba(255, 255, 255, 0.2);

        &:hover {
            background: rgba(255, 255, 255, 0.15);
        }

        &:active {
            transform: translateY(1px);
        }
    `}
`;

const PinChangeModal = ({ onClose, onConfirm, pinLength = 6, forcedMode = false }) => {
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [errors, setErrors] = useState({});

    const handleSubmit = async () => {
        const newErrors = {};

        // 유효성 검사
        if (!currentPin) {
            newErrors.currentPin = '기존 PIN을 입력해주세요.';
        } else if (currentPin.length !== pinLength) {
            newErrors.currentPin = `PIN은 ${pinLength}자리 숫자여야 합니다.`;
        } else if (!/^\d+$/.test(currentPin)) {
            newErrors.currentPin = 'PIN은 숫자만 입력 가능합니다.';
        }

        if (!newPin) {
            newErrors.newPin = '새 PIN을 입력해주세요.';
        } else if (newPin.length !== pinLength) {
            newErrors.newPin = `PIN은 ${pinLength}자리여야 합니다.`;
        } else if (!/^\d+$/.test(newPin)) {
            newErrors.newPin = 'PIN은 숫자만 입력 가능합니다.';
        }

        if (!confirmPin) {
            newErrors.confirmPin = '새 PIN을 다시 입력해주세요.';
        } else if (confirmPin !== newPin) {
            newErrors.confirmPin = '새 PIN이 일치하지 않습니다.';
        }

        if (currentPin === newPin) {
            newErrors.newPin = '기존 PIN과 다른 PIN을 입력해주세요.';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            // onConfirm이 Promise를 반환할 수 있으므로 await
            const result = await onConfirm({ currentPin, newPin });

            // 서버 측 에러 처리 (예: 기존 PIN이 틀림)
            if (result && !result.success) {
                setErrors({ currentPin: result.message });
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <Portal>
            <Overlay onClick={forcedMode ? null : onClose}>
                <Modal onClick={(e) => e.stopPropagation()}>
                    <Header>
                        <Title>{forcedMode ? 'PIN 재설정 (필수)' : 'PIN 변경'}</Title>
                        {!forcedMode && <CloseButton onClick={onClose}>×</CloseButton>}
                    </Header>

                    <Body>
                        {forcedMode && (
                            <WarningBox>
                                <WarningIcon>⚠️</WarningIcon>
                                <WarningText>
                                    임시 PIN으로 로그인하셨습니다.<br/>
                                    보안을 위해 새로운 PIN을 설정해주세요.
                                </WarningText>
                            </WarningBox>
                        )}

                        <FormGroup>
                            <Label>기존 PIN 번호 입력</Label>
                            <InputWrapper>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={pinLength}
                                    value={currentPin}
                                    $hasValue={currentPin.length > 0}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, '').slice(0, pinLength);
                                        setCurrentPin(value);
                                        setErrors(prev => ({ ...prev, currentPin: '' }));
                                    }}
                                    onKeyPress={handleKeyPress}
                                    placeholder={`기존 PIN (${pinLength}자리)`}
                                    $error={errors.currentPin}
                                />
                                <ClearButton
                                    type="button"
                                    $visible={currentPin.length > 0}
                                    onClick={() => {
                                        setCurrentPin('');
                                        setErrors(prev => ({ ...prev, currentPin: '' }));
                                    }}
                                >
                                    ×
                                </ClearButton>
                            </InputWrapper>
                            {errors.currentPin && <ErrorText>{errors.currentPin}</ErrorText>}
                        </FormGroup>

                        <FormGroup>
                            <Label>새 PIN 번호 입력</Label>
                            <InputWrapper>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={pinLength}
                                    value={newPin}
                                    $hasValue={newPin.length > 0}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, '').slice(0, pinLength);
                                        setNewPin(value);
                                        setErrors(prev => ({ ...prev, newPin: '' }));
                                    }}
                                    onKeyPress={handleKeyPress}
                                    placeholder={`새 PIN (${pinLength}자리)`}
                                    $error={errors.newPin}
                                />
                                <ClearButton
                                    type="button"
                                    $visible={newPin.length > 0}
                                    onClick={() => {
                                        setNewPin('');
                                        setErrors(prev => ({ ...prev, newPin: '' }));
                                    }}
                                >
                                    ×
                                </ClearButton>
                            </InputWrapper>
                            {errors.newPin && <ErrorText>{errors.newPin}</ErrorText>}
                            {!errors.newPin && <HelperText>숫자 {pinLength}자리를 입력해주세요</HelperText>}
                        </FormGroup>

                        <FormGroup>
                            <Label>새 PIN 번호 입력 (확인용)</Label>
                            <InputWrapper>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={pinLength}
                                    value={confirmPin}
                                    $hasValue={confirmPin.length > 0}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, '').slice(0, pinLength);
                                        setConfirmPin(value);
                                        setErrors(prev => ({ ...prev, confirmPin: '' }));
                                    }}
                                    onKeyPress={handleKeyPress}
                                    placeholder={`새 PIN 재입력 (${pinLength}자리)`}
                                    $error={errors.confirmPin}
                                />
                                <ClearButton
                                    type="button"
                                    $visible={confirmPin.length > 0}
                                    onClick={() => {
                                        setConfirmPin('');
                                        setErrors(prev => ({ ...prev, confirmPin: '' }));
                                    }}
                                >
                                    ×
                                </ClearButton>
                            </InputWrapper>
                            {errors.confirmPin && <ErrorText>{errors.confirmPin}</ErrorText>}
                        </FormGroup>
                    </Body>

                    <Footer>
                        {!forcedMode && <Button onClick={onClose}>취소</Button>}
                        <Button $primary onClick={handleSubmit}>
                            {forcedMode ? 'PIN 재설정' : 'PIN 변경'}
                        </Button>
                    </Footer>
                </Modal>
            </Overlay>
        </Portal>
    );
};

export default PinChangeModal;
