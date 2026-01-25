// src/App.jsx

import React, { useState, useEffect, useRef } from 'react';
import { GlobalStyle } from './styles.js';
import * as S from './App.styles';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { GoogleAuthProvider, signInWithCredential, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase/config';
import { initializeFCM } from './services/fcmService';
import { LocalNotifications } from '@capacitor/local-notifications';
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
import { setCurrentUserId, setCurrentUserData, getCurrentUserId, checkSync, migrateUserData, logout as userStorageLogout, getProfileSetting, setProfileSetting, cleanupSharedKeys } from './utils/userStorage';
import { diagnosticLog } from './utils/diagnosticLogger';
import { deleteBase64ImagesFromCalendar } from './services/userDataService';
import { findPhoneByFirebaseUID, isLegacyUser } from './services/authService';
import './utils/cleanBase64'; // window.cleanInvalidMemos 등록용
import MessagingHub from './components/messaging/MessagingHub.jsx';
import AuthRequiredModal from './components/AuthRequiredModal.jsx';
import ChatRoom from './components/messaging/ChatRoom.jsx';
import { subscribeToMyDMRooms } from './services/directMessageService';
import { subscribeToMyGroupChats } from './services/groupChatService';
import { getUserDisplayName } from './services/nicknameService';
import AppRouter from './components/AppRouter.jsx';
import Toast from './components/Toast.jsx';
import PhoneVerification from './components/PhoneVerification.jsx';
import MasterPasswordModal from './components/MasterPasswordModal.jsx';
import { hasMasterPassword, setEncryptionKey, isUnlocked } from './services/keyManagementService';
import { UserProvider } from './contexts/UserContext.jsx';
import { TrashProvider, useTrashContext } from './contexts/TrashContext';
import AppContent from './components/AppContent.jsx';
import { registerToast } from './utils/toast';
import { registerAlert } from './utils/alertModal';
import ConfirmAlertModal from './components/ConfirmAlertModal.jsx';
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
// ⚠️ 운세 기능 비활성화 (src/features/fortune으로 이동)
// import FortuneFlow from './features/fortune/components/FortuneFlow.jsx';
import ProfilePage from './components/ProfilePage.jsx';
// Timer 기능 제거 (백그라운드 제한으로 인해 비활성화)
import MacroModal from './components/MacroModal.jsx';
import TrashPage from './components/TrashPage.jsx';
import SecretPage from './components/secret/SecretPage.jsx';
import SplashScreen from './components/SplashScreen.jsx';
import TermsAgreementModal, { TERMS_VERSION, PRIVACY_VERSION } from './components/TermsAgreementModal.jsx';
const getWidgetComponent = (widgetName, props) => {
    switch (widgetName) {
        case 'StatsGrid':
            return <StatsGrid onSwitchTab={props.onSwitchTab} latestMessage={props.latestMessage} memos={props.memos} calendarSchedules={props.calendarSchedules} />;
        case 'QuickActions':
            return <QuickActions onSwitchTab={props.onSwitchTab} addActivity={props.addActivity} />;
        case 'RecentActivity':
            const activitiesToDisplay = props.recentActivities.slice(0, props.displayCount);
            return <RecentActivity recentActivities={activitiesToDisplay} deleteActivity={props.deleteActivity} />;
        default:
            return null;
    }
};

const DraggableWidget = ({ id, onSwitchTab, addActivity, recentActivities, displayCount, setDisplayCount, deleteActivity, latestMessage, memos, calendarSchedules }) => {
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
        deleteActivity,
        latestMessage,
        memos,
        calendarSchedules
    };

    return (
        <S.WidgetWrapper ref={setNodeRef} style={style} $isDragging={isDragging} {...attributes} {...listeners}>
            {getWidgetComponent(id, componentProps)}
        </S.WidgetWrapper>
    );
};

