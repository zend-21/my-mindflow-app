// src/components/secret/SecretDocEditor.jsx
// 시크릿 문서 작성/편집 모달

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Portal from '../Portal';

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10000;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const Modal = styled.div`
    background: linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%);
    border-radius: 16px;
    width: 90vw;
    max-width: 600px;
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

const LabelRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
`;

const ImportanceCheckbox = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    color: #ff6b6b;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;

    input[type="checkbox"] {
        width: 16px;
        height: 16px;
        cursor: pointer;
        accent-color: #ff6b6b;
    }
`;

const Input = styled.input`
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
    font-size: 14px;
    transition: all 0.2s;

    &:focus {
        outline: none;
        border-color: rgba(240, 147, 251, 0.5);
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 0 0 3px rgba(240, 147, 251, 0.1);
    }

    &::placeholder {
        color: #808080;
    }
`;

const TextArea = styled.textarea`
    width: 100%;
    min-height: 200px;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
    transition: all 0.2s;

    &:focus {
        outline: none;
        border-color: rgba(240, 147, 251, 0.5);
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 0 0 3px rgba(240, 147, 251, 0.1);
    }

    &::placeholder {
        color: #808080;
    }
`;

const Select = styled.select`
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;

    &:focus {
        outline: none;
        border-color: rgba(240, 147, 251, 0.5);
        box-shadow: 0 0 0 3px rgba(240, 147, 251, 0.1);
    }

    option {
        background: #1a1d24;
        color: #ffffff;
    }
`;

const TagsInput = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    min-height: 44px;
`;

const Tag = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 6px;
    background: rgba(240, 147, 251, 0.2);
    border: 1px solid rgba(240, 147, 251, 0.3);
    color: #ffffff;
    font-size: 13px;
`;

const RemoveTagButton = styled.button`
    background: none;
    border: none;
    color: #ffffff;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    opacity: 0.7;
    transition: opacity 0.2s;

    &:hover {
        opacity: 1;
    }
`;

const TagInput = styled.input`
    flex: 1;
    min-width: 100px;
    padding: 4px;
    border: none;
    background: transparent;
    color: #ffffff;
    font-size: 13px;

    &:focus {
        outline: none;
    }

    &::placeholder {
        color: #808080;
    }
`;

const CheckboxGroup = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const Checkbox = styled.input`
    width: 18px;
    height: 18px;
    cursor: pointer;
`;

const ErrorText = styled.div`
    color: #ff6b6b;
    font-size: 13px;
    margin-top: 6px;
    font-weight: 500;
`;

const PasswordInputWrapper = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
`;

const PasswordInput = styled(Input)`
    flex: 1;
    margin-top: 0 !important;
`;

const ShowPasswordButton = styled.button`
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #d0d0d0;
    font-size: 20px;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;

    &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
    }
`;

const CategoryButtons = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    width: 100%;
`;

const CategoryButton = styled.button`
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid ${props => props.$active ? 'rgba(240, 147, 251, 0.5)' : 'rgba(255, 255, 255, 0.1)'};
    background: ${props => props.$active ? 'rgba(240, 147, 251, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
    color: ${props => props.$active ? '#f093fb' : '#d0d0d0'};
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    &:hover {
        background: ${props => props.$active ? 'rgba(240, 147, 251, 0.25)' : 'rgba(255, 255, 255, 0.08)'};
        border-color: ${props => props.$active ? 'rgba(240, 147, 251, 0.6)' : 'rgba(255, 255, 255, 0.2)'};
    }
`;

const Footer = styled.div`
    padding: 20px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    gap: 12px;
    justify-content: flex-end;
`;

const Button = styled.button`
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;

    ${props => props.$primary ? `
        background: linear-gradient(135deg, rgba(240, 147, 251, 0.3), rgba(245, 87, 108, 0.3));
        color: white;
        border: 1px solid rgba(240, 147, 251, 0.5);
        box-shadow: 0 2px 8px rgba(240, 147, 251, 0.2);

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(240, 147, 251, 0.4);
            background: linear-gradient(135deg, rgba(240, 147, 251, 0.4), rgba(245, 87, 108, 0.4));
        }
    ` : `
        background: rgba(255, 255, 255, 0.05);
        color: #d0d0d0;
        border: 1px solid rgba(255, 255, 255, 0.1);

        &:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.2);
        }
    `}

    &:active {
        transform: translateY(0);
    }
`;

const ErrorModal = styled.div`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%);
    border: 1px solid rgba(255, 107, 107, 0.3);
    border-radius: 12px;
    padding: 24px;
    z-index: 10001;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    min-width: 280px;
    max-width: 90vw;
`;

const ErrorModalTitle = styled.div`
    font-size: 16px;
    font-weight: 600;
    color: #ff6b6b;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
