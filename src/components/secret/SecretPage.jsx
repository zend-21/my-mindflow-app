// src/components/secret/SecretPage.jsx
// 시크릿 페이지 메인 컴포넌트

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import PinInput from './PinInput';
import SecretDocCard from './SecretDocCard';
import SecretDocEditor from './SecretDocEditor';
import {
    hasPinSet,
    setPin,
    verifyPin,
    getAllSecretDocs,
    addSecretDoc,
    updateSecretDoc,
    deleteSecretDoc,
    searchSecretDocs,
    setDocPassword,
    unlockDoc,
    getSettings,
    saveSettings
} from '../../utils/secretStorage';

const Container = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%);
    z-index: 11000;
    display: flex;
    flex-direction: column;
`;

const Header = styled.div`
    padding: 20px 24px;
    background: linear-gradient(135deg, rgba(240, 147, 251, 0.2) 0%, rgba(245, 87, 108, 0.2) 100%);
    border-bottom: 1px solid rgba(240, 147, 251, 0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
`;

const HeaderLeft = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

const BackButton = styled.button`
    background: none;
    border: none;
    color: #ffffff;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.8;
    transition: opacity 0.2s;

    &:hover {
        opacity: 1;
    }
`;

const Title = styled.h1`
    font-size: 24px;
    font-weight: 600;
    color: #ffffff;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const LockButton = styled.button`
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #ffffff;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
    }
`;

const Content = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;

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

const SearchBar = styled.div`
    margin-bottom: 20px;
    display: flex;
    gap: 12px;
`;

const SearchInput = styled.input`
    flex: 1;
    padding: 12px 16px;
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

const FilterButton = styled.button`
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: ${props => props.$active
        ? 'linear-gradient(135deg, rgba(240, 147, 251, 0.2), rgba(245, 87, 108, 0.2))'
        : 'rgba(255, 255, 255, 0.05)'
    };
    color: ${props => props.$active ? '#f093fb' : '#d0d0d0'};
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    &:hover {
        background: linear-gradient(135deg, rgba(240, 147, 251, 0.15), rgba(245, 87, 108, 0.15));
        border-color: rgba(240, 147, 251, 0.3);
    }
`;

const DocsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 60px 20px;
    color: #808080;
`;

const EmptyIcon = styled.div`
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.5;
`;

const EmptyText = styled.p`
    font-size: 16px;
    margin: 0 0 24px 0;
`;

const AddButton = styled.button`
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(240, 147, 251, 0.8), rgba(245, 87, 108, 0.8));
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(240, 147, 251, 0.4);
    transition: all 0.2s;
    z-index: 100;

    &:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(240, 147, 251, 0.6);
    }

    &:active {
        transform: scale(0.95);
    }
