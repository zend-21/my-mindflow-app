// src/components/FortuneInputModal.jsx

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getCountries, getCities } from '../utils/timeZoneData';
import { convertSolarToLunar, formatLunarDate } from '../utils/lunarConverter';

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

const UserNameDisplay = styled.div`
    padding: 12px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-size: 16px;
    background: #f7fafc;
    color: #555;
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

// 🎯 Main Component

const FortuneInputModal = ({ onClose, onSubmit, initialData = null, userName = '게스트', isEditMode = false, profile = null }) => {
    // 편집 모드이거나 initialData가 없으면 'input', 아니면 'confirm'
    const [step, setStep] = useState(isEditMode ? 'input' : (initialData ? 'confirm' : 'input')); // 'input' | 'confirm'

    // 사용자 입력 데이터
    const [birthYear, setBirthYear] = useState(initialData?.birthYear?.toString() || '');
    const [birthMonth, setBirthMonth] = useState(initialData?.birthMonth?.toString().padStart(2, '0') || '');
    const [birthDay, setBirthDay] = useState(initialData?.birthDay?.toString().padStart(2, '0') || '');
    const [gender, setGender] = useState(initialData?.gender || '여성');

    // 출생 시간 (선택 사항)
    const [hasBirthTime, setHasBirthTime] = useState(initialData?.birthHour !== undefined);
    const [birthHour, setBirthHour] = useState(initialData?.birthHour?.toString().padStart(2, '0') || '');
    const [birthMinute, setBirthMinute] = useState(initialData?.birthMinute?.toString().padStart(2, '0') || '');

    // 출생 장소 (선택 사항)
    const [hasBirthPlace, setHasBirthPlace] = useState(initialData?.country !== undefined);
    const [country, setCountry] = useState(initialData?.country || '대한민국');
    const [city, setCity] = useState(initialData?.city || '서울');

    // 음력 날짜 표시용
    const [lunarDate, setLunarDate] = useState('');

    // 국가 목록
    const countries = getCountries();

    // 선택된 국가의 도시 목록
    const cities = getCities(country);

    // 양력 → 음력 변환 (공공데이터포털 API 사용)
    useEffect(() => {
        const fetchLunarDate = async () => {
            if (birthYear && birthMonth && birthDay) {
                const year = parseInt(birthYear);
                const month = parseInt(birthMonth);
                const day = parseInt(birthDay);

                // 유효성 검사: 년도는 4자리, 월/일은 1-2자리 완성된 숫자여야 함
                if (!isNaN(year) && !isNaN(month) && !isNaN(day) &&
                    birthYear.length === 4 &&  // 년도 4자리 입력 완료
                    year >= 1900 && year <= 2050 &&
                    month >= 1 && month <= 12 &&
                    day >= 1 && day <= 31) {

                    const lunarData = await convertSolarToLunar(year, month, day);

                    if (lunarData) {
                        setLunarDate(formatLunarDate(lunarData));
                    } else {
                        setLunarDate('');
                    }
                } else {
                    setLunarDate('');
                }
            } else {
                setLunarDate('');
            }
        };

        // 디바운스: 500ms 후에 API 호출 (타이핑 중에는 호출 안 함)
        const timer = setTimeout(() => {
            fetchLunarDate();
        }, 500);

        return () => clearTimeout(timer);
    }, [birthYear, birthMonth, birthDay]);

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
            alert('생년월일은 필수 입력 사항입니다.');
            return;
        }

        setStep('confirm');
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
            gender
        };

        // 출생 시간 추가 (선택)
        if (hasBirthTime && birthHour && birthMinute) {
            userData.birthHour = parseInt(birthHour);
            userData.birthMinute = parseInt(birthMinute);
        }

        // 출생 장소 추가 (선택)
        if (hasBirthPlace) {
            userData.country = country;
            userData.city = city;
        }

        onSubmit(userData);
    };

    return (
        <Overlay onClick={onClose}>
            <Container onClick={(e) => e.stopPropagation()}>
                <Header>
                    <Title>🔮 운세 프로필 입력</Title>
                    <Subtitle>정확한 운세를 위해 정보를 입력해주세요</Subtitle>
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

                                {/* 음력 날짜 표시 (오른쪽 정렬) */}
                                <LunarDateDisplay style={{ marginTop: '8px', justifyContent: 'flex-end', paddingRight: '32px' }}>
                                    {lunarDate ? `(${lunarDate})` : '💡 음력 날짜 자동 계산됩니다.'}
                                </LunarDateDisplay>
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

                            {/* 출생 시간 (선택) */}
                            <div>
                                <CheckboxLabel>
                                    <input
                                        type="checkbox"
                                        checked={hasBirthTime}
                                        onChange={(e) => setHasBirthTime(e.target.checked)}
                                    />
                                    출생 시간 입력 (선택사항)
                                </CheckboxLabel>
                            </div>

                            {hasBirthTime && (
                                <>
                                    <InfoText style={{ marginTop: '-8px' }}>더 정확한 사주 분석을 위해 입력하세요</InfoText>
                                    <TimeInputGroup>
                                        <div>
                                            <Label>시</Label>
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
                                        </div>
                                        <div>
                                            <Label>분</Label>
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
                                        </div>
                                    </TimeInputGroup>
                                </>
                            )}

                            {/* 출생 장소 (선택) */}
                            <div>
                                <CheckboxLabel>
                                    <input
                                        type="checkbox"
                                        checked={hasBirthPlace}
                                        onChange={(e) => setHasBirthPlace(e.target.checked)}
                                    />
                                    출생 장소 입력 (선택사항)
                                </CheckboxLabel>
                            </div>

                            {hasBirthPlace && (
                                <>
                                    <InfoText style={{ marginTop: '-8px' }}>태양시 보정을 위해 입력하세요</InfoText>
                                    <div>
                                        <Label>국가</Label>
                                        <Select value={country} onChange={handleCountryChange}>
                                            {countries.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>도시</Label>
                                        <Select value={city} onChange={(e) => setCity(e.target.value)}>
                                            {cities.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </Select>
                                    </div>
                                </>
                            )}

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
                                <ConfirmTitle>입력하신 정보를 확인해주세요</ConfirmTitle>

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
                                        <ConfirmValue style={{ fontSize: '13px', color: '#667eea' }}>{lunarDate}</ConfirmValue>
                                    </ConfirmItem>
                                )}

                                <ConfirmItem>
                                    <ConfirmLabel>성별</ConfirmLabel>
                                    <ConfirmValue>{gender}</ConfirmValue>
                                </ConfirmItem>

                                <ConfirmItem>
                                    <ConfirmLabel>출생 시간</ConfirmLabel>
                                    <ConfirmValue>
                                        {hasBirthTime && birthHour && birthMinute
                                            ? `${birthHour}시 ${birthMinute}분`
                                            : '선택하지 않음'}
                                    </ConfirmValue>
                                </ConfirmItem>

                                <ConfirmItem>
                                    <ConfirmLabel>출생 장소</ConfirmLabel>
                                    <ConfirmValue>
                                        {hasBirthPlace
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
        </Overlay>
    );
};

export default FortuneInputModal;
