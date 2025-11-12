// src/modules/calendar/alarm/components/AlarmItemComponent.jsx
// 개별 알람 아이템 컴포넌트 - 원본 레이아웃 기반

import React, { memo } from 'react';
import { format } from 'date-fns';
import styled from 'styled-components';
import { AlarmClock, Repeat } from 'lucide-react';
import { ALARM_COLORS, getDaysUntilAutoDelete } from '../';

const AlarmItem = styled.div`
  position: relative;
  background: ${props => {
    if (props.$isPending) return '#3d424d';
    return '#4a5058';
  }};
  border: ${props => {
    if (props.$isModified) return `2px dashed ${ALARM_COLORS.danger}`;
    if (props.$isPending) return '2px dashed rgba(255, 255, 255, 0.2)';
    return '1px solid rgba(255, 255, 255, 0.15)';
  }};
  border-radius: 8px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  opacity: ${props => props.$isExpired ? 0.5 : 1};
`;

const AlarmInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  margin-right: 8px;
  flex-shrink: 0;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #888;
    transition: 0.3s;
    border-radius: 24px;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }

  input:checked + .slider {
    background-color: ${ALARM_COLORS.primary};
  }

  input:checked + .slider:before {
    transform: translateX(20px);
  }

  input:disabled + .slider {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AlarmActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
`;

const EditButton = styled.button`
  background: #ffc107;
  color: #212529;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e0a800;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DeleteButton = styled.button`
  background: ${ALARM_COLORS.danger};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #c82333;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ApplyButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0056b3;
  }
`;

const TitleContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 4px;
`;

const IconWrapper = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  margin-top: 4px;
`;

const BadgeIcon = styled.div`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: ${ALARM_COLORS.primary};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: bold;
`;

const TitleText = styled.div`
  font-size: 15px;
  color: ${props => props.$isAnniversary ? ALARM_COLORS.primary : '#d0d0d0'};
  word-break: break-all;
  line-height: 1.3;
  max-width: 8em;
  display: inline-block;
  min-height: calc(1.3em * 2);
  margin-top: 2px;
`;

const PausedLabel = styled.span`
  margin-left: 6px;
  font-size: 12px;
  color: #808080;
`;

const TimeInfo = styled.div`
  font-size: 12px;
  color: ${ALARM_COLORS.muted};
`;

const ExpiredLabel = styled.span`
  margin-left: 6px;
  font-size: 12px;
  color: #ff6b6b;
`;

const Separator = styled.span`
  margin-left: 4px;
  font-size: 12px;
  color: ${ALARM_COLORS.muted};
`;

const AutoDeleteLabel = styled.span`
  margin-left: 4px;
  font-size: 11px;
  color: #ff6b6b;
`;

const ModifiedBadge = styled.div`
  position: absolute;
  bottom: 12px;
  right: 12px;
  font-size: 11px;
  color: ${ALARM_COLORS.danger};
  font-weight: 600;
`;

const RepeatText = styled.div`
  font-size: 12px;
  color: #808080;
  text-align: center;
  padding: 8px 0;
`;

const PauseIcon = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #808080;
  padding: 4px 0;
`;

const PauseIconText = styled.div`
  text-align: center;
  line-height: 1.3;
`;

const RepeatLabel = styled.span`
  font-size: 11px;
  color: #808080;
`;

