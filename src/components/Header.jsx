// src/components/Header.jsx

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getDailyGreeting } from '../utils/greetingMessages';

const HeaderWrapper = styled.header`
  background-color: #ffe59fff;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  z-index: 500;
  position: fixed;
  top: ${props => props.$isHidden ? '-100px' : '0'};
  opacity: ${props => props.$isHidden ? 0 : 1};
  transition:
    top 1.1s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.6s ease-in-out;
  width: 100%;
  max-width: 450px;

  @media (min-width: 768px) { max-width: 480px; }
  @media (min-width: 1024px) { max-width: 530px; }
  @media (min-width: 1440px) { max-width: 580px; }
  @media (min-width: 1900px) { max-width: 680px; }
`;

const LeftContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
`;

const RightContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 25px; 
`;

const ProfileImage = styled.img`
    width: 35px;
    height: 35px;
    border-radius: 50%;
    object-fit: cover;
    cursor: pointer;
    transition: transform 0.2s;
    &:hover {
        transform: scale(1.1);
    }
`;

const PlaceholderIcon = styled.div`
    width: 35px;
    height: 35px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 16px;
    cursor: pointer;
    transition: transform 0.2s;
    &:hover {
        transform: scale(1.1);
    }
`;

const ProfileNameContainer = styled.div`
    display: flex;
    align-items: baseline;
    gap: 4px;
`;

const ProfileName = styled.span`
    font-size: 18px;
    font-weight: 600;
    color: #4a5568;
`;

const GreetingMessage = styled.span`
    font-size: 14px;
    font-weight: 400;
    color: #718096;
    white-space: nowrap;
`;

const LoginText = styled.span`
    font-size: 18px;
    font-weight: 600;
    color: #4a5568;
    cursor: pointer;
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

// Header 컴포넌트
const Header = ({ profile, onMenuClick, onSearchClick, isHidden, onLoginClick, onProfileClick }) => {
    const [imageError, setImageError] = useState(false);
    const [greeting, setGreeting] = useState('');

    // profile이 변경될 때마다 imageError 초기화
    useEffect(() => {
        setImageError(false);
    }, [profile]);

    // 하루에 한 번 인사말 업데이트
    useEffect(() => {
        setGreeting(getDailyGreeting());
    }, []);

    // 앱이 포그라운드로 돌아올 때 인사말 업데이트
    useEffect(() => {
        const handleVisibilityChange = () => {
            // 앱이 다시 보이게 되면 (백그라운드 → 포그라운드)
            if (!document.hidden) {
                console.log('📱 앱이 포그라운드로 복귀 - 인사말 갱신');
                setGreeting(getDailyGreeting());
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const handleImageError = () => {
        console.log('⚠️ 프로필 이미지 로드 실패 - Placeholder 표시');
        setImageError(true);
    };

    console.log('🎯 Header 렌더링 - isHidden:', isHidden);
    
    return (
        <HeaderWrapper $isHidden={isHidden}>
            <LeftContainer onClick={profile ? onProfileClick : onLoginClick}>
                {profile ? (
                    // 로그인 상태: 프로필 사진과 이름
                    <>
                        {!imageError ? (
                            <ProfileImage
                                src={profile.customPicture || profile.picture}
                                alt={profile.name}
                                onError={handleImageError}
                                crossOrigin={profile.customPicture ? undefined : "anonymous"}
                            />
                        ) : (
                            <PlaceholderIcon>
                                {(profile.nickname || profile.name) ? (profile.nickname || profile.name).charAt(0).toUpperCase() : '?'}
                            </PlaceholderIcon>
                        )}
                        <ProfileNameContainer>
                            <ProfileName>{profile.nickname || profile.name}님</ProfileName>
                            <GreetingMessage>{greeting}</GreetingMessage>
                        </ProfileNameContainer>
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