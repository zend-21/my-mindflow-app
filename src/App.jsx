// src/App.jsx

import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components'; 
import { GlobalStyle } from './styles.js';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { initializeGapiClient, setAccessToken, syncToGoogleDrive, loadFromGoogleDrive } from './utils/googleDriveSync';
import { DndContext, closestCenter, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useLocalStorage } from './hooks/useLocalStorage';
import { exportData, importData } from './utils/dataManager';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
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
import Calendar from './modules/calendar/Calendar.jsx';
import CalendarEditorModal from './modules/calendar/CalendarEditorModal.jsx';
import AlarmModal from './modules/calendar/AlarmModal.jsx';
import DateSelectorModal from './modules/calendar/DateSelectorModal.jsx';
import LoginModal from './components/LoginModal.jsx';
import FortuneFlow from './components/FortuneFlow.jsx';

// ★★★ 토스트 메시지 스타일 ★★★
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

const slideUp = keyframes`
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
`;

const PullToSyncIndicator = styled.div`
  position: fixed;
  top: 75px; /* 5px 위로 이동 */
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  color: #818181ff;
  font-size: 14px;
  animation: ${fadeIn} 0.3s ease-out;
  z-index: 5000;
`;

const PullGuideMessage = styled.div`
  position: fixed;
  top: 75px; /* 5px 아래로 이동 (70px → 75px) */
  left: 50%;
  transform: translateX(-50%);
  background: rgba(102, 126, 234, 0.9);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  z-index: 5000;
  animation: ${fadeIn} 0.2s ease-out;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
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

const ToastOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 12000;
  background: rgba(0, 0, 0, 0.2); 
  animation: ${fadeIn} 0.2s ease-out;
`;

const ToastBox = styled.div`
  background: rgba(0, 0, 0, 0.9); /* 더 어둡게 */
  color: white;
  padding: 24px 32px; /* 더 크게 */
  border-radius: 12px;
  font-size: 18px; /* 더 크게 */
  font-weight: 600; /* 굵게 */
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4); /* 더 진한 그림자 */
  animation: ${slideUp} 0.3s cubic-bezier(0.2, 0, 0, 1);
  text-align: center;
  min-width: 200px; /* 최소 너비 */
  z-index: 12001; /* z-index 더 높게 */
`;

