// src/components/ProfilePage.jsx

import { useState } from 'react';
import styled from 'styled-components';
import { getUserProfile } from '../utils/fortuneLogic';
import { getTodayFortune } from '../utils/fortuneLogic';
import FortuneInputModal from './FortuneInputModal';
import FortuneFlow from './FortuneFlow';

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
    background: linear-gradient(180deg, #fafafa 0%, #f0f2f5 100%);
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
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    @media (min-width: 1024px) {
        max-width: 530px;
    }
`;

const Header = styled.div`
    padding: 24px 24px 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    position: relative;
    flex-shrink: 0;
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

    /* 커스텀 스크롤바 */
    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: #f1f1f1;
    }

    &::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: #a1a1a1;
    }
`;

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const Section = styled.div`
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const ProfileHeader = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding-bottom: 20px;
    border-bottom: 1px solid #f0f2f5;
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
    border: 3px solid #667eea;
`;

const DefaultProfileIcon = styled.div`
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    color: white;
    font-weight: 600;
    border: 3px solid #667eea;
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

const NicknameContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const Nickname = styled.h2`
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: #2d3748;
`;

const EditButton = styled.button`
    background: transparent;
    border: none;
    color: #667eea;
    cursor: pointer;
    font-size: 14px;
    padding: 4px 8px;

    &:hover {
        text-decoration: underline;
    }
`;

const Email = styled.p`
    margin: 0;
    font-size: 14px;
    color: #718096;
`;

const SectionTitle = styled.h3`
    margin: 0 0 16px 0;
    font-size: 18px;
    font-weight: 600;
    color: #2d3748;
    display: flex;
    align-items: center;
    gap: 8px;
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
    background: #f7fafc;
    border-radius: 12px;
`;

const StatValue = styled.div`
    font-size: 24px;
    font-weight: 700;
    color: #667eea;
    margin-bottom: 4px;
`;

const StatLabel = styled.div`
    font-size: 12px;
    color: #718096;
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
    color: #718096;
    transition: transform 0.3s;
    transform: ${props => props.$isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const FortuneContent = styled.div`
    max-height: ${props => props.$isExpanded ? '500px' : '0'};
    overflow: hidden;
    transition: max-height 0.3s ease;
`;

const FortuneInfo = styled.div`
    padding: 16px;
    background: #f7fafc;
    border-radius: 12px;
    margin-bottom: 16px;
`;

const InfoRow = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #e2e8f0;

    &:last-child {
        border-bottom: none;
    }
`;

const InfoLabel = styled.span`
    font-size: 14px;
    color: #718096;
`;

const InfoValue = styled.span`
    font-size: 14px;
    color: #2d3748;
    font-weight: 600;
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

    ${props => props.$primary ? `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
    ` : `
        background: #edf2f7;
        color: #4a5568;
        &:hover {
            background: #e2e8f0;
        }
    `}
`;

const BirthdayReminderSection = styled.div`
    padding: 16px;
    background: #f7fafc;
    border-radius: 12px;
    margin-top: 16px;
`;

const ReminderOption = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
`;

const ReminderLabel = styled.span`
    font-size: 14px;
    color: #4a5568;
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
        background-color: #667eea;
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
    background-color: #cbd5e0;
    transition: 0.3s;
    border-radius: 26px;

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
    border: 2px solid ${props => props.$selected ? '#667eea' : '#e2e8f0'};
    background: ${props => props.$selected ? '#f0f4ff' : 'white'};
    color: ${props => props.$selected ? '#667eea' : '#718096'};
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        border-color: #667eea;
    }
`;

const NicknameInput = styled.input`
    padding: 8px 12px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    text-align: center;
    width: 200px;

    &:focus {
        outline: none;
        border-color: #667eea;
    }
`;

// 🎯 Main Component

const ProfilePage = ({ profile, memos, calendarSchedules, showToast, onClose }) => {
    const [isFortuneExpanded, setIsFortuneExpanded] = useState(false);
    const [isEditingNickname, setIsEditingNickname] = useState(false);
    const [nickname, setNickname] = useState(profile?.nickname || '');
    const [isBirthdayReminderEnabled, setIsBirthdayReminderEnabled] = useState(false);
    const [birthdayCalendarType, setBirthdayCalendarType] = useState('solar'); // 'solar' | 'lunar'
    const [isFortuneInputModalOpen, setIsFortuneInputModalOpen] = useState(false);
    const [isFortuneFlowOpen, setIsFortuneFlowOpen] = useState(false);

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
            localStorage.setItem('userNickname', nickname.trim());
            showToast?.('닉네임이 저장되었습니다');
        }
        setIsEditingNickname(false);
    };

    // 프로필 사진 변경
    const handleProfileImageClick = () => {
        showToast?.('프로필 사진 변경 기능은 준비 중입니다');
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

    return (
        <>
            <Overlay onClick={onClose}>
                <ModalContainer onClick={(e) => e.stopPropagation()}>
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
                            {profile?.picture ? (
                                <ProfileImage src={profile.picture} alt="Profile" />
                            ) : (
                                <DefaultProfileIcon>{profileInitial}</DefaultProfileIcon>
                            )}
                            <EditOverlay className="edit-overlay">변경</EditOverlay>
                        </ProfileImageWrapper>

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
                                    <EditButton onClick={handleSaveNickname}>저장</EditButton>
                                </>
                            ) : (
                                <>
                                    <Nickname>{userName}</Nickname>
                                    <EditButton onClick={() => setIsEditingNickname(true)}>수정</EditButton>
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
                                    <InfoValue>
                                        {fortuneProfile.birthYear}년 {fortuneProfile.birthMonth}월 {fortuneProfile.birthDay}일
                                    </InfoValue>
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
        </>
    );
};

export default ProfilePage;
