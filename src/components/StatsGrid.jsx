// src/components/StatsGrid.jsx

import React, { useMemo } from 'react';
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
`;

// 내용 텍스트 래퍼 (줄 수 제한용)
const CardContentText = styled.span`
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
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

// 다가오는 일정/알람 찾기
const getUpcomingSchedule = (calendarSchedules) => {
    if (!calendarSchedules || Object.keys(calendarSchedules).length === 0) {
        return null;
    }

    const now = new Date();
    const nowTime = now.getTime();
    let upcoming = null;

    // 모든 스케줄 순회
    for (const dateKey in calendarSchedules) {
        const entry = calendarSchedules[dateKey];
        if (!entry) continue;

        // 1. 일정 텍스트가 있는 경우 (사용자가 직접 작성한 일정)
        if (entry.text && entry.text.trim()) {
            const scheduleDate = new Date(dateKey);
            scheduleDate.setHours(0, 0, 0, 0);

            // 오늘 이후의 일정만
            if (scheduleDate.getTime() >= now.setHours(0, 0, 0, 0)) {
                const scheduleTime = scheduleDate.getTime();
                if (!upcoming || scheduleTime < upcoming.time) {
                    upcoming = {
                        type: 'schedule',
                        content: entry.text,
                        time: scheduleTime,
                        createdAt: entry.createdAt,
                        updatedAt: entry.updatedAt,
                        dateKey: dateKey
                    };
                }
            }
        }

        // 2. 알람이 있는 경우
        if (entry.alarm?.registeredAlarms?.length > 0) {
            for (const alarm of entry.alarm.registeredAlarms) {
                // 비활성화된 알람 제외
                if (alarm.isDisabled) continue;

                const alarmTime = new Date(alarm.calculatedTime).getTime();

                // 현재 시간 이후의 알람만
                if (alarmTime > nowTime) {
                    if (!upcoming || alarmTime < upcoming.time) {
                        upcoming = {
                            type: 'alarm',
                            content: alarm.title || '알람',
                            time: alarmTime,
                            alarmTime: alarm.calculatedTime,
                            isAnniversary: alarm.isAnniversary || false,
                            repeatType: alarm.repeatType,
                            anniversaryRepeat: alarm.anniversaryRepeat,
                            alarm: alarm,
                            dateKey: dateKey
                        };
                    }
                }
            }
        }
    }

    return upcoming;
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

    // 다가오는 일정/알람 찾기
    const upcomingSchedule = useMemo(() => {
        return getUpcomingSchedule(calendarSchedules);
    }, [calendarSchedules]);

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
                            <CardContent>
                                <CardContentText>
                                    {upcomingSchedule.content}
                                </CardContentText>
                            </CardContent>
                            <CardMeta>
                                <MetaPrimary>
                                    등록: {formatScheduleDate(upcomingSchedule.createdAt)}
                                </MetaPrimary>
                                <MetaSecondary>
                                    {upcomingSchedule.updatedAt && upcomingSchedule.updatedAt !== upcomingSchedule.createdAt
                                        ? `수정: ${formatScheduleDate(upcomingSchedule.updatedAt)}`
                                        : '-'}
                                </MetaSecondary>
                            </CardMeta>
                        </>
                    ) : (
                        <>
                            <CardContent $isAnniversary={upcomingSchedule.isAnniversary}>
                                <CardContentText>
                                    {upcomingSchedule.isAnniversary ? `🎂 ${upcomingSchedule.content}` : upcomingSchedule.content}
                                </CardContentText>
                            </CardContent>
                            <CardMeta>
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