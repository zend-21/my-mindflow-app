// src/components/SideMenu.jsx

import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { avatarList } from './avatars/AvatarIcons';
import SecurityDocViewer from './SecurityDocViewer';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

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
    overflow-y: auto; /* 스크롤 가능하도록 설정 */
    overflow-x: hidden; /* 가로 스크롤 방지 */
    -webkit-overflow-scrolling: touch; /* iOS 부드러운 스크롤 */

    /* 스크롤바 스타일링 (웹킷 브라우저 - PC용) */
    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
    }

    /* 모바일에서도 스크롤 가능하도록 명시적 설정 */
    overscroll-behavior: contain;
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
    object-fit: cover;
    flex-shrink: 0;
`;

const PlaceholderIcon = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(240, 147, 251, 0.3) 0%, rgba(245, 87, 108, 0.3) 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-weight: bold;
    flex-shrink: 0;
    border: 2px solid rgba(240, 147, 251, 0.5);
    box-shadow: 0 2px 8px rgba(240, 147, 251, 0.3);
`;

const AvatarIconWrapper = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
    background: ${props => props.$bgColor || 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)'};

    svg {
        width: 100%;
        height: 100%;
    }
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
    onOpenMacro,  // ⚙️ 매크로 기능 추가
    onOpenFortune,
    onOpenTimer,  // ⏱️ 타이머 기능 추가
    onOpenTrash,  // 🗑️ 휴지통 기능 추가
    onRestoreMemoFolder,  // 📁 메모 폴더 복원 기능
    showToast,  // 토스트 메시지 표시 함수
    onRoomSelect  // 🏠 방 선택 핸들러
}) => {
    const fileInputRef = useRef(null);
    const [imageError, setImageError] = useState(false); // ✅ 추가: 이미지 로드 오류 상태
    const [profileImageType, setProfileImageType] = useState('avatar');
    const [selectedAvatarId, setSelectedAvatarId] = useState(null);
    const [avatarBgColor, setAvatarBgColor] = useState('none');
    const [customPicture, setCustomPicture] = useState(null);
    const [wsCode, setWsCode] = useState(null); // WS 코드 (친구 코드)
    // 협업 관련 상태
    const [isSecurityDocViewerOpen, setIsSecurityDocViewerOpen] = useState(false);

    const handleError = () => { // 에러 발생 시 상태 변경
        setImageError(true);
    };

    React.useEffect(() => { // 메뉴 열릴 때 상태 초기화 및 아바타 설정 로드
        if (isOpen) {
            setImageError(false);
            setProfileImageType(localStorage.getItem('profileImageType') || 'avatar');
            setSelectedAvatarId(localStorage.getItem('selectedAvatarId') || null);
            setAvatarBgColor(localStorage.getItem('avatarBgColor') || 'none');
            setCustomPicture(localStorage.getItem('customProfilePicture') || null);
        }
    }, [isOpen]);

    // 배경색 변경 이벤트 리스너
    React.useEffect(() => {
        const handleBgColorChange = (e) => {
            setAvatarBgColor(e.detail);
        };
        window.addEventListener('avatarBgColorChanged', handleBgColorChange);
        return () => window.removeEventListener('avatarBgColorChanged', handleBgColorChange);
    }, []);

    // 아바타 변경 이벤트 리스너
    React.useEffect(() => {
        const handleAvatarChange = (e) => {
            setSelectedAvatarId(e.detail);
            setProfileImageType('avatar');
        };
        window.addEventListener('avatarChanged', handleAvatarChange);
        return () => window.removeEventListener('avatarChanged', handleAvatarChange);
    }, []);

    // 프로필 이미지 타입 변경 이벤트 리스너
    React.useEffect(() => {
        const handleProfileImageTypeChange = (e) => {
            setProfileImageType(e.detail);
        };
        window.addEventListener('profileImageTypeChanged', handleProfileImageTypeChange);
        return () => window.removeEventListener('profileImageTypeChanged', handleProfileImageTypeChange);
    }, []);

    // 커스텀 프로필 사진 변경 이벤트 리스너
    React.useEffect(() => {
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

    // WS 코드 로드 (localStorage에서 먼저 확인, 없으면 Firebase에서 가져오기)
    useEffect(() => {
        const loadWsCode = async () => {
            const userId = localStorage.getItem('firebaseUserId');
            console.log('🔍 SideMenu - WS 코드 로드 시작, userId:', userId);

            if (!userId || !profile) {
                console.log('❌ SideMenu - userId 또는 profile 없음, userId:', userId, 'profile:', !!profile);
                setWsCode(null);
                return;
            }

            // 먼저 localStorage에서 확인
            const cachedWsCode = localStorage.getItem(`wsCode_${userId}`);
            console.log('💾 SideMenu - localStorage에서 조회:', cachedWsCode);

            if (cachedWsCode) {
                console.log('✅ SideMenu - localStorage에서 로드 성공:', cachedWsCode);
                setWsCode(cachedWsCode);
                return;
            }

            // localStorage에 없으면 Firebase에서 가져오기 (workspaces 컬렉션)
            try {
                const workspaceId = `workspace_${userId}`;
                console.log('🔥 SideMenu - Firebase 조회 시작:', workspaceId);

                const workspaceRef = doc(db, 'workspaces', workspaceId);
                const workspaceDoc = await getDoc(workspaceRef);

                console.log('🔥 SideMenu - Firebase 문서 존재:', workspaceDoc.exists());

                if (workspaceDoc.exists()) {
                    const code = workspaceDoc.data().workspaceCode;
                    console.log('✅ SideMenu - Firebase에서 로드 성공:', code);
                    setWsCode(code);
                    // localStorage에 저장
                    if (code) {
                        localStorage.setItem(`wsCode_${userId}`, code);
                        console.log('💾 SideMenu - localStorage에 저장 완료');
                    }
                } else {
                    console.log('❌ SideMenu - Firebase 문서가 존재하지 않음');
                }
            } catch (error) {
                console.error('❌ SideMenu - WS 코드 로드 오류:', error);
            }
        };

        if (profile) {
            loadWsCode();
        }
    }, [profile]);

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
                                    profileImageType === 'avatar' ? (
                                        selectedAvatarId ? (
                                            <AvatarIconWrapper $bgColor={typeof BACKGROUND_COLORS[avatarBgColor] === 'function' ? BACKGROUND_COLORS[avatarBgColor]() : BACKGROUND_COLORS[avatarBgColor]}>
                                                {renderAvatarIcon()}
                                            </AvatarIconWrapper>
                                        ) : !profile.nickname && profile?.picture && !imageError ? (
                                            <ProfileImage
                                                src={profile.picture}
                                                alt={profile.name || "Profile"}
                                                onError={handleError}
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
                                                alt={profile.name || "Profile"}
                                                onError={handleError}
                                            />
                                        ) : !profile.nickname && profile?.picture && !imageError ? (
                                            <ProfileImage
                                                src={profile.picture}
                                                alt={profile.name || "Profile"}
                                                onError={handleError}
                                                crossOrigin="anonymous"
                                            />
                                        ) : (
                                            <PlaceholderIcon>
                                                {(profile.nickname || profile.name)?.charAt(0).toUpperCase() || '?'}
                                            </PlaceholderIcon>
                                        )
                                    )
                                ) : (
                                    <PlaceholderIcon>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                    </PlaceholderIcon>
                                )}
                                <ProfileInfo>
                                    <ProfileName>{profile ? (profile.nickname || profile.name) : '로그인'}</ProfileName>
                                    <ProfileEmail>
                                        {profile ? (wsCode ? `ID: ${(wsCode.split('-')[1] || wsCode).toLowerCase()}` : 'ID 로딩중...') : '로그인이 필요합니다'}
                                    </ProfileEmail>
                                </ProfileInfo>
                            </ProfileCluster>
                            <CloseButton onClick={onClose}>&times;</CloseButton>
                        </MenuHeader>

                        <MenuItemsWrapper>
                            {/* 🔮 그룹 1: 기능 */}
                            <MenuGroup>
                                <MenuItem onClick={() => {
                                    onClose();
                                    if (onOpenMacro) onOpenMacro();
                                }}>
                                    <span className="icon">⚙️</span> 매크로
                                </MenuItem>
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

                            {/* ☁️ 그룹 3: 서버 복원 */}
                            <MenuGroup>
                                <MenuItem onClick={() => {
                                    if (onRestoreFromDrive) {
                                        const confirm = window.confirm(
                                            '서버에 저장된 데이터로 복원하시겠습니까?\n\n' +
                                            '현재 기기의 모든 데이터가 서버 데이터로 덮어씌워집니다.\n' +
                                            '(이미 자동 동기화 중이지만, 수동으로 복원이 필요한 경우에만 사용하세요)'
                                        );
                                        if (confirm) {
                                            onClose();
                                            onRestoreFromDrive();
                                        }
                                    }
                                }}>
                                    <span className="icon">☁️</span> 서버에서 복원
                                </MenuItem>
                            </MenuGroup>

                            {/* ⚙️ 그룹 4: 설정/관리 */}
                            <MenuGroup>
                                <MenuItem>
                                    <span className="icon">⚙️</span> 설정
                                </MenuItem>
                                <MenuItem onClick={() => {
                                    onClose();
                                    setIsSecurityDocViewerOpen(true);
                                }}>
                                    <span className="icon">🔒</span> 보안 & 개인정보
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

            {/* 보안 문서 뷰어 */}
            {isSecurityDocViewerOpen && (
                <SecurityDocViewer
                    onClose={() => setIsSecurityDocViewerOpen(false)}
                />
            )}
        </>
    );
};

export default SideMenu;