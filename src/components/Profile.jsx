// src/components/Profile.jsx

import React from 'react';
import styled from 'styled-components';

const ProfileWrapper = styled.div`
    display: flex;
    align-items: center; 
    gap: 12px;
`;

const ProfileImage = styled.div`
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: #f0f2f5;
    border: 2px solid #ddd;
    overflow: hidden;
    
    background-image: url('https://picsum.photos/id/1005/100/100');
    background-size: cover;
    background-position: center;
`;

const TextContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
`;

const Greeting = styled.span`
    font-size: 13px;
    color: #718096;
    white-space: nowrap;
`;

const UserName = styled.span`
    font-size: 17px;
    font-weight: 600;
    color: #2d3748;
    white-space: nowrap;
`;

// ★★★ '님' 글자 스타일 추가 ★★★
const NimText = styled.span`
    font-size: 15px; /* 더 작게 */
    font-weight: normal; /* 볼드 제거 */
    color: #1d1d1dff; /* 인사말과 유사한 색상으로 통일감 */
    margin-left: 2px; /* 이름과 '님' 사이의 간격 */
`;

const Profile = ({ userName = "사용자", greeting = "좋은 하루예요!" }) => {
    return (
        <ProfileWrapper>
            <ProfileImage />
            <TextContainer>
                <Greeting>{greeting}</Greeting>
                {/* ★★★ userName과 '님'을 분리하여 스타일 적용 ★★★ */}
                <UserName>
                    {userName}
                    <NimText>님</NimText>
                </UserName>
            </TextContainer>
        </ProfileWrapper>
    );
};

export default Profile;