// src/components/SideMenu.jsx

import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { avatarList } from './avatars/AvatarIcons';
import ConfirmationModal from './ConfirmationModal';
import ConfirmModal from './ConfirmModal';
import UserGuide from './UserGuide';
import InfoPage from './InfoPage';
import AdminPanel from './AdminPanel';

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
    padding: 14px 24px;
    font-size: 16px;
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

    &.danger-button {
        color: rgba(255, 107, 107, 0.9);

        &:hover, &:active {
            background: linear-gradient(90deg,
                rgba(255, 107, 107, 0.15),
                rgba(229, 57, 53, 0.15)
            );
            color: #ff6b6b;
        }
    }

    &.logout-button {
        margin-top: auto;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        border-bottom: none;
    }

    &.admin-menu {
        background: linear-gradient(90deg,
            rgba(103, 126, 234, 0.1),
            rgba(118, 75, 162, 0.1)
        );
        border: 1px solid rgba(103, 126, 234, 0.2);
        border-radius: 8px;
        margin: 0 12px 8px 12px;

        &:hover, &:active {
            background: linear-gradient(90deg,
                rgba(103, 126, 234, 0.2),
                rgba(118, 75, 162, 0.2)
            );
        }
    }
`;

const NotificationDot = styled.span`
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    width: 8px;
    height: 8px;
    background: #ff4444;
    border-radius: 50%;
    animation: pulse 2s infinite;

    @keyframes pulse {
        0%, 100% {
            opacity: 1;
        }
        50% {
            opacity: 0.5;
        }
    }
`;

const NotificationBadge = styled.span`
    position: absolute;
    right: 20px;
    background: #e74c3c;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 10px;
    min-width: 20px;
    text-align: center;
    animation: pulse 2s infinite;

    @keyframes pulse {
        0%, 100% {
            opacity: 1;
        }
        50% {
            opacity: 0.7;
        }
    }
`;

const FileInput = styled.input`
    display: none;
`;

const MenuGroup = styled.div`
    position: relative;
    margin-bottom: 6px;
    padding-bottom: 6px;

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

// 백업/복원 안내 모달 스타일
const GuideModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s ease;

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;

const GuideModalContainer = styled.div`
    width: 90%;
    max-width: 340px;
    background: rgba(35, 35, 40, 0.98);
    border-radius: 16px;
    padding: 24px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    animation: scaleIn 0.2s ease;

    @keyframes scaleIn {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }
`;

const GuideTitle = styled.h3`
    font-size: 18px;
    font-weight: 600;
    color: #fff;
    margin: 0 0 16px 0;
    display: flex;
    align-items: center;
    gap: 8px;
`;

const GuideContent = styled.div`
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.6;
    margin-bottom: 20px;
`;

const GuideHighlight = styled.div`
    background: rgba(100, 180, 255, 0.15);
    border: 1px solid rgba(100, 180, 255, 0.3);
    border-radius: 8px;
    padding: 12px;
    margin: 12px 0;
    font-size: 13px;
    color: rgba(180, 220, 255, 0.95);
`;

const CheckboxRow = styled.label`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    margin-bottom: 16px;

    input {
        width: 16px;
        height: 16px;
        accent-color: #667eea;
    }
`;

const GuideButtonRow = styled.div`
    display: flex;
    gap: 10px;
`;

const GuideButton = styled.button`
    flex: 1;
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &.cancel {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.7);

        &:hover {
            background: rgba(255, 255, 255, 0.15);
        }
    }

    &.continue {
        background: linear-gradient(135deg, #667eea, #764ba2);
        border: none;
        color: #fff;

        &:hover {
            opacity: 0.9;
        }
    }

    &.danger {
        background: linear-gradient(135deg, #e53935, #c62828);
        border: none;
        color: #fff;

        &:hover {
            opacity: 0.9;
        }
    }
`;

// 기기 데이터 삭제 경고 모달
const DeleteWarningList = styled.ul`
    margin: 12px 0;
    padding-left: 20px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.8;

    li {
        margin-bottom: 4px;
    }
`;

const DeleteWarningBox = styled.div`
    background: rgba(229, 57, 53, 0.15);
    border: 1px solid rgba(229, 57, 53, 0.3);
    border-radius: 8px;
    padding: 12px;
    margin: 12px 0;
    font-size: 13px;
    color: rgba(255, 180, 180, 0.95);
`;

