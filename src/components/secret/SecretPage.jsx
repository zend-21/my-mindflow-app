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
    width: 100%;
    height: 100%;
    padding: 0;
    background: linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%);
`;

const InnerContent = styled.div`
    padding: 20px 24px;
`;

const SearchBar = styled.div`
    margin-bottom: 16px;
    width: 100%;
`;

const SearchInput = styled.input`
    width: 100%;
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
    font-size: 14px;
    transition: all 0.2s;
    box-sizing: border-box;

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

const FilterBar = styled.div`
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    width: 100%;
`;

const FilterButton = styled.button`
    padding: 8px 4px;
    border-radius: 6px;
    border: 1px solid ${props => {
        if (!props.$active) return 'rgba(255, 255, 255, 0.15)';
        switch(props.$category) {
            case 'all': return '#7fa3ff';
            case 'financial': return '#4caf50';
            case 'personal': return '#ff9800';
            case 'work': return '#2196f3';
            case 'diary': return '#9c27b0';
            default: return 'rgba(255, 255, 255, 0.15)';
        }
    }};
    background: ${props => {
        if (!props.$active) return 'rgba(255, 255, 255, 0.05)';
        switch(props.$category) {
            case 'all': return '#7fa3ff';
            case 'financial': return '#4caf50';
            case 'personal': return '#ff9800';
            case 'work': return '#2196f3';
            case 'diary': return '#9c27b0';
            default: return 'rgba(255, 255, 255, 0.05)';
        }
    }};
    color: ${props => props.$active ? '#ffffff' : '#b0b0b0'};
    font-size: 13px;
    font-weight: ${props => props.$active ? '700' : '500'};
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        background: ${props => {
            if (props.$active) {
                switch(props.$category) {
                    case 'all': return '#7fa3ff';
                    case 'financial': return '#4caf50';
                    case 'personal': return '#ff9800';
                    case 'work': return '#2196f3';
                    case 'diary': return '#9c27b0';
                    default: return 'rgba(255, 255, 255, 0.05)';
                }
            }
            return 'rgba(255, 255, 255, 0.08)';
        }};
        border-color: ${props => {
            if (props.$active) {
                switch(props.$category) {
                    case 'all': return '#7fa3ff';
                    case 'financial': return '#4caf50';
                    case 'personal': return '#ff9800';
                    case 'work': return '#2196f3';
                    case 'diary': return '#9c27b0';
                    default: return 'rgba(255, 255, 255, 0.15)';
                }
            }
            return 'rgba(255, 255, 255, 0.25)';
        }};
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
    bottom: 84px;
    right: 24px;
    width: 80px;
    height: 80px;
    border: none;
    background: transparent;
    cursor: grab;
    z-index: 100;
    user-select: none;
    touch-action: none;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;

    ${props => props.$isDragging && `
        transform: translateY(${props.$offsetY}px) !important;
        cursor: grabbing;
    `}

    ${props => !props.$isDragging && props.$hasBeenDragged && `
        transform: translateY(${props.$offsetY}px);
        transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1);
    `}

    &:active {
        cursor: grabbing;
    }
`;