`;

const ErrorModalMessage = styled.div`
    font-size: 14px;
    color: #d0d0d0;
    margin-bottom: 20px;
    line-height: 1.5;
`;

const ErrorModalButton = styled.button`
    width: 100%;
    padding: 10px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    background: linear-gradient(135deg, rgba(240, 147, 251, 0.3), rgba(245, 87, 108, 0.3));
    color: white;
    border: 1px solid rgba(240, 147, 251, 0.5);

    &:hover {
        background: linear-gradient(135deg, rgba(240, 147, 251, 0.4), rgba(245, 87, 108, 0.4));
    }

    &:active {
        transform: translateY(0);
    }
`;

const SecretDocEditor = ({ doc, onClose, onSave, onDelete, existingDocs = [] }) => {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'diary',
        tags: [],
        hasPassword: false,
        password: '',
        isImportant: false
    });

    const [tagInput, setTagInput] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [validationError, setValidationError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    useEffect(() => {
        // 에디터가 열릴 때마다 에러 상태 초기화
        setValidationError('');
        setPasswordError('');

        if (doc) {
            setFormData({
                title: doc.title || '',
                content: doc.content || '',
                category: doc.category || '',
                tags: doc.tags || [],
                hasPassword: doc.hasPassword || false,
                password: doc.password || '',
                isImportant: doc.isImportant || false
            });
            // 기존 비밀번호가 있으면 확인 필드도 동일하게 설정
            if (doc.hasPassword && doc.password) {
                setPasswordConfirm(doc.password);
            }
        }
    }, [doc]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // 비밀번호가 변경되면 에러 초기화
        if (field === 'password') {
            setPasswordError('');
        }
    };

    const handlePasswordConfirmChange = (value) => {
        setPasswordConfirm(value);
        setPasswordError('');
    };

    const handlePasswordConfirmBlur = () => {
        if (passwordConfirm && formData.password !== passwordConfirm) {
            setPasswordConfirm('');
            setPasswordError('비밀번호가 일치하지 않습니다');
        }
    };

    const handleAddTag = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!formData.tags.includes(tagInput.trim())) {
                handleChange('tags', [...formData.tags, tagInput.trim()]);
            }
            setTagInput('');
        }
    };

    const handleTagInputBlur = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            handleChange('tags', [...formData.tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        handleChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
    };

    const handleSave = () => {
        if (!formData.content.trim()) {
            setValidationError('내용을 입력해주세요.');
            return;
        }

        // 비밀번호 확인 검증
        if (formData.hasPassword) {
            if (!formData.password) {
                setValidationError('문서 비밀번호를 입력해주세요.');
                return;
            }
            if (formData.password !== passwordConfirm) {
                setPasswordError('비밀번호가 일치하지 않습니다');
                return;
            }
        }

        let finalTitle = formData.title.trim();

        // 제목이 비어있으면 "제목없음"으로 설정
        if (!finalTitle) {
            finalTitle = '제목없음';

            // 기존 "제목없음" 문서들 찾기 (현재 수정중인 문서는 제외)
            const untitledDocs = existingDocs.filter(d => {
                if (doc && d.id === doc.id) return false; // 현재 수정중인 문서는 제외
                return d.title === '제목없음' || /^제목없음 \(\d+\)$/.test(d.title);
            });

            if (untitledDocs.length > 0) {
                // 기존 번호들 추출
                const numbers = untitledDocs.map(d => {
                    if (d.title === '제목없음') return 0;
                    const match = d.title.match(/^제목없음 \((\d+)\)$/);
                    return match ? parseInt(match[1]) : 0;
                });

                // 다음 번호 계산
                const maxNumber = Math.max(...numbers);
                finalTitle = `제목없음 (${maxNumber + 1})`;
            }
        }

        onSave({
            ...formData,
            title: finalTitle,
            preview: formData.content.substring(0, 100)
        });
    };

    return (
        <Portal>
            <Overlay>
                <Modal onClick={(e) => e.stopPropagation()}>
                    <Header>
                        <Title>{doc ? '문서 수정' : '새 비밀글 작성'}</Title>
                        <CloseButton onClick={onClose}>&times;</CloseButton>
                    </Header>

                <Body>
                    <FormGroup>
                        <Label>제목</Label>
                        <Input
                            type="text"
                            placeholder="미입력시 '제목없음'으로 저장됩니다"
                            value={formData.title}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value.length <= 25) {
                                    handleChange('title', value);
                                }
                            }}
                            maxLength={25}
                        />
                    </FormGroup>

                    <FormGroup>
                        <LabelRow>
                            <Label style={{ marginBottom: 0 }}>내용 (필수)</Label>
                            <ImportanceCheckbox>
                                <input
                                    type="checkbox"
                                    id="isImportant"
                                    checked={formData.isImportant}
                                    onChange={(e) => handleChange('isImportant', e.target.checked)}
                                />
                                <label htmlFor="isImportant" style={{ cursor: 'pointer' }}>중요</label>
                            </ImportanceCheckbox>
                        </LabelRow>
                        <TextArea
                            placeholder="내용을 입력하세요"
                            value={formData.content}
                            onChange={(e) => handleChange('content', e.target.value)}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>카테고리</Label>
                        <CategoryButtons>
                            <CategoryButton
                                type="button"
                                $active={formData.category === 'financial'}
                                onClick={() => handleChange('category', 'financial')}
                            >
                                금융
                            </CategoryButton>
                            <CategoryButton
                                type="button"
                                $active={formData.category === 'personal'}
                                onClick={() => handleChange('category', 'personal')}
                            >
                                개인
                            </CategoryButton>
                            <CategoryButton
                                type="button"
                                $active={formData.category === 'work'}
                                onClick={() => handleChange('category', 'work')}
                            >
                                업무
                            </CategoryButton>
                            <CategoryButton
                                type="button"
                                $active={formData.category === 'diary'}
                                onClick={() => handleChange('category', 'diary')}
                            >
                                일기
                            </CategoryButton>
                        </CategoryButtons>
                    </FormGroup>

                    <FormGroup>
                        <Label>태그</Label>
                        <TagsInput>
                            {formData.tags.map((tag, index) => (
                                <Tag key={index}>
                                    {tag}
                                    <RemoveTagButton onClick={() => handleRemoveTag(tag)}>
                                        ✕
                                    </RemoveTagButton>
                                </Tag>
                            ))}
                            <TagInput
                                type="text"
                                placeholder="태그 입력 후 Enter"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                onBlur={handleTagInputBlur}
                            />
                        </TagsInput>
                    </FormGroup>

                    <FormGroup>
                        <CheckboxGroup>
                            <Checkbox
                                type="checkbox"
                                id="hasPassword"
                                checked={formData.hasPassword}
                                onChange={(e) => handleChange('hasPassword', e.target.checked)}
                            />
                            <Label htmlFor="hasPassword" style={{ marginBottom: 0, cursor: 'pointer' }}>
                                개별 비밀번호 설정 (이중 보안)
                            </Label>
                        </CheckboxGroup>
                        {formData.hasPassword && (
                            <>
                                <PasswordInputWrapper>
                                    <PasswordInput
                                        type={showPassword ? "text" : "password"}
                                        placeholder="문서 비밀번호 (4-20자)"
                                        value={formData.password}
                                        onChange={(e) => handleChange('password', e.target.value)}
                                    />
                                    <ShowPasswordButton
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? '👁️' : '👁️‍🗨️'}
                                    </ShowPasswordButton>
                                </PasswordInputWrapper>
                                <PasswordInputWrapper>
                                    <PasswordInput
                                        type={showPasswordConfirm ? "text" : "password"}
                                        placeholder="비밀번호 확인"
                                        value={passwordConfirm}
                                        onChange={(e) => handlePasswordConfirmChange(e.target.value)}
                                        onBlur={handlePasswordConfirmBlur}
                                    />
                                    <ShowPasswordButton
                                        type="button"
                                        onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                    >
                                        {showPasswordConfirm ? '👁️' : '👁️‍🗨️'}
                                    </ShowPasswordButton>
                                </PasswordInputWrapper>
                                {passwordError && <ErrorText>{passwordError}</ErrorText>}
                            </>
                        )}
                    </FormGroup>
                </Body>

                <Footer>
                    {doc && onDelete && (
                        <Button
                            onClick={() => {
                                if (window.confirm('이 문서를 삭제하시겠습니까?')) {
                                    onDelete(doc.id);
                                }
                            }}
                            style={{ marginRight: 'auto', borderColor: '#ff6b6b', color: '#ff6b6b' }}
                        >
                            삭제
                        </Button>
                    )}
                    <Button onClick={onClose}>취소</Button>
                    <Button $primary onClick={handleSave}>{doc ? '수정' : '저장'}</Button>
                </Footer>
                </Modal>

                {validationError && (
                    <ErrorModal onClick={(e) => e.stopPropagation()}>
                        <ErrorModalTitle>
                            ⚠️ 입력 오류
                        </ErrorModalTitle>
                        <ErrorModalMessage>{validationError}</ErrorModalMessage>
                        <ErrorModalButton onClick={() => setValidationError('')}>
                            확인
                        </ErrorModalButton>
                    </ErrorModal>
                )}
            </Overlay>
        </Portal>
    );
};

export default SecretDocEditor;
