// src/components/ProfilePage.jsx

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { getUserProfile } from '../utils/fortuneLogic';
import { getTodayFortune } from '../utils/fortuneLogic';
import FortuneInputModal from './FortuneInputModal';
import FortuneFlow from './FortuneFlow';
import { syncProfilePictureToGoogleDrive, loadProfilePictureFromGoogleDrive } from '../utils/googleDriveSync';
import AvatarSelector from './AvatarSelector';
import { avatarList } from './avatars/AvatarIcons';
import ChangeUniqueIdModal from './collaboration/ChangeUniqueIdModal';
import QRScanner from './collaboration/QRScanner';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import QRCode from 'qrcode';
import { Copy, QrCode, Share2, Scan } from 'lucide-react';

// 🎨 Styled Components

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    padding: 0;

    @media (max-width: 768px) {
        padding: 0;
    }
`;

const ModalContainer = styled.div`
    background: linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%);
    width: 100%;
    height: 100%;
    max-width: 450px;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;

    @media (min-width: 768px) {
        max-width: 480px;
        height: 90vh;
        max-height: 900px;
        border-radius: 24px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }

    @media (min-width: 1024px) {
        max-width: 530px;
    }
`;

const Header = styled.div`
    padding: 24px 24px 16px;
    background:
        linear-gradient(135deg, rgba(240, 147, 251, 0.2) 0%, rgba(245, 87, 108, 0.2) 100%),
        linear-gradient(180deg, #2a2d35 0%, #1f2229 100%);
    color: white;
    position: relative;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(240, 147, 251, 0.2);
`;

const HeaderTitle = styled.h1`
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    text-align: center;
    letter-spacing: -0.5px;

    @media (min-width: 768px) {
        font-size: 28px;
    }
`;

const CloseButton = styled.button`
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    font-size: 24px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.3);
    }
`;

const ScrollContent = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px 40px;
    background: linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%);

    /* 커스텀 스크롤바 */
    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(240, 147, 251, 0.3);
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: rgba(240, 147, 251, 0.5);
    }
`;

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const Section = styled.div`
    background:
        linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%),
        linear-gradient(180deg, #2a2d35 0%, #25282f 100%);
    border-radius: 16px;
    padding: 24px;
    box-shadow:
        0 4px 16px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    overflow: hidden;

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
                rgba(0, 0, 0, 0.02) 2px,
                rgba(0, 0, 0, 0.02) 4px
            );
        pointer-events: none;
    }
`;

const ProfileHeader = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    z-index: 1;
`;

const ProfileImageWrapper = styled.div`
    position: relative;
    cursor: pointer;

    &:hover .edit-overlay {
        opacity: 1;
    }
`;

const ProfileImage = styled.img`
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid rgba(240, 147, 251, 0.5);
    box-shadow: 0 4px 16px rgba(240, 147, 251, 0.3);
