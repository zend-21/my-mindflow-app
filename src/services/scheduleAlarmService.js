// src/services/scheduleAlarmService.js
// 스케줄 알람 네이티브 등록/취소 서비스

import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

/**
 * 스케줄 알람 네이티브 등록
 * @param {Object} alarm - 알람 데이터
 * @param {string} scheduleDate - 스케줄 날짜 (yyyy-MM-dd)
 * @returns {Promise<boolean>}
 */
export const registerNativeScheduleAlarm = async (alarm, scheduleDate) => {
    // 네이티브 플랫폼에서만 실행
    if (!Capacitor.isNativePlatform()) {
        console.log('⚠️ LocalNotifications는 네이티브 플랫폼에서만 작동합니다');
        return false;
    }

    try {
        // 알림 권한 확인
        const permission = await LocalNotifications.requestPermissions();
        if (permission.display !== 'granted') {
            console.log('⚠️ 알림 권한이 거부되었습니다');
            return false;
        }

        const alarmTime = new Date(alarm.calculatedTime);
        const now = new Date();

        // 과거 시간이면 등록하지 않음 (기념일 제외)
        if (!alarm.isAnniversary && alarmTime <= now) {
            console.log('⚠️ 과거 시간 알람은 등록하지 않습니다:', alarm.title);
            return false;
        }

        // 알람 ID 생성 (충돌 방지를 위해 고유 ID 사용)
        const notificationId = parseInt(`${alarm.id}`.slice(-8), 10);

        // 알람 타입에 따라 채널 선택
        const notificationType = alarm.customNotificationType || alarm.notificationType || 'both';
        let channelId = 'alarm_channel_v2'; // 기본: 소리+진동

        if (notificationType === 'sound') {
            channelId = 'alarm_channel_sound_only_v2';
        } else if (notificationType === 'vibrate') {
            channelId = 'alarm_channel_vibration_only_v2';
        }

        // 반복 횟수 확인 (기본값: 1)
        const repeatCount = alarm.repeatCount || 1;

        console.log(`📅 스케줄 알람 등록 시작:`, {
            id: notificationId,
            title: alarm.title,
            scheduledTime: alarmTime.toISOString(),
            isAnniversary: alarm.isAnniversary,
            notificationType: notificationType,
            channelId: channelId,
            repeatCount: repeatCount
        });

        // 반복 알람 생성 (1회 또는 3회)
        const notifications = [];
        for (let i = 0; i < repeatCount; i++) {
            const repeatTime = new Date(alarmTime.getTime() + (i * 60 * 1000)); // i분 추가
            notifications.push({
                id: notificationId + i, // 각 반복마다 고유 ID
                title: alarm.title,
                body: `${alarm.content || `일정: ${scheduleDate}`}\n\n- ShareNote -`,
                schedule: { at: repeatTime },
                smallIcon: 'ic_stat_icon_config_sample',
                iconColor: '#1a1a2e',
                channelId: channelId,
                sound: 'schedule_alarm.mp3',
                extra: {
                    type: 'schedule',
                    alarmId: alarm.id,
                    scheduleDate: scheduleDate,
                    isAnniversary: alarm.isAnniversary || false,
                    repeatIndex: i + 1,
                    totalRepeats: repeatCount
                }
            });
        }

        // LocalNotifications로 알람 예약
        await LocalNotifications.schedule({ notifications });

        console.log(`✅ 스케줄 알람 등록 완료: ${alarm.title} (${repeatCount}회 반복, ${alarmTime.toLocaleString('ko-KR')}부터)`);
        return true;
    } catch (error) {
        console.error('❌ 스케줄 알람 등록 실패:', error);
        return false;
    }
};

/**
 * 스케줄 알람 네이티브 취소
 * @param {number} alarmId - 알람 ID
 * @param {number} repeatCount - 반복 횟수 (기본값: 3, 최대 반복 고려)
 * @returns {Promise<boolean>}
 */
export const cancelNativeScheduleAlarm = async (alarmId, repeatCount = 3) => {
    if (!Capacitor.isNativePlatform()) {
        return false;
    }

    try {
        const notificationId = parseInt(`${alarmId}`.slice(-8), 10);

        // 반복 알람을 모두 취소 (최대 3개)
        const notificationsToCancel = [];
        for (let i = 0; i < repeatCount; i++) {
            notificationsToCancel.push({ id: notificationId + i });
        }

        await LocalNotifications.cancel({
            notifications: notificationsToCancel
        });

        console.log(`✅ 스케줄 알람 취소 완료: ID ${alarmId} (${repeatCount}회 반복 모두 취소)`);
        return true;
    } catch (error) {
        console.error('❌ 스케줄 알람 취소 실패:', error);
        return false;
    }
};

/**
 * 모든 스케줄 알람 취소
 * @returns {Promise<boolean>}
 */
export const cancelAllNativeScheduleAlarms = async () => {
    if (!Capacitor.isNativePlatform()) {
        return false;
    }

    try {
        // 모든 대기 중인 알림 가져오기
        const pending = await LocalNotifications.getPending();

        // schedule 타입만 필터링
        const scheduleNotifications = pending.notifications.filter(
            n => n.extra && n.extra.type === 'schedule'
        );

        if (scheduleNotifications.length > 0) {
            await LocalNotifications.cancel({
                notifications: scheduleNotifications.map(n => ({ id: n.id }))
            });
            console.log(`✅ ${scheduleNotifications.length}개의 스케줄 알람 일괄 취소 완료`);
        }

        return true;
    } catch (error) {
        console.error('❌ 스케줄 알람 일괄 취소 실패:', error);
        return false;
    }
};

/**
 * 대기 중인 스케줄 알람 목록 조회
 * @returns {Promise<Array>}
 */
export const getPendingScheduleAlarms = async () => {
    if (!Capacitor.isNativePlatform()) {
        return [];
    }

    try {
        const pending = await LocalNotifications.getPending();

        // schedule 타입만 필터링
        const scheduleAlarms = pending.notifications.filter(
            n => n.extra && n.extra.type === 'schedule'
        );

        console.log(`📋 대기 중인 스케줄 알람: ${scheduleAlarms.length}개`);
        return scheduleAlarms;
    } catch (error) {
        console.error('❌ 대기 중인 알람 조회 실패:', error);
        return [];
    }
};
