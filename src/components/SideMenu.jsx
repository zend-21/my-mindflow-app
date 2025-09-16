// src/components/SideMenu.jsx

import React, { useState, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

// 문제를 단순화하기 위해, 일단 Roulette 컴포넌트는 잠시 제외했습니다.
// 이 코드로 오류가 사라진다면, 문제는 Roulette.jsx 파일에 있을 수 있습니다.
// import Roulette from './Roulette'; 

const slideIn = keyframes`
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
`;
const slideOut = keyframes`
    from { transform: translateX(0); }
    to { transform: translateX(-100%); }
`;

const Overlay = styled.div`
    position: absolute; 
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 10005;
`;

const MenuContainer = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    height: 100vh;
    width: 75vw;
    max-width: 350px; 
    background: linear-gradient(180deg, #f0f2f5 0%, #e2e8f0 100%);
    box-shadow: 6px 0 25px rgba(0, 0, 0, 0.25);
    z-index: 10006;
    display: flex;
    flex-direction: column;
    padding: 20px 0;
    transform: translateX(-100%);
    transition: transform 0.3s ease-in-out;

    ${props => props.$isOpen && `
        transform: translateX(0);
    `}
`;

const MenuItemsWrapper = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
`;

const MenuHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 0 20px;
`;

const ProfileCluster = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    flex: 1;
    min-width: 0;
    padding-right: 10px;
`;

const ProfileImage = styled.img`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
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

const ProfileInfo = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 0;
`;

const ProfileName = styled.span`
    font-size: 16px;
    font-weight: 600;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const ProfileEmail = styled.span`
    font-size: 12px;
    color: #777;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    font-size: 24px;
    color: #999;
    cursor: pointer;
`;

const MenuItem = styled.div`
    padding: 18px 24px;
    font-size: 18px;
    color: #808080ff;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: background 0.3s ease, color 0.3s ease, transform 0.3s ease;
    border-bottom: 2px solid #e2e2e2ff;

    & .icon {
        font-size: 24px;
        line-height: 1;
        filter: grayscale(100%);
        transition: filter 0.3s ease;
    }

    &:hover, &:active {
        background: linear-gradient(90deg, #f093fb, #f5576c);
        color: white;
        font-weight: 600;
        transform: translateX(5px);
    }
    
    &:hover .icon, &:active .icon {
        filter: grayscale(0%);
    }

    &:last-of-type {
        border-bottom: none;
    }

    &.logout-button {
        margin-top: auto;
        border-top: 2px solid #e2e2e2ff;
        border-bottom: none;
    }
`;

const FileInput = styled.input`
    display: none;
`;

const SideMenu = ({ isOpen, onClose, onExport, onImport, profile, onProfileClick, onLogout, onLoginClick, onSync }) => {
    const fileInputRef = useRef(null);
    // const [isRouletteModalOpen, setIsRouletteModalOpen] = useState(false);

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };
    
    return (
        <>
            {isOpen && (
                <>
                    <Overlay onClick={onClose} />
                    <MenuContainer $isOpen={isOpen}>
                        <MenuHeader>
                            <ProfileCluster onClick={profile ? onProfileClick : onLoginClick}>
                                {profile ? (
                                    <ProfileImage 
                                        src={profile.picture} 
                                        alt="Profile" 
                                    />
                                ) : (
                                    <PlaceholderIcon>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                    </PlaceholderIcon>
                                )}
                                <ProfileInfo>
                                    <ProfileName>{profile ? profile.name : '로그인'}</ProfileName>
                                    <ProfileEmail>{profile ? profile.email : '로그인이 필요합니다'}</ProfileEmail>
                                </ProfileInfo>
                            </ProfileCluster>
                            <CloseButton onClick={onClose}>&times;</CloseButton>
                        </MenuHeader>

                        <MenuItemsWrapper>
                            {profile && (
                                <>
                                    <MenuItem onClick={onSync}>
                                        <span className="icon">🔄</span> 동기화
                                    </MenuItem>
                                    <MenuItem onClick={onExport}>
                                        <span className="icon">💾</span> 백업하기
                                    </MenuItem>
                                    <MenuItem onClick={handleImportClick}>
                                        <span className="icon">📂</span> 복원하기
                                        <FileInput 
                                            type="file" 
                                            accept=".json" 
                                            onChange={onImport}
                                            ref={fileInputRef}
                                        />
                                    </MenuItem>
                                </>
                            )}
                            <MenuItem onClick={() => setIsRouletteModalOpen(true)}>
                                <span className="icon">🔮</span> 오늘의 운세
                            </MenuItem>
                            <MenuItem>
                                <span className="icon">📝</span> 메모
                            </MenuItem>
                            <MenuItem>
                                <span className="icon">📅</span> 캘린더
                            </MenuItem>
                            <MenuItem>
                                <span className="icon">⚙️</span> 설정
                            </MenuItem>
                            
                            {profile && (
                                <MenuItem className="logout-button" onClick={onLogout}>
                                    <span className="icon">🚪</span> 로그아웃
                                </MenuItem>
                            )}
                        </MenuItemsWrapper>
                    </MenuContainer>
                </>
            )}

            {/* {isRouletteModalOpen && (
                <Roulette onClose={() => setIsRouletteModalOpen(false)} />
            )} */}
        </>
    );
};

export default SideMenu;