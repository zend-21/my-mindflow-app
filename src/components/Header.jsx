// src/components/Header.jsx

import React from 'react';
import styled from 'styled-components';

const HeaderWrapper = styled.header`
    background-color: #ffe59fff;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
    z-index: 500;
    position: absolute; 
    top: 0;
    left: 0;
    right: 0;
    margin: 0 auto;
    width: 100%;
    max-width: 450px;
    transition: transform 0.3s ease-in-out;
    transform: translateY(${props => props.$isHidden ? '-100%' : '0'});

    @media (min-width: 768px) { max-width: 700px; }
    @media (min-width: 1024px) { max-width: 900px; }
`;

const LeftContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
`;

const ProfileImage = styled.img`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
`;

const PlaceholderIcon = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #e2e8f0;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #a0aec0;
    flex-shrink: 0;
`;

const ProfileName = styled.span`
    font-size: 18px;
    font-weight: 600;
    color: #4a5568;
`;

const LoginText = styled.span`
    font-size: 18px;
    font-weight: 600;
    color: #4a5568;
    cursor: pointer;
`;

const RightContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 25px; 
`;

const ActionButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    color: #4a5568;
    padding: 0;
    line-height: 1;
    font-size: 24px;
`;

// ★ 1. props에 onProfileClick 추가 ★
const Header = ({ profile, onMenuClick, onSearchClick, isHidden, onLoginClick, onProfileClick, onSync }) => {
    return (
        <HeaderWrapper $isHidden={isHidden}>
            <LeftContainer onClick={profile ? onProfileClick : onLoginClick}>
                {profile ? (
                    // 로그인 상태: 프로필 사진과 이름
                    <>
                        <ProfileImage src={profile.picture} alt="User profile" />
                        <ProfileName>{profile.name}</ProfileName>
                    </>
                ) : (
                    // 로그아웃 상태: 아이콘과 '로그인' 텍스트
                    <>
                        <PlaceholderIcon>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </PlaceholderIcon>
                        <LoginText>로그인</LoginText>
                    </>
                )}
            </LeftContainer>
            
            <RightContainer>
                <ActionButton onClick={onSearchClick}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </ActionButton>
                <ActionButton onClick={onMenuClick}>
                    ☰
                </ActionButton>
            </RightContainer>
        </HeaderWrapper>
    );
};

export default Header;