import styled from 'styled-components';
import { motion } from 'framer-motion';

// 삭제 버튼
export const DeleteButton = styled.button`
  background-color: #5089dfff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: background-color 0.2s ease;
  margin-bottom: 12px;

  &:hover {
    background-color: #5089dfff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// 버튼 그룹
export const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 10px;
`;

// 확인 모달 스타일
export const ConfirmOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 11000;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

export const ConfirmModalBox = styled.div`
  background: #2a2d35;
  border-radius: 12px;
  padding: 24px 30px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  width: 90vw;
  max-width: 350px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: slideUp 0.2s cubic-bezier(0.2, 0, 0, 1);

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

export const ConfirmMessage = styled.p`
  font-size: 16px;
  color: #e0e0e0;
  margin: 0;
  line-height: 1.5;
  text-align: center;
  word-break: keep-all;
`;

export const ConfirmButtonWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  width: 100%;

  & > button {
    flex: 1;
  }
`;

export const ConfirmCancelButton = styled.button`
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background: #3b78c4;
  }

  &:focus {
    outline: none;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.6);
  }
`;

export const ConfirmButton = styled.button`
  background: #e2e8f0;
  color: #4a5568;
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;

  &:focus {
    outline: none;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(150, 160, 170, 0.6);
  }
`;

// 캘린더 래퍼
export const CalendarWrapper = styled.div`
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    padding: 14px;
    background-color: #2a2d35;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    position: relative;

    @media (min-width: 768px) {
        max-width: 95%;
        padding: 24px;
    }

    @media (min-width: 1024px) {
        max-width: 100%;
        padding: 32px;
    }

    @media (min-width: 1440px) {
        max-width: 100%;
        padding: 40px;
    }
`;

// 헤더
export const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    /* 큰 화면에서 여백 증가 */
    @media (min-width: 768px) {
        margin-bottom: 12px;
    }

    @media (min-width: 1024px) {
        margin-bottom: 16px;
    }
`;

// 네비게이션 컨테이너
export const NavContainer = styled.div`
    display: flex;
    align-items: center;
`;

// 네비게이션 버튼
export const NavButton = styled.button`
    background: none;
    border: none;
    font-size: 24px;
    color: #4a90e2;
    cursor: pointer;
    padding: 0 18px;
    border-radius: 50%;
    transition: background-color 0.2s ease;

    &:hover {
        background-color: #f0f4ff;
    }
`;

// 오늘 가기 버튼
export const GoToTodayButton = styled.button`
    background-color: #4a90e2;
    color: #fff;
    border: none;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    /* 반응형 크기 */
    @media (min-width: 768px) {
        padding: 8px 16px;
        font-size: 16px;
        border-radius: 24px;
    }

    @media (min-width: 1024px) {
        padding: 10px 20px;
        font-size: 18px;
        border-radius: 28px;
    }

    &:hover {
        background-color: #4a90e2;
    }

    ${props => props.$notTodaySelected ? `
        background-color: #ffffff !important;
        border: 2px solid #4a90e2 !important;
        color: #333333 !important;
    ` : ''}

    ${props => props.$isTodaySelected ? `
        background-color: #4a90e2 !important;
        border: 2px solid #4a90e2 !important;
        color: #fff !important;
    ` : ''}
`;

// 월 표시
export const MonthDisplay = styled.div`
    font-size: 20px;
    font-weight: 800;
    color: #e0e0e0;
    cursor: pointer;
    margin: 0 8px;

    /* 반응형 폰트 크기 */
    @media (min-width: 768px) {
        font-size: 24px;
        margin: 0 12px;
    }

    @media (min-width: 1024px) {
        font-size: 28px;
        margin: 0 16px;
    }

    &:hover {
        color: #4a90e2;
    }
`;

// 요일 헤더
export const Weekdays = styled.div`
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    font-weight: 600;
    color: #b0b0b0;
    margin-bottom: 8px;
    gap: 0;
