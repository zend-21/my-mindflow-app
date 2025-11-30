// src/components/secret/SecretPage.jsx
// 시크릿 페이지 메인 컴포넌트

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import PinInput from './PinInput';
import SecretDocCard from './SecretDocCard';
import SecretDocEditor from './SecretDocEditor';
import SecretDocViewer from './SecretDocViewer';
import PasswordInputPage from './PasswordInputPage';
import PinChangeModal from './PinChangeModal';
import EmailConfirmModal from './EmailConfirmModal';
import CategoryNameEditModal from './CategoryNameEditModal';
import TempPinDisplayModal from './TempPinDisplayModal';
import { ALL_ICONS } from './categoryIcons';
import {
    hasPinSet,
    setPin,
    verifyPin,
    changePin,
    resetPin,
    getAllSecretDocs,
    addSecretDoc,
    updateSecretDoc,
    deleteSecretDoc,
    searchSecretDocs,
    setDocPassword,
    unlockDoc,
    removeDocPassword,
    getSettings,
    saveSettings,
    cleanupPermanentlyDeletedDocs
} from '../../utils/secretStorage';
import { sendTempPinEmail } from '../../utils/emailService';
import { fetchSecretDocsMetadata } from '../../services/userDataService';

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
    padding: 0px 24px 15px 24px;
    box-sizing: border-box;
    margin-top: -5px;
`;

const TitleWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
`;

const PageTitle = styled.div`
    font-size: 16px;
    color: rgba(255, 255, 255, 0.6);
    font-weight: 500;
    letter-spacing: 0.3px;
`;

const AddDocButton = styled.button`
    background-color: transparent;
    border: none;
    font-size: 28px;
    cursor: pointer;
    color: #f093fb;
    transition: transform 0.2s ease;
    &:hover {
        transform: rotate(90deg);
    }
    width: 40px;
    height: 40px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const SearchBar = styled.div`
    margin-bottom: 16px;
    width: 100%;
    position: relative;
`;

const SearchIcon = styled.div`
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: #808080;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
`;

const SearchInput = styled.input`
    width: 100%;
    padding: 12px 16px 12px 44px;
    border-radius: 12px;
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

