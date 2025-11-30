// src/components/MacroModal.jsx
// 매크로 텍스트 관리 모달

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Portal from './Portal';
import { FiCopy, FiCheck, FiEdit2 } from 'react-icons/fi';

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    z-index: 10000;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

const ModalContent = styled.div`
    background: linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%);
    border-radius: 20px;
    max-width: 600px;
    width: 100%;
    height: 85vh;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.15);
    display: flex;
    flex-direction: column;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 32px 24px 24px 24px;
    flex-shrink: 0;
`;

const Title = styled.h2`
    color: #ffffff;
    font-size: 24px;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const CloseButton = styled.button`
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #e0e0e0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 20px;
    transition: all 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
    }
`;

const ScrollContainer = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 0 24px;
    min-height: 0;
`;

const Description = styled.p`
    color: #b0b0b0;
    font-size: 14px;
    margin: 0 0 16px 0;
    line-height: 1.5;
    padding: 0 24px;
    flex-shrink: 0;
`;

const MacroList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
`;

const MacroItem = styled.div`
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 12px;
    display: flex;
    gap: 8px;
    align-items: center;
    transition: all 0.2s;
    width: 95%;
    max-width: 95%;
    box-sizing: border-box;

    &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.15);
    }
`;

const MacroIndex = styled.div`
    color: #808080;
    font-size: 14px;
    font-weight: 600;
    width: 24px;
    text-align: center;
    flex-shrink: 0;
`;

const MacroInputGroup = styled.div`
    flex: 1;
    min-width: 0;
    display: flex;
    gap: 8px;
    align-items: center;
`;

const MacroInput = styled.input`
    flex: 1;
    min-width: 0;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 10px 12px;
    color: #ffffff;
    font-size: 14px;
    transition: all 0.2s;

    &::placeholder {
        color: #606060;
    }

    &:focus {
        outline: none;
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(240, 147, 251, 0.5);
    }
