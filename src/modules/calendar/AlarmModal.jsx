// src/modules/calendar/AlarmModal.jsx

import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { format } from 'date-fns';
import Portal from '../../components/Portal';

// --- (애니메이션 및 기본 스타일) ---
const fadeIn = keyframes` from { opacity: 0; } to { opacity: 1; }`;
const slideUp = keyframes` from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; }`;

const Overlay = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex; justify-content: center; align-items: center;
  z-index: 11000;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContent = styled.div`
  background: #f8f9fa;
  border-radius: 16px;
  width: 95vw; max-width: 450px;
  max-height: 90vh;
  display: flex; flex-direction: column;
  box-shadow: 0 8px 30px rgba(0,0,0,0.2);
  animation: ${slideUp} 0.25s cubic-bezier(0.2, 0, 0, 1);
`;

const Header = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
  font-size: 18px;
  font-weight: 600;
  color: #343a40;
  text-align: center;
`;

const FormArea = styled.div`
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Section = styled.div`
  display: flex; flex-direction: column; gap: 10px;
`;

const SectionTitle = styled.h3`
  font-size: 16px; font-weight: 600; color: #495057;
  margin: 0;
`;

const InputGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 10px;
`;

const Select = styled.select`
  padding: 10px; border-radius: 8px;
  border: 1px solid #dee2e6;
  font-size: 14px;
  background: white;
  &:focus { outline: 2px solid #4a90e2; }
`;

const Footer = styled.div`
  padding: 16px 20px;
  border-top: 1px solid #e9ecef;
  display: flex; gap: 10px;
`;

const Button = styled.button`
  flex: 1; padding: 12px;
  border: none; border-radius: 8px;
  font-size: 16px; font-weight: 600; cursor: pointer;
  transition: background-color 0.2s;
`;

const SaveButton = styled(Button)`
  background-color: #4a90e2; color: white;
  &:hover { background-color: #357abd; }
`;

const CancelButton = styled(Button)`
  background-color: #e9ecef; color: #495057;
  &:hover { background-color: #dee2e6; }
`;
// --- (스타일 끝) ---


const AlarmModal = ({ isOpen, scheduleData, onSave, onClose }) => {
    // ▼▼▼ 1. 알람 설정을 위한 state 추가 ▼▼▼
    const [alarmTime, setAlarmTime] = useState('09:00');
    const [offset, setOffset] = useState('none');
    const [sound, setSound] = useState('default');
    const [repeat, setRepeat] = useState('none');

    // ▼▼▼ 2. 모달이 열릴 때 기존 알람 설정 불러오기 ▼▼▼
    useEffect(() => {
        if (isOpen && scheduleData?.alarm) {
            // 기존 스케줄에 저장된 알람 정보가 있으면, state에 반영
            setAlarmTime(scheduleData.alarm.time || '09:00');
            setOffset(scheduleData.alarm.offset || 'none');
            setSound(scheduleData.alarm.sound || 'default');
            setRepeat(scheduleData.alarm.repeat || 'none');
        } else if (isOpen) {
            // 새 알람 설정 시 기본값으로 초기화
            setAlarmTime('09:00');
            setOffset('none');
            setSound('default');
            setRepeat('none');
        }
    }, [isOpen, scheduleData]);

    // ▼▼▼ 3. 저장 버튼 클릭 시 호출될 함수 ▼▼▼
    const handleSaveClick = () => {
        const alarmSettings = {
            isEnabled: true, // 알람이 설정되었음을 표시
            time: alarmTime,
            offset,
            sound,
            repeat,
        };
        // 부모 컴포넌트(App.jsx)에 설정값 전달
        onSave(alarmSettings);
    };

    if (!isOpen) return null;

    // 임시 데이터 (나중에 state로 관리)
    const years = [2024, 2025, 2026];
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = [0, 10, 20, 30, 40, 50];
    const offsets = [
        { value: 'none', label: '정시' },
        { value: '5m_before', label: '5분 전' },
        { value: '10m_before', label: '10분 전' },
        { value: '1h_before', label: '1시간 전' },
        { value: '1d_before', label: '1일 전' },
    ];
    const sounds = [
        { value: 'default', label: '기본 알림' },
        { value: 'message', label: '메시지' },
        { value: 'chime', label: '차임벨' },
    ];
    const repeats = [
        { value: 'none', label: '반복 안함' },
        { value: 'daily', label: '매일' },
        { value: 'weekly', label: '매주' },
    ];
    const timeOptions = [];
    // 0시부터 23시까지, 30분 간격으로 시간 옵션을 생성합니다.
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
            const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            timeOptions.push(timeStr);
        }
    }

    const scheduleDateStr = scheduleData?.date ? format(new Date(scheduleData.date), 'yyyy년 M월 d일') : '선택된 날짜';

    return (
      <Portal>
        <Overlay>
            <ModalContent>
                <Header>{scheduleDateStr} 알람 설정</Header>
                <FormArea>
                    <Section>
                        <SectionTitle>⏰ 알람 시간</SectionTitle>
                        {/* value와 onChange를 연결하여 state와 상호작용 */}
                        <Select value={alarmTime} onChange={e => setAlarmTime(e.target.value)}>
                            {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
                        </Select>
                    </Section>

                    <Section>
                        <SectionTitle>🔔 미리 알림</SectionTitle>
                        <Select value={offset} onChange={e => setOffset(e.target.value)}>
                            {offsets.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </Select>
                    </Section>
                    
                    <Section>
                        <SectionTitle>🎵 알람 소리</SectionTitle>
                        <Select value={sound} onChange={e => setSound(e.target.value)}>
                             {sounds.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </Select>
                    </Section>

                    <Section>
                        <SectionTitle>🔁 반복</SectionTitle>
                        <Select value={repeat} onChange={e => setRepeat(e.target.value)}>
                            {repeats.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </Select>
                    </Section>
                </FormArea>
                <Footer>
                    <CancelButton onClick={onClose}>취소</CancelButton>
                    <SaveButton onClick={handleSaveClick}>저장</SaveButton>
                </Footer>
            </ModalContent>
        </Overlay>
      </Portal>
    );
};

export default AlarmModal;