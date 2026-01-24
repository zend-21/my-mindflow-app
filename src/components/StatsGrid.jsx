// src/components/StatsGrid.jsx

import React, { useMemo, useState, useEffect } from 'react';
import styled from 'styled-components';

const GridWrapper = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto;
    gap: 16px;
    margin-bottom: 24px;
`;

// 통일된 카드 스타일 (정사각형)
const UnifiedCard = styled.div`
    background: linear-gradient(135deg, #2a2d35, #333842);
    border-radius: 20px;
    padding: 16px 20px 6px 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    border: 1px solid ${props => props.$hasUnread ? '#FF6B6B' : 'rgba(255, 255, 255, 0.1)'};
    display: flex;
    flex-direction: column;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    cursor: pointer;
    aspect-ratio: 1 / 0.95;
    font-size: 12px;
    overflow: hidden;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 6px 16px rgba(0,0,0,0.5);
    }

    * {
        font-size: inherit;
    }
`;

// 통일된 타이틀 스타일 (16px)
const CardTitle = styled.h3`
    font-size: 16px !important;
    font-weight: 600;
    color: #b0b0b0;
    margin: 0 0 8px 0;
`;

// 통일된 내용 스타일 (12px, 3줄 고정)
const CardContent = styled.p`
    font-size: ${props => props.$largeNumber ? '28px' : '12px'} !important;
    color: ${props => props.$isEmpty ? '#666' : props.$isAnniversary ? '#4a90e2' : props.$largeNumber ? '#e0e0e0' : '#a0a0a0'};
    font-weight: ${props => props.$isAnniversary || props.$largeNumber ? '600' : '400'};
    margin: 0;
    line-height: 1.4;
    min-height: calc(12px * 1.4 * 3); /* 3줄 고정 높이 */
    display: flex;
    align-items: center; /* 내용이 짧으면 수직 중앙 */
    justify-content: ${props => props.$largeNumber ? 'center' : 'flex-start'}; /* 큰 숫자는 가로 중앙 */
    word-break: break-word;
    overflow: hidden; /* 애니메이션을 위한 오버플로우 숨김 */
    position: relative;
