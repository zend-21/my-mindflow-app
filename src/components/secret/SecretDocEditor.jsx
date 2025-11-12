// src/components/secret/SecretDocEditor.jsx
// 시크릿 문서 작성/편집 모달

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 12000;
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

const SecretDocEditor = ({ doc, onClose, onSave, onDelete }) => {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: '',
        tags: [],
        hasPassword: false,
        password: ''
    });

    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        if (doc) {
            setFormData({
                title: doc.title || '',
                content: doc.content || '',
                category: doc.category || '',
                tags: doc.tags || [],
                hasPassword: doc.hasPassword || false,
                password: ''
            });
        }
    }, [doc]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
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

    const handleRemoveTag = (tagToRemove) => {
        handleChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
    };

    const handleSave = () => {
        if (!formData.title.trim()) {
            alert('제목을 입력해주세요.');
            return;
        }

        if (!formData.content.trim()) {
            alert('내용을 입력해주세요.');
            return;
        }

        onSave({
            ...formData,
            preview: formData.content.substring(0, 100)
        });
    };

    return (
        <Overlay onClick={onClose}>
            <Modal onClick={(e) => e.stopPropagation()}>
                <Header>
                    <Title>{doc ? '문서 수정' : '새 문서 작성'}</Title>
                    <CloseButton onClick={onClose}>&times;</CloseButton>
                </Header>

                <Body>
                    <FormGroup>
                        <Label>제목 *</Label>
                        <Input
                            type="text"
                            placeholder="제목을 입력하세요"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>내용 *</Label>
                        <TextArea
                            placeholder="내용을 입력하세요"
                            value={formData.content}
                            onChange={(e) => handleChange('content', e.target.value)}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>카테고리</Label>
                        <Select
                            value={formData.category}
                            onChange={(e) => handleChange('category', e.target.value)}
                        >
                            <option value="">선택 안함</option>
                            <option value="financial">💰 금융</option>
                            <option value="personal">👤 개인</option>
                            <option value="work">💼 업무</option>
                            <option value="diary">📔 일기</option>
                        </Select>
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
                            <Input
                                type="password"
                                placeholder="문서 비밀번호 (4-20자)"
                                value={formData.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                style={{ marginTop: '12px' }}
                            />
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
                    <Button $primary onClick={handleSave}>저장</Button>
                </Footer>
            </Modal>
        </Overlay>
    );
};

export default SecretDocEditor;
