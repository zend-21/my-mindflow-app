// src/components/secret/SecretDocEditor.jsx
// 시크릿 문서 작성/편집 모달

import React, { useState, useEffect, useRef } from 'react';
import Portal from '../Portal';
import { ALL_ICONS } from './categoryIcons';
import * as S from './SecretDocEditor.styles';

const SecretDocEditor = ({ doc, onClose, onSave, onDelete, existingDocs = [], settings }) => {
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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [isInputEnabled, setIsInputEnabled] = useState(false);

    // 원본 데이터 저장 (변경사항 감지용)
    const [initialData, setInitialData] = useState(null);

    const textareaRef = useRef(null);
    const passwordSectionRef = useRef(null);
    const contentEditorRef = useRef(null);

    // 카테고리 아이콘 SVG 경로 가져오기
    const getCategoryIconPath = (category) => {
        const iconId = settings?.categoryIcons?.[category];
        if (!iconId) return ALL_ICONS[0]?.svg; // iconId가 없으면 첫 번째 아이콘 사용
        const icon = ALL_ICONS.find(i => i.id === iconId);
        return icon?.svg || ALL_ICONS[0]?.svg;
    };

    // 🔓 Draft 복원 및 초기화
    useEffect(() => {
        // 에디터가 열릴 때마다 에러 상태 초기화
        setValidationError('');
        setPasswordError('');
        setIsInputEnabled(false);

        // 🔓 localStorage에서 Draft 복원 시도 (새 문서 작성 시에만)
        const userId = localStorage.getItem('firebaseUserId');
        const draftKey = `secretDocEditorDraft_${userId}`;
        let restoredData = null;

        // ✅ 기존 문서를 편집하는 경우 Draft 복원 건너뛰기
        if (!doc) {
            try {
                const savedDraft = localStorage.getItem(draftKey);
                if (savedDraft) {
                    const draftData = JSON.parse(savedDraft);
                    // 24시간 이내의 Draft만 복원
                    const hoursSinceCreated = (Date.now() - draftData.timestamp) / (1000 * 60 * 60);

                    if (hoursSinceCreated < 24) {
                        restoredData = draftData.formData;
                        console.log('📂 Draft 복원:', restoredData);
                        if (draftData.passwordConfirm) {
                            setPasswordConfirm(draftData.passwordConfirm);
                        }
                    } else {
                        // 오래된 Draft 삭제
                        localStorage.removeItem(draftKey);
                    }
                }
            } catch (error) {
                console.error('Draft 복원 실패:', error);
            }
        }

        const initialFormData = restoredData || (doc ? {
            title: doc.title || '',
            content: doc.content || '',
            category: doc.category || 'diary',
            tags: doc.tags || [],
            hasPassword: doc.hasPassword || false,
            password: doc.password || '',
            isImportant: doc.isImportant || false
        } : {
            title: '',
            content: '',
            category: 'diary',
            tags: [],
            hasPassword: false,
            password: '',
            isImportant: false
        });

        console.log('🔵 SecretDocEditor 초기화:', {
            전달받은doc: doc ? { id: doc.id, title: doc.title } : null,
            초기formData: { title: initialFormData.title }
        });

        setFormData(initialFormData);
        setInitialData(initialFormData); // 원본 데이터 저장

        // 기존 비밀번호가 있으면 확인 필드도 동일하게 설정
        if (!restoredData && doc?.hasPassword && doc.password) {
            setPasswordConfirm(doc.password);
        }

        // 모달 열림 후 400ms 후에 입력 활성화 (터치 이벤트 전파 방지)
        const timer = setTimeout(() => {
            setIsInputEnabled(true);
        }, 400);

        return () => clearTimeout(timer);
    }, [doc]);

    // ✨ contentEditor 초기값 설정 (커서 위치 유지)
    useEffect(() => {
        if (contentEditorRef.current) {
            // 편집 중이 아닐 때만 업데이트 (포커스가 없을 때)
            if (document.activeElement !== contentEditorRef.current) {
                contentEditorRef.current.innerHTML = formData.content || '';
            }
        }
    }, [formData.content]);

    // 💾 formData 변경 시 자동 Draft 저장
    useEffect(() => {
        // 입력이 활성화되지 않았으면 저장하지 않음 (초기화 중)
        if (!isInputEnabled) return;

        // 내용이 비어있으면 저장하지 않음
        if (!formData.title && !formData.content) return;

        const userId = localStorage.getItem('firebaseUserId');
        if (!userId) return;

        const draftKey = `secretDocEditorDraft_${userId}`;
        const draftData = {
            formData,
            passwordConfirm,
            timestamp: Date.now()
        };

        try {
            localStorage.setItem(draftKey, JSON.stringify(draftData));
            console.log('💾 Draft 자동 저장');
        } catch (error) {
            console.error('Draft 저장 실패:', error);
        }
    }, [formData, passwordConfirm, isInputEnabled]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // 비밀번호가 변경되면 에러 초기화
        if (field === 'password') {
            setPasswordError('');
        }

        // 개별 비밀번호 체크박스를 선택하면 비밀번호 입력 필드로 스크롤
        if (field === 'hasPassword' && value === true) {
            setTimeout(() => {
                if (passwordSectionRef.current) {
                    passwordSectionRef.current.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            }, 100);
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

    // 변경사항 감지 함수
    const hasChanges = () => {
        if (!initialData) return false;

        // 각 필드 비교 (공백 포함)
        return (
            formData.title !== initialData.title ||
            formData.content !== initialData.content ||
            formData.category !== initialData.category ||
            formData.isImportant !== initialData.isImportant ||
            formData.hasPassword !== initialData.hasPassword ||
            formData.password !== initialData.password ||
            JSON.stringify(formData.tags.sort()) !== JSON.stringify(initialData.tags.sort())
        );
    };

    const handleSaveClick = () => {
        // 입력이 활성화되지 않았으면 무시 (의도치 않은 클릭 방지)
        if (!isInputEnabled) return;

        // 수정 모드이고 변경사항이 있으면 확인 모달 표시
        if (doc && hasChanges()) {
            setShowSaveConfirm(true);
        } else {
            handleSave();
        }
    };

    const handleSave = () => {
        // 입력이 활성화되지 않았으면 무시 (의도치 않은 클릭 방지)
        if (!isInputEnabled) return;

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

        // 🗑️ 저장 성공 시 Draft 삭제
        const userId = localStorage.getItem('firebaseUserId');
        if (userId) {
            const draftKey = `secretDocEditorDraft_${userId}`;
            localStorage.removeItem(draftKey);
            console.log('🗑️ Draft 삭제 (저장 완료)');
        }

        // 확인 모달 닫기
        setShowSaveConfirm(false);
    };

    return (
        <Portal>
            <S.Overlay>
                <S.Modal onClick={(e) => e.stopPropagation()}>
                    <S.Header>
                        <S.Title>{doc ? '문서 수정' : '새 비밀글 작성'}</S.Title>
                        <S.CloseButton onClick={onClose}>&times;</S.CloseButton>
                    </S.Header>

                <S.Body>
                    <S.FormGroup>
                        <S.Label>제목</S.Label>
                        <S.Input
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
                            autoFocus={false}
                            style={{ pointerEvents: isInputEnabled ? 'auto' : 'none' }}
                        />
                    </S.FormGroup>

                    <S.FormGroup>
                        <S.LabelRow>
                            <S.Label style={{ marginBottom: 0 }}>내용 (필수)</S.Label>
                            <S.ImportanceCheckbox>
                                <input
                                    type="checkbox"
                                    id="isImportant"
                                    checked={formData.isImportant}
                                    onChange={(e) => handleChange('isImportant', e.target.checked)}
                                />
                                <label htmlFor="isImportant" style={{ cursor: 'pointer' }}>중요</label>
                            </S.ImportanceCheckbox>
                        </S.LabelRow>
                        <S.ContentEditor
                            ref={contentEditorRef}
                            contentEditable={isInputEnabled}
                            data-placeholder="내용을 입력하세요"
                            onInput={(e) => handleChange('content', e.currentTarget.innerHTML)}
                            onBlur={(e) => handleChange('content', e.currentTarget.innerHTML)}
                            onClick={(e) => {
                                // 클릭한 위치가 contentEditor 자체일 때만 (자식 요소가 아닐 때)
                                if (e.target === contentEditorRef.current && isInputEnabled) {
                                    // 포커스 이동 및 커서를 마지막으로
                                    contentEditorRef.current.focus();
                                    const range = document.createRange();
                                    const sel = window.getSelection();
                                    if (contentEditorRef.current.childNodes.length > 0) {
                                        const lastNode = contentEditorRef.current.childNodes[contentEditorRef.current.childNodes.length - 1];
                                        range.setStartAfter(lastNode);
                                        range.collapse(true);
                                    } else {
                                        range.selectNodeContents(contentEditorRef.current);
                                        range.collapse(false);
                                    }
                                    sel.removeAllRanges();
                                    sel.addRange(range);
                                }
                            }}
                            style={{ pointerEvents: isInputEnabled ? 'auto' : 'none' }}
                            suppressContentEditableWarning
                        />
                    </S.FormGroup>

                    <S.FormGroup>
                        <S.Label>카테고리</S.Label>
                        <S.CategoryButtons>
                            <S.CategoryButton
                                type="button"
                                $active={formData.category === 'financial'}
                                $category="financial"
                                onClick={() => handleChange('category', 'financial')}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d={getCategoryIconPath('financial')}/>
                                </svg>
                                {settings?.categoryNames?.financial || '금융'}
                            </S.CategoryButton>
                            <S.CategoryButton
                                type="button"
                                $active={formData.category === 'personal'}
                                $category="personal"
                                onClick={() => handleChange('category', 'personal')}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d={getCategoryIconPath('personal')}/>
                                </svg>
                                {settings?.categoryNames?.personal || '개인'}
                            </S.CategoryButton>
                            <S.CategoryButton
                                type="button"
                                $active={formData.category === 'work'}
                                $category="work"
                                onClick={() => handleChange('category', 'work')}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d={getCategoryIconPath('work')}/>
                                </svg>
                                {settings?.categoryNames?.work || '업무'}
                            </S.CategoryButton>
                            <S.CategoryButton
                                type="button"
                                $active={formData.category === 'diary'}
                                $category="diary"
                                onClick={() => handleChange('category', 'diary')}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d={getCategoryIconPath('diary')}/>
                                </svg>
                                {settings?.categoryNames?.diary || '일기'}
                            </S.CategoryButton>
                        </S.CategoryButtons>
                    </S.FormGroup>

                    <S.FormGroup>
                        <S.Label>태그</S.Label>
                        <S.TagsInput>
                            {formData.tags.map((tag, index) => (
                                <S.Tag key={index}>
                                    {tag}
                                    <S.RemoveTagButton onClick={() => handleRemoveTag(tag)}>
                                        ✕
                                    </S.RemoveTagButton>
                                </S.Tag>
                            ))}
                            <S.TagInput
                                type="text"
                                placeholder="태그 입력 후 Enter"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                onBlur={handleTagInputBlur}
                            />
                        </S.TagsInput>
                    </S.FormGroup>

                    <S.FormGroup>
                        <S.CheckboxGroup>
                            <S.Checkbox
                                type="checkbox"
                                id="hasPassword"
                                checked={formData.hasPassword}
                                onChange={(e) => handleChange('hasPassword', e.target.checked)}
                            />
                            <S.Label htmlFor="hasPassword" style={{ marginBottom: 0, cursor: 'pointer' }}>
                                개별 비밀번호 설정 (이중 보안)
                            </S.Label>
                        </S.CheckboxGroup>
                        {formData.hasPassword && (
                            <>
                                <S.PasswordInputWrapper ref={passwordSectionRef}>
                                    <S.PasswordInput
                                        type={showPassword ? "text" : "password"}
                                        placeholder="문서 비밀번호 (4-20자)"
                                        value={formData.password}
                                        onChange={(e) => handleChange('password', e.target.value)}
                                    />
                                    <S.ShowPasswordButton
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                <circle cx="12" cy="12" r="3"/>
                                            </svg>
                                        ) : (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                                <line x1="1" y1="1" x2="23" y2="23"/>
                                            </svg>
                                        )}
                                    </S.ShowPasswordButton>
                                </S.PasswordInputWrapper>
                                <S.PasswordInputWrapper>
                                    <S.PasswordInput
                                        type={showPasswordConfirm ? "text" : "password"}
                                        placeholder="비밀번호 확인"
                                        value={passwordConfirm}
                                        onChange={(e) => handlePasswordConfirmChange(e.target.value)}
                                        onBlur={handlePasswordConfirmBlur}
                                    />
                                    <S.ShowPasswordButton
                                        type="button"
                                        onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                    >
                                        {showPasswordConfirm ? (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                <circle cx="12" cy="12" r="3"/>
                                            </svg>
                                        ) : (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                                <line x1="1" y1="1" x2="23" y2="23"/>
                                            </svg>
                                        )}
                                    </S.ShowPasswordButton>
                                </S.PasswordInputWrapper>
                                {passwordError && <S.ErrorText>{passwordError}</S.ErrorText>}
                            </>
                        )}
                    </S.FormGroup>
                </S.Body>

                <S.Footer>
                    {doc && onDelete && (
                        <S.Button
                            onClick={() => {
                                // 입력이 활성화되지 않았으면 무시 (의도치 않은 클릭 방지)
                                if (!isInputEnabled) return;
                                setShowDeleteConfirm(true);
                            }}
                            style={{ marginRight: 'auto', borderColor: '#ff6b6b', color: '#ff6b6b' }}
                        >
                            삭제
                        </S.Button>
                    )}
                    <S.Button onClick={onClose}>취소</S.Button>
                    <S.Button
                        $primary
                        onClick={handleSaveClick}
                        disabled={doc && !hasChanges()}
                    >
                        {doc ? '수정' : '저장'}
                    </S.Button>
                </S.Footer>
                </S.Modal>

                {validationError && (
                    <S.ErrorModal onClick={(e) => e.stopPropagation()}>
                        <S.ErrorModalTitle>
                            ⚠️ 입력 오류
                        </S.ErrorModalTitle>
                        <S.ErrorModalMessage>{validationError}</S.ErrorModalMessage>
                        <S.ErrorModalButton onClick={() => setValidationError('')}>
                            확인
                        </S.ErrorModalButton>
                    </S.ErrorModal>
                )}

                {showSaveConfirm && (
                    <S.ErrorModal onClick={(e) => e.stopPropagation()}>
                        <S.ErrorModalTitle>
                            ✏️ 문서 수정
                        </S.ErrorModalTitle>
                        <S.ErrorModalMessage>변경된 내용대로 수정할까요?</S.ErrorModalMessage>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <S.ErrorModalButton
                                onClick={() => setShowSaveConfirm(false)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}
                            >
                                취소
                            </S.ErrorModalButton>
                            <S.ErrorModalButton
                                onClick={handleSave}
                                style={{
                                    background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.3), rgba(245, 87, 108, 0.5))',
                                    border: '1px solid rgba(240, 147, 251, 0.5)'
                                }}
                            >
                                수정
                            </S.ErrorModalButton>
                        </div>
                    </S.ErrorModal>
                )}

                {showDeleteConfirm && (
                    <S.ErrorModal onClick={(e) => e.stopPropagation()}>
                        <S.ErrorModalTitle>
                            🗑️ 문서 삭제
                        </S.ErrorModalTitle>
                        <S.ErrorModalMessage>이 문서를 삭제하시겠습니까?</S.ErrorModalMessage>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <S.ErrorModalButton
                                onClick={() => setShowDeleteConfirm(false)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}
                            >
                                취소
                            </S.ErrorModalButton>
                            <S.ErrorModalButton
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    // 🗑️ Draft 삭제 (문서 삭제 시)
                                    const userId = localStorage.getItem('firebaseUserId');
                                    if (userId) {
                                        const draftKey = `secretDocEditorDraft_${userId}`;
                                        localStorage.removeItem(draftKey);
                                        console.log('🗑️ Draft 삭제 (문서 삭제)');
                                    }
                                    onDelete(doc.id);
                                }}
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.3), rgba(255, 107, 107, 0.5))',
                                    border: '1px solid rgba(255, 107, 107, 0.5)'
                                }}
                            >
                                삭제
                            </S.ErrorModalButton>
                        </div>
                    </S.ErrorModal>
                )}
            </S.Overlay>
        </Portal>
    );
};

export default SecretDocEditor;