// 기기 데이터 삭제 모달 컴포넌트
const DeviceDataDeleteModal = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <GuideModalOverlay onClick={onCancel}>
            <GuideModalContainer onClick={e => e.stopPropagation()}>
                <GuideTitle>
                    🗑️ 기기 데이터 삭제
                </GuideTitle>
                <GuideContent>
                    이 기능은 <strong>현재 기기에 저장된 셰어노트 관련 데이터를 모두</strong> 삭제합니다.
                </GuideContent>
                <DeleteWarningList>
                    <li>로컬에 저장된 메모, 일정, 설정 등 캐시 데이터</li>
                    <li>앱 설정 및 환경설정</li>
                    <li>로그인 정보 (로그아웃 처리됨)</li>
                </DeleteWarningList>
                <GuideHighlight>
                    😌 <strong>안심하세요:</strong> 서버에 저장된 데이터는 삭제되지 않습니다.
                    다시 로그인하면 데이터를 불러올 수 있습니다.
                </GuideHighlight>
                <GuideContent style={{ marginTop: '8px', fontSize: '13px' }}>
                    기기 양도, 캐시 문제 해결, 앱 완전 초기화가 필요할 때 사용하세요.
                </GuideContent>
                <GuideButtonRow>
                    <GuideButton className="cancel" onClick={onCancel}>
                        취소
                    </GuideButton>
                    <GuideButton className="danger" onClick={onConfirm}>
                        삭제하기
                    </GuideButton>
                </GuideButtonRow>
            </GuideModalContainer>
        </GuideModalOverlay>
    );
};