const MaskIcon = styled.svg`
    width: 70px;
    height: 70px;
    filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3));
    transition: all 0.2s;

    &:hover {
        filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.4));
        transform: scale(1.05);
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

    // 드래그 상태 관리
    const [isDragging, setIsDragging] = useState(false);
    const [offsetY, setOffsetY] = useState(0);
    const [hasBeenDragged, setHasBeenDragged] = useState(false);
    const dragStartY = useRef(0);
    const dragStartOffsetY = useRef(0);

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

    // 드래그 핸들러
    const MAX_DRAG_UP = -150;
    const MIN_DRAG_DOWN = 0;

    const handleDragStart = (e) => {
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        dragStartY.current = clientY;
        dragStartOffsetY.current = offsetY;
        setIsDragging(true);
    };

    const handleDragMove = (e) => {
        if (!isDragging) return;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        const deltaY = clientY - dragStartY.current;
        let newOffsetY = dragStartOffsetY.current + deltaY;

        // 범위 제한
        if (newOffsetY < MAX_DRAG_UP) newOffsetY = MAX_DRAG_UP;
        if (newOffsetY > MIN_DRAG_DOWN) newOffsetY = MIN_DRAG_DOWN;

        setOffsetY(newOffsetY);
        setHasBeenDragged(true);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
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
                <InnerContent>
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
                </InnerContent>
            </Container>
        );
    }

    return (
        <Container>
            <InnerContent>
            <SearchBar>
                <SearchInput
                    type="text"
                    placeholder="검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </SearchBar>

            <FilterBar>
                <FilterButton
                    $active={selectedCategory === 'all'}
                    $category="all"
                    onClick={() => setSelectedCategory('all')}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                        <circle cx="12" cy="12" r="10"/>
                    </svg>
                    전체
                </FilterButton>
                <FilterButton
                    $active={selectedCategory === 'financial'}
                    $category="financial"
                    onClick={() => setSelectedCategory('financial')}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    금융
                </FilterButton>
                <FilterButton
                    $active={selectedCategory === 'personal'}
                    $category="personal"
                    onClick={() => setSelectedCategory('personal')}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    개인
                </FilterButton>
                <FilterButton
                    $active={selectedCategory === 'work'}
                    $category="work"
                    onClick={() => setSelectedCategory('work')}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                    </svg>
                    업무
                </FilterButton>
                <FilterButton
                    $active={selectedCategory === 'diary'}
                    $category="diary"
                    onClick={() => setSelectedCategory('diary')}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                    일기
                </FilterButton>
            </FilterBar>

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
            </InnerContent>

            <AddButton
                $isDragging={isDragging}
                $offsetY={offsetY}
                $hasBeenDragged={hasBeenDragged}
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={handleDragStart}
                onTouchMove={handleDragMove}
                onTouchEnd={handleDragEnd}
                onClick={(e) => {
                    if (!hasBeenDragged || Math.abs(offsetY - dragStartOffsetY.current) < 5) {
                        setEditingDoc(null);
                        setIsEditorOpen(true);
                    }
                }}
            >
                <MaskIcon viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
                    {/* 외곽선 */}
                    <path
                        d="M 100 240 Q 80 200, 80 160 Q 80 100, 120 60 Q 160 20, 220 20 Q 260 20, 280 50 Q 290 70, 290 100 Q 290 160, 250 200 Q 210 220, 170 230 Q 130 240, 100 240 Z"
                        fill="none"
                        stroke="#1a1a1a"
                        strokeWidth="8"
                    />
                    <path
                        d="M 540 240 Q 560 200, 560 160 Q 560 100, 520 60 Q 480 20, 420 20 Q 380 20, 360 50 Q 350 70, 350 100 Q 350 160, 390 200 Q 430 220, 470 230 Q 510 240, 540 240 Z"
                        fill="none"
                        stroke="#1a1a1a"
                        strokeWidth="8"
                    />

                    {/* 마스크 본체 - 왼쪽 */}
                    <path
                        d="M 100 240 Q 80 200, 80 160 Q 80 100, 120 60 Q 160 20, 220 20 Q 260 20, 280 50 Q 290 70, 290 100 Q 290 160, 250 200 Q 210 220, 170 230 Q 130 240, 100 240 Z"
                        fill="#f0f0f0"
                    />

                    {/* 마스크 본체 - 오른쪽 */}
                    <path
                        d="M 540 240 Q 560 200, 560 160 Q 560 100, 520 60 Q 480 20, 420 20 Q 380 20, 360 50 Q 350 70, 350 100 Q 350 160, 390 200 Q 430 220, 470 230 Q 510 240, 540 240 Z"
                        fill="#f0f0f0"
                    />

                    {/* 중앙 연결부 */}
                    <ellipse cx="320" cy="240" rx="40" ry="20" fill="#f0f0f0" stroke="#1a1a1a" strokeWidth="6"/>

                    {/* 왼쪽 눈 구멍 */}
                    <ellipse cx="180" cy="140" rx="40" ry="50" fill="#1a1a1a"/>
                    <ellipse cx="180" cy="140" rx="38" ry="48" fill="#2a2a2a"/>

                    {/* 오른쪽 눈 구멍 */}
                    <ellipse cx="460" cy="140" rx="40" ry="50" fill="#1a1a1a"/>
                    <ellipse cx="460" cy="140" rx="38" ry="48" fill="#2a2a2a"/>

                    {/* 장식 라인들 */}
                    <path d="M 150 80 Q 160 70, 170 65" stroke="#c0c0c0" strokeWidth="3" fill="none"/>
                    <path d="M 490 80 Q 480 70, 470 65" stroke="#c0c0c0" strokeWidth="3" fill="none"/>

                    {/* 반짝이는 포인트 */}
                    <circle cx="140" cy="100" r="8" fill="#ffffff" opacity="0.8"/>
                    <circle cx="500" cy="100" r="8" fill="#ffffff" opacity="0.8"/>
                </MaskIcon>
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
