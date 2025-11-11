// src/modules/calendar/alarm/components/AlarmItemComponent.jsx
// 개별 알람 아이템 컴포넌트 - 원본 레이아웃 기반

import React from 'react';
import { format } from 'date-fns';
import styled from 'styled-components';
import { AlarmClock } from 'lucide-react';
import { ALARM_COLORS, getDaysUntilAutoDelete } from '../';

const AlarmItem = styled.div`
  position: relative;
  background: ${props => {
    if (props.$isPending) return '#e9ecef';
    return '#f8f9fa';
  }};
  border: ${props => {
    if (props.$isModified) return `2px dashed ${ALARM_COLORS.danger}`;
    if (props.$isPending) return '2px dashed #adb5bd';
    return '1px solid #ced4da';
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

export const AlarmItemComponent = ({ alarm, scheduleData, onToggle, onDelete, onEdit }) => {
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
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
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
            // 반복 기념일 주기일: 🔄 아이콘 표시
            <div style={{
              fontSize: '14px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              marginTop: '2px'
            }}>
              🔄
            </div>
          ) : alarm.isAnniversary ? (
            // 등록일: '기' 뱃지 표시
            <div style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              marginTop: '4px'
            }}>
              <div style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: ALARM_COLORS.primary,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                fontWeight: 'bold'
              }}>
                기
              </div>
            </div>
          ) : (
            // 일반 알람: 자명종시계 아이콘 표시
            <div style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              marginTop: '4px'
            }}>
              <AlarmClock
                size={14}
                color="#d63031"
              />
            </div>
          )}

          {/* 타이틀 */}
          <div style={{
            fontSize: '15px',
            color: alarm.isAnniversary ? ALARM_COLORS.primary : '#495057',
            wordBreak: 'break-all',
            lineHeight: '1.3',
            maxWidth: '8em',
            display: 'inline-block',
            minHeight: 'calc(1.3em * 2)',
            marginTop: '2px'
          }}>
            {alarm.title || '제목 없음'}
            {/* 일반 알람이 토글 OFF && 경과 전일 때만 "일시중지" 표시 */}
            {!alarm.isAnniversary && alarm.enabled === false && !isExpired && (
              <span style={{ marginLeft: '6px', fontSize: '12px', color: '#999' }}>
                (일시중지)
              </span>
            )}
          </div>
        </div>

        {/* 시간 정보 */}
        <div style={{
          fontSize: '12px',
          color: ALARM_COLORS.muted
        }}>
          {alarm.isAnniversary ? (
            // 기념일 알람
            <>
              <div>등록일 {format(isRepeated && alarm.originalDate ? alarm.originalDate : alarm.calculatedTime, 'yyyy년 MM월 dd일')}</div>
              <div>
                알람시간 {format(alarm.calculatedTime, 'HH:mm')}
                {isRepeated ? (
                  <span style={{ fontSize: '11px', color: '#999' }}>
                    {' '}({alarm.anniversaryRepeat === 'daily' ? '매일' :
                      alarm.anniversaryRepeat === 'weekly' ? '매주' :
                      alarm.anniversaryRepeat === 'monthly' ? '매달' :
                      alarm.anniversaryRepeat === 'yearly' ? '매년' : ''})
                  </span>
                ) : hasRepeat && isRegisteredToday ? (
                  <span style={{ fontSize: '11px', color: '#999' }}> (직접등록)</span>
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
                  <span style={{ marginLeft: '6px', fontSize: '12px', color: ALARM_COLORS.danger }}>
                    종료
                  </span>
                  <span style={{ marginLeft: '4px', fontSize: '12px', color: ALARM_COLORS.muted }}>
                    /
                  </span>
                  <span style={{ marginLeft: '4px', fontSize: '11px', color: ALARM_COLORS.danger }}>
                    {daysUntilDelete !== null ? daysUntilDelete : 3}일 후 자동삭제
                  </span>
                </>
              )}
              {/* 토글 OFF && 경과 전일 때는 아무것도 표시하지 않음 (타이틀에 "일시중지"만 표시) */}
            </>
          )}
        </div>
      </AlarmInfo>

      {/* 변경사항 미적용 표시 */}
      {alarm.isModified && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          fontSize: '11px',
          color: ALARM_COLORS.danger,
          fontWeight: '600'
        }}>
          변경사항 미적용
        </div>
      )}

      {/* 액션 버튼 */}
      <AlarmActions>
        {isRepeated ? (
          // 반복 기념일: 버튼 없음 (토글만 가능)
          alarm.enabled !== false ? (
            <div style={{
              fontSize: '12px',
              color: '#999',
              textAlign: 'center',
              padding: '8px 0'
            }}>
              등록일에서<br/>수정/삭제 가능
            </div>
          ) : (
            // 일시중지 상태
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              color: '#999',
              padding: '4px 0'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="22" height="22" rx="3" stroke={ALARM_COLORS.primary} strokeWidth="2"/>
                <rect x="8" y="7" width="2.5" height="10" fill={ALARM_COLORS.primary}/>
                <rect x="13.5" y="7" width="2.5" height="10" fill={ALARM_COLORS.primary}/>
              </svg>
              <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
                <div>알람</div>
                <div>일시중지</div>
              </div>
            </div>
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
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13px',
                color: '#999',
                padding: '4px 0'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="22" height="22" rx="3" stroke={ALARM_COLORS.primary} strokeWidth="2"/>
                  <rect x="8" y="7" width="2.5" height="10" fill={ALARM_COLORS.primary}/>
                  <rect x="13.5" y="7" width="2.5" height="10" fill={ALARM_COLORS.primary}/>
                </svg>
                <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
                  <div>알람</div>
                  <div>일시중지</div>
                </div>
              </div>
            )}
          </>
        )}
      </AlarmActions>
    </AlarmItem>
  );
};
