// src/components/StatsGrid.jsx

import React from 'react';
import styled from 'styled-components';

const GridWrapper = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto;
    gap: 16px;
    margin-bottom: 24px;
`;

const StatCard = styled.div`
    background: linear-gradient(135deg, #2a2d35, #333842);
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    cursor: pointer;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 6px 16px rgba(0,0,0,0.5);
    }
`;

const StatTitle = styled.h3`
    font-size: 16px;
    font-weight: 600;
    color: #b0b0b0;
    margin: 0;
`;

const StatValue = styled.p`
    font-size: 32px;
    font-weight: 700;
    color: #ffffff;
    margin: 8px 0 0;
`;

const StatDescription = styled.p`
    font-size: 12px;
    color: #b0b0b0;
    margin: 4px 0 0;
`;

const StatsGrid = ({ onSwitchTab }) => {
    return (
        <GridWrapper>
            <StatCard onClick={() => onSwitchTab('memo')}>
                <StatTitle>오늘의 생각</StatTitle>
                <StatValue>12</StatValue>
                <StatDescription>새로운 아이디어를 기록해 보세요</StatDescription>
            </StatCard>
            <StatCard onClick={() => onSwitchTab('memo')}>
                <StatTitle>총 메모</StatTitle>
                <StatValue>345</StatValue>
                <StatDescription>모든 메모 보기</StatDescription>
            </StatCard>
            <StatCard onClick={() => onSwitchTab('todo')}>
                <StatTitle>미완료 할 일</StatTitle>
                <StatValue>4</StatValue>
                <StatDescription>오늘의 할 일 보기</StatDescription>
            </StatCard>
            <StatCard onClick={() => onSwitchTab('secret')}>
                <StatTitle>비밀 노트</StatTitle>
                <StatValue>15</StatValue>
                <StatDescription>나만 아는 비밀 기록</StatDescription>
            </StatCard>
        </GridWrapper>
    );
};

export default StatsGrid;