const Screen = styled.div`
    height: 100vh;
    width: 100%;
    max-width: 450px;
    margin: 0 auto;
    
    background: linear-gradient(180deg, #fafafa 0%, #f0f2f5 100%);
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
    padding-left: 24px;
    padding-right: 24px;
    padding-bottom: 80px;
    padding-top: ${props => props.$showHeader ? '90px' : '20px'};
    overflow-y: auto;
    position: relative;
    transition: padding-top 0.3s ease${props => props.$isDragging ? '' : ', transform 0.3s ease'};
    transform: translateY(${props => props.$pullDistance}px);
    will-change: transform;
    overscroll-behavior: none;
    touch-action: pan-y;
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
        color: #333;
        margin-bottom: 10px;
    }
    p {
        font-size: 16px;
        color: #888;
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
    color: #888;
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
    
    // ✅ 새로 추가되는 상태들
    const [accessToken, setAccessTokenState] = useState(null);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const syncIntervalRef = useRef(null);
    const syncDebounceRef = useRef(null);
    const [isGapiReady, setIsGapiReady] = useState(false);
    
    const [activeTab, setActiveTab] = useState('home');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isFortuneFlowOpen, setIsFortuneFlowOpen] = useState(false);

    const [isDragging, setIsDragging] = useState(false);
    const pullStartTime = useRef(0);
    const [pullDistance, setPullDistance] = useState(0);
    const pullStartY = useRef(0);
    const WIDGET_ACTIVATION_DELAY = 500; // 위젯: 0.5초 제자리 누름
    const MIN_PULL_DISTANCE = 150;       // 동기화: 150px 이상 드래그 (증가)
    const PULL_THRESHOLD = 150;          // 임계값 증가 (100 → 150)

    const handlePullStart = (clientY) => {
        // 스크롤이 정확히 최상단일 때만 (더 엄격하게)
        if (contentAreaRef.current && contentAreaRef.current.scrollTop > 0) {
            return;
        }

        pullStartY.current = clientY;
        pullStartTime.current = Date.now();
        setIsDragging(true);
        console.log('⏱️ Pull 시작');
    };

    const handlePullMove = (clientY) => {
        if (!isDragging) return;

        const currentY = clientY;
        const distance = currentY - pullStartY.current;

        // 스크롤 체크 제거 - 손을 떼기 전까지는 절대 취소하지 않음

        // 아래로 당김 (30px 데드존 초과)
        if (distance > 30) {
            setPullDistance((distance - 30) * 0.4);
        }
        // 데드존 안쪽 (0~30px)
        else if (distance > 0) {
            setPullDistance(0);
        }
        // 위로 올릴 때: 손가락을 따라 음수로 이동 (부드럽게 복귀)
        else {
            setPullDistance(distance * 0.3); // 음수 값 허용, 저항감 추가
        }
    };

    const handlePullEnd = async () => {
        setIsDragging(false);
        
        console.log('🔵 handlePullEnd 호출됨');
        console.log('📏 pullDistance:', pullDistance);
        console.log('📏 PULL_THRESHOLD:', PULL_THRESHOLD);
        
        const shouldSync = pullDistance > PULL_THRESHOLD;
        console.log('❓ shouldSync:', shouldSync);
        
        setPullDistance(0);
        
        if (shouldSync) {
            console.log('✅ 수동 동기화 시작!');
            await handleSync();
        } else {
            console.log('❌ 거리 부족 - 동기화 안 함');
        }
    };

    // ✅ 추가: 앱 활성 상태 (포커스 여부)
    const [isAppActive, setIsAppActive] = useState(true); 

    const [isUserIdle, setIsUserIdle] = useState(false);
    const idleTimerRef = useRef(null);
    const IDLE_TIMEOUT = 5 * 60 * 1000; // 5분

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

    const storageKeySuffix = profile ? profile.email : 'guest';
    const [widgets, setWidgets] = useLocalStorage(`widgets_${storageKeySuffix}`, ['StatsGrid', 'QuickActions', 'RecentActivity']);
    const [memos, setMemos] = useLocalStorage(`memos_${storageKeySuffix}`, []);
    const [recentActivities, setRecentActivities] = useLocalStorage(`recentActivities_${storageKeySuffix}`, []);
    const [calendarSchedules, setCalendarSchedules] = useLocalStorage(`calendarSchedules_${storageKeySuffix}`, {});
    const [displayCount, setDisplayCount] = useLocalStorage(`displayCount_${storageKeySuffix}`, 5);
    
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

        // 모달에 전달할 데이터에 타임스탬프 추가
        setCalendarModalData({
            date,
            text: scheduleData.text ?? text, // 텍스트는 기존 방식을 유지
            createdAt: scheduleData.createdAt, // 작성일 추가
            updatedAt: scheduleData.updatedAt  // 수정일 추가
        });
        setIsCalendarEditorOpen(true);
    };

    const handleCalendarScheduleSave = (date, text) => {
            if (!date) return;

            const key = format(new Date(date), 'yyyy-MM-dd');
            const now = Date.now();

            const isEditingExisting = !!calendarSchedules[key];

            setCalendarSchedules(prev => {
                const copy = { ...prev };

                if (!text || text.trim() === "") {
                    if (copy[key]) {
                        delete copy[key];
                    }
                } else {
                    copy[key] = {
                        text,
                        createdAt: copy[key]?.createdAt ?? now,
                        updatedAt: now,
                    };
                }
                return copy;
            });

            if (!text || text.trim() === "") {
                addActivity('스케줄 삭제', `${key}`);
                showToast?.('스케줄이 삭제되었습니다.');
            } else {
                const activityType = isEditingExisting ? '스케줄 수정' : '스케줄 등록';
                const toastMessage = isEditingExisting ? '스케줄이 수정되었습니다.' : '스케줄이 등록되었습니다 ✅';
                
                addActivity(activityType, `${key} - ${text}`);
                showToast?.(toastMessage);
            }

            setIsCalendarEditorOpen(false);
            quietSync(); // ✅ 추가
        };

    const handleProfileClick = () => {
        setIsMenuOpen(false);
        alert("프로필 설정 페이지로 이동합니다. (연결 예정)");
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

        const trimmedDescription = description.length > 13 ? description.substring(0, 13) + '...' : description;
        const formattedDescription = `${type} - ${trimmedDescription}`;

        setRecentActivities(prevActivities => {
            const now = Date.now();
            const newActivity = {
                id: now, 
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
            const updatedActivities = [newActivity, ...prevActivities];
            return updatedActivities.slice(0, 15);
        });
    };
    
    const [isNewMemoModalOpen, setIsNewMemoModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedMemo, setSelectedMemo] = useState(null);
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

    const handleOpenAlarmModal = (scheduleData) => {
        console.log('handleOpenAlarmModal 호출됨:', scheduleData); // 디버깅용
        console.log('현재 isAlarmModalOpen 상태:', isAlarmModalOpen);
        console.log('현재 scheduleForAlarm 상태:', scheduleForAlarm);
        
        setScheduleForAlarm(scheduleData);
        setIsAlarmModalOpen(true);

        setTimeout(() => {
            console.log('상태 변경 후 isAlarmModalOpen:', isAlarmModalOpen);
            console.log('상태 변경 후 scheduleForAlarm:', scheduleForAlarm);
        }, 100);
    };

    const handleSaveAlarm = (alarmSettings) => {
        // 1. 알람을 설정할 대상 스케줄의 날짜 키(key)를 찾습니다.
        if (!scheduleForAlarm?.date) {
            console.error("알람을 저장할 스케줄 정보가 없습니다.");
            return;
        }
        const key = format(new Date(scheduleForAlarm.date), 'yyyy-MM-dd');

        // 2. calendarSchedules 상태를 업데이트합니다.
        setCalendarSchedules(prevSchedules => {
            const updatedSchedules = { ...prevSchedules };
            const targetSchedule = updatedSchedules[key];

            // 3. 해당 날짜의 스케줄에 'alarm' 객체를 추가하거나 업데이트합니다.
            if (targetSchedule) {
                updatedSchedules[key] = {
                    ...targetSchedule,
                    alarm: alarmSettings
                };
            }
            return updatedSchedules;
        });

        // 4. 사용자에게 피드백을 주고 모달을 닫습니다.
        showToast('알람이 설정되었습니다. 🔔');
        setIsAlarmModalOpen(false);
        setScheduleForAlarm(null);
    };

    const requestCalendarDelete = (date) => {
        setDateToDelete(date);
        setIsCalendarConfirmOpen(true);
    };

    const showToast = (message) => {
        console.log('🔔 showToast 호출됨:', message); // ✅ 로그 추가
        setToastMessage(message);
        setTimeout(() => {
            console.log('🔔 Toast 숨김'); // ✅ 로그 추가
            setToastMessage(null);
        }, 3000); // ✅ 1.5초 → 3초로 늘림
    };
    
    const handleDataExport = () => {
        exportData(memos);
        addActivity('백업', '전체 메모 백업');
        showToast("백업완료 되었습니다.");
    };

    const handleDataImport = async () => {
        const imported = await importData();
        if (imported) {
            alert('데이터가 성공적으로 복원되었습니다.');
            addActivity('복원', '전체 메모 복원');
            window.location.reload();
        }
    };
    
    const handleSaveNewMemo = (newMemoContent, isImportant) => {
            const now = Date.now();
            const newId = `m${now}`;
            const newMemo = {
                id: newId,
                content: newMemoContent,
                date: now,
                displayDate: new Date(now).toLocaleString(),
                isImportant: isImportant
            };
            setMemos(prevMemos => [newMemo, ...prevMemos]);
            addActivity('메모 작성', newMemoContent, newId);
            setIsNewMemoModalOpen(false);
            showToast("새 메모가 성공적으로 저장되었습니다.");
            quietSync(); // ✅ 추가
        };

    const handleEditMemo = (id, newContent, isImportant) => {
            const now = Date.now();
            const editedMemo = { id, content: newContent, date: now, displayDate: new Date(now).toLocaleString(), isImportant };
            setMemos(prevMemos => 
                prevMemos.map(memo => 
                    memo.id === id 
                        ? editedMemo
                        : memo
                )
            );
            addActivity('메모 수정', newContent, id);
            setIsDetailModalOpen(false);
            showToast("메모가 성공적으로 수정되었습니다.");
            quietSync(); // ✅ 추가
        };

    const handleDeleteMemo = (id) => {
            const deletedMemo = memos.find(memo => memo.id === id);
            if (deletedMemo) {
                setMemos(prevMemos => prevMemos.filter(memo => memo.id !== id));
                addActivity('메모 삭제', deletedMemo.content, id);
                quietSync(); // ✅ 추가
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
            if (newIds.size === 0) {
                setIsSelectionMode(false);
            }
            return newIds;
        });
    };

    const handleExitSelectionMode = () => {
        setIsSelectionMode(false);
        setSelectedMemoIds(new Set());
    };

    const requestDeleteSelectedMemos = () => {
        if (selectedMemoIds.size === 0) return;
        const idsToDelete = Array.from(selectedMemoIds);
        console.log("삭제 요청된 메모 ID들:", idsToDelete); // ★★★ 추가
        setMemoToDelete(idsToDelete);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        const isBulkDelete = Array.isArray(memoToDelete);
        let message = '';

        if (isBulkDelete) {
            const idsToDelete = new Set(memoToDelete);
            setMemos(prevMemos => prevMemos.filter(memo => !idsToDelete.has(memo.id)));
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
        setRecentActivities(prevActivities => prevActivities.filter(activity => activity.id !== activityId));
    };

    const allData = [
        { id: 'm1', title: '오늘의 할 일', content: '장보기, 운동하기', type: 'memo', isSecret: false },
        { id: 'c1', title: '여행 계획', content: '제주도 맛집 리스트, 숙소 예약', type: 'calendar', isSecret: false },
        { id: 'r1', title: '이번 주 리뷰', content: '프로젝트 피드백 반영', type: 'review', isSecret: false },
        { id: 's1', title: '비밀번호 목록', content: '중요한 계정 정보', type: 'secret', isSecret: true },
        { id: 'm2', title: 'React 공부', content: '컴포넌트와 상태 관리에 대해 복습하기', type: 'memo', isSecret: false },
        { id: 'm3', title: '아이디어 구상', content: '새로운 앱 서비스에 대한 아이디어 스케치', type: 'memo', isSecret: false },
    ];

    const handleSwitchTab = (tab) => {
        setActiveTab(tab);
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
            setWidgets((items) => {
                const oldIndex = items.findIndex((item) => item === active.id);
                const newIndex = items.findIndex((item) => item === over.id);
                return arrayMove(items, oldIndex, newIndex);
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
    const [isSyncing, setIsSyncing] = useState(false);
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
        const savedProfile = localStorage.getItem('userProfile');
        const savedToken = localStorage.getItem('accessToken');

        if (savedProfile && savedToken) {
            setProfile(JSON.parse(savedProfile));
            setAccessTokenState(savedToken);
            
            // GAPI가 준비되면 토큰 설정
            if (isGapiReady) {
                setAccessToken(savedToken);
            }
        }
        
        setIsLoading(false);
    }, [isGapiReady]);

    // ✅ 로그인 성공 시 처리 (기존 handleLoginSuccess를 확장)
    const handleLoginSuccess = async (response) => {
        try {
            const { accessToken, userInfo } = response;
            
            // ★★★ 수정: 강력한 URL HTTPS 강제 변환 로직 ★★★
            let pictureUrl = userInfo.picture;
            if (pictureUrl) {
                // http:// 또는 https:// 부분을 제거하고 무조건 https://를 붙입니다.
                const strippedUrl = pictureUrl.replace(/^https?:\/\//, ''); 
                pictureUrl = `https://${strippedUrl}`;
            }
            // ★★★
            
            // 사용자 프로필 설정
            const profileData = {
                email: userInfo.email,
                name: userInfo.name,
                picture: pictureUrl, // 수정된 pictureUrl 사용
            };
            
            setProfile(profileData);
            setAccessTokenState(accessToken);
            
            localStorage.setItem('userProfile', JSON.stringify(profileData));
            localStorage.setItem('accessToken', accessToken);
            
            // GAPI에 토큰 설정
            if (isGapiReady) {
                setAccessToken(accessToken);
            }
            
            setIsLoginModalOpen(false);
            showToast('✅ 로그인 완료!');
        } catch (error) {
            console.error('로그인 처리 중 오류:', error);
            showToast('로그인 처리 중 오류가 발생했습니다.');
        }
    };

    const handleLoginError = () => {
        console.log('Login Failed');
        setIsLoginModalOpen(false);
    };

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
        
        // 3초 후 조용히 동기화
        syncDebounceRef.current = setTimeout(async () => {
            if (profile && accessToken && isGapiReady) {
                console.log('🔄 조용한 동기화 시작 (3초 디바운싱)');
                await performSync(false); // isManual = false (메시지 없음)
            }
        }, 3000); // 3초
    };

    const performSync = async (isManual = false) => {
        console.log('🔧 performSync 시작 - isManual:', isManual);
        
        if (!profile || !accessToken) {
            console.log('❌ 로그인 안 됨');
            if (isManual) {
                showToast('⚠️ 로그인 필요');
                console.log('Toast 표시: 로그인 필요');
            }
            return false;
        }

        if (!isGapiReady) {
            console.log('❌ GAPI 준비 안 됨');
            if (isManual) {
                showToast('⏳ Drive 연결 중...');
                console.log('Toast 표시: Drive 연결 중');
            }
            return false;
        }

        try {
            console.log('✅ 동기화 조건 충족 - 시작');
            
            if (isManual) {
                console.log('🎯 수동 동기화 - 스피너 표시');
                setIsSyncing(true);
                // 동기화 시작 토스트 제거 - 스피너만 표시
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            const dataToSync = {
                memos,
                calendarSchedules,
                recentActivities,
                displayCount,
                widgets,
                userEmail: profile.email,
            };

            console.log('📤 Google Drive에 업로드 시작...');
            const result = await syncToGoogleDrive(dataToSync);
            console.log('📥 업로드 결과:', result);
            
            if (result.success) {
                // ✅ 성공 처리 - 이 부분이 반드시 있어야 함!
                const now = Date.now();
                setLastSyncTime(now);
                localStorage.setItem('lastSyncTime', now.toString());
                
                if (isManual) {
                    console.log('✅ 수동 동기화 - 활동 기록 추가');
                    addActivity('동기화', 'Google Drive 동기화 완료');
                    await new Promise(resolve => setTimeout(resolve, 500));
                    console.log('✅ 수동 동기화 - 토스트 표시');
                    showToast('✅ 동기화 완료!');
                    console.log('Toast 표시: 동기화 완료');
                }
                return true;
            } else {
                console.error('❌ 동기화 실패:', result);
                if (result.error === 'TOKEN_EXPIRED') {
                    // ✅ 자동 로그아웃 대신 재로그인 유도
                    if (isManual) {
                        showToast('🔐 로그인이 만료되었습니다. 다시 로그인해주세요.');
                        setTimeout(() => {
                            setIsLoginModalOpen(true);
                        }, 1500);
                    }
                    // handleLogout()을 호출하지 않음!
                } else {
                    if (isManual) {
                        showToast('❌ 동기화 실패');
                    }
                }
                return false;
            }
        } catch (error) {
            console.error('❌ 동기화 중 오류:', error);
            if (isManual) showToast('❌ 오류 발생');
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
            console.log('🔔 Visibility 상태 변경:', document.hidden ? '숨김(백그라운드)' : '보임(포그라운드)');
            
            if (document.hidden) {
                // 앱이 백그라운드로 전환됨
                console.log('📱 백그라운드 전환 감지 - 즉시 동기화 시작');
                
                // 대기 중인 디바운스 타이머 취소
                if (syncDebounceRef.current) {
                    clearTimeout(syncDebounceRef.current);
                    console.log('⏸️ 디바운스 타이머 취소됨');
                }
                
                // 즉시 동기화 (조용히)
                if (profile && accessToken && isGapiReady) {
                    console.log('🔄 백그라운드 동기화 실행 중...');
                    const success = await performSync(false); // isManual = false
                    if (success) {
                        console.log('✅ 백그라운드 동기화 완료');
                    }
                }
            } else {
                // 앱이 포그라운드로 복귀
                console.log('👀 앱이 다시 활성화됨 (포그라운드)');
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [profile, accessToken, isGapiReady, memos, calendarSchedules, recentActivities, displayCount, widgets]);

    // ✅ 앱 종료 시 마지막 동기화 - 새로 추가
    useEffect(() => {
        const handleBeforeUnload = async () => {
            if (profile && accessToken && isGapiReady) {
                console.log('👋 앱 종료 전 마지막 동기화...');
                
                const dataToSync = {
                    memos,
                    calendarSchedules,
                    recentActivities,
                    displayCount,
                    widgets,
                    userEmail: profile.email,
                };

                try {
                    await syncToGoogleDrive(dataToSync);
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
    }, [profile, accessToken, isGapiReady, memos, calendarSchedules, recentActivities]);

    // ✅ Google Drive에서 복원 - 새로 추가
    const handleRestoreFromDrive = async () => {
        if (!profile || !accessToken) {
            showToast('복원하려면 로그인 상태여야 합니다.');
            setIsLoginModalOpen(true);
            return;
        }

        if (!isGapiReady) {
            showToast('Google Drive 연결 준비 중입니다...');
            return;
        }

        try {
            const result = await loadFromGoogleDrive();
            
            if (result.success && result.data) {
                if (result.data.memos) setMemos(result.data.memos);
                if (result.data.calendarSchedules) setCalendarSchedules(result.data.calendarSchedules);
                if (result.data.recentActivities) setRecentActivities(result.data.recentActivities);
                if (result.data.displayCount) setDisplayCount(result.data.displayCount);
                if (result.data.widgets) setWidgets(result.data.widgets);
                
                addActivity('복원', 'Google Drive에서 복원 완료');
                showToast('데이터가 성공적으로 복원되었습니다 ✅');
                
                setIsMenuOpen(false);
            } else if (result.message === 'NO_FILE') {
                showToast('복원할 데이터가 없습니다.');
            } else if (result.error === 'TOKEN_EXPIRED') {
                showToast('로그인이 만료되었습니다. 다시 로그인해주세요.');
                handleLogout();
            } else {
                showToast('복원에 실패했습니다.');
            }
        } catch (error) {
            console.error('복원 중 오류:', error);
            showToast('복원 중 오류가 발생했습니다.');
        }
    };

    // ✅ 로그아웃 (확장됨)
    const handleLogout = () => {
        setProfile(null);
        setAccessTokenState(null);
        localStorage.removeItem('userProfile');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('lastSyncTime');
        
        showToast("로그아웃 되었습니다.");
        setIsMenuOpen(false);
        
        // 자동 동기화 중지
        if (syncIntervalRef.current) {
            clearInterval(syncIntervalRef.current);
        }
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
            addActivity('스케줄 삭제', `${key} - ${deletedEntry.text}`); // ✅ 활동 내역 추가
        }

        setCalendarSchedules(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
        });
        
        // 활동 로그 추가
        if (deletedEntry) {
            addActivity('스케줄 삭제', `${key} - ${deletedEntry.text}`);
        }

        showToast?.('스케줄이 삭제되었습니다 🗑️');
        setIsCalendarConfirmOpen(false);
        setDateToDelete(null);
    };
    
    const handleTouchStart = (e) => {
        handlePullStart(e.touches[0].clientY);
    };

    const handleTouchMove = (e) => {
        if (isDragging && contentAreaRef.current?.scrollTop === 0) {
            // 스크롤 최상단에서 드래그 중일 때만 기본 동작 방지
            e.preventDefault();
        }
        handlePullMove(e.touches[0].clientY);
    };

    const handleTouchEnd = async () => {
        await handlePullEnd();
    };

    const handleTouchCancel = async () => {
        // 터치가 취소되어도 handlePullEnd 호출 (드래그 종료)
        await handlePullEnd();
    };

    // 마우스 이벤트 핸들러 (PC 지원)
    const handleMouseDown = (e) => {
        handlePullStart(e.clientY);
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            handlePullMove(e.clientY);
        }
    };

    const handleMouseUp = async () => {
        if (isDragging) {
            await handlePullEnd();
        }
    };

    const handleMouseLeave = async () => {
        if (isDragging) {
            await handlePullEnd();
        }
    };
    
    useEffect(() => {
        if (contentAreaRef.current) {
            contentAreaRef.current.scrollTop = 0;
        }
    }, [activeTab]);
    
    const [loginService, setLoginService] = useState('none');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    
    const handleOpenNewMemoFromPage = () => {
        setMemoOpenSource('page'); 
        setIsNewMemoModalOpen(true);
    };

    const handleOpenNewMemoFromFAB = () => {
        setMemoOpenSource('fab'); 
        setIsNewMemoModalOpen(true);
    };

    const handleOpenDetailMemo = (memo) => {
        setSelectedMemo(memo);
        setIsDetailModalOpen(true);
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
        <>
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

                    {/* 풀 가이드 메시지: 임계값에 도달했을 때 (ContentArea 밖으로 이동) */}
                    {!isSyncing && pullDistance >= PULL_THRESHOLD && (
                        <PullGuideMessage>
                            ↓ 손을 떼면 동기화가 시작됩니다
                        </PullGuideMessage>
                    )}

                    {/* 동기화 중 표시 (ContentArea 밖으로 이동) */}
                    {isSyncing && (
                        <PullToSyncIndicator>
                            <SyncSpinner />
                            동기화 중...
                        </PullToSyncIndicator>
                    )}

                    <ContentArea
                        ref={contentAreaRef}
                        $pullDistance={pullDistance}
                        $showHeader={showHeader}
                        $isDragging={isDragging}
                        // 터치 이벤트 (모바일)
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onTouchCancel={handleTouchCancel}
                        // 마우스 이벤트 (PC)
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
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
                        {activeTab === 'calendar' && 
                            <Calendar 
                                onSelectDate={handleSelectDate} 
                                addActivity={addActivity} 
                                schedules={calendarSchedules} 
                                setSchedules={setCalendarSchedules} 
                                showToast={showToast}
                                onRequestDelete={requestCalendarDelete}
                                onOpenAlarm={handleOpenAlarmModal}
                                onOpenEditor={handleOpenCalendarEditor}
                                onOpenDateSelector={() => setIsDateSelectorOpen(true)}
                            />
                        }
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
                                onRequestDeleteSelectedMemos={requestDeleteSelectedMemos}
                            />
                        }
                        {activeTab === 'secret' && <div>시크릿 페이지</div>}
                        {activeTab === 'review' && <div>리뷰 페이지</div>}
                        {activeTab === 'profile' && <div>프로필 페이지</div>}
                        {activeTab === 'todo' && <div>할 일 페이지</div>}
                        {activeTab === 'recent-detail' && <div>최근 활동 상세 페이지</div>}
                    </ContentArea>

                    <FloatingButton onClick={handleOpenNewMemoFromFAB} activeTab={activeTab} />
                    <BottomNav activeTab={activeTab} onSwitchTab={handleSwitchTab} />
                    <SideMenu
                        isOpen={isMenuOpen}
                        onClose={handleToggleMenu}
                        displayCount={displayCount}
                        setDisplayCount={setDisplayCount}
                        showToast={showToast}
                        onOpenFortune={handleOpenFortune}
                        onExport={handleDataExport} 
                        onImport={handleDataImport}
                        onRestoreFromDrive={handleRestoreFromDrive}
                        profile={profile} 
                        onProfileClick={handleProfileClick}
                        onLogout={handleLogout}
                        onLoginClick={() => setIsLoginModalOpen(true)} // ★ 로그인 모달 여는 함수 전달
                    />
                </>
            </Screen>
            
            {/* ★★★ 로그인 모달 렌더링 로직 ★★★ */}
            {isLoginModalOpen && (
                <LoginModal
                    onSuccess={handleLoginSuccess}
                    onError={handleLoginError}
                    onClose={() => setIsLoginModalOpen(false)}
                    setProfile={setProfile}
                />
            )}

            {/* 모달(Modal)들은 Screen 컴포넌트 바깥에 두어 전체 화면을 덮도록 합니다. */}
            {toastMessage && (
                <ToastOverlay>
                    <ToastBox>
                        {toastMessage}
                    </ToastBox>
                </ToastOverlay>
            )}

            {isSearchModalOpen && (
                <SearchModal
                    onClose={() => setIsSearchModalOpen(false)}
                    allData={allData}
                    onSelectResult={(id, type) => {
                        setIsSearchModalOpen(false);
                        alert(`선택된 항목의 상세 페이지로 이동합니다. ID: ${id}, 유형: ${type}`);
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
                }}
            />

            <MemoDetailModal
                isOpen={isDetailModalOpen}
                memo={selectedMemo}
                onSave={handleEditMemo}
                onCancel={() => setIsDetailModalOpen(false)}
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
            <AlarmModal
                isOpen={isAlarmModalOpen}
                scheduleData={scheduleForAlarm}
                onSave={handleSaveAlarm}
                onClose={() => setIsAlarmModalOpen(false)}
            /> 
            {/* ✨ 🔮 오늘의 운세 전체 플로우 컴포넌트 */}
            {isFortuneFlowOpen && (
                <FortuneFlow
                    onClose={() => setIsFortuneFlowOpen(false)}
                    profile={profile}
                    // 운세 결과 및 기타 상태를 FortuneFlow 내부에서 관리
                />
            )}                
        </>
    );
}

export default App;