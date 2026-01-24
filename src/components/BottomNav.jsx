// src/components/BottomNav.jsx

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { fadeInUp } from '../styles.js';
import { subscribeToMyDMRooms } from '../services/directMessageService';
import { subscribeToMyGroupChats } from '../services/groupChatService';
import { setBadgeCount } from '../utils/badgeUtils';

const NavContainer = styled.nav`
    display: flex;
    justify-content: space-around;
    align-items: center;
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 450px;
    z-index: 9999;
    height: 60px;
    background: rgba(31, 34, 41, 0.95);
    backdrop-filter: blur(10px);
    border-top: 1px solid rgba(255, 255, 255, 0.05);

    @media (min-width: 768px) { max-width: 480px; }
    @media (min-width: 1024px) { max-width: 530px; }
    @media (min-width: 1440px) { max-width: 580px; }
    @media (min-width: 1900px) { max-width: 680px; }
`;

const NavItem = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: ${props => props.$active ? '#f093fb' : '#808080'};
    font-weight: 600;
    transition: all 0.3s ease;

    svg {
        width: 24px;
        height: 24px;
        margin-bottom: 4px;
    }

    &:hover {
        color: #f093fb;
    }
`;

// 아이콘을 감싸는 컴포넌트로 아이콘 크기를 직접 조절합니다.
const NavIcon = styled.div`
    font-size: 30px;
    color: ${props => props.$active ? '#f093fb' : '#808080'};
    transition: all 0.3s ease;
    filter: grayscale(${props => props.$active ? '0%' : '100%'});
    opacity: ${props => props.$active ? 1 : 0.4};
`;

const Badge = styled.div`
    position: absolute;
    top: -5px;
    right: -10px;
    background: linear-gradient(135deg, #ff416c, #ff4b2b);
    color: white;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 18px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(255, 65, 108, 0.4);
`;

const NavItemWrapper = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const BottomNav = ({ activeTab, onSwitchTab }) => {
    const [totalUnreadCount, setTotalUnreadCount] = useState(0);
    const currentUserId = localStorage.getItem('firebaseUserId');

    const tabs = [
        { name: 'home', label: '홈', icon: '🏠' },
        { name: 'memo', label: '메모', icon: '📝' },
        { name: 'calendar', label: '캘린더', icon: '📅' },
        { name: 'secret', label: '시크릿', icon: '🔐' },
        { name: 'chat', label: '대화', icon: '💬' }
    ];

    // 전체 안 읽은 메시지 개수 계산
    useEffect(() => {
        if (!currentUserId) {
            setTotalUnreadCount(0);
            return;
        }

        let dmUnread = 0;
        let groupUnread = 0;

        const updateTotal = () => {
            const total = dmUnread + groupUnread;
            // ⚠️ 중요: 0 이하의 값은 모두 0으로 처리 (음수 방지 및 모두 읽었을 때 배지 제거)
            const finalCount = total > 0 ? total : 0;
            setTotalUnreadCount(finalCount);
        };

        // 1:1 채팅 구독
        const unsubscribeDM = subscribeToMyDMRooms((rooms) => {
            dmUnread = rooms.reduce((sum, room) => {
                const count = room.unreadCount?.[currentUserId] || 0;
                return sum + count;
            }, 0);
            updateTotal();
        });

        // 그룹 채팅 구독
        const unsubscribeGroup = subscribeToMyGroupChats((groups) => {
            groupUnread = groups.reduce((sum, group) => {
                const count = group.unreadCount?.[currentUserId] || 0;
                return sum + count;
            }, 0);
            updateTotal();
        });

        return () => {
            if (unsubscribeDM) unsubscribeDM();
            if (unsubscribeGroup) unsubscribeGroup();
        };
    }, [currentUserId]);

    // 앱 아이콘 배지 업데이트
    useEffect(() => {
        setBadgeCount(totalUnreadCount);
    }, [totalUnreadCount]);

    return (
        <NavContainer>
            {tabs.map(tab => (
                <NavItemWrapper key={tab.name}>
                    <NavItem
                        $active={activeTab === tab.name}
                        onClick={() => onSwitchTab(tab.name)}
                    >
                        <NavIcon $active={activeTab === tab.name}>{tab.icon}</NavIcon>
                    </NavItem>
                    {tab.name === 'chat' && totalUnreadCount > 0 && (
                        <Badge>{totalUnreadCount > 99 ? '99+' : totalUnreadCount}</Badge>
                    )}
                </NavItemWrapper>
            ))}
        </NavContainer>
    );
};

export default BottomNav;