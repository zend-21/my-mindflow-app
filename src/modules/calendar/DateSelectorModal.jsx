import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import Portal from '../../components/Portal';

// 애니메이션 정의
const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const slideUp = keyframes`
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
`;

// 모달 스타일 정의
const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 12001;
    animation: ${fadeIn} 0.2s ease-out;
    padding: 20px;
    overflow: hidden; 
`;

const ModalContent = styled.div`
    background: #2a2d35;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
    animation: ${slideUp} 0.3s cubic-bezier(0.2, 0, 0, 1);
    width: 100%;
    max-width: 400px;
    height: 90vh; /* 고정 높이로 변경 */
    max-height: 600px; /* 최대 높이 제한 */
    overflow: hidden; /* 모달 컨텐츠 자체의 스크롤 방지 */
    display: flex;
    flex-direction: column;
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-shrink: 0;
`;

const Title = styled.h3`
    font-size: 18px;
    font-weight: 600;
    color: #e0e0e0;
    margin: 0;
`;

const CurrentSelection = styled.div`
    font-size: 20px;
    color: #4a90e2;
    font-weight: 600;
    animation: pulse 2s ease-in-out infinite;
    
    @keyframes pulse {
        0% {
            transform: scale(1);
            opacity: 1;
        }
        50% {
            transform: scale(1.05);
            opacity: 0.8;
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }
`;

const ViewToggle = styled.div`
    display: flex;
    background: #333842;
    border-radius: 12px;
    padding: 4px;
    margin-bottom: 20px;
    flex-shrink: 0;
`;

const ToggleButton = styled.button`
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    
    ${props => props.$active ? `
        background-color: #4a90e2;
        color: white;
    ` : `
        background-color: transparent;
        color: #b0b0b0;
    `}
`;

const GridContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(${props => props.$columns}, 1fr);
    gap: 12px;
    margin-bottom: 24px;
    max-height: 300px;
    overflow-y: auto;
    min-height: 300px;
`;

const GridItem = styled.button`
    padding: 16px 8px;
    border: 2px solid ${props => props.$selected ? '#4a90e2' : 'rgba(255, 255, 255, 0.1)'};
    border-radius: 12px;
    background-color: ${props => props.$selected ? '#3d424d' : '#333842'};
    color: ${props => props.$selected ? '#4a90e2' : '#e0e0e0'};
    font-size: 16px;
    font-weight: ${props => props.$selected ? '700' : '500'};
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        border-color: #4a90e2;
        background-color: ${props => props.$selected ? '#3d424d' : '#3d424d'};
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const ButtonGroup = styled.div`
    display: flex;
    justify-content: flex-start;   /* 버튼 왼쪽 정렬 */
    gap: 20px;                     /* 버튼 사이 간격 넓힘 */
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const Button = styled.button`
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
    min-width: 80px;
`;

const CancelButton = styled(Button)`
    background-color: #333842;
    color: #e0e0e0;
    &:hover {
        background-color: #3d424d;
    }
`;

const ConfirmButton = styled(Button)`
    background-color: #4a90e2;
    color: #fff;
    &:hover {
        background-color: #357abd;
    }
`;

const QuickSelectContainer = styled.div`
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    flex-wrap: wrap;
`;

const QuickSelectButton = styled.button`
    padding: 8px 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    background-color: #333842;
    color: #e0e0e0;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        border-color: #4a90e2;
        color: #4a90e2;
        background-color: #3d424d;
    }
`;

const ImprovedDateSelector = ({ 
    isOpen, 
    onClose, 
    onSelect, 
    initialYear, 
    initialMonth 
}) => {
    const today = new Date();
    const [view, setView] = useState('year'); // 'year' or 'month'
    const yearRefs = useRef({});
    const [selectedYear, setSelectedYear] = useState(initialYear || today.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(initialMonth !== undefined ? initialMonth : today.getMonth());
    
    // 년도 범위: 현재년도 기준 ±30년
    const years = Array.from({ length: 2130 - 1931 + 1 }, (_, i) => 1931 + i);
    
    const months = [
        '1월', '2월', '3월', '4월', '5월', '6월',
        '7월', '8월', '9월', '10월', '11월', '12월'
    ];

    useEffect(() => {
    if (isOpen) {
        document.body.style.overflow = 'hidden';
        setView('year'); 
        if (initialYear) setSelectedYear(initialYear);
        if (initialMonth !== undefined) setSelectedMonth(initialMonth);
        // ✅ 모달 열릴 때 올해 중앙으로
        setTimeout(() => scrollToYear(today.getFullYear()), 50);
    } else {
        document.body.style.overflow = 'unset';
    }
    return () => {
        document.body.style.overflow = 'unset';
    };
    }, [isOpen, initialYear, initialMonth]);

    const handleQuickSelect = (type) => {
    const now = new Date();
    switch (type) {
        case 'today':
        setSelectedYear(now.getFullYear());
        setSelectedMonth(now.getMonth());
        setView('year'); 
        setTimeout(() => scrollToYear(now.getFullYear()), 50); // ✅ 스크롤 중앙 이동
        break;
        case 'nextMonth':
        const next = new Date(selectedYear, selectedMonth + 1);
        setSelectedYear(next.getFullYear());
        setSelectedMonth(next.getMonth());
        break;
        case 'prevMonth':
        const prev = new Date(selectedYear, selectedMonth - 1);
        setSelectedYear(prev.getFullYear());
        setSelectedMonth(prev.getMonth());
        break;
    }
    };

    const scrollToYear = (year) => {
    const el = yearRefs.current[year];
    if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    };

    const handleYearSelect = (year) => {
    setSelectedYear(year);
    setView('month'); 
    };

    const handleMonthSelect = (monthIndex) => {
        setSelectedMonth(monthIndex);
    };

    const handleConfirm = () => {
    if (view === "year") {
        setView("month");
    } else if (view === "month") {
        onSelect(selectedYear, selectedMonth);
        onClose();
    }
    };

    useEffect(() => {
    if (view === "year") {
        setTimeout(() => scrollToYear(selectedYear), 50);
    }
    }, [view, selectedYear]);

    if (!isOpen) return null;

    return (
        <Portal>
            <Overlay onClick={onClose}>
                <ModalContent onClick={e => e.stopPropagation()}>
                    <ModalHeader>
                        <Title>날짜 선택</Title>
                        <CurrentSelection>
                            {selectedYear}년 {selectedMonth + 1}월
                        </CurrentSelection>
                    </ModalHeader>

                    <QuickSelectContainer>
                        <QuickSelectButton onClick={() => handleQuickSelect('today')}>오늘로</QuickSelectButton>
                        <QuickSelectButton onClick={() => handleQuickSelect('prevMonth')}>이전 달</QuickSelectButton>
                        <QuickSelectButton onClick={() => handleQuickSelect('nextMonth')}>다음 달</QuickSelectButton>
                    </QuickSelectContainer>

                    <ViewToggle>
                        <ToggleButton 
                            $active={view === 'year'}
                            onClick={() => setView('year')}
                        >
                            년도
                        </ToggleButton>
                        <ToggleButton 
                            $active={view === 'month'}
                            onClick={() => setView('month')}
                        >
                            월
                        </ToggleButton>
                    </ViewToggle>

                    {view === 'year' ? (
                        <GridContainer $columns={4}>
                            {years.map(year => (
                                <GridItem
                                    key={year}
                                    ref={el => (yearRefs.current[year] = el)}
                                    $selected={year === selectedYear}
                                    onClick={() => handleYearSelect(year)}
                                >
                                    {year}
                                </GridItem>
                            ))}
                        </GridContainer>
                    ) : (
                        <GridContainer $columns={3}>
                            {months.map((monthName, index) => (
                                <GridItem
                                    key={index}
                                    $selected={index === selectedMonth}
                                    onClick={() => handleMonthSelect(index)}
                                >
                                    {monthName}
                                </GridItem>
                            ))}
                        </GridContainer>
                    )}

                    <ButtonGroup>
                        <ConfirmButton onClick={handleConfirm}>확인</ConfirmButton>
                        <CancelButton onClick={onClose}>취소</CancelButton>
                    </ButtonGroup>
                </ModalContent>
            </Overlay>
        </Portal>
    );
};

export default ImprovedDateSelector;
