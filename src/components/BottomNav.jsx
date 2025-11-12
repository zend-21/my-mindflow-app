// src/components/BottomNav.jsx

import React from 'react';
import styled from 'styled-components';
import { fadeInUp } from '../styles.js';

const NavContainer = styled.nav`
    display: flex;
    justify-content: space-around;
    align-items: center;
    position: absolute;
    bottom: 0;
    left: 0px;
    right: 0px;
    z-index: 9999;
    height: 80px;
    background: rgba(31, 34, 41, 0.95);
    backdrop-filter: blur(10px);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
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

    /* 기존 폰트 크기 설정을 제거하여 아이콘 크기가 부모에 영향을 받지 않도록 합니다. */

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
    font-size: 30px; /* 아이콘 크기를 더 확실하게 키웠습니다. */
    margin-bottom: 4px;
    color: ${props => props.$active ? '#f093fb' : '#808080'};
    transition: all 0.3s ease;

    /* ★★★ 아래 두 줄 추가 ★★★ */
    /* 활성화($active)되면 흑백 필터(grayscale)를 0%로, 비활성화되면 100%(흑백)로 설정 */
    filter: grayscale(${props => props.$active ? '0%' : '100%'});

    /* 비활성화 시 연하게 보이도록 투명도(opacity) 조절 */
    opacity: ${props => props.$active ? 1 : 0.4};
`;

const NavLabel = styled.span`
    font-size: 12px; /* 라벨 폰트 크기 별도 관리 */
`;

const BottomNav = ({ activeTab, onSwitchTab }) => {
    const tabs = [
        { name: 'home', label: '홈', icon: '🏠' },
        { name: 'memo', label: '메모', icon: '📝' },
        { name: 'calendar', label: '캘린더', icon: '📅' },
        { name: 'secret', label: '시크릿', icon: '🔐' },
        { name: 'review', label: '리뷰', icon: '🌟' }
    ];

    return (
        <NavContainer>
            {tabs.map(tab => (
                <NavItem
                    key={tab.name}
                    $active={activeTab === tab.name}
                    onClick={() => onSwitchTab(tab.name)}
                >
                    <NavIcon $active={activeTab === tab.name}>{tab.icon}</NavIcon>
                    <NavLabel>{tab.label}</NavLabel>
                </NavItem>
            ))}
        </NavContainer>
    );
};

export default BottomNav;