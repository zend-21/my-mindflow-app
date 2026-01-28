// src/services/scheduleAlarmService.js
// 스케줄 알람 네이티브 등록/취소 서비스

import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { registerPlugin } from '@capacitor/core';

// ✅ 커스텀 AlarmManager 플러그인 (앱 종료 후에도 작동)
const ScheduleAlarm = registerPlugin('ScheduleAlarm');

/**
 * 경과된 알람 자동 정리
 * - 이미 시간이 지난 알람들을 취소하여 중복 트리거 방지
 */
const cleanupExpiredAlarms = async () => {
    if (!Capacitor.isNativePlatform()) {
        return;
    }

    try {
        const now = Date.now();

        // localStorage에서 모든 알람 정보 가져오기
        const keys = Object.keys(localStorage);
        const calendarKeys = keys.filter(key =>
            key.includes('calendar') && !key.includes('Settings') && !key.includes('alarm')
        );

        const expiredAlarms = [];

        for (const key of calendarKeys) {
            try {
                const schedules = JSON.parse(localStorage.getItem(key) || '{}');

                for (const dayData of Object.values(schedules)) {
                    const registeredAlarms = dayData?.alarm?.registeredAlarms || [];

                    for (const alarm of registeredAlarms) {
                        const alarmTime = new Date(alarm.calculatedTime).getTime();
                        const repeatCount = alarm.repeatCount || 1;

                        // 반복 알람의 마지막 시간 계산
                        const lastRepeatTime = alarmTime + ((repeatCount - 1) * 60 * 1000);

                        // 마지막 반복도 경과된 경우 취소 대상
                        if (lastRepeatTime < now && !alarm.isAnniversary) {
                            expiredAlarms.push({
                                id: alarm.id,
                                repeatCount: repeatCount,
                                title: alarm.title
                            });
                        }
                    }
                }
            } catch (error) {
                console.warn('알람 데이터 파싱 오류:', error);
            }
        }

        // 경과된 알람들 취소
        if (expiredAlarms.length > 0) {
            console.log(`🧹 경과된 알람 ${expiredAlarms.length}개 정리 중...`);

            for (const alarm of expiredAlarms) {
                await cancelNativeScheduleAlarm(alarm.id, alarm.repeatCount);
                console.log(`✅ 경과된 알람 취소: ${alarm.title}`);
            }
        }
    } catch (error) {
        console.error('❌ 경과된 알람 정리 실패:', error);
    }
};

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
        // ✅ [FIX] 알람 등록 전 경과된 알람 자동 정리 (이전 알람이 울리는 문제 방지)
        await cleanupExpiredAlarms();

        // 알림 권한 확인
        const permission = await LocalNotifications.requestPermissions();
        if (permission.display !== 'granted') {
            console.log('⚠️ 알림 권한이 거부되었습니다');
            return false;
        }

        // ✅ Android 12+ 정확한 알람 권한 체크
        if (Capacitor.getPlatform() === 'android') {
            try {
                const permissions = await LocalNotifications.checkPermissions();
                console.log('📋 알람 권한 상태:', JSON.stringify(permissions, null, 2));

                if (permissions.canScheduleExactAlarms === false) {
                    console.error('❌ [CRITICAL] 정확한 알람 권한이 없습니다!');
                    console.error('❌ 설정 > 앱 > ShareNote > 알람 및 리마인더 에서 권한을 허용해주세요.');
                    alert('⚠️ 백그라운드 알람을 사용하려면\n\n설정 > 앱 > ShareNote > 알람 및 리마인더\n\n에서 권한을 허용해주세요.');
                    return false;
                } else {
                    console.log('✅ 정확한 알람 권한 확인 완료');
                }
            } catch (error) {
                console.warn('⚠️ 정확한 알람 권한 체크 실패 (Android 12 미만일 수 있음):', error);
                // Android 12 미만에서는 이 권한이 필요없으므로 계속 진행
            }
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

        // 알람 채널 ID (v10으로 완전히 새로 시작)
        const channelId = 'alarm_channel_v10';

        // 반복 횟수 확인 (기본값: 1)
        const repeatCount = alarm.repeatCount || 1;

        console.log(`📅 스케줄 알람 등록 시작:`, {
            id: notificationId,
            title: alarm.title,
            scheduledTime: alarmTime.toISOString(),
            isAnniversary: alarm.isAnniversary,
            channelId: channelId,
            repeatCount: repeatCount
        });

        // ✅ AlarmManager 플러그인 사용 (백그라운드에서도 작동)
        const title = `'${alarm.title}'`;
        const body = `- ShareNote -`;
        const enableVibration = true;  // v10: 진동 항상 활성화

        for (let i = 0; i < repeatCount; i++) {
            const repeatTime = new Date(alarmTime.getTime() + (i * 60 * 1000)); // i분 추가
            const uniqueId = notificationId + i; // 각 반복마다 고유 ID

            try {
                await ScheduleAlarm.scheduleAlarm({
                    notificationId: uniqueId,
                    title: title,
                    body: body,
                    triggerTime: repeatTime.getTime(),
                    channelId: channelId,
                    sound: 'schedule_alarm', // 확장자 제외
                    enableVibration: enableVibration
                });
                console.log(`✅ 알람 ${i + 1}/${repeatCount} 등록: ${repeatTime.toLocaleString('ko-KR')}`);
            } catch (error) {
                console.error(`❌ 알람 ${i + 1}/${repeatCount} 등록 실패:`, error);
            }
        }

        console.log(`✅ 스케줄 알람 등록 완료: ${alarm.title} (${repeatCount}회 반복)`);
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

        // ✅ AlarmManager 플러그인으로 취소
        for (let i = 0; i < repeatCount; i++) {
            const uniqueId = notificationId + i;
            try {
                await ScheduleAlarm.cancelAlarm({
                    notificationId: uniqueId
                });
                console.log(`✅ 알람 ${i + 1}/${repeatCount} 취소 완료`);
            } catch (error) {
                console.error(`❌ 알람 ${i + 1}/${repeatCount} 취소 실패:`, error);
ㅅㅓㅅㅁㅗ          }
        }

        console.log(`✅ 스케줄 알람 취소 완료: ID ${alarmId} (${repeatCount}회 반복)`);
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
