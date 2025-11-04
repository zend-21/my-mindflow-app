// src/components/FortuneInputModal.jsx

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getCountries, getCities } from '../utils/timeZoneData';
import { convertSolarToLunar, formatLunarDate } from '../utils/lunarConverter';
import { searchCity, getTimezoneFromCoords } from '../utils/geocoding';
import { calculateZodiacAnimal } from '../utils/fortuneLogic';

// 🎨 Styled Components

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
`;

const Container = styled.div`
    background: linear-gradient(180deg, #fafafa 0%, #f0f2f5 100%);
    width: 90%;
    max-width: 500px;
    max-height: 85vh;
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

const Header = styled.div`
    padding: 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-align: center;
    position: relative;
`;

const Title = styled.h2`
    margin: 0;
    font-size: 24px;
    font-weight: 700;
`;

const Subtitle = styled.p`
    margin: 8px 0 0 0;
    font-size: 14px;
    opacity: 0.9;
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

const Content = styled.div`
    padding: 24px;
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const InputSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const Label = styled.label`
    font-size: 16px;
    font-weight: 600;
    color: #333;
`;

const Input = styled.input`
    padding: 12px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-size: 16px;
    transition: border-color 0.2s;

    &:focus {
        outline: none;
        border-color: #667eea;
    }

    &::placeholder {
        color: #cbd5e0;
    }
`;

const Select = styled.select`
    padding: 12px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-size: 16px;
    background: white;
    cursor: pointer;
    transition: border-color 0.2s;

    &:focus {
        outline: none;
        border-color: #667eea;
    }
`;

const RadioGroup = styled.div`
    display: flex;
    gap: 16px;
    margin-top: 8px;
`;

const RadioLabel = styled.label`
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 16px;
    color: #555;
    transition: color 0.2s;

    &:hover {
        color: #667eea;
    }

    input[type="radio"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
        accent-color: #667eea;
    }
`;

const CheckboxLabel = styled.label`
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
    color: #555;

    input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: #667eea;
    }
`;

const TimeInputGroup = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 12px;
    margin-top: 20px;
`;

const Button = styled.button`
    flex: 1;
    padding: 14px;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    ${props => props.$primary ? `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
    ` : `
        background: #e2e8f0;
        color: #666;
        &:hover {
            background: #cbd5e0;
        }
    `}

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        &:hover {
            transform: none;
            box-shadow: none;
        }
    }
`;

const InfoText = styled.p`
    font-size: 12px;
    color: #888;
    margin: 4px 0 0 0;
    line-height: 1.4;
`;

const LunarDateDisplay = styled.div`
    font-size: 13px;
    color: #667eea;
    font-weight: 600;
    margin-top: 4px;
    padding: 4px 8px;
    background: transparent;
    border-radius: 4px;
    min-height: 21px; /* 공간 미리 확보 */
    display: flex;
    align-items: center;
`;

const LunarConvertButton = styled.button`
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    color: #667eea;
    background: white;
    border: 1.5px solid #667eea;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    &:hover {
        background: #667eea;
        color: white;
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const LunarContainer = styled.div`
    margin-top: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-left: 60px;
    padding-right: 40px;
    max-width: 100%;

    /* 모바일 세로 모드 (기본) */
    @media (max-width: 767px) {
        padding-left: 50px;
        padding-right: 30px;
    }

    /* 모바일 가로 모드 및 태블릿 */
    @media (min-width: 768px) {
        padding-left: 70px;
        padding-right: 52px;
    }

    /* 데스크탑 */
    @media (min-width: 1024px) {
        padding-left: 80px;
        padding-right: 60px;
    }

    /* 대형 데스크탑 */
    @media (min-width: 1440px) {
        padding-left: 90px;
        padding-right: 70px;
    }

    /* 초대형 화면 */
    @media (min-width: 1900px) {
        padding-left: 100px;
        padding-right: 80px;
    }
`;

const UserNameDisplay = styled.div`
    padding: 12px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-size: 16px;
    background: #f7fafc;
    color: #555;
`;

// 도시 검색 모달 오버레이
const CitySearchModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10001;
`;

// 도시 검색 모달 컨테이너
const CitySearchModalContainer = styled.div`
    background: white;
    width: 90%;
    max-width: 500px;
    max-height: 70vh;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