// 백업/복원 안내 모달 컴포넌트
const BackupGuideModal = ({ isOpen, actionType, onContinue, onCancel }) => {
    const [dontShowAgain, setDontShowAgain] = React.useState(false);

    if (!isOpen) return null;

    return (
        <GuideModalOverlay onClick={onCancel}>
            <GuideModalContainer onClick={e => e.stopPropagation()}>
                <GuideTitle>
                    {actionType === 'backup' ? '💾' : '📂'}
                    {actionType === 'backup' ? ' 휴대폰 백업' : ' 휴대폰 복원'}
                </GuideTitle>
                <GuideContent>
                    이 기능은 <strong>로그인하지 않고 사용하는 분들</strong>을 위한 기능입니다.
                </GuideContent>
                <GuideHighlight>
                    로그인한 사용자는 모든 데이터가 <strong>자동으로 서버에 저장</strong>되므로,
                    새 기기에서 로그인만 하면 데이터가 자동 복구됩니다.
                </GuideHighlight>
                <CheckboxRow>
                    <input
                        type="checkbox"
                        checked={dontShowAgain}
                        onChange={e => setDontShowAgain(e.target.checked)}
                    />
                    다음부터 이 안내 보지 않기
                </CheckboxRow>
                <GuideButtonRow>
                    <GuideButton className="cancel" onClick={onCancel}>
                        취소
                    </GuideButton>
                    <GuideButton className="continue" onClick={() => onContinue(dontShowAgain)}>
                        계속하기
                    </GuideButton>
                </GuideButtonRow>
            </GuideModalContainer>
        </GuideModalOverlay>
    );
};

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
    profile,
    userId,
    onProfileClick,
    onLogout,
    onLoginClick,
    onOpenMacro,
    onOpenTrash,
    showToast
}) => {
    const fileInputRef = useRef(null);
    const [imageError, setImageError] = useState(false); // ✅ 추가: 이미지 로드 오류 상태
    const [profileImageType, setProfileImageType] = useState('avatar');
    const [selectedAvatarId, setSelectedAvatarId] = useState(null);
    const [avatarBgColor, setAvatarBgColor] = useState('none');
    const [customPicture, setCustomPicture] = useState(null);
    // 협업 관련 상태
    const [backupGuideModal, setBackupGuideModal] = useState({ isOpen: false, action: null }); // 백업/복원 안내 모달
    const [deviceDeleteModal, setDeviceDeleteModal] = useState(false); // 기기 데이터 삭제 모달
    const [showUserGuide, setShowUserGuide] = useState(false); // 사용설명서 모달
    const [showInfoPage, setShowInfoPage] = useState(false); // 정보 페이지 모달

    // 관리자 관련 상태
    const [isAdmin, setIsAdmin] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [adminPermissions, setAdminPermissions] = useState([]);
    const [unreadInquiryCount, setUnreadInquiryCount] = useState(0);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [hasUnreadReplies, setHasUnreadReplies] = useState(false);

    const handleError = () => { // 에러 발생 시 상태 변경
        setImageError(true);
    };

    // 문의 상태 확인 함수 (일회성 조회)
    const checkInquiryStatus = React.useCallback(async (userId, adminStatus) => {
        try {
            if (adminStatus.isAdmin) {
                // 관리자: 답변대기 문의 수 조회 (일회성)
                const { getPendingInquiriesCount } = await import('../services/adminInquiryService');
                const count = await getPendingInquiriesCount();
                console.log('📬 [문의 상태] 답변대기 문의 개수:', count);
                setUnreadInquiryCount(count);
            } else {
                // 일반 사용자: 읽지 않은 답변 여부 조회 (일회성)
                const { getUserInquiries } = await import('../services/inquiryService');
                const inquiries = await getUserInquiries(userId);
                const hasUnread = inquiries.some(inquiry => inquiry.hasUnreadReplies);
                setHasUnreadReplies(hasUnread);
            }
        } catch (error) {
            console.error('문의 상태 확인 오류:', error);
        }
    }, []);

    // 관리자 상태 확인 (최초 마운트 시)
    React.useEffect(() => {
        console.log('🔍 [관리자 상태 확인] useEffect 실행됨, userId:', userId);

        if (!userId) {
            console.log('⚠️ [관리자 상태 확인] userId가 없어서 종료됨');
            return;
        }

        const checkAdmin = async () => {
            try {
                const { checkAdminStatus } = await import('../services/adminManagementService');

                const status = await checkAdminStatus(userId);

                setIsAdmin(status.isAdmin);
                setIsSuperAdmin(status.isSuperAdmin);
                setAdminPermissions(status.permissions);

                // 최초 마운트 시 문의 상태 체크
                await checkInquiryStatus(userId, status);
            } catch (error) {
                console.error('❌ [관리자 상태 확인] 오류 발생:', error);
            }
        };

        checkAdmin();
    }, [userId, checkInquiryStatus]);

    // 사이드메뉴가 열릴 때마다 문의 상태 체크
    React.useEffect(() => {
        if (!isOpen || !userId) return;

        const checkOnOpen = async () => {
            try {
                const { checkAdminStatus } = await import('../services/adminManagementService');
                const adminStatus = await checkAdminStatus(userId);
                await checkInquiryStatus(userId, adminStatus);
            } catch (error) {
                console.error('사이드메뉴 열기 시 문의 상태 확인 오류:', error);
            }
        };

        checkOnOpen();
    }, [isOpen, userId, checkInquiryStatus]);

    // Firestore 실시간 리스너: 프로필 설정 변경 감지
    React.useEffect(() => {
        const userId = localStorage.getItem('firebaseUserId');
        if (!userId) return;

        let unsubscribe;

        const setupListener = async () => {
            try {
                const { doc, getDoc, onSnapshot } = await import('firebase/firestore');
                const { db } = await import('../firebase/config');
                const { getProfileImageUrl } = await import('../utils/storageService');

                const settingsRef = doc(db, 'users', userId, 'settings', 'profile');

                // 🆕 먼저 현재 데이터를 즉시 가져오기 (깜빡임 방지)
                const initialSnap = await getDoc(settingsRef);
                if (initialSnap.exists()) {
                    const settings = initialSnap.data();
                    const imageType = settings.profileImageType || 'avatar';

                    setProfileImageType(imageType);

                    if (imageType === 'photo') {
                        const version = settings.profileImageVersion || null;
                        const imageUrl = getProfileImageUrl(userId, version);
                        setCustomPicture(imageUrl);
                    } else {
                        setCustomPicture(null);
                    }

                    if (settings.selectedAvatarId) {
                        setSelectedAvatarId(settings.selectedAvatarId);
                    }
                    if (settings.avatarBgColor) {
                        setAvatarBgColor(settings.avatarBgColor);
                    }

                    console.log('✅ SideMenu: 초기 프로필 설정 로드 완료');
                }

                // Firestore 실시간 리스너 (변경 감지용)
                unsubscribe = onSnapshot(settingsRef, (docSnap) => {
                    setImageError(false);

                    if (docSnap.exists()) {
                        const settings = docSnap.data();
                        const imageType = settings.profileImageType || 'avatar';

                        setProfileImageType(imageType);

                        // 'photo' 모드면 버전 기반 URL 사용
                        if (imageType === 'photo') {
                            const version = settings.profileImageVersion || null;
                            const imageUrl = getProfileImageUrl(userId, version);
                            setCustomPicture(imageUrl);
                        } else {
                            setCustomPicture(null);
                        }

                        if (settings.selectedAvatarId) {
                            setSelectedAvatarId(settings.selectedAvatarId);
                        } else {
                            setSelectedAvatarId(null);
                        }

                        if (settings.avatarBgColor) {
                            setAvatarBgColor(settings.avatarBgColor);
                        } else {
                            setAvatarBgColor('none');
                        }

                        console.log('✅ SideMenu: Firestore 프로필 설정 실시간 업데이트', {
                            imageType,
                            version: settings.profileImageVersion,
                            avatarId: settings.selectedAvatarId,
                            bgColor: settings.avatarBgColor
                        });
                    } else {
                        // Firestore에 데이터가 없으면 기본값
                        setProfileImageType('avatar');
                        setCustomPicture(null);
                        setSelectedAvatarId(null);
                        setAvatarBgColor('none');
                    }
                }, (error) => {
                    console.error('❌ Firestore 리스너 오류:', error);
                });
            } catch (error) {
                console.error('프로필 설정 리스너 설정 오류:', error);
            }
        };

        setupListener();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
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
            const newType = e.detail;
            setProfileImageType(newType);

            // 'avatar' 모드로 변경되면 사진 초기화
            if (newType === 'avatar') {
                setCustomPicture(null);
            }
        };
        window.addEventListener('profileImageTypeChanged', handleProfileImageTypeChange);
        return () => window.removeEventListener('profileImageTypeChanged', handleProfileImageTypeChange);
    }, []);

    // 커스텀 프로필 사진 변경 이벤트 리스너
    React.useEffect(() => {
        const handleProfilePictureChange = async (e) => {
            const userId = localStorage.getItem('firebaseUserId');
            if (!userId) return;

            // 'photo' 모드면 고정된 URL 사용
            const { getProfileImageUrl } = await import('../utils/storageService');
            const imageUrl = getProfileImageUrl(userId);
            setCustomPicture(imageUrl);
            setProfileImageType('photo');
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

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // 백업/복원 안내 모달 "다시 보지 않기" 확인
    const shouldShowBackupGuide = () => {
        return localStorage.getItem('hideBackupGuide') !== 'true';
    };

    // 백업 클릭 핸들러
    const handleBackupClick = () => {
        if (shouldShowBackupGuide()) {
            setBackupGuideModal({ isOpen: true, action: 'backup' });
        } else {
            onExport?.();
        }
    };

    // 복원 클릭 핸들러
    const handleRestoreClick = () => {
        if (shouldShowBackupGuide()) {
            setBackupGuideModal({ isOpen: true, action: 'restore' });
        } else {
            fileInputRef.current?.click();
        }
    };

    // 안내 모달에서 계속하기
    const handleBackupGuideContinue = (dontShowAgain) => {
        if (dontShowAgain) {
            localStorage.setItem('hideBackupGuide', 'true');
        }

        const action = backupGuideModal.action;
        setBackupGuideModal({ isOpen: false, action: null });

        if (action === 'backup') {
            onExport?.();
        } else if (action === 'restore') {
            fileInputRef.current?.click();
        }
    };

    // 기기 데이터 삭제 실행 (로그아웃 포함)
    const handleDeviceDataDelete = async () => {
        try {
            // 1. Firebase Auth 로그아웃 먼저 실행 (인증 상태 정리)
            try {
                const { signOut } = await import('firebase/auth');
                const { auth } = await import('../firebase/config');
                if (auth.currentUser) {
                    await signOut(auth);
                    console.log('🔥 Firebase 로그아웃 완료');
                }
            } catch (authError) {
                console.warn('Firebase 로그아웃 오류 (무시):', authError);
            }

            // 2. 모든 localStorage 데이터 삭제
            const itemCount = localStorage.length;
            localStorage.clear();
            console.log(`✅ localStorage 삭제 완료: ${itemCount}개 항목`);

            // 3. sessionStorage도 정리
            sessionStorage.clear();
            console.log('✅ sessionStorage 삭제 완료');

            // 4. IndexedDB 정리 (Firebase 관련)
            try {
                const databases = await window.indexedDB.databases();
                for (const db of databases) {
                    if (db.name && (
                        db.name.includes('firebase') ||
                        db.name.includes('firebaseLocalStorage')
                    )) {
                        window.indexedDB.deleteDatabase(db.name);
                        console.log(`🗑️ IndexedDB 삭제: ${db.name}`);
                    }
                }
            } catch (idbError) {
                console.warn('IndexedDB 정리 실패 (무시):', idbError);
            }

            setDeviceDeleteModal(false);
            onClose();

            // 5. 페이지 새로고침하여 완전히 초기화된 상태로 시작
            window.location.reload();
        } catch (error) {
            console.error('❌ 기기 데이터 삭제 실패:', error);
            showToast?.('데이터 삭제 중 오류가 발생했습니다.');
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
                                        {profile ? (profile.email || '') : '로그인이 필요합니다'}
                                    </ProfileEmail>
                                </ProfileInfo>
                            </ProfileCluster>
                            <CloseButton onClick={onClose}>&times;</CloseButton>
                        </MenuHeader>

                        <MenuItemsWrapper>
                            {/* 🔐 관리자 메뉴 (관리자만 표시) */}
                            {isAdmin && (
                                <MenuGroup>
                                    <MenuItem
                                        className="admin-menu"
                                        onClick={() => {
                                            setShowAdminPanel(true);
                                            onClose();
                                        }}
                                    >
                                        <span className="icon">👨‍💼</span>
                                        {isSuperAdmin ? '최고 관리자' : '부관리자'}
                                        {unreadInquiryCount > 0 && <NotificationDot />}
                                    </MenuItem>
                                </MenuGroup>
                            )}

                            {/* 🔧 그룹 1: 도구 */}
                            <MenuGroup>
                                <MenuItem onClick={() => {
                                    onClose();
                                    if (onOpenMacro) onOpenMacro();
                                }}>
                                    <span className="icon">⚙️</span> 매크로
                                </MenuItem>
                            </MenuGroup>

                            {/* 📱 그룹 2: 백업/복원 */}
                            <MenuGroup>
                                <MenuItem onClick={handleBackupClick}>
                                    <span className="icon">💾</span> 휴대폰 백업
                                </MenuItem>
                                <MenuItem onClick={handleRestoreClick}>
                                    <span className="icon">📂</span> 휴대폰 복원
                                    <FileInput
                                        type="file"
                                        accept=".json"
                                        onChange={onImport}
                                        ref={fileInputRef}
                                    />
                                </MenuItem>
                            </MenuGroup>

                            {/* 🧹 그룹 3: 기기 데이터 */}
                            <MenuGroup>
                                <MenuItem onClick={() => setDeviceDeleteModal(true)}>
                                    <span className="icon">🧹</span> 기기 데이터 삭제
                                </MenuItem>
                            </MenuGroup>

                            {/* 📚 그룹 4: 도움말/관리 */}
                            <MenuGroup>
                                <MenuItem onClick={() => {
                                    onClose();
                                    if (onOpenTrash) onOpenTrash();
                                }}>
                                    <span className="icon">🗑️</span> 휴지통
                                </MenuItem>
                                <MenuItem onClick={() => {
                                    setShowUserGuide(true);
                                    onClose();
                                }}>
                                    <span className="icon">📖</span> 사용설명서
                                </MenuItem>
                                <MenuItem onClick={() => {
                                    setShowInfoPage(true);
                                    onClose();
                                }}>
                                    <span className="icon">ℹ️</span> 정보
                                    {!isAdmin && hasUnreadReplies && <NotificationDot />}
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

            {/* 휴대폰 백업/복원 안내 모달 */}
            {backupGuideModal.isOpen && (
                <BackupGuideModal
                    isOpen={true}
                    actionType={backupGuideModal.action}
                    onContinue={handleBackupGuideContinue}
                    onCancel={() => setBackupGuideModal({ isOpen: false, action: null })}
                />
            )}

            {/* 기기 데이터 삭제 모달 */}
            {deviceDeleteModal && (
                <DeviceDataDeleteModal
                    isOpen={true}
                    onConfirm={handleDeviceDataDelete}
                    onCancel={() => setDeviceDeleteModal(false)}
                />
            )}

            {/* 사용설명서 모달 */}
            <UserGuide
                isOpen={showUserGuide}
                onClose={() => setShowUserGuide(false)}
            />

            {/* 정보 페이지 모달 */}
            <InfoPage
                isOpen={showInfoPage}
                onClose={() => setShowInfoPage(false)}
                userId={userId}
                showToast={showToast}
            />

            {/* 관리자 패널 */}
            {isAdmin && (
                <AdminPanel
                    isOpen={showAdminPanel}
                    onClose={() => setShowAdminPanel(false)}
                    userId={userId}
                    isSuperAdmin={isSuperAdmin}
                    unreadInquiryCount={unreadInquiryCount}
                />
            )}
        </>
    );
};

export default SideMenu;