`;

const AvatarIconWrapper = styled.div`
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: 3px solid rgba(240, 147, 251, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${props => props.$bgColor || 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)'};
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(240, 147, 251, 0.3);

    svg {
        width: 100%;
        height: 100%;
    }
`;

const DefaultProfileIcon = styled.div`
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(240, 147, 251, 0.3) 0%, rgba(245, 87, 108, 0.3) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    color: white;
    font-weight: 600;
    border: 3px solid rgba(240, 147, 251, 0.5);
    box-shadow: 0 4px 16px rgba(240, 147, 251, 0.3);
`;

const EditOverlay = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
    color: white;
    font-size: 14px;
    font-weight: 600;
`;

const ProfileImageTypeSelector = styled.div`
    display: flex;
    gap: 8px;
    margin-top: 8px;
`;

const ImageTypeButton = styled.button`
    padding: 8px 16px;
    border: 2px solid ${props => props.$selected ? 'rgba(240, 147, 251, 0.8)' : 'rgba(255, 255, 255, 0.2)'};
    background: ${props => props.$selected
        ? 'linear-gradient(135deg, rgba(240, 147, 251, 0.2), rgba(245, 87, 108, 0.2))'
        : 'rgba(255, 255, 255, 0.05)'
    };
    color: ${props => props.$selected ? '#f093fb' : '#b0b0b0'};
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: ${props => props.$selected ? '0 2px 8px rgba(240, 147, 251, 0.2)' : 'none'};

    &:hover {
        border-color: rgba(240, 147, 251, 0.8);
        background: linear-gradient(135deg, rgba(240, 147, 251, 0.15), rgba(245, 87, 108, 0.15));
        color: #f093fb;
    }
`;

const NicknameContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const Nickname = styled.h2`
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: #ffffff;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const EditButton = styled.button`
    background: rgba(240, 147, 251, 0.1);
    border: 1px solid rgba(240, 147, 251, 0.3);
    color: #f093fb;
    cursor: pointer;
    font-size: 14px;
    padding: 4px 8px;
    text-decoration: none;
    border-radius: 6px;
    transition: all 0.2s;

    &:hover {
        background: rgba(240, 147, 251, 0.2);
        border-color: rgba(240, 147, 251, 0.5);
        box-shadow: 0 2px 8px rgba(240, 147, 251, 0.2);
    }
`;

const Email = styled.p`
    margin: 0;
    font-size: 14px;
    color: #b0b0b0;
`;

const SectionTitle = styled.h3`
    margin: 0 0 16px 0;
    font-size: 18px;
    font-weight: 600;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;
    z-index: 1;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;

    @media (min-width: 480px) {
        grid-template-columns: repeat(4, 1fr);
    }
`;

const StatItem = styled.div`
    text-align: center;
    padding: 16px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    z-index: 1;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

const StatValue = styled.div`
    font-size: 24px;
    font-weight: 700;
    color: #f093fb;
    margin-bottom: 4px;
    text-shadow: 0 2px 4px rgba(240, 147, 251, 0.3);
`;

const StatLabel = styled.div`
    font-size: 12px;
    color: #b0b0b0;
`;

const FortuneSection = styled.div`
    cursor: pointer;
    user-select: none;
`;

const FortuneSectionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
`;

const CollapseIcon = styled.span`
    font-size: 20px;
    color: #b0b0b0;
    transition: transform 0.3s;
    transform: ${props => props.$isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const FortuneContent = styled.div`
    max-height: ${props => props.$isExpanded ? '500px' : '0'};
    overflow: hidden;
    transition: max-height 0.3s ease;
`;

// 협업 ID 전용 컨텐츠 (스크롤 가능)
const CollabContent = styled.div`
    max-height: ${props => props.$isExpanded ? '600px' : '0'};
    overflow: ${props => props.$isExpanded ? 'auto' : 'hidden'};
    transition: max-height 0.3s ease;

    /* 커스텀 스크롤바 */
    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(94, 190, 38, 0.3);
        border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: rgba(94, 190, 38, 0.5);
    }
`;

const FortuneInfo = styled.div`
    padding: 16px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
    border-radius: 12px;
    margin-bottom: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    z-index: 1;
`;

const InfoRow = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    &:last-child {
        border-bottom: none;
    }
`;

const InfoLabel = styled.span`
    font-size: 14px;
    color: #b0b0b0;
`;

const InfoValue = styled.span`
    font-size: 14px;
    color: #ffffff;
    font-weight: 600;
`;

const MaskedInfoValue = styled.span`
    font-size: 14px;
    color: #ffffff;
    font-weight: 600;
    cursor: pointer;
    user-select: none;
    position: relative;
    padding: 4px 8px;
    border-radius: 6px;
    transition: all 0.2s;
    background: rgba(240, 147, 251, 0.1);
    border: 1px solid rgba(240, 147, 251, 0.2);

    &:hover {
        background: rgba(240, 147, 251, 0.15);
        border-color: rgba(240, 147, 251, 0.3);
        box-shadow: 0 2px 8px rgba(240, 147, 251, 0.2);
    }

    &:active {
        transform: scale(0.98);
    }
`;

const FortuneStatusBadge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 12px;

    ${props => props.$checked ? `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    ` : `
        background: #fef5e7;
        color: #f39c12;
    `}
`;

const ActionButton = styled.button`
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    z-index: 1;

    ${props => props.$primary ? `
        background: linear-gradient(135deg, rgba(240, 147, 251, 0.3), rgba(245, 87, 108, 0.3));
        color: white;
        border: 1px solid rgba(240, 147, 251, 0.5);
        box-shadow: 0 2px 8px rgba(240, 147, 251, 0.2);
        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(240, 147, 251, 0.4);
            background: linear-gradient(135deg, rgba(240, 147, 251, 0.4), rgba(245, 87, 108, 0.4));
        }
    ` : `
        background: rgba(255, 255, 255, 0.05);
        color: #d0d0d0;
        border: 1px solid rgba(255, 255, 255, 0.1);
        &:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.2);
        }
    `}
`;

const ProfilePictureSyncSection = styled.div`
    display: flex;
    gap: 18px;
    margin-top: 2px;
`;

const SyncButton = styled.button`
    flex: 1;
    padding: 12px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    background: rgba(255, 255, 255, 0.05);
    color: #d0d0d0;
    white-space: nowrap;
    position: relative;
    z-index: 1;

    &:hover {
        background: rgba(240, 147, 251, 0.1);
        border-color: rgba(240, 147, 251, 0.3);
        color: #f093fb;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(240, 147, 251, 0.2);
    }

    &:active {
        transform: translateY(0);
    }
`;

const BirthdayReminderSection = styled.div`
    padding: 16px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
    border-radius: 12px;
    margin-top: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    z-index: 1;
`;

const ReminderOption = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
`;

const ReminderLabel = styled.span`
    font-size: 14px;
    color: #d0d0d0;
`;

const ToggleSwitch = styled.label`
    position: relative;
    display: inline-block;
    width: 50px;
    height: 26px;
`;

const ToggleInput = styled.input`
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + span {
        background: linear-gradient(135deg, rgba(240, 147, 251, 0.5), rgba(245, 87, 108, 0.5));
        border-color: rgba(240, 147, 251, 0.8);
    }

    &:checked + span:before {
        transform: translateX(24px);
    }
`;

const ToggleSlider = styled.span`
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.1);
    transition: 0.3s;
    border-radius: 26px;
    border: 1px solid rgba(255, 255, 255, 0.2);

    &:before {
        position: absolute;
        content: "";
        height: 20px;
        width: 20px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: 0.3s;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
`;

const CalendarTypeSelector = styled.div`
    display: flex;
    gap: 8px;
    margin-top: 8px;
`;

const CalendarTypeButton = styled.button`
    flex: 1;
    padding: 8px;
    border: 2px solid ${props => props.$selected ? 'rgba(240, 147, 251, 0.8)' : 'rgba(255, 255, 255, 0.2)'};
    background: ${props => props.$selected
        ? 'linear-gradient(135deg, rgba(240, 147, 251, 0.2), rgba(245, 87, 108, 0.2))'
        : 'rgba(255, 255, 255, 0.05)'
    };
    color: ${props => props.$selected ? '#f093fb' : '#b0b0b0'};
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        border-color: rgba(240, 147, 251, 0.8);
        background: linear-gradient(135deg, rgba(240, 147, 251, 0.15), rgba(245, 87, 108, 0.15));
        color: #f093fb;
    }
`;

const NicknameInput = styled.input`
    padding: 8px 12px;
    border: 2px solid rgba(240, 147, 251, 0.3);
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    text-align: center;
    width: 200px;
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;

    &:focus {
        outline: none;
        border-color: rgba(240, 147, 251, 0.8);
        box-shadow: 0 0 0 3px rgba(240, 147, 251, 0.1);
    }

    &::placeholder {
        color: #808080;
    }
`;

// 협업 ID 스타일
const IdDisplayBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: rgba(94, 190, 38, 0.1);
    border: 1px solid rgba(94, 190, 38, 0.3);
    border-radius: 12px;
    margin-bottom: 12px;
`;

const IdText = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    color: #5ebe26;
    font-size: 16px;
    font-weight: 600;
`;

const IdPrefix = styled.span`
    color: rgba(94, 190, 38, 0.7);
    font-size: 18px;
    font-weight: 700;
`;

const IconButton = styled.button`
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border-color: rgba(255, 255, 255, 0.3);
    }
`;

const QRCodeContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 20px;
    background: white;
    border-radius: 12px;
    margin-bottom: 12px;
`;

const QRCodeImage = styled.img`
    width: 200px;
    height: 200px;
    border-radius: 8px;
`;

const QRActions = styled.div`
    display: flex;
    gap: 8px;
    width: 100%;
`;

const QRButton = styled.button`
    flex: 1;
    padding: 12px;
    background: rgba(94, 190, 38, 0.1);
    border: 1px solid rgba(94, 190, 38, 0.3);
    border-radius: 10px;
    color: #5ebe26;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    &:hover {
        background: rgba(94, 190, 38, 0.2);
        border-color: rgba(94, 190, 38, 0.5);
    }
`;

const ChangeIdButton = styled.button`
    width: 100%;
    padding: 14px;
    background: rgba(240, 147, 251, 0.1);
    border: 1px solid rgba(240, 147, 251, 0.3);
    border-radius: 12px;
    color: #f093fb;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: rgba(240, 147, 251, 0.2);
        border-color: rgba(240, 147, 251, 0.5);
        box-shadow: 0 2px 8px rgba(240, 147, 251, 0.2);
    }
`;

// 🎯 Main Component

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

const ProfilePage = ({ profile, memos, calendarSchedules, showToast, onClose }) => {
    const [isFortuneExpanded, setIsFortuneExpanded] = useState(false);
    const [isEditingNickname, setIsEditingNickname] = useState(false);
    const [nickname, setNickname] = useState(profile?.nickname || '');
    const [isBirthdayReminderEnabled, setIsBirthdayReminderEnabled] = useState(false);
    const [birthdayCalendarType, setBirthdayCalendarType] = useState('solar'); // 'solar' | 'lunar'
    const [isFortuneInputModalOpen, setIsFortuneInputModalOpen] = useState(false);
    const [isFortuneFlowOpen, setIsFortuneFlowOpen] = useState(false);
    const [imageError, setImageError] = useState(false);

    // 아바타 관련 상태
    const [profileImageType, setProfileImageType] = useState(localStorage.getItem('profileImageType') || 'avatar'); // 'avatar' | 'photo'
    const [selectedAvatarId, setSelectedAvatarId] = useState(localStorage.getItem('selectedAvatarId') || null);
    const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
    const [avatarBgColor, setAvatarBgColor] = useState(localStorage.getItem('avatarBgColor') || 'none');

    // 생년월일 마스킹 관련 상태
    const [isBirthDateRevealed, setIsBirthDateRevealed] = useState(false);
    const birthDateTimerRef = useRef(null);

    // 협업 ID 관련 상태
    const [uniqueId, setUniqueId] = useState(null);
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [isChangeIdModalOpen, setIsChangeIdModalOpen] = useState(false);
    const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
    const [isCollabExpanded, setIsCollabExpanded] = useState(false);

    // 운세 프로필 정보
    const fortuneProfile = getUserProfile();

    // 오늘의 운세 확인 여부
    const todayFortune = getTodayFortune();
    const hasCheckedTodayFortune = !!todayFortune;

    // 사용자 이름 결정
    const userName = nickname || profile?.name || profile?.email?.split('@')[0] || '게스트';

    // 프로필 이미지 첫 글자
    const profileInitial = userName.charAt(0).toUpperCase();

    // 통계 계산
    const totalMemos = memos?.length || 0;
    const totalSchedules = Object.keys(calendarSchedules || {}).length;
    const importantMemos = memos?.filter(m => m.isImportant).length || 0;

    // 닉네임 저장
    const handleSaveNickname = () => {
        if (nickname.trim()) {
            const savedNickname = localStorage.getItem('userNickname');
            const newNickname = nickname.trim();

            localStorage.setItem('userNickname', newNickname);

            // 닉네임이 실제로 변경된 경우에만 토스트 메시지 표시
            if (savedNickname !== newNickname) {
                showToast?.('닉네임이 변경되었습니다');
                // profile 상태 업데이트를 위해 이벤트 발생
                window.dispatchEvent(new CustomEvent('nicknameChanged', { detail: newNickname }));
            }
        }
        setIsEditingNickname(false);
    };

    // 프로필 이미지 에러 처리
    const handleImageError = () => {
        console.log('⚠️ 프로필 이미지 로드 실패 - Placeholder 표시');
        setImageError(true);
    };

    // 프로필 사진 업로드 input ref
    const fileInputRef = useRef(null);

    // 이미지 타입 변경 핸들러
    const handleImageTypeChange = (type) => {
        setProfileImageType(type);
        localStorage.setItem('profileImageType', type);

        if (type === 'avatar' && !selectedAvatarId) {
            // 아바타를 선택했는데 아직 선택된 아바타가 없으면 모달 열기
            setIsAvatarSelectorOpen(true);
        }
    };

    // 아바타 선택 핸들러
    const handleAvatarSelect = (avatarId) => {
        setSelectedAvatarId(avatarId);
        localStorage.setItem('selectedAvatarId', avatarId);
        showToast?.('아바타가 변경되었습니다');
    };

    // 아바타 아이콘 렌더링
    const renderAvatarIcon = () => {
        if (!selectedAvatarId) return null;
        const avatar = avatarList.find(a => a.id === selectedAvatarId);
        if (!avatar) return null;
        const AvatarComponent = avatar.component;
        return <AvatarComponent />;
    };

    // 생년월일 탭 핸들러 (3초간 표시)
    const handleBirthDateTap = () => {
        if (birthDateTimerRef.current) {
            clearTimeout(birthDateTimerRef.current);
        }

        setIsBirthDateRevealed(true);

        birthDateTimerRef.current = setTimeout(() => {
            setIsBirthDateRevealed(false);
        }, 3000);
    };

    // 컴포넌트 언마운트 시 타이머 정리
    useEffect(() => {
        return () => {
            if (birthDateTimerRef.current) {
                clearTimeout(birthDateTimerRef.current);
            }
        };
    }, []);

    // 배경색 변경 이벤트 리스너
    useEffect(() => {
        const handleBgColorChange = (e) => {
            setAvatarBgColor(e.detail);
        };
        window.addEventListener('avatarBgColorChanged', handleBgColorChange);
        return () => window.removeEventListener('avatarBgColorChanged', handleBgColorChange);
    }, []);

    // 고유 ID 로드
    useEffect(() => {
        const loadUniqueId = async () => {
            // localStorage에서 userId 가져오기
            const userId = localStorage.getItem('firebaseUserId');
            if (!userId || !profile) return;

            try {
                const userRef = doc(db, 'users', userId);
                const userDoc = await getDoc(userRef);
                if (userDoc.exists()) {
                    const id = userDoc.data().uniqueId;
                    setUniqueId(id);

                    // QR 코드 생성
                    if (id) {
                        const qrUrl = await QRCode.toDataURL(id, {
                            width: 200,
                            margin: 2,
                            color: {
                                dark: '#000000',
                                light: '#FFFFFF'
                            }
                        });
                        setQrCodeUrl(qrUrl);
                    }
                }
            } catch (err) {
                console.error('고유 ID 로드 오류:', err);
            }
        };

        if (profile) {
            loadUniqueId();
        }
    }, [profile]);

    // 생년월일 마스킹 함수
    const maskBirthDate = (year, month, day) => {
        if (isBirthDateRevealed) {
            return `${year}년 ${month}월 ${day}일`;
        }

        // 연도의 앞 2자리만 표시, 나머지는 *로 마스킹
        const yearStr = String(year);
        const maskedYear = yearStr.substring(0, 2) + '**';

        return `${maskedYear}년 **월 **일`;
    };

    // 이미지를 압축하고 Base64로 변환
    const compressAndConvertImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 400;
                    const MAX_HEIGHT = 400;
                    let width = img.width;
                    let height = img.height;

                    // 비율 유지하면서 리사이즈
                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // JPEG 품질 0.7로 압축
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(compressedBase64);
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    };

    // 해시 계산 함수
    const calculateHash = async (base64String) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(base64String);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    };

    // 프로필 사진 변경
    const handleProfileImageClick = () => {
        if (profileImageType === 'avatar') {
            // 아바타 모드일 때는 아바타 선택 모달 열기
            setIsAvatarSelectorOpen(true);
        } else {
            // 사진 모드일 때는 파일 선택
            fileInputRef.current?.click();
        }
    };

    // 파일 선택 시 처리
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 이미지 파일인지 확인
        if (!file.type.startsWith('image/')) {
            showToast?.('이미지 파일만 업로드할 수 있습니다');
            return;
        }

        // 파일 크기 체크 (10MB 제한)
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_FILE_SIZE) {
            showToast?.('이미지 크기는 10MB 이하여야 합니다');
            e.target.value = '';
            return;
        }

        try {
            showToast?.('이미지 처리 중...');

            // 이미지 압축 및 Base64 변환
            const compressedBase64 = await compressAndConvertImage(file);

            // Base64 크기 체크 (2MB 제한 - localStorage 여유 공간 확보)
            const sizeInBytes = compressedBase64.length * 0.75; // Base64는 원본의 약 1.33배
            const sizeInMB = sizeInBytes / (1024 * 1024);

            if (sizeInMB > 2) {
                showToast?.('압축 후에도 이미지가 너무 큽니다. 더 작은 이미지를 선택해주세요');
                e.target.value = '';
                return;
            }

            // 해시 계산
            const hash = await calculateHash(compressedBase64);

            try {
                // localStorage에 저장 시도
                localStorage.setItem('customProfilePicture', compressedBase64);
                localStorage.setItem('customProfilePictureHash', hash);
            } catch (storageError) {
                if (storageError.name === 'QuotaExceededError') {
                    showToast?.('저장 공간이 부족합니다. 더 작은 이미지를 선택해주세요');
                } else {
                    showToast?.('이미지 저장에 실패했습니다');
                }
                console.error('localStorage 저장 오류:', storageError);
                e.target.value = '';
                return;
            }

            // 프로필 상태 업데이트 이벤트 발생
            window.dispatchEvent(new CustomEvent('profilePictureChanged', {
                detail: { picture: compressedBase64, hash }
            }));

            showToast?.('프로필 사진이 변경되었습니다 📸');

            // 이미지 에러 상태 초기화
            setImageError(false);
        } catch (error) {
            console.error('이미지 처리 오류:', error);

            // 메모리 부족 에러 감지
            if (error.message && error.message.includes('memory')) {
                showToast?.('이미지가 너무 커서 처리할 수 없습니다');
            } else {
                showToast?.('이미지 처리 중 오류가 발생했습니다');
            }
        }

        // input 초기화 (같은 파일을 다시 선택할 수 있도록)
        e.target.value = '';
    };

    // 운세 정보 수정
    const handleEditFortuneInfo = () => {
        setIsFortuneInputModalOpen(true);
    };

    // 오늘의 운세 보기 / 다시보기
    const handleViewFortune = () => {
        setIsFortuneFlowOpen(true);
    };

    // 생일 알림 활성화/비활성화
    const handleBirthdayReminderToggle = () => {
        setIsBirthdayReminderEnabled(!isBirthdayReminderEnabled);
        if (!isBirthdayReminderEnabled) {
            showToast?.('생일 알림이 활성화되었습니다 🎂');
        } else {
            showToast?.('생일 알림이 비활성화되었습니다');
        }
    };

    // 프로필 사진 Google Drive에 동기화
    const handleSyncProfilePicture = async () => {
        const customPicture = localStorage.getItem('customProfilePicture');
        const customPictureHash = localStorage.getItem('customProfilePictureHash');

        if (!customPicture || !customPictureHash) {
            showToast?.('⚠️ 동기화할 프로필 사진이 없습니다');
            return;
        }

        showToast?.('📸 프로필 사진 업로드 중...');

        try {
            const result = await syncProfilePictureToGoogleDrive(customPicture, customPictureHash);

            if (result.success) {
                showToast?.('✅ 프로필 사진이 Drive에 동기화되었습니다');
            } else if (result.error === 'TOKEN_EXPIRED') {
                showToast?.('🔐 로그인이 만료되었습니다. 다시 로그인해주세요');
            } else {
                showToast?.('❌ 동기화 실패');
            }
        } catch (error) {
            console.error('프로필 사진 동기화 오류:', error);
            showToast?.('❌ 동기화 중 오류가 발생했습니다');
        }
    };

    // 프로필 사진 Google Drive에서 복원
    const handleRestoreProfilePicture = async () => {
        showToast?.('📸 프로필 사진 다운로드 중...');

        try {
            const result = await loadProfilePictureFromGoogleDrive();

            if (result.success && result.data) {
                const { base64, hash } = result.data;

                // 로컬 해시와 비교
                const localHash = localStorage.getItem('customProfilePictureHash');

                if (localHash === hash) {
                    showToast?.('✅ 이미 최신 프로필 사진입니다');
                    return;
                }

                // Drive의 사진으로 로컬 업데이트
                localStorage.setItem('customProfilePicture', base64);
                localStorage.setItem('customProfilePictureHash', hash);

                // 프로필 업데이트 이벤트 발생
                window.dispatchEvent(new CustomEvent('profilePictureChanged', {
                    detail: { picture: base64, hash }
                }));

                showToast?.('✅ 프로필 사진이 복원되었습니다');
                setImageError(false);
            } else if (result.message === 'NO_FILE') {
                showToast?.('📭 Drive에 저장된 프로필 사진이 없습니다');
            } else if (result.error === 'TOKEN_EXPIRED') {
                showToast?.('🔐 로그인이 만료되었습니다. 다시 로그인해주세요');
            } else {
                showToast?.('❌ 복원 실패');
            }
        } catch (error) {
            console.error('프로필 사진 복원 오류:', error);
            showToast?.('❌ 복원 중 오류가 발생했습니다');
        }
    };

    // 고유 ID 복사
    const handleCopyId = () => {
        if (uniqueId) {
            navigator.clipboard.writeText(uniqueId);
            showToast?.('ID가 클립보드에 복사되었습니다');
        }
    };

    // 초대 링크 복사
    const handleCopyInviteLink = () => {
        if (!uniqueId) return;

        // 환경 변수에서 앱 URL 가져오기 (없으면 현재 origin 사용)
        const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
        const inviteLink = `${appUrl}/add/${uniqueId}`;

        navigator.clipboard.writeText(inviteLink);
        showToast?.('초대 링크가 복사되었습니다! 카톡에 붙여넣기 하세요');
    };

    // ID 변경 성공 핸들러
    const handleIdChangeSuccess = async (newId) => {
        setUniqueId(newId);

        // QR 코드 재생성
        const qrUrl = await QRCode.toDataURL(newId, {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        setQrCodeUrl(qrUrl);

        showToast?.('고유 ID가 변경되었습니다!');
    };

    return (
        <>
            <Overlay>
                <ModalContainer>
                    <Header>
                        <HeaderTitle>프로필</HeaderTitle>
                        <CloseButton onClick={onClose}>&times;</CloseButton>
                    </Header>

                    <ScrollContent>
                        <Container>
                {/* 프로필 헤더 */}
                <Section>
                    <ProfileHeader>
                        <ProfileImageWrapper onClick={handleProfileImageClick}>
                            {profileImageType === 'avatar' ? (
                                selectedAvatarId ? (
                                    <AvatarIconWrapper $bgColor={typeof BACKGROUND_COLORS[avatarBgColor] === 'function' ? BACKGROUND_COLORS[avatarBgColor]() : BACKGROUND_COLORS[avatarBgColor]}>
                                        {renderAvatarIcon()}
                                    </AvatarIconWrapper>
                                ) : (
                                    <DefaultProfileIcon>{profileInitial}</DefaultProfileIcon>
                                )
                            ) : (
                                (profile?.customPicture || profile?.picture) && !imageError ? (
                                    <ProfileImage
                                        src={profile.customPicture || profile.picture}
                                        alt="Profile"
                                        onError={handleImageError}
                                        crossOrigin={profile.customPicture ? undefined : "anonymous"}
                                    />
                                ) : (
                                    <DefaultProfileIcon>{profileInitial}</DefaultProfileIcon>
                                )
                            )}
                            <EditOverlay className="edit-overlay">변경</EditOverlay>
                        </ProfileImageWrapper>

                        {/* 이미지 타입 선택 버튼 */}
                        <ProfileImageTypeSelector>
                            <ImageTypeButton
                                $selected={profileImageType === 'avatar'}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleImageTypeChange('avatar');
                                }}
                            >
                                🎨 아바타
                            </ImageTypeButton>
                            <ImageTypeButton
                                $selected={profileImageType === 'photo'}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleImageTypeChange('photo');
                                }}
                            >
                                📸 사진
                            </ImageTypeButton>
                        </ProfileImageTypeSelector>

                        {/* 숨겨진 파일 input (카메라/앨범 선택) */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />

                        {/* 프로필 사진 동기화/복원 버튼 (사진 모드일 때만 표시) */}
                        {profileImageType === 'photo' && (
                            <ProfilePictureSyncSection>
                                <SyncButton onClick={handleSyncProfilePicture}>
                                    ☁️ 프사 저장
                                </SyncButton>
                                <SyncButton onClick={handleRestoreProfilePicture}>
                                    📥 프사 복원
                                </SyncButton>
                            </ProfilePictureSyncSection>
                        )}

                        <NicknameContainer>
                            {isEditingNickname ? (
                                <>
                                    <NicknameInput
                                        type="text"
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                        onBlur={handleSaveNickname}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSaveNickname()}
                                        autoFocus
                                    />
                                    <EditButton onClick={handleSaveNickname}>닉 저장</EditButton>
                                </>
                            ) : (
                                <>
                                    <Nickname>{userName}</Nickname>
                                    <EditButton onClick={() => setIsEditingNickname(true)}>닉 변경</EditButton>
                                </>
                            )}
                        </NicknameContainer>

                        <Email>{profile?.email || '게스트 모드'}</Email>
                    </ProfileHeader>
                </Section>

                {/* 나의 활동 */}
                <Section>
                    <SectionTitle>📊 나의 활동</SectionTitle>
                    <StatsGrid>
                        <StatItem>
                            <StatValue>{totalMemos}</StatValue>
                            <StatLabel>전체 메모</StatLabel>
                        </StatItem>
                        <StatItem>
                            <StatValue>{importantMemos}</StatValue>
                            <StatLabel>중요 메모</StatLabel>
                        </StatItem>
                        <StatItem>
                            <StatValue>{totalSchedules}</StatValue>
                            <StatLabel>스케줄</StatLabel>
                        </StatItem>
                        <StatItem>
                            <StatValue>{hasCheckedTodayFortune ? '✓' : '-'}</StatValue>
                            <StatLabel>오늘 운세</StatLabel>
                        </StatItem>
                    </StatsGrid>
                </Section>

                {/* 협업 ID 관리 (로그인 시에만 표시) */}
                {profile && (
                    <Section>
                        <FortuneSection onClick={() => setIsCollabExpanded(!isCollabExpanded)}>
                            <FortuneSectionHeader>
                                <SectionTitle style={{ margin: 0 }}>👥 협업 고유 ID</SectionTitle>
                                <CollapseIcon $isExpanded={isCollabExpanded}>▼</CollapseIcon>
                            </FortuneSectionHeader>
                        </FortuneSection>

                        <CollabContent $isExpanded={isCollabExpanded}>
                            <FortuneInfo>
                                <InfoRow>
                                    <InfoLabel>내 고유 ID</InfoLabel>
                                </InfoRow>
                                <IdDisplayBox>
                                    <IdText>
                                        <IdPrefix>@</IdPrefix>
                                        {uniqueId || '설정되지 않음'}
                                    </IdText>
                                    {uniqueId && (
                                        <IconButton onClick={handleCopyId} title="ID 복사">
                                            <Copy size={18} />
                                        </IconButton>
                                    )}
                                </IdDisplayBox>
                            </FortuneInfo>

                            {uniqueId && qrCodeUrl && (
                                <QRCodeContainer>
                                    <QRCodeImage src={qrCodeUrl} alt="QR Code" />
                                    <QRActions>
                                        <QRButton onClick={handleCopyInviteLink}>
                                            <Copy size={16} />
                                            초대 링크 복사
                                        </QRButton>
                                    </QRActions>
                                </QRCodeContainer>
                            )}

                            <ChangeIdButton
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsChangeIdModalOpen(true);
                                }}
                            >
                                고유 ID 변경하기
                            </ChangeIdButton>

                            <FortuneInfo style={{ marginTop: '12px' }}>
                                <InfoLabel style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
                                    💬 초대 링크를 카톡으로 보내거나, 대면 시 QR 코드를 상대방이 스캔하면 바로 친구 추가할 수 있습니다.
                                </InfoLabel>
                            </FortuneInfo>
                        </CollabContent>
                    </Section>
                )}

                {/* 운세 정보 관리 */}
                <Section>
                    <FortuneSection onClick={() => setIsFortuneExpanded(!isFortuneExpanded)}>
                        <FortuneSectionHeader>
                            <SectionTitle style={{ margin: 0 }}>🔮 운세 정보 관리</SectionTitle>
                            <CollapseIcon $isExpanded={isFortuneExpanded}>▼</CollapseIcon>
                        </FortuneSectionHeader>
                    </FortuneSection>

                    <FortuneContent $isExpanded={isFortuneExpanded}>
                        <FortuneStatusBadge $checked={hasCheckedTodayFortune}>
                            {hasCheckedTodayFortune ? '✓ 오늘의 운세 확인 완료' : '⚠️ 오늘의 운세 미확인'}
                        </FortuneStatusBadge>

                        {fortuneProfile && (
                            <FortuneInfo>
                                <InfoRow>
                                    <InfoLabel>생년월일</InfoLabel>
                                    <MaskedInfoValue
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleBirthDateTap();
                                        }}
                                        title="탭하면 3초간 표시됩니다"
                                    >
                                        {maskBirthDate(fortuneProfile.birthYear, fortuneProfile.birthMonth, fortuneProfile.birthDay)}
                                        {!isBirthDateRevealed && ' 👁️'}
                                    </MaskedInfoValue>
                                </InfoRow>
                                {fortuneProfile.birthHour !== undefined && (
                                    <InfoRow>
                                        <InfoLabel>출생 시간</InfoLabel>
                                        <InfoValue>
                                            {String(fortuneProfile.birthHour).padStart(2, '0')}:
                                            {String(fortuneProfile.birthMinute).padStart(2, '0')}
                                        </InfoValue>
                                    </InfoRow>
                                )}
                                {fortuneProfile.country && (
                                    <InfoRow>
                                        <InfoLabel>출생지</InfoLabel>
                                        <InfoValue>{fortuneProfile.country}, {fortuneProfile.city}</InfoValue>
                                    </InfoRow>
                                )}
                                <InfoRow>
                                    <InfoLabel>성별</InfoLabel>
                                    <InfoValue>{fortuneProfile.gender === 'male' || fortuneProfile.gender === '남성' ? '남성' : '여성'}</InfoValue>
                                </InfoRow>
                            </FortuneInfo>
                        )}

                        <ActionButton
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEditFortuneInfo();
                            }}
                            style={{ marginBottom: '12px' }}
                        >
                            운세 정보 수정
                        </ActionButton>

                        <ActionButton
                            $primary
                            onClick={(e) => {
                                e.stopPropagation();
                                handleViewFortune();
                            }}
                        >
                            {hasCheckedTodayFortune ? '오늘의 운세 다시보기' : '오늘의 운세 보기'}
                        </ActionButton>

                        {/* 생일 알림 설정 */}
                        {fortuneProfile && (
                            <BirthdayReminderSection>
                                <ReminderOption>
                                    <ReminderLabel>🎂 생일 자동 알림</ReminderLabel>
                                    <ToggleSwitch>
                                        <ToggleInput
                                            type="checkbox"
                                            checked={isBirthdayReminderEnabled}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                handleBirthdayReminderToggle();
                                            }}
                                        />
                                        <ToggleSlider />
                                    </ToggleSwitch>
                                </ReminderOption>

                                {isBirthdayReminderEnabled && (
                                    <CalendarTypeSelector onClick={(e) => e.stopPropagation()}>
                                        <CalendarTypeButton
                                            $selected={birthdayCalendarType === 'solar'}
                                            onClick={() => setBirthdayCalendarType('solar')}
                                        >
                                            양력
                                        </CalendarTypeButton>
                                        <CalendarTypeButton
                                            $selected={birthdayCalendarType === 'lunar'}
                                            onClick={() => setBirthdayCalendarType('lunar')}
                                        >
                                            음력
                                        </CalendarTypeButton>
                                    </CalendarTypeSelector>
                                )}
                            </BirthdayReminderSection>
                        )}
                    </FortuneContent>
                </Section>
                        </Container>
                    </ScrollContent>
                </ModalContainer>
            </Overlay>

            {/* 운세 정보 수정 모달 */}
            {isFortuneInputModalOpen && (
                <FortuneInputModal
                    onClose={() => setIsFortuneInputModalOpen(false)}
                    onSubmit={(userData) => {
                        // fortuneLogic에서 자동으로 저장됨
                        showToast?.('운세 정보가 저장되었습니다');
                        setIsFortuneInputModalOpen(false);
                    }}
                    initialData={fortuneProfile}
                    userName={userName}
                    isEditMode={true}
                />
            )}

            {/* 운세 플로우 */}
            {isFortuneFlowOpen && (
                <FortuneFlow
                    onClose={() => setIsFortuneFlowOpen(false)}
                    profile={profile}
                />
            )}

            {/* 아바타 선택 모달 */}
            {isAvatarSelectorOpen && (
                <AvatarSelector
                    isOpen={isAvatarSelectorOpen}
                    onClose={() => setIsAvatarSelectorOpen(false)}
                    onSelect={handleAvatarSelect}
                    currentAvatarId={selectedAvatarId}
                    birthYear={fortuneProfile?.birthYear}
                    birthMonth={fortuneProfile?.birthMonth}
                    birthDay={fortuneProfile?.birthDay}
                />
            )}

            {/* 고유 ID 변경 모달 */}
            {isChangeIdModalOpen && (
                <ChangeUniqueIdModal
                    isOpen={isChangeIdModalOpen}
                    onClose={() => setIsChangeIdModalOpen(false)}
                    currentId={uniqueId}
                    onSuccess={handleIdChangeSuccess}
                />
            )}

            {/* QR 스캐너 */}
            {isQRScannerOpen && (
                <QRScanner
                    isOpen={isQRScannerOpen}
                    onClose={() => setIsQRScannerOpen(false)}
                    onSuccess={() => {
                        showToast?.('친구 요청을 보냈습니다!');
                        setIsQRScannerOpen(false);
                    }}
                />
            )}
        </>
    );
};

export default ProfilePage;
