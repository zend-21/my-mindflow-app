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
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 10005;
`;

const MenuContainer = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 75vw;
    max-width: 350px;
    background:
        linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%),
        linear-gradient(180deg, #2a2d35 0%, #1a1d24 100%);
    box-shadow:
        6px 0 30px rgba(0, 0, 0, 0.5),
        inset -1px 0 0 rgba(255, 255, 255, 0.1);
    z-index: 10006;
    display: flex;
    flex-direction: column;
    padding: 0;
    transform: translateX(-100%);
    transition: transform 0.3s ease-in-out;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background:
            repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0,0,0,0.03) 2px,
                rgba(0,0,0,0.03) 4px
            );
        pointer-events: none;
    }

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
    padding: 20px 20px 0 20px;
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
    background: linear-gradient(135deg, #4a4d55 0%, #35383f 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    color: #9ca3af;
    flex-shrink: 0;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const ProfileInfo = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 0;
`;

const ProfileName = styled.span`
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const ProfileEmail = styled.span`
    font-size: 12px;
    color: #b0b0b0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    font-size: 24px;
    color: #ffffff;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;

    &:hover {
        opacity: 1;
    }
`;

const MenuItem = styled.div`
    padding: 18px 24px;
    font-size: 17px;
    color: #d0d0d0;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.3s ease;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    position: relative;
    background: transparent;

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 24px;
        right: 24px;
        height: 1px;
        background: linear-gradient(90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 100%
        );
    }

    & .icon {
        font-size: 22px;
        line-height: 1;
        filter: grayscale(100%) brightness(1.2);
        transition: all 0.3s ease;
    }

    &:hover, &:active {
        background: linear-gradient(90deg,
            rgba(240, 147, 251, 0.15),
            rgba(245, 87, 108, 0.15)
        );
        color: #ffffff;
        font-weight: 500;
        transform: translateX(5px);
        box-shadow: inset 0 0 20px rgba(240, 147, 251, 0.1);
    }

    &:hover .icon, &:active .icon {
        filter: grayscale(0%) brightness(1);
    }

    &:last-of-type {
        border-bottom: none;
    }

    &.logout-button {
        margin-top: auto;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        border-bottom: none;
    }
`;

const FileInput = styled.input`
    display: none;
`;

const MenuGroup = styled.div`
    position: relative;
    margin-bottom: 8px;
    padding-bottom: 8px;

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 4px;
        background:
            linear-gradient(180deg,
                rgba(0, 0, 0, 0.3) 0%,
                transparent 50%,
                rgba(255, 255, 255, 0.05) 100%
            );
        box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.05),
            0 -1px 0 rgba(0, 0, 0, 0.2);
    }

    &:last-of-type::after {
        display: none;
    }
`;

const SideMenu = ({
    isOpen,
    onClose,
    onExport,
    onImport,
    onRestoreFromDrive,
    profile,
    onProfileClick,
    onLogout,
    onLoginClick,
    onSync,
    onOpenFortune,
    onOpenTimer,  // ⏱️ 타이머 기능 추가
    onOpenTrash   // 🗑️ 휴지통 기능 추가
}) => {
    const fileInputRef = useRef(null);
    const [imageError, setImageError] = useState(false); // ✅ 추가: 이미지 로드 오류 상태

    const handleError = () => { // 에러 발생 시 상태 변경
        setImageError(true);
    };

    React.useEffect(() => { // 메뉴 열릴 때 상태 초기화
        if (isOpen) {
            setImageError(false);
        }
    }, [isOpen]);

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
                                {profile && !imageError ? ( // ✅ 조건 수정: imageError가 아닐 때만 이미지 표시
                                    <ProfileImage
                                        src={profile.customPicture || profile.picture}
                                        alt={profile.name || "Profile"}
                                        onError={handleError} // ✅ 추가: 에러 발생 시 handleError 호출
                                        crossOrigin={profile.customPicture ? undefined : "anonymous"}
                                    />
                                ) : ( // ✅ 수정: profile이 없거나 이미지 로드 에러 시 PlaceholderIcon 표시
                                    <PlaceholderIcon>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                    </PlaceholderIcon>
                                )}
                                <ProfileInfo>
                                    <ProfileName>{profile ? (profile.nickname || profile.name) : '로그인'}</ProfileName>
                                    <ProfileEmail>{profile ? profile.email : '로그인이 필요합니다'}</ProfileEmail>
                                </ProfileInfo>
                            </ProfileCluster>
                            <CloseButton onClick={onClose}>&times;</CloseButton>
                        </MenuHeader>

                        <MenuItemsWrapper>
                            {/* 🔮 그룹 1: 기능 */}
                            <MenuGroup>
                                <MenuItem onClick={() => {
                                    onClose();
                                    onOpenFortune();
                                }}>
                                    <span className="icon">🔮</span> 오늘의 운세
                                </MenuItem>
                                <MenuItem onClick={() => {
                                    onClose();
                                    if (onOpenTimer) onOpenTimer();
                                }}>
                                    <span className="icon">⏱️</span> 타이머
                                </MenuItem>
                            </MenuGroup>

                            {/* 📱 그룹 2: 백업/복원 */}
                            <MenuGroup>
                                <MenuItem onClick={onExport}>
                                    <span className="icon">💾</span> 휴대폰 백업
                                </MenuItem>
                                <MenuItem onClick={handleImportClick}>
                                    <span className="icon">📂</span> 휴대폰 복원
                                    <FileInput
                                        type="file"
                                        accept=".json"
                                        onChange={onImport}
                                        ref={fileInputRef}
                                    />
                                </MenuItem>
                            </MenuGroup>

                            {/* ☁️ 그룹 3: 동기화 (로그인 사용자 전용) */}
                            {profile && (
                                <MenuGroup>
                                    <MenuItem onClick={onSync}>
                                        <span className="icon">☁️</span> 동기화 (폰→구글)
                                    </MenuItem>
                                    <MenuItem onClick={onRestoreFromDrive}>
                                        <span className="icon">📥</span> 동기화 (구글→폰)
                                    </MenuItem>
                                </MenuGroup>
                            )}

                            {/* ⚙️ 그룹 4: 설정/관리 */}
                            <MenuGroup>
                                <MenuItem>
                                    <span className="icon">⚙️</span> 설정
                                </MenuItem>
                                <MenuItem onClick={() => {
                                    onClose();
                                    if (onOpenTrash) onOpenTrash();
                                }}>
                                    <span className="icon">🗑️</span> 휴지통
                                </MenuItem>
                            </MenuGroup>

                            {profile && (
                                <MenuItem className="logout-button" onClick={onLogout}>
                                    <span className="icon">🚪</span> 로그아웃
                                </MenuItem>
                            )}
                        </MenuItemsWrapper>
                    </MenuContainer>
                </>
            )}
        </>
    );
};

export default SideMenu;