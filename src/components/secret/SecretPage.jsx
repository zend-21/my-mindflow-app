// src/components/secret/SecretPage.jsx
// 시크릿 페이지 메인 컴포넌트

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import PinInput from './PinInput';
import SecretDocCard from './SecretDocCard';
import SecretDocEditor from './SecretDocEditor';
import PasswordModal from './PasswordModal';
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
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
`;

const InnerContent = styled.div`
    padding: 10px 24px 20px 24px;
    box-sizing: border-box;
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
    margin-bottom: 12px;
    width: 100%;
`;

const SortBar = styled.div`
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    width: 100%;
`;

const SortButton = styled.button`
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid ${props => props.$active ? 'rgba(240, 147, 251, 0.5)' : 'rgba(255, 255, 255, 0.15)'};
    background: ${props => props.$active ? 'rgba(240, 147, 251, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
    color: ${props => props.$active ? '#f093fb' : '#b0b0b0'};
    font-size: 13px;
    font-weight: ${props => props.$active ? '600' : '500'};
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;

    &:hover {
        background: ${props => props.$active ? 'rgba(240, 147, 251, 0.25)' : 'rgba(255, 255, 255, 0.08)'};
        border-color: ${props => props.$active ? 'rgba(240, 147, 251, 0.6)' : 'rgba(255, 255, 255, 0.25)'};
    }
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
    bottom: 104px;
    right: 24px;
    width: 80px;
    height: 80px;
    border: none;
    background: transparent;
    cursor: grab;
    z-index: 10000;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    isolation: isolate;

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

const MaskImage = styled.img`
    width: 70px;
    height: 70px;
    object-fit: contain;
    filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 0 2px #8B0000);
    transition: all 0.2s;

    &:hover {
        filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 0 2px #8B0000);
        transform: scale(1.05);
    }
`;

const PlusIcon = styled.div`
    position: absolute;
    bottom: 5px;
    left: 50%;
    transform: translateX(-50%);
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f093fb, #f5576c);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;

    &::before,
    &::after {
        content: '';
        position: absolute;
        background: white;
    }

    &::before {
        width: 12px;
        height: 2px;
    }

    &::after {
        width: 2px;
        height: 12px;
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
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [pendingDoc, setPendingDoc] = useState(null);
    const [sortBy, setSortBy] = useState('date'); // 'date' or 'importance'
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
    const [showPinRecovery, setShowPinRecovery] = useState(false);

    // 드래그 상태 관리
    const [isDragging, setIsDragging] = useState(false);
    const [offsetY, setOffsetY] = useState(0);
    const [hasBeenDragged, setHasBeenDragged] = useState(false);
    const dragStartY = useRef(0);
    const dragStartOffsetY = useRef(0);
    const addButtonRef = useRef(null);

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
            window.addEventListener('touchstart', handleActivity);
            window.addEventListener('touchmove', handleActivity);

            return () => {
                window.removeEventListener('mousemove', handleActivity);
                window.removeEventListener('keydown', handleActivity);
                window.removeEventListener('click', handleActivity);
                window.removeEventListener('scroll', handleActivity);
                window.removeEventListener('touchstart', handleActivity);
                window.removeEventListener('touchmove', handleActivity);
            };
        }
    }, [isUnlocked]);

    // 컴포넌트 언마운트 시 타이머 및 rAF 정리
    useEffect(() => {
        return () => {
            clearTimeout(longPressTimerRef.current);
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

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

    // 검색, 필터링 및 정렬
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

        // 정렬
        const sorted = [...filtered].sort((a, b) => {
            if (sortBy === 'date') {
                // 등록순 (createdAt 기준)
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            } else if (sortBy === 'importance') {
                // 중요도순
                const importanceA = a.isImportant ? 1 : 0;
                const importanceB = b.isImportant ? 1 : 0;

                if (importanceA !== importanceB) {
                    return sortOrder === 'desc' ? importanceB - importanceA : importanceA - importanceB;
                }

                // 중요도가 같으면 날짜순으로 2차 정렬
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateB - dateA;
            }
            return 0;
        });

        setFilteredDocs(sorted);
    }, [docs, searchQuery, selectedCategory, sortBy, sortOrder]);

    // 문서 클릭
    const handleDocClick = async (doc) => {
        if (doc.hasPassword) {
            setPendingDoc(doc);
            setShowPasswordModal(true);
        } else {
            setEditingDoc(doc);
            setIsEditorOpen(true);
        }
    };

    // 비밀번호 모달 제출
    const handlePasswordSubmit = async (password) => {
        if (!pendingDoc) return false;

        const result = await unlockDoc(currentPin, pendingDoc.id, password);
        if (result.success) {
            setEditingDoc({ ...pendingDoc, content: result.content });
            setIsEditorOpen(true);
            setShowPasswordModal(false);
            setPendingDoc(null);
            return true;
        } else {
            showToast?.(result.message);
            return false;
        }
    };

    // 비밀번호 모달 취소
    const handlePasswordCancel = () => {
        setShowPasswordModal(false);
        setPendingDoc(null);
    };

    // 비밀번호 복구 (PIN 재입력)
    const handleForgotPassword = () => {
        setShowPasswordModal(false);
        setShowPinRecovery(true);
    };

    // PIN 재입력 후 비밀번호 확인
    const handlePinRecovery = async (pin) => {
        const isValid = await verifyPin(pin);
        if (isValid && pendingDoc) {
            // PIN이 맞으면 문서를 복호화하여 바로 열기
            setShowPinRecovery(false);

            const result = await unlockDoc(currentPin, pendingDoc.id, pendingDoc.password);
            if (result.success) {
                setEditingDoc({ ...pendingDoc, content: result.content });
                setIsEditorOpen(true);
                setPendingDoc(null);
            } else {
                showToast?.('문서를 열 수 없습니다.');
                setPendingDoc(null);
            }

            return { success: true };
        } else {
            return { success: false, message: '잘못된 PIN입니다.' };
        }
    };

    // 정렬 버튼 클릭
    const handleSortClick = (type) => {
        if (sortBy === type) {
            // 같은 버튼 클릭 시 오름차순/내림차순 토글
            setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
        } else {
            // 다른 버튼 클릭 시 해당 타입으로 변경하고 내림차순으로 초기화
            setSortBy(type);
            setSortOrder('desc');
        }
    };

    // 카테고리 변경
    const handleCategoryChange = async (docId, newCategory) => {
        try {
            await updateSecretDoc(currentPin, docId, { category: newCategory });
            await loadDocs(currentPin);
            showToast?.('카테고리가 변경되었습니다.');
        } catch (error) {
            console.error('카테고리 변경 오류:', error);
            showToast?.('카테고리 변경에 실패했습니다.');
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

    // 드래그 핸들러 (Pointer API 사용 - FloatingButton과 동일한 로직)
    const MAX_DRAG_UP = -100;
    const MIN_DRAG_DOWN = 0;
    const LONG_PRESS_DURATION = 500; // 0.5초
    const DRAG_THRESHOLD = 10;

    const longPressTimerRef = useRef(null);
    const isLongPressSuccessful = useRef(false);
    const rafRef = useRef(null);
    const latestDragY = useRef(0);

    const handlePointerDown = (e) => {
        e.stopPropagation();

        clearTimeout(longPressTimerRef.current);
        isLongPressSuccessful.current = false;

        try {
            e.target.setPointerCapture(e.pointerId);
        } catch (error) { /* 무시 */ }

        dragStartY.current = e.clientY;
        dragStartOffsetY.current = offsetY;
        latestDragY.current = offsetY;

        longPressTimerRef.current = setTimeout(() => {
            isLongPressSuccessful.current = true;
            setIsDragging(true);
            setHasBeenDragged(true);
        }, LONG_PRESS_DURATION);
    };

    const handlePointerMove = (e) => {
        const deltaY = e.clientY - dragStartY.current;
        let newY = dragStartOffsetY.current + deltaY;

        // 드래그 모드 즉시 진입 (임계값 초과 시)
        if (!isLongPressSuccessful.current && Math.abs(deltaY) > DRAG_THRESHOLD) {
            clearTimeout(longPressTimerRef.current);
            isLongPressSuccessful.current = true;
            setIsDragging(true);
            setHasBeenDragged(true);
        }

        if (!isLongPressSuccessful.current) {
            return;
        }

        // 실시간 범위 제한 (clamping)
        if (newY < MAX_DRAG_UP) {
            newY = MAX_DRAG_UP;
        } else if (newY > MIN_DRAG_DOWN) {
            newY = MIN_DRAG_DOWN;
        }

        latestDragY.current = newY;

        // rAF가 이미 예약되어 있으면 추가 예약 안 함
        if (rafRef.current) {
            return;
        }

        // rAF를 예약하여 다음 프레임에 한 번만 state 업데이트
        rafRef.current = requestAnimationFrame(() => {
            setOffsetY(latestDragY.current);
            rafRef.current = null;
        });
    };

    const handlePointerUp = (e) => {
        e.stopPropagation();

        clearTimeout(longPressTimerRef.current);

        try {
            e.target.releasePointerCapture(e.pointerId);
        } catch (error) { /* 무시 */ }

        if (isLongPressSuccessful.current) {
            // 드래그가 끝났을 때
            setIsDragging(false);

            const finalY = latestDragY.current;

            setOffsetY(() => {
                if (finalY < MAX_DRAG_UP) {
                    return MAX_DRAG_UP;
                } else if (finalY > MIN_DRAG_DOWN) {
                    return MIN_DRAG_DOWN;
                }
                return finalY;
            });
        } else {
            // 클릭으로 간주 (짧게 터치했거나, 500ms 안에 10px 미만 움직임)
            setEditingDoc(null);
            setIsEditorOpen(true);
        }

        isLongPressSuccessful.current = false;
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

            <SortBar>
                <SortButton
                    $active={sortBy === 'date'}
                    onClick={() => handleSortClick('date')}
                >
                    등록순 {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
                </SortButton>
                <SortButton
                    $active={sortBy === 'importance'}
                    onClick={() => handleSortClick('importance')}
                >
                    중요도순 {sortBy === 'importance' && (sortOrder === 'desc' ? '↓' : '↑')}
                </SortButton>
            </SortBar>

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
                                onCategoryChange={handleCategoryChange}
                            />
                        ))}
                    </DocsGrid>
                )}
            </InnerContent>

            <AddButton
                ref={addButtonRef}
                role="button"
                tabIndex="0"
                $isDragging={isDragging}
                $offsetY={offsetY}
                $hasBeenDragged={hasBeenDragged}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                onContextMenu={(e) => e.preventDefault()}
                draggable="false"
            >
                <MaskImage
                    src="/images/secret/mask-gray.svg"
                    alt="Add Secret Document"
                />
                <PlusIcon />
            </AddButton>

            {isEditorOpen && (
                <SecretDocEditor
                    doc={editingDoc}
                    existingDocs={docs}
                    onClose={() => {
                        setIsEditorOpen(false);
                        setEditingDoc(null);
                    }}
                    onSave={handleSaveDoc}
                    onDelete={handleDeleteDoc}
                />
            )}

            {showPasswordModal && (
                <PasswordModal
                    onSubmit={handlePasswordSubmit}
                    onCancel={handlePasswordCancel}
                    onForgotPassword={handleForgotPassword}
                />
            )}

            {showPinRecovery && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%)',
                    zIndex: 10001,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{ width: '100%', maxWidth: '500px' }}>
                        <PinInput
                            pinLength={settings.pinLength}
                            title="PIN 재입력"
                            subtitle="비밀번호 확인을 위해 PIN을 다시 입력하세요"
                            onSubmit={handlePinRecovery}
                        />
                        <button
                            onClick={() => {
                                setShowPinRecovery(false);
                                setShowPasswordModal(true);
                            }}
                            style={{
                                marginTop: '20px',
                                padding: '10px 20px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                color: '#d0d0d0',
                                cursor: 'pointer',
                                width: '100%'
                            }}
                        >
                            뒤로 가기
                        </button>
                    </div>
                </div>
            )}
        </Container>
    );
};

export default SecretPage;