function App() {
    // 🎬 스플래시 스크린 상태
    const [showSplash, setShowSplash] = useState(true);

    // ✅ 기존 상태들은 그대로 유지
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [loginKey, setLoginKey] = useState(0); // LoginModal 강제 리마운트용

    // 🔥 Firebase Auth 상태
    const [firebaseUser, setFirebaseUser] = useState(null); // Firebase Auth User 객체
    const [wsCode, setWsCode] = useState(null); // 🆔 Workspace 고유 코드

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
    const [previousTab, setPreviousTab] = useState('home'); // 프로필 페이지 이전 탭 저장
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMacroModalOpen, setIsMacroModalOpen] = useState(false);
    // ⚠️ 운세 기능 비활성화
    // const [isFortuneFlowOpen, setIsFortuneFlowOpen] = useState(false);
    // Timer 기능 제거 (백그라운드 제한으로 인해 비활성화)
    // const [isTimerOpen, setIsTimerOpen] = useState(false);
    const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
    const [restoreType, setRestoreType] = useState('phone'); // 'phone' or 'google'
    const [pendingRestoreFile, setPendingRestoreFile] = useState(null);
    const [isUnshareConfirmOpen, setIsUnshareConfirmOpen] = useState(false);


    // ✅ 추가: 앱 활성 상태 (포커스 여부)
    const [isAppActive, setIsAppActive] = useState(true);

    // 🔒 로그아웃 진행 중 상태 (UI 차단용)
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // 💬 홈 화면 최신 메시지 상태
    const [latestMessage, setLatestMessage] = useState(null);

    const [isUserIdle, setIsUserIdle] = useState(false);
    const idleTimerRef = useRef(null);

    // 📜 약관 동의 관련 상태
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [isTermsReConsent, setIsTermsReConsent] = useState(false);
    const [changedTermsList, setChangedTermsList] = useState([]);
    const [pendingLoginAfterTerms, setPendingLoginAfterTerms] = useState(null);
    const IDLE_TIMEOUT = 5 * 60 * 1000; // 5분

    const contentRef = useRef(null);
    const messagingHubRef = useRef(null); // 채팅방 열기용 ref

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

    // 📱 앱 시작 시 알림 권한 요청 (네이티브 플랫폼에서만)
    useEffect(() => {
        const requestInitialPermissions = async () => {
            try {
                const { Capacitor } = await import('@capacitor/core');

                // 네이티브 플랫폼이 아니면 실행하지 않음
                if (!Capacitor.isNativePlatform()) {
                    return;
                }

                // 이미 권한 요청을 했는지 확인
                const hasRequestedPermissions = localStorage.getItem('has_requested_permissions');
                if (hasRequestedPermissions) {
                    console.log('✅ 이미 권한 요청을 완료했습니다');
                    return;
                }

                console.log('📱 앱 시작 - 알림 권한 요청 시작');

                // 1. LocalNotifications 권한 요청 (스케줄 알람용)
                const localPermission = await LocalNotifications.requestPermissions();
                console.log('📱 LocalNotifications 권한:', localPermission.display);

                // 2. PushNotifications 권한 요청 (FCM용)
                const { PushNotifications } = await import('@capacitor/push-notifications');
                const pushPermission = await PushNotifications.requestPermissions();
                console.log('📱 PushNotifications 권한:', pushPermission.receive);

                // 3. Android 12+ 정확한 알람 권한 안내
                if (Capacitor.getPlatform() === 'android') {
                    const permissions = await LocalNotifications.checkPermissions();

                    if (permissions.canScheduleExactAlarms === false) {
                        const confirmSettings = window.confirm(
                            '⏰ 정확한 알람 권한 필요\n\n' +
                            '캘린더 알람이 정확한 시간에 울리려면\n' +
                            '"정확한 알람" 권한이 필요합니다.\n\n' +
                            '설정으로 이동하시겠습니까?'
                        );

                        if (confirmSettings) {
                            const { registerPlugin } = await import('@capacitor/core');
                            const NotificationSettings = registerPlugin('NotificationSettings');
                            await NotificationSettings.openAlarmSettings();
                        }
                    }
                }

                // 권한 요청 완료 표시
                localStorage.setItem('has_requested_permissions', 'true');
                console.log('✅ 앱 시작 권한 요청 완료');

            } catch (error) {
                console.error('❌ 권한 요청 실패:', error);
            }
        };

        // 스플래시 화면이 끝난 후 권한 요청 (1.5초 후)
        const timer = setTimeout(() => {
            requestInitialPermissions();
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    // 🔔 백그라운드 알림 탭 → 채팅방 이동 이벤트 리스너
    useEffect(() => {
        const handleOpenChatRoom = (event) => {
            const { roomId } = event.detail;
            console.log('🔔 채팅방 열기 이벤트 수신:', roomId);

            // 채팅 탭으로 이동
            setActiveTab('chat');

            // MessagingHub의 openChatRoom 메서드 호출
            if (messagingHubRef.current?.openChatRoom) {
                messagingHubRef.current.openChatRoom(roomId);
            } else {
                console.warn('⚠️ messagingHubRef가 아직 준비되지 않았습니다');
            }
        };

        const handleNavigateToTab = (event) => {
            const { tab, scheduleDate } = event.detail;
            console.log('🔔 탭 이동 이벤트 수신:', tab, scheduleDate);
            setActiveTab(tab);

            // 스케줄 알람인 경우 해당 날짜로 이동
            if (tab === 'calendar' && scheduleDate) {
                // Calendar 컴포넌트에 날짜 정보 전달 (CustomEvent)
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('navigateToScheduleDate', {
                        detail: { date: scheduleDate }
                    }));
                }, 100);
            }
        };

        window.addEventListener('openChatRoom', handleOpenChatRoom);
        window.addEventListener('navigateToTab', handleNavigateToTab);

        return () => {
            window.removeEventListener('openChatRoom', handleOpenChatRoom);
            window.removeEventListener('navigateToTab', handleNavigateToTab);
        };
    }, []);

    // 🔥 Firebase Auth 상태 리스너
    useEffect(() => {
        console.log('🔥 Firebase Auth 리스너 등록');
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log('✅ Firebase Auth 사용자 감지:', user.uid);
                setFirebaseUser(user);

                // 📱 FCM 초기화
                initializeFCM(user.uid).catch(error => {
                    console.error('❌ FCM 초기화 실패:', error);
                });

                // 🔐 계정별 localStorage 관리
                const currentLocalUserId = getCurrentUserId();

                // 계정이 변경된 경우
                if (currentLocalUserId && currentLocalUserId !== user.uid) {
                    console.log('🔄 계정 전환 감지:', currentLocalUserId, '→', user.uid);
                }

                // 현재 사용자 설정
                setCurrentUserId(user.uid);

                // 기존 방식에서 새 방식으로 마이그레이션 (1회만)
                const migrated = localStorage.getItem(`migrated_${user.uid}`);
                if (!migrated) {
                    migrateUserData(user.uid);
                    localStorage.setItem(`migrated_${user.uid}`, 'true');
                }

                // localStorage에 저장 (기존 코드와의 호환성 - deprecated)
                localStorage.setItem('firebaseUserId', user.uid);

                // 🧹 base64 이미지 데이터 자동 정리 (1회만 실행)
                const cleanedKey = `base64_cleaned_${user.uid}`;
                if (!localStorage.getItem(cleanedKey)) {
                    try {
                        console.log('🧹 base64 이미지 데이터 정리 시작...');
                        const deletedCount = await deleteBase64ImagesFromCalendar(user.uid);
                        localStorage.setItem(cleanedKey, 'true');
                        if (deletedCount > 0) {
                            console.log(`✅ ${deletedCount}개 base64 이미지 데이터 삭제 완료`);
                        }
                    } catch (error) {
                        console.error('❌ base64 정리 실패:', error);
                    }
                }

                // 프로필 복원 시도
                const savedProfile = localStorage.getItem('userProfile');
                if (savedProfile && !profile) {
                    try {
                        setProfile(JSON.parse(savedProfile));
                    } catch (e) {
                        console.error('프로필 복원 실패:', e);
                    }
                }

                // 💬 기존 사용자 displayName 자동 보정 (채팅에서 이름 표시용)
                // mindflowUsers/.../settings에 displayName이 없으면 저장
                try {
                    const chatSettingsRef = doc(db, 'mindflowUsers', user.uid, 'userData', 'settings');
                    const chatSettingsSnap = await getDoc(chatSettingsRef);

                    if (!chatSettingsSnap.exists() || !chatSettingsSnap.data().displayName) {
                        const googleDisplayName = user.displayName || localStorage.getItem('userName');
                        if (googleDisplayName) {
                            await setDoc(chatSettingsRef, {
                                displayName: googleDisplayName,
                                updatedAt: serverTimestamp()
                            }, { merge: true });
                            console.log('✅ 채팅용 displayName 자동 보정 완료:', googleDisplayName);
                        }
                    }
                } catch (displayNameError) {
                    console.error('⚠️ displayName 자동 보정 실패:', displayNameError);
                }

                // Firebase Auth와 localStorage 동기화 확인
                checkSync(user.uid);

                // 📜 기존 로그인 사용자의 약관 변경 체크 (앱 시작 시)
                // 약관이 변경되었으면 재동의 모달 표시
                try {
                    const termsRef = doc(db, 'users', user.uid, 'agreements', 'terms');
                    const termsSnap = await getDoc(termsRef);

                    if (termsSnap.exists()) {
                        const data = termsSnap.data();
                        const agreedTermsVersion = data.termsVersion || '0.0.0';
                        const agreedPrivacyVersion = data.privacyVersion || '0.0.0';

                        const changedTerms = [];
                        if (TERMS_VERSION !== agreedTermsVersion) {
                            changedTerms.push('terms');
                        }
                        if (PRIVACY_VERSION !== agreedPrivacyVersion) {
                            changedTerms.push('privacy');
                        }

                        if (changedTerms.length > 0) {
                            console.log('📜 약관 변경 감지 - 재동의 필요:', changedTerms);
                            // 재동의 필요 - 로그인 데이터 저장 후 모달 표시
                            const savedProfile = localStorage.getItem('userProfile');
                            const accessToken = localStorage.getItem('accessToken');

                            if (savedProfile && accessToken) {
                                const profileData = JSON.parse(savedProfile);
                                setPendingLoginAfterTerms({
                                    firebaseUserId: user.uid,
                                    loginType: 'reconsent', // 재동의 타입 추가
                                    loginData: null // 이미 로그인된 상태이므로 불필요
                                });
                                setIsTermsReConsent(true);
                                setChangedTermsList(changedTerms);
                                setIsTermsModalOpen(true);
                            }
                        }
                    }
                } catch (termsCheckError) {
                    // 권한 오류 등은 조용히 무시 (기존 사용자가 아직 동의하지 않은 경우)
                    console.log('📜 약관 체크 스킵 (권한 없음 또는 기록 없음)');
                }
            } else {
                console.log('❌ Firebase Auth 로그아웃 상태');
                setFirebaseUser(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // 💬 홈 화면용 최신 메시지 구독
    useEffect(() => {
        if (!firebaseUser) {
            setLatestMessage(null);
            return;
        }

        let unsubscribeDM = () => {};
        let unsubscribeGroup = () => {};
        let allRooms = { dm: [], group: [] };

        const updateLatestMessage = async () => {
            const allChats = [...allRooms.dm, ...allRooms.group];
            if (allChats.length === 0) {
                setLatestMessage(null);
                return;
            }

            // 가장 최신 메시지가 있는 채팅방 찾기
            const sortedChats = allChats.sort((a, b) => {
                const aTime = a.lastMessageTime?.toMillis?.() || a.lastMessageTime || 0;
                const bTime = b.lastMessageTime?.toMillis?.() || b.lastMessageTime || 0;
                return bTime - aTime;
            });

            const latestChat = sortedChats[0];
            if (!latestChat || !latestChat.lastMessage) {
                setLatestMessage(null);
                return;
            }

            // lastMessage가 객체인 경우 텍스트 추출
            const messageContent = latestChat.lastMessage;
            let messageText = '';
            let messageSenderId = latestChat.lastMessageSenderId;

            if (typeof messageContent === 'string') {
                messageText = messageContent;
            } else if (typeof messageContent === 'object' && messageContent !== null) {
                messageText = messageContent.text || messageContent.content || messageContent.message || '';
                if (messageContent.senderId) {
                    messageSenderId = messageContent.senderId;
                }
            }

            // 보낸 사람 이름 찾기 (닉네임 우선, 없으면 구글 이름)
            let senderName = '알 수 없음';
            if (messageSenderId) {
                // participantsInfo에서 fallback용 구글 이름 가져오기
                const fallbackName = latestChat.participantsInfo?.[messageSenderId]?.displayName || '알 수 없음';
                // 닉네임 서비스에서 변경된 닉네임 우선 조회
                senderName = await getUserDisplayName(messageSenderId, fallbackName);
            } else if (latestChat.lastMessageSenderName) {
                senderName = latestChat.lastMessageSenderName;
            }

            // 읽지 않은 메시지 여부 확인
            const unreadCount = latestChat.unreadCount?.[firebaseUser.uid] || 0;

            setLatestMessage({
                text: messageText,
                time: latestChat.lastMessageTime,
                senderName: senderName,
                roomId: latestChat.id,
                hasUnread: unreadCount > 0
            });
        };

        // DM 구독
        unsubscribeDM = subscribeToMyDMRooms((rooms) => {
            allRooms.dm = rooms;
            updateLatestMessage();
        });

        // 그룹 채팅 구독
        unsubscribeGroup = subscribeToMyGroupChats((rooms) => {
            allRooms.group = rooms;
            updateLatestMessage();
        });

        return () => {
            unsubscribeDM();
            unsubscribeGroup();
        };
    }, [firebaseUser]);

    // Timer 기능 제거 (백그라운드 제한으로 인해 비활성화)
    // 로컬 알림 탭 리스너도 제거됨

    // userId와 isAuthenticated 계산
    const phoneId = localStorage.getItem('mindflowUserId'); // 휴대폰 번호 (캐시)
    const userId = phoneId || (firebaseUser?.uid); // ✅ Firebase Auth를 Source of Truth로 사용
    const isAuthenticated = !!(firebaseUser || profile);

    // 🆔 WS 코드 로드 (헤더처럼 App에서 관리)
    useEffect(() => {
        const loadWsCode = async () => {
            if (!userId || !profile) {
                setWsCode(null);
                return;
            }

            // localStorage에서 먼저 확인
            const cachedWsCode = localStorage.getItem(`wsCode_${userId}`);
            if (cachedWsCode) {
                setWsCode(cachedWsCode);
                return;
            }

            // Firebase에서 가져오기
            try {
                const workspaceId = `workspace_${userId}`;
                const workspaceRef = doc(db, 'workspaces', workspaceId);
                const workspaceDoc = await getDoc(workspaceRef);

                if (workspaceDoc.exists()) {
                    const code = workspaceDoc.data().workspaceCode;
                    setWsCode(code);
                    if (code) {
                        localStorage.setItem(`wsCode_${userId}`, code);
                    }
                } else {
                    console.log('⚠️ Firestore에 workspace 문서 없음:', workspaceId);
                }
            } catch (error) {
                console.error('❌ WS 코드 로드 오류:', error);
            }
        };

        loadWsCode();
    }, [userId, profile]);

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
        syncStatus,
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
        flushPendingSaves,
        manualSync,
        // 개별 항목 동기화 함수
        syncMemo,
        deleteMemo,
        syncFolder,
        deleteFolder,
        syncTrashItem,
        deleteTrashItem,
        // ⭐ 운세 프로필 Firestore 함수
        saveFortuneProfileToFirestore,
        fetchFortuneProfileFromFirestore
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
        setPreviousTab(activeTab); // 현재 탭을 이전 탭으로 저장
        setActiveTab('profile');
    };   

    const logOut = () => {
        setProfile(null);
        setUser(null);
    };

    // ⚠️ 운세 기능 비활성화
    // const handleOpenFortune = () => {
    //     setIsFortuneFlowOpen(true);
    //     // 사이드 메뉴는 이미 SideMenu.jsx 내부에서 닫혔다고 가정
    // };

    const addActivity = (type, description, memoId = null) => {
        const allowedTypes = ['메모 작성', '메모 수정', '메모 삭제', '백업', '복원', '스케줄 등록', '스케줄 수정', '스케줄 삭제', '알람 등록', '알람 수정', '알람 삭제', '리뷰 작성', '동기화'];
        if (!allowedTypes.includes(type)) {
            return;
        }

        // 스케줄/알람 관련은 23글자, 나머지는 20글자
        const maxLength = (type.includes('스케줄') || type.includes('알람')) ? 23 : 20;

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

    
    const [isNewMemoModalOpen, setIsNewMemoModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedMemo, setSelectedMemo] = useState(null);
    const [memoContext, setMemoContext] = useState(null); // { activeFolder, sortOrder, sortDirection, sharedMemoInfo }
    const [toastMessage, setToastMessage] = useState(null);
    const [alertModal, setAlertModal] = useState(null); // { message, title, onConfirm }
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

        console.log('🔍 [handleSaveAlarm] 시작:', { key, alarmSettings, actionType });

        // ⚠️ CRITICAL FIX: delete/edit 액션에서는 localStorage에서 최신 데이터 읽기
        // AlarmModal에서 이미 localStorage를 직접 업데이트했으므로,
        // React state(calendarSchedules)가 아닌 localStorage의 최신 데이터를 사용해야 함
        let updatedSchedules;

        if (actionType === 'delete' || actionType === 'edit') {
            // ✅ FIX: userId 사용 (currentUser 대신)
            // AlarmModal의 getCalendarStorageKey()와 동일한 키 사용
            const calendarKey = userId ? `user_${userId}_calendar` : 'calendarSchedules_shared';
            const storedData = localStorage.getItem(calendarKey);
            updatedSchedules = storedData ? JSON.parse(storedData) : { ...calendarSchedules };
            console.log('🔍 [handleSaveAlarm] localStorage에서 최신 데이터 로드 (delete/edit)', { userId, calendarKey });
        } else {
            // 그 외 액션은 기존 방식대로 React state 사용
            updatedSchedules = { ...calendarSchedules };
        }

        // ✅ FIX: 모든 액션에서 alarm 데이터를 스케줄에 설정
        // delete/edit 액션에서도 alarm을 설정해야 undefined가 되지 않음
        const targetSchedule = updatedSchedules[key];
        if (targetSchedule) {
            updatedSchedules[key] = {
                ...targetSchedule,
                alarm: alarmSettings
            };
        } else {
            updatedSchedules[key] = {
                text: '',
                alarm: alarmSettings
            };
        }

        console.log('🔍 [handleSaveAlarm] 현재 스케줄:', updatedSchedules[key]);
        console.log('🔍 [handleSaveAlarm] 전체 알람 수:', alarmSettings.registeredAlarms?.length);

        // 🔍 진단: 알람 저장 전 상태
        diagnosticLog('info', `알람 ${actionType} 시작`, {
            date: key,
            alarmsCount: alarmSettings.registeredAlarms?.length || 0,
            userId: userId ? userId.substring(0, 8) + '...' : 'N/A'
        });

        syncCalendar(updatedSchedules);

        // ⚡ 알람 등록 시 즉시 Firestore 저장 (디바운스 없이)
        if (actionType === 'register') {
            console.log('⚡ [handleSaveAlarm] 알람 등록 - 즉시 저장 실행');
            diagnosticLog('warning', '즉시 저장 실행 중...', { action: actionType });
            flushPendingSaves();
            diagnosticLog('success', '즉시 저장 완료', { action: actionType });
        }

        // 4. 사용자에게 피드백을 줍니다 (모달은 닫지 않음)
        const hasAlarms = alarmSettings.registeredAlarms && alarmSettings.registeredAlarms.length > 0;

        // 동작 타입에 따라 다른 메시지 표시
        let message = '이벤트 시간이 저장되었습니다.';

        if (hasAlarms) {
            const alarmType = alarmSettings.alarmType; // 'anniversary' or 'normal'
            const alarmTitle = alarmSettings.registeredAlarms?.[0]?.title || scheduleForAlarm?.text || '알람';

            switch (actionType) {
                case 'register':
                    message = alarmType === 'anniversary' ? '기념일을 등록하였습니다. 🔔' : '알람을 등록하였습니다. 🔔';
                    addActivity('알람 등록', `${key} - ${alarmTitle}`);
                    break;
                case 'update':
                case 'edit':
                    message = alarmType === 'anniversary' ? '기념일을 수정하였습니다.' : '알람을 수정하였습니다.';
                    addActivity('알람 수정', `${key} - ${alarmTitle}`);
                    break;
                case 'delete':
                    message = alarmType === 'anniversary' ? '기념일을 삭제하였습니다.' : '알람을 삭제하였습니다.';
                    addActivity('알람 삭제', `${key} - ${alarmTitle}`);
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

    const showToast = (message) => {
        console.log('🔔 showToast 호출됨:', message);
        setToastMessage(message);
    };

    const showAlertModal = (message, title = '알림', onConfirm = null) => {
        console.log('🔔 showAlert 호출됨:', message);
        setAlertModal({ message, title, onConfirm });
    };

    // 전역 toast 및 alert 등록
    useEffect(() => {
        registerToast(showToast);
        registerAlert(showAlertModal);
    }, []);
    
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
                trashedItems: trash || [],
                macroTexts: macros || [],
                memoFolders: folders || []
            }
        };

        // 1. 휴대폰에 파일 다운로드 (모든 사용자)
        exportData('sharenote_backup', dataToExport);

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
                        syncTrash(data.trashedItems);
                    }
                    if (data.macroTexts) {
                        syncMacros(data.macroTexts);
                    }
                    if (data.memoFolders) {
                        syncFolders(data.memoFolders);
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

    const handleEditMemo = async (id, newContent, isImportant, folderId, previousFolderId) => {
            const now = Date.now();
            const targetMemo = memos.find(memo => memo.id === id);
            if (!targetMemo) return;

            // 내용이 변경되었는지 확인 (공백 포함)
            const contentChanged = targetMemo.content !== newContent;

            // ⭐ 대화방에서 불러온 문서를 수정하면, 해당 대화방의 currentDoc 비우기
            if (contentChanged && targetMemo.currentWorkingRoomId) {
                try {
                    const { doc, deleteDoc } = await import('firebase/firestore');
                    const { db } = await import('./firebase/config');

                    const currentDocRef = doc(db, 'chatRooms', targetMemo.currentWorkingRoomId, 'sharedDocument', 'currentDoc');
                    await deleteDoc(currentDocRef);
                    console.log('✅ 메모 수정: 대화방 currentDoc 자동 비우기 완료:', targetMemo.currentWorkingRoomId);
                } catch (error) {
                    console.error('❌ 메모 수정: 대화방 currentDoc 비우기 실패:', error);
                }
            }

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

    const handleDeleteMemo = async (id) => {
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

                // ⭐ 대화방에서 불러온 문서라면, 해당 대화방의 currentDoc 비우기
                if (deletedMemo.currentWorkingRoomId) {
                    try {
                        const { doc, deleteDoc } = await import('firebase/firestore');
                        const { db } = await import('./firebase/config');

                        const currentDocRef = doc(db, 'chatRooms', deletedMemo.currentWorkingRoomId, 'sharedDocument', 'currentDoc');
                        await deleteDoc(currentDocRef);
                        console.log('✅ 대화방 currentDoc 자동 비우기 완료:', deletedMemo.currentWorkingRoomId);
                    } catch (error) {
                        console.error('❌ 대화방 currentDoc 비우기 실패:', error);
                    }
                }

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
    const handleUpdateMemoFolder = async (memoId, folderId, savePrevious = false) => {
        const targetMemo = memos.find(memo => memo.id === memoId);

        // ⭐ 대화방에서 불러온 문서를 이동하면, 해당 대화방의 currentDoc 비우기
        if (targetMemo?.currentWorkingRoomId) {
            try {
                const { doc, deleteDoc } = await import('firebase/firestore');
                const { db } = await import('./firebase/config');

                const currentDocRef = doc(db, 'chatRooms', targetMemo.currentWorkingRoomId, 'sharedDocument', 'currentDoc');
                await deleteDoc(currentDocRef);
                console.log('✅ 폴더 이동: 대화방 currentDoc 자동 비우기 완료:', targetMemo.currentWorkingRoomId);
            } catch (error) {
                console.error('❌ 폴더 이동: 대화방 currentDoc 비우기 실패:', error);
            }
        }

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
    const handleUpdateMemoFolderBatch = async (memoIds, folderId, savePrevious = false) => {
        const memoIdSet = new Set(memoIds);

        // ⭐ 대화방에서 불러온 문서들을 이동하면, 해당 대화방들의 currentDoc 비우기
        const targetMemos = memos.filter(memo => memoIdSet.has(memo.id) && memo.currentWorkingRoomId);
        if (targetMemos.length > 0) {
            try {
                const { doc, deleteDoc } = await import('firebase/firestore');
                const { db } = await import('./firebase/config');

                const deletePromises = targetMemos.map(memo => {
                    const currentDocRef = doc(db, 'chatRooms', memo.currentWorkingRoomId, 'sharedDocument', 'currentDoc');
                    return deleteDoc(currentDocRef);
                });

                await Promise.all(deletePromises);
                console.log(`✅ 배치 이동: ${targetMemos.length}개 대화방 currentDoc 자동 비우기 완료`);
            } catch (error) {
                console.error('❌ 배치 이동: 대화방 currentDoc 비우기 실패:', error);
            }
        }

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

    // 메모의 hasPendingEdits 플래그 업데이트 (채팅방에서 호출)
    const handleUpdateMemoPendingFlag = (memoId, hasPending) => {
        syncMemos(
            memos.map(memo => {
                if (memo.id === memoId) {
                    return { ...memo, hasPendingEdits: hasPending };
                }
                return memo;
            })
        );
        // Firestore 동기화는 자동으로 됨 (useFirestoreSync의 디바운싱)
    };

    // 숨겨진 메모 정리 (존재하지 않는 폴더에 속한 메모들을 미분류로 이동)
    // 'shared'는 가상 폴더이므로 제외
    const handleCleanupOrphanedMemos = () => {
        const folderIds = new Set(folders.map(f => f.id));
        folderIds.add('shared');
        const orphanedMemos = memos.filter(memo => memo.folderId && !folderIds.has(memo.folderId));

        if (orphanedMemos.length === 0) {
            showToast('숨겨진 메모가 없습니다');
            return;
        }

        const cleanedMemos = memos.map(memo => {
            // 'shared'는 제외하고, 존재하지 않는 폴더에 속한 메모만 미분류로 이동
            if (memo.folderId && memo.folderId !== 'shared' && !folderIds.has(memo.folderId)) {
                return { ...memo, folderId: null };
            }
            return memo;
        });

        syncMemos(cleanedMemos);
        showToast(`${orphanedMemos.length}개의 숨겨진 메모를 미분류로 이동했습니다`);
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

    const handleSwitchTab = (tab, options = {}) => {
        setActiveTab(tab);
        // 탭 전환 시 다중선택 모드 해제
        if (isSelectionMode) {
            setIsSelectionMode(false);
            setSelectedMemoIds(new Set());
        }

        // 추가 옵션 처리
        if (options.roomId && tab === 'chat') {
            // 채팅방으로 바로 이동
            setTimeout(() => {
                if (messagingHubRef.current?.openChatRoom) {
                    messagingHubRef.current.openChatRoom(options.roomId);
                }
            }, 100);
        }

        if (options.folderId && tab === 'memo') {
            // 특정 폴더로 이동
            setCurrentActiveFolder(options.folderId);
        }

        if (tab === 'calendar') {
            if (options.date) {
                // 특정 날짜로 이동
                setSelectedDate(new Date(options.date));
            } else {
                // 옵션 없이 이동하면 오늘로 리셋
                setSelectedDate(new Date());
            }
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
            const savedCustomPicture = getProfileSetting('customProfilePicture');
            const userId = localStorage.getItem('firebaseUserId');

            if (savedProfile) {
                // 프로필은 항상 복원 (로그인 상태 유지)
                const profileData = JSON.parse(savedProfile);

                // Firestore에서 최신 닉네임 및 프로필 이미지 설정 가져오기
                if (userId) {
                    try {
                        const { getUserNickname } = await import('./services/nicknameService');
                        const { fetchSettingsFromFirestore } = await import('./services/userDataService');

                        // 닉네임 로드
                        const firestoreNickname = await getUserNickname(userId);
                        if (firestoreNickname) {
                            profileData.nickname = firestoreNickname;
                            setProfileSetting('userNickname', firestoreNickname); // localStorage 동기화
                            // ✅ userProfile localStorage도 업데이트
                            try {
                                const savedProfile = localStorage.getItem('userProfile');
                                if (savedProfile) {
                                    const profileObj = JSON.parse(savedProfile);
                                    profileObj.nickname = firestoreNickname;
                                    localStorage.setItem('userProfile', JSON.stringify(profileObj));
                                }
                            } catch (e) {
                                console.error('userProfile 닉네임 동기화 실패:', e);
                            }
                            // ✅ Header와 SideMenu에 알림
                            window.dispatchEvent(new CustomEvent('nicknameChanged', { detail: firestoreNickname }));
                        } else {
                            // Firestore에 없으면 localStorage 사용
                            const savedNickname = getProfileSetting('userNickname');
                            if (savedNickname) {
                                profileData.nickname = savedNickname;
                            }
                        }

                        // 🔥 프로필 이미지 설정 로드
                        try {
                            const settings = await fetchSettingsFromFirestore(userId);
                            if (settings) {
                                // profileImageType 복원
                                if (settings.profileImageType) {
                                    setProfileSetting('profileImageType', settings.profileImageType);
                                    // Header와 SideMenu에 알림
                                    window.dispatchEvent(new CustomEvent('profileImageTypeChanged', { detail: settings.profileImageType }));
                                }
                                // 아바타 설정 복원
                                if (settings.selectedAvatarId) {
                                    setProfileSetting('selectedAvatarId', settings.selectedAvatarId);
                                    window.dispatchEvent(new CustomEvent('avatarChanged', {
                                        detail: { avatarId: settings.selectedAvatarId, bgColor: settings.avatarBgColor || 'none' }
                                    }));
                                }
                                if (settings.avatarBgColor) {
                                    setProfileSetting('avatarBgColor', settings.avatarBgColor);
                                    window.dispatchEvent(new CustomEvent('avatarBgColorChanged', { detail: settings.avatarBgColor }));
                                }
                                // 커스텀 프로필 사진 복원
                                if (settings.customProfilePicture) {
                                    setProfileSetting('customProfilePicture', settings.customProfilePicture);
                                    // ✅ Header와 SideMenu에 알림 (다른 기기에서 변경된 프사 반영)
                                    window.dispatchEvent(new CustomEvent('profilePictureChanged', {
                                        detail: { picture: settings.customProfilePicture, hash: settings.customProfilePictureHash }
                                    }));
                                }
                                if (settings.customProfilePictureHash) {
                                    setProfileSetting('customProfilePictureHash', settings.customProfilePictureHash);
                                }
                            }
                        } catch (settingsError) {
                            console.error('프로필 이미지 설정 로드 실패:', settingsError);
                        }
                    } catch (error) {
                        console.error('닉네임 로드 실패:', error);
                        // 에러 시 localStorage 폴백
                        const savedNickname = getProfileSetting('userNickname');
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

    // 📜 약관 동의 여부 확인 함수
    const checkTermsAgreement = async (firebaseUserId) => {
        try {
            const termsRef = doc(db, 'users', firebaseUserId, 'agreements', 'terms');
            const termsSnap = await getDoc(termsRef);

            if (!termsSnap.exists()) {
                // 약관 동의 기록이 없음 - 첫 로그인
                return { needsAgreement: true, isReConsent: false, changedTerms: [] };
            }

            const data = termsSnap.data();
            const agreedTermsVersion = data.termsVersion || '0.0.0';
            const agreedPrivacyVersion = data.privacyVersion || '0.0.0';

            // 버전 비교 (현재 버전이 더 높으면 재동의 필요)
            const changedTerms = [];
            if (TERMS_VERSION !== agreedTermsVersion) {
                changedTerms.push('terms');
            }
            if (PRIVACY_VERSION !== agreedPrivacyVersion) {
                changedTerms.push('privacy');
            }

            if (changedTerms.length > 0) {
                // 약관이 변경됨 - 재동의 필요
                return { needsAgreement: true, isReConsent: true, changedTerms };
            }

            // 모든 약관에 동의 완료
            return { needsAgreement: false, isReConsent: false, changedTerms: [] };
        } catch (error) {
            console.error('약관 동의 확인 오류:', error);
            // 오류 시 안전하게 동의 필요 상태로 처리
            return { needsAgreement: true, isReConsent: false, changedTerms: [] };
        }
    };

    // 📜 약관 동의 저장 함수
    const saveTermsAgreement = async (firebaseUserId, agreementData) => {
        try {
            const termsRef = doc(db, 'users', firebaseUserId, 'agreements', 'terms');
            await setDoc(termsRef, {
                termsVersion: agreementData.termsVersion,
                privacyVersion: agreementData.privacyVersion,
                termsAgreedAt: agreementData.agreedAt,
                privacyAgreedAt: agreementData.agreedAt,
                lastUpdated: serverTimestamp(),
                userAgent: navigator.userAgent,
                platform: navigator.platform
            }, { merge: true });
            console.log('✅ 약관 동의 저장 완료');
            return true;
        } catch (error) {
            console.error('❌ 약관 동의 저장 오류:', error);
            return false;
        }
    };

    // 📜 약관 동의 완료 핸들러
    const handleTermsAgree = async (agreementData) => {
        if (!pendingLoginAfterTerms) {
            console.error('❌ 대기 중인 로그인 데이터 없음');
            return;
        }

        const { firebaseUserId, loginType, loginData } = pendingLoginAfterTerms;

        // 약관 동의 저장
        const saved = await saveTermsAgreement(firebaseUserId, agreementData);
        if (!saved) {
            showToast('⚠ 약관 동의 저장에 실패했습니다. 다시 시도해주세요.');
            return;
        }

        // 모달 닫기
        setIsTermsModalOpen(false);
        setPendingLoginAfterTerms(null);

        // 로그인 진행
        if (loginType === 'simple') {
            await handleSimpleLogin(
                loginData.firebaseUserId,
                loginData.accessToken,
                loginData.userInfo,
                loginData.pictureUrl,
                loginData.expiresAt
            );
        } else if (loginType === 'mindflow') {
            await completeMindFlowLogin(
                loginData.phoneNumber,
                loginData.firebaseUserId,
                loginData.accessToken,
                loginData.userInfo,
                loginData.pictureUrl,
                loginData.expiresAt
            );
        } else if (loginType === 'reconsent') {
            // 기존 로그인 사용자 재동의 - 추가 로그인 처리 불필요
            showToast('약관 동의가 완료되었습니다.');
            console.log('✅ 기존 사용자 약관 재동의 완료');
        }
    };

    // 📜 약관 동의 취소 핸들러
    const handleTermsCancel = () => {
        setIsTermsModalOpen(false);
        setPendingLoginAfterTerms(null);
        showToast('약관에 동의하지 않으면 로그인할 수 없습니다.');

        // Firebase 로그아웃 처리
        signOut(auth).catch(err => console.error('로그아웃 오류:', err));
    };

    // ✅ 로그인 성공 시 처리 - 휴대폰 인증 통합
    const handleLoginSuccess = async (response) => {
        try {
            // ✅ 로그인 처리 중 토스트 표시
            showToast('🔄 로그인 처리 중...');

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

            // 📜 약관 동의 확인
            console.log('📜 약관 동의 여부 확인 중...');
            const { needsAgreement, isReConsent, changedTerms } = await checkTermsAgreement(firebaseUserId);

            // 🔐 휴대폰 인증 플로우 시작
            console.log('🔐 휴대폰 번호 확인 중...');

            // 1. Firebase UID로 연결된 휴대폰 번호 조회
            const existingPhone = await findPhoneByFirebaseUID(firebaseUserId);

            if (needsAgreement) {
                // 약관 동의 필요 - 로그인 보류 및 모달 표시
                console.log('📜 약관 동의 필요:', isReConsent ? '재동의' : '첫 동의', changedTerms);

                // 로그인 데이터 저장
                if (existingPhone) {
                    setPendingLoginAfterTerms({
                        firebaseUserId,
                        loginType: 'mindflow',
                        loginData: {
                            phoneNumber: existingPhone,
                            firebaseUserId,
                            accessToken,
                            userInfo,
                            pictureUrl,
                            expiresAt
                        }
                    });
                } else {
                    setPendingLoginAfterTerms({
                        firebaseUserId,
                        loginType: 'simple',
                        loginData: {
                            firebaseUserId,
                            accessToken,
                            userInfo,
                            pictureUrl,
                            expiresAt
                        }
                    });

                    // 휴대폰 인증 데이터도 저장 (나중에 필요할 때 사용)
                    setPendingAuthData({
                        firebaseUserId,
                        accessToken,
                        userInfo,
                        pictureUrl,
                        expiresAt
                    });
                }

                // 약관 모달 표시
                setIsTermsReConsent(isReConsent);
                setChangedTermsList(changedTerms);
                setIsTermsModalOpen(true);
                return; // 로그인 처리 중단 - 약관 동의 후 진행
            }

            // 약관 동의 완료 - 기존 로그인 플로우 진행
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
                const existingPhoneCheck = await findPhoneByFirebaseUID(firebaseUserId);

                if (existingPhoneCheck) {
                    // 이미 휴대폰 인증을 완료한 사용자
                    console.log('✅ 기존 휴대폰 인증 사용자:', existingPhoneCheck);
                    localStorage.setItem('mindflowUserId', existingPhoneCheck);
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

            // 🧹 공유 키 정리 (보안: 이전 사용자 데이터 노출 방지)
            cleanupSharedKeys();

            // 🔄 inRoom 상태 초기화 (새로고침 시 잘못된 상태 정리)
            const { initializeInRoomStatus } = await import('./services/messageService');
            initializeInRoomStatus(firebaseUserId);

            // 사용자 프로필 설정
            const profileData = {
                email: userInfo.email,
                name: userInfo.name,
                picture: pictureUrl
            };

            // ✅ Firestore nicknames 컬렉션에서 닉네임 가져오기 (새 기기 로그인 시에도 동작)
            try {
                const { getUserNickname } = await import('./services/nicknameService');
                const firestoreNickname = await getUserNickname(firebaseUserId);
                if (firestoreNickname) {
                    profileData.nickname = firestoreNickname;
                    setProfileSetting('userNickname', firestoreNickname); // localStorage 동기화
                    console.log('✅ Firestore에서 닉네임 로드:', firestoreNickname);
                }
            } catch (nicknameError) {
                console.warn('닉네임 로드 실패, localStorage 폴백:', nicknameError);
                const savedNickname = getProfileSetting('userNickname');
                if (savedNickname) {
                    profileData.nickname = savedNickname;
                }
            }

            const savedCustomPicture = getProfileSetting('customProfilePicture');
            if (savedCustomPicture) {
                profileData.customPicture = savedCustomPicture;
            }

            setProfile(profileData);
            setAccessTokenState(accessToken);

            // 🔐 계정별 localStorage에 사용자 정보 저장 (새 방식)
            setCurrentUserData('displayName', userInfo.name);
            setCurrentUserData('email', userInfo.email);
            setCurrentUserData('picture', pictureUrl);

            // localStorage에 로그인 정보 저장 (기존 방식 - 호환성)
            localStorage.setItem('userProfile', JSON.stringify(profileData)); // ✅ 추가: 프로필 저장
            localStorage.setItem('firebaseUserId', firebaseUserId);
            localStorage.setItem('userDisplayName', userInfo.name); // 추가: displayName 명시적 저장
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

            // 💬 채팅용 displayName 저장 (mindflowUsers/.../userData/settings)
            // ⚠️ 중요: 채팅에서 상대방 이름을 이 경로에서 조회하므로 반드시 저장 필요
            try {
                const chatSettingsRef = doc(db, 'mindflowUsers', firebaseUserId, 'userData', 'settings');
                await setDoc(chatSettingsRef, {
                    displayName: userInfo.name,
                    updatedAt: serverTimestamp()
                }, { merge: true });
                console.log('✅ 채팅용 displayName 저장 완료 (mindflowUsers)');
            } catch (chatSettingsError) {
                console.error('⚠️ 채팅용 displayName 저장 오류:', chatSettingsError);
            }

            // 🆔 Workspace 문서 생성/확인 (친구 추가용 WS 코드)
            try {
                const workspaceRef = doc(db, 'workspaces', `workspace_${firebaseUserId}`);
                const workspaceDoc = await getDoc(workspaceRef);

                if (!workspaceDoc.exists()) {
                    // WS 코드 생성 (6자리 알파벳+숫자 조합)
                    const generateWsCode = () => {
                        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                        let code = 'WS-';
                        for (let i = 0; i < 6; i++) {
                            code += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                        return code;
                    };

                    const wsCode = generateWsCode();

                    await setDoc(workspaceRef, {
                        userId: firebaseUserId,
                        workspaceCode: wsCode,
                        createdAt: Date.now()
                    });

                    // localStorage에 캐시
                    localStorage.setItem(`wsCode_${firebaseUserId}`, wsCode);
                } else {
                    // 기존 WS 코드 캐시
                    const existingWsCode = workspaceDoc.data().workspaceCode;
                    if (existingWsCode) {
                        localStorage.setItem(`wsCode_${firebaseUserId}`, existingWsCode);
                    }
                }
            } catch (workspaceError) {
                console.error('⚠️ Workspace 문서 생성/확인 오류:', workspaceError);
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

            // showToast('✓ 로그인되었습니다'); // 토스트 메시지 제거
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

            // ✅ Firestore nicknames 컬렉션에서 닉네임 가져오기 (새 기기 로그인 시에도 동작)
            try {
                const { getUserNickname } = await import('./services/nicknameService');
                const firestoreNickname = await getUserNickname(firebaseUserId);
                if (firestoreNickname) {
                    profileData.nickname = firestoreNickname;
                    setProfileSetting('userNickname', firestoreNickname); // localStorage 동기화
                    console.log('✅ Firestore에서 닉네임 로드:', firestoreNickname);
                }
            } catch (nicknameError) {
                console.warn('닉네임 로드 실패, localStorage 폴백:', nicknameError);
                const savedNickname = getProfileSetting('userNickname');
                if (savedNickname) {
                    profileData.nickname = savedNickname;
                }
            }

            const savedCustomPicture = getProfileSetting('customProfilePicture');
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

            // 💬 채팅용 displayName 저장 (mindflowUsers/.../userData/settings)
            // ⚠️ 중요: 채팅에서 상대방 이름을 이 경로에서 조회하므로 반드시 저장 필요
            try {
                const chatSettingsRef = doc(db, 'mindflowUsers', firebaseUserId, 'userData', 'settings');
                await setDoc(chatSettingsRef, {
                    displayName: userInfo.name,
                    updatedAt: serverTimestamp()
                }, { merge: true });
                console.log('✅ 채팅용 displayName 저장 완료 (mindflowUsers)');
            } catch (chatSettingsError) {
                console.error('⚠️ 채팅용 displayName 저장 오류:', chatSettingsError);
            }

            // 🆔 Workspace 문서 생성/확인 (친구 추가용 WS 코드)
            try {
                const workspaceRef = doc(db, 'workspaces', `workspace_${firebaseUserId}`);
                const workspaceDoc = await getDoc(workspaceRef);

                if (!workspaceDoc.exists()) {
                    // WS 코드 생성 (6자리 알파벳+숫자 조합)
                    const generateWsCode = () => {
                        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                        let code = 'WS-';
                        for (let i = 0; i < 6; i++) {
                            code += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                        return code;
                    };

                    const wsCode = generateWsCode();

                    await setDoc(workspaceRef, {
                        userId: firebaseUserId,
                        workspaceCode: wsCode,
                        createdAt: Date.now()
                    });

                    // localStorage에 캐시
                    localStorage.setItem(`wsCode_${firebaseUserId}`, wsCode);
                } else {
                    // 기존 WS 코드 캐시
                    const existingWsCode = workspaceDoc.data().workspaceCode;
                    if (existingWsCode) {
                        localStorage.setItem(`wsCode_${firebaseUserId}`, existingWsCode);
                    }
                }
            } catch (workspaceError) {
                console.error('⚠️ Workspace 문서 생성/확인 오류:', workspaceError);
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

            // showToast('✓ 로그인되었습니다'); // 토스트 메시지 제거
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

            // ✅ 휴대폰 인증 완료 플래그 설정
            localStorage.setItem('isPhoneVerified', 'true');

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

    // 🚪 기능별 권한 체크 (Progressive Onboarding)
    const requirePhoneAuth = (featureName, callback) => {
        const isVerified = checkPhoneVerification();

        // 🔐 인증 필수 기능 (문서 편집/삭제 + 방장 권한만)
        const verifiedOnlyActions = [
            '문서 편집',      // 공유 문서 수정
            '문서 삭제',      // 공유 문서 삭제
            '문서 권한 변경', // 공유 문서 권한 관리
            '방장 권한 위임'  // 방장 권한 다른 사람에게 주기
        ];

        // ❌ 문서 편집/삭제, 방장 권한은 반드시 인증 필요
        if (verifiedOnlyActions.includes(featureName)) {
            if (isVerified) {
                console.log('✅ 인증 완료 - 기능 실행:', featureName);
                callback();
            } else {
                console.log('⚠️ 이 기능은 본인인증 필요:', featureName);
                setAuthRequiredFeature(featureName);
                setIsAuthRequiredModalOpen(true);
            }
            return;
        }

        // ✅ 그 외 모든 기능은 인증 없이 허용 (단, 미인증 배지 표시)
        // - 대화 참여, 메시지 보내기, 친구 추가, 방 생성, 대화 걸기 등
        console.log('✅ 인증 불필요 (미인증 배지 표시):', featureName);
        callback();
    };

    // 인증 모달에서 "지금 인증하기" 클릭 시
    const handleStartPhoneAuth = () => {
        setIsAuthRequiredModalOpen(false);

        // 로그인되어 있는지 확인
        if (!profile) {
            // 로그인 안되어 있음 → 먼저 로그인 필요
            showToast('⚠ 먼저 Google 로그인이 필요합니다');
            setIsLoginModalOpen(true);
            return;
        }

        // 로그인은 되어 있는데 pendingAuthData가 없는 경우 (페이지 새로고침 등)
        if (!pendingAuthData) {
            const firebaseUserId = localStorage.getItem('firebaseUserId');
            const accessToken = localStorage.getItem('accessToken');
            const expiresAtStr = localStorage.getItem('tokenExpiresAt');

            if (firebaseUserId && accessToken && expiresAtStr) {
                // localStorage에서 복원
                setPendingAuthData({
                    firebaseUserId,
                    accessToken,
                    userInfo: {
                        email: profile.email,
                        name: profile.name
                    },
                    pictureUrl: profile.picture,
                    expiresAt: parseInt(expiresAtStr, 10)
                });
            } else {
                // localStorage에도 없으면 재로그인 필요
                showToast('⚠ 세션이 만료되었습니다. 다시 로그인해주세요');
                setIsLoginModalOpen(true);
                return;
            }
        }

        // 로그인 되어 있음 → 휴대폰 인증 시작
        setIsPhoneVerifying(true);
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
            } else {
                // 🔄 포그라운드 복귀 시 inRoom 상태 초기화
                if (userId && isAuthenticated) {
                    try {
                        const { initializeInRoomStatus } = await import('./services/messageService');
                        await initializeInRoomStatus(userId);
                        console.log('✅ 포그라운드 복귀 - inRoom 상태 초기화 완료');
                    } catch (error) {
                        console.error('❌ inRoom 초기화 실패:', error);
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
                    syncTrash(result.data.trashedItems);
                }
                if (result.data.macroTexts) {
                    syncMacros(result.data.macroTexts);
                }
                if (result.data.memoFolders) {
                    syncFolders(result.data.memoFolders);
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
        // 🔴 가장 먼저 로그 기록 (크래시 위치 파악용)
        localStorage.setItem('__logout_debug_log__', '0ms | handleLogout 함수 진입');

        const logoutStartTime = Date.now();
        const logLines = ['0ms | handleLogout 함수 진입'];

        // 로그를 콘솔과 배열에 동시에 기록하는 헬퍼 함수
        const log = (msg) => {
            console.log(msg);
            logLines.push(`${Date.now() - logoutStartTime}ms | ${msg}`);
            localStorage.setItem('__logout_debug_log__', logLines.join('\n'));
        };

        // 플랫폼 체크를 먼저 수행
        log('📍 플랫폼 체크 시작');
        let isNativePlatform = false;
        try {
            const { Capacitor } = await import('@capacitor/core');
            isNativePlatform = Capacitor.isNativePlatform();
            log(`📍 플랫폼 체크 완료: ${isNativePlatform ? '네이티브' : '웹'}`);
        } catch (e) {
            isNativePlatform = false;
            log(`📍 플랫폼 체크 오류: ${e.message}`);
        }

        log('🚀 ========== 로그아웃 프로세스 시작 ==========');
        log(`🕐 시작 시간: ${new Date().toISOString()}`);
        log(`📱 플랫폼: ${isNativePlatform ? '네이티브 앱' : '웹'}`);

        // 🔒 로그아웃 시작 - UI 즉시 차단
        log('📍 [1/10] setIsLoggingOut(true) 호출');
        setIsLoggingOut(true);

        // 🔥 로그아웃 전 Firestore에 즉시 저장
        log('📍 [2/10] Firestore 데이터 저장 시작');
        try {
            const firebaseUserId = localStorage.getItem('firebaseUserId');
            log(`   - userId: ${userId}, firebaseUserId: ${firebaseUserId}, isAuthenticated: ${isAuthenticated}`);
            if ((userId || firebaseUserId) && isAuthenticated) {
                log('   💾 로그아웃 전 데이터 저장 중...');
                await saveImmediately();
                log('   ✅ 데이터 저장 완료');
            } else {
                log('   ⚠️ 로그인 상태가 아니므로 저장 생략');
            }
        } catch (error) {
            log(`   ❌ 데이터 저장 오류: ${error.message}`);
        }

        // 📱 네이티브 GoogleAuth.signOut()은 맨 마지막에 fire-and-forget으로 실행
        // (여기서 await으로 호출하면 Activity Context 상실로 앱 크래시 발생)
        log('📍 [3/10] 네이티브 Google 로그아웃 - 맨 마지막으로 연기됨');

        // 🔥 Firebase Auth 로그아웃
        log('📍 [4/10] Firebase Auth 로그아웃 시작');
        try {
            if (auth) {
                log(`   - auth.currentUser: ${auth.currentUser?.uid}`);
                await signOut(auth);
                log('   🔥 Firebase 로그아웃 완료');
            } else {
                log('   ⚠️ auth 객체가 없음');
            }
        } catch (error) {
            log(`   ❌ Firebase 로그아웃 오류: ${error.message}`);
        }

        // 🔑 Google OAuth 토큰 revoke (웹에서만 실행 - 네이티브에서는 스킵)
        log('📍 [5/10] Google OAuth 토큰 revoke');
        if (!isNativePlatform) {
            try {
                log('   - googleLogout() 호출 중...');
                googleLogout();
                log('   ✅ googleLogout() 호출 완료');

                if (window.google?.accounts?.id) {
                    window.google.accounts.id.disableAutoSelect();
                    log('   ✅ disableAutoSelect() 호출 완료');
                }

                if (accessToken) {
                    try {
                        log('   - 토큰 revoke API 호출 중...');
                        const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
                            method: 'POST',
                            headers: { 'Content-type': 'application/x-www-form-urlencoded' }
                        });
                        if (response.ok) {
                            log('   🔑 Google OAuth 토큰 revoke 완료');
                        } else {
                            log(`   ⚠️ 토큰 revoke 실패: ${response.status}`);
                        }
                    } catch (revokeError) {
                        log(`   ⚠️ 토큰 revoke 중 오류: ${revokeError.message}`);
                    }
                }
            } catch (error) {
                log(`   ❌ Google OAuth 로그아웃 오류: ${error.message}`);
            }
        } else {
            log('   ⏭️ 네이티브 앱이므로 웹 OAuth revoke 스킵');
        }

        // 상태 초기화
        log('📍 [6/10] React 상태 초기화');
        setProfile(null);
        setAccessTokenState(null);
        log('   - setProfile(null), setAccessTokenState(null) 완료');

        // 🔐 계정별 localStorage 정리
        log('📍 [7/10] localStorage 정리 시작');
        log('   - userStorageLogout() 호출');
        userStorageLogout();
        log('   - cleanupSharedKeys() 호출');
        cleanupSharedKeys();

        const keysToRemove = [
            'userProfile', 'accessToken', 'tokenExpiresAt', 'lastSyncTime',
            'firebaseUserId', 'userInfo', 'userPicture', 'lastLoginTime',
            'mindflowUserId', 'isPhoneVerified', 'userNickname', 'userDisplayName',
            'profileImageType', 'selectedAvatarId', 'avatarBgColor',
            'customProfilePicture', 'customProfilePictureHash'
        ];
        keysToRemove.forEach(key => localStorage.removeItem(key));
        log(`   - localStorage에서 ${keysToRemove.length}개 키 삭제`);

        // sessionStorage 완전 정리
        log('📍 [8/10] sessionStorage 정리');
        sessionStorage.clear();
        log('   ✅ sessionStorage 정리 완료');

        // IndexedDB 정리 (웹에서만 - 네이티브에서는 Firebase가 자체 정리하도록)
        log('📍 [9/10] IndexedDB 정리');
        if (!isNativePlatform) {
            try {
                const databases = await window.indexedDB.databases();
                log(`   - 전체 IndexedDB: ${databases.map(db => db.name).join(', ') || '없음'}`);
                let deletedCount = 0;
                databases.forEach(db => {
                    if (db.name && (db.name.includes('google') || db.name.includes('gsi') ||
                        db.name.includes('oauth') || db.name.includes('firebase'))) {
                        window.indexedDB.deleteDatabase(db.name);
                        log(`   🗑️ IndexedDB 삭제: ${db.name}`);
                        deletedCount++;
                    }
                });
                log(`   - 삭제된 DB 수: ${deletedCount}`);
            } catch (error) {
                log(`   ⚠️ IndexedDB 정리 실패: ${error.message || error}`);
            }
        } else {
            log('   ⏭️ 네이티브 앱: IndexedDB 강제 삭제 스킵 (Firebase 자체 정리)');
        }

        showToast("✓ 로그아웃되었습니다");
        setIsMenuOpen(false);
        setIsLoginModalOpen(false);

        if (syncIntervalRef.current) {
            clearInterval(syncIntervalRef.current);
            log('   - syncInterval 정리됨');
        }

        log('✅ 로그아웃 완료 - 상태 초기화됨');
        setLoginKey(prev => prev + 1);

        // 페이지 초기화 (300ms 대기로 상태 반영 시간 확보)
        log('📍 [10/10] 페이지 초기화 (setTimeout 300ms)');

        setTimeout(() => {
            log('   🔄 setTimeout 콜백 실행됨');
            log(`   - isNativePlatform: ${isNativePlatform}`);

            if (isNativePlatform) {
                // 🔑 핵심: 네이티브 앱에서는 window.location.replace를 절대 사용하지 않음
                // WebView에서 location.replace는 Activity 종료로 인식되어 앱이 닫힘
                log('   - 네이티브 앱: setIsLoggingOut(false) 호출');
                setIsLoggingOut(false);
                log('   - 네이티브 앱: 새로고침 없이 React 상태 초기화만 수행');

                // 📱 GoogleAuth.signOut() 완전 제거
                // Firebase signOut만으로 세션이 끊어지며, 다음 로그인 시 GoogleAuth가 자동으로 새 세션 생성
                // GoogleAuth.signOut()은 Activity Context 문제로 앱 크래시 유발하므로 호출하지 않음
                log('   - 네이티브 앱: GoogleAuth.signOut() 스킵 (Firebase signOut만으로 충분)');

                log('🏁 ========== 로그아웃 프로세스 종료 (네이티브) ==========');
                localStorage.setItem('__logout_debug_log__', logLines.join('\n'));
            } else {
                log('   - 웹: window.location.href 호출 직전');
                log('🏁 ========== 로그아웃 프로세스 종료 (웹) ==========');
                localStorage.setItem('__logout_debug_log__', logLines.join('\n'));
                window.location.href = window.location.origin + window.location.pathname;
            }
        }, 300);
    };
    
    useEffect(() => {
        console.log('🔍 showHeader 상태 변경:', showHeader);
    }, [showHeader]);

    const lastScrollYRef = useRef(0);
    const scrollDirectionRef = useRef(0); // 스크롤 방향 누적값 (양수: 아래, 음수: 위)
    const showHeaderRef = useRef(showHeader); // showHeader 최신 상태 추적

    // showHeader 상태 변경 시 ref 업데이트
    useEffect(() => {
        showHeaderRef.current = showHeader;
    }, [showHeader]);

    // 스크롤 감지 임계값 (부드러운 마그네틱 효과)
    const SCROLL_THRESHOLD = 150; // 이 거리만큼 스크롤해야 헤더가 반응 (아이폰 스타일 자석 효과)
    const MIN_SCROLL_Y = 10; // 최소 스크롤 위치 (맨 위에선 항상 헤더 표시)

    // 스크롤 이벤트 핸들러 함수 (useRef로 저장하여 재생성 방지)
    const handleScrollRef = useRef(null);

    if (!handleScrollRef.current) {
        handleScrollRef.current = () => {
            if (!contentRef.current) return;

            const currentY = contentRef.current.scrollTop;
            const scrollDelta = currentY - lastScrollYRef.current;

            // 스크롤 방향이 바뀌면 누적값 리셋 (마그네틱 효과)
            if ((scrollDirectionRef.current > 0 && scrollDelta < 0) ||
                (scrollDirectionRef.current < 0 && scrollDelta > 0)) {
                scrollDirectionRef.current = 0;
            }

            // 스크롤 방향 누적
            scrollDirectionRef.current += scrollDelta;

            // 맨 위에 가까우면 항상 헤더 표시
            if (currentY < MIN_SCROLL_Y) {
                if (!showHeaderRef.current) {
                    console.log('🔼 맨 위 도달 - 헤더 표시');
                    setShowHeader(true);
                }
                scrollDirectionRef.current = 0;
            }
            // 아래로 스크롤 (헤더 숨김)
            else if (scrollDirectionRef.current > SCROLL_THRESHOLD) {
                if (showHeaderRef.current) {
                    console.log('🔽 아래 스크롤 감지 - 헤더 숨김');
                    setShowHeader(false);
                }
                scrollDirectionRef.current = 0;
            }
            // 위로 스크롤 (헤더 표시)
            else if (scrollDirectionRef.current < -SCROLL_THRESHOLD) {
                if (!showHeaderRef.current) {
                    console.log('🔼 위 스크롤 감지 - 헤더 표시');
                    setShowHeader(true);
                }
                scrollDirectionRef.current = 0;
            }

            lastScrollYRef.current = currentY;
        };
    }

    // 터치 스크롤 추적을 위한 ref (Android WebView 대응)
    const touchStartYRef = useRef(0);
    const isTouchScrollingRef = useRef(false);

    // 터치 시작 핸들러
    const handleTouchStartRef = useRef(null);
    if (!handleTouchStartRef.current) {
        handleTouchStartRef.current = (e) => {
            touchStartYRef.current = e.touches[0].clientY;
            isTouchScrollingRef.current = true;
            console.log('👆 터치 시작:', touchStartYRef.current);
        };
    }

    // 터치 이동 핸들러 (스크롤 감지)
    const handleTouchMoveRef = useRef(null);
    if (!handleTouchMoveRef.current) {
        handleTouchMoveRef.current = (e) => {
            if (!isTouchScrollingRef.current || !contentRef.current) return;

            const touchY = e.touches[0].clientY;
            const touchDelta = touchStartYRef.current - touchY; // 양수: 아래로 스크롤, 음수: 위로 스크롤

            // 실제 스크롤 위치 확인
            const currentY = contentRef.current.scrollTop;
            const scrollDelta = currentY - lastScrollYRef.current;

            // 스크롤이 실제로 발생했을 때만 처리
            if (Math.abs(scrollDelta) > 1) {
                // 스크롤 방향이 바뀌면 누적값 리셋
                if ((scrollDirectionRef.current > 0 && scrollDelta < 0) ||
                    (scrollDirectionRef.current < 0 && scrollDelta > 0)) {
                    scrollDirectionRef.current = 0;
                }

                // 스크롤 방향 누적
                scrollDirectionRef.current += scrollDelta;

                console.log('👆📜 터치 스크롤:', {
                    currentY,
                    lastY: lastScrollYRef.current,
                    delta: scrollDelta,
                    touchDelta,
                    accumulated: scrollDirectionRef.current,
                    showHeader: showHeaderRef.current
                });

                // 맨 위에 가까우면 항상 헤더 표시
                if (currentY < MIN_SCROLL_Y) {
                    if (!showHeaderRef.current) {
                        console.log('🔼 맨 위 도달 - 헤더 표시 (터치)');
                        setShowHeader(true);
                    }
                    scrollDirectionRef.current = 0;
                }
                // 아래로 스크롤 (헤더 숨김)
                else if (scrollDirectionRef.current > SCROLL_THRESHOLD) {
                    if (showHeaderRef.current) {
                        console.log('🔽 아래 스크롤 감지 - 헤더 숨김 (터치)');
                        setShowHeader(false);
                    }
                    scrollDirectionRef.current = 0;
                }
                // 위로 스크롤 (헤더 표시)
                else if (scrollDirectionRef.current < -SCROLL_THRESHOLD) {
                    if (!showHeaderRef.current) {
                        console.log('🔼 위 스크롤 감지 - 헤더 표시 (터치)');
                        setShowHeader(true);
                    }
                    scrollDirectionRef.current = 0;
                }

                lastScrollYRef.current = currentY;
            }
        };
    }

    // 터치 종료 핸들러
    const handleTouchEndRef = useRef(null);
    if (!handleTouchEndRef.current) {
        handleTouchEndRef.current = () => {
            isTouchScrollingRef.current = false;
            console.log('👆 터치 종료');
        };
    }

    // ref callback으로 스크롤 및 터치 이벤트 리스너 등록
    const setContentRef = useRef((node) => {
        // 기존 ref 정리
        if (contentRef.current) {
            contentRef.current.removeEventListener('scroll', handleScrollRef.current);
            contentRef.current.removeEventListener('touchstart', handleTouchStartRef.current);
            contentRef.current.removeEventListener('touchmove', handleTouchMoveRef.current);
            contentRef.current.removeEventListener('touchend', handleTouchEndRef.current);
            contentRef.current.removeEventListener('touchcancel', handleTouchEndRef.current);
            console.log('🧹 스크롤 및 터치 이벤트 리스너 제거됨');
        }

        // 새 ref 설정 및 이벤트 리스너 등록
        contentRef.current = node;

        if (node) {
            // 스크롤 이벤트 (웹 브라우저용)
            node.addEventListener('scroll', handleScrollRef.current, { passive: true });

            // 터치 이벤트 (Android WebView용 대응)
            node.addEventListener('touchstart', handleTouchStartRef.current, { passive: true });
            node.addEventListener('touchmove', handleTouchMoveRef.current, { passive: true });
            node.addEventListener('touchend', handleTouchEndRef.current, { passive: true });
            node.addEventListener('touchcancel', handleTouchEndRef.current, { passive: true });

            console.log('✅ 스크롤 및 터치 이벤트 리스너 등록됨 (passive: true)');
        }
    }).current;

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
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
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

    // 메모 생성 이벤트 리스너 (대화방에서 문서 저장 시)
    useEffect(() => {
        const handleMemoCreated = async (event) => {
            const { memoId } = event.detail;
            console.log('📝 [App.jsx] 새 메모 생성 감지:', memoId);

            // Firestore에서 메모 목록 다시 불러오기
            try {
                const updatedMemos = await fetchAllUserData(userId, 'memos');
                syncMemos(updatedMemos);
                console.log('✅ [App.jsx] 메모 목록 새로고침 완료');
            } catch (error) {
                console.error('❌ [App.jsx] 메모 목록 새로고침 실패:', error);
            }
        };

        window.addEventListener('memoCreated', handleMemoCreated);
        return () => {
            window.removeEventListener('memoCreated', handleMemoCreated);
        };
    }, [userId, syncMemos]);

    if (isLoading) {
        return (
            <S.Screen>
                <S.LoadingScreen>
                    앱을 불러오는 중...
                </S.LoadingScreen>
            </S.Screen>
        );
    }

    return (
        <AppRouter>
            <UserProvider>
                <TrashProvider autoDeleteDays={7} trashedItems={trash} setTrashedItems={syncTrash}>
                    <AppContent>
                    <GlobalStyle />

                    {/* 🎬 스플래시 스크린 */}
                    <SplashScreen
                        show={showSplash}
                        onComplete={() => setShowSplash(false)}
                        duration={1500}
                    />

                {/* 🔒 로그아웃 진행 중 오버레이 (다른 계정 데이터 노출 방지) */}
                {isLoggingOut && (
                    <S.LogoutOverlay>
                        <S.LogoutMessage>로그아웃 중...</S.LogoutMessage>
                    </S.LogoutOverlay>
                )}

                {/* 스플래시 중에는 메인 컨텐츠 숨김 */}
                {!showSplash && (
                <S.Screen>
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

                    <S.ContentArea
                        ref={setContentRef}
                        $showHeader={showHeader}
                        $isSecretTab={activeTab === 'secret'}
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
                                            latestMessage={latestMessage}
                                            memos={memos}
                                            calendarSchedules={calendarSchedules}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        )}
                        {activeTab === 'calendar' && (
                            <Calendar
                                key="calendar"
                                selectedDate={selectedDate}
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
                                currentUserId={firebaseUser?.uid}
                                initialActiveFolder={currentActiveFolder}
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
                        {/* 채팅은 상태 유지를 위해 항상 렌더링하되 CSS로 숨김 (로그인한 경우만) */}
                        {profile ? (
                            <div style={{ display: activeTab === 'chat' ? 'block' : 'none', height: '100%' }}>
                                <MessagingHub ref={messagingHubRef} showToast={showToast} memos={memos} requirePhoneAuth={requirePhoneAuth} onUpdateMemoPendingFlag={handleUpdateMemoPendingFlag} syncMemo={syncMemo} resetToChat={activeTab === 'chat'} />
                            </div>
                        ) : (
                            activeTab === 'chat' && (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    color: '#888',
                                    fontSize: '16px',
                                    gap: '12px'
                                }}>
                                    <span style={{ fontSize: '48px' }}>🔒</span>
                                    <span>로그인이 필요한 서비스입니다</span>
                                </div>
                            )
                        )}
                    </S.ContentArea>

                    <FloatingButton onClick={handleOpenNewMemoFromFAB} activeTab={activeTab} />
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
                        // ⚠️ 운세 기능 비활성화
                        // onOpenFortune={handleOpenFortune}
                        onExport={handleDataExport}
                        onImport={handleDataImport}
                        onRestoreFromDrive={handleRestoreFromDrive}
                        onSync={handleSync}
                        onManualSync={manualSync}
                        syncStatus={syncStatus}
                        profile={profile}
                        userId={userId}
                        wsCode={wsCode}
                        onProfileClick={handleProfileClick}
                        onLogout={handleLogout}
                        onLoginClick={() => setIsLoginModalOpen(true)}
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
            </S.Screen>
                )}

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

            {/* 📜 약관 동의 모달 */}
            {isTermsModalOpen && (
                <TermsAgreementModal
                    onAgree={handleTermsAgree}
                    onCancel={isTermsReConsent ? undefined : handleTermsCancel}
                    isReConsent={isTermsReConsent}
                    changedTerms={changedTermsList}
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
            <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

            {/* 알림 모달 (alert 대체) */}
            {alertModal && (
                <ConfirmAlertModal
                    message={alertModal.message}
                    title={alertModal.title}
                    onConfirm={alertModal.onConfirm}
                    onClose={() => setAlertModal(null)}
                />
            )}

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
                allSchedules={calendarSchedules}
                userId={userId}
                settings={settings}
                syncSettings={syncSettings}
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
            {/* ⚠️ 운세 기능 비활성화 (src/features/fortune으로 이동) */}
            {/* {isFortuneFlowOpen && (
                <FortuneFlow
                    onClose={() => setIsFortuneFlowOpen(false)}
                    profile={profile}
                    userId={userId}
                    saveFortuneProfileToFirestore={saveFortuneProfileToFirestore}
                    fetchFortuneProfileFromFirestore={fetchFortuneProfileFromFirestore}
                    // 운세 결과 및 기타 상태를 FortuneFlow 내부에서 관리
                />
            )} */}

            {/* Timer 기능 제거 (백그라운드 제한으로 인해 비활성화) */}

            {/* 👤 프로필 페이지 모달 - 상태 유지를 위해 항상 렌더링 */}
            {profile && (
                <div style={{ display: activeTab === 'profile' ? 'block' : 'none' }}>
                    <ProfilePage
                        profile={profile}
                        memos={memos}
                        folders={folders}
                        calendarSchedules={calendarSchedules}
                        showToast={showToast}
                        onCleanupOrphanedMemos={handleCleanupOrphanedMemos}
                        onClose={() => setActiveTab(previousTab)}
                    />
                </div>
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
                    onDelete={() => {
                        // 알람 영구 삭제 로직 (AlarmModal의 confirmDelete와 동일)
                        try {
                            const originalAlarm = alarm.originalAlarm;
                            const scheduleDate = alarm.scheduleDate;

                            if (!originalAlarm || !scheduleDate) {
                                console.warn('알람 삭제 실패: 원본 알람 정보 없음');
                                dismissToast(alarm.id);
                                return;
                            }

                            const userId = localStorage.getItem('currentUser');
                            const calendarKey = userId ? `user_${userId}_calendar` : 'calendarSchedules_shared';
                            const allSchedulesStr = localStorage.getItem(calendarKey);
                            const allSchedules = allSchedulesStr ? JSON.parse(allSchedulesStr) : {};

                            // 반복 기념일인 경우 원본 날짜에서 삭제
                            if (originalAlarm.isRepeated) {
                                const originalDateStr = format(originalAlarm.originalDate, 'yyyy-MM-dd');
                                const originalDayData = allSchedules[originalDateStr];

                                if (originalDayData?.alarm?.registeredAlarms) {
                                    const originalAlarms = originalDayData.alarm.registeredAlarms.filter(
                                        a => a.id !== originalAlarm.id
                                    );
                                    allSchedules[originalDateStr].alarm.registeredAlarms = originalAlarms;
                                    localStorage.setItem(calendarKey, JSON.stringify(allSchedules));
                                }
                            } else {
                                // 일반 알람 또는 원본 기념일 삭제
                                const dateKey = format(new Date(scheduleDate), 'yyyy-MM-dd');

                                if (!allSchedules[dateKey]) {
                                    allSchedules[dateKey] = {};
                                }
                                if (!allSchedules[dateKey].alarm) {
                                    allSchedules[dateKey].alarm = {};
                                }

                                const currentAlarms = allSchedules[dateKey].alarm.registeredAlarms || [];
                                const alarmsToSave = currentAlarms.filter(a => a.id !== originalAlarm.id);
                                allSchedules[dateKey].alarm.registeredAlarms = alarmsToSave;
                                localStorage.setItem(calendarKey, JSON.stringify(allSchedules));

                                // 동기화 마커 업데이트
                                if (allSchedules[dateKey] && (allSchedules[dateKey].text || alarmsToSave.length > 0)) {
                                    localStorage.setItem(`firestore_saved_calendar_${dateKey}`, JSON.stringify(allSchedules[dateKey]));
                                } else {
                                    localStorage.setItem(`firestore_saved_calendar_${dateKey}`, 'DELETED');
                                }
                            }

                            // 캘린더 스케줄 업데이트
                            setCalendarSchedules(allSchedules);

                            // 토스트 닫기
                            dismissToast(alarm.id);
                        } catch (error) {
                            console.error('알람 삭제 오류:', error);
                            dismissToast(alarm.id);
                        }
                    }}
                />
            ))}

            </AppContent>
        </TrashProvider>
            </UserProvider>
        </AppRouter>
    );
}

export default App;