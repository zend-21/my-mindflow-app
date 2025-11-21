// src/components/SideMenu.jsx

import React, { useState, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { avatarList } from './avatars/AvatarIcons';
import FriendsModal from './collaboration/FriendsModal';
import SharedNotesPage from './collaboration/SharedNotesPage';
import MyWorkspace from './collaboration/MyWorkspace';
import WorkspaceBrowser from './collaboration/WorkspaceBrowser';

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
    onOpenTrash  // 🗑️ 휴지통 기능 추가
}) => {
    const fileInputRef = useRef(null);
    const [imageError, setImageError] = useState(false); // ✅ 추가: 이미지 로드 오류 상태
    const [profileImageType, setProfileImageType] = useState('avatar');
    const [selectedAvatarId, setSelectedAvatarId] = useState(null);
    const [avatarBgColor, setAvatarBgColor] = useState('none');
    // 협업 관련 상태
    const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
    const [isSharedNotesPageOpen, setIsSharedNotesPageOpen] = useState(false);
    const [isMyWorkspaceOpen, setIsMyWorkspaceOpen] = useState(false);
    const [isWorkspaceBrowserOpen, setIsWorkspaceBrowserOpen] = useState(false);

    const handleError = () => { // 에러 발생 시 상태 변경
        setImageError(true);
    };

    React.useEffect(() => { // 메뉴 열릴 때 상태 초기화 및 아바타 설정 로드
        if (isOpen) {
            setImageError(false);
            setProfileImageType(localStorage.getItem('profileImageType') || 'avatar');
            setSelectedAvatarId(localStorage.getItem('selectedAvatarId') || null);
            setAvatarBgColor(localStorage.getItem('avatarBgColor') || 'none');
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

    // 아바타 렌더링 함수
    const renderAvatarIcon = () => {
        if (!selectedAvatarId) return null;
        const avatar = avatarList.find(a => a.id === selectedAvatarId);
        if (!avatar) return null;
        const AvatarComponent = avatar.component;
        return <AvatarComponent />;
    };

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
                                        ) : (
                                            <PlaceholderIcon>
                                                {(profile.nickname || profile.name)?.charAt(0).toUpperCase() || '?'}
                                            </PlaceholderIcon>
                                        )
                                    ) : (
                                        (profile.customPicture || profile.picture) && !imageError ? (
                                            <ProfileImage
                                                src={profile.customPicture || profile.picture}
                                                alt={profile.name || "Profile"}
                                                onError={handleError}
                                                crossOrigin={profile.customPicture ? undefined : "anonymous"}
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

                            {/* 👥 그룹 2: 협업 (로그인 사용자 전용) */}
                            {profile && (
                                <MenuGroup>
                                    <MenuItem onClick={() => {
                                        onClose();
                                        setIsMyWorkspaceOpen(true);
                                    }}>
                                        <span className="icon">🏠</span> 내 워크스페이스
                                    </MenuItem>
                                    <MenuItem onClick={() => {
                                        onClose();
                                        setIsWorkspaceBrowserOpen(true);
                                    }}>
                                        <span className="icon">🔍</span> 워크스페이스 탐색
                                    </MenuItem>
                                    <MenuItem onClick={() => {
                                        onClose();
                                        setIsFriendsModalOpen(true);
                                    }}>
                                        <span className="icon">👥</span> 친구 관리
                                    </MenuItem>
                                    <MenuItem onClick={() => {
                                        onClose();
                                        setIsSharedNotesPageOpen(true);
                                    }}>
                                        <span className="icon">📝</span> 공유된 메모
                                    </MenuItem>
                                </MenuGroup>
                            )}

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

            {/* 협업 관련 모달 및 페이지 */}
            <FriendsModal
                isOpen={isFriendsModalOpen}
                onClose={() => setIsFriendsModalOpen(false)}
            />

            {isSharedNotesPageOpen && (
                <SharedNotesPage
                    onBack={() => setIsSharedNotesPageOpen(false)}
                />
            )}

            {isMyWorkspaceOpen && (
                <MyWorkspace
                    onRoomSelect={(room) => {
                        // TODO: 방 입장 로직 연결
                        console.log('선택된 방:', room);
                        setIsMyWorkspaceOpen(false);
                    }}
                    onClose={() => setIsMyWorkspaceOpen(false)}
                />
            )}

            <WorkspaceBrowser
                isOpen={isWorkspaceBrowserOpen}
                onClose={() => setIsWorkspaceBrowserOpen(false)}
                onRoomSelect={(room) => {
                    // TODO: 방 입장 로직 연결
                    console.log('선택된 방:', room);
                    setIsWorkspaceBrowserOpen(false);
                }}
            />
        </>
    );
};

export default SideMenu;