// 도시 검색 모달 헤더
const CitySearchModalHeader = styled.div`
    padding: 20px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const CitySearchModalTitle = styled.h3`
    margin: 0;
    font-size: 20px;
    font-weight: 700;
`;

// 도시 검색 모달 바디
const CitySearchModalBody = styled.div`
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
    overflow: hidden;
`;

// 도시 검색 인풋
const CitySearchInput = styled.input`
    padding: 14px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-size: 16px;
    transition: border-color 0.2s;

    &:focus {
        outline: none;
        border-color: #667eea;
    }

    &::placeholder {
        color: #cbd5e0;
    }
`;

// 도시 검색 결과 리스트
const CitySearchResultsList = styled.div`
    flex: 1;
    overflow-y: auto;
    background: #f7f9fc;
    border-radius: 10px;
    padding: 8px;
`;

// 도시 검색 헬퍼 텍스트
const CitySearchHelperText = styled.div`
    padding: 16px;
    text-align: center;
    color: #888;
    font-size: 14px;
    line-height: 1.6;
`;

const CitySearchItem = styled.div`
    padding: 14px 16px;
    cursor: pointer;
    transition: background 0.2s;
    border-radius: 8px;
    margin-bottom: 4px;
    background: white;

    &:last-child {
        margin-bottom: 0;
    }

    &:hover {
        background: #eef1f8;
    }

    &:active {
        background: #e2e8f0;
    }
`;

const CitySearchItemPrimary = styled.div`
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
`;

const CitySearchItemSecondary = styled.div`
    font-size: 13px;
    color: #718096;
    line-height: 1.4;
`;

const CitySearchLoading = styled.div`
    padding: 32px 16px;
    text-align: center;
    color: #888;
    font-size: 14px;
`;

const CitySearchEmpty = styled.div`
    padding: 32px 16px;
    text-align: center;
    color: #888;
    font-size: 14px;
`;

const ConfirmSection = styled.div`
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const ConfirmTitle = styled.h3`
    margin: 0 0 16px 0;
    font-size: 18px;
    color: #667eea;
`;

const ConfirmItem = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #f0f2f5;

    &:last-child {
        border-bottom: none;
    }
`;

const ConfirmLabel = styled.span`
    color: #888;
    font-size: 14px;
`;

const ConfirmValue = styled.span`
    color: #333;
    font-size: 14px;
    font-weight: 600;
`;

// 음력 경고 모달
const WarningOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 20000;
`;

const WarningBox = styled.div`
    background: white;
    border-radius: 16px;
    padding: 32px 24px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    text-align: center;
`;

const WarningIcon = styled.div`
    font-size: 48px;
    margin-bottom: 16px;
`;

const WarningTitle = styled.h3`
    font-size: 20px;
    font-weight: 700;
    color: #333;
    margin: 0 0 12px 0;
`;

const WarningMessage = styled.p`
    font-size: 15px;
    color: #666;
    line-height: 1.6;
    margin: 0 0 24px 0;
    white-space: pre-line;
`;

const WarningButtonGroup = styled.div`
    display: flex;
    gap: 12px;
`;

const WarningButton = styled.button`
    flex: 1;
    padding: 14px 24px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    ${props => props.$primary ? `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
    ` : `
        background: #f0f2f5;
        color: #666;

        &:hover {
            background: #e1e4e8;
        }
    `}
`;

// 🎯 Main Component

