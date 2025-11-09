import React from 'react';
import { format } from 'date-fns';
import { ALARM_COLORS } from '../constants';

/**
 * 기념일 알람 아이템 컴포넌트
 * - 등록일 당일: 제목 + "(당일 등록)" 표시
 * - 반복 표시: 제목 + 🔄 + 등록일 + 수정 버튼
 */
const AnniversaryAlarmItem = ({
  alarm,
  currentDate,
  onToggle,
  onEdit,
  ToggleSwitch,
  AlarmItem,
  AlarmInfo,
  AlarmActions
}) => {
  // 등록일과 현재 보는 날짜 비교
  const alarmDateStr = format(alarm.calculatedTime, 'yyyy-MM-dd');
  const currentDateStr = format(currentDate, 'yyyy-MM-dd');
  const isRegisteredToday = alarmDateStr === currentDateStr;
  const hasRepeat = alarm.anniversaryRepeat && alarm.anniversaryRepeat !== 'none';

  return (
    <AlarmItem
      $isPending={false}
      $enabled={alarm.enabled}
      $isModified={alarm.isModified}
    >
      <AlarmInfo>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
          <ToggleSwitch style={{ opacity: alarm.disabledAt ? 0.5 : 1 }}>
            <input
              type="checkbox"
              checked={alarm.enabled !== false}
              disabled={!!alarm.disabledAt}
              onChange={() => onToggle(alarm.id)}
            />
            <span className="slider"></span>
          </ToggleSwitch>

          {/* 기념일 뱃지 */}
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
            fontWeight: 'bold',
            flexShrink: 0,
            opacity: alarm.enabled !== false ? 1 : 0.5,
            marginTop: '4px'
          }}>
            기
          </div>

          {/* 제목 */}
          <div style={{
            fontSize: '15px',
            color: ALARM_COLORS.primary,
            opacity: alarm.enabled !== false ? 1 : 0.5,
            wordBreak: 'break-all',
            lineHeight: '1.3',
            maxWidth: '8em',
            display: 'inline-block',
            minHeight: 'calc(1.3em * 2)',
            marginTop: '2px'
          }}>
            {alarm.title || '제목 없음'}
            {hasRepeat && !isRegisteredToday && ' 🔄'}
          </div>
        </div>

        {/* 시간 및 등록일 정보 */}
        <div style={{
          fontSize: '12px',
          color: ALARM_COLORS.muted,
          opacity: alarm.enabled !== false ? 1 : 0.5
        }}>
          {format(alarm.calculatedTime, 'yyyy-MM-dd HH:mm')}
          {hasRepeat && isRegisteredToday && (
            <span style={{ fontSize: '11px', color: '#999' }}> (당일 등록)</span>
          )}
          {hasRepeat && !isRegisteredToday && (
            <>
              <span style={{ margin: '0 4px' }}>·</span>
              <span style={{ fontSize: '11px', color: '#999' }}>
                {format(alarm.calculatedTime, 'yyyy년 M월 d일')}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(alarm);
                }}
                style={{
                  marginLeft: '6px',
                  fontSize: '10px',
                  color: ALARM_COLORS.primary,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  textDecoration: 'underline',
                  opacity: 0.6
                }}
              >
                수정
              </button>
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
    </AlarmItem>
  );
};

export default AnniversaryAlarmItem;
