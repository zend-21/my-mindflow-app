// src/components/RecentActivity.jsx

import React from 'react';
import styled from 'styled-components';

const SectionTitle = styled.h2`
    font-size: 18px;
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
`;

const TitleIcon = styled.span`
    font-size: 20px;
    margin-right: 8px;
`;

const ActivityList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const ActivityItem = styled.div`
    background: #fff;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    position: relative;
    display: flex;
    flex-direction: column; // 내용을 세로로 정렬
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
`;

const ActivityText = styled.p`
    font-size: 14px;
    color: #4a5568;
    margin: 0;
`;

// 추가: 활동 날짜 스타일
const ActivityDate = styled.span`
    font-size: 12px;
    color: #a0aec0;
    margin-top: 4px;
`;

const DeleteButton = styled.button`
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    color: #999;
    font-size: 18px;
    cursor: pointer;
    padding: 5px;
    &:hover {
        color: #333;
    }
`;

const RecentActivity = ({ recentActivities, deleteActivity }) => {
    return (
        <>
            <SectionTitle>
                <TitleIcon>⏰</TitleIcon>
                최근 활동
            </SectionTitle>
            <ActivityList>
                {recentActivities.length > 0 ? (
                    recentActivities.map(activity => (
                        <ActivityItem key={activity.id}>
                            <ActivityText>{activity.description}</ActivityText>
                            <ActivityDate>{activity.date}</ActivityDate>
                            <DeleteButton onClick={() => deleteActivity(activity.id)}>
                                &times;
                            </DeleteButton>
                        </ActivityItem>
                    ))
                ) : (
                    <ActivityItem>
                        <ActivityText>최근 활동 기록이 없습니다.</ActivityText>
                    </ActivityItem>
                )}
            </ActivityList>
        </>
    );
};

export default RecentActivity;