`;

const SecretPage = ({ onClose, profile, showToast }) => {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [currentPin, setCurrentPin] = useState('');
    const [docs, setDocs] = useState([]);
    const [filteredDocs, setFilteredDocs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState(null);
    const [settings, setSettings] = useState(() => {
        // 강제로 pinLength를 6으로 설정
        const loadedSettings = getSettings();
        if (loadedSettings.pinLength !== 6) {
            const updatedSettings = { ...loadedSettings, pinLength: 6 };
            saveSettings(updatedSettings);
            return updatedSettings;
        }
        return loadedSettings;
    });
    const [isConfirmingPin, setIsConfirmingPin] = useState(false);
    const [firstPin, setFirstPin] = useState('');

    // 자동 잠금 타이머
    const autoLockTimerRef = useRef(null);
    const lastActivityRef = useRef(Date.now());

    // PIN 설정 초기 확인
    useEffect(() => {
        if (!profile) {
            showToast?.('로그인이 필요합니다.');
            onClose();
        }
    }, [profile, onClose, showToast]);

    // 자동 잠금 타이머 설정
    useEffect(() => {
        if (!isUnlocked || settings.autoLockMinutes === 0) return;

        const checkAutoLock = () => {
            const now = Date.now();
            const elapsed = (now - lastActivityRef.current) / 1000 / 60; // 분 단위

            if (elapsed >= settings.autoLockMinutes) {
                handleLock();
                showToast?.('자동 잠금되었습니다.');
            }
        };

        autoLockTimerRef.current = setInterval(checkAutoLock, 10000); // 10초마다 확인

        return () => {
            if (autoLockTimerRef.current) {
                clearInterval(autoLockTimerRef.current);
            }
        };
    }, [isUnlocked, settings.autoLockMinutes]);

    // 사용자 활동 감지
    const handleActivity = () => {
        lastActivityRef.current = Date.now();
    };

    useEffect(() => {
        if (isUnlocked) {
            window.addEventListener('mousemove', handleActivity);
            window.addEventListener('keydown', handleActivity);
            window.addEventListener('click', handleActivity);
            window.addEventListener('scroll', handleActivity);

            return () => {
                window.removeEventListener('mousemove', handleActivity);
                window.removeEventListener('keydown', handleActivity);
                window.removeEventListener('click', handleActivity);
                window.removeEventListener('scroll', handleActivity);
            };
        }
    }, [isUnlocked]);

    // PIN 검증 및 문서 로드
    const handlePinSubmit = async (pin) => {
        try {
            if (!hasPinSet()) {
                // 첫 PIN 설정 - 2번 입력 확인
                if (pin.length !== settings.pinLength) {
                    return { success: false, message: `${settings.pinLength}자리 PIN을 입력해주세요.` };
                }

                if (!isConfirmingPin) {
                    // 첫 번째 입력
                    setFirstPin(pin);
                    setIsConfirmingPin(true);
                    return { success: true };
                } else {
                    // 두 번째 입력 - 일치 확인
                    if (firstPin !== pin) {
                        setIsConfirmingPin(false);
                        setFirstPin('');
                        return { success: false, message: 'PIN이 일치하지 않습니다. 다시 설정해주세요.' };
                    }

                    // PIN 일치 - 저장
                    await setPin(pin);
                    setCurrentPin(pin);
                    setIsUnlocked(true);
                    setIsConfirmingPin(false);
                    setFirstPin('');
                    showToast?.('PIN이 설정되었습니다.');
                    return { success: true };
                }
            }

            // PIN 검증
            const isValid = await verifyPin(pin);
            if (isValid) {
                setCurrentPin(pin);
                setIsUnlocked(true);
                await loadDocs(pin);
                return { success: true };
            } else {
                return { success: false, message: '잘못된 PIN입니다.' };
            }
        } catch (error) {
            console.error('PIN 처리 오류:', error);
            return { success: false, message: '오류가 발생했습니다.' };
        }
    };

    // 문서 로드
    const loadDocs = async (pin) => {
        try {
            const allDocs = await getAllSecretDocs(pin);
            setDocs(allDocs);
            setFilteredDocs(allDocs);
        } catch (error) {
            console.error('문서 로드 오류:', error);
            showToast?.('문서를 불러올 수 없습니다.');
        }
    };

    // 검색 및 필터링
    useEffect(() => {
        let filtered = docs;

        // 카테고리 필터
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(doc => doc.category === selectedCategory);
        }

        // 검색
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(doc =>
                doc.title?.toLowerCase().includes(query) ||
                doc.content?.toLowerCase().includes(query) ||
                doc.tags?.some(tag => tag.toLowerCase().includes(query))
            );
        }

        setFilteredDocs(filtered);
    }, [docs, searchQuery, selectedCategory]);

    // 문서 클릭
    const handleDocClick = async (doc) => {
        if (doc.hasPassword) {
            const password = prompt('문서 비밀번호를 입력하세요:');
            if (!password) return;

            const result = await unlockDoc(currentPin, doc.id, password);
            if (result.success) {
                setEditingDoc({ ...doc, content: result.content });
                setIsEditorOpen(true);
            } else {
                showToast?.(result.message);
            }
        } else {
            setEditingDoc(doc);
            setIsEditorOpen(true);
        }
    };

    // 문서 저장
    const handleSaveDoc = async (docData) => {
        try {
            if (editingDoc) {
                // 업데이트
                const updated = await updateSecretDoc(currentPin, editingDoc.id, docData);

                // 개별 비밀번호 설정
                if (docData.hasPassword && docData.password) {
                    await setDocPassword(currentPin, updated.id, docData.password);
                }

                await loadDocs(currentPin);
                showToast?.('문서가 수정되었습니다.');
            } else {
                // 새 문서
                const newDoc = await addSecretDoc(currentPin, docData);

                // 개별 비밀번호 설정
                if (docData.hasPassword && docData.password) {
                    await setDocPassword(currentPin, newDoc.id, docData.password);
                }

                await loadDocs(currentPin);
                showToast?.('문서가 추가되었습니다.');
            }

            setIsEditorOpen(false);
            setEditingDoc(null);
        } catch (error) {
            console.error('문서 저장 오류:', error);
            showToast?.('문서 저장에 실패했습니다.');
        }
    };

    // 문서 삭제
    const handleDeleteDoc = async (docId) => {
        try {
            const doc = docs.find(d => d.id === docId);
            if (!doc) return;

            // 휴지통으로 이동 이벤트 발생
            const event = new CustomEvent('moveToTrash', {
                detail: {
                    id: doc.id,
                    type: 'secret',
                    content: doc.title || '제목 없음',
                    originalData: doc
                }
            });
            window.dispatchEvent(event);

            // 시크릿 스토리지에서 삭제
            await deleteSecretDoc(currentPin, docId);
            await loadDocs(currentPin);

            setIsEditorOpen(false);
            setEditingDoc(null);
            showToast?.('문서가 삭제되었습니다.');
        } catch (error) {
            console.error('문서 삭제 오류:', error);
            showToast?.('문서 삭제에 실패했습니다.');
        }
    };

    // 잠금
    const handleLock = () => {
        setIsUnlocked(false);
        setCurrentPin('');
        setDocs([]);
        setFilteredDocs([]);
        setSearchQuery('');
        setSelectedCategory('all');
    };

    // PIN 복구 (이메일 전송)
    const handleForgotPin = () => {
        if (!profile?.email) {
            showToast?.('이메일 정보가 없습니다.');
            return;
        }

        showToast?.(`임시 PIN이 ${profile.email}로 전송되었습니다. (준비 중)`);
    };

    if (!isUnlocked) {
        return (
            <Container>
                <Header>
                    <HeaderLeft>
                        <BackButton onClick={onClose}>←</BackButton>
                        <Title>🔒 시크릿</Title>
                    </HeaderLeft>
                </Header>
                <Content>
                    <PinInput
                        pinLength={settings.pinLength}
                        title={hasPinSet()
                            ? 'PIN 입력'
                            : (isConfirmingPin ? 'PIN 확인' : 'PIN 설정')
                        }
                        subtitle={hasPinSet()
                            ? '시크릿 페이지에 접근하려면 PIN을 입력하세요'
                            : (isConfirmingPin
                                ? '동일한 PIN을 한 번 더 입력해주세요'
                                : '시크릿 페이지를 보호할 PIN을 설정하세요')
                        }
                        onSubmit={handlePinSubmit}
                        onForgotPin={profile?.email ? handleForgotPin : null}
                    />
                </Content>
            </Container>
        );
    }

    return (
        <Container>
            <Header>
                <HeaderLeft>
                    <BackButton onClick={onClose}>←</BackButton>
                    <Title>🔒 시크릿</Title>
                </HeaderLeft>
                <LockButton onClick={handleLock}>🔒 잠금</LockButton>
            </Header>

            <Content>
                <SearchBar>
                    <SearchInput
                        type="text"
                        placeholder="검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <FilterButton
                        $active={selectedCategory === 'all'}
                        onClick={() => setSelectedCategory('all')}
                    >
                        전체
                    </FilterButton>
                    <FilterButton
                        $active={selectedCategory === 'financial'}
                        onClick={() => setSelectedCategory('financial')}
                    >
                        💰
                    </FilterButton>
                    <FilterButton
                        $active={selectedCategory === 'personal'}
                        onClick={() => setSelectedCategory('personal')}
                    >
                        👤
                    </FilterButton>
                    <FilterButton
                        $active={selectedCategory === 'work'}
                        onClick={() => setSelectedCategory('work')}
                    >
                        💼
                    </FilterButton>
                    <FilterButton
                        $active={selectedCategory === 'diary'}
                        onClick={() => setSelectedCategory('diary')}
                    >
                        📔
                    </FilterButton>
                </SearchBar>

                {filteredDocs.length === 0 ? (
                    <EmptyState>
                        <EmptyIcon>🔒</EmptyIcon>
                        <EmptyText>
                            {docs.length === 0
                                ? '시크릿 문서가 없습니다.\n+ 버튼을 눌러 새 문서를 작성하세요.'
                                : '검색 결과가 없습니다.'}
                        </EmptyText>
                    </EmptyState>
                ) : (
                    <DocsGrid>
                        {filteredDocs.map(doc => (
                            <SecretDocCard
                                key={doc.id}
                                doc={doc}
                                onClick={handleDocClick}
                            />
                        ))}
                    </DocsGrid>
                )}
            </Content>

            <AddButton onClick={() => {
                setEditingDoc(null);
                setIsEditorOpen(true);
            }}>
                +
            </AddButton>

            {isEditorOpen && (
                <SecretDocEditor
                    doc={editingDoc}
                    onClose={() => {
                        setIsEditorOpen(false);
                        setEditingDoc(null);
                    }}
                    onSave={handleSaveDoc}
                    onDelete={handleDeleteDoc}
                />
            )}
        </Container>
    );
};

export default SecretPage;
