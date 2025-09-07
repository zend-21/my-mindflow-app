// src/components/Header.jsx

import React from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.header`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    padding-top: 18px;  
    padding-bottom: 24px;
`;

const UserInfo = styled.div`
    display: flex;
    align-items: center;
`;

const UserAvatar = styled.div`
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #e0e0e0;
    margin-right: 12px;
`;

const ProfileImage = styled.img`
    width: 48px;
    height: 48px;
    border-radius: 50%;
    margin-right: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    cursor: pointer;
`;

const Greeting = styled.div`
    font-size: 14px;
    color: #888;
    margin-bottom: 2px;
`;

const UserName = styled.div`
    font-size: 20px;
    font-weight: bold;
    color: #333;
`;

const LoginButton = styled.button`
    background-color: #4a90e2;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s;
    &:hover {
        background-color: #357abd;
    }
`;

const RightActions = styled.div`
    display: flex;
    gap: 12px;
`;

const ActionIcon = styled.div`
    width: 48px;
    height: 48px;
    background: rgba(255,255,255,0.7);
    backdrop-filter: blur(10px);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: #666;
    border: 1px solid rgba(255,255,255,0.2);
    cursor: pointer;
    transition: all 0.3s ease;
    
    /* 평소의 그림자 효과 (은은하게) */
    box-shadow: 0 2px 4px rgba(0,0,0,0.08);

    /* 웹 브라우저의 기본 포커스 표시 제거 */
    outline: none;

    &:hover {
        background: rgba(255,255,255,1);
        /* 마우스를 올렸을 때의 그림자 효과 (더 부각되게) */
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateY(-2px);
    }
`;

// SearchIcon과 SettingsIcon은 이제 ActionIcon을 기반으로 정의
const SearchIcon = styled(ActionIcon)``;
const SettingsIcon = styled(ActionIcon)`
    transform: rotate(0deg);
    transition: transform 0.3s ease;
    &:hover {
        transform: rotate(90deg);
    }
`;

const Header = ({ profile, onLogin, onLogout, onSearchClick, onMenuClick }) => {
    return (
        <HeaderContainer>
            {profile ? (
                // 로그인된 상태
                <UserInfo>
                    {profile.picture ? (
                        <ProfileImage src={profile.picture} alt="프로필 이미지" onClick={onMenuClick} />
                    ) : (
                        <UserAvatar onClick={onMenuClick} />
                    )}
                    <div>
                        <Greeting>안녕하세요!</Greeting>
                        <UserName>{profile.name}</UserName>
                    </div>
                </UserInfo>
            ) : (
                // 로그아웃 상태
                <LoginButton onClick={onLogin}>구글 로그인</LoginButton>
            )}
            <RightActions>
                {profile && <SearchIcon onClick={onSearchClick} />}
                {profile && (
                    <SettingsIcon onClick={onLogout}>
                        <img src="/logout-icon.svg" alt="로그아웃" style={{ width: '24px', height: '24px' }}/>
                    </SettingsIcon>
                )}
            </RightActions>
        </HeaderContainer>
    );
};

export default Header;