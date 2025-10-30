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
  position: fixed;
  top: ${props => props.$isHidden ? '-100px' : '0'};
  opacity: ${props => props.$isHidden ? 0 : 1};
  transition:
    top 1.1s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.6s ease-in-out;
  width: 100%;
  max-width: 450px;
  transition: top 1.1s cubic-bezier(0.28, 0.9, 0.4, 1);

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
    console.log('🎯 Header 렌더링 - isHidden:', isHidden);
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