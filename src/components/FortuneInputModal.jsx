// src/components/FortuneInputModal.jsx

import { useState, useEffect } from 'react';
import { getCountries, getCities } from '../utils/timeZoneData';
import { convertSolarToLunar, formatLunarDate } from '../utils/lunarConverter';
import { searchCity, getTimezoneFromCoords } from '../utils/geocoding';
import { calculateZodiacAnimal, calculateZodiacSign } from '../utils/fortuneLogic';
import * as S from './FortuneInputModal.styles';

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
    const [zodiacSign, setZodiacSign] = useState(initialData?.zodiacSign || '');
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
        // 별자리 계산
        const calculatedZodiacSign = calculateZodiacSign({
            birthMonth: parseInt(birthMonth),
            birthDay: parseInt(birthDay)
        });

        // 데이터 구성
        const userData = {
            name: userName,
            birthYear: parseInt(birthYear),
            birthMonth: parseInt(birthMonth),
            birthDay: parseInt(birthDay),
            gender,
            lunarDate: lunarDate, // 음력 날짜 문자열 저장
            zodiacAnimal: zodiacAnimal, // 띠 저장
            zodiacSign: calculatedZodiacSign // 별자리 저장
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
        <S.Overlay>
            <S.Container>
                <S.Header>
                    <S.Title>
                        {step === 'input' ? '운세 프로필 입력' : '운세 프로필 정보 확인'}
                    </S.Title>
                    <S.Subtitle>
                        {step === 'input'
                            ? '정확한 운세를 위해 정보를 입력해주세요'
                            : '입력하신 정보가 맞는지 확인하세요'}
                    </S.Subtitle>
                    <S.CloseButton onClick={onClose}>&times;</S.CloseButton>
                </S.Header>

                <S.Content>
                    {step === 'input' && (
                        <S.InputSection>
                            {/* 이름 (표시만, 수정 불가) */}
                            <div>
                                <S.Label>이름</S.Label>
                                <S.UserNameDisplay>{userName}</S.UserNameDisplay>
                                <S.InfoText>
                                    {profile
                                        ? '👤 로그인 계정 또는 닉네임이 자동으로 표시됩니다'
                                        : '👤 로그인하지 않으면 매번 정보를 입력해야 합니다'}
                                </S.InfoText>
                            </div>

                            {/* 생년월일 입력 그룹 */}
                            <div>
                                {/* 출생 년 */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <S.Label>출생 </S.Label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <S.Input
                                            type="number"
                                            placeholder="예: 1995"
                                            value={birthYear}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value.length <= 4) {
                                                    setBirthYear(value);
                                                }
                                            }}
                                            maxLength={4}
                                            style={{ width: '220px' }}
                                        />
                                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#b0b0b0', minWidth: '24px' }}>년</span>
                                    </div>
                                </div>

                                {/* 월 / 일 */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', marginTop: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <S.Input
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
                                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#b0b0b0', minWidth: '24px' }}>월</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <S.Input
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
                                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#b0b0b0', minWidth: '24px' }}>일</span>
                                    </div>
                                </div>

                                {/* 음력 날짜 표시 및 변환 버튼 */}
                                <S.LunarContainer>
                                    <S.LunarConvertButton
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
                                    </S.LunarConvertButton>
                                    <S.LunarDateDisplay style={{ margin: 0, padding: '4px 0 4px 5px', flex: 1, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                        {isLoadingLunar ? '⏳ 계산 중...' : (lunarDate ? `(${lunarDate})` : '')}
                                    </S.LunarDateDisplay>
                                </S.LunarContainer>
                            </div>

                            {/* 성별 */}
                            <div>
                                <S.Label>성별 </S.Label>
                                <S.RadioGroup style={{ justifyContent: 'center', gap: '40px' }}>
                                    <S.RadioLabel>
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="여성"
                                            checked={gender === '여성'}
                                            onChange={(e) => setGender(e.target.value)}
                                        />
                                        여성
                                    </S.RadioLabel>
                                    <S.RadioLabel>
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="남성"
                                            checked={gender === '남성'}
                                            onChange={(e) => setGender(e.target.value)}
                                        />
                                        남성
                                    </S.RadioLabel>
                                </S.RadioGroup>
                            </div>

                            {/* 출생 시간 (선택사항) */}
                            <div>
                                <S.Label>출생 시간 (선택사항)</S.Label>
                                <S.InfoText style={{ marginTop: '4px', marginBottom: '8px' }}>더 정확한 사주 분석을 위해 입력하세요</S.InfoText>
                                <S.TimeInputGroup>
                                    <div>
                                        <S.Input
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
                                        <S.Input
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
                                </S.TimeInputGroup>
                            </div>

                            {/* 출생 도시 (선택사항) */}
                            <div>
                                <S.Label>출생 도시 (선택사항)</S.Label>
                                <S.InfoText style={{ marginTop: '8px', marginBottom: '8px' }}>
                                    태양시 보정을 위해 출생 도시를 입력하세요
                                </S.InfoText>
                                <S.Input
                                    type="text"
                                    placeholder="예: 서울, Paris, つくば"
                                    value={cityQuery}
                                    onClick={handleOpenCitySearchModal}
                                    readOnly
                                    style={{ cursor: 'pointer', background: '#333842' }}
                                />
                                {city && country && (
                                    <S.InfoText style={{ marginTop: '4px', color: '#667eea' }}>
                                        ✓ 선택됨: {city}, {country}
                                    </S.InfoText>
                                )}
                            </div>
                        </S.InputSection>
                    )}

                    {step === 'confirm' && (
                        <S.ConfirmSection>
                            <S.ConfirmTitle>운세 프로필 정보</S.ConfirmTitle>

                            <S.ConfirmItem>
                                <S.ConfirmLabel>이름</S.ConfirmLabel>
                                <S.ConfirmValue>{userName}</S.ConfirmValue>
                            </S.ConfirmItem>

                            <S.ConfirmItem>
                                <S.ConfirmLabel>생년월일 (양력)</S.ConfirmLabel>
                                <S.ConfirmValue>
                                    {birthYear}년 {birthMonth}월 {birthDay}일
                                </S.ConfirmValue>
                            </S.ConfirmItem>

                            {lunarDate && (
                                <S.ConfirmItem>
                                    <S.ConfirmLabel>음력</S.ConfirmLabel>
                                    <S.ConfirmValue style={{ fontSize: '13px', color: '#667eea' }}>
                                        {(() => {
                                            // 음력 날짜 문자열에서 연도 추출 (예: "1969년 12월 17일" -> 1969)
                                            const yearMatch = lunarDate.match(/(\d{4})년/);
                                            const lunarYear = yearMatch ? parseInt(yearMatch[1]) : birthYear;
                                            return `(${calculateZodiacAnimal(lunarYear)}띠)`;
                                        })()} {lunarDate}
                                    </S.ConfirmValue>
                                </S.ConfirmItem>
                            )}

                            <S.ConfirmItem>
                                <S.ConfirmLabel>성별</S.ConfirmLabel>
                                <S.ConfirmValue>{gender}</S.ConfirmValue>
                            </S.ConfirmItem>

                            <S.ConfirmItem>
                                <S.ConfirmLabel>출생 시간</S.ConfirmLabel>
                                <S.ConfirmValue>
                                    {birthHour && birthMinute
                                        ? `${birthHour}시 ${birthMinute}분`
                                        : '선택하지 않음'}
                                </S.ConfirmValue>
                            </S.ConfirmItem>

                            <S.ConfirmItem>
                                <S.ConfirmLabel>출생 장소</S.ConfirmLabel>
                                <S.ConfirmValue>
                                    {country && city
                                        ? `${country}, ${city}`
                                        : '선택하지 않음'}
                                </S.ConfirmValue>
                            </S.ConfirmItem>
                        </S.ConfirmSection>
                    )}
                </S.Content>

                <S.ButtonGroup>
                    {step === 'input' ? (
                        <>
                            <S.Button onClick={onClose}>취소</S.Button>
                            <S.Button $primary onClick={handleNext}>
                                다음
                            </S.Button>
                        </>
                    ) : (
                        <>
                            <S.Button onClick={handleEdit}>수정하기</S.Button>
                            <S.Button $primary onClick={handleSubmit}>
                                확인
                            </S.Button>
                        </>
                    )}
                </S.ButtonGroup>
            </S.Container>

            {/* 음력 경고 모달 */}
            {showLunarWarning && (
                <S.WarningOverlay onClick={(e) => e.stopPropagation()}>
                    <S.WarningBox onClick={(e) => e.stopPropagation()}>
                        <S.WarningIcon>⚠️</S.WarningIcon>
                        <S.WarningTitle>음력 변환이 완료되지 않았습니다</S.WarningTitle>
                        <S.WarningMessage>
                            음력 정보가 없으면 사주 내용은 표시되지 않습니다.{'\n'}
                            이대로 진행하시겠습니까?{'\n\n'}
                            (별자리, 타로 등은 정상 출력됩니다)
                        </S.WarningMessage>
                        <S.WarningButtonGroup>
                            <S.WarningButton onClick={handleCancelLunarWarning}>
                                취소
                            </S.WarningButton>
                            <S.WarningButton $primary onClick={handleProceedWithoutLunar}>
                                진행
                            </S.WarningButton>
                        </S.WarningButtonGroup>
                    </S.WarningBox>
                </S.WarningOverlay>
            )}

            {/* 에러 모달 */}
            {showErrorModal && (
                <S.WarningOverlay onClick={(e) => e.stopPropagation()}>
                    <S.WarningBox onClick={(e) => e.stopPropagation()}>
                        <S.WarningIcon>⚠️</S.WarningIcon>
                        <S.WarningTitle>입력 오류</S.WarningTitle>
                        <S.WarningMessage>
                            {errorMessage}
                        </S.WarningMessage>
                        <S.WarningButtonGroup>
                            <S.WarningButton $primary onClick={() => setShowErrorModal(false)}>
                                확인
                            </S.WarningButton>
                        </S.WarningButtonGroup>
                    </S.WarningBox>
                </S.WarningOverlay>
            )}

            {/* 도시 검색 모달 */}
            {showCitySearchModal && (
                <S.CitySearchModalOverlay onClick={() => setShowCitySearchModal(false)}>
                    <S.CitySearchModalContainer onClick={(e) => e.stopPropagation()}>
                        <S.CitySearchModalHeader>
                            <S.CitySearchModalTitle>출생 도시 검색</S.CitySearchModalTitle>
                            <S.CloseButton onClick={() => setShowCitySearchModal(false)}>&times;</S.CloseButton>
                        </S.CitySearchModalHeader>
                        <S.CitySearchModalBody>
                            <S.CitySearchInput
                                type="text"
                                placeholder="예: 서울, Paris, つくば"
                                value={modalCityQuery}
                                onChange={(e) => setModalCityQuery(e.target.value)}
                                autoComplete="off"
                            />
                            <S.CitySearchResultsList>
                                {!modalCityQuery || modalCityQuery.trim().length < 2 ? (
                                    <S.CitySearchHelperText>
                                        태어난 도시를 모르시는 경우<br />
                                        태어난 국가의 수도를 입력하세요.
                                    </S.CitySearchHelperText>
                                ) : isSearchingCity ? (
                                    <S.CitySearchLoading>🔍 검색 중...</S.CitySearchLoading>
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
                                            <S.CitySearchItem
                                                key={index}
                                                onClick={() => handleCitySelect(suggestion)}
                                            >
                                                <S.CitySearchItemPrimary>{primary}</S.CitySearchItemPrimary>
                                                {secondary && (
                                                    <S.CitySearchItemSecondary>{secondary}</S.CitySearchItemSecondary>
                                                )}
                                            </S.CitySearchItem>
                                        );
                                    })
                                ) : (
                                    <S.CitySearchEmpty>검색 결과가 없습니다</S.CitySearchEmpty>
                                )}
                            </S.CitySearchResultsList>
                        </S.CitySearchModalBody>
                    </S.CitySearchModalContainer>
                </S.CitySearchModalOverlay>
            )}
        </S.Overlay>
    );
};

export default FortuneInputModal;