`;

const CopyButton = styled.button`
    background: ${props => props.$copied ? 'rgba(46, 213, 115, 0.2)' : 'rgba(96, 165, 250, 0.2)'};
    border: 1px solid ${props => props.$copied ? 'rgba(46, 213, 115, 0.5)' : 'rgba(96, 165, 250, 0.5)'};
    color: ${props => props.$copied ? '#2ed573' : '#60a5fa'};
    padding: 8px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;

    &:hover {
        background: ${props => props.$copied ? 'rgba(46, 213, 115, 0.3)' : 'rgba(96, 165, 250, 0.3)'};
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const EditButton = styled.button`
    background: rgba(255, 193, 7, 0.2);
    border: 1px solid rgba(255, 193, 7, 0.5);
    color: #ffc107;
    padding: 8px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;

    &:hover {
        background: rgba(255, 193, 7, 0.3);
    }
`;

// 편집 모달 스타일
const EditModalContent = styled.div`
    background: linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%);
    border-radius: 20px;
    padding: 32px 24px;
    max-width: 500px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.15);
`;

const EditTextarea = styled.textarea`
    width: 100%;
    min-height: 120px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 12px;
    color: #ffffff;
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
    transition: all 0.2s;
    margin-bottom: 12px;

    &::placeholder {
        color: #606060;
    }

    &:focus {
        outline: none;
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(240, 147, 251, 0.5);
    }
`;

const CharCount = styled.div`
    color: ${props => props.$exceeded ? '#ff6b6b' : '#b0b0b0'};
    font-size: 13px;
    text-align: right;
    margin-bottom: 8px;
`;

const DeleteAllButtonRow = styled.div`
    display: flex;
    justify-content: center;
    margin-bottom: 12px;
`;

const DeleteAllButton = styled.button`
    background: rgba(255, 107, 107, 0.2);
    border: 1px solid rgba(255, 107, 107, 0.5);
    color: #ff6b6b;
    padding: 10px 40px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: rgba(255, 107, 107, 0.3);
        border-color: rgba(255, 107, 107, 0.7);
    }

    &:active {
        transform: scale(0.98);
    }
`;

const EditNotice = styled.p`
    color: #808080;
    font-size: 12px;
    text-align: center;
    margin: 0 0 16px 0;
    line-height: 1.5;
`;

// 경고 모달 스타일
const AlertModalContent = styled.div`
    background: linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%);
    border-radius: 16px;
    padding: 24px;
    max-width: 400px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 107, 107, 0.3);
`;

const AlertMessage = styled.p`
    color: #ffffff;
    font-size: 15px;
    line-height: 1.6;
    margin: 0 0 20px 0;
    text-align: center;
`;

const AlertButton = styled.button`
    width: 100%;
    background: linear-gradient(135deg, rgba(240, 147, 251, 0.8), rgba(245, 87, 108, 0.8));
    border: 1px solid rgba(240, 147, 251, 0.5);
    color: white;
    padding: 12px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: linear-gradient(135deg, rgba(240, 147, 251, 0.9), rgba(245, 87, 108, 0.9));
    }
`;

const ToastMessage = styled.div`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(60, 60, 60, 0.95);
    color: white;
    padding: 14px 50px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    z-index: 10001;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    animation: fadeInCenter 0.3s ease-out;
    min-width: 300px;
    text-align: center;

    @keyframes fadeInCenter {
        from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
        }
        to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
    }
`;

const STORAGE_KEY = 'macroTexts';
const MAX_LENGTH = 100;

const MacroModal = ({ onClose, onSave }) => {
    const [macros, setMacros] = useState(Array(7).fill(''));
    const [initialMacros, setInitialMacros] = useState(Array(7).fill('')); // 초기값 저장
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editText, setEditText] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        // localStorage에서 매크로 불러오기
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    // 마이그레이션 처리
                    if (parsed.length === 10) {
                        // 10개에서 7개로: 앞의 7개만 유지
                        const migrated = parsed.slice(0, 7);
                        setMacros(migrated);
                        setInitialMacros(migrated); // 초기값도 저장
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
                    } else if (parsed.length === 5) {
                        // 5개에서 7개로: 2개 빈 슬롯 추가
                        const migrated = [...parsed, '', ''];
                        setMacros(migrated);
                        setInitialMacros(migrated); // 초기값도 저장
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
                    } else if (parsed.length === 7) {
                        setMacros(parsed);
                        setInitialMacros(parsed); // 초기값도 저장
                    }
                }
            } catch (error) {
                console.error('Failed to load macros:', error);
            }
        }
    }, []);

    const handleMacroChange = (index, value) => {
        // 최대 길이 제한 체크
        if (value.length > MAX_LENGTH) {
            setAlertMessage(`글자 제한을 넘습니다.\n최대 ${MAX_LENGTH}자까지 입력 가능합니다.`);
            setShowAlert(true);
            return;
        }

        const newMacros = [...macros];
        newMacros[index] = value;
        setMacros(newMacros);

        // localStorage에 저장
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newMacros));
    };

    const handleCopy = async (index) => {
        const text = macros[index];
        if (!text.trim()) return;

        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(index);
            setShowToast(true);
            setTimeout(() => {
                setCopiedIndex(null);
                setShowToast(false);
            }, 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
            alert('복사에 실패했습니다.');
        }
    };

    const handleOpenEdit = (index) => {
        setEditingIndex(index);
        setEditText(macros[index]);
    };

    const handleEditTextChange = (newText) => {
        setEditText(newText);
        // 입력 중에는 경고창을 띄우지 않음
    };

    const handleDeleteAll = () => {
        setEditText('');
    };

    const handleCloseEdit = () => {
        // 닫기 버튼 클릭 시에만 100자 체크
        if (editText.length > MAX_LENGTH) {
            setAlertMessage(`글자 제한을 넘습니다.\n최대 ${MAX_LENGTH}자까지 입력 가능합니다.\n\n현재: ${editText.length}자\n\n수정 후 다시 닫기 버튼을 눌러주세요.`);
            setShowAlert(true);
            return;
        }

        const newMacros = [...macros];
        newMacros[editingIndex] = editText;
        setMacros(newMacros);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newMacros));
        setEditingIndex(null);
        setEditText('');
    };

    return (
        <Portal>
            <Overlay>
                <ModalContent onClick={(e) => e.stopPropagation()}>
                    <Header>
                        <Title>매크로</Title>
                        <CloseButton onClick={() => {
                            // 변경사항 확인 (7개 배열 비교)
                            const hasChanged = macros.some((macro, index) => macro !== initialMacros[index]);

                            console.log('🚪 매크로 모달 닫기');
                            console.log('   초기값:', initialMacros);
                            console.log('   현재값:', macros);
                            console.log('   변경됨:', hasChanged);

                            // 변경된 경우만 Firestore에 저장
                            if (hasChanged && onSave) {
                                console.log('💾 변경사항 있음 - Firestore 저장');
                                onSave(macros);
                            } else if (!hasChanged) {
                                console.log('✅ 변경사항 없음 - Firestore 저장 건너뜀');
                            } else if (!onSave) {
                                console.warn('⚠️ onSave 함수가 없습니다!');
                            }

                            onClose();
                        }}>&times;</CloseButton>
                    </Header>

                    <Description>
                        자주 사용하는 텍스트를 저장하고 빠르게 복사하세요.
                    </Description>

                    <ScrollContainer>
                        <MacroList>
                            {macros.map((macro, index) => (
                                <MacroItem key={index}>
                                    <MacroIndex>{index + 1}</MacroIndex>
                                    <MacroInputGroup>
                                        <MacroInput
                                            type="text"
                                            value={macro}
                                            onChange={(e) => handleMacroChange(index, e.target.value)}
                                            placeholder={`매크로 ${index + 1} (예: URL, 아이디, 인사말 등)`}
                                        />
                                        <CopyButton
                                            onClick={() => handleCopy(index)}
                                            disabled={!macro.trim()}
                                            $copied={copiedIndex === index}
                                            title="복사"
                                        >
                                            {copiedIndex === index ? (
                                                <FiCheck size={16} />
                                            ) : (
                                                <FiCopy size={16} />
                                            )}
                                        </CopyButton>
                                        <EditButton
                                            onClick={() => handleOpenEdit(index)}
                                            title="편집"
                                        >
                                            <FiEdit2 size={16} />
                                        </EditButton>
                                    </MacroInputGroup>
                                </MacroItem>
                            ))}
                        </MacroList>
                    </ScrollContainer>
                </ModalContent>
            </Overlay>

            {showToast && (
                <ToastMessage>매크로가 복사되었습니다.</ToastMessage>
            )}

            {/* 편집 모달 */}
            {editingIndex !== null && (
                <Overlay>
                    <EditModalContent onClick={(e) => e.stopPropagation()}>
                        <Header>
                            <Title>매크로 편집</Title>
                            <CloseButton onClick={handleCloseEdit}>&times;</CloseButton>
                        </Header>

                        <EditTextarea
                            value={editText}
                            onChange={(e) => handleEditTextChange(e.target.value)}
                            placeholder={`매크로 ${editingIndex + 1} 내용을 입력하세요`}
                        />

                        <CharCount $exceeded={editText.length > MAX_LENGTH}>
                            {editText.length}/{MAX_LENGTH}
                        </CharCount>

                        <DeleteAllButtonRow>
                            <DeleteAllButton onClick={handleDeleteAll}>
                                Del
                            </DeleteAllButton>
                        </DeleteAllButtonRow>

                        <EditNotice>
                            텍스트를 입력한 후 창을 닫으면 자동으로 저장됩니다.
                        </EditNotice>
                    </EditModalContent>
                </Overlay>
            )}

            {/* 경고 모달 */}
            {showAlert && (
                <Overlay>
                    <AlertModalContent onClick={(e) => e.stopPropagation()}>
                        <AlertMessage>{alertMessage}</AlertMessage>
                        <AlertButton onClick={() => setShowAlert(false)}>
                            확인
                        </AlertButton>
                    </AlertModalContent>
                </Overlay>
            )}
        </Portal>
    );
};

export default MacroModal;
