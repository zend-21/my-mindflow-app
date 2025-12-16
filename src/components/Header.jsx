// src/components/Header.jsx

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getDailyGreeting } from '../utils/greetingMessages';
import { avatarList } from './avatars/AvatarIcons';

const HeaderWrapper = styled.header`
  background: linear-gradient(180deg, #2a2d35 0%, #1f2229 100%);
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
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
    background: linear-gradient(135deg, rgba(240, 147, 251, 0.3) 0%, rgba(245, 87, 108, 0.3) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 16px;
    cursor: pointer;
    transition: transform 0.2s;
    border: 2px solid rgba(240, 147, 251, 0.5);
    box-shadow: 0 2px 8px rgba(240, 147, 251, 0.3);
    &:hover {
        transform: scale(1.1);
    }
`;

const AvatarIconWrapper = styled.div`
    width: 35px;
    height: 35px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s;
    background: ${props => props.$bgColor || 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)'};

    &:hover {
        transform: scale(1.1);
    }

    svg {
        width: 100%;
        height: 100%;
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
    color: #e0e0e0;
`;

const GreetingMessage = styled.span`
    font-size: 14px;
    font-weight: 400;
    color: #b0b0b0;
    white-space: nowrap;
`;

const LoginText = styled.span`
    font-size: 18px;
    font-weight: 600;
    color: #e0e0e0;
    cursor: pointer;
`;

const ActionButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    color: #e0e0e0;
    padding: 0;
    line-height: 1;
    font-size: 24px;

    &:hover {
        color: #ffffff;
    }
`;

const BACKGROUND_COLORS = {
    // 그라데이션
    'none': 'transparent',
    'lavender': 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    'peach': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'mint': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'sunset': 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
    'ocean': 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    // 비비드한 단색
    'pink': '#FF69B4',
    'blue': '#4169E1',
    'yellow': '#FFD700',
    'green': '#32CD32',
    'purple': '#9370DB',
    'custom': () => localStorage.getItem('avatarCustomColor') || '#FF1493',
};

// Header 컴포넌트
const Header = React.memo(({ profile, onMenuClick, onSearchClick, isHidden, onLoginClick, onProfileClick }) => {
    const [imageError, setImageError] = useState(false);
    const [greeting, setGreeting] = useState('');
    const [profileImageType, setProfileImageType] = useState('avatar');
    const [selectedAvatarId, setSelectedAvatarId] = useState(null);
    const [avatarBgColor, setAvatarBgColor] = useState('none');
    const [customPicture, setCustomPicture] = useState(null);

    // profile이 변경될 때마다 imageError 초기화 및 아바타 설정 로드
    useEffect(() => {
        setImageError(false);
        setProfileImageType(localStorage.getItem('profileImageType') || 'avatar');
        setSelectedAvatarId(localStorage.getItem('selectedAvatarId') || null);
        setAvatarBgColor(localStorage.getItem('avatarBgColor') || 'none');
        setCustomPicture(localStorage.getItem('customProfilePicture') || null);
    }, [profile]);

    // 배경색 변경 이벤트 리스너
    useEffect(() => {
        const handleBgColorChange = (e) => {
            setAvatarBgColor(e.detail);
        };
        window.addEventListener('avatarBgColorChanged', handleBgColorChange);
        return () => window.removeEventListener('avatarBgColorChanged', handleBgColorChange);
    }, []);

    // 아바타 변경 이벤트 리스너
    useEffect(() => {
        const handleAvatarChange = (e) => {
            // localStorage에서 직접 읽어오기 (SideMenu와 동일한 방식)
            setSelectedAvatarId(localStorage.getItem('selectedAvatarId') || null);
            setAvatarBgColor(localStorage.getItem('avatarBgColor') || 'none');
            setProfileImageType('avatar');
        };
        window.addEventListener('avatarChanged', handleAvatarChange);
        return () => window.removeEventListener('avatarChanged', handleAvatarChange);
    }, []);

    // 프로필 이미지 타입 변경 이벤트 리스너
    useEffect(() => {
        const handleProfileImageTypeChange = (e) => {
            setProfileImageType(e.detail);
        };
        window.addEventListener('profileImageTypeChanged', handleProfileImageTypeChange);
        return () => window.removeEventListener('profileImageTypeChanged', handleProfileImageTypeChange);
    }, []);

    // 커스텀 프로필 사진 변경 이벤트 리스너
    useEffect(() => {
        const handleProfilePictureChange = () => {
            setCustomPicture(localStorage.getItem('customProfilePicture') || null);
        };
        window.addEventListener('profilePictureChanged', handleProfilePictureChange);
        return () => window.removeEventListener('profilePictureChanged', handleProfilePictureChange);
    }, []);

    // 아바타 렌더링 함수
    const renderAvatarIcon = () => {
        if (!selectedAvatarId) return null;
        const avatar = avatarList.find(a => a.id === selectedAvatarId);
        if (!avatar) return null;
        const AvatarComponent = avatar.component;
        return <AvatarComponent />;
    };

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
                    // 로그인 상태: 아바타 또는 프로필 사진과 이름
                    <>
                        {profileImageType === 'avatar' ? (
                            selectedAvatarId ? (
                                <AvatarIconWrapper $bgColor={typeof BACKGROUND_COLORS[avatarBgColor] === 'function' ? BACKGROUND_COLORS[avatarBgColor]() : BACKGROUND_COLORS[avatarBgColor]}>
                                    {renderAvatarIcon()}
                                </AvatarIconWrapper>
                            ) : !profile.nickname && profile?.picture && !imageError ? (
                                <ProfileImage
                                    src={profile.picture}
                                    alt={profile.name}
                                    onError={handleImageError}
                                    crossOrigin="anonymous"
                                />
                            ) : (
                                <PlaceholderIcon>
                                    {(profile.nickname || profile.name)?.charAt(0).toUpperCase() || '?'}
                                </PlaceholderIcon>
                            )
                        ) : (
                            customPicture && !imageError ? (
                                <ProfileImage
                                    src={customPicture}
                                    alt={profile.name}
                                    onError={handleImageError}
                                />
                            ) : !profile.nickname && profile?.picture && !imageError ? (
                                <ProfileImage
                                    src={profile.picture}
                                    alt={profile.name}
                                    onError={handleImageError}
                                    crossOrigin="anonymous"
                                />
                            ) : (
                                <PlaceholderIcon>
                                    {(profile.nickname || profile.name)?.charAt(0).toUpperCase() || '?'}
                                </PlaceholderIcon>
                            )
                        )}
                        <ProfileNameContainer>
                        <ProfileName>
                            {profile.nickname || profile.name}
                            <span style={{ fontSize: '14px', fontWeight: '400', marginLeft: '2px' }}>님</span>
                        </ProfileName>
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
}, (prevProps, nextProps) => {
    // profile, isHidden 값이 변경되지 않으면 리렌더링 방지
    return (
        prevProps.isHidden === nextProps.isHidden &&
        prevProps.profile?.name === nextProps.profile?.name &&
        prevProps.profile?.nickname === nextProps.profile?.nickname &&
        prevProps.profile?.picture === nextProps.profile?.picture
    );
});

export default Header;