// src/components/ProfilePage.styles.js

import styled from 'styled-components';

export const Overlay = styled.div`
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

export const ModalContainer = styled.div`
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

export const Header = styled.div`
    padding: 24px 24px 16px;
    background:
        linear-gradient(135deg, rgba(240, 147, 251, 0.2) 0%, rgba(245, 87, 108, 0.2) 100%),
        linear-gradient(180deg, #2a2d35 0%, #1f2229 100%);
    color: white;
    position: relative;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(240, 147, 251, 0.2);
`;

export const HeaderTitle = styled.h1`
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    text-align: center;
    letter-spacing: -0.5px;

    @media (min-width: 768px) {
        font-size: 28px;
    }
`;

export const CloseButton = styled.button`
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

export const ScrollContent = styled.div`
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

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

export const Section = styled.div`
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

export const ProfileHeader = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    z-index: 1;
`;

export const ProfileImageWrapper = styled.div`
    position: relative;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    min-height: 100px;
`;

export const ProfileImage = styled.img`
    width: 100px;
    height: 96px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid rgba(240, 147, 251, 0.5);
    box-shadow: 0 4px 16px rgba(240, 147, 251, 0.3);
`;

export const AvatarIconWrapper = styled.div`
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

export const DefaultProfileIcon = styled.div`
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

export const ProfileImageClickable = styled.div`
    position: relative;
    cursor: pointer;
`;

export const EditOverlay = styled.div`
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-bottom: 8px;
    opacity: 1; /* 모바일에서 항상 표시 */
    color: white;
    font-size: 13px;
    font-weight: 400;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
`;

export const RemoveButton = styled.button`
    position: absolute;
    right: -60px;
    bottom: 0;
    background: rgba(255, 87, 87, 0.1);
    border: 1px solid rgba(255, 87, 87, 0.3);
    color: #ff5757;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    &:hover {
        background: rgba(255, 87, 87, 0.2);
        border-color: rgba(255, 87, 87, 0.5);
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(255, 87, 87, 0.2);
    }

    &:active {
        transform: translateY(0);
    }
`;

export const ProfileImageTypeSelector = styled.div`
    display: flex;
    gap: 8px;
    margin-top: 8px;
`;

export const ImageTypeButton = styled.button`
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

export const NicknameContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const Nickname = styled.h2`
    margin: 0;
    font-size: 20px;
    font-weight: 400;
    color: #ffffff;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const EditButton = styled.button`
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

export const Email = styled.p`
    margin: 0;
    font-size: 14px;
    color: #b0b0b0;
`;

export const InfoRowInHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    gap: 12px;
`;

export const InfoTextInHeader = styled.span`
    font-size: 14px;
    color: #e0e0e0;
    font-weight: 400;
    text-align: center;
`;

export const WsCodeQrContainer = styled.div`
    display: flex;
    width: 100%;
    gap: 12px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 12px;
    align-items: center;
`;

export const WsCodeSection = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
    justify-content: center;
`;

export const WsCodeText = styled.div`
    font-size: 14px;
    color: #e0e0e0;
    font-weight: 400;
    text-align: center;
`;

export const CopyButtonInHeader = styled.button`
    background: rgba(74, 144, 226, 0.1);
    border: 1px solid rgba(74, 144, 226, 0.3);
    color: #4a90e2;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: fit-content;

    &:hover {
        background: rgba(74, 144, 226, 0.2);
        border-color: rgba(74, 144, 226, 0.5);
        transform: translateY(-1px);
    }

    &:active {
        transform: translateY(0);
    }
`;

export const QrImageSection = styled.div`
    width: 70px;
    height: 70px;
    background: white;
    border-radius: 8px;
    padding: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
    margin-right: 15px;

    &:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
    }

    &:active {
        transform: scale(0.98);
    }
`;

export const QrImageSmall = styled.img`
    width: 100%;
    height: 100%;
    display: block;
    border-radius: 4px;
`;

export const QRModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20000;
    padding: 20px;
`;

export const QRModalContent = styled.div`
    background: linear-gradient(180deg, #2a2d35 0%, #1f2229 100%);
    border-radius: 20px;
    padding: 24px;
    max-width: 300px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`;

export const QRModalTitle = styled.h3`
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #ffffff;
    text-align: center;
`;

export const QRImageWrapper = styled.div`
    background: white;
    padding: 16px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
`;

export const QRImageLarge = styled.img`
    width: 200px;
    height: 200px;
    display: block;
    border-radius: 6px;
`;

export const QRModalButtons = styled.div`
    display: flex;
    gap: 12px;
    width: 100%;
`;

export const QRModalButton = styled.button`
    flex: 1;
    padding: 14px;
    background: ${props => props.$primary
        ? 'linear-gradient(135deg, rgba(94, 190, 38, 0.3), rgba(94, 190, 38, 0.2))'
        : 'rgba(255, 255, 255, 0.05)'};
    border: 1px solid ${props => props.$primary
        ? 'rgba(94, 190, 38, 0.5)'
        : 'rgba(255, 255, 255, 0.15)'};
    border-radius: 12px;
    color: ${props => props.$primary ? '#5ebe26' : '#b0b0b0'};
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    &:hover {
        background: ${props => props.$primary
            ? 'linear-gradient(135deg, rgba(94, 190, 38, 0.4), rgba(94, 190, 38, 0.3))'
            : 'rgba(255, 255, 255, 0.08)'};
        border-color: ${props => props.$primary
            ? 'rgba(94, 190, 38, 0.7)'
            : 'rgba(255, 255, 255, 0.25)'};
        transform: translateY(-1px);
        box-shadow: 0 4px 12px ${props => props.$primary
            ? 'rgba(94, 190, 38, 0.2)'
            : 'rgba(0, 0, 0, 0.2)'};
    }

    &:active {
        transform: translateY(0);
    }
`;

export const SectionTitle = styled.h3`
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

export const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;

    @media (min-width: 480px) {
        grid-template-columns: repeat(4, 1fr);
    }
`;

export const StatItem = styled.div`
    text-align: center;
    padding: 16px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    z-index: 1;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

export const StatValue = styled.div`
    font-size: 24px;
    font-weight: 700;
    color: #f093fb;
    margin-bottom: 4px;
    text-shadow: 0 2px 4px rgba(240, 147, 251, 0.3);
`;

export const StatLabel = styled.div`
    font-size: 12px;
    color: #b0b0b0;
`;

export const FortuneSection = styled.div`
    cursor: pointer;
    user-select: none;
`;

export const FortuneSectionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
`;

export const CollapseIcon = styled.span`
    font-size: 20px;
    color: #b0b0b0;
    transition: transform 0.3s;
    transform: ${props => props.$isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

export const FortuneContent = styled.div`
    max-height: ${props => props.$isExpanded ? '500px' : '0'};
    overflow: hidden;
    transition: max-height 0.3s ease;
`;

export const CollabContent = styled.div`
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

export const FortuneInfo = styled.div`
    padding: 16px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
    border-radius: 12px;
    margin-bottom: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    z-index: 1;
`;

export const InfoRow = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    &:last-child {
        border-bottom: none;
    }
`;

export const InfoLabel = styled.span`
    font-size: 14px;
    color: #b0b0b0;
`;

export const InfoValue = styled.span`
    font-size: 14px;
    color: #ffffff;
    font-weight: 600;
`;

export const MaskedInfoValue = styled.span`
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

export const FortuneStatusBadge = styled.div`
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

export const ActionButton = styled.button`
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

export const BirthdayReminderSection = styled.div`
    padding: 16px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
    border-radius: 12px;
    margin-top: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    z-index: 1;
`;

export const ReminderOption = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
`;

export const ReminderLabel = styled.span`
    font-size: 14px;
    color: #d0d0d0;
`;

export const ToggleSwitch = styled.label`
    position: relative;
    display: inline-block;
    width: 50px;
    height: 26px;
`;

export const ToggleInput = styled.input`
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

export const ToggleSlider = styled.span`
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

export const CalendarTypeSelector = styled.div`
    display: flex;
    gap: 8px;
    margin-top: 8px;
`;

export const CalendarTypeButton = styled.button`
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

export const NicknameInput = styled.input`
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

export const IdDisplayBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: rgba(94, 190, 38, 0.1);
    border: 1px solid rgba(94, 190, 38, 0.3);
    border-radius: 12px;
    margin-bottom: 12px;
`;

export const IdText = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    color: #5ebe26;
    font-size: 16px;
    font-weight: 600;
`;

export const IdPrefix = styled.span`
    color: rgba(94, 190, 38, 0.7);
    font-size: 18px;
    font-weight: 700;
`;

export const IconButton = styled.button`
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

export const QRCodeContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 20px;
    background: white;
    border-radius: 12px;
    margin-bottom: 12px;
`;

export const QRCodeImage = styled.img`
    width: 200px;
    height: 200px;
    border-radius: 8px;
`;

export const QRActions = styled.div`
    display: flex;
    gap: 8px;
    width: 100%;
`;

export const QRButton = styled.button`
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

export const ChangeIdButton = styled.button`
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

export const SecurityButton = styled.button`
    width: 100%;
    padding: 14px;
    background: rgba(74, 144, 226, 0.1);
    border: 1px solid rgba(74, 144, 226, 0.3);
    border-radius: 12px;
    color: #4a90e2;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    &:hover {
        background: rgba(74, 144, 226, 0.2);
        border-color: rgba(74, 144, 226, 0.5);
        box-shadow: 0 2px 8px rgba(74, 144, 226, 0.2);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        &:hover {
            background: rgba(74, 144, 226, 0.1);
            box-shadow: none;
        }
    }
`;

export const CleanupButton = styled.button`
    width: 100%;
    padding: 14px;
    background: rgba(255, 165, 0, 0.1);
    border: 1px solid rgba(255, 165, 0, 0.3);
    border-radius: 12px;
    color: #ffa500;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    &:hover {
        background: rgba(255, 165, 0, 0.2);
        border-color: rgba(255, 165, 0, 0.5);
        box-shadow: 0 2px 8px rgba(255, 165, 0, 0.2);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        &:hover {
            background: rgba(255, 165, 0, 0.1);
            box-shadow: none;
        }
    }
`;