`;

// 내용 텍스트 래퍼 (줄 수 제한용 + 슬라이드 애니메이션)
const CardContentText = styled.span`
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;

    /* 슬라이드 애니메이션 */
    animation: slideInFromTop 0.5s ease-out;

    @keyframes slideInFromTop {
        from {
            transform: translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
`;

// 커뮤니티 카드용 제목 (1줄)
const CommunityTitle = styled.span`
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-weight: 600;
    margin-bottom: 4px;
`;

// 커뮤니티 카드용 내용 (2줄)
const CommunityBody = styled.span`
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    color: #a0a0a0;
`;

// 커뮤니티 카드용 내용 영역 (div 대신 사용 - p 안에 div 불가)
const CommunityContent = styled.div`
    font-size: 12px !important;
    color: #e0e0e0;
    margin: 0;
    line-height: 1.4;
    min-height: calc(12px * 1.4 * 3);
    display: flex;
    flex-direction: column;
    justify-content: center;
    word-break: break-word;
`;

// 통일된 보조영역 컨테이너
const CardMeta = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 8px;

    /* 페이드 인 애니메이션 (페이드 아웃 없음) */
    animation: fadeIn 0.5s ease-out;

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
`;

// 보조영역1 (11px, #888)
const MetaPrimary = styled.span`
    font-size: 11px !important;
    color: #888;
    min-height: 11px;
    line-height: 1.2;
`;

// 보조영역2 (11px, #b0b0b0)
const MetaSecondary = styled.span`
    font-size: 11px !important;
    color: #b0b0b0;
    min-height: 11px;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;


// 시간 포맷 함수
const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // 1분 미만
    if (diff < 60000) return '방금';
    // 1시간 미만
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    // 오늘
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    }
    // 어제
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return '어제';
    // 그 외
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
};

// 메시지 텍스트 추출 (문자열 또는 객체 처리)
const getMessageText = (message) => {
    if (!message) return '(내용 없음)';
    // 문자열인 경우 그대로 반환
    if (typeof message === 'string') return message;
    // 객체인 경우 text 속성 추출
    if (typeof message === 'object') {
        return message.text || message.content || message.message || '(내용 없음)';
    }
    return '(내용 없음)';
};

// HTML 태그 제거 함수
const stripHtmlTags = (html) => {
    if (!html || typeof html !== 'string') return '';
    // HTML 태그 제거
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
};

// 날짜 포맷 함수 (일정용)
const formatScheduleDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// 날짜 키 포맷 함수 (yyyy-MM-dd → "M월 D일 (요일)")
const formatDateKey = (dateKey) => {
    if (!dateKey) return '';
    const date = new Date(dateKey);
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];
    return `${month}월 ${day}일 (${weekday})`;
};

// 알람 시간 포맷 함수
const formatAlarmTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('ko-KR', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// 반복 타입 라벨
const getRepeatLabel = (alarm) => {
    if (!alarm) return '';
    // 기념일인 경우
    if (alarm.isAnniversary) {
        const repeatLabels = {
            yearly: '매년 반복',
            monthly: '매월 반복',
            none: '1회'
        };
        return repeatLabels[alarm.anniversaryRepeat] || '기념일';
    }
    // 일반 알람인 경우
    const repeatLabels = {
        none: '1회 알람',
        daily: '매일 반복',
        weekly: '매주 반복',
        monthly: '매월 반복',
        yearly: '매년 반복'
    };
    return repeatLabels[alarm.repeatType] || '1회 알람';
};

// 다가오는 일정/알람 후보 목록 반환 (롤링용)
const getUpcomingScheduleCandidates = (calendarSchedules) => {
    if (!calendarSchedules || Object.keys(calendarSchedules).length === 0) {
        return null;
    }

    const now = new Date();
    const nowTime = now.getTime();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // 날짜별로 그룹화된 후보들
    const dateGroups = {};

    // 모든 스케줄 순회
    for (const dateKey in calendarSchedules) {
        const entry = calendarSchedules[dateKey];
        if (!entry) continue;

        const scheduleDate = new Date(dateKey);
        scheduleDate.setHours(0, 0, 0, 0);

        // 오늘 이전 날짜는 무시
        if (scheduleDate < todayStart) continue;

        // 날짜별 배열 초기화
        if (!dateGroups[dateKey]) {
            dateGroups[dateKey] = [];
        }

        // 1. 일정 텍스트 추가 (하루 종일 유효)
        if (entry.text && entry.text.trim()) {
            // HTML 태그 제거하여 순수 텍스트만 추출
            const plainText = stripHtmlTags(entry.text).trim();

            // 태그 제거 후에도 텍스트가 있는 경우만 추가
            if (plainText) {
                dateGroups[dateKey].push({
                    type: 'schedule',
                    content: plainText,
                    time: scheduleDate.getTime(),
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                    dateKey: dateKey
                });
            }
        }

        // 2. 알람 추가
        if (entry.alarm?.registeredAlarms?.length > 0) {
            for (const alarm of entry.alarm.registeredAlarms) {
                // ⭐ 비활성화된 알람 제외
                if (alarm.enabled === false) continue;

                // ⭐ 반복 알람의 특정 날짜 비활성화 확인
                if (alarm.isAnniversary && alarm.disabledDates && Array.isArray(alarm.disabledDates)) {
                    const alarmDate = new Date(alarm.calculatedTime);
                    const alarmDateStr = alarmDate.toISOString().split('T')[0];
                    if (alarm.disabledDates.includes(alarmDateStr)) {
                        continue;
                    }
                }

                const alarmTime = new Date(alarm.calculatedTime).getTime();

                // ⭐ 기념일: 하루 종일 유효 (일정처럼 취급)
                // ⭐ 일반 알람: 현재 시간 이후만 유효
                const isValidAlarm = alarm.isAnniversary || alarmTime > nowTime;

                if (isValidAlarm) {
                    dateGroups[dateKey].push({
                        type: 'alarm',
                        content: alarm.title || '알람',
                        time: alarmTime,
                        alarmTime: alarm.calculatedTime,
                        isAnniversary: alarm.isAnniversary || false,
                        repeatType: alarm.repeatType,
                        anniversaryRepeat: alarm.anniversaryRepeat,
                        alarm: alarm,
                        dateKey: dateKey
                    });
                }
            }
        }
    }

    // 가장 빠른 날짜 찾기
    const sortedDates = Object.keys(dateGroups)
        .filter(date => dateGroups[date].length > 0) // 유효한 항목이 있는 날짜만
        .sort();

    if (sortedDates.length === 0) return null;

    // ⭐ 가장 빠른 날짜의 모든 후보 배열 반환 (롤링용)
    const earliestDate = sortedDates[0];
    const candidates = dateGroups[earliestDate];

    return candidates.length > 0 ? candidates : null;
};

const StatsGrid = ({ onSwitchTab, latestMessage, memos = [], calendarSchedules = {} }) => {
    const totalMemos = memos.length;

    // 공유 폴더 내 문서 (folderId가 'shared'인 메모)
    const sharedFolderMemos = useMemo(() => {
        return memos.filter(memo => memo.folderId === 'shared');
    }, [memos]);

    // 협업중인 문서 (공유 폴더 내에서 hasPendingEdits가 true인 메모)
    const collaboratingMemos = useMemo(() => {
        return sharedFolderMemos.filter(memo => memo.hasPendingEdits === true);
    }, [sharedFolderMemos]);

    // 메시지 텍스트 안전하게 추출
    const messageText = latestMessage
        ? getMessageText(latestMessage.text) || getMessageText(latestMessage.lastMessage)
        : null;

    // 다가오는 일정/알람 후보 목록 (롤링용)
    const upcomingCandidates = useMemo(() => {
        return getUpcomingScheduleCandidates(calendarSchedules);
    }, [calendarSchedules]);

    // 롤링 인덱스 관리
    const [currentIndex, setCurrentIndex] = useState(0);

    // 후보 목록이 변경되면 인덱스 초기화
    useEffect(() => {
        setCurrentIndex(0);
    }, [upcomingCandidates]);

    // 자동 롤링 (5초마다)
    useEffect(() => {
        if (!upcomingCandidates || upcomingCandidates.length <= 1) {
            return; // 항목이 1개 이하면 롤링 불필요
        }

        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % upcomingCandidates.length);
        }, 5000); // 5초마다 다음 항목으로

        return () => clearInterval(interval);
    }, [upcomingCandidates]);

    // 현재 표시할 항목
    const upcomingSchedule = upcomingCandidates && upcomingCandidates.length > 0
        ? upcomingCandidates[currentIndex]
        : null;

    return (
        <GridWrapper>
            {/* 최신 메시지 카드 */}
            <UnifiedCard onClick={() => onSwitchTab('chat', { roomId: latestMessage?.roomId })} $hasUnread={latestMessage?.hasUnread}>
                <CardTitle>최신 메시지</CardTitle>
                <CardContent $isEmpty={!latestMessage}>
                    <CardContentText>
                        {latestMessage ? (messageText || '(내용 없음)') : '새로운 메시지가 없습니다'}
                    </CardContentText>
                </CardContent>
                <CardMeta>
                    <MetaPrimary>
                        {latestMessage ? formatMessageTime(latestMessage.time || latestMessage.lastMessageTime) : '-'}
                    </MetaPrimary>
                    <MetaSecondary>
                        {latestMessage ? (latestMessage.senderName || '알 수 없음') : '-'}
                    </MetaSecondary>
                </CardMeta>
            </UnifiedCard>

            {/* 협업중인 문서 카드 */}
            <UnifiedCard onClick={() => onSwitchTab('memo', { folderId: 'shared' })}>
                <CardTitle>협업중인 문서</CardTitle>
                <CardContent $largeNumber={collaboratingMemos.length > 0} $isEmpty={collaboratingMemos.length === 0}>
                    <CardContentText>
                        {collaboratingMemos.length > 0
                            ? <>{collaboratingMemos.length} <span style={{ fontSize: '12px', fontWeight: '400' }}>개</span></>
                            : '협업중인 문서 없음'}
                    </CardContentText>
                </CardContent>
                <CardMeta>
                    <MetaPrimary>공유 폴더 문서 수: {sharedFolderMemos.length}개</MetaPrimary>
                    <MetaSecondary>총 메모 문서: {totalMemos}개</MetaSecondary>
                </CardMeta>
            </UnifiedCard>

            {/* 다가오는 일정 카드 */}
            <UnifiedCard onClick={() => onSwitchTab('calendar', { date: upcomingSchedule?.dateKey })}>
                <CardTitle>다가오는 일정</CardTitle>
                {upcomingSchedule ? (
                    upcomingSchedule.type === 'schedule' ? (
                        <>
                            <CardContent key={`schedule-${currentIndex}`}>
                                <CardContentText>
                                    {upcomingSchedule.content}
                                </CardContentText>
                            </CardContent>
                            <CardMeta key={`schedule-meta-${currentIndex}`}>
                                <MetaPrimary>
                                    📅 {formatDateKey(upcomingSchedule.dateKey)}
                                </MetaPrimary>
                                <MetaSecondary>
                                    일정
                                </MetaSecondary>
                            </CardMeta>
                        </>
                    ) : (
                        <>
                            <CardContent key={`alarm-${currentIndex}`} $isAnniversary={upcomingSchedule.isAnniversary}>
                                <CardContentText>
                                    {upcomingSchedule.isAnniversary ? `🎂 ${upcomingSchedule.content}` : upcomingSchedule.content}
                                </CardContentText>
                            </CardContent>
                            <CardMeta key={`alarm-meta-${currentIndex}`}>
                                <MetaPrimary>
                                    {formatAlarmTime(upcomingSchedule.alarmTime)}
                                </MetaPrimary>
                                <MetaSecondary>
                                    {getRepeatLabel(upcomingSchedule)}
                                </MetaSecondary>
                            </CardMeta>
                        </>
                    )
                ) : (
                    <>
                        <CardContent $isEmpty>
                            <CardContentText>예정된 일정이 없습니다</CardContentText>
                        </CardContent>
                        <CardMeta>
                            <MetaPrimary>-</MetaPrimary>
                            <MetaSecondary>-</MetaSecondary>
                        </CardMeta>
                    </>
                )}
            </UnifiedCard>

            {/* 공유 커뮤니티 카드 (준비중) */}
            <UnifiedCard onClick={() => { /* 추후 커뮤니티 탭 연결 */ }}>
                <CardTitle>공유 커뮤니티</CardTitle>
                <CommunityContent>
                    <CommunityTitle>대박 맛집 발견!! (광고 아님, 내돈내산 찐후기)</CommunityTitle>
                    <CommunityBody>형님들... 저 오늘 인생 맛집 찾았습니다 ㅠㅠ 원래 이런 거 귀찮아서 안 쓰는데, 여기는 사장님 돈쭐나야 할 것 같아서 공유해요.</CommunityBody>
                </CommunityContent>
                <CardMeta>
                    <MetaPrimary>조회 12,540 / 추천 796</MetaPrimary>
                    <MetaSecondary>6분전 / 미식가곰돌이</MetaSecondary>
                </CardMeta>
            </UnifiedCard>
        </GridWrapper>
    );
};

export default StatsGrid;