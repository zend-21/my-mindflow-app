// src/components/ProfileConfirmModal.jsx

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { convertSolarToLunar, formatLunarDate } from '../utils/lunarConverter';
import { calculateZodiacAnimal } from '../utils/fortuneLogic';

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
    padding: 20px;
`;

const Modal = styled.div`
    background: white;
    border-radius: 20px;
    padding: 32px 28px;
    max-width: 400px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

    @media (min-width: 768px) {
        padding: 40px 36px;
    }
`;

const Title = styled.h2`
    margin: 0 0 8px 0;
    font-size: 22px;
    font-weight: 600;
    color: #2d3748;
    text-align: center;

    @media (min-width: 768px) {
        font-size: 24px;
    }
`;

const Subtitle = styled.p`
    margin: 0 0 28px 0;
    font-size: 14px;
    color: #718096;
    text-align: center;
    line-height: 1.5;

    @media (min-width: 768px) {
        font-size: 15px;
    }
`;

const InfoBox = styled.div`
    background: #f7fafc;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
`;

const InfoRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    &:last-child {
        margin-bottom: 0;
    }
`;

const InfoLabel = styled.span`
    font-size: 14px;
    color: #718096;
    font-weight: 500;
`;

const InfoValue = styled.span`
    font-size: 15px;
    color: #2d3748;
    font-weight: 600;

    @media (min-width: 768px) {
        font-size: 16px;
    }
`;

const Notice = styled.p`
    font-size: 11px;
    color: #a0aec0;
    text-align: center;
    line-height: 1.6;
    margin: 0 0 24px 0;
    padding: 12px;
    background: #f7fafc;
    border-radius: 8px;

    @media (min-width: 768px) {
        font-size: 12px;
    }
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 12px;
`;

const Button = styled.button`
    flex: 1;
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
        &:active {
            transform: translateY(0);
        }
    ` : `
        background: #edf2f7;
        color: #4a5568;
        &:hover {
            background: #e2e8f0;
        }
    `}

    @media (min-width: 768px) {
        font-size: 16px;
        padding: 16px;
    }
`;

const LunarNote = styled.div`
    font-size: 11px;
    color: #a0aec0;
    margin-top: 4px;
    font-weight: 400;

    @media (min-width: 768px) {
        font-size: 12px;
    }
`;

const ProfileConfirmModal = ({ profile, onConfirm, onEdit, onClose, userName }) => {
    const [lunarDate, setLunarDate] = useState('');
    const [zodiacAnimal, setZodiacAnimal] = useState('');

    // 양력 → 음력 변환 및 띠 계산
    useEffect(() => {
        const fetchLunarDate = async () => {
            // 1. 이미 저장된 음력 정보가 있으면 그대로 사용 (API 호출 안 함)
            if (profile.lunarDate && profile.zodiacAnimal) {
                console.log('✅ 저장된 음력 정보 사용:', profile.lunarDate, profile.zodiacAnimal);
                setLunarDate(profile.lunarDate);
                setZodiacAnimal(profile.zodiacAnimal);
                return;
            }

            // 2. 저장된 정보가 없으면 API 호출하여 음력 변환
            if (profile.birthYear && profile.birthMonth && profile.birthDay) {
                console.log('🔄 음력 정보가 없어 API 호출:', profile.birthYear, profile.birthMonth, profile.birthDay);
                const lunarData = await convertSolarToLunar(
                    profile.birthYear,
                    profile.birthMonth,
                    profile.birthDay
                );

                if (lunarData) {
                    const formattedDate = formatLunarDate(lunarData);
                    setLunarDate(formattedDate);

                    // 음력 날짜 문자열에서 연도 추출 (예: "1969년 12월 17일" -> 1969)
                    const yearMatch = formattedDate.match(/(\d{4})년/);
                    const lunarYear = yearMatch ? parseInt(yearMatch[1]) : lunarData.lunarYear;

                    // 띠 계산 - 추출한 음력 연도 기준
                    const animal = calculateZodiacAnimal(lunarYear);
                    setZodiacAnimal(animal);
                } else {
                    // 음력 변환 실패 시 양력 연도로 계산
                    const animal = calculateZodiacAnimal(profile.birthYear);
                    setZodiacAnimal(animal);
                }
            }
        };

        fetchLunarDate();
    }, [profile.birthYear, profile.birthMonth, profile.birthDay, profile.lunarDate, profile.zodiacAnimal]);

    // 생년월일 포맷팅 (개별 필드로 저장된 경우)
    const formatBirthday = () => {
        if (!profile.birthYear || !profile.birthMonth || !profile.birthDay) return '-';
        return `${profile.birthYear}년 ${profile.birthMonth}월 ${profile.birthDay}일 (양력)`;
    };

    // 출생 시간 포맷팅
    const formatTime = () => {
        if (profile.birthHour === undefined || profile.birthMinute === undefined) return '-';
        return `${String(profile.birthHour).padStart(2, '0')}:${String(profile.birthMinute).padStart(2, '0')}`;
    };

    // 출생지 포맷팅
    const formatBirthPlace = () => {
        if (!profile.country || !profile.city) return '-';
        return `${profile.country}, ${profile.city}`;
    };

    return (
        <Overlay>
            <Modal>
                <Title>정보 확인</Title>
                <Subtitle>저장된 정보로 운세를 확인하시겠습니까?</Subtitle>

                <InfoBox>
                    <InfoRow>
                        <InfoLabel>사용자명</InfoLabel>
                        <InfoValue>{userName || '게스트'}</InfoValue>
                    </InfoRow>
                    <InfoRow>
                        <InfoLabel>생년월일</InfoLabel>
                        <div style={{ textAlign: 'right' }}>
                            <InfoValue>{formatBirthday()}</InfoValue>
                            {lunarDate && (
                                <LunarNote>({zodiacAnimal}띠) {lunarDate}</LunarNote>
                            )}
                        </div>
                    </InfoRow>
                    <InfoRow>
                        <InfoLabel>출생 시간</InfoLabel>
                        <InfoValue>{formatTime()}</InfoValue>
                    </InfoRow>
                    <InfoRow>
                        <InfoLabel>출생지</InfoLabel>
                        <InfoValue>{formatBirthPlace()}</InfoValue>
                    </InfoRow>
                    <InfoRow>
                        <InfoLabel>성별</InfoLabel>
                        <InfoValue>{profile.gender === 'male' ? '남성' : profile.gender === '남성' ? '남성' : '여성'}</InfoValue>
                    </InfoRow>
                </InfoBox>

                <Notice>
                    오늘의 운세는 하루에 한 번만 확인할 수 있으며,<br />
                    이미 확인한 운세는 언제든 다시 볼 수 있습니다.
                </Notice>

                <ButtonGroup>
                    <Button onClick={onEdit}>정보 수정</Button>
                    <Button onClick={onConfirm} $primary>확인</Button>
                </ButtonGroup>
            </Modal>
        </Overlay>
    );
};

export default ProfileConfirmModal;
