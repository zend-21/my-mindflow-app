// src/App.jsx

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { GlobalStyle } from './styles.js';
import { useGoogleLogin } from '@react-oauth/google';
import { DndContext, closestCenter, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useLocalStorage } from './hooks/useLocalStorage';

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

const Screen = styled.div`
    height: 100vh;
    width: 100vw;
    max-width: 450px;
    background: linear-gradient(180deg, #fafafa 0%, #f0f2f5 100%);
    position: relative;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
`;

const ContentArea = styled.div`
    flex: 1;
    padding: 16px 24px 24px 24px;
    padding-bottom: 80px;
    overflow-y: auto;
    transition: all 0.2s ease;
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
    const [user, setUser] = useState(null);
    
    const [profile, setProfile] = useState({
        name: '개발자 모드',
        picture: '/placeholder-avatar.svg'
    });
    const [activeTab, setActiveTab] = useState('home');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const [widgets, setWidgets] = useLocalStorage('widgets', profile, ['StatsGrid', 'QuickActions', 'RecentActivity']);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    
    // MemoPage에서 사용할 상태와 함수를 App.jsx에서 관리
    const [memos, setMemos] = useLocalStorage('memos', profile, []);
    const [recentActivities, setRecentActivities] = useLocalStorage('recentActivities', profile, []);
    const [displayCount, setDisplayCount] = useLocalStorage('displayCount', profile, 5);
    
    // **새롭게 추가된 관리자 모드 로직**
    const urlParams = new URLSearchParams(window.location.search);
    const secretKeyFromUrl = urlParams.get('secret');
    const adminSecretKey = import.meta.env.VITE_ADMIN_SECRET_KEY;
    const isAdminMode = secretKeyFromUrl === adminSecretKey;
    
    /*
    const login = useGoogleLogin({
        onSuccess: (codeResponse) => {
            setUser(codeResponse);
        },
        onError: (error) => console.log('Login Failed:', error)
    });
    */

    /*
    useEffect(() => {
        if (isAdminMode) {
            // 관리자 모드인 경우, 더미 프로필로 설정하여 바로 메인 화면으로 진입
            setProfile({
                name: '관리자',
                picture: 'https://via.placeholder.com/48',
            });
            console.log("관리자 모드로 진입했습니다.");
        } else if (user) {
            // 관리자 모드가 아닌 경우, 기존 구글 로그인 로직 실행
            fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user.access_token}`, {
                headers: {
                    Authorization: `Bearer ${user.access_token}`,
                    Accept: 'application/json'
                }
            })
            .then((res) => res.json())
            .then((data) => {
                setProfile(data);
                setActiveTab('home');
            });
        }
    }, [user, isAdminMode]);
    */

    const logOut = () => {
        setProfile(null);
        setUser(null);
    };

    const addActivity = (type, description, memoId = null) => {
        const allowedTypes = ['메모 작성', '메모 수정', '메모 삭제', '백업', '복원', '스케줄 등록', '리뷰 작성'];
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
    };

    const handleDeleteMemo = (id) => {
        const deletedMemo = memos.find(memo => memo.id === id);
        if (deletedMemo) {
            setMemos(prevMemos => prevMemos.filter(memo => memo.id !== id));
            addActivity('메모 삭제', deletedMemo.content, id);
        }
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

    const onDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setWidgets((items) => {
                const oldIndex = items.findIndex((item) => item === active.id);
                const newIndex = items.findIndex((item) => item === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 8 } });
    const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 500, tolerance: 5 } });
    const sensors = useSensors(mouseSensor, touchSensor);
    
    return (
        <>
            <GlobalStyle />
            <Screen>
                <Header
                    profile={profile}
                    onLogin={null} // onLogin 함수를 null로 설정
                    onLogout={null} // onLogout 함수를 null로 설정
                    onSearchClick={handleSearchClick}
                    onMenuClick={handleToggleMenu}
                />

                <ContentArea>
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
                    {activeTab === 'memo' &&
                        <MemoPage
                            memos={memos}
                            onSaveNewMemo={handleSaveNewMemo}
                            onEditMemo={handleEditMemo}
                            onDeleteMemo={handleDeleteMemo}
                            addActivity={addActivity}
                            profile={profile}
                        />
                    }
                    {activeTab === 'calendar' && <div>캘린더 페이지</div>}
                    {activeTab === 'secret' && <div>시크릿 페이지</div>}
                    {activeTab === 'review' && <div>리뷰 페이지</div>}
                    {activeTab === 'profile' && <div>프로필 페이지</div>}
                    {activeTab === 'todo' && <div>할 일 페이지</div>}
                    {activeTab === 'recent-detail' && <div>최근 활동 상세 페이지</div>}
                </ContentArea>

                {/* profile이 필요 없는 컴포넌트들 */}
                <FloatingButton onClick={handleFloatingButtonClick} />
                <BottomNav activeTab={activeTab} onSwitchTab={handleSwitchTab} />
                <SideMenu
                    isOpen={isMenuOpen}
                    onClose={handleToggleMenu}
                    displayCount={displayCount}
                    setDisplayCount={setDisplayCount}
                />
            </Screen>

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
        </>
    );
}

export default App;