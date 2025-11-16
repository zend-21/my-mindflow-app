// src/components/secret/SecretPage.jsx
// 시크릿 페이지 메인 컴포넌트

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import PinInput from './PinInput';
import SecretDocCard from './SecretDocCard';
import SecretDocEditor from './SecretDocEditor';
import PasswordInputPage from './PasswordInputPage';
import PinChangeModal from './PinChangeModal';
import CategoryNameEditModal from './CategoryNameEditModal';
import {
    hasPinSet,
    setPin,
    verifyPin,
    changePin,
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
    /* 터치 스크롤 최적화 */
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
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
            case 'financial': return 'rgba(255, 215, 0, 0.5)';
            case 'personal': return 'rgba(167, 139, 250, 0.5)';
            case 'work': return 'rgba(96, 165, 250, 0.5)';
            case 'diary': return 'rgba(244, 114, 182, 0.5)';
            default: return 'rgba(255, 255, 255, 0.15)';
        }
    }};
    background: ${props => {
        if (!props.$active) return 'rgba(255, 255, 255, 0.05)';
        switch(props.$category) {
            case 'all': return '#7fa3ff';
            case 'financial': return 'rgba(255, 215, 0, 0.2)';
            case 'personal': return 'rgba(167, 139, 250, 0.2)';
            case 'work': return 'rgba(96, 165, 250, 0.2)';
            case 'diary': return 'rgba(244, 114, 182, 0.2)';
            default: return 'rgba(255, 255, 255, 0.05)';
        }
    }};
    color: ${props => {
        if (!props.$active) return '#b0b0b0';
        switch(props.$category) {
            case 'all': return '#ffffff';
            case 'financial': return '#FFD700';
            case 'personal': return '#A78BFA';
            case 'work': return '#60A5FA';
            case 'diary': return '#F472B6';
            default: return '#ffffff';
        }
    }};
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
                    case 'financial': return 'rgba(255, 215, 0, 0.3)';
                    case 'personal': return 'rgba(167, 139, 250, 0.3)';
                    case 'work': return 'rgba(96, 165, 250, 0.3)';
                    case 'diary': return 'rgba(244, 114, 182, 0.3)';
                    default: return 'rgba(255, 255, 255, 0.05)';
                }
            }
            return 'rgba(255, 255, 255, 0.08)';
        }};
        border-color: ${props => {
            if (props.$active) {
                switch(props.$category) {
                    case 'all': return '#7fa3ff';
                    case 'financial': return 'rgba(255, 215, 0, 0.6)';
                    case 'personal': return 'rgba(167, 139, 250, 0.6)';
                    case 'work': return 'rgba(96, 165, 250, 0.6)';
                    case 'diary': return 'rgba(244, 114, 182, 0.6)';
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
    padding-bottom: ${props => props.$selectionMode ? '80px' : '20px'};

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

const GuidanceMessage = styled.div`
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(240, 147, 251, 0.3);
    padding: 10px 24px;
    text-align: center;
    margin-top: -10px;
    margin-bottom: 10px;
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 12px;
    font-weight: 300;
`;

const SelectionModeBar = styled.div`
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    padding: 12px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(240, 147, 251, 0.3);
`;

const SelectionInfo = styled.div`
    color: white;
    font-size: 15px;
    font-weight: 600;
`;

const SelectionActions = styled.div`
    display: flex;
    gap: 8px;
`;

const SelectionButton = styled.button`
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.3);
        border-color: rgba(255, 255, 255, 0.5);
    }

    &:active {
        transform: scale(0.95);
    }
`;

const BulkActionBar = styled.div`
    position: fixed;
    bottom: 86px;
    left: 0;
    right: 0;
    background: linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding: 8px 24px;
    display: flex;
    gap: 8px;
    justify-content: space-around;
    align-items: center;
    z-index: 9999;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
    touch-action: none;
    pointer-events: auto;
`;

const BulkActionButton = styled.button`
    flex: 1;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid ${props => {
        switch(props.$type) {
            case 'delete': return 'rgba(255, 107, 107, 0.3)';
            case 'category': return 'rgba(100, 181, 246, 0.3)';
            case 'importance': return 'rgba(255, 193, 7, 0.3)';
            default: return 'rgba(255, 255, 255, 0.15)';
        }
    }};
    background: ${props => {
        switch(props.$type) {
            case 'delete': return 'rgba(255, 107, 107, 0.1)';
            case 'category': return 'rgba(100, 181, 246, 0.1)';
            case 'importance': return 'rgba(255, 193, 7, 0.1)';
            default: return 'rgba(255, 255, 255, 0.05)';
        }
    }};
    color: ${props => {
        switch(props.$type) {
            case 'delete': return '#ff6b6b';
            case 'category': return '#64b5f6';
            case 'importance': return '#ffc107';
            default: return '#ffffff';
        }
    }};
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;

    &:hover {
        background: ${props => {
            switch(props.$type) {
                case 'delete': return 'rgba(255, 107, 107, 0.2)';
                case 'category': return 'rgba(100, 181, 246, 0.2)';
                case 'importance': return 'rgba(255, 193, 7, 0.2)';
                default: return 'rgba(255, 255, 255, 0.08)';
            }
        }};
        border-color: ${props => {
            switch(props.$type) {
                case 'delete': return 'rgba(255, 107, 107, 0.5)';
                case 'category': return 'rgba(100, 181, 246, 0.5)';
                case 'importance': return 'rgba(255, 193, 7, 0.5)';
                default: return 'rgba(255, 255, 255, 0.25)';
            }
        }};
    }

    &:active {
        transform: scale(0.95);
    }
`;

const CategoryModal = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
    padding: 20px;
`;

const CategoryModalContent = styled.div`
    background: linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%);
    border-radius: 16px;
    padding: 24px;
    max-width: 400px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

const CategoryModalTitle = styled.h3`
    color: #ffffff;
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 20px 0;
    text-align: center;
`;

const CategoryGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 16px;
`;

const CategoryOption = styled.button`
    padding: 16px;
    border-radius: 12px;
    border: 2px solid ${props => {
        switch(props.$category) {
            case 'financial': return 'rgba(255, 215, 0, 0.5)';
            case 'personal': return 'rgba(167, 139, 250, 0.5)';
            case 'work': return 'rgba(96, 165, 250, 0.5)';
            case 'diary': return 'rgba(244, 114, 182, 0.5)';
            default: return 'rgba(255, 255, 255, 0.15)';
        }
    }};
    background: ${props => {
        switch(props.$category) {
            case 'financial': return 'rgba(255, 215, 0, 0.1)';
            case 'personal': return 'rgba(167, 139, 250, 0.1)';
            case 'work': return 'rgba(96, 165, 250, 0.1)';
            case 'diary': return 'rgba(244, 114, 182, 0.1)';
            default: return 'rgba(255, 255, 255, 0.05)';
        }
    }};
    color: ${props => {
        switch(props.$category) {
            case 'financial': return '#FFD700';
            case 'personal': return '#A78BFA';
            case 'work': return '#60A5FA';
            case 'diary': return '#F472B6';
            default: return '#ffffff';
        }
    }};
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    &:active {
        transform: scale(0.95);
    }
`;

const ModalCancelButton = styled.button`
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.05);
    color: #d0d0d0;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.25);
    }

    &:active {
        transform: scale(0.98);
    }
`;

const AddButton = styled.div`
    width: 70px;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    border: none;

    position: fixed;
    bottom: 109px;
    right: 29px;
    z-index: 10000;

    user-select: none;
    touch-action: none;
    pointer-events: auto;
    isolation: isolate;

    ${props => props.$isDragging && `
        animation: none !important;
        transform: translateY(${props.$offsetY}px) !important;
        cursor: grabbing;
    `}

    ${props => !props.$isDragging && props.$hasBeenDragged && `
        animation: none !important;
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
    const [showPasswordInputPage, setShowPasswordInputPage] = useState(false);
    const [pendingDoc, setPendingDoc] = useState(null);
    const [sortBy, setSortBy] = useState('date'); // 'date' or 'importance'
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
    const [showPinRecovery, setShowPinRecovery] = useState(false);
    const [showPinChangeModal, setShowPinChangeModal] = useState(false);

    // 다중 선택 모드 상태
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedDocs, setSelectedDocs] = useState([]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // 개별 카드 카테고리 모달 상태 (전역 추적)
    const [openCategoryDropdownId, setOpenCategoryDropdownId] = useState(null);

    // 카테고리 이름 변경 모달
    const [showCategoryNameEdit, setShowCategoryNameEdit] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    // 필터 버튼 길게 누르기
    const filterLongPressTimer = useRef(null);
    const filterLongPressCategory = useRef(null);

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

    // 휴지통에서 비밀글 복원 이벤트 리스너
    useEffect(() => {
        const handleRestoreSecret = async (event) => {
            const restoredDoc = event.detail;

            if (!isUnlocked || !currentPin) {
                console.warn('⚠️ 비밀글 복원 실패: 잠금 상태');
                return;
            }

            try {
                console.log('♻️ 비밀글 복원:', restoredDoc);

                // 복원된 문서를 secretStorage에 추가
                await addSecretDoc(currentPin, restoredDoc);

                // 문서 목록 새로고침
                await loadDocs(currentPin);

                showToast?.('비밀글이 복원되었습니다.');
            } catch (error) {
                console.error('비밀글 복원 오류:', error);
                showToast?.('비밀글 복원에 실패했습니다.');
            }
        };

        window.addEventListener('restoreSecret', handleRestoreSecret);
        return () => window.removeEventListener('restoreSecret', handleRestoreSecret);
    }, [isUnlocked, currentPin]);

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

    // 백그라운드 전환 시 자동 잠금
    useEffect(() => {
        if (!isUnlocked) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                // 백그라운드로 전환되면 즉시 잠금
                handleLock();
                console.log('🔒 백그라운드 전환으로 인한 자동 잠금');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isUnlocked]);

    // 컴포넌트 언마운트 시 타이머 및 rAF 정리, 스크롤 복원
    useEffect(() => {
        return () => {
            clearTimeout(longPressTimerRef.current);
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            // 언마운트 시 body 스크롤 복원
            if (document.body) {
                document.body.style.overflow = '';
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
            setShowPasswordInputPage(true);
        } else {
            setEditingDoc(doc);
            setIsEditorOpen(true);
        }
    };

    // 비밀번호 페이지 제출
    const handlePasswordSubmit = async (password) => {
        if (!pendingDoc) return false;

        const result = await unlockDoc(currentPin, pendingDoc.id, password);
        if (result.success) {
            setEditingDoc({ ...pendingDoc, content: result.content });
            setIsEditorOpen(true);
            setShowPasswordInputPage(false);
            setPendingDoc(null);
            return true;
        } else {
            showToast?.(result.message);
            return false;
        }
    };

    // 비밀번호 페이지 취소
    const handlePasswordCancel = () => {
        setShowPasswordInputPage(false);
        setPendingDoc(null);
    };

    // 비밀번호 복구 (PIN 재입력)
    const handleForgotPassword = () => {
        setShowPasswordInputPage(false);
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

    // 필터 버튼 길게 누르기 핸들러
    const handleFilterPointerDown = (category) => {
        if (category === 'all') return; // '전체'는 수정 불가

        filterLongPressCategory.current = category;
        filterLongPressTimer.current = setTimeout(() => {
            setEditingCategory(category);
            setShowCategoryNameEdit(true);
        }, 500); // 0.5초 길게 누르기
    };

    const handleFilterPointerUp = () => {
        clearTimeout(filterLongPressTimer.current);
        filterLongPressCategory.current = null;
    };

    // 카테고리 이름 저장
    const handleSaveCategoryName = (newName) => {
        const updatedSettings = {
            ...settings,
            categoryNames: {
                ...settings.categoryNames,
                [editingCategory]: newName
            }
        };
        setSettings(updatedSettings);
        saveSettings(updatedSettings);
        setShowCategoryNameEdit(false);
        setEditingCategory(null);
        showToast?.('카테고리 이름이 변경되었습니다.');
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

            // 개별 비밀번호 제거 (휴지통으로 이동 시 리셋)
            const docWithoutPassword = {
                ...doc,
                hasPassword: false,
                passwordHash: undefined
            };

            // 휴지통으로 이동 이벤트 발생
            const event = new CustomEvent('moveToTrash', {
                detail: {
                    id: doc.id,
                    type: 'secret',
                    content: doc.title || '제목 없음',
                    originalData: docWithoutPassword // 비밀번호 없는 버전으로 저장
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
        setSelectionMode(false);
        setSelectedDocs([]);
    };

    // 다중 선택 모드 헬퍼 함수들
    const toggleSelection = (docId) => {
        setSelectedDocs(prev => {
            if (prev.includes(docId)) {
                return prev.filter(id => id !== docId);
            } else {
                return [...prev, docId];
            }
        });
    };

    const toggleSelectAll = () => {
        // 현재 필터된 문서가 모두 선택되어 있으면 해제, 아니면 전체 선택
        const allDocIds = filteredDocs.map(doc => doc.id);
        const allSelected = allDocIds.length > 0 && allDocIds.every(id => selectedDocs.includes(id));

        if (allSelected) {
            setSelectedDocs([]);
        } else {
            setSelectedDocs(allDocIds);
        }
    };

    const exitSelectionMode = () => {
        setSelectionMode(false);
        setSelectedDocs([]);
    };

    const enterSelectionMode = (initialDocId = null) => {
        setSelectionMode(true);
        if (initialDocId) {
            setSelectedDocs([initialDocId]);
        }
    };

    // 일괄 삭제
    const handleBulkDelete = () => {
        if (selectedDocs.length === 0) return;
        setShowDeleteModal(true);
    };

    const confirmBulkDelete = async () => {
        try {
            for (const docId of selectedDocs) {
                const doc = docs.find(d => d.id === docId);
                if (doc) {
                    // 개별 비밀번호 제거 (휴지통으로 이동 시 리셋)
                    const docWithoutPassword = {
                        ...doc,
                        hasPassword: false,
                        passwordHash: undefined
                    };

                    // 휴지통으로 이동 이벤트 발생
                    const event = new CustomEvent('moveToTrash', {
                        detail: {
                            id: doc.id,
                            type: 'secret',
                            content: doc.title || '제목 없음',
                            originalData: docWithoutPassword // 비밀번호 없는 버전으로 저장
                        }
                    });
                    window.dispatchEvent(event);

                    await deleteSecretDoc(currentPin, docId);
                }
            }

            await loadDocs(currentPin);
            showToast?.(`${selectedDocs.length}개의 문서가 삭제되었습니다.`);
            setShowDeleteModal(false);
            exitSelectionMode();
        } catch (error) {
            console.error('일괄 삭제 오류:', error);
            showToast?.('문서 삭제에 실패했습니다.');
            setShowDeleteModal(false);
        }
    };

    // 일괄 카테고리 변경
    const handleBulkCategoryChange = async (newCategory) => {
        if (selectedDocs.length === 0) return;

        try {
            for (const docId of selectedDocs) {
                await updateSecretDoc(currentPin, docId, { category: newCategory });
            }

            await loadDocs(currentPin);
            showToast?.(`${selectedDocs.length}개의 문서 카테고리가 변경되었습니다.`);
            exitSelectionMode();
        } catch (error) {
            console.error('일괄 카테고리 변경 오류:', error);
            showToast?.('카테고리 변경에 실패했습니다.');
        }
    };

    // 일괄 중요도 토글
    const handleBulkImportanceToggle = async () => {
        if (selectedDocs.length === 0) return;

        try {
            // 선택된 문서 중 하나라도 중요하지 않으면 모두 중요로, 모두 중요하면 모두 해제
            const selectedDocObjects = docs.filter(d => selectedDocs.includes(d.id));
            const allImportant = selectedDocObjects.every(d => d.isImportant);
            const newImportance = !allImportant;

            for (const docId of selectedDocs) {
                await updateSecretDoc(currentPin, docId, { isImportant: newImportance });
            }

            await loadDocs(currentPin);
            showToast?.(`${selectedDocs.length}개의 문서가 ${newImportance ? '중요 표시' : '중요 해제'}되었습니다.`);
            exitSelectionMode();
        } catch (error) {
            console.error('일괄 중요도 변경 오류:', error);
            showToast?.('중요도 변경에 실패했습니다.');
        }
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
        // 이벤트 전파 차단 - 배경 스크롤 방지
        e.stopPropagation();
        e.preventDefault();

        // 추가: 드래그 중일 때 body의 스크롤 방지
        if (document.body) {
            document.body.style.overflow = 'hidden';
        }

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
        // 이벤트 전파 차단 - 배경 스크롤 방지
        e.stopPropagation();
        e.preventDefault();

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
        // 이벤트 전파 차단 - 배경 스크롤 방지
        e.stopPropagation();
        e.preventDefault();

        // body 스크롤 복원
        if (document.body) {
            document.body.style.overflow = '';
        }

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

    const handleChangePinClick = () => {
        setShowPinChangeModal(true);
    };

    const handlePinChange = async ({ currentPin, newPin }) => {
        try {
            const result = await changePin(currentPin, newPin);

            if (result.success) {
                showToast?.('PIN이 성공적으로 변경되었습니다.');
                setShowPinChangeModal(false);
            } else {
                showToast?.(result.message || 'PIN 변경에 실패했습니다.');
            }
        } catch (error) {
            console.error('PIN 변경 오류:', error);
            showToast?.('PIN 변경 중 오류가 발생했습니다.');
        }
    };

    if (!isUnlocked) {
        return (
            <>
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
                            onChangePin={hasPinSet() ? handleChangePinClick : null}
                        />
                    </InnerContent>
                </Container>

                {showPinChangeModal && (
                    <PinChangeModal
                        onClose={() => setShowPinChangeModal(false)}
                        onConfirm={handlePinChange}
                        pinLength={settings.pinLength}
                    />
                )}
            </>
        );
    }

    return (
        <>
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
                    onPointerDown={() => handleFilterPointerDown('financial')}
                    onPointerUp={handleFilterPointerUp}
                    onPointerCancel={handleFilterPointerUp}
                    onPointerLeave={handleFilterPointerUp}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    {settings.categoryNames.financial}
                </FilterButton>
                <FilterButton
                    $active={selectedCategory === 'personal'}
                    $category="personal"
                    onClick={() => setSelectedCategory('personal')}
                    onPointerDown={() => handleFilterPointerDown('personal')}
                    onPointerUp={handleFilterPointerUp}
                    onPointerCancel={handleFilterPointerUp}
                    onPointerLeave={handleFilterPointerUp}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    {settings.categoryNames.personal}
                </FilterButton>
                <FilterButton
                    $active={selectedCategory === 'work'}
                    $category="work"
                    onClick={() => setSelectedCategory('work')}
                    onPointerDown={() => handleFilterPointerDown('work')}
                    onPointerUp={handleFilterPointerUp}
                    onPointerCancel={handleFilterPointerUp}
                    onPointerLeave={handleFilterPointerUp}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                    </svg>
                    {settings.categoryNames.work}
                </FilterButton>
                <FilterButton
                    $active={selectedCategory === 'diary'}
                    $category="diary"
                    onClick={() => setSelectedCategory('diary')}
                    onPointerDown={() => handleFilterPointerDown('diary')}
                    onPointerUp={handleFilterPointerUp}
                    onPointerCancel={handleFilterPointerUp}
                    onPointerLeave={handleFilterPointerUp}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                    {settings.categoryNames.diary}
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

            {!selectionMode && docs.length > 0 && (
                <GuidanceMessage>
                    하단의 카드를 길게 누르면 다중 선택 모드가 활성화됩니다
                </GuidanceMessage>
            )}

            {selectionMode && (
                <SelectionModeBar>
                    <SelectionInfo>
                        {selectedDocs.length}개 선택됨
                    </SelectionInfo>
                    <SelectionActions>
                        <SelectionButton onClick={toggleSelectAll}>
                            {filteredDocs.length > 0 && filteredDocs.every(doc => selectedDocs.includes(doc.id))
                                ? '전체해제'
                                : '전체선택'}
                        </SelectionButton>
                        <SelectionButton onClick={exitSelectionMode}>
                            취소
                        </SelectionButton>
                    </SelectionActions>
                </SelectionModeBar>
            )}

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
                    <DocsGrid $selectionMode={selectionMode}>
                        {filteredDocs.map(doc => (
                            <SecretDocCard
                                key={doc.id}
                                doc={doc}
                                settings={settings}
                                onClick={selectionMode ? () => toggleSelection(doc.id) : handleDocClick}
                                onCategoryChange={handleCategoryChange}
                                onLongPress={() => enterSelectionMode(doc.id)}
                                selectionMode={selectionMode}
                                isSelected={selectedDocs.includes(doc.id)}
                                openCategoryDropdownId={openCategoryDropdownId}
                                setOpenCategoryDropdownId={setOpenCategoryDropdownId}
                            />
                        ))}
                    </DocsGrid>
                )}
            </InnerContent>

            {isEditorOpen && (
                <SecretDocEditor
                    doc={editingDoc}
                    existingDocs={docs}
                    settings={settings}
                    onClose={() => {
                        setIsEditorOpen(false);
                        setEditingDoc(null);
                    }}
                    onSave={handleSaveDoc}
                    onDelete={handleDeleteDoc}
                />
            )}

            {showPasswordInputPage && pendingDoc && (
                <PasswordInputPage
                    document={pendingDoc}
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
                                setShowPasswordInputPage(true);
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

            {selectionMode && selectedDocs.length > 0 && (
                <BulkActionBar>
                    <BulkActionButton $type="category" onClick={() => setShowCategoryModal(true)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        </svg>
                        <span>카테고리 이동</span>
                    </BulkActionButton>
                    <BulkActionButton $type="importance" onClick={handleBulkImportanceToggle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        <span>
                            {(() => {
                                const selectedDocObjects = docs.filter(d => selectedDocs.includes(d.id));
                                const allImportant = selectedDocObjects.every(d => d.isImportant);
                                return allImportant ? '중요도 해제' : '중요도 지정';
                            })()}
                        </span>
                    </BulkActionButton>
                    <BulkActionButton $type="delete" onClick={handleBulkDelete}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                        <span>일괄 삭제</span>
                    </BulkActionButton>
                </BulkActionBar>
            )}

            {showCategoryModal && (
                <CategoryModal onClick={() => setShowCategoryModal(false)}>
                    <CategoryModalContent onClick={(e) => e.stopPropagation()}>
                        <CategoryModalTitle>카테고리 선택</CategoryModalTitle>
                        <CategoryGrid>
                            <CategoryOption
                                $category="financial"
                                onClick={() => {
                                    handleBulkCategoryChange('financial');
                                    setShowCategoryModal(false);
                                }}
                            >
                                💰
                                <span>{settings.categoryNames.financial}</span>
                            </CategoryOption>
                            <CategoryOption
                                $category="personal"
                                onClick={() => {
                                    handleBulkCategoryChange('personal');
                                    setShowCategoryModal(false);
                                }}
                            >
                                👤
                                <span>{settings.categoryNames.personal}</span>
                            </CategoryOption>
                            <CategoryOption
                                $category="work"
                                onClick={() => {
                                    handleBulkCategoryChange('work');
                                    setShowCategoryModal(false);
                                }}
                            >
                                💼
                                <span>{settings.categoryNames.work}</span>
                            </CategoryOption>
                            <CategoryOption
                                $category="diary"
                                onClick={() => {
                                    handleBulkCategoryChange('diary');
                                    setShowCategoryModal(false);
                                }}
                            >
                                📔
                                <span>{settings.categoryNames.diary}</span>
                            </CategoryOption>
                        </CategoryGrid>
                        <ModalCancelButton onClick={() => setShowCategoryModal(false)}>
                            취소
                        </ModalCancelButton>
                    </CategoryModalContent>
                </CategoryModal>
            )}

            {showCategoryNameEdit && editingCategory && (
                <CategoryNameEditModal
                    category={editingCategory}
                    currentName={settings.categoryNames[editingCategory]}
                    onSave={handleSaveCategoryName}
                    onClose={() => {
                        setShowCategoryNameEdit(false);
                        setEditingCategory(null);
                    }}
                />
            )}

            {showDeleteModal && (
                <CategoryModal onClick={() => setShowDeleteModal(false)}>
                    <CategoryModalContent onClick={(e) => e.stopPropagation()}>
                        <CategoryModalTitle>일괄 삭제</CategoryModalTitle>
                        <div style={{
                            color: '#d0d0d0',
                            fontSize: '14px',
                            textAlign: 'center',
                            margin: '20px 0',
                            lineHeight: '1.6'
                        }}>
                            선택한 <span style={{ color: '#f093fb', fontWeight: 'bold' }}>{selectedDocs.length}개</span>의 문서를<br/>
                            삭제하시겠습니까?
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <ModalCancelButton onClick={() => setShowDeleteModal(false)}>
                                취소
                            </ModalCancelButton>
                            <ModalCancelButton
                                onClick={confirmBulkDelete}
                                style={{
                                    background: 'rgba(255, 107, 107, 0.2)',
                                    borderColor: 'rgba(255, 107, 107, 0.3)',
                                    color: '#ff6b6b'
                                }}
                            >
                                삭제
                            </ModalCancelButton>
                        </div>
                    </CategoryModalContent>
                </CategoryModal>
            )}
        </Container>

        {!isEditorOpen && !showPasswordInputPage && createPortal(
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
                onContextMenu={(e) => e.preventDefault()}
                draggable="false"
            >
                <MaskImage
                    src="/images/secret/mask-gray.svg"
                    alt="Add Secret Document"
                />
                <PlusIcon />
            </AddButton>,
            document.body
        )}
        </>
    );
};

export default SecretPage;
