// src/services/fcmService.js
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';

/**
 * FCM 초기화 및 토큰 등록
 */
export const initializeFCM = async (userId) => {
    // 네이티브 플랫폼에서만 실행
    if (!Capacitor.isNativePlatform()) {
        console.log('⚠️ FCM은 네이티브 플랫폼에서만 작동합니다');
        return null;
    }

    try {
        // 0. Notification Channel 생성 (Capacitor API로 등록)
        await createNotificationChannels();

        // 1. 알림 권한 요청
        let permission = await PushNotifications.requestPermissions();
        console.log('📱 FCM 권한 상태:', permission);

        // 권한이 거부된 경우 재확인 모달
        if (permission.receive !== 'granted') {
            const confirmRetry = window.confirm(
                '⚠️ 알림 권한 필요\n\n' +
                '실시간 채팅 알림을 받으려면 알림 권한이 필요합니다.\n\n' +
                '권한을 허용하지 않으면:\n' +
                '• 새 메시지 알림을 받을 수 없습니다\n' +
                '• 채팅방을 직접 열어야 새 메시지를 확인할 수 있습니다\n' +
                '• 타이머 및 스케줄 알람을 받을 수 없습니다\n\n' +
                '정말 알림 권한을 허용하지 않으시겠습니까?\n\n' +
                '(확인 = 다시 권한 요청, 취소 = 알림 없이 계속)'
            );

            if (confirmRetry) {
                // 한 번 더 권한 요청
                permission = await PushNotifications.requestPermissions();
                console.log('📱 FCM 재요청 권한 상태:', permission);

                if (permission.receive !== 'granted') {
                    console.log('⚠️ FCM 권한이 최종 거부되었습니다');
                    alert(
                        'ℹ️ 알림 권한이 거부되었습니다\n\n' +
                        '나중에 설정 > 앱 > ShareNote > 알림에서\n' +
                        '권한을 활성화할 수 있습니다.'
                    );
                    return null;
                }
            } else {
                console.log('⚠️ 사용자가 알림 없이 계속 진행을 선택했습니다');
                return null;
            }
        }

        // 2. FCM 등록
        await PushNotifications.register();
        console.log('✅ FCM 등록 완료');

        // 3. 토큰 수신 리스너
        PushNotifications.addListener('registration', async (token) => {
            console.log('🔑 FCM 토큰 수신:', token.value);

            // Firestore에 토큰 저장
            if (userId) {
                await saveFCMToken(userId, token.value);
            }
        });

        // 4. 등록 실패 리스너
        PushNotifications.addListener('registrationError', (error) => {
            console.error('❌ FCM 등록 실패:', error);
        });

        // 5. 알림 수신 리스너 (포그라운드 전용)
        // 백그라운드에서는 MyFirebaseMessagingService가 처리하므로 여기서는 포그라운드만 처리
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('📬 알림 수신 (포그라운드):', notification);

            // ✅ 포그라운드에서는 소리를 재생하지 않음
            // ChatRoom에서 메시지 구독을 통해 직접 처리하므로 FCM 알림음은 비활성화
            // 이렇게 하면 중복 알림음 문제가 해결됨

            // 포그라운드에서는 알림 팝업 무조건 표시 안 함
        });

        // 6. 알림 클릭 리스너 (백그라운드)
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('🔔 알림 클릭:', notification);

            // 알림 데이터에 따라 화면 이동
            const data = notification.notification.data;
            if (data.type === 'schedule') {
                // 스케줄 화면으로 이동 - CustomEvent 발송 (날짜 정보 포함)
                window.dispatchEvent(new CustomEvent('navigateToTab', {
                    detail: {
                        tab: 'calendar',
                        scheduleDate: data.scheduleDate // yyyy-MM-dd 형식
                    }
                }));
            } else if (data.type === 'timer') {
                // 타이머 화면으로 이동 - CustomEvent 발송
                window.dispatchEvent(new CustomEvent('navigateToTab', {
                    detail: { tab: 'memo' }
                }));
            } else if (data.type === 'chat') {
                // 채팅방으로 이동 - CustomEvent 발송
                if (data.roomId) {
                    window.dispatchEvent(new CustomEvent('openChatRoom', {
                        detail: { roomId: data.roomId }
                    }));
                }
            }
        });

        return true;
    } catch (error) {
        console.error('❌ FCM 초기화 실패:', error);
        return null;
    }
};

/**
 * Notification Channel 생성 (Capacitor API 사용)
 * MainActivity.java에서 생성한 채널을 Capacitor가 인식하도록 등록
 */
const createNotificationChannels = async () => {
    try {
        // NOTE: 채널 생성은 MainActivity.java에서 이미 처리됨
        // Capacitor API로 중복 생성하면 소리가 두 번 울릴 수 있음
        // 이 함수는 호환성을 위해 남겨두되, 실제 채널은 네이티브에서만 생성
        console.log('✅ 알림 채널은 MainActivity.java에서 이미 생성됨 (커스텀 사운드 적용)');
    } catch (error) {
        console.error('❌ 채널 확인 실패:', error);
    }
};

/**
 * Firestore에 FCM 토큰 저장
 */
const saveFCMToken = async (userId, token) => {
    try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            fcmToken: token,
            fcmTokenUpdatedAt: new Date().toISOString()
        }, { merge: true });

        console.log('✅ FCM 토큰 Firestore 저장 완료');
    } catch (error) {
        console.error('❌ FCM 토큰 저장 실패:', error);
    }
};

/**
 * 스케줄 알람 등록 (Firestore에 저장)
 */
export const scheduleAlarm = async (userId, alarmData) => {
    try {
        const alarmRef = doc(db, 'alarms', `${userId}_${Date.now()}`);
        await setDoc(alarmRef, {
            userId,
            type: alarmData.type, // 'timer', 'schedule', 'chat'
            title: alarmData.title,
            body: alarmData.body,
            alarmTime: alarmData.alarmTime, // ISO string
            createdAt: new Date().toISOString(),
            status: 'pending'
        });

        console.log('✅ 알람 등록 완료:', alarmData);
        return true;
    } catch (error) {
        console.error('❌ 알람 등록 실패:', error);
        return false;
    }
};

/**
 * 알람 취소
 */
export const cancelAlarm = async (alarmId) => {
    try {
        const alarmRef = doc(db, 'alarms', alarmId);
        await setDoc(alarmRef, {
            status: 'cancelled'
        }, { merge: true });

        console.log('✅ 알람 취소 완료:', alarmId);
        return true;
    } catch (error) {
        console.error('❌ 알람 취소 실패:', error);
        return false;
    }
};