const AlarmItemComponent = ({ alarm, scheduleData, onToggle, onDelete, onEdit }) => {
  // 반복 표시인지 확인 (getRepeatedAnniversaries에서 추가한 플래그)
  const isRepeated = alarm.isRepeated === true;

  // 등록일과 현재 보는 날짜 비교
  const alarmDateStr = format(alarm.calculatedTime, 'yyyy-MM-dd');
  const currentDateStr = format(scheduleData.date, 'yyyy-MM-dd');
  const isRegisteredToday = alarmDateStr === currentDateStr;
  const hasRepeat = alarm.anniversaryRepeat && alarm.anniversaryRepeat !== 'none';

  // 알람 시간이 경과되었는지 확인
  const now = new Date();
  const alarmTime = new Date(alarm.calculatedTime);
  const isExpired = alarmTime < now;

  // 일반 알람의 자동삭제까지 남은 일수 (경과된 경우에만)
  const daysUntilDelete = !alarm.isAnniversary && isExpired ? getDaysUntilAutoDelete(alarm) : null;

  // 흐릿하게 표시할 조건
  // 1. 토글 OFF + 경과 전: 흐릿 + "일시중지" + 시간 뒤 표시 없음
  // 2. 토글 OFF + 경과 후: 흐릿 + 붉은색 "종료" + "0일 후 자동삭제"
  // 3. 토글 ON + 경과 후: 흐릿 + 붉은색 "종료" + "0일 후 자동삭제"
  // 4. 토글 ON + 경과 전: 선명 표시
  const shouldDim = !alarm.isAnniversary && (
    (alarm.enabled === false && !isExpired) || // 케이스 1: 토글 OFF && 경과 전
    isExpired // 케이스 2, 3: 경과 후 (토글 상태 무관)
  );

  return (
    <AlarmItem
      $isPending={false}
      $enabled={alarm.enabled}
      $isModified={alarm.isModified}
      $isExpired={shouldDim}
    >
      <AlarmInfo>
        <TitleContainer>
          {/* 토글 스위치 - 항상 선명하게 표시 */}
          <ToggleSwitch>
            <input
              type="checkbox"
              checked={alarm.enabled !== false}
              onChange={() => onToggle && onToggle(alarm.id)}
            />
            <span className="slider"></span>
          </ToggleSwitch>

          {/* 기념일/반복/일반 알람 아이콘 */}
          {isRepeated ? (
            // 반복 기념일 주기일: Repeat 아이콘 표시
            <IconWrapper>
              <Repeat
                size={14}
                color={ALARM_COLORS.primary}
              />
            </IconWrapper>
          ) : alarm.isAnniversary ? (
            // 등록일: '기' 뱃지 표시
            <IconWrapper>
              <BadgeIcon>
                기
              </BadgeIcon>
            </IconWrapper>
          ) : (
            // 일반 알람: 자명종시계 아이콘 표시
            <IconWrapper>
              <AlarmClock
                size={14}
                color="#ff6b6b"
              />
            </IconWrapper>
          )}

          {/* 타이틀 */}
          <TitleText $isAnniversary={alarm.isAnniversary}>
            {alarm.title || '제목 없음'}
            {/* 일반 알람이 토글 OFF && 경과 전일 때만 "일시중지" 표시 */}
            {!alarm.isAnniversary && alarm.enabled === false && !isExpired && (
              <PausedLabel>
                (일시중지)
              </PausedLabel>
            )}
          </TitleText>
        </TitleContainer>

        {/* 시간 정보 */}
        <TimeInfo>
          {alarm.isAnniversary ? (
            // 기념일 알람
            <>
              <div>등록일 {format(isRepeated && alarm.originalDate ? alarm.originalDate : alarm.calculatedTime, 'yyyy년 MM월 dd일')}</div>
              <div>
                알람시간 {format(alarm.calculatedTime, 'HH:mm')}
                {isRepeated ? (
                  <RepeatLabel>
                    {' '}({alarm.anniversaryRepeat === 'daily' ? '매일' :
                      alarm.anniversaryRepeat === 'weekly' ? '매주' :
                      alarm.anniversaryRepeat === 'monthly' ? '매달' :
                      alarm.anniversaryRepeat === 'yearly' ? '매년' : ''})
                  </RepeatLabel>
                ) : hasRepeat && isRegisteredToday ? (
                  <RepeatLabel> (직접등록)</RepeatLabel>
                ) : null}
              </div>
            </>
          ) : (
            // 일반 알람
            <>
              {format(alarm.calculatedTime, 'HH시 mm분')}
              {/* 시간 경과 시에만 "종료" 및 자동삭제 표시 (토글 상태 무관) */}
              {isExpired && (
                <>
                  <ExpiredLabel>
                    종료
                  </ExpiredLabel>
                  <Separator>
                    /
                  </Separator>
                  <AutoDeleteLabel>
                    {daysUntilDelete !== null ? daysUntilDelete : 3}일 후 자동삭제
                  </AutoDeleteLabel>
                </>
              )}
              {/* 토글 OFF && 경과 전일 때는 아무것도 표시하지 않음 (타이틀에 "일시중지"만 표시) */}
            </>
          )}
        </TimeInfo>
      </AlarmInfo>

      {/* 변경사항 미적용 표시 */}
      {alarm.isModified && (
        <ModifiedBadge>
          변경사항 미적용
        </ModifiedBadge>
      )}

      {/* 액션 버튼 */}
      <AlarmActions>
        {isRepeated ? (
          // 반복 기념일: 버튼 없음 (토글만 가능)
          alarm.enabled !== false ? (
            <RepeatText>
              등록일에서<br/>수정/삭제 가능
            </RepeatText>
          ) : (
            // 일시중지 상태
            <PauseIcon>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="22" height="22" rx="3" stroke={ALARM_COLORS.primary} strokeWidth="2"/>
                <rect x="8" y="7" width="2.5" height="10" fill={ALARM_COLORS.primary}/>
                <rect x="13.5" y="7" width="2.5" height="10" fill={ALARM_COLORS.primary}/>
              </svg>
              <PauseIconText>
                <div>알람</div>
                <div>일시중지</div>
              </PauseIconText>
            </PauseIcon>
          )
        ) : (
          // 원본 기념일 또는 일반 알람
          <>
            {alarm.enabled !== false ? (
              <>
                {/* 일반 알람이 종료된 경우 삭제 버튼만 표시 */}
                {!alarm.isAnniversary && isExpired ? (
                  <DeleteButton
                    onClick={() => onDelete(alarm)}
                  >
                    삭제
                  </DeleteButton>
                ) : (
                  <>
                    {alarm.isModified ? (
                      <ApplyButton onClick={() => onEdit && onEdit(alarm)}>
                        적용
                      </ApplyButton>
                    ) : (
                      <EditButton
                        onClick={() => onEdit && onEdit(alarm)}
                      >
                        수정
                      </EditButton>
                    )}
                    <DeleteButton
                      onClick={() => onDelete(alarm)}
                    >
                      삭제
                    </DeleteButton>
                  </>
                )}
              </>
            ) : (
              // 일시중지 상태
              <PauseIcon>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="22" height="22" rx="3" stroke={ALARM_COLORS.primary} strokeWidth="2"/>
                  <rect x="8" y="7" width="2.5" height="10" fill={ALARM_COLORS.primary}/>
                  <rect x="13.5" y="7" width="2.5" height="10" fill={ALARM_COLORS.primary}/>
                </svg>
                <PauseIconText>
                  <div>알람</div>
                  <div>일시중지</div>
                </PauseIconText>
              </PauseIcon>
            )}
          </>
        )}
      </AlarmActions>
    </AlarmItem>
  );
};

// React.memo로 컴포넌트 최적화 - props가 변경되지 않으면 리렌더링하지 않음
const MemoizedAlarmItemComponent = memo(AlarmItemComponent);
export { MemoizedAlarmItemComponent as AlarmItemComponent };
export default MemoizedAlarmItemComponent;