`;

// 요일
export const Day = styled.div`
    font-size: 18px;
    padding: 8px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 30px;

    /* 반응형 폰트 크기 */
    @media (min-width: 768px) {
        font-size: 20px;
        height: 36px;
        padding: 10px 0;
    }

    @media (min-width: 1024px) {
        font-size: 22px;
        height: 42px;
        padding: 12px 0;
    }

    &:nth-child(1) { color: red; }
    &:nth-child(7) { color: #3399ff; }
`;

// 캘린더 컨테이너 (애니메이션)
export const CalendarContainer = styled(motion.div)`
  position: relative;
  overflow: hidden;
`;

// 캘린더 페이지 (애니메이션)
export const CalendarPage = styled(motion.div)`
  width: 100%;
`;

// 날짜 그리드
export const DatesGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2;
    padding: 0 1px 1px;

    /* 큰 화면에서 간격 증가 */
    @media (min-width: 768px) {
        gap: 4px;
        padding: 0 2px 2px;
    }

    @media (min-width: 1024px) {
        gap: 6px;
        padding: 0 3px 3px;
    }
`;

// 날짜 셀
export const DateCell = styled.div`
    width: 100%;
    aspect-ratio: 1 / 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
    transition: all 0.2s ease;
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.04);
    box-sizing: border-box;
    padding: 2px;
    overflow: visible;
    background-color: #333842;

    /* 반응형 폰트 크기 */
    @media (min-width: 768px) {
        font-size: 18px;
        border-radius: 10px;
        padding: 4px;
    }

    @media (min-width: 1024px) {
        font-size: 20px;
        border-radius: 12px;
        padding: 6px;
    }

    @media (min-width: 1440px) {
        font-size: 22px;
    }

    color: ${props => {
        if (props.$isToday && props.$isSelected) {
            return 'white';
        }

        if (props.$isSelected && !props.$isToday) {
            if (!props.$isCurrentMonth) {
                if (props.$isNationalHoliday || props.$dateDay === 0) {
                    return 'rgba(255, 100, 100, 0.5)';
                }
                if (props.$dateDay === 6) {
                    return 'rgba(100, 180, 255, 0.5)';
                }
                return '#808080';
            }
            else {
                if (props.$dateDay === 0) {
                    return '#ff6b6b';
                }
                if (props.$dateDay === 6) {
                    return '#5bb4ff';
                }
                if (props.$isNationalHoliday) {
                    return '#ff6b6b';
                }
                return '#e0e0e0';
            }
        }

        if (props.$isCurrentMonth && props.$isNationalHoliday && props.$dateDay !== 0) {
            return '#ff6b6b';
        }

        if (props.$isCurrentMonth && props.$dateDay === 0) {
            return '#ff6b6b';
        }

        if (props.$isCurrentMonth) {
            return '#e0e0e0';
        }

        if (props.$isNationalHoliday || props.$dateDay === 0) {
            return 'rgba(255, 100, 100, 0.5)';
        }

        return '#808080';
    }};

    &:nth-child(7n) {
                color: ${props => props.$isCurrentMonth ? '#5bb4ff' : 'rgba(100, 180, 255, 0.5)'};
    }

    &:hover {
        transform: scale(1.05);
        background-color: #3d424d;
    }

    ${props => props.$isToday && props.$isSelected ? `
        background-color: #4a90e2 !important;
        color: white !important;
        font-weight: 700;
        border: 1px solid #4a90e2 !important;

        &:nth-child(7n+1), &:nth-child(7n) {
            color: white !important;
        }

        &:hover {
            background-color: #357abd !important;
            transform: scale(1.05);
        }
    ` : ''}

    ${props => props.$isSelected && !props.$isToday ? `
        background-color: transparent !important;
        box-shadow: inset 0 0 0 2px red !important;
        font-weight: 700;

        &:nth-child(7n) {
        color: ${props.$isCurrentMonth ? '#3399ff' : 'rgba(51, 153, 255, 0.4)'} !important;
        }
    ` : ''}

    ${props => props.$isToday && !props.$isSelected ? `
        background-color: rgba(70, 179, 255, 0.08) !important;
        border: 1px solid #70b3ffff !important;
        font-weight: 700;
    ` : ''}

    ${props => {
        const hasSchedule = props.$hasSchedule;
        const hasAlarm = props.$hasAlarm;
        const hasActiveAlarm = props.$hasActiveAlarm;
        const isCurrentMonth = props.$isCurrentMonth;
        const isPastDate = props.$isPastDate;

        // 일정 점: 파란색 (dodgerblue)
        // - 지나간 일정: 흐린 파란색 (시간 지나도 유지, 삭제 안 됨)
        let scheduleColor;
        if (isPastDate) {
            scheduleColor = 'rgba(30, 144, 255, 0.3)'; // 지나간 일정: 흐린 파란색
        } else {
            scheduleColor = isCurrentMonth ? 'dodgerblue' : 'rgba(30, 144, 255, 0.4)';
        }

        // 알람 점: 빨간색 (tomato)
        // - 과거 날짜이거나 활성 알람이 없으면 (모두 종료): 흐린 빨간색
        // - 활성 알람이 있고 미래/오늘 날짜: 현재 달은 진한 빨강, 다른 달은 중간 빨강
        let alarmColor;
        if (isPastDate || !hasActiveAlarm) {
            alarmColor = 'rgba(255, 99, 71, 0.3)'; // 과거 날짜 또는 종료된 알람: 흐린 빨간색
        } else {
            alarmColor = isCurrentMonth ? 'tomato' : 'rgba(255, 99, 71, 0.4)';
        }

        if (hasSchedule && hasAlarm) {
            // 둘 다 있을 때: 상단에 나란히 5px 간격으로 배치 (등록 순서 무관, 항상 일정→알람 순서)
            return `
                &::after {
                    content: '';
                    position: absolute;
                    top: 3px;
                    left: 50%;
                    transform: translateX(-7.5px); /* 일정 점 - 왼쪽(앞) */
                    width: 5px;
                    height: 5px;
                    background-color: ${scheduleColor};
                    border-radius: 50%;
                }
                &::before {
                    content: '';
                    position: absolute;
                    top: 3px;
                    left: 50%;
                    transform: translateX(2.5px); /* 알람 점 - 오른쪽(뒤) */
                    width: 5px;
                    height: 5px;
                    background-color: ${alarmColor};
                    border-radius: 50%;
                }
            `;
        } else if (hasSchedule) {
            // 일정만 있을 때: 상단 중앙에 파란색 점
            return `
                &::after {
                    content: '';
                    position: absolute;
                    top: 3px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 5px;
                    height: 5px;
                    background-color: ${scheduleColor};
                    border-radius: 50%;
                }
            `;
        } else if (hasAlarm) {
            // 알람만 있을 때: 상단 중앙에 빨간색 점
            return `
                &::before {
                    content: '';
                    position: absolute;
                    top: 3px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 5px;
                    height: 5px;
                    background-color: ${alarmColor};
                    border-radius: 50%;
                }
            `;
        }
        return '';
    }}
`;

// 일정 컨테이너
export const ScheduleContainer = styled.div`
    margin-top: 12px;
    padding: 18px;
    background-color: #333842;
    border-radius: 12px;
    text-align: center;
    color: #b0b0b0;
    font-size: 16px;

    /* 반응형 패딩과 폰트 크기 */
    @media (min-width: 768px) {
        margin-top: 16px;
        padding: 24px;
        font-size: 18px;
        border-radius: 16px;
    }

    @media (min-width: 1024px) {
        margin-top: 20px;
        padding: 32px;
        font-size: 20px;
        border-radius: 20px;
    }
`;

// 작은 노트
export const SmallNote = styled.div`
    font-size: 12px;
    color: #b0b0b0;
    margin-top: 6px;
`;

// 일정 입력
export const ScheduleInput = styled.div`
    margin-top: 12px;
    max-height: 180px;
    min-height: 180px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    background-color: ${props => props.$isPastDate ? '#2a2d35' : '#333842'};
    position: relative;
    box-sizing: border-box;

    /* 반응형 높이와 간격 */
    @media (min-width: 768px) {
        margin-top: 16px;
        max-height: 220px;
        min-height: 220px;
        gap: 12px;
        border-radius: 12px;
        border-width: 2px;
    }

    @media (min-width: 1024px) {
        margin-top: 20px;
        max-height: 280px;
        min-height: 280px;
        gap: 16px;
        border-radius: 16px;
    }

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: ${props => props.$isEditing ? 'none' : 'auto'};
        cursor: pointer;
    }

    .content-wrapper {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 14px;
        width: 100%;
        align-items: stretch;
        text-align: left;
        display: ${props => props.$isEditing ? 'none' : 'flex'};
        min-height: 180px;
        padding-top: 5px;

        @media (min-width: 768px) {
            font-size: 16px;
            min-height: 220px;
            gap: 6px;
        }

        @media (min-width: 1024px) {
            font-size: 18px;
            min-height: 280px;
            gap: 8px;
        }
    }

    .special-event-note {
        color: #e0e0e0;
        font-weight: 600;
        font-size: 14px;
        line-height: 1.5;
        margin-bottom: 5px;
        border-bottom: 1px dashed rgba(255, 255, 255, 0.2);
        padding-bottom: 5px;
        text-align: center;
        width: 100%;
        word-break: keep-all;
        word-wrap: break-word;
        overflow-wrap: break-word;
        white-space: normal;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0;

        span {
            display: inline-block;
        }

        @media (min-width: 768px) {
            font-size: 16px;
            margin-bottom: 8px;
            padding-bottom: 8px;
        }

        @media (min-width: 1024px) {
            font-size: 18px;
            margin-bottom: 10px;
            padding-bottom: 10px;
        }
    }

    .placeholder-note {
        color: #808080;
        font-size: 14px;
        text-align: center;
        padding-top: 10px;
        width: 100%;
    }

    .textarea {
        padding: 6px;
        border: none;
        width: 100%;
        font-size: 16px;
        resize: vertical;
        background-color: transparent;
        outline: none;
        user-select: auto;
        display: ${props => props.$isEditing ? 'block' : 'none'};
        box-sizing: border-box;
        text-align: left;
        padding-bottom: 12px;
        color: #e0e0e0;

        @media (min-width: 768px) {
            font-size: 18px;
            padding: 8px;
            padding-bottom: 16px;
        }

        @media (min-width: 1024px) {
            font-size: 20px;
            padding: 10px;
            padding-bottom: 20px;
        }

        ${props => props.$isHolidayText && `
            font-weight: bold;
            text-align: center;
        `}
    }

    .content-wrapper > * {
        width: 100%;
        display: block;
    }

    .buttons {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        margin-top: 6px;
        display: ${props => props.$isEditing ? 'flex' : 'none'};
    }

    .buttons button {
        background-color: #4a90e2;
        color: white;
        border: none;
        padding: 8px 14px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;

        &:hover {
            background-color: #357abd;
        }

        &:disabled {
            opacity: 0.45;
            cursor: not-allowed;
        }
    }
`;

// 로딩 인디케이터
export const LoadingIndicator = styled.div`
    position: absolute;
    top: 15px;
    right: 15px;
    font-size: 20px;
    z-index: 10;
    animation: spin 1s linear infinite;

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
`;

// 에러 인디케이터
export const ErrorIndicator = styled.div`
    position: absolute;
    top: 15px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 11px;
    color: #ff6b6b;
    background: rgba(42, 45, 53, 0.95);
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid #ff6b6b;
    max-width: 80%;
    text-align: center;
`;
