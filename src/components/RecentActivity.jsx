// src/components/RecentActivity.jsx

import React from 'react';
import styled from 'styled-components';

const SectionTitle = styled.h2`
    font-size: 18px;
    font-weight: 700;
    color: #e0e0e0;
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
    background: #2a2d35;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    position: relative;
    display: flex;
    flex-direction: column; // 내용을 세로로 정렬

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(0,0,0,0.4);
    }
`;

const ActivityText = styled.p`
    font-size: 14px;
    color: #e0e0e0;
    margin: 0;
    padding-right: 35px; /* X 버튼 영역(28px) + 여유 공간(7px) */
    word-wrap: break-word;
    word-break: break-word;
`;

// 추가: 활동 날짜 스타일
const ActivityDate = styled.span`
    font-size: 12px;
    color: #b0b0b0;
    margin-top: 4px;
`;

const DeleteButton = styled.button`
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    color: #b0b0b0;
    font-size: 18px;
    cursor: pointer;
    padding: 5px;
    &:hover {
        color: #e0e0e0;
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