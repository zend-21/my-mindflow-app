// src/App.jsx

import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { GlobalStyle } from './styles.js';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { GoogleAuthProvider, signInWithCredential, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase/config';
import { initializeGapiClient, setAccessToken, syncToGoogleDrive, loadFromGoogleDrive, loadProfilePictureFromGoogleDrive, syncProfilePictureToGoogleDrive } from './utils/googleDriveSync';
import { backupToGoogleDrive } from './utils/googleDriveBackup';
import { DndContext, closestCenter, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useFirestoreSync } from './hooks/useFirestoreSync';
import { fetchAllUserData } from './services/userDataService';
import { exportData, importData } from './utils/dataManager';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import useAlarmManager from './hooks/useAlarmManager';
import { getRandomStealthPhrase } from './utils/stealthPhrases';
// 하위 컴포넌트들
import Header from './components/Header.jsx';
import StatsGrid from './components/StatsGrid.jsx';
import QuickActions from './components/QuickActions.jsx';
import RecentActivity from './components/RecentActivity.jsx';
import BottomNav from './components/BottomNav.jsx';
import FloatingButton from './components/FloatingButton.jsx';
import SideMenu from './components/SideMenu.jsx';
import SearchModal from './components/SearchModal.jsx';
import MemoPage from './components/MemoPage.jsx';
import MemoDetailModal from './components/MemoDetailModal.jsx';
import NewMemoModal from './components/NewMemoModal.jsx';
import ConfirmationModal from './components/ConfirmationModal.jsx';
import ConfirmModal from './components/ConfirmModal.jsx';
import Calendar from './modules/calendar/Calendar.jsx';
import CalendarEditorModal from './modules/calendar/CalendarEditorModal.jsx';
import AlarmModal from './modules/calendar/AlarmModal.jsx';
import AlarmToast from './modules/calendar/AlarmToast.jsx';
import DateSelectorModal from './modules/calendar/DateSelectorModal.jsx';
import LoginModal from './components/LoginModal.jsx';
import FortuneFlow from './components/FortuneFlow.jsx';
import ProfilePage from './components/ProfilePage.jsx';
import Timer from './components/Timer.jsx';
import MacroModal from './components/MacroModal.jsx';
import { TrashProvider, useTrashContext } from './contexts/TrashContext';
import TrashPage from './components/TrashPage.jsx';
import AppContent from './components/AppContent.jsx';
import SecretPage from './components/secret/SecretPage.jsx';
import MessagingHub from './components/messaging/MessagingHub.jsx';
import AuthRequiredModal from './components/AuthRequiredModal.jsx';
import AdBanner from './components/messaging/AdBanner.jsx';
import ChatRoom from './components/messaging/ChatRoom.jsx';
import AppRouter from './components/AppRouter.jsx';
import Toast from './components/Toast.jsx';
import PhoneVerification from './components/PhoneVerification.jsx';
import MasterPasswordModal from './components/MasterPasswordModal.jsx';
import { hasMasterPassword, setEncryptionKey, isUnlocked } from './services/keyManagementService';
// 🔐 E2EE DISABLED - 향후 재활성화 시 사용
// import { migrateToEncryption } from './services/userDataService';
import {
    findAccountByPhone,
    findPhoneByFirebaseUID,
    createMindFlowAccount,
    linkGoogleToAccount,
    isLegacyUser
} from './services/authService';

// ★★★ 스타일 컴포넌트 ★★★
const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const MainContent = styled.main`
  padding-top: 80px; /* 헤더 높이만큼 패딩 추가 */
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;

const SyncingIndicator = styled.div`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10000; /* 모든 UI 위에 표시 */
    width: 60px;
    height: 60px;
    border: 6px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: #5c67f2;
    animation: ${keyframes`
        to { transform: rotate(360deg); }
    `} 1s linear infinite;
`;

const SyncSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid #a0aec0;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const Screen = styled.div`
    height: 100vh;
    width: 100%;
    max-width: 450px;
    margin: 0 auto;

    background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
    position: relative;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
    overflow-y: hidden;  /* ← visible에서 hidden으로 변경 */
    overscroll-behavior: none;
    overscroll-behavior-y: contain;
    
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;

    /* ★★★ 태블릿 화면 ★★★ */
    @media (min-width: 768px) {
        max-width: 480px; /* ◀◀◀ 책장의 폭을 넓힙니다 */
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);

        ${props => props.$layoutView === 'grid' && `
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
        `}
    }

    /* ★★★ 데스크탑 화면 ★★★ */
    @media (min-width: 1024px) {
        max-width: 530px; /* ◀◀◀ 책장의 폭을 더 넓힙니다 */

        ${props => props.$layoutView === 'grid' && `
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
        `}
    }
    
    /* ★★★ 더 큰 데스크탑 화면 ★★★ */
    @media (min-width: 1440px) {
        max-width: 580px; /* ◀◀◀ 책장의 폭을 최대로 넓힙니다 */
        
        ${props => props.$layoutView === 'grid' && `
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
        `}
    }
    
    /* ★★★ 더 큰 데스크탑 화면 ★★★ */
    @media (min-width: 1900px) {
        max-width: 680px; /* ◀◀◀ 책장의 폭을 최대로 넓힙니다 */
        
        ${props => props.$layoutView === 'grid' && `
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
        `}
    }
`;

const ContentArea = styled.div`
    flex: 1;
    padding-left: ${props => props.$isSecretTab ? '0' : '24px'};
    padding-right: ${props => props.$isSecretTab ? '0' : '24px'};
    padding-bottom: 80px;
    padding-top: ${props => props.$showHeader ? '90px' : '20px'};
    overflow-y: auto;
    position: relative;
    transition: ${props => props.$isPulling ? 'none' : 'transform 0.3s ease, padding-top 0.3s ease'};
    transform: translateY(${props => props.$pullDistance || 0}px);
    overscroll-behavior: none;
    touch-action: pan-y;
    background: ${props => props.$isSecretTab ? 'linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%)' : '#1a1a1a'};
`;

const PullToRefreshIndicator = styled.div`
    position: fixed;
    top: ${props => props.$showHeader ? '100px' : '20px'};
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    opacity: ${props => Math.min(props.$distance / 60, 1)};
    transition: opacity 0.2s;
    pointer-events: none;
    z-index: 1000;
`;

const spinAnimation = keyframes`
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
`;

const RefreshIcon = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 3px solid rgba(92, 103, 242, 0.2);
    border-top-color: rgba(92, 103, 242, 0.9);
    box-shadow: 0 4px 12px rgba(92, 103, 242, 0.3);

    ${props => props.$isActive && css`
        animation: ${spinAnimation} 0.8s linear infinite;
    `}
`;

const RefreshText = styled.div`
    color: rgba(255, 255, 255, 0.9);
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const LoginScreen = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 0 24px;
    h2 {
        font-size: 24px;
        color: #e0e0e0;
        margin-bottom: 10px;
    }
    p {
        font-size: 16px;
        color: #b0b0b0;
        margin-bottom: 30px;
    }
`;

const LoadingScreen = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 20px;
    color: #b0b0b0;
`;

const LoginButton = styled.button`
    background-color: #4a90e2;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 25px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.2s;
    &:hover {
        background-color: #357abd;
    }
`;

const WidgetWrapper = styled.div`
    padding: 12px 0;
    transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s cubic-bezier(0.2, 0, 0, 1);
    
    ${(props) => props.$isDragging && `
        transform: scale(1.03);
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 1000;
        opacity: 0.85;
        
        padding: 24px;
        
        display: flex;
        flex-direction: column;
        background-color: #fff4b7ff; 
        border-radius: 16px;
    `}
`;

const getWidgetComponent = (widgetName, props) => {
    switch (widgetName) {
        case 'StatsGrid':
            return <StatsGrid onSwitchTab={props.onSwitchTab} />;
        case 'QuickActions':
            return <QuickActions onSwitchTab={props.onSwitchTab} addActivity={props.addActivity} />;
        case 'RecentActivity':
            const activitiesToDisplay = props.recentActivities.slice(0, props.displayCount);
            return <RecentActivity recentActivities={activitiesToDisplay} deleteActivity={props.deleteActivity} />;
        default:
            return null;
    }
};

const DraggableWidget = ({ id, onSwitchTab, addActivity, recentActivities, displayCount, setDisplayCount, deleteActivity }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const componentProps = {
        onSwitchTab,
        addActivity,
        recentActivities,
        displayCount,
        setDisplayCount,
        deleteActivity
    };

    return (
        <WidgetWrapper ref={setNodeRef} style={style} $isDragging={isDragging} {...attributes} {...listeners}>
            {getWidgetComponent(id, componentProps)}
        </WidgetWrapper>
    );
};

function App() {
    // ✅ 기존 상태들은 그대로 유지
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [loginKey, setLoginKey] = useState(0); // LoginModal 강제 리마운트용

    // 🔥 Firebase Auth 상태
    const [firebaseUser, setFirebaseUser] = useState(null); // Firebase Auth User 객체

    // 🔐 휴대폰 인증 관련 상태
    const [isPhoneVerifying, setIsPhoneVerifying] = useState(false);
    const [pendingAuthData, setPendingAuthData] = useState(null); // Google 로그인 후 대기 중인 데이터
    const [isAuthRequiredModalOpen, setIsAuthRequiredModalOpen] = useState(false); // 인증 요구 모달
    const [authRequiredFeature, setAuthRequiredFeature] = useState(''); // 어떤 기능을 위한 인증인지

    // 🔐 마스터 비밀번호 관련 상태
    const [isMasterPasswordModalOpen, setIsMasterPasswordModalOpen] = useState(false);
    const [masterPasswordMode, setMasterPasswordMode] = useState('setup'); // 'setup' | 'unlock'

    // ✅ 새로 추가되는 상태들
    const [accessToken, setAccessTokenState] = useState(null);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const syncIntervalRef = useRef(null);
    const syncDebounceRef = useRef(null);
    const [isGapiReady, setIsGapiReady] = useState(false);
    
    const [activeTab, setActiveTab] = useState('home');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMacroModalOpen, setIsMacroModalOpen] = useState(false);
    const [isFortuneFlowOpen, setIsFortuneFlowOpen] = useState(false);
    const [isTimerOpen, setIsTimerOpen] = useState(false);
    const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
    const [restoreType, setRestoreType] = useState('phone'); // 'phone' or 'google'
    const [pendingRestoreFile, setPendingRestoreFile] = useState(null);
    const [isUnshareConfirmOpen, setIsUnshareConfirmOpen] = useState(false);


    // ✅ 추가: 앱 활성 상태 (포커스 여부)
    const [isAppActive, setIsAppActive] = useState(true);

    const [isUserIdle, setIsUserIdle] = useState(false);
    const idleTimerRef = useRef(null);
    const IDLE_TIMEOUT = 5 * 60 * 1000; // 5분

    // 🔄 Pull to Refresh 상태
    const [isPulling, setIsPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const touchStartY = useRef(0);
    const scrollTop = useRef(0);
    const contentRef = useRef(null);

    // 기존 useEffect (앱 활성 상태 리스너)
    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsAppActive(document.visibilityState === 'visible');
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // 🔥 Firebase Auth 상태 리스너
    useEffect(() => {
        console.log('🔥 Firebase Auth 리스너 등록');
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log('✅ Firebase Auth 사용자 감지:', user.uid);
                setFirebaseUser(user);

                // localStorage에 저장 (기존 코드와의 호환성)
                localStorage.setItem('firebaseUserId', user.uid);

                // 프로필 복원 시도
                const savedProfile = localStorage.getItem('userProfile');
                if (savedProfile && !profile) {
                    try {
                        setProfile(JSON.parse(savedProfile));
                    } catch (e) {
                        console.error('프로필 복원 실패:', e);
                    }
                }
            } else {
                console.log('❌ Firebase Auth 로그아웃 상태');
                setFirebaseUser(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // userId와 isAuthenticated 계산
    const phoneId = localStorage.getItem('mindflowUserId'); // 휴대폰 번호 (캐시)
    const userId = phoneId || (firebaseUser?.uid); // ✅ Firebase Auth를 Source of Truth로 사용
    const isAuthenticated = !!(firebaseUser || profile);

    // 🔐 E2EE DISABLED - 마스터 비밀번호 자동 프롬프트 (향후 재활성화 시 사용)
    // ⚠️ UX 이슈로 인해 비활성화: 앱 실행 시 즉시 비밀번호 요구는 사용자가 앱을 이해하기 전에 삭제하게 만듦
    // 향후 구현 시: 민감한 데이터 접근 시점에 선택적으로 요구
    /*
    useEffect(() => {
        if (!isAuthenticated || !userId) return;

        // 이미 잠금 해제되어 있으면 체크하지 않음
        if (isUnlocked()) {
            console.log('✅ 이미 암호화 키가 메모리에 있습니다');
            return;
        }

        // 마스터 비밀번호가 설정되어 있는지 확인
        if (hasMasterPassword()) {
            console.log('🔐 마스터 비밀번호가 설정되어 있습니다. 잠금 해제 필요');
            setMasterPasswordMode('unlock');
            setIsMasterPasswordModalOpen(true);
        } else {
            console.log('🆕 마스터 비밀번호가 설정되지 않았습니다. 설정 모달 표시');
            setMasterPasswordMode('setup');
            setIsMasterPasswordModalOpen(true);
        }
    }, [isAuthenticated, userId]);
    */

    // 🔐 마스터 비밀번호 모달 성공 핸들러
    const handleMasterPasswordSuccess = async (key) => {
        console.log('✅ 마스터 비밀번호 설정/잠금 해제 성공');
        setEncryptionKey(key);
        setIsMasterPasswordModalOpen(false);

        // 🔐 E2EE DISABLED - 향후 재활성화 시 사용
        // 기존 평문 데이터 자동 암호화 (최초 설정 시에만)
        /*
        if (userId && isAuthenticated && masterPasswordMode === 'setup') {
            try {
                console.log('🔐 기존 데이터 암호화 마이그레이션 시작...');
                const migrated = await migrateToEncryption(userId);
                if (migrated) {
                    console.log('✅ 기존 데이터 암호화 완료');
                } else {
                    console.log('ℹ️ 마이그레이션할 데이터 없음 (신규 사용자 또는 이미 암호화됨)');
                }
            } catch (error) {
                console.error('⚠️ 데이터 암호화 실패:', error);
                // 실패해도 계속 진행 (사용자 경험 유지)
            }
        }
        */

        // 데이터 다시 로드 (암호화 키로 복호화하기 위해)
        if (userId && isAuthenticated) {
            saveImmediately();
        }
    };

    useEffect(() => {
        const resetIdleTimer = () => {
            setIsUserIdle(false);
            
            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current);
            }
            
            idleTimerRef.current = setTimeout(() => {
                setIsUserIdle(true);
                console.log('⏸️ 사용자 비활성 상태 - 자동 동기화 중지');
            }, IDLE_TIMEOUT);
        };

        // 사용자 활동 감지 이벤트들
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.addEventListener(event, resetIdleTimer, true);
        });

        // 초기 타이머 시작
        resetIdleTimer();

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, resetIdleTimer, true);
            });
            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current);
            }
        };
    }, []);

    // 🔄 일반 데이터는 로그인/게스트 공통 저장 (동일한 localStorage 키 사용)
    // ✅ 휴대폰 환경: 로그인 상태를 인지 못한 채 메모 작성 시 데이터 유실 방지
    // ✅ Google Drive 동기화는 로그인 시에만 가능
    // ✅ 백업/복원 기능은 게스트와 로그인 모두 가능

    // 📦 기존 데이터 마이그레이션 (최초 1회만 실행)
    useEffect(() => {
        const migrationKey = 'data_migration_v1_completed';
        if (localStorage.getItem(migrationKey)) return; // 이미 마이그레이션 완료

        console.log('📦 데이터 마이그레이션 시작...');

        // 모든 localStorage 키 확인
        const allKeys = Object.keys(localStorage);
        const guestKeys = allKeys.filter(key => key.endsWith('_guest'));
        const userKeys = allKeys.filter(key => key.includes('@') && !key.includes('_shared'));

        // 병합할 데이터 타입들
        const dataTypes = ['memos', 'calendarSchedules', 'recentActivities', 'widgets', 'displayCount'];

        dataTypes.forEach(dataType => {
            const sharedKey = `${dataType}_shared`;
            const existingShared = localStorage.getItem(sharedKey);

            // 이미 _shared 키에 데이터가 있으면 스킵 (수동으로 생성한 경우)
            if (existingShared) {
                console.log(`✅ ${dataType}: 이미 공통 데이터 존재 (스킵)`);
                return;
            }

            // guest 데이터와 user 데이터를 모두 찾아서 병합
            let mergedData = dataType === 'calendarSchedules' ? {} : [];
            let foundData = false;

            // guest 키에서 데이터 가져오기
            const guestKey = `${dataType}_guest`;
            const guestData = localStorage.getItem(guestKey);
            if (guestData) {
                try {
                    const parsed = JSON.parse(guestData);
                    if (dataType === 'calendarSchedules') {
                        mergedData = { ...mergedData, ...parsed };
                    } else if (Array.isArray(parsed)) {
                        mergedData = [...mergedData, ...parsed];
                    } else if (dataType === 'displayCount') {
                        mergedData = parsed;
                    }
                    foundData = true;
                    console.log(`📥 ${dataType}_guest 데이터 발견:`, parsed);
                } catch (e) {
                    console.error(`❌ ${guestKey} 파싱 실패:`, e);
                }
            }

            // user 키에서 데이터 가져오기 (이메일 주소 포함된 키)
            userKeys.forEach(key => {
                if (key.startsWith(dataType + '_')) {
                    const userData = localStorage.getItem(key);
                    if (userData) {
                        try {
                            const parsed = JSON.parse(userData);
                            if (dataType === 'calendarSchedules') {
                                mergedData = { ...mergedData, ...parsed };
                            } else if (Array.isArray(parsed)) {
                                mergedData = [...mergedData, ...parsed];
                            } else if (dataType === 'displayCount' && !foundData) {
                                // displayCount는 첫 번째 값만 사용
                                mergedData = parsed;
                            }
                            foundData = true;
                            console.log(`📥 ${key} 데이터 발견:`, parsed);
                        } catch (e) {
                            console.error(`❌ ${key} 파싱 실패:`, e);
                        }
                    }
                }
            });

            // 병합된 데이터가 있으면 _shared 키로 저장
            if (foundData) {
                localStorage.setItem(sharedKey, JSON.stringify(mergedData));
                console.log(`✅ ${sharedKey}로 마이그레이션 완료:`, mergedData);
            } else {
                console.log(`📭 ${dataType}: 마이그레이션할 데이터 없음`);
            }
        });

        // 마이그레이션 완료 플래그 저장
        localStorage.setItem(migrationKey, 'true');
        console.log('✅ 데이터 마이그레이션 완료');

        // 페이지 새로고침하여 새로운 키로 데이터 로드
        window.location.reload();
    }, []);

    // 🔥 Firestore 동기화 훅 사용
    // ⚠️ 중요: 휴대폰 인증한 경우 휴대폰 번호 사용, 아니면 Firebase Auth UID 사용
    // (userId와 isAuthenticated는 위에서 이미 선언됨)

    const {
        loading: dataLoading,
        memos,
        folders,
        trash,
        macros,
        calendar: calendarSchedules,
        activities: recentActivities,
        settings,
        syncMemos,
        syncFolders,
        syncTrash,
        syncMacros,
        syncCalendar,
        syncActivities,
        syncSettings,
        saveImmediately,
        // 개별 항목 동기화 함수
        syncMemo,
        deleteMemo,
        syncFolder,
        deleteFolder,
        syncTrashItem,
        deleteTrashItem,
        // 수동 동기화 함수
        syncFromFirestore
    } = useFirestoreSync(userId, isAuthenticated, firebaseUser?.uid);

    // settings에서 개별 값 추출
    const widgets = settings.widgets;
    const displayCount = settings.displayCount;

    // displayCount 업데이트 wrapper 함수
    const setDisplayCount = (newCount) => {
        syncSettings({
            ...settings,
            displayCount: newCount
        });
    };

    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const contentAreaRef = useRef(null);
    
    const [isCalendarEditorOpen, setIsCalendarEditorOpen] = useState(false);
    const [calendarModalData, setCalendarModalData] = useState({ date: new Date(), text: '' });
    
    const urlParams = new URLSearchParams(window.location.search);
    const secretKeyFromUrl = urlParams.get('secret');
    const adminSecretKey = import.meta.env.VITE_ADMIN_SECRET_KEY;
    const isAdminMode = secretKeyFromUrl === adminSecretKey;
    
    const handleOpenCalendarEditor = (date, text) => {
        const key = format(new Date(date), 'yyyy-MM-dd');
        const scheduleData = calendarSchedules[key] || {}; // 날짜 키로 전체 스케줄 데이터 조회

        // 모달에 전달할 데이터에 타임스탬프와 알람 정보 추가
        setCalendarModalData({
            date,
            text: scheduleData.text ?? text, // 텍스트는 기존 방식을 유지
            createdAt: scheduleData.createdAt, // 작성일 추가
            updatedAt: scheduleData.updatedAt, // 수정일 추가
            alarm: scheduleData.alarm // 알람 정보 추가
        });
        setIsCalendarEditorOpen(true);
    };

    const handleCalendarScheduleSave = (date, text) => {
            if (!date) return;

            const key = format(new Date(date), 'yyyy-MM-dd');
            const now = Date.now();

            const isEditingExisting = !!calendarSchedules[key];

            const copy = { ...calendarSchedules };

            if (!text || text.trim() === "") {
                // 텍스트가 비어있으면 text만 삭제하되, alarm이 있으면 엔트리 유지
                if (copy[key]) {
                    if (copy[key].alarm && copy[key].alarm.registeredAlarms && copy[key].alarm.registeredAlarms.length > 0) {
                        // 알람이 있으면 text만 빈 문자열로
                        copy[key] = {
                            ...copy[key],
                            text: '',
                            updatedAt: now
                        };
                    } else {
                        // 알람도 없으면 전체 삭제
                        delete copy[key];
                    }
                }
            } else {
                copy[key] = {
                    text,
                    createdAt: copy[key]?.createdAt ?? now,
                    updatedAt: now,
                    alarm: copy[key]?.alarm, // 기존 알람 정보 보존
                };
            }
            syncCalendar(copy);

            if (!text || text.trim() === "") {
                addActivity('스케줄 삭제', `${key}`);
                showToast?.('✓ 스케줄이 삭제되었습니다');
            } else {
                const activityType = isEditingExisting ? '스케줄 수정' : '스케줄 등록';
                const toastMessage = isEditingExisting ? '✓ 스케줄이 수정되었습니다' : '✓ 스케줄이 등록되었습니다';

                addActivity(activityType, `${key} - ${text}`);
                showToast?.(toastMessage);
            }

            setIsCalendarEditorOpen(false);
            quietSync(); // ✅ 추가
        };

    const handleProfileClick = () => {
        setIsMenuOpen(false);
        setActiveTab('profile');
    };   

    const logOut = () => {
        setProfile(null);
        setUser(null);
    };

    const handleOpenFortune = () => {
        setIsFortuneFlowOpen(true);
        // 사이드 메뉴는 이미 SideMenu.jsx 내부에서 닫혔다고 가정
    };

    const addActivity = (type, description, memoId = null) => {
        const allowedTypes = ['메모 작성', '메모 수정', '메모 삭제', '백업', '복원', '스케줄 등록', '스케줄 수정', '스케줄 삭제', '리뷰 작성', '동기화'];
        if (!allowedTypes.includes(type)) {
            return;
        }

        // 스케줄 관련은 23글자, 나머지는 20글자
        const maxLength = type.includes('스케줄') ? 23 : 20;

        // 이모지를 올바르게 카운트
        const chars = [...description];
        const trimmedDescription = chars.length > maxLength
            ? chars.slice(0, maxLength).join('') + '...'
            : description;

        const formattedDescription = `${type} - ${trimmedDescription}`;

        const now = Date.now();
        const newActivity = {
            id: String(now), // Firestore doc ID는 문자열이어야 함
            memoId: memoId,
            type,
            description: formattedDescription,
            date: new Date(now).toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            })
        };
        const updatedActivities = [newActivity, ...recentActivities];
        syncActivities(updatedActivities.slice(0, 15));
    };

    // 🔄 Pull to Refresh 핸들러
    const handleTouchStart = (e) => {
        const target = contentRef.current;
        if (!target) return;

        touchStartY.current = e.touches[0].clientY;
        scrollTop.current = target.scrollTop;
    };

    const handleTouchMove = (e) => {
        const target = contentRef.current;
        if (!target || scrollTop.current > 0) return;

        const touchY = e.touches[0].clientY;
        const distance = touchY - touchStartY.current;

        if (distance > 0 && target.scrollTop === 0) {
            e.preventDefault();
            const maxDistance = 120;
            const finalDistance = Math.min(distance * 0.5, maxDistance);
            setPullDistance(finalDistance);
            setIsPulling(finalDistance > 60);
        } else if (distance <= 0) {
            // 다시 위로 올리면 취소
            setPullDistance(0);
            setIsPulling(false);
        }
    };

    const handleTouchEnd = async () => {
        // 손을 뗄 때 60px 이상이어야만 동기화
        const shouldSync = pullDistance > 60 && userId && isAuthenticated;

        setPullDistance(0);
        setIsPulling(false);

        if (shouldSync) {
            try {
                console.log('🔄 Pull to Refresh 시작...');
                await syncFromFirestore();
                showToast('✅ 동기화 완료');
                addActivity('동기화', 'Firestore 동기화');
            } catch (error) {
                console.error('❌ 동기화 실패:', error);
                showToast('❌ 동기화 실패');
            }
        }
    };
    
    const [isNewMemoModalOpen, setIsNewMemoModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedMemo, setSelectedMemo] = useState(null);
    const [memoContext, setMemoContext] = useState(null); // { activeFolder, sortOrder, sortDirection, sharedMemoInfo }
    const [toastMessage, setToastMessage] = useState(null);
    const [memoOpenSource, setMemoOpenSource] = useState(null);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedMemoIds, setSelectedMemoIds] = useState(new Set());
    
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [memoToDelete, setMemoToDelete] = useState(null);
    const [isCalendarConfirmOpen, setIsCalendarConfirmOpen] = useState(false);
    const [dateToDelete, setDateToDelete] = useState(null);
    
    const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
    const [scheduleForAlarm, setScheduleForAlarm] = useState(null);
    const [isDateSelectorOpen, setIsDateSelectorOpen] = useState(false);

    // 알람 매니저 훅 사용
    const { toastAlarms, dismissToast } = useAlarmManager(calendarSchedules);

    // 앱 시작 시 일정 데이터 정리 (text가 없으면 createdAt/updatedAt 제거)
    useEffect(() => {
        const updatedSchedules = { ...calendarSchedules };
        let hasChanges = false;

        Object.keys(updatedSchedules).forEach(dateKey => {
            const schedule = updatedSchedules[dateKey];

            // text가 없거나 빈 문자열인 경우 createdAt/updatedAt 제거
            if (!schedule.text || schedule.text.trim() === '') {
                if (schedule.createdAt || schedule.updatedAt) {
                    hasChanges = true;
                    const { createdAt, updatedAt, ...rest } = schedule;

                    // 알람이 있으면 알람만 유지
                    if (rest.alarm && rest.alarm.registeredAlarms && rest.alarm.registeredAlarms.length > 0) {
                        updatedSchedules[dateKey] = rest;
                    } else {
                        // 알람도 없으면 엔트리 전체 삭제
                        delete updatedSchedules[dateKey];
                    }
                }
            }
        });

        if (hasChanges) {
            syncCalendar(updatedSchedules);
        }
    }, []); // 앱 시작 시 한 번만 실행

    const handleOpenAlarmModal = (scheduleData) => {
        console.log('✅ handleOpenAlarmModal 호출됨:', scheduleData);
        setScheduleForAlarm(scheduleData);
        setIsAlarmModalOpen(true);
    };

    const handleSaveAlarm = (alarmSettings, actionType) => {
        // 1. 알람을 설정할 대상 스케줄의 날짜 키(key)를 찾습니다.
        if (!scheduleForAlarm?.date) {
            console.error("알람을 저장할 스케줄 정보가 없습니다.");
            return;
        }
        const key = format(new Date(scheduleForAlarm.date), 'yyyy-MM-dd');

        // 2. calendarSchedules 상태를 업데이트합니다.
        const updatedSchedules = { ...calendarSchedules };
        const targetSchedule = updatedSchedules[key];

        // 3. 해당 날짜의 스케줄에 'alarm' 객체를 추가하거나 업데이트합니다.
        if (targetSchedule) {
            // 기존 일정이 있는 경우
            updatedSchedules[key] = {
                ...targetSchedule,
                alarm: alarmSettings
            };
        } else {
            // 일정이 없는 경우 알람만 저장 (createdAt/updatedAt은 실제 일정 저장 시에만 생성)
            updatedSchedules[key] = {
                text: '',  // 빈 일정
                alarm: alarmSettings
            };
        }

        syncCalendar(updatedSchedules);

        // 4. 사용자에게 피드백을 줍니다 (모달은 닫지 않음)
        const hasAlarms = alarmSettings.registeredAlarms && alarmSettings.registeredAlarms.length > 0;

        // 동작 타입에 따라 다른 메시지 표시
        let message = '이벤트 시간이 저장되었습니다.';

        if (hasAlarms) {
            const alarmType = alarmSettings.alarmType; // 'anniversary' or 'normal'

            switch (actionType) {
                case 'register':
                    message = alarmType === 'anniversary' ? '기념일을 등록하였습니다. 🔔' : '알람을 등록하였습니다. 🔔';
                    break;
                case 'update':
                case 'edit':
                    message = alarmType === 'anniversary' ? '기념일을 수정하였습니다.' : '알람을 수정하였습니다.';
                    break;
                case 'delete':
                    message = alarmType === 'anniversary' ? '기념일을 삭제하였습니다.' : '알람을 삭제하였습니다.';
                    break;
                case 'toggle_on':
                    message = alarmType === 'anniversary' ? '기념일 알람이 활성화 되었습니다.' : '알람이 활성화 되었습니다.';
                    break;
                case 'toggle_off':
                    message = alarmType === 'anniversary' ? '기념일 알람이 일시중지 되었습니다.' : '알람이 일시중지 되었습니다.';
                    break;
                case 'apply':
                    message = '변경사항이 적용되었습니다.';
                    break;
                case 'save':
                    message = '알람 설정이 저장되었습니다.';
                    break;
                default:
                    message = '알람이 설정되었습니다. 🔔';
            }
        }

        showToast(message);
        // 모달은 사용자가 직접 닫기 버튼을 누를 때만 닫히도록 변경
        // setIsAlarmModalOpen(false);
        // setScheduleForAlarm(null);
    };

    const requestCalendarDelete = (date) => {
        setDateToDelete(date);
        setIsCalendarConfirmOpen(true);
    };

    const showToast = (message, duration = 1000) => {
        console.log('🔔 showToast 호출됨:', message);
        setToastMessage(message);
        setTimeout(() => {
            console.log('🔔 Toast 숨김');
            setToastMessage(null);
        }, duration);
    };
    
    const handleDataExport = async () => {
        // 전체 데이터 백업 (운세 제외)
        const dataToExport = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            exportTimestamp: Date.now(),
            data: {
                memos,
                calendarSchedules,
                recentActivities,
                widgets,
                displayCount,
                trashedItems: JSON.parse(localStorage.getItem('trashedItems_shared') || '[]'),
                macroTexts: JSON.parse(localStorage.getItem('macroTexts') || '[]'),
                memoFolders: JSON.parse(localStorage.getItem('memoFolders') || '[]')
            }
        };

        // 1. 휴대폰에 파일 다운로드 (모든 사용자)
        exportData('mindflow_backup', dataToExport);

        // 2. 로그인 사용자는 Google Drive에도 백업
        if (profile && accessToken) {
            try {
                const result = await backupToGoogleDrive(dataToExport);
                if (result.success) {
                    addActivity('백업', '휴대폰 및 Google Drive에 백업 완료');
                    showToast('✓ 휴대폰과 Google Drive에 백업되었습니다');
                } else {
                    addActivity('백업', '휴대폰에 백업 완료 (Drive 실패)');
                    showToast('✓ 휴대폰에 백업되었습니다');
                }
            } catch (error) {
                console.error('Google Drive 백업 실패:', error);
                addActivity('백업', '휴대폰에 백업 완료');
                showToast('✓ 휴대폰에 백업되었습니다');
            }
        } else {
            addActivity('백업', '휴대폰에 백업 완료');
        }
    };

    const handleDataImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // 파일을 저장하고 확인 모달 표시
        setPendingRestoreFile(file);
        setRestoreType('phone');
        setIsRestoreConfirmOpen(true);
    };

    const executeDataImport = () => {
        if (!pendingRestoreFile) return;

        importData(pendingRestoreFile, (importedData) => {
            try {
                // 버전 체크
                if (importedData.version && importedData.data) {
                    // v1.0 형식 (새 형식)
                    const { data } = importedData;
                    if (data.memos) syncMemos(data.memos);
                    if (data.calendarSchedules) syncCalendar(data.calendarSchedules);
                    if (data.recentActivities) syncActivities(data.recentActivities);
                    if (data.widgets || data.displayCount) {
                        syncSettings({
                            ...settings,
                            ...(data.widgets && { widgets: data.widgets }),
                            ...(data.displayCount && { displayCount: data.displayCount })
                        });
                    }
                    if (data.trashedItems) {
                        localStorage.setItem('trashedItems_shared', JSON.stringify(data.trashedItems));
                    }
                    if (data.macroTexts) {
                        localStorage.setItem('macroTexts', JSON.stringify(data.macroTexts));
                    }
                    if (data.memoFolders) {
                        localStorage.setItem('memoFolders', JSON.stringify(data.memoFolders));
                    }
                } else if (Array.isArray(importedData)) {
                    // 구 형식 (메모만 있는 경우)
                    syncMemos(importedData);
                } else {
                    // 알 수 없는 형식
                    throw new Error('지원하지 않는 백업 파일 형식입니다.');
                }

                showToast('✓ 데이터가 성공적으로 복원되었습니다');
                addActivity('복원', '전체 데이터 복원 (휴대폰)');
                setTimeout(() => window.location.reload(), 1500);
            } catch (error) {
                console.error('복원 실패:', error);
                showToast('⚠ 복원에 실패했습니다');
            }
        });

        // 초기화
        setPendingRestoreFile(null);
        setIsRestoreConfirmOpen(false);
    };
    
    const handleSaveNewMemo = (newMemoContent, isImportant) => {
            const now = Date.now();
            const newId = `m${now}`;
            const newMemo = {
                id: newId,
                content: newMemoContent,
                date: now,
                createdAt: now,
                // updatedAt은 설정하지 않음 - 새로 생성된 메모는 수정된 적이 없음
                displayDate: new Date(now).toLocaleString(),
                isImportant: isImportant,
                folderId: newMemoFolderId || null // 폴더 ID 저장 (null이면 미분류)
            };

            // ✅ 개별 문서 방식으로 저장 (산업 표준)
            syncMemo(newMemo);
            addActivity('메모 작성', newMemoContent, newId);
            setIsNewMemoModalOpen(false);
            setNewMemoFolderId(null); // 폴더 ID 초기화
            showToast("✓ 메모가 저장되었습니다");
        };

    const handleEditMemo = (id, newContent, isImportant, folderId, previousFolderId) => {
            const now = Date.now();
            const targetMemo = memos.find(memo => memo.id === id);
            if (!targetMemo) return;

            // 내용이 변경되었는지 확인 (공백 포함)
            const contentChanged = targetMemo.content !== newContent;

            const updatedMemo = {
                ...targetMemo,
                content: newContent,
                date: contentChanged ? now : targetMemo.date, // 내용 변경 시에만 date 갱신
                createdAt: targetMemo.createdAt || now, // 기존 createdAt 유지, 없으면 현재 시간
                updatedAt: contentChanged ? now : targetMemo.updatedAt, // 내용 변경 시에만 updatedAt 갱신
                displayDate: contentChanged ? new Date(now).toLocaleString() : targetMemo.displayDate, // 내용 변경 시에만 displayDate 갱신
                isImportant: isImportant,
                folderId: folderId !== undefined ? folderId : targetMemo.folderId, // 폴더 ID 저장
                previousFolderId: previousFolderId !== undefined ? previousFolderId : targetMemo.previousFolderId // 이전 폴더 ID 저장
            };

            // ✨ 선택된 메모 업데이트 (읽기 모드에서 변경사항 반영)
            if (selectedMemo && selectedMemo.id === id) {
                setSelectedMemo(updatedMemo);
            }

            // ✅ 개별 문서 방식으로 저장 (산업 표준)
            syncMemo(updatedMemo);
            addActivity('메모 수정', newContent, id);
            showToast("✓ 메모가 수정되었습니다");
        };

    const handleDeleteMemo = (id) => {
            const deletedMemo = memos.find(memo => memo.id === id);
            if (deletedMemo) {
                // 휴지통으로 이동 이벤트 발생
                const event = new CustomEvent('moveToTrash', {
                    detail: {
                        id: deletedMemo.id,
                        type: 'memo',
                        content: deletedMemo.content.substring(0, 50) + (deletedMemo.content.length > 50 ? '...' : ''),
                        originalData: deletedMemo
                    }
                });
                window.dispatchEvent(event);

                // 휴지통에 추가
                const trashedItem = {
                    id: deletedMemo.id,
                    type: 'memo',
                    title: deletedMemo.title,
                    content: deletedMemo.content,
                    originalData: deletedMemo,
                    deletedAt: Date.now(),
                    createdAt: deletedMemo.createdAt,
                    updatedAt: deletedMemo.updatedAt
                };
                syncTrashItem(trashedItem);

                // ✅ Firestore에서 메모 삭제
                deleteMemo(id);
                addActivity('메모 삭제', deletedMemo.content, id);
            }
            return deletedMemo; 
        };
    
    const handleStartSelectionMode = (memoId) => {
        setIsSelectionMode(true);
        setSelectedMemoIds(new Set([memoId]));
    };

    const handleToggleMemoSelection = (memoId) => {
        setSelectedMemoIds(prevIds => {
            const newIds = new Set(prevIds);
            if (newIds.has(memoId)) {
                newIds.delete(memoId);
            } else {
                newIds.add(memoId);
            }
            // 전체해제 시에도 선택 모드는 유지되어야 함
            // 사용자가 명시적으로 "취소" 버튼을 눌러야만 선택 모드 종료
            return newIds;
        });
    };

    const handleExitSelectionMode = () => {
        setIsSelectionMode(false);
        setSelectedMemoIds(new Set());
    };

    const handleToggleSelectedMemosImportance = () => {
        if (selectedMemoIds.size === 0) return;

        // 선택된 메모 객체들 가져오기
        const selectedMemoObjects = memos.filter(memo => selectedMemoIds.has(memo.id));

        // 선택된 메모 중 하나라도 중요하지 않으면 모두 중요로, 모두 중요하면 모두 해제
        const allImportant = selectedMemoObjects.every(memo => memo.isImportant);
        const newImportance = !allImportant;

        // 메모 업데이트
        syncMemos(
            memos.map(memo =>
                selectedMemoIds.has(memo.id)
                    ? { ...memo, isImportant: newImportance }
                    : memo
            )
        );

        showToast(`${selectedMemoIds.size}개의 메모가 ${newImportance ? '중요 표시' : '중요 해제'}되었습니다.`);
        handleExitSelectionMode();
    };

    const handleToggleSelectedMemosStealth = () => {
        if (selectedMemoIds.size === 0) return;

        // 선택된 메모 객체들 가져오기
        const selectedMemoObjects = memos.filter(memo => selectedMemoIds.has(memo.id));

        // 선택된 메모 중 하나라도 스텔스가 아니면 모두 스텔스로, 모두 스텔스면 모두 해제
        const allStealth = selectedMemoObjects.every(memo => memo.isStealth);
        const newStealth = !allStealth;

        // 메모 업데이트
        syncMemos(
            memos.map(memo => {
                if (selectedMemoIds.has(memo.id)) {
                    if (newStealth) {
                        // 스텔스 설정: 랜덤 더미 문구 할당
                        return {
                            ...memo,
                            isStealth: true,
                            stealthPhrase: getRandomStealthPhrase()
                        };
                    } else {
                        // 스텔스 해제
                        return {
                            ...memo,
                            isStealth: false,
                            stealthPhrase: null // Firestore는 undefined를 허용하지 않음
                        };
                    }
                }
                return memo;
            })
        );

        showToast(`${selectedMemoIds.size}개의 메모가 ${newStealth ? '스텔스 설정' : '스텔스 해제'}되었습니다.`);
        handleExitSelectionMode();
    };

    // 메모 폴더 변경
    const handleUpdateMemoFolder = (memoId, folderId, savePrevious = false) => {
        syncMemos(
            memos.map(memo => {
                if (memo.id === memoId) {
                    const updates = { folderId };
                    // 공유 폴더로 이동할 때 원래 폴더 정보 저장
                    if (savePrevious && folderId === 'shared') {
                        updates.previousFolderId = memo.folderId || null;
                    }
                    return { ...memo, ...updates };
                }
                return memo;
            })
        );
        quietSync(); // 변경사항 동기화
    };

    // 여러 메모의 폴더 한 번에 변경
    const handleUpdateMemoFolderBatch = (memoIds, folderId, savePrevious = false) => {
        const memoIdSet = new Set(memoIds);
        syncMemos(
            memos.map(memo => {
                if (memoIdSet.has(memo.id)) {
                    const updates = { folderId };
                    // 공유 폴더로 이동할 때 원래 폴더 정보 저장
                    if (savePrevious && folderId === 'shared') {
                        updates.previousFolderId = memo.folderId || null;
                    }
                    return { ...memo, ...updates };
                }
                return memo;
            })
        );
        quietSync(); // 변경사항 동기화
    };

    // 메모 폴더 복원 (공유 해제 시)
    const handleRestoreMemoFolder = (memoId) => {
        syncMemos(
            memos.map(memo => {
                if (memo.id === memoId) {
                    // previousFolderId가 있으면 복원, 없으면 미분류(null)로
                    return {
                        ...memo,
                        folderId: memo.previousFolderId || null,
                        previousFolderId: null // 복원 후 제거 (Firestore는 undefined를 허용하지 않음)
                    };
                }
                return memo;
            })
        );
        quietSync(); // 변경사항 동기화
    };

    const requestDeleteSelectedMemos = () => {
        if (selectedMemoIds.size === 0) return;
        const idsToDelete = Array.from(selectedMemoIds);
        console.log("삭제 요청된 메모 ID들:", idsToDelete); // ★★★ 추가
        setMemoToDelete(idsToDelete);
        setIsDeleteModalOpen(true);
    };

    // 선택된 메모 공유 설정 요청
    const requestShareSelectedMemos = () => {
        if (selectedMemoIds.size === 0) return;

        const selectedIds = Array.from(selectedMemoIds);

        // 선택된 메모들을 공유 폴더로 이동 (배치 처리)
        handleUpdateMemoFolderBatch(selectedIds, 'shared', true);

        handleExitSelectionMode();
        showToast(`${selectedIds.length}개의 메모가 공유 폴더로 이동되었습니다.`);
    };

    // 선택된 메모 공유 해제 요청
    const requestUnshareSelectedMemos = () => {
        if (selectedMemoIds.size === 0) return;
        setIsUnshareConfirmOpen(true);
    };

    // 선택된 메모 공유 해제 실행
    const executeUnshareSelectedMemos = async () => {
        setIsUnshareConfirmOpen(false);

        try {
            const selectedIds = Array.from(selectedMemoIds);

            // 메모를 미분류 문서로 이동 (배치 처리)
            handleUpdateMemoFolderBatch(selectedIds, null, false);

            handleExitSelectionMode();
            showToast(`${selectedIds.length}개 메모의 공유가 해제되었습니다.`);
        } catch (error) {
            console.error('공유 해제 실패:', error);
            showToast('공유 해제에 실패했습니다.');
        }
    };

    const handleDeleteConfirm = () => {
        const isBulkDelete = Array.isArray(memoToDelete);
        let message = '';

        if (isBulkDelete) {
            const idsToDelete = new Set(memoToDelete);

            // 각 메모를 휴지통으로 이동 및 삭제
            memos.forEach(memo => {
                if (idsToDelete.has(memo.id)) {
                    // 이벤트 발생
                    const event = new CustomEvent('moveToTrash', {
                        detail: {
                            id: memo.id,
                            type: 'memo',
                            content: memo.content.substring(0, 50) + (memo.content.length > 50 ? '...' : ''),
                            originalData: memo
                        }
                    });
                    window.dispatchEvent(event);

                    // 휴지통 아이템 생성 및 저장
                    const trashedItem = {
                        id: memo.id,
                        type: 'memo',
                        title: memo.title,
                        content: memo.content,
                        originalData: memo,
                        deletedAt: Date.now(),
                        createdAt: memo.createdAt,
                        updatedAt: memo.updatedAt
                    };
                    syncTrashItem(trashedItem);

                    // ✅ Firestore에서 메모 삭제
                    deleteMemo(memo.id);
                }
            });

            message = `${idsToDelete.size}개의 메모가 삭제되었습니다.`;
            handleExitSelectionMode();
        } else {
            const memoBeingDeleted = handleDeleteMemo(memoToDelete);
            message = (memoBeingDeleted && memoBeingDeleted.isImportant)
                ? "중요 메모가 삭제되었습니다."
                : "메모가 삭제되었습니다.";
        }
        
        setIsDeleteModalOpen(false);
        setMemoToDelete(null);
        showToast(message);
    };

    const handleDeleteCancel = () => {
        setIsDeleteModalOpen(false);
        setMemoToDelete(null);
    };

    const requestDeleteConfirmation = (id) => {
        setMemoToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const deleteActivity = (activityId) => {
        syncActivities(recentActivities.filter(activity => activity.id !== activityId));
    };

    // 검색용 전체 데이터 통합
    const allData = React.useMemo(() => {
        const searchData = [];

        // 1. 메모 데이터 (폴더별 포함)
        if (memos && memos.length > 0) {
            memos.forEach(memo => {
                // 시크릿 메모 제외
                if (memo.isSecret) return;

                const folderName = memo.folderId
                    ? folders?.find(f => f.id === memo.folderId)?.name
                    : null;

                searchData.push({
                    id: memo.id,
                    title: memo.title || '제목 없음',
                    content: memo.content || '',
                    type: 'memo',
                    isSecret: false,
                    folderId: memo.folderId,
                    folderName: folderName,
                    createdAt: memo.createdAt,
                    updatedAt: memo.updatedAt
                });
            });
        }

        // 2. 일정 데이터 (캘린더 스케줄 + 알람)
        if (calendarSchedules) {
            Object.entries(calendarSchedules).forEach(([dateKey, schedule]) => {
                if (schedule.text && schedule.text.trim()) {
                    searchData.push({
                        id: dateKey,
                        title: schedule.text,
                        content: schedule.text,
                        type: 'calendar',
                        isSecret: false,
                        dateKey: dateKey,
                        createdAt: schedule.createdAt,
                        updatedAt: schedule.updatedAt,
                        hasAlarm: schedule.alarm?.registeredAlarms?.length > 0
                    });
                }

                // 알람만 있는 경우도 검색 가능하도록
                if (schedule.alarm?.registeredAlarms?.length > 0) {
                    schedule.alarm.registeredAlarms.forEach((alarm, index) => {
                        // 알람 시간 파싱 (검색일 기준 1달 이내만)
                        const now = new Date();
                        const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                        const alarmDateTime = new Date(alarm.calculatedTime || alarm.time);

                        // 알람이 현재부터 1달 이내에 있는 경우만 검색 결과에 포함
                        if (alarmDateTime >= now && alarmDateTime <= oneMonthLater) {
                            searchData.push({
                                id: `${dateKey}-alarm-${index}`,
                                title: alarm.title || alarm.anniversaryName || '알람',
                                content: '', // 알람은 내용이 없음
                                type: 'alarm',
                                isSecret: false,
                                dateKey: dateKey,
                                isAlarm: true,
                                alarmTime: alarm.calculatedTime || alarm.time,
                                alarmData: alarm
                            });
                        }
                    });
                }
            });
        }

        // 3. 휴지통 데이터
        if (trash && trash.length > 0) {
            trash.forEach(item => {
                searchData.push({
                    id: item.id,
                    title: item.title || '제목 없음',
                    content: item.content || '',
                    type: 'trash',
                    isSecret: false,
                    originalType: item.type,
                    deletedAt: item.deletedAt,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt
                });
            });
        }

        return searchData;
    }, [memos, calendarSchedules, trash, folders]);

    const handleSwitchTab = (tab) => {
        setActiveTab(tab);
        // 탭 전환 시 다중선택 모드 해제
        if (isSelectionMode) {
            setIsSelectionMode(false);
            setSelectedMemoIds(new Set());
        }
    };

    const handleFloatingButtonClick = () => {
        setIsSearchModalOpen(true);
    };

    const handleToggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleSearchClick = () => {
        setIsSearchModalOpen(true);
    };

    const onDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const onDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = widgets.findIndex((item) => item === active.id);
            const newIndex = widgets.findIndex((item) => item === over.id);
            const newWidgets = arrayMove(widgets, oldIndex, newIndex);
            syncSettings({
                ...settings,
                widgets: newWidgets
            });
        }

        setActiveId(null);
    };

    const onDragCancel = () => {
        setActiveId(null); // ★★★ 이 부분도 혹시 필요하다면 추가해 주세요. (드래그 취소 시) ★★★
    };
    
    const [showHeader, setShowHeader] = useState(true);
    const lastScrollY = useRef(0);
    const scrollDirection = useRef('down');
    const [activeId, setActiveId] = useState(null);

    const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 8 } });
    const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 500, tolerance: 5 } });
    const sensors = useSensors(mouseSensor, touchSensor);

    // ✅ GAPI 초기화 (앱 시작 시 한 번만)
    useEffect(() => {
        initializeGapiClient()
            .then(() => {
                console.log('✅ GAPI 준비 완료');
                setIsGapiReady(true);
            })
            .catch((error) => {
                console.error('❌ GAPI 초기화 실패:', error);
            });
    }, []);

    // ✅ 앱 시작 시 저장된 정보 복원 (기존 useEffect를 확장)
    useEffect(() => {
        const loadProfileData = async () => {
            const savedProfile = localStorage.getItem('userProfile');
            const savedToken = localStorage.getItem('accessToken');
            const savedTokenExpiresAt = localStorage.getItem('tokenExpiresAt');
            const savedCustomPicture = localStorage.getItem('customProfilePicture');
            const userId = localStorage.getItem('firebaseUserId');

            if (savedProfile) {
                // 프로필은 항상 복원 (로그인 상태 유지)
                const profileData = JSON.parse(savedProfile);

                // Firestore에서 최신 닉네임 가져오기
                if (userId) {
                    try {
                        const { getUserNickname } = await import('./services/nicknameService');
                        const firestoreNickname = await getUserNickname(userId);
                        if (firestoreNickname) {
                            profileData.nickname = firestoreNickname;
                            localStorage.setItem('userNickname', firestoreNickname); // localStorage 동기화
                        } else {
                            // Firestore에 없으면 localStorage 사용
                            const savedNickname = localStorage.getItem('userNickname');
                            if (savedNickname) {
                                profileData.nickname = savedNickname;
                            }
                        }
                    } catch (error) {
                        console.error('닉네임 로드 실패:', error);
                        // 에러 시 localStorage 폴백
                        const savedNickname = localStorage.getItem('userNickname');
                        if (savedNickname) {
                            profileData.nickname = savedNickname;
                        }
                    }
                }

                // 저장된 커스텀 프로필 사진이 있으면 추가
                if (savedCustomPicture) {
                    profileData.customPicture = savedCustomPicture;
                }

                setProfile(profileData);

                // 토큰 검증 및 설정
                if (savedToken && savedTokenExpiresAt) {
                    const expiresAt = parseInt(savedTokenExpiresAt, 10);
                    const now = Date.now();

                    // 토큰이 만료되었는지 확인 (5분 여유를 둠)
                    if (now >= expiresAt - 5 * 60 * 1000) {
                        console.log('⚠️ 저장된 토큰이 만료되었습니다. 동기화 시 재인증이 필요합니다.');
                        // 만료된 토큰만 삭제 (프로필은 유지)
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('tokenExpiresAt');
                        setAccessTokenState(null);
                    } else {
                        // 토큰이 유효함
                        console.log('✅ 유효한 토큰으로 복원됨');
                        setAccessTokenState(savedToken);

                        // GAPI가 준비되면 토큰 설정
                        if (isGapiReady) {
                            setAccessToken(savedToken);
                        }
                    }
                } else {
                    console.log('⚠️ 토큰이 없습니다. 동기화 시 재인증이 필요합니다.');
                    setAccessTokenState(null);
                }
            }

            setIsLoading(false);
        };

        loadProfileData();
    }, [isGapiReady]);

    // ✅ 닉네임 변경 이벤트 리스너
    useEffect(() => {
        const handleNicknameChanged = (event) => {
            const newNickname = event.detail;
            console.log('🔔 닉네임 변경 이벤트 수신:', newNickname);

            setProfile(prevProfile => {
                if (!prevProfile) return prevProfile;
                return {
                    ...prevProfile,
                    nickname: newNickname
                };
            });
        };

        window.addEventListener('nicknameChanged', handleNicknameChanged);

        return () => {
            window.removeEventListener('nicknameChanged', handleNicknameChanged);
        };
    }, []);

    // ✅ 프로필 사진 변경 이벤트 리스너
    useEffect(() => {
        const handleProfilePictureChanged = (event) => {
            const { picture } = event.detail;
            console.log('📸 프로필 사진 변경 이벤트 수신');

            setProfile(prevProfile => {
                if (!prevProfile) return prevProfile;
                return {
                    ...prevProfile,
                    customPicture: picture
                };
            });
        };

        window.addEventListener('profilePictureChanged', handleProfilePictureChanged);

        return () => {
            window.removeEventListener('profilePictureChanged', handleProfilePictureChanged);
        };
    }, []);

    // ✅ 로그인 성공 시 처리 - 휴대폰 인증 통합
    const handleLoginSuccess = async (response) => {
        try {
            const { accessToken, userInfo, expiresAt } = response;

            // ★★★ 수정: 강력한 URL HTTPS 강제 변환 로직 ★★★
            let pictureUrl = userInfo.picture;
            if (pictureUrl) {
                // http:// 또는 https:// 부분을 제거하고 무조건 https://를 붙입니다.
                const strippedUrl = pictureUrl.replace(/^https?:\/\//, '');
                pictureUrl = `https://${strippedUrl}`;
            }
            // ★★★

            // 🔥 Firebase Auth에 Google credential로 로그인 (Firestore 권한용)
            let firebaseUserId;
            try {
                const credential = GoogleAuthProvider.credential(null, accessToken);
                const userCredential = await signInWithCredential(auth, credential);
                firebaseUserId = userCredential.user.uid;
                console.log('✅ Firebase Auth 로그인 성공 - uid:', firebaseUserId);
            } catch (firebaseError) {
                console.warn('⚠️ Firebase Auth 로그인 실패, 대체 ID 사용:', firebaseError);
                // Firebase Auth 실패 시 대체 ID 사용
                firebaseUserId = userInfo.sub || userInfo.id || btoa(userInfo.email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 28);
            }

            // 🔐 휴대폰 인증 플로우 시작
            console.log('🔐 휴대폰 번호 확인 중...');

            // 1. Firebase UID로 연결된 휴대폰 번호 조회
            const existingPhone = await findPhoneByFirebaseUID(firebaseUserId);

            if (existingPhone) {
                // 이미 휴대폰 인증이 완료된 사용자
                console.log('✅ 기존 인증 완료 사용자:', existingPhone);

                // MindFlow Primary ID로 계속 진행
                await completeMindFlowLogin(existingPhone, firebaseUserId, accessToken, userInfo, pictureUrl, expiresAt);
            } else {
                // 휴대폰 인증이 필요한 사용자
                console.log('📱 휴대폰 인증 필요');

                // 구 구조 사용자 확인
                // ✅ Progressive Onboarding: 휴대폰 인증은 특정 기능 사용 시에만 요구
                const existingPhone = await findPhoneByFirebaseUID(firebaseUserId);

                if (existingPhone) {
                    // 이미 휴대폰 인증을 완료한 사용자
                    console.log('✅ 기존 휴대폰 인증 사용자:', existingPhone);
                    localStorage.setItem('mindflowUserId', existingPhone);
                    localStorage.setItem('isPhoneVerified', 'true');
                } else {
                    // 신규 사용자 또는 아직 휴대폰 인증하지 않은 사용자
                    console.log('📱 휴대폰 미인증 사용자 - 특정 기능 사용 시 인증 필요');
                    localStorage.setItem('isPhoneVerified', 'false');

                    const isLegacy = await isLegacyUser(firebaseUserId);
                    if (isLegacy) {
                        console.log('⚠️ 구 구조 사용자 감지 - 채팅/협업 사용 시 인증 필요');
                    }
                }

                // 휴대폰 인증 데이터 저장 (나중에 필요할 때 사용)
                setPendingAuthData({
                    firebaseUserId,
                    accessToken,
                    userInfo,
                    pictureUrl,
                    expiresAt
                });

                // Google 로그인만으로도 앱 사용 가능
                await handleSimpleLogin(firebaseUserId, accessToken, userInfo, pictureUrl, expiresAt);
                setIsLoginModalOpen(false);
            }
        } catch (error) {
            console.error('❌ 로그인 처리 중 오류:', error);
            showToast('⚠ 로그인에 실패했습니다');
        }
    };

    // 🔓 간단 로그인 처리 (Google 로그인만, 휴대폰 인증 없이)
    const handleSimpleLogin = async (firebaseUserId, accessToken, userInfo, pictureUrl, expiresAt) => {
        try {
            console.log('🔓 Google 로그인 처리 (휴대폰 인증 없음)');

            // 사용자 프로필 설정
            const profileData = {
                email: userInfo.email,
                name: userInfo.name,
                picture: pictureUrl
            };

            const savedNickname = localStorage.getItem('userNickname');
            const savedCustomPicture = localStorage.getItem('customProfilePicture');

            if (savedNickname) {
                profileData.nickname = savedNickname;
            }
            if (savedCustomPicture) {
                profileData.customPicture = savedCustomPicture;
            }

            setProfile(profileData);
            setAccessTokenState(accessToken);

            // localStorage에 로그인 정보 저장
            localStorage.setItem('userProfile', JSON.stringify(profileData)); // ✅ 추가: 프로필 저장
            localStorage.setItem('firebaseUserId', firebaseUserId);
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
            localStorage.setItem('userPicture', pictureUrl);
            localStorage.setItem('tokenExpiresAt', expiresAt);
            localStorage.setItem('lastLoginTime', Date.now().toString());

            // 👤 협업용 사용자 문서 생성/업데이트 (users 컬렉션)
            try {
                const userRef = doc(db, 'users', firebaseUserId);
                const userDoc = await getDoc(userRef);

                const userData = {
                    displayName: userInfo.name,
                    email: userInfo.email,
                    photoURL: pictureUrl,
                    phoneNumber: null, // 아직 인증 안함
                    updatedAt: Date.now()
                };

                if (!userDoc.exists()) {
                    await setDoc(userRef, {
                        ...userData,
                        createdAt: Date.now()
                    });
                    console.log('✅ 협업용 사용자 문서 생성 완료');
                } else {
                    await updateDoc(userRef, userData);
                    console.log('✅ 협업용 사용자 정보 업데이트 완료');
                }
            } catch (userError) {
                console.error('⚠️ 사용자 문서 생성/업데이트 오류:', userError);
            }

            // GAPI에 토큰 설정
            if (isGapiReady) {
                console.log('🔑 로그인 성공 - GAPI에 토큰 설정');
                setAccessToken(accessToken);
                await new Promise(resolve => setTimeout(resolve, 200));
                console.log('✅ GAPI 토큰 설정 완료');
            } else {
                console.warn('⚠️ GAPI가 아직 준비되지 않음 - 토큰은 저장됨');
            }

            showToast('✓ 로그인되었습니다');
        } catch (error) {
            console.error('로그인 처리 중 오류:', error);
            showToast('⚠ 로그인에 실패했습니다');
        }
    };

    // 🔐 MindFlow 로그인 완료 처리 (휴대폰 인증 후 호출)
    const completeMindFlowLogin = async (phoneNumber, firebaseUserId, accessToken, userInfo, pictureUrl, expiresAt) => {
        try {
            console.log('🔐 MindFlow 로그인 완료 처리 시작:', phoneNumber);

            // 사용자 프로필 설정
            const profileData = {
                email: userInfo.email,
                name: userInfo.name,
                picture: pictureUrl,
                phoneNumber: phoneNumber // Primary ID 추가
            };

            // ✅ 기존에 저장된 커스텀 닉네임 및 프로필 사진이 있으면 추가
            const savedNickname = localStorage.getItem('userNickname');
            const savedCustomPicture = localStorage.getItem('customProfilePicture');

            if (savedNickname) {
                profileData.nickname = savedNickname;
            }
            if (savedCustomPicture) {
                profileData.customPicture = savedCustomPicture;
            }

            setProfile(profileData);
            setAccessTokenState(accessToken);

            localStorage.setItem('userProfile', JSON.stringify(profileData));
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('tokenExpiresAt', expiresAt.toString());
            localStorage.setItem('firebaseUserId', firebaseUserId); // 협업 기능용
            localStorage.setItem('mindflowUserId', phoneNumber); // 🔥 새로운 Primary ID

            console.log('✅ 로그인 완료 - Primary ID:', phoneNumber);

            // 📊 Analytics 사용자 ID 및 속성 설정
            try {
                const { setAnalyticsUserId, setAnalyticsUserProperties, logLoginEvent } = await import('./utils/analyticsUtils.js');
                setAnalyticsUserId(phoneNumber); // Primary ID 사용
                setAnalyticsUserProperties({
                    user_name: userInfo.name,
                    user_email: userInfo.email,
                });
                logLoginEvent('google');
            } catch (analyticsError) {
                console.warn('⚠️ Analytics 설정 오류:', analyticsError);
            }

            // 👤 사용자 문서 생성/업데이트 (users 컬렉션 - 협업용)
            try {
                const userRef = doc(db, 'users', firebaseUserId);
                const userDoc = await getDoc(userRef);

                const userData = {
                    displayName: userInfo.name,
                    email: userInfo.email,
                    photoURL: pictureUrl,
                    phoneNumber: phoneNumber,
                    updatedAt: Date.now()
                };

                if (!userDoc.exists()) {
                    await setDoc(userRef, {
                        ...userData,
                        createdAt: Date.now()
                    });
                    console.log('✅ 협업용 사용자 문서 생성 완료');
                } else {
                    await updateDoc(userRef, userData);
                    console.log('✅ 협업용 사용자 정보 업데이트 완료');
                }
            } catch (userError) {
                console.error('⚠️ 사용자 문서 생성/업데이트 오류:', userError);
            }

            // GAPI에 토큰 설정
            if (isGapiReady) {
                console.log('🔑 로그인 성공 - GAPI에 토큰 설정');
                setAccessToken(accessToken);
                await new Promise(resolve => setTimeout(resolve, 200));
                console.log('✅ GAPI 토큰 설정 완료');
            } else {
                console.warn('⚠️ GAPI가 아직 준비되지 않음 - 토큰은 저장됨');
            }

            setIsLoginModalOpen(false);
            showToast('✓ 로그인되었습니다');
        } catch (error) {
            console.error('로그인 처리 중 오류:', error);
            showToast('⚠ 로그인에 실패했습니다');
        }
    };

    // 🔐 휴대폰 인증 완료 핸들러
    const handlePhoneVerified = async ({ phoneNumber, firebaseUID, userInfo }) => {
        try {
            console.log('📱 휴대폰 인증 완료:', phoneNumber);

            // 1. 해당 휴대폰 번호로 기존 계정 확인
            const existingAccount = await findAccountByPhone(phoneNumber);

            if (existingAccount) {
                // 🔐 보안: 1 휴대폰 = 1 Google 계정 엄격 매핑
                const existingGoogleUID = existingAccount.loginMethods?.google?.firebaseUID;

                if (existingGoogleUID === firebaseUID) {
                    // ✅ 같은 Google 계정 → 재로그인 (정상)
                    console.log('✅ 기존 계정 재로그인');
                } else {
                    // ❌ 다른 Google 계정 → 차단
                    console.warn('⚠️ 이미 다른 Google 계정에 연결된 휴대폰 번호');
                    showToast('⚠ 이미 다른 계정에 등록된 휴대폰 번호입니다');

                    // 인증 취소
                    setIsPhoneVerifying(false);
                    setPendingAuthData(null);
                    return;
                }
            } else {
                // 🆕 새 계정 생성
                console.log('🆕 새 계정 생성');
                await createMindFlowAccount(phoneNumber, firebaseUID, userInfo);
            }

            // 2. 로그인 완료 처리
            const { accessToken, pictureUrl, expiresAt } = pendingAuthData;
            await completeMindFlowLogin(phoneNumber, firebaseUID, accessToken, userInfo, pictureUrl, expiresAt);

            // 3. 상태 정리
            setIsPhoneVerifying(false);
            setPendingAuthData(null);

            showToast('✓ 계정 인증이 완료되었습니다');
        } catch (error) {
            console.error('❌ 휴대폰 인증 처리 실패:', error);
            showToast('⚠ 인증 처리에 실패했습니다');
        }
    };

    // 🔐 휴대폰 인증 취소 핸들러
    const handlePhoneCancelled = () => {
        console.log('📱 휴대폰 인증 취소됨');
        setIsPhoneVerifying(false);
        setPendingAuthData(null);
        showToast('인증이 취소되었습니다');
    };

    // 🔐 휴대폰 인증 확인 함수
    const checkPhoneVerification = () => {
        return localStorage.getItem('isPhoneVerified') === 'true';
    };

    // 🚪 기능별 인증 게이트 (Feature-Gated Authentication)
    const requirePhoneAuth = (featureName, callback) => {
        const isVerified = checkPhoneVerification();

        if (isVerified) {
            // 인증 완료 → 기능 실행
            callback();
        } else {
            // 미인증 → 인증 요구 모달 표시
            setAuthRequiredFeature(featureName);
            setIsAuthRequiredModalOpen(true);
        }
    };

    // 인증 모달에서 "지금 인증하기" 클릭 시
    const handleStartPhoneAuth = () => {
        setIsAuthRequiredModalOpen(false);

        // 로그인되어 있는지 확인
        if (!profile || !pendingAuthData) {
            // 로그인 안되어 있음 → 먼저 로그인 필요
            showToast('⚠ 먼저 Google 로그인이 필요합니다');
            setIsLoginModalOpen(true);
        } else {
            // 로그인 되어 있음 → 휴대폰 인증 시작
            setIsPhoneVerifying(true);
        }
    };

    const handleLoginError = () => {
        console.log('Login Failed');
        setIsLoginModalOpen(false);
    };

    // ✅ 토큰 자동 갱신 체크 (토큰 만료 10분 전에 확인)
    useEffect(() => {
        if (!accessToken) return;

        const checkTokenExpiry = () => {
            const expiresAtStr = localStorage.getItem('tokenExpiresAt');
            if (!expiresAtStr) return;

            const expiresAt = parseInt(expiresAtStr, 10);
            const now = Date.now();
            const timeUntilExpiry = expiresAt - now;

            // 토큰이 10분 이내에 만료될 예정
            if (timeUntilExpiry < 10 * 60 * 1000 && timeUntilExpiry > 0) {
                console.log(`⏰ 토큰이 ${Math.floor(timeUntilExpiry / 1000 / 60)}분 후 만료 예정 - 자동 갱신 필요`);
                // 토큰 삭제하여 다음 동기화 시 재로그인 유도
                localStorage.removeItem('accessToken');
                localStorage.removeItem('tokenExpiresAt');
                setAccessTokenState(null);
                console.log('🔐 토큰 제거됨 - 다음 동기화 시 재로그인 필요');
            } else if (timeUntilExpiry <= 0) {
                console.log('❌ 토큰이 이미 만료됨 - 제거');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('tokenExpiresAt');
                setAccessTokenState(null);
            }
        };

        // 초기 체크
        checkTokenExpiry();

        // 5분마다 체크
        const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [accessToken]);

    // ✅ handleSync 함수 (performSync(true) 호출 확인)
    const handleSync = async () => {
        console.log('🔄 handleSync 호출됨');
        console.log('👤 profile:', profile);
        console.log('🔑 accessToken:', accessToken ? '있음' : '없음');
        console.log('📡 isGapiReady:', isGapiReady);
        
        await performSync(true);
    };

    const quietSync = () => {
        // 기존 타이머 클리어
        if (syncDebounceRef.current) {
            clearTimeout(syncDebounceRef.current);
        }

        // 🔥 Firestore는 이미 디바운싱 되므로 즉시 저장 (useFirestoreSync의 1초 디바운스 사용)
        // 별도로 3초 디바운스를 추가로 걸 필요 없음
        console.log('🔄 조용한 동기화 (Firestore 자동 디바운스)');
    };

    const performSync = async (isManual = false) => {
        console.log('🔧 performSync 시작 - isManual:', isManual);

        // 🔥 Firestore 기반 동기화로 변경
        if (!userId || !isAuthenticated) {
            console.log('❌ 로그인 안 됨');
            if (isManual) {
                showToast('🔐 로그인이 필요합니다');
                console.log('Toast 표시: 로그인이 필요합니다');
            }
            return false;
        }

        try {
            console.log('✅ Firestore 동기화 시작');

            if (isManual) {
                console.log('🎯 수동 동기화 - 스피너 표시');
                setIsSyncing(true);
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            // 🔥 1. 현재 로컬 데이터를 즉시 Firestore에 저장
            console.log('📤 로컬 데이터 → Firestore 저장 중...');
            await saveImmediately();

            // 🔥 2. Firestore에서 최신 데이터 다시 가져오기 (다른 기기의 변경사항 반영)
            console.log('📥 Firestore → 최신 데이터 로드 중...');
            const freshData = await fetchAllUserData(userId);

            // 3. 로컬 상태 업데이트
            if (freshData.memos) syncMemos(freshData.memos);
            if (freshData.folders) syncFolders(freshData.folders);
            if (freshData.trash) syncTrash(freshData.trash);
            if (freshData.macros) syncMacros(freshData.macros);
            if (freshData.calendar) syncCalendar(freshData.calendar);
            if (freshData.activities) syncActivities(freshData.activities);
            if (freshData.settings) syncSettings(freshData.settings);

            // 4. 성공 처리
            const now = Date.now();
            setLastSyncTime(now);
            localStorage.setItem('lastSyncTime', now.toString());

            if (isManual) {
                console.log('✅ 수동 동기화 - 활동 기록 추가');
                addActivity('동기화', 'Firestore 동기화 완료');
                await new Promise(resolve => setTimeout(resolve, 500));
                console.log('✅ 수동 동기화 - 토스트 표시');
                showToast('✅ 동기화 완료!');
                console.log('Toast 표시: 동기화 완료');
            }
            return true;

        } catch (error) {
            console.error('❌ Firestore 동기화 중 오류:', error);
            if (isManual) showToast('❌ 동기화 실패');
            return false;
        } finally {
            if (isManual) {
                console.log('🎯 수동 동기화 - 스피너 숨김');
                setIsSyncing(false);
            }
        }
    };

    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.hidden) {
                // 🔥 앱이 백그라운드로 전환됨 - Firestore에 즉시 저장
                if (userId && isAuthenticated) {
                    try {
                        await saveImmediately();
                        console.log('✅ 백그라운드 동기화 완료');
                    } catch (error) {
                        console.error('❌ 백그라운드 동기화 실패:', error);
                    }
                }
            }
            // ⚠️ 포그라운드 복귀 시 데이터 로드 제거 - 실시간 리스너가 이미 동기화 중
            // 불필요한 fetchAllUserData() 호출로 Firestore quota 낭비 방지
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [userId, isAuthenticated, saveImmediately]);


    // 🔥 앱 종료 시 Firestore에 마지막 동기화
    useEffect(() => {
        const handleBeforeUnload = async () => {
            if (userId && isAuthenticated) {
                console.log('👋 앱 종료 전 Firestore 마지막 동기화...');

                try {
                    await saveImmediately(); // Firestore에 즉시 저장
                    console.log('✅ 종료 전 동기화 완료');
                } catch (error) {
                    console.error('❌ 종료 전 동기화 실패:', error);
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [userId, isAuthenticated, saveImmediately]);

    // ✅ Google Drive에서 복원 - 새로 추가
    const handleRestoreFromDrive = async () => {
        if (!profile || !accessToken) {
            showToast('⚠ 로그인이 필요합니다');
            setIsLoginModalOpen(true);
            return;
        }

        if (!isGapiReady) {
            showToast('⏳ Drive 연결 준비 중...');
            return;
        }

        // 확인 모달 표시
        setRestoreType('google');
        setIsRestoreConfirmOpen(true);
    };

    const executeGoogleDriveRestore = async () => {
        try {
            const result = await loadFromGoogleDrive();

            if (result.success && result.data) {
                if (result.data.memos) syncMemos(result.data.memos);
                if (result.data.calendarSchedules) syncCalendar(result.data.calendarSchedules);
                if (result.data.recentActivities) syncActivities(result.data.recentActivities);
                if (result.data.displayCount || result.data.widgets) {
                    syncSettings({
                        ...settings,
                        ...(result.data.widgets && { widgets: result.data.widgets }),
                        ...(result.data.displayCount && { displayCount: result.data.displayCount })
                    });
                }
                if (result.data.trashedItems) {
                    localStorage.setItem('trashedItems_shared', JSON.stringify(result.data.trashedItems));
                }
                if (result.data.macroTexts) {
                    localStorage.setItem('macroTexts', JSON.stringify(result.data.macroTexts));
                }
                if (result.data.memoFolders) {
                    localStorage.setItem('memoFolders', JSON.stringify(result.data.memoFolders));
                }

                addActivity('복원', 'Google Drive에서 복원 완료');
                showToast('✓ 데이터가 복원되었습니다');

                setIsMenuOpen(false);
            } else if (result.message === 'NO_FILE') {
                showToast('⚠ 복원할 데이터가 없습니다');
            } else if (result.error === 'TOKEN_EXPIRED') {
                showToast('⚠ 로그인이 만료되었습니다');
                handleLogout();
            } else {
                showToast('⚠ 복원에 실패했습니다');
            }
        } catch (error) {
            console.error('복원 중 오류:', error);
            showToast('⚠ 복원 중 오류가 발생했습니다');
        }

        // 초기화
        setIsRestoreConfirmOpen(false);
    };

    // ✅ 로그아웃 (확장됨)
    const handleLogout = async () => {
        // 🔥 로그아웃 전 Firestore에 즉시 저장
        try {
            // userId(휴대폰 번호) 또는 firebaseUserId로 저장 시도
            const firebaseUserId = localStorage.getItem('firebaseUserId');
            if ((userId || firebaseUserId) && isAuthenticated) {
                console.log('💾 로그아웃 전 데이터 저장 중...');
                await saveImmediately();
                console.log('✅ 데이터 저장 완료');
            } else {
                console.log('⚠️ 로그인 상태가 아니므로 저장 생략');
            }
        } catch (error) {
            console.error('데이터 저장 오류:', error);
        }

        // 🔥 Firebase Auth 로그아웃
        try {
            if (auth) {
                await signOut(auth);
                console.log('🔥 Firebase 로그아웃 완료');
            }
        } catch (error) {
            console.error('Firebase 로그아웃 오류:', error);
        }

        // 🔑 Google OAuth 토큰 revoke 및 세션 초기화
        try {
            // 1. @react-oauth/google 라이브러리 로그아웃
            googleLogout();
            console.log('✅ googleLogout() 호출 완료');

            // 2. Google Identity Services 자동 선택 비활성화
            if (window.google?.accounts?.id) {
                window.google.accounts.id.disableAutoSelect();
                console.log('✅ disableAutoSelect() 호출 완료');
            }

            // 3. 토큰 Revoke (API 호출)
            if (accessToken) {
                await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
                    method: 'POST',
                    headers: {
                        'Content-type': 'application/x-www-form-urlencoded'
                    }
                });
                console.log('🔑 Google OAuth 토큰 revoke 완료');
            }
        } catch (error) {
            console.error('Google OAuth 로그아웃 오류:', error);
        }

        // 상태 초기화
        setProfile(null);
        setAccessTokenState(null);

        // localStorage 완전 정리
        localStorage.removeItem('userProfile');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('tokenExpiresAt');
        localStorage.removeItem('lastSyncTime');
        localStorage.removeItem('firebaseUserId');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('userPicture');
        localStorage.removeItem('lastLoginTime');
        localStorage.removeItem('mindflowUserId');
        localStorage.removeItem('isPhoneVerified');

        // sessionStorage 완전 정리 (Google OAuth 세션 포함)
        sessionStorage.clear();
        console.log('✅ sessionStorage 정리 완료');

        // IndexedDB 정리 (Google Identity Services가 사용하는 데이터베이스)
        try {
            const databases = await window.indexedDB.databases();
            databases.forEach(db => {
                if (db.name && (
                    db.name.includes('google') ||
                    db.name.includes('gsi') ||
                    db.name.includes('oauth')
                )) {
                    window.indexedDB.deleteDatabase(db.name);
                    console.log(`🗑️ IndexedDB 삭제: ${db.name}`);
                }
            });
        } catch (error) {
            console.warn('IndexedDB 정리 실패 (무시 가능):', error);
        }

        showToast("✓ 로그아웃되었습니다");
        setIsMenuOpen(false);
        setIsLoginModalOpen(false);

        // 자동 동기화 중지
        if (syncIntervalRef.current) {
            clearInterval(syncIntervalRef.current);
        }

        console.log('✅ 로그아웃 완료 - 상태 초기화됨');

        // LoginModal 강제 리마운트를 위해 key 변경
        setLoginKey(prev => prev + 1);

        // Google OAuth 완전 초기화를 위해 페이지 강제 새로고침 (캐시 무시)
        // (토스트 메시지가 보인 후 새로고침)
        setTimeout(() => {
            // 캐시를 무시하고 서버에서 페이지를 다시 로드
            window.location.href = window.location.origin + window.location.pathname;
        }, 800);
    };
    
    useEffect(() => {
        console.log('🔍 showHeader 상태 변경:', showHeader);
    }, [showHeader]);

    const lastScrollYRef = useRef(0);
    
    // ★★★ 스크롤 임계값 변수를 정의합니다. ★★★
    const HIDE_THRESHOLD = 80; // 이 값 이상 스크롤해야 헤더가 숨겨집니다.
    const SHOW_THRESHOLD = 5; // 이 값 이하로 스크롤해야 헤더가 다시 나타납니다.

    useEffect(() => {
    const handleScroll = () => {
        const currentY = contentAreaRef.current.scrollTop;

        // 1. 스크롤 다운 (숨기기) 로직
        // 현재 스크롤 위치가 이전에 저장된 값보다 크고, 숨김 임계값보다 크면 숨깁니다.
        if (currentY > lastScrollYRef.current && currentY > HIDE_THRESHOLD) { 
            setShowHeader(false);
        } 
        // 2. 스크롤 업 (보이기) 로직
        // 현재 스크롤 위치가 이전에 저장된 값보다 작고, 보이기 임계값보다 작으면 보이게 합니다.
        // 스크롤을 '위로' 올릴 때만 반응하도록 lastScrollYRef.current도 체크합니다.
        else if (currentY < lastScrollYRef.current && currentY <= SHOW_THRESHOLD) { 
            setShowHeader(true);
        }

        lastScrollYRef.current = currentY; 
    };

    const timer = setTimeout(() => {
        const contentArea = contentAreaRef.current;
        if (contentArea) {
        contentArea.addEventListener('scroll', handleScroll);
        console.log('✅ 스크롤 이벤트 리스너 등록됨');
        }
    }, 100);

    return () => {
        clearTimeout(timer);
        const contentArea = contentAreaRef.current;
        if (contentArea) {
        contentArea.removeEventListener('scroll', handleScroll);
        }
    };
    }, []);

    const executeCalendarDelete = () => {
        if (!dateToDelete) return;
        const key = format(dateToDelete, 'yyyy-MM-dd');
        const deletedEntry = calendarSchedules[key];
    
        if (deletedEntry) {
            // 휴지통으로 이동 이벤트 발생
            const event = new CustomEvent('moveToTrash', {
                detail: {
                    id: key,
                    type: 'schedule',
                    content: `${key} - ${deletedEntry.text}`,
                    originalData: { date: dateToDelete, ...deletedEntry }
                }
            });
            window.dispatchEvent(event);
            
            // 활동 내역 추가
            addActivity('스케줄 삭제', `${key} - ${deletedEntry.text}`);
        }

        const updated = { ...calendarSchedules };
        delete updated[key];
        syncCalendar(updated);

        showToast?.('✓ 스케줄이 삭제되었습니다');
        setIsCalendarConfirmOpen(false);
        setDateToDelete(null);
        quietSync();
    };
    
    
    useEffect(() => {
        if (contentAreaRef.current) {
            contentAreaRef.current.scrollTop = 0;
        }
    }, [activeTab]);
    
    const [loginService, setLoginService] = useState('none');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    
    // 새 메모 작성 시 저장할 폴더 ID
    const [newMemoFolderId, setNewMemoFolderId] = useState(null);
    // 현재 활성화된 폴더 ID (MemoPage의 activeFolder 추적용)
    const [currentActiveFolder, setCurrentActiveFolder] = useState('all');

    const handleOpenNewMemoFromPage = (folderId = null) => {
        setMemoOpenSource('page');
        setNewMemoFolderId(folderId); // 폴더 ID 저장
        setIsNewMemoModalOpen(true);
    };

    // FAB도 페이지 + 버튼과 동일하게 처리
    const handleOpenNewMemoFromFAB = () => {
        setMemoOpenSource('fab');
        // 현재 활성 폴더를 사용 ('all'이면 null로 저장)
        const targetFolderId = currentActiveFolder === 'all' ? null : currentActiveFolder;
        setNewMemoFolderId(targetFolderId);
        setIsNewMemoModalOpen(true);
    };

    // MemoPage의 활성 폴더 변경 추적
    const handleActiveFolderChange = (folderId) => {
        setCurrentActiveFolder(folderId);
    };

    const handleOpenDetailMemo = (memo, context = null) => {
        setSelectedMemo(memo);
        setMemoContext(context); // { activeFolder, sortOrder, sortDirection, sharedMemoInfo }
        setIsDetailModalOpen(true);
    };

    // 메모 컨텍스트에 따라 필터링 및 정렬된 메모 목록 가져오기
    const getFilteredAndSortedMemos = () => {
        if (!memoContext || !memos || !Array.isArray(memos)) {
            return memos || [];
        }

        const { activeFolder, sortOrder, sortDirection, sharedMemoInfo = new Map() } = memoContext;

        // 1. 폴더 필터링
        let filtered = memos.filter(memo => {
            // "전체"(all)일 때는 폴더에 속하지 않은 미분류 메모만 표시 (공유된 메모 제외)
            if (activeFolder === 'all') return !memo.folderId && !sharedMemoInfo.has(memo.id);
            // "공유"(shared)일 때는 folderId가 'shared'이거나 sharedMemoInfo에 있는 메모 표시
            if (activeFolder === 'shared') return memo.folderId === 'shared' || sharedMemoInfo.has(memo.id);
            // 다른 커스텀 폴더일 때는 해당 폴더 ID와 일치하고 공유되지 않은 메모만 표시
            return memo.folderId === activeFolder && !sharedMemoInfo.has(memo.id);
        });

        // 2. 정렬
        filtered = [...filtered].sort((a, b) => {
            if (sortOrder === 'importance') {
                // 중요 문서가 하나라도 있는지 확인
                const hasImportantMemo = filtered.some(memo => memo.isImportant);

                // 중요 문서가 없으면 정렬하지 않음 (현재 순서 유지)
                if (!hasImportantMemo) {
                    return 0;
                }

                // 중요도순 정렬
                const aImportant = a.isImportant ? 1 : 0;
                const bImportant = b.isImportant ? 1 : 0;

                if (sortDirection === 'desc') {
                    return bImportant - aImportant || (b.date || 0) - (a.date || 0);
                } else {
                    return aImportant - bImportant || (a.date || 0) - (b.date || 0);
                }
            } else if (sortOrder === 'updated') {
                // 수정순 정렬 (updatedAt이 없으면 createdAt 사용)
                const aUpdated = a.updatedAt || a.createdAt || a.date || 0;
                const bUpdated = b.updatedAt || b.createdAt || b.date || 0;

                if (sortDirection === 'desc') {
                    return bUpdated - aUpdated;
                } else {
                    return aUpdated - bUpdated;
                }
            } else {
                // 등록순 정렬 (date 기준)
                if (sortDirection === 'desc') {
                    return (b.date || 0) - (a.date || 0);
                } else {
                    return (a.date || 0) - (b.date || 0);
                }
            }
        });

        return filtered;
    };

    const [selectedDate, setSelectedDate] = useState(new Date()); // 새로운 상태 추가

    const handleSelectDate = (date) => {
        setSelectedDate(date);
        // 나중에 스케줄 에디터를 렌더링하는 데 사용됩니다.
    };

    useEffect(() => {
        return () => {
            if (syncDebounceRef.current) {
                clearTimeout(syncDebounceRef.current);
            }
        };
    }, []);

    // ✅ 휴지통에서 복원 이벤트 리스너
    useEffect(() => {
        const handleRestore = (event) => {
            const restoredItems = event.detail;

            console.log('♻️ [App.jsx] 복원 이벤트 수신:', restoredItems);

            restoredItems.forEach(item => {
                if (item.type === 'memo') {
                    // 메모 복원 - 기존 메모에 추가
                    syncMemos(prevMemos => {
                        console.log('📊 현재 메모 수:', prevMemos.length);
                        console.log('➕ 복원할 메모:', item.originalData);
                        const newMemos = [item.originalData, ...prevMemos];
                        console.log('✅ 복원 후 메모 수:', newMemos.length);
                        return newMemos;
                    });
                    addActivity('메모 복원', item.content);
                    console.log('✅ 메모 복원됨:', item.originalData);
                } else if (item.type === 'schedule') {
                    // 스케줄 복원
                    const { date, ...scheduleData } = item.originalData;
                    const key = format(new Date(date), 'yyyy-MM-dd');
                    syncCalendar(prevSchedules => ({
                        ...prevSchedules,
                        [key]: scheduleData
                    }));
                    addActivity('스케줄 복원', item.content);
                    console.log('✅ 스케줄 복원됨:', { key, scheduleData });
                } else if (item.type === 'secret') {
                    // 비밀글 복원 - SecretPage에서 itemsRestored 이벤트로 처리됨
                    // 여기서는 activity만 추가
                    addActivity('비밀글 복원', item.content);
                    console.log('✅ 비밀글 복원 (SecretPage에서 처리됨):', item.originalData);
                }
            });

            quietSync();
        };

        console.log('👂 [App.jsx] itemsRestored 이벤트 리스너 등록');
        window.addEventListener('itemsRestored', handleRestore);
        return () => {
            console.log('🔇 [App.jsx] itemsRestored 이벤트 리스너 제거');
            window.removeEventListener('itemsRestored', handleRestore);
        };
    }, []);

    if (isLoading) {
        return (
            <Screen>
                <LoadingScreen>
                    앱을 불러오는 중...
                </LoadingScreen>
            </Screen>
        );
    }

    return (
        <AppRouter>
            <TrashProvider autoDeleteDays={30} trashedItems={trash} setTrashedItems={syncTrash}>
                <AppContent>
                    <GlobalStyle />
                <Screen>
                {/* ★★★ 더 이상 로그인 여부로 화면을 막지 않고, 항상 메인 앱을 보여줍니다. ★★★ */}
                <>
                    <Header
                        key={showHeader.toString()}
                        profile={profile}
                        onLogout={handleLogout}
                        onSearchClick={handleSearchClick}
                        onMenuClick={handleToggleMenu}
                        isHidden={!showHeader}
                        onLoginClick={() => setIsLoginModalOpen(true)}
                        onProfileClick={handleProfileClick}
                    />

                    {pullDistance > 0 && (
                        <PullToRefreshIndicator
                            $distance={pullDistance}
                            $isActive={isPulling}
                            $showHeader={showHeader}
                        >
                            <RefreshIcon $isActive={isPulling} />
                            <RefreshText>
                                {isPulling ? '손을 떼면 동기화' : '당겨서 새로고침'}
                            </RefreshText>
                        </PullToRefreshIndicator>
                    )}

                    <ContentArea
                        ref={contentRef}
                        $showHeader={showHeader}
                        $isSecretTab={activeTab === 'secret'}
                        $pullDistance={pullDistance}
                        $isPulling={pullDistance > 0}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {activeTab === 'home' && (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                                <SortableContext items={widgets} strategy={verticalListSortingStrategy}>
                                    {widgets.map((widgetName) => (
                                        <DraggableWidget
                                            key={widgetName}
                                            id={widgetName}
                                            onSwitchTab={handleSwitchTab}
                                            addActivity={addActivity}
                                            recentActivities={recentActivities}
                                            displayCount={displayCount}
                                            setDisplayCount={setDisplayCount}
                                            deleteActivity={deleteActivity}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        )}
                        {activeTab === 'calendar' && (
                            <Calendar
                                key="calendar"
                                onSelectDate={handleSelectDate}
                                addActivity={addActivity}
                                schedules={calendarSchedules}
                                setSchedules={syncCalendar}
                                showToast={showToast}
                                onRequestDelete={requestCalendarDelete}
                                onOpenAlarm={handleOpenAlarmModal}
                                onOpenEditor={handleOpenCalendarEditor}
                                onOpenDateSelector={() => setIsDateSelectorOpen(true)}
                            />
                        )}
                        {activeTab === 'memo' &&
                            <MemoPage
                                memos={memos}
                                onDeleteMemoRequest={requestDeleteConfirmation}
                                onOpenNewMemo={handleOpenNewMemoFromPage}
                                onOpenDetailMemo={handleOpenDetailMemo}
                                showToast={showToast}
                                isSelectionMode={isSelectionMode}
                                selectedMemoIds={selectedMemoIds}
                                onStartSelectionMode={handleStartSelectionMode}
                                onToggleMemoSelection={handleToggleMemoSelection}
                                onExitSelectionMode={handleExitSelectionMode}
                                onToggleSelectedMemosImportance={handleToggleSelectedMemosImportance}
                                onToggleSelectedMemosStealth={handleToggleSelectedMemosStealth}
                                onRequestDeleteSelectedMemos={requestDeleteSelectedMemos}
                                onUpdateMemoFolder={handleUpdateMemoFolder}
                                onUpdateMemoFolderBatch={handleUpdateMemoFolderBatch}
                                folderSyncContext={{ folders, syncFolder, deleteFolder }}
                                onRequestShareSelectedMemos={requestShareSelectedMemos}
                                onRequestUnshareSelectedMemos={requestUnshareSelectedMemos}
                                onActiveFolderChange={handleActiveFolderChange}
                            />
                        }
                        {activeTab === 'todo' && <div>할 일 페이지</div>}
                        {activeTab === 'recent-detail' && <div>최근 활동 상세 페이지</div>}
                        {activeTab === 'trash' && <TrashPage showToast={showToast} />}
                        {activeTab === 'secret' && (
                            <SecretPage
                                onClose={() => setActiveTab('home')}
                                profile={profile}
                                showToast={showToast}
                                setShowHeader={setShowHeader}
                            />
                        )}
                        {activeTab === 'chat' && <MessagingHub showToast={showToast} memos={memos} requirePhoneAuth={requirePhoneAuth} />}
                    </ContentArea>

                    <FloatingButton onClick={handleOpenNewMemoFromFAB} activeTab={activeTab} />
                    {activeTab === 'chat' && <AdBanner />}
                    <BottomNav activeTab={activeTab} onSwitchTab={handleSwitchTab} />
                    <SideMenu
                        isOpen={isMenuOpen}
                        onClose={handleToggleMenu}
                        displayCount={displayCount}
                        setDisplayCount={setDisplayCount}
                        showToast={showToast}
                        onOpenMacro={() => {
                            setIsMenuOpen(false);
                            setIsMacroModalOpen(true);
                        }}
                        onOpenFortune={handleOpenFortune}
                        onExport={handleDataExport}
                        onImport={handleDataImport}
                        onRestoreFromDrive={handleRestoreFromDrive}
                        onSync={handleSync}
                        profile={profile}
                        onProfileClick={handleProfileClick}
                        onLogout={handleLogout}
                        onLoginClick={() => setIsLoginModalOpen(true)}
                        onOpenTimer={() => setIsTimerOpen(true)}
                        onOpenTrash={() => {
                            setIsMenuOpen(false);
                            setActiveTab('trash');
                        }}
                        onOpenSecret={() => {
                            setIsMenuOpen(false);
                            setActiveTab('secret');
                        }}
                        onRestoreMemoFolder={handleRestoreMemoFolder}
                    />
                </>
            </Screen>
            
            {/* ★★★ 로그인 모달 렌더링 로직 ★★★ */}
            {isLoginModalOpen && (
                <LoginModal
                    key={`login-${loginKey}`}
                    onSuccess={handleLoginSuccess}
                    onError={handleLoginError}
                    onClose={() => setIsLoginModalOpen(false)}
                    setProfile={setProfile}
                />
            )}

            {/* 🔐 마스터 비밀번호 모달 */}
            {isMasterPasswordModalOpen && (
                <MasterPasswordModal
                    mode={masterPasswordMode}
                    onSuccess={handleMasterPasswordSuccess}
                    onCancel={null} // 취소 불가 (반드시 설정/입력 필요)
                />
            )}

            {/* 모달(Modal)들은 Screen 컴포넌트 바깥에 두어 전체 화면을 덮도록 합니다. */}
            <Toast message={toastMessage} />

            {/* 복원 확인 모달 */}
            {isRestoreConfirmOpen && (
                <ConfirmModal
                    type={restoreType}
                    onConfirm={() => {
                        if (restoreType === 'phone') {
                            executeDataImport();
                        } else {
                            executeGoogleDriveRestore();
                        }
                    }}
                    onCancel={() => {
                        setIsRestoreConfirmOpen(false);
                        setPendingRestoreFile(null);
                    }}
                />
            )}

            {isSearchModalOpen && (
                <SearchModal
                    onClose={() => setIsSearchModalOpen(false)}
                    allData={allData}
                    onSelectResult={(id, type) => {
                        // 검색 결과를 클릭하면 해당 문서를 엽니다 (검색 모달은 유지)
                        if (type === 'memo') {
                            // 메모 상세 보기
                            const memo = memos?.find(m => m.id === id);
                            if (memo) {
                                setSelectedMemo(memo);
                                setIsDetailModalOpen(true);
                            }
                        } else if (type === 'calendar' || type === 'alarm') {
                            // 일정/알람 - 캘린더 에디터 열기
                            const item = allData.find(d => d.id === id);
                            if (item && item.dateKey) {
                                const date = new Date(item.dateKey);
                                const scheduleData = calendarSchedules[item.dateKey] || {};
                                handleOpenCalendarEditor(date, scheduleData.text || '');
                            }
                        } else if (type === 'trash') {
                            // 휴지통 문서 - 토스트 메시지만 표시 (검색창은 열린 상태 유지)
                            showToast('이 문서는 휴지통에서 확인하세요', 1300);
                        }
                    }}
                />
            )}
            {isCalendarEditorOpen && (
                <CalendarEditorModal
                    isOpen={isCalendarEditorOpen}
                    onClose={() => setIsCalendarEditorOpen(false)}
                    data={calendarModalData}
                    onSave={handleCalendarScheduleSave}
                />
            )}
            {isDateSelectorOpen && (
                <DateSelectorModal
                    isOpen={isDateSelectorOpen}
                    onClose={() => setIsDateSelectorOpen(false)}
                    onSelectDate={handleSelectDate}
                />
            )}
            
            <NewMemoModal
                isOpen={isNewMemoModalOpen}
                openSource={memoOpenSource}
                onSave={handleSaveNewMemo}
                onCancel={() => {
                    setIsNewMemoModalOpen(false);
                    setMemoOpenSource(null);
                    setNewMemoFolderId(null); // 폴더 ID 초기화
                }}
            />

            <MemoDetailModal
                isOpen={isDetailModalOpen}
                memo={selectedMemo}
                memos={getFilteredAndSortedMemos()}
                onSave={handleEditMemo}
                onCancel={() => setIsDetailModalOpen(false)}
                onUpdateMemoFolder={handleUpdateMemoFolder}
                showToast={showToast}
                onNavigate={(nextMemo) => setSelectedMemo(nextMemo)}
                folderSyncContext={{ folders, syncFolder, deleteFolder }}
            />
            
            {isDeleteModalOpen && (
                <ConfirmationModal
                    isOpen={true}
                    message={
                        Array.isArray(memoToDelete) 
                            ? `선택한 ${memoToDelete.length}개의 메모를 정말 삭제하시겠습니까?`
                            : "메모를 정말 삭제하시겠습니까?"
                    }
                    onConfirm={handleDeleteConfirm}
                    onCancel={handleDeleteCancel}
                />
            )}

            {isCalendarConfirmOpen && dateToDelete && (
                <ConfirmationModal
                    isOpen={true}
                    message={
                        <>
                            {`${format(dateToDelete, '<yyyy년 M월 d일>의', { locale: ko })}`} 스케줄을
                            <br />
                            정말 삭제하시겠습니까?
                        </>
                    }
                    onConfirm={executeCalendarDelete}
                    onCancel={() => setIsCalendarConfirmOpen(false)}
                />
            )}

            {isUnshareConfirmOpen && (
                <ConfirmModal
                    title="공유 해제"
                    message={`선택한 ${selectedMemoIds.size}개의 문서 공유를 해제할까요?\n\n공유 해제된 문서는\n미분류 문서로 이동합니다.`}
                    onConfirm={executeUnshareSelectedMemos}
                    onCancel={() => setIsUnshareConfirmOpen(false)}
                />
            )}
            <AlarmModal
                isOpen={isAlarmModalOpen}
                scheduleData={scheduleForAlarm}
                onSave={handleSaveAlarm}
                onClose={() => setIsAlarmModalOpen(false)}
            />
            {/* ⚙️ 매크로 모달 */}
            {isMacroModalOpen && (
                <MacroModal
                    onClose={() => setIsMacroModalOpen(false)}
                    onSave={syncMacros}
                />
            )}
            {/* ✨ 🔮 오늘의 운세 전체 플로우 컴포넌트 */}
            {isFortuneFlowOpen && (
                <FortuneFlow
                    onClose={() => setIsFortuneFlowOpen(false)}
                    profile={profile}
                    // 운세 결과 및 기타 상태를 FortuneFlow 내부에서 관리
                />
            )}

            {/* ⏱️ 타이머 모달 */}
            {isTimerOpen && (
                <Timer onClose={() => setIsTimerOpen(false)} />
            )}

            {/* 👤 프로필 페이지 모달 */}
            {activeTab === 'profile' && (
                <ProfilePage
                    profile={profile}
                    memos={memos}
                    calendarSchedules={calendarSchedules}
                    showToast={showToast}
                    onClose={() => setActiveTab('home')}
                />
            )}

            {/* 📱 휴대폰 인증 모달 */}
            {isPhoneVerifying && pendingAuthData && (
                <PhoneVerification
                    onVerified={handlePhoneVerified}
                    onCancel={handlePhoneCancelled}
                    userInfo={pendingAuthData.userInfo}
                />
            )}

            {/* 🔐 휴대폰 인증 필요 알림 모달 */}
            <AuthRequiredModal
                isOpen={isAuthRequiredModalOpen}
                onClose={() => setIsAuthRequiredModalOpen(false)}
                onVerify={handleStartPhoneAuth}
                featureName={authRequiredFeature}
                reason="본인 확인을 위해 휴대폰 인증이 필요합니다"
            />

            {/* ⏰ 알람 토스트 알림 */}
            {toastAlarms.map((alarm) => (
                <AlarmToast
                    key={alarm.id}
                    isVisible={true}
                    alarmData={alarm}
                    onClose={() => dismissToast(alarm.id)}
                />
            ))}

            </AppContent>
        </TrashProvider>
        </AppRouter>
    );
}

export default App;