const FortuneInputModal = ({ onClose, onSubmit, initialData = null, userName = '게스트', isEditMode = false, profile = null }) => {
    // 편집 모드이거나 initialData가 없으면 'input', 아니면 'confirm'
    const [step, setStep] = useState(isEditMode ? 'input' : (initialData ? 'confirm' : 'input')); // 'input' | 'confirm'
    const [showLunarWarning, setShowLunarWarning] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // 사용자 입력 데이터
    const [birthYear, setBirthYear] = useState(initialData?.birthYear?.toString() || '');
    const [birthMonth, setBirthMonth] = useState(initialData?.birthMonth?.toString().padStart(2, '0') || '');
    const [birthDay, setBirthDay] = useState(initialData?.birthDay?.toString().padStart(2, '0') || '');
    const [gender, setGender] = useState(initialData?.gender || '여성');

    // 출생 시간 (선택 사항)
    const [birthHour, setBirthHour] = useState(initialData?.birthHour?.toString().padStart(2, '0') || '');
    const [birthMinute, setBirthMinute] = useState(initialData?.birthMinute?.toString().padStart(2, '0') || '');

    // 출생 장소 (선택 사항)
    const [country, setCountry] = useState(initialData?.country || '');
    const [city, setCity] = useState(initialData?.city || '');
    const [birthLat, setBirthLat] = useState(initialData?.birthLat || null);
    const [birthLon, setBirthLon] = useState(initialData?.birthLon || null);
    const [birthTimezone, setBirthTimezone] = useState(initialData?.birthTimezone || null);

    // 도시 검색
    const [cityQuery, setCityQuery] = useState(
        initialData?.city && initialData?.country
            ? `${initialData.city}, ${initialData.country}`
            : ''
    );
    const [citySuggestions, setCitySuggestions] = useState([]);
    const [isSearchingCity, setIsSearchingCity] = useState(false);
    const [showCitySearchModal, setShowCitySearchModal] = useState(false);
    const [modalCityQuery, setModalCityQuery] = useState('');

    // 음력 날짜 표시용
    const [lunarDate, setLunarDate] = useState(initialData?.lunarDate || '');
    const [zodiacAnimal, setZodiacAnimal] = useState(initialData?.zodiacAnimal || '');
    const [isLoadingLunar, setIsLoadingLunar] = useState(false);
    const [cooldownSeconds, setCooldownSeconds] = useState(0);

    // 날짜 변경 추적을 위한 ref
    const [prevBirthDate, setPrevBirthDate] = useState({
        year: birthYear,
        month: birthMonth,
        day: birthDay
    });

    // 날짜 변경 감지하여 음력 초기화
    useEffect(() => {
        // 날짜가 실제로 변경되었는지 확인
        const dateChanged =
            birthYear !== prevBirthDate.year ||
            birthMonth !== prevBirthDate.month ||
            birthDay !== prevBirthDate.day;

        if (dateChanged && lunarDate) {
            setLunarDate('');
            setPrevBirthDate({ year: birthYear, month: birthMonth, day: birthDay });
        }
    }, [birthYear, birthMonth, birthDay]);

    // 쿨다운 타이머
    useEffect(() => {
        if (cooldownSeconds > 0) {
            const timer = setTimeout(() => {
                setCooldownSeconds(cooldownSeconds - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldownSeconds]);

    // 도시 검색 (debounce 500ms) - 모달 내부 검색
    useEffect(() => {
        if (!showCitySearchModal || !modalCityQuery || modalCityQuery.trim().length < 2) {
            setCitySuggestions([]);
            return;
        }

        setIsSearchingCity(true);

        const timer = setTimeout(async () => {
            const results = await searchCity(modalCityQuery);
            setCitySuggestions(results);
            setIsSearchingCity(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [modalCityQuery, showCitySearchModal]);

    // 도시 검색 모달 열기
    const handleOpenCitySearchModal = () => {
        setModalCityQuery('');
        setCitySuggestions([]);
        setShowCitySearchModal(true);
    };

    // 도시 선택 핸들러
    const handleCitySelect = async (suggestion) => {
        setCity(suggestion.city);
        setCountry(suggestion.country);
        setCityQuery(suggestion.displayName);

        // 위도/경도 저장
        setBirthLat(suggestion.lat);
        setBirthLon(suggestion.lon);

        // 타임존 가져오기
        try {
            const timezone = await getTimezoneFromCoords(suggestion.lat, suggestion.lon);
            setBirthTimezone(timezone);
        } catch (error) {
            console.error('타임존 가져오기 실패:', error);
            setBirthTimezone(null);
        }

        setShowCitySearchModal(false);
        setModalCityQuery('');
        setCitySuggestions([]);
    };

    // 양력 → 음력 변환 (수동 버튼 클릭)
    const handleConvertToLunar = async () => {
        if (!birthYear || !birthMonth || !birthDay) {
            setErrorMessage('생년월일을 모두 입력해주세요.');
            setShowErrorModal(true);
            return;
        }

        // 한 자리 숫자 자동 포맷팅 (첫 클릭 시)
        let needsFormatting = false;
        if (birthMonth.length === 1) {
            setBirthMonth('0' + birthMonth);
            needsFormatting = true;
        }
        if (birthDay.length === 1) {
            setBirthDay('0' + birthDay);
            needsFormatting = true;
        }

        // 포맷팅이 필요했다면 여기서 리턴 (다음 클릭 대기)
        if (needsFormatting) {
            return;
        }

        const year = parseInt(birthYear);
        const month = parseInt(birthMonth);
        const day = parseInt(birthDay);

        // 유효성 검사
        if (!isNaN(year) && !isNaN(month) && !isNaN(day) &&
            birthYear.length === 4 &&
            year >= 1900 && year <= 2050 &&
            month >= 1 && month <= 12 &&
            day >= 1 && day <= 31) {

            setIsLoadingLunar(true);
            const convertedLunarData = await convertSolarToLunar(year, month, day);
            setIsLoadingLunar(false);

            if (convertedLunarData) {
                const formattedDate = formatLunarDate(convertedLunarData);
                setLunarDate(formattedDate);

                // 띠 계산 - 음력 연도 기준
                const yearMatch = formattedDate.match(/(\d{4})년/);
                const lunarYear = yearMatch ? parseInt(yearMatch[1]) : convertedLunarData.lunarYear;
                const animal = calculateZodiacAnimal(lunarYear);
                setZodiacAnimal(animal);

                setCooldownSeconds(5); // 5초 쿨다운
            } else {
                setLunarDate('');
                setZodiacAnimal('');
                setErrorMessage('음력 변환에 실패했습니다. 날짜를 확인해주세요.');
                setShowErrorModal(true);
            }
        } else {
            setErrorMessage('올바른 날짜를 입력해주세요.');
            setShowErrorModal(true);
        }
    };

    // 국가 변경 시 첫 번째 도시로 자동 설정
    const handleCountryChange = (e) => {
        const newCountry = e.target.value;
        setCountry(newCountry);
        const newCities = getCities(newCountry);
        if (newCities.length > 0) {
            setCity(newCities[0]);
        }
    };

    // 입력 핸들러 (0 입력 시 바로 표시)
    const handleMonthChange = (e) => {
        const value = e.target.value;
        if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 12)) {
            setBirthMonth(value);
        }
    };

    const handleDayChange = (e) => {
        const value = e.target.value;
        if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 31)) {
            setBirthDay(value);
        }
    };

    const handleHourChange = (e) => {
        const value = e.target.value;
        if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 23)) {
            setBirthHour(value);
        }
    };

    const handleMinuteChange = (e) => {
        const value = e.target.value;
        if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 59)) {
            setBirthMinute(value);
        }
    };

    // Blur 시 자동 포맷팅
    const handleMonthBlur = () => {
        if (birthMonth && birthMonth.length === 1) {
            setBirthMonth('0' + birthMonth);
        }
    };

    const handleDayBlur = () => {
        if (birthDay && birthDay.length === 1) {
            setBirthDay('0' + birthDay);
        }
    };

    const handleHourBlur = () => {
        if (birthHour && birthHour.length === 1) {
            setBirthHour('0' + birthHour);
        }
    };

    const handleMinuteBlur = () => {
        if (birthMinute && birthMinute.length === 1) {
            setBirthMinute('0' + birthMinute);
        }
    };

    // 다음 단계 (확인 화면)
    const handleNext = () => {
        // 필수 입력 검증
        if (!birthYear || !birthMonth || !birthDay) {
            setErrorMessage('생년월일은 필수 입력 사항입니다.');
            setShowErrorModal(true);
            return;
        }

        // 음력 변환 중이거나 실패한 경우 경고 표시
        if (isLoadingLunar || !lunarDate) {
            setShowLunarWarning(true);
            return;
        }

        setStep('confirm');
    };

    // 음력 없이 진행
    const handleProceedWithoutLunar = () => {
        setShowLunarWarning(false);
        setStep('confirm');
    };

    // 음력 대기 취소
    const handleCancelLunarWarning = () => {
        setShowLunarWarning(false);
    };

    // 수정하기
    const handleEdit = () => {
        setStep('input');
    };

    // 최종 제출
    const handleSubmit = () => {
        // 데이터 구성
        const userData = {
            name: userName,
            birthYear: parseInt(birthYear),
            birthMonth: parseInt(birthMonth),
            birthDay: parseInt(birthDay),
            gender,
            lunarDate: lunarDate, // 음력 날짜 문자열 저장
            zodiacAnimal: zodiacAnimal // 띠 저장
        };

        // 출생 시간 추가 (선택 - 값이 있으면)
        if (birthHour && birthMinute) {
            userData.birthHour = parseInt(birthHour);
            userData.birthMinute = parseInt(birthMinute);
        }

        // 출생 장소 추가 (선택 - 값이 있으면)
        if (country && city) {
            userData.country = country;
            userData.city = city;
        }

        // 출생 위치 좌표 및 타임존 추가 (태양시 보정용)
        if (birthLat !== null && birthLon !== null) {
            userData.birthLat = birthLat;
            userData.birthLon = birthLon;
        }
        if (birthTimezone) {
            userData.birthTimezone = birthTimezone;
        }

        onSubmit(userData);
    };

    return (
        <Overlay>
            <Container>
                <Header>
                    <Title>
                        {step === 'input' ? '운세 프로필 입력' : '운세 프로필 정보 확인'}
                    </Title>
                    <Subtitle>
                        {step === 'input'
                            ? '정확한 운세를 위해 정보를 입력해주세요'
                            : '입력하신 정보가 맞는지 확인하세요'}
                    </Subtitle>
                    <CloseButton onClick={onClose}>&times;</CloseButton>
                </Header>

                <Content>
                    {step === 'input' && (
                        <InputSection>
                            {/* 이름 (표시만, 수정 불가) */}
                            <div>
                                <Label>이름</Label>
                                <UserNameDisplay>{userName}</UserNameDisplay>
                                <InfoText>
                                    {profile
                                        ? '👤 로그인 계정 또는 닉네임이 자동으로 표시됩니다'
                                        : '👤 로그인하지 않으면 매번 정보를 입력해야 합니다'}
                                </InfoText>
                            </div>

                            {/* 생년월일 입력 그룹 */}
                            <div>
                                {/* 출생 년 */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Label>출생 </Label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Input
                                            type="number"
                                            placeholder="예: 1995"
                                            value={birthYear}
                                            onChange={(e) => setBirthYear(e.target.value)}
                                            style={{ width: '220px' }}
                                        />
                                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#333', minWidth: '24px' }}>년</span>
                                    </div>
                                </div>

                                {/* 월 / 일 */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', marginTop: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Input
                                            type="number"
                                            placeholder="1-12"
                                            value={birthMonth}
                                            onChange={handleMonthChange}
                                            onBlur={handleMonthBlur}
                                            onFocus={(e) => e.target.select()}
                                            min="1"
                                            max="12"
                                            style={{ width: '80px' }}
                                        />
                                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#333', minWidth: '24px' }}>월</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Input
                                            type="number"
                                            placeholder="1-31"
                                            value={birthDay}
                                            onChange={handleDayChange}
                                            onBlur={handleDayBlur}
                                            onFocus={(e) => e.target.select()}
                                            min="1"
                                            max="31"
                                            style={{ width: '80px' }}
                                        />
                                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#333', minWidth: '24px' }}>일</span>
                                    </div>
                                </div>

                                {/* 음력 날짜 표시 및 변환 버튼 */}
                                <LunarContainer>
                                    <LunarConvertButton
                                        onClick={handleConvertToLunar}
                                        disabled={
                                            isLoadingLunar ||
                                            cooldownSeconds > 0 ||
                                            !birthYear ||
                                            birthYear.length !== 4 ||
                                            !birthMonth ||
                                            !birthDay
                                        }
                                    >
                                        음력변환
                                    </LunarConvertButton>
                                    <LunarDateDisplay style={{ margin: 0, padding: '4px 0 4px 5px', flex: 1, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                        {isLoadingLunar ? '⏳ 계산 중...' : (lunarDate ? `(${lunarDate})` : '')}
                                    </LunarDateDisplay>
                                </LunarContainer>
                            </div>

                            {/* 성별 */}
                            <div>
                                <Label>성별 </Label>
                                <RadioGroup style={{ justifyContent: 'center', gap: '40px' }}>
                                    <RadioLabel>
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="여성"
                                            checked={gender === '여성'}
                                            onChange={(e) => setGender(e.target.value)}
                                        />
                                        여성
                                    </RadioLabel>
                                    <RadioLabel>
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="남성"
                                            checked={gender === '남성'}
                                            onChange={(e) => setGender(e.target.value)}
                                        />
                                        남성
                                    </RadioLabel>
                                </RadioGroup>
                            </div>

                            {/* 출생 시간 (선택사항) */}
                            <div>
                                <Label>출생 시간 (선택사항)</Label>
                                <InfoText style={{ marginTop: '4px', marginBottom: '8px' }}>더 정확한 사주 분석을 위해 입력하세요</InfoText>
                                <TimeInputGroup>
                                    <div>
                                        <Input
                                            type="number"
                                            placeholder="00-23"
                                            value={birthHour}
                                            onChange={handleHourChange}
                                            onBlur={handleHourBlur}
                                            onFocus={(e) => e.target.select()}
                                            min="0"
                                            max="23"
                                        />
                                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#666', marginLeft: '8px' }}>시</span>
                                    </div>
                                    <div>
                                        <Input
                                            type="number"
                                            placeholder="00-59"
                                            value={birthMinute}
                                            onChange={handleMinuteChange}
                                            onBlur={handleMinuteBlur}
                                            onFocus={(e) => e.target.select()}
                                            min="0"
                                            max="59"
                                        />
                                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#666', marginLeft: '8px' }}>분</span>
                                    </div>
                                </TimeInputGroup>
                            </div>

                            {/* 출생 도시 (선택사항) */}
                            <div>
                                <Label>출생 도시 (선택사항)</Label>
                                <InfoText style={{ marginTop: '8px', marginBottom: '8px' }}>
                                    태양시 보정을 위해 출생 도시를 입력하세요
                                </InfoText>
                                <Input
                                    type="text"
                                    placeholder="서울, Paris, つくば"
                                    value={cityQuery}
                                    onClick={handleOpenCitySearchModal}
                                    readOnly
                                    style={{ cursor: 'pointer', background: '#f9fafb' }}
                                />
                                {city && country && (
                                    <InfoText style={{ marginTop: '4px', color: '#667eea' }}>
                                        ✓ 선택됨: {city}, {country}
                                    </InfoText>
                                )}
                            </div>

                            <ButtonGroup>
                                <Button onClick={onClose}>취소</Button>
                                <Button $primary onClick={handleNext}>
                                    다음
                                </Button>
                            </ButtonGroup>
                        </InputSection>
                    )}

                    {step === 'confirm' && (
                        <>
                            <ConfirmSection>
                                <ConfirmTitle>운세 프로필 정보</ConfirmTitle>

                                <ConfirmItem>
                                    <ConfirmLabel>이름</ConfirmLabel>
                                    <ConfirmValue>{userName}</ConfirmValue>
                                </ConfirmItem>

                                <ConfirmItem>
                                    <ConfirmLabel>생년월일 (양력)</ConfirmLabel>
                                    <ConfirmValue>
                                        {birthYear}년 {birthMonth}월 {birthDay}일
                                    </ConfirmValue>
                                </ConfirmItem>

                                {lunarDate && (
                                    <ConfirmItem>
                                        <ConfirmLabel>음력</ConfirmLabel>
                                        <ConfirmValue style={{ fontSize: '13px', color: '#667eea' }}>
                                            {(() => {
                                                // 음력 날짜 문자열에서 연도 추출 (예: "1969년 12월 17일" -> 1969)
                                                const yearMatch = lunarDate.match(/(\d{4})년/);
                                                const lunarYear = yearMatch ? parseInt(yearMatch[1]) : birthYear;
                                                return `(${calculateZodiacAnimal(lunarYear)}띠)`;
                                            })()} {lunarDate}
                                        </ConfirmValue>
                                    </ConfirmItem>
                                )}

                                <ConfirmItem>
                                    <ConfirmLabel>성별</ConfirmLabel>
                                    <ConfirmValue>{gender}</ConfirmValue>
                                </ConfirmItem>

                                <ConfirmItem>
                                    <ConfirmLabel>출생 시간</ConfirmLabel>
                                    <ConfirmValue>
                                        {birthHour && birthMinute
                                            ? `${birthHour}시 ${birthMinute}분`
                                            : '선택하지 않음'}
                                    </ConfirmValue>
                                </ConfirmItem>

                                <ConfirmItem>
                                    <ConfirmLabel>출생 장소</ConfirmLabel>
                                    <ConfirmValue>
                                        {country && city
                                            ? `${country}, ${city}`
                                            : '선택하지 않음'}
                                    </ConfirmValue>
                                </ConfirmItem>
                            </ConfirmSection>

                            <ButtonGroup>
                                <Button onClick={handleEdit}>수정하기</Button>
                                <Button $primary onClick={handleSubmit}>
                                    확인
                                </Button>
                            </ButtonGroup>
                        </>
                    )}
                </Content>
            </Container>

            {/* 음력 경고 모달 */}
            {showLunarWarning && (
                <WarningOverlay onClick={(e) => e.stopPropagation()}>
                    <WarningBox onClick={(e) => e.stopPropagation()}>
                        <WarningIcon>⚠️</WarningIcon>
                        <WarningTitle>음력 변환이 완료되지 않았습니다</WarningTitle>
                        <WarningMessage>
                            음력 정보가 없으면 사주 내용은 표시되지 않습니다.{'\n'}
                            이대로 진행하시겠습니까?{'\n\n'}
                            (별자리, 타로 등은 정상 출력됩니다)
                        </WarningMessage>
                        <WarningButtonGroup>
                            <WarningButton onClick={handleCancelLunarWarning}>
                                취소
                            </WarningButton>
                            <WarningButton $primary onClick={handleProceedWithoutLunar}>
                                진행
                            </WarningButton>
                        </WarningButtonGroup>
                    </WarningBox>
                </WarningOverlay>
            )}

            {/* 에러 모달 */}
            {showErrorModal && (
                <WarningOverlay onClick={(e) => e.stopPropagation()}>
                    <WarningBox onClick={(e) => e.stopPropagation()}>
                        <WarningIcon>⚠️</WarningIcon>
                        <WarningTitle>입력 오류</WarningTitle>
                        <WarningMessage>
                            {errorMessage}
                        </WarningMessage>
                        <WarningButtonGroup>
                            <WarningButton $primary onClick={() => setShowErrorModal(false)}>
                                확인
                            </WarningButton>
                        </WarningButtonGroup>
                    </WarningBox>
                </WarningOverlay>
            )}

            {/* 도시 검색 모달 */}
            {showCitySearchModal && (
                <CitySearchModalOverlay onClick={() => setShowCitySearchModal(false)}>
                    <CitySearchModalContainer onClick={(e) => e.stopPropagation()}>
                        <CitySearchModalHeader>
                            <CitySearchModalTitle>출생 도시 검색</CitySearchModalTitle>
                            <CloseButton onClick={() => setShowCitySearchModal(false)}>&times;</CloseButton>
                        </CitySearchModalHeader>
                        <CitySearchModalBody>
                            <CitySearchInput
                                type="text"
                                placeholder="예: 서울, Paris, つくば"
                                value={modalCityQuery}
                                onChange={(e) => setModalCityQuery(e.target.value)}
                                autoFocus
                                autoComplete="off"
                            />
                            <CitySearchResultsList>
                                {!modalCityQuery || modalCityQuery.trim().length < 2 ? (
                                    <CitySearchHelperText>
                                        태어난 도시를 모르시는 경우<br />
                                        태어난 국가의 수도를 입력하세요.
                                    </CitySearchHelperText>
                                ) : isSearchingCity ? (
                                    <CitySearchLoading>🔍 검색 중...</CitySearchLoading>
                                ) : citySuggestions.length > 0 ? (
                                    citySuggestions.map((suggestion, index) => {
                                        // 주요 지명 (첫 줄)
                                        const primary = `🌏 ${suggestion.primaryName || suggestion.city}`;

                                        // 상세 정보 (둘째 줄)
                                        const secondaryParts = [];
                                        if (suggestion.district) secondaryParts.push(suggestion.district);
                                        if (suggestion.state) secondaryParts.push(suggestion.state);
                                        if (suggestion.country) secondaryParts.push(suggestion.country);
                                        const secondary = secondaryParts.join(', ');

                                        return (
                                            <CitySearchItem
                                                key={index}
                                                onClick={() => handleCitySelect(suggestion)}
                                            >
                                                <CitySearchItemPrimary>{primary}</CitySearchItemPrimary>
                                                {secondary && (
                                                    <CitySearchItemSecondary>{secondary}</CitySearchItemSecondary>
                                                )}
                                            </CitySearchItem>
                                        );
                                    })
                                ) : (
                                    <CitySearchEmpty>검색 결과가 없습니다</CitySearchEmpty>
                                )}
                            </CitySearchResultsList>
                        </CitySearchModalBody>
                    </CitySearchModalContainer>
                </CitySearchModalOverlay>
            )}
        </Overlay>
    );
};

export default FortuneInputModal;