const SecretPage = ({ onClose, profile, showToast, setShowHeader }) => {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [currentPin, setCurrentPin] = useState('');
    const [docs, setDocs] = useState([]);
    const [filteredDocs, setFilteredDocs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isLoadingDocs, setIsLoadingDocs] = useState(false);
    const [docCount, setDocCount] = useState(0);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [viewingDoc, setViewingDoc] = useState(null);
    const containerRef = useRef(null);
    const lastScrollY = useRef(0);
    const [settings, setSettings] = useState({
        pinLength: 6,
        autoLockMinutes: 5,
        emailNotifications: false,
        categoryNames: {
            financial: '금융',
            personal: '개인',
            work: '업무',
            diary: '일기'
        },
        categoryIcons: {
            financial: 'dollar',
            personal: 'user',
            work: 'briefcase',
            diary: 'book'
        }
    });
    const [isConfirmingPin, setIsConfirmingPin] = useState(false);
    const [firstPin, setFirstPin] = useState('');
    const [showPasswordInputPage, setShowPasswordInputPage] = useState(false);
    const [pendingDoc, setPendingDoc] = useState(null);
    const [sortBy, setSortBy] = useState('date'); // 'date' or 'importance'
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
    const [showPinRecovery, setShowPinRecovery] = useState(false);
    const [showPinChangeModal, setShowPinChangeModal] = useState(false);
    const [isTempPinLogin, setIsTempPinLogin] = useState(false); // 임시 PIN 로그인 플래그
    const [isSettingNewPin, setIsSettingNewPin] = useState(false); // 임시 PIN 입력 후 새 PIN 설정 중
    const [tempPinValue, setTempPinValue] = useState(''); // 임시 PIN 값 저장
    const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);
    const [pendingEmailData, setPendingEmailData] = useState(null);
    const [showTempPinModal, setShowTempPinModal] = useState(false); // 임시 PIN 표시 모달
    const [displayTempPin, setDisplayTempPin] = useState(''); // 모달에 표시할 임시 PIN

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

    // PIN 설정 여부 state
    const [pinIsSet, setPinIsSet] = useState(false);
    const [checkingPin, setCheckingPin] = useState(true);

    // 카테고리 아이콘 SVG 경로 가져오기
    const getCategoryIconPath = (category) => {
        const iconId = settings?.categoryIcons?.[category];
        if (!iconId) return ALL_ICONS[0]?.svg; // iconId가 없으면 첫 번째 아이콘 사용
        const icon = ALL_ICONS.find(i => i.id === iconId);
        return icon?.svg || ALL_ICONS[0]?.svg;
    };

    // PIN 설정 초기 확인
    useEffect(() => {
        if (!profile) {
            showToast?.('로그인이 필요합니다.');
            onClose();
        }
    }, [profile, onClose, showToast]);

    // PIN 설정 여부 확인
    useEffect(() => {
        const checkPinStatus = async () => {
            try {
                setCheckingPin(true);
                const isSet = await hasPinSet();
                setPinIsSet(isSet);
            } catch (error) {
                console.error('PIN 상태 확인 실패:', error);
                setPinIsSet(false);
            } finally {
                setCheckingPin(false);
            }
        };

        checkPinStatus();
    }, []);

    // 설정 불러오기
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const loadedSettings = await getSettings();
                // 강제로 pinLength를 6으로 설정
                if (loadedSettings.pinLength !== 6) {
                    const updatedSettings = { ...loadedSettings, pinLength: 6 };
                    await saveSettings(updatedSettings);
                    setSettings(updatedSettings);
                } else {
                    setSettings(loadedSettings);
                }
            } catch (error) {
                console.error('설정 불러오기 실패:', error);
            }
        };

        loadSettings();
    }, []);

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

    // 🔓 언락 시 임시 저장된 Draft 복원
    useEffect(() => {
        if (!isUnlocked || !profile?.userId) return;

        try {
            const draftKey = `secretDocDraft_${profile.userId}`;
            const savedDraft = localStorage.getItem(draftKey);

            if (savedDraft) {
                const draftData = JSON.parse(savedDraft);

                // 24시간 이내의 Draft만 복원 (오래된 Draft는 무시)
                const hoursSinceCreated = (Date.now() - draftData.timestamp) / (1000 * 60 * 60);

                if (hoursSinceCreated < 24 && draftData.isEditorOpen) {
                    console.log('📂 임시 저장된 문서 복원:', draftData);
                    setEditingDoc(draftData.editingDoc);
                    setIsEditorOpen(true);
                } else {
                    // 오래된 Draft는 삭제
                    localStorage.removeItem(draftKey);
                    console.log('🗑️ 오래된 Draft 삭제');
                }
            }
        } catch (error) {
            console.error('Draft 복원 실패:', error);
        }
    }, [isUnlocked, profile?.userId]);

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
            // 임시 PIN 입력 후 새 PIN 설정 중
            if (isSettingNewPin) {
                if (pin.length !== settings.pinLength) {
                    return { success: false, message: `${settings.pinLength}자리 PIN을 입력해주세요.` };
                }

                // 임시 PIN과 동일한지 확인
                if (pin === tempPinValue) {
                    return { success: false, message: '임시 PIN과 다른 번호를 입력해주세요.' };
                }

                if (!isConfirmingPin) {
                    // 첫 번째 새 PIN 입력
                    setFirstPin(pin);
                    setIsConfirmingPin(true);
                    return { success: true };
                } else {
                    // 두 번째 새 PIN 입력 - 일치 확인
                    if (firstPin !== pin) {
                        setIsConfirmingPin(false);
                        setFirstPin('');
                        return { success: false, message: 'PIN이 일치하지 않습니다. 다시 설정해주세요.' };
                    }

                    // 새 PIN 저장
                    await setPin(pin);
                    setCurrentPin(pin);

                    // 임시 PIN 데이터 삭제
                    if (profile?.email) {
                        const tempPinKey = `tempPin_${profile.email}`;
                        localStorage.removeItem(tempPinKey);
                    }

                    // 시크릿 페이지 진입
                    setIsUnlocked(true);
                    setIsSettingNewPin(false);
                    setIsConfirmingPin(false);
                    setFirstPin('');
                    setTempPinValue('');

                    await loadDocs(pin);
                    showToast?.('새로운 PIN이 설정되었습니다.');
                    return { success: true };
                }
            }

            if (!pinIsSet) {
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
                    setPinIsSet(true); // PIN 설정 상태 업데이트
                    setCurrentPin(pin);
                    setIsUnlocked(true);
                    setIsConfirmingPin(false);
                    setFirstPin('');
                    showToast?.('PIN이 설정되었습니다.');
                    return { success: true };
                }
            }

            // 임시 PIN 만료 체크 (정규 PIN 검증 전에)
            if (profile?.email) {
                const tempPinKey = `tempPin_${profile.email}`;
                const tempPinDataStr = localStorage.getItem(tempPinKey);

                if (tempPinDataStr) {
                    const tempPinData = JSON.parse(tempPinDataStr);
                    const now = Date.now();

                    // 시간 만료 확인
                    if (now > tempPinData.expiresAt) {
                        // 만료된 임시 PIN 삭제 및 PIN 리셋
                        localStorage.removeItem(tempPinKey);
                        localStorage.removeItem('tempPinSent');
                        window.dispatchEvent(new Event('tempPinStatusChanged'));
                        resetPin();
                        return {
                            success: false,
                            message: '임시 PIN이 24시간 경과로 만료되어 사용할 수 없습니다.\n\n하단의 "PIN 번호를 분실하셨나요?" 버튼을 눌러\n새로운 임시 PIN을 발급받고,\n발급받은 임시 PIN을 24시간 이내에 입력해주세요.'
                        };
                    }
                }
            }

            // 정규 PIN 검증
            const isValid = await verifyPin(pin);
            if (isValid) {
                // 임시 PIN인지 확인
                if (profile?.email) {
                    const tempPinKey = `tempPin_${profile.email}`;
                    const tempPinDataStr = localStorage.getItem(tempPinKey);

                    if (tempPinDataStr) {
                        const tempPinData = JSON.parse(tempPinDataStr);

                        // 입력한 PIN이 임시 PIN과 일치하면
                        if (pin === tempPinData.pin) {
                            // 임시 PIN 발송 플래그 제거
                            localStorage.removeItem('tempPinSent');
                            window.dispatchEvent(new Event('tempPinStatusChanged'));

                            // 새 PIN 설정 모드로 전환 (시크릿 페이지 진입 X)
                            setTempPinValue(pin);
                            setIsSettingNewPin(true);
                            setIsConfirmingPin(false);
                            setFirstPin('');

                            return { success: true };
                        }
                    }
                }

                // 일반 PIN 로그인 (임시 PIN이 아님)
                setCurrentPin(pin);
                setIsUnlocked(true);
                await loadDocs(pin);
                return { success: true };
            }

            return { success: false, message: '잘못된 PIN입니다.' };
        } catch (error) {
            console.error('PIN 처리 오류:', error);
            return { success: false, message: '오류가 발생했습니다.' };
        }
    };

    // 문서 로드 (메타데이터 우선 + 점진적 로딩)
    const loadDocs = async (pin) => {
        try {
            setIsLoadingDocs(true);

            // 1. 메타데이터 먼저 가져오기 (문서 개수만)
            if (profile?.userId) {
                const metadata = await fetchSecretDocsMetadata(profile.userId);
                setDocCount(metadata.count || 0);
            }

            // 2. 영구 삭제 대기 문서 자동 정리 (PIN 권한으로)
            await cleanupPermanentlyDeletedDocs(pin);

            // 3. 문서 전체 로드 (백그라운드)
            const allDocs = await getAllSecretDocs(pin);

            // 4. 점진적 렌더링: 첫 5개만 먼저 표시
            const BATCH_SIZE = 5;
            if (allDocs.length > BATCH_SIZE) {
                // 첫 5개 먼저 표시
                setDocs(allDocs.slice(0, BATCH_SIZE));
                setFilteredDocs(allDocs.slice(0, BATCH_SIZE));

                // 나머지는 다음 프레임에 추가
                setTimeout(() => {
                    setDocs(allDocs);
                    setFilteredDocs(allDocs);
                    setIsLoadingDocs(false);
                }, 0);
            } else {
                // 5개 이하면 전부 표시
                setDocs(allDocs);
                setFilteredDocs(allDocs);
                setIsLoadingDocs(false);
            }
        } catch (error) {
            console.error('문서 로드 오류:', error);
            showToast?.('문서를 불러올 수 없습니다.');
            setIsLoadingDocs(false);
        }
    };

    // 스크롤 기반 헤더 숨김/표시
    useEffect(() => {
        if (!isUnlocked) return; // PIN 입력 전에는 실행하지 않음

        const scrollContainer = containerRef.current;
        if (!scrollContainer) return;

        const handleScroll = () => {
            const currentScrollY = scrollContainer.scrollTop;

            // 최상단(50px 이하)에 있으면 헤더 표시
            if (currentScrollY <= 50) {
                setShowHeader?.(true);
            }
            // 그 외의 경우 헤더 숨김
            else {
                setShowHeader?.(false);
            }

            lastScrollY.current = currentScrollY;
        };

        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            scrollContainer.removeEventListener('scroll', handleScroll);
            setShowHeader?.(true);
        };
    }, [isUnlocked, setShowHeader]);

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

    // 문서 클릭 - 읽기 모드 먼저 열기
    const handleDocClick = async (doc) => {
        if (doc.hasPassword) {
            setPendingDoc(doc);
            setShowPasswordInputPage(true);
        } else {
            setViewingDoc(doc);
            setIsViewerOpen(true);
        }
    };

    // 비밀번호 페이지 제출 - 읽기 모드로 열기
    const handlePasswordSubmit = async (password) => {
        if (!pendingDoc) return false;

        const result = await unlockDoc(currentPin, pendingDoc.id, password);
        if (result.success) {
            setViewingDoc({ ...pendingDoc, content: result.content });
            setIsViewerOpen(true);
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

    // 읽기 모드에서 편집 버튼 클릭
    const handleViewerEdit = (doc) => {
        console.log('🔵 handleViewerEdit 호출됨:', {
            전달받은문서: { id: doc?.id, title: doc?.title },
            현재viewing문서: { id: viewingDoc?.id, title: viewingDoc?.title }
        });
        setEditingDoc(doc);
        setIsEditorOpen(true);
        // isViewerOpen과 viewingDoc은 유지 - 편집창 위에 레이어됨
    };

    // 읽기 모드 닫기
    const handleViewerClose = () => {
        setIsViewerOpen(false);
        setViewingDoc(null);
    };

    // 읽기 모드 네비게이션 (스와이프)
    const handleViewerNavigate = (newDoc) => {
        setViewingDoc(newDoc);
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
            // PIN이 맞으면 문서를 복호화하여 읽기 모드로 열기
            setShowPinRecovery(false);

            const result = await unlockDoc(currentPin, pendingDoc.id, pendingDoc.password);
            if (result.success) {
                setViewingDoc({ ...pendingDoc, content: result.content });
                setIsViewerOpen(true);
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

    // 카테고리 이름 및 아이콘 저장
    const handleSaveCategoryName = async (newName, newIcon) => {
        const updatedSettings = {
            ...settings,
            categoryNames: {
                ...settings.categoryNames,
                [editingCategory]: newName
            },
            categoryIcons: {
                ...settings.categoryIcons,
                [editingCategory]: newIcon
            }
        };
        setSettings(updatedSettings);
        await saveSettings(updatedSettings);
        setShowCategoryNameEdit(false);
        setEditingCategory(null);
        showToast?.('카테고리가 변경되었습니다.');
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

    // 🗑️ Draft 삭제 헬퍼 함수
    const clearDraft = () => {
        try {
            const draftKey = `secretDocDraft_${profile?.userId}`;
            localStorage.removeItem(draftKey);
            console.log('🗑️ Draft 삭제 완료');
        } catch (error) {
            console.error('Draft 삭제 실패:', error);
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

    // 문서 저장 (낙관적 업데이트)
    const handleSaveDoc = async (docData) => {
        // 1. 이전 상태 백업
        const previousDocs = [...docs];
        const previousFilteredDocs = [...filteredDocs];

        try {
            if (editingDoc) {
                // === 업데이트 케이스 ===
                // 2. 낙관적 UI 업데이트 (수정)
                const updatedDoc = { ...editingDoc, ...docData, updatedAt: new Date().toISOString() };
                setDocs(prev => prev.map(d => d.id === editingDoc.id ? updatedDoc : d));
                setFilteredDocs(prev => prev.map(d => d.id === editingDoc.id ? updatedDoc : d));

                // ✅ viewingDoc 즉시 업데이트 (편집 모드 닫기 전)
                setViewingDoc(updatedDoc);

                // 편집 모드 닫기
                setIsEditorOpen(false);
                setEditingDoc(null);
                clearDraft();
                showToast?.('문서가 수정되었습니다.');

                // 3. 개별 비밀번호가 있으면 먼저 설정
                if (docData.hasPassword && docData.password) {
                    console.log('🔐 개별 비밀번호 설정 시작 (수정)');
                    await setDocPassword(currentPin, editingDoc.id, docData.password);
                } else if (!docData.hasPassword && editingDoc.hasPassword) {
                    // 비밀번호 해제: 기존 암호화된 내용을 평문으로 복원
                    console.log('🔓 개별 비밀번호 해제 (수정)');
                    const { password, hasPassword, passwordHash, isContentEncrypted, ...updates } = docData;
                    // content는 이미 편집 폼에서 복호화된 상태, preview 재생성
                    const preview = updates.content ? updates.content.substring(0, 100) : '';
                    await updateSecretDoc(currentPin, editingDoc.id, {
                        ...updates,
                        preview,
                        hasPassword: false,
                        passwordHash: null,
                        isContentEncrypted: false
                    });
                } else {
                    // 비밀번호 없음: 일반 업데이트
                    const { password, ...updates } = docData;
                    await updateSecretDoc(currentPin, editingDoc.id, updates);
                }

                // ✅ 저장 후 문서 다시 로드
                const allDocs = await getAllSecretDocs(currentPin);
                setDocs(allDocs);
                setFilteredDocs(allDocs);

                // 업데이트된 문서 찾기
                const freshDoc = allDocs.find(d => d.id === editingDoc.id);
                if (freshDoc) {
                    setViewingDoc(freshDoc);
                }
            } else {
                // === 새 문서 케이스 ===
                // 2. 임시 ID로 낙관적 UI 업데이트
                const tempId = `temp_${Date.now()}`;
                const tempDoc = {
                    id: tempId,
                    ...docData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                setDocs(prev => [tempDoc, ...prev]);
                setFilteredDocs(prev => [tempDoc, ...prev]);
                setIsEditorOpen(false);
                setEditingDoc(null);
                clearDraft();
                showToast?.('문서가 추가되었습니다.');

                // 3. 백그라운드에서 실제 저장 (password 필드 제외)
                const { password, ...docDataWithoutPassword } = docData;
                const newDoc = await addSecretDoc(currentPin, docDataWithoutPassword);

                // 개별 비밀번호 설정
                if (docData.hasPassword && docData.password) {
                    console.log('🔐 개별 비밀번호 설정 시작 (신규)');
                    await setDocPassword(currentPin, newDoc.id, docData.password);

                    // ✅ 비밀번호 설정 후 업데이트된 문서 다시 로드
                    const allDocs = await getAllSecretDocs(currentPin);
                    setDocs(allDocs);
                    setFilteredDocs(allDocs);
                } else {
                    // 4. 임시 문서를 실제 문서로 교체 (비밀번호 없는 경우만)
                    setDocs(prev => prev.map(d => d.id === tempId ? newDoc : d));
                    setFilteredDocs(prev => prev.map(d => d.id === tempId ? newDoc : d));
                }
            }
        } catch (error) {
            // 5. 실패 시 롤백
            console.error('문서 저장 오류:', error);
            setDocs(previousDocs);
            setFilteredDocs(previousFilteredDocs);
            showToast?.('문서 저장에 실패했습니다. 다시 시도해주세요.');
        }
    };

    // 문서 삭제 (낙관적 업데이트)
    const handleDeleteDoc = async (docId) => {
        const doc = docs.find(d => d.id === docId);
        if (!doc) return;

        // 1. 이전 상태 백업
        const previousDocs = [...docs];
        const previousFilteredDocs = [...filteredDocs];

        // 2. 즉시 UI 업데이트 (낙관적)
        setDocs(prev => prev.filter(d => d.id !== docId));
        setFilteredDocs(prev => prev.filter(d => d.id !== docId));
        setIsEditorOpen(false);
        setEditingDoc(null);
        setIsViewerOpen(false);
        setViewingDoc(null);
        clearDraft();

        try {
            // 3. 백그라운드에서 실제 삭제
            // 개별 비밀번호 제거 (휴지통으로 이동 시 리셋)
            const docWithoutPassword = {
                ...doc,
                hasPassword: false,
                passwordHash: null // Firestore는 undefined를 허용하지 않음
            };

            // 휴지통으로 이동 이벤트 발생
            const event = new CustomEvent('moveToTrash', {
                detail: {
                    id: doc.id,
                    type: 'secret',
                    content: doc.title || '제목 없음',
                    originalData: docWithoutPassword
                }
            });
            window.dispatchEvent(event);

            // 시크릿 스토리지에서 삭제
            await deleteSecretDoc(currentPin, docId);

            // 4. 성공 토스트
            showToast?.('문서가 삭제되었습니다.');
        } catch (error) {
            // 5. 실패 시 롤백
            console.error('문서 삭제 오류:', error);
            setDocs(previousDocs);
            setFilteredDocs(previousFilteredDocs);
            showToast?.('문서 삭제에 실패했습니다. 다시 시도해주세요.');
        }
    };

    // 잠금
    const handleLock = () => {
        // 🔐 작성 중인 문서가 있으면 localStorage에 임시 저장
        if (editingDoc || isEditorOpen) {
            try {
                const draftKey = `secretDocDraft_${profile?.userId}`;
                const draftData = {
                    editingDoc,
                    isEditorOpen,
                    timestamp: Date.now()
                };
                localStorage.setItem(draftKey, JSON.stringify(draftData));
                console.log('💾 작성 중인 문서 임시 저장:', draftData);
            } catch (error) {
                console.error('Draft 저장 실패:', error);
            }
        }

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
                        passwordHash: null // Firestore는 undefined를 허용하지 않음
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
    const handleForgotPin = async () => {
        if (!profile?.email) {
            showToast?.('이메일 정보가 없습니다.');
            return;
        }

        // 하루 1회 제한 체크 (임시 PIN 발송 제한)
        const ENABLE_RATE_LIMIT = false; // TODO: 배포 시 true로 변경
        const lastSentKey = `tempPin_lastSent_${profile.email}`;

        if (ENABLE_RATE_LIMIT) {
            const lastSentTime = localStorage.getItem(lastSentKey);

            if (lastSentTime) {
                const now = Date.now();
                const timeSinceLastSent = now - parseInt(lastSentTime, 10);
                const oneDay = 24 * 60 * 60 * 1000; // 24시간 (밀리초)

                if (timeSinceLastSent < oneDay) {
                    const remainingTime = oneDay - timeSinceLastSent;
                    const remainingHours = Math.ceil(remainingTime / (60 * 60 * 1000));
                    showToast?.(`임시 PIN은 하루에 한 번만 요청할 수 있습니다.\n약 ${remainingHours}시간 후 다시 시도해주세요.`);
                    return;
                }
            }
        }

        // 마스킹된 이메일 표시
        const maskedEmail = profile.email.replace(/(.{3})(.*)(@.*)/, (_, start, middle, domain) => {
            return start + '*'.repeat(Math.min(middle.length, 7)) + domain;
        });

        // 이메일 데이터 저장 및 모달 표시
        setPendingEmailData({ email: profile.email, maskedEmail, lastSentKey });
        setShowEmailConfirmModal(true);
    };

    // 이메일 전송 확인 핸들러
    const handleEmailConfirm = async () => {
        setShowEmailConfirmModal(false);

        if (!pendingEmailData) return;

        const { email, maskedEmail, lastSentKey } = pendingEmailData;

        // 임시 PIN 생성 (6자리)
        const tempPin = Math.floor(100000 + Math.random() * 900000).toString();

        // 24시간 유효 시간 설정
        const now = Date.now();
        const expiresAt = now + (24 * 60 * 60 * 1000); // 24시간 후

        // 기존 PIN 리셋
        resetPin();

        // 임시 PIN을 실제 PIN으로 설정
        await setPin(tempPin);

        // localStorage에 임시 PIN 만료 정보 저장 (만료 체크용)
        const tempPinKey = `tempPin_${email}`;
        localStorage.setItem(tempPinKey, JSON.stringify({
            pin: tempPin,
            createdAt: now,
            expiresAt: expiresAt
        }));

        // 마지막 발송 시간 저장
        localStorage.setItem(lastSentKey, now.toString());

        // 이메일 발송
        showToast?.('임시 PIN을 생성하는 중입니다...');

        const emailResult = await sendTempPinEmail(email, tempPin, expiresAt);

        if (emailResult.success) {
            // 30분 잠금 해제 (임시 PIN으로 로그인 가능하도록)
            localStorage.removeItem('secretPageLock');
            // 커스텀 이벤트 발생 (PinInput 컴포넌트에 알림)
            window.dispatchEvent(new Event('localStorageChanged'));

            // 임시 PIN 발송 플래그 설정
            localStorage.setItem('tempPinSent', 'true');
            window.dispatchEvent(new Event('tempPinStatusChanged'));

            // 개발 모드 메시지 확인
            const isDev = emailResult.message.includes('개발 모드');
            if (isDev) {
                // 테스트 모드: 화면 모달로 임시 PIN 표시
                setDisplayTempPin(tempPin);
                setShowTempPinModal(true);
            } else {
                showToast?.(`✅ 임시 PIN이 ${maskedEmail}로 전송되었습니다.\n\n이메일을 확인해주세요.`, 5000);
            }
        } else {
            // 이메일 발송 실패
            alert(`⚠️ 이메일 발송에 실패했습니다.\n\n에러: ${emailResult.message}\n\n관리자에게 문의하세요.`);
        }

        // 데이터 정리
        setPendingEmailData(null);
    };

    // 이메일 전송 취소 핸들러
    const handleEmailCancel = () => {
        setShowEmailConfirmModal(false);
        setPendingEmailData(null);
    };

    const handleChangePinClick = () => {
        setShowPinChangeModal(true);
    };

    const handlePinChange = async ({ currentPin, newPin }) => {
        try {
            const result = await changePin(currentPin, newPin);

            if (result.success) {
                // 임시 PIN 로그인 모드였다면 임시 PIN 및 관련 데이터 삭제
                if (isTempPinLogin && profile?.email) {
                    const tempPinKey = `tempPin_${profile.email}`;
                    localStorage.removeItem(tempPinKey);
                    localStorage.removeItem('tempPinSent');
                    window.dispatchEvent(new Event('tempPinStatusChanged'));
                    setIsTempPinLogin(false);
                }

                setShowPinChangeModal(false);

                // 🔓 새로운 PIN으로 자동 언락 (시크릿 페이지 진입)
                setCurrentPin(newPin);
                setIsUnlocked(true);

                // 시크릿 페이지가 열린 후 토스트 표시
                setTimeout(() => {
                    showToast?.('PIN이 성공적으로 변경되었습니다.');
                }, 300);
            } else {
                // 실패 시 모달 내부에서 에러 표시하도록 result 반환
                return result;
            }
        } catch (error) {
            console.error('PIN 변경 오류:', error);
            return { success: false, message: 'PIN 변경 중 오류가 발생했습니다.' };
        }
    };

    if (!isUnlocked) {
        return createPortal(
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(10px)',
                zIndex: 20000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                paddingTop: window.innerWidth <= 768 ? '130px' : '20px' // 모바일만 130px 상단 여백
            }}>
                {/* 닫기 버튼 */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: window.innerWidth <= 768 ? '40px' : 'max(20px, calc(env(safe-area-inset-top, 0px) + 10px))', // 모바일은 40px, PC는 기존 방식
                        right: '20px',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        fontSize: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        zIndex: 20001
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    ×
                </button>

                <div style={{ width: '100%', maxWidth: '500px' }}>
                    <PinInput
                        pinLength={settings.pinLength}
                        title={isSettingNewPin
                            ? (isConfirmingPin ? '새 PIN 확인' : '새 PIN 설정')
                            : (pinIsSet
                                ? 'PIN 입력'
                                : (isConfirmingPin ? 'PIN 확인' : 'PIN 설정'))
                        }
                        subtitle={isSettingNewPin
                            ? (isConfirmingPin
                                ? '동일한 PIN을 한 번 더 입력해주세요'
                                : '임시 PIN과 다른 새로운 PIN을 설정하세요')
                            : (pinIsSet
                                ? '시크릿 페이지에 접근하려면 PIN을 입력하세요'
                                : (isConfirmingPin
                                    ? '동일한 PIN을 한 번 더 입력해주세요'
                                    : '시크릿 페이지를 보호할 PIN을 설정하세요'))
                        }
                        onSubmit={handlePinSubmit}
                        onForgotPin={profile?.email && !isSettingNewPin ? handleForgotPin : null}
                        onChangePin={pinIsSet && !isSettingNewPin ? handleChangePinClick : null}
                        isSettingNewPin={isSettingNewPin}
                    />
                </div>

                {showPinChangeModal && (
                    <PinChangeModal
                        onClose={() => setShowPinChangeModal(false)}
                        onConfirm={handlePinChange}
                        pinLength={settings.pinLength}
                        forcedMode={isTempPinLogin} // 임시 PIN 로그인 시 강제 모드
                    />
                )}

                {showEmailConfirmModal && pendingEmailData && (
                    <EmailConfirmModal
                        email={pendingEmailData.email}
                        maskedEmail={pendingEmailData.maskedEmail}
                        onConfirm={handleEmailConfirm}
                        onCancel={handleEmailCancel}
                    />
                )}

                {showTempPinModal && (
                    <TempPinDisplayModal
                        tempPin={displayTempPin}
                        onClose={() => setShowTempPinModal(false)}
                    />
                )}
            </div>,
            document.body
        );
    }

    return (
        <>
        <Container ref={containerRef}>
            <InnerContent>
            <TitleWrapper>
                <PageTitle>
                    시크릿 문서 ({isLoadingDocs && docs.length === 0 ? `${docCount}개 로딩 중...` : docs.length})
                </PageTitle>
                <AddDocButton
                    onClick={() => {
                        setEditingDoc(null);
                        setIsEditorOpen(true);
                    }}
                    title="새 문서 작성"
                >
                    +
                </AddDocButton>
            </TitleWrapper>
            <SearchBar>
                <SearchIcon>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                    </svg>
                </SearchIcon>
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                        <path d={getCategoryIconPath('financial')}/>
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                        <path d={getCategoryIconPath('personal')}/>
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                        <path d={getCategoryIconPath('work')}/>
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                        <path d={getCategoryIconPath('diary')}/>
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
                                onDelete={handleDeleteDoc}
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

            {isViewerOpen && viewingDoc && !isEditorOpen && (
                <SecretDocViewer
                    doc={viewingDoc}
                    docs={filteredDocs}
                    selectedCategory={selectedCategory}
                    settings={settings}
                    onClose={handleViewerClose}
                    onEdit={handleViewerEdit}
                    onNavigate={handleViewerNavigate}
                />
            )}

            {isEditorOpen && (
                <SecretDocEditor
                    doc={editingDoc}
                    existingDocs={docs}
                    settings={settings}
                    onClose={() => {
                        setIsEditorOpen(false);
                        setEditingDoc(null);
                        clearDraft(); // 사용자가 직접 닫을 때도 Draft 삭제
                        // isViewerOpen은 그대로 유지 - 이미 true이면 읽기 모드가 바로 보임
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
                    currentIcon={settings.categoryIcons[editingCategory]}
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

        {!isEditorOpen && !showPasswordInputPage && !isViewerOpen && createPortal(
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
