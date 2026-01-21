const functions = require('firebase-functions/v2');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * 1분마다 실행되는 스케줄 함수
 * 알람 시간이 된 알람을 찾아서 FCM 푸시 알림 전송
 */
exports.checkAlarms = functions.scheduler.onSchedule('every 1 minutes', async (event) => {
        console.log('⏰ 알람 체크 시작...');

        const now = new Date();
        const nowISO = now.toISOString();

        try {
            // Firestore에서 알람 데이터 가져오기
            const alarmsRef = admin.firestore().collection('alarms');
            const snapshot = await alarmsRef
                .where('status', '==', 'pending')
                .where('alarmTime', '<=', nowISO)
                .get();

            if (snapshot.empty) {
                console.log('⏰ 전송할 알람 없음');
                return null;
            }

            console.log(`⏰ ${snapshot.size}개 알람 전송 시작`);

            const promises = [];

            snapshot.forEach(async (doc) => {
                const alarm = doc.data();
                console.log('📬 알람 전송:', alarm);

                // 사용자의 FCM 토큰 가져오기
                const userDoc = await admin.firestore()
                    .collection('users')
                    .doc(alarm.userId)
                    .get();

                if (!userDoc.exists) {
                    console.log('⚠️ 사용자 없음:', alarm.userId);
                    return;
                }

                const fcmToken = userDoc.data().fcmToken;

                if (!fcmToken) {
                    console.log('⚠️ FCM 토큰 없음:', alarm.userId);
                    return;
                }

                // FCM 메시지 구성 (Data-only 방식)
                // notification 필드를 제거하여 백그라운드에서도 onMessageReceived가 호출되도록 함
                const message = {
                    data: {
                        type: alarm.type,
                        title: alarm.title,
                        body: alarm.body,
                        alarmId: doc.id,
                        ...(alarm.roomId && { roomId: alarm.roomId }),
                    },
                    token: fcmToken,
                    android: {
                        priority: 'high',
                    },
                };

                // FCM 전송
                const sendPromise = admin.messaging()
                    .send(message)
                    .then((response) => {
                        console.log('✅ 알람 전송 성공:', response);
                        // 알람 상태를 'sent'로 업데이트
                        return doc.ref.update({ status: 'sent' });
                    })
                    .catch((error) => {
                        console.error('❌ 알람 전송 실패:', error);
                        // 에러 상태 업데이트
                        return doc.ref.update({
                            status: 'failed',
                            error: error.message
                        });
                    });

                promises.push(sendPromise);
            });

            await Promise.all(promises);
            console.log('✅ 모든 알람 처리 완료');
        } catch (error) {
            console.error('❌ 알람 체크 실패:', error);
        }
    });

/**
 * 그룹 채팅 메시지 전송 시 호출되는 함수
 */
exports.sendGroupChatNotification = functions.firestore.onDocumentCreated(
    'groupChats/{roomId}/messages/{messageId}',
    async (event) => {
        const message = event.data.data();
        const roomId = event.params.roomId;

        console.log('💬 그룹 채팅 알림 전송:', roomId);

        try {
            // 채팅방 정보 가져오기
            const roomDoc = await admin.firestore()
                .collection('groupChats')
                .doc(roomId)
                .get();

            if (!roomDoc.exists) {
                console.log('⚠️ 채팅방 없음:', roomId);
                return null;
            }

            const room = roomDoc.data();
            const members = room.members || [];

            // 발신자 제외
            const recipients = members.filter(uid => uid !== message.senderId);

            if (recipients.length === 0) {
                console.log('⚠️ 수신자 없음');
                return null;
            }

            // 모든 수신자의 unreadCount 증가
            const batch = admin.firestore().batch();
            const roomRef = admin.firestore().collection('groupChats').doc(roomId);

            recipients.forEach(recipientId => {
                batch.update(roomRef, {
                    [`unreadCount.${recipientId}`]: admin.firestore.FieldValue.increment(1)
                });
            });

            await batch.commit();

            // 발신자 닉네임 가져오기 (그룹 채팅에서 누가 보냈는지 표시용)
            const senderNicknameDoc = await admin.firestore()
                .collection('nicknames')
                .doc(message.senderId)
                .get();

            let senderName = '알 수 없음';

            if (senderNicknameDoc.exists && senderNicknameDoc.data().nickname) {
                senderName = senderNicknameDoc.data().nickname;
            } else {
                // fallback: Google displayName
                const senderDoc = await admin.firestore()
                    .collection('users')
                    .doc(message.senderId)
                    .get();

                if (senderDoc.exists) {
                    senderName = senderDoc.data().displayName || senderDoc.data().email || '알 수 없음';
                }
            }

            // 각 수신자별로 FCM 전송 (각자의 totalUnreadCount 계산)
            const sendPromises = recipients.map(async (recipientId) => {
                // 수신자의 FCM 토큰 가져오기
                const recipientDoc = await admin.firestore()
                    .collection('users')
                    .doc(recipientId)
                    .get();

                if (!recipientDoc.exists || !recipientDoc.data().fcmToken) {
                    console.log('⚠️ FCM 토큰 없음:', recipientId);
                    return null;
                }

                const fcmToken = recipientDoc.data().fcmToken;

                // 수신자의 전체 읽지 않은 메시지 개수 계산
                let totalUnreadCount = 0;

                // 1. 모든 DM 방의 unreadCount 합산
                const dmRoomsSnapshot = await admin.firestore()
                    .collection('directMessages')
                    .where('members', 'array-contains', recipientId)
                    .get();

                dmRoomsSnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.unreadCount && data.unreadCount[recipientId]) {
                        totalUnreadCount += data.unreadCount[recipientId];
                    }
                });

                // 2. 모든 그룹 채팅의 unreadCount 합산
                const groupRoomsSnapshot = await admin.firestore()
                    .collection('groupChats')
                    .where('members', 'array-contains', recipientId)
                    .get();

                groupRoomsSnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.unreadCount && data.unreadCount[recipientId]) {
                        totalUnreadCount += data.unreadCount[recipientId];
                    }
                });

                // 사용자의 알림 설정 확인
                const userData = recipientDoc.data();
                const notificationEnabled = userData.notificationEnabled !== false;
                const soundEnabled = userData.notificationSoundEnabled !== false;
                const vibrationEnabled = userData.notificationVibrationEnabled !== false;

                // 채널 ID 결정 (마스터 토글과 소리/진동 설정에 따라)
                let channelId = 'chat_channel_v3'; // 기본: 소리 + 진동

                // 마스터 토글이 OFF면 무음 채널
                if (!notificationEnabled) {
                    channelId = 'chat_channel_all_silent_v3'; // 완전 무음
                } else if (soundEnabled && !vibrationEnabled) {
                    channelId = 'chat_channel_sound_only_v3'; // 소리만
                } else if (!soundEnabled && vibrationEnabled) {
                    channelId = 'chat_channel_vibration_only_v3'; // 진동만
                } else if (!soundEnabled && !vibrationEnabled) {
                    channelId = 'chat_channel_all_silent_v3'; // 완전 무음
                }

                console.log(`🔔 수신자 ${recipientId} 알림 설정: 소리=${soundEnabled}, 진동=${vibrationEnabled} → 채널: ${channelId}`);

                // FCM 메시지 구성 (Data-only 방식)
                const fcmMessage = {
                    data: {
                        type: 'chat',
                        title: room.name || '새 메시지',
                        body: `${senderName}: ${message.content || message.text || '메시지'}`,
                        roomId: roomId,
                        senderId: message.senderId,
                        unreadCount: totalUnreadCount.toString(),
                        channelId: channelId, // 사용자 설정에 따른 채널 ID
                    },
                    token: fcmToken,
                    android: {
                        priority: 'high',
                    },
                };

                return admin.messaging().send(fcmMessage);
            });

            const responses = await Promise.all(sendPromises);
            const successCount = responses.filter(r => r !== null).length;

            console.log(`✅ 그룹 채팅 알림 전송 완료: ${successCount}/${recipients.length}`);
        } catch (error) {
            console.error('❌ 그룹 채팅 알림 전송 실패:', error);
        }
    });

/**
 * DM(1:1 채팅) 메시지 전송 시 호출되는 함수
 */
exports.sendDirectMessageNotification = functions.firestore.onDocumentCreated(
    'directMessages/{roomId}/messages/{messageId}',
    async (event) => {
        const message = event.data.data();
        const roomId = event.params.roomId;

        console.log('💬 DM 알림 전송:', roomId);

        try {
            // roomId에서 두 사용자 ID 추출 (예: dm_userId1_userId2)
            const userIds = roomId.replace('dm_', '').split('_');

            if (userIds.length !== 2) {
                console.log('⚠️ 잘못된 DM roomId 형식:', roomId);
                return null;
            }

            // 수신자 ID 찾기 (발신자가 아닌 사용자)
            const recipientId = userIds.find(uid => uid !== message.senderId);

            if (!recipientId) {
                console.log('⚠️ 수신자 없음');
                return null;
            }

            // 수신자의 FCM 토큰 가져오기
            const recipientDoc = await admin.firestore()
                .collection('users')
                .doc(recipientId)
                .get();

            if (!recipientDoc.exists || !recipientDoc.data().fcmToken) {
                console.log('⚠️ 수신자 FCM 토큰 없음:', recipientId);
                return null;
            }

            const fcmToken = recipientDoc.data().fcmToken;

            // 수신자의 알림 설정 확인
            const userData = recipientDoc.data();
            const notificationEnabled = userData.notificationEnabled !== false;
            const soundEnabled = userData.notificationSoundEnabled !== false;
            const vibrationEnabled = userData.notificationVibrationEnabled !== false;

            // 채널 ID 결정 (마스터 토글과 소리/진동 설정에 따라)
            let channelId = 'chat_channel_v3'; // 기본: 소리 + 진동

            // 마스터 토글이 OFF면 무음 채널
            if (!notificationEnabled) {
                channelId = 'chat_channel_all_silent_v3'; // 완전 무음
            } else if (soundEnabled && !vibrationEnabled) {
                channelId = 'chat_channel_sound_only_v3'; // 소리만
            } else if (!soundEnabled && vibrationEnabled) {
                channelId = 'chat_channel_vibration_only_v3'; // 진동만
            } else if (!soundEnabled && !vibrationEnabled) {
                channelId = 'chat_channel_all_silent_v3'; // 완전 무음
            }

            console.log(`🔔 수신자 ${recipientId} 알림 설정: 소리=${soundEnabled}, 진동=${vibrationEnabled} → 채널: ${channelId}`);

            // 발신자 정보 가져오기 (닉네임 표시용)
            // 1순위: 앱 내 닉네임 (nicknames 컬렉션)
            const nicknameDoc = await admin.firestore()
                .collection('nicknames')
                .doc(message.senderId)
                .get();

            let senderName = '알 수 없음';

            if (nicknameDoc.exists && nicknameDoc.data().nickname) {
                senderName = nicknameDoc.data().nickname;
            } else {
                // 2순위: Google displayName
                const senderDoc = await admin.firestore()
                    .collection('users')
                    .doc(message.senderId)
                    .get();

                if (senderDoc.exists) {
                    senderName = senderDoc.data().displayName || senderDoc.data().email || '알 수 없음';
                }
            }

            // 이 DM 채팅방의 unreadCount 증가
            await admin.firestore()
                .collection('directMessages')
                .doc(roomId)
                .set({
                    [`unreadCount.${recipientId}`]: admin.firestore.FieldValue.increment(1)
                }, { merge: true });

            // 수신자의 전체 읽지 않은 메시지 개수 계산 (모든 DM + 모든 그룹 채팅)
            let totalUnreadCount = 0;

            // 1. 모든 DM 방의 unreadCount 합산
            const dmRoomsSnapshot = await admin.firestore()
                .collection('directMessages')
                .where('members', 'array-contains', recipientId)
                .get();

            dmRoomsSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.unreadCount && data.unreadCount[recipientId]) {
                    totalUnreadCount += data.unreadCount[recipientId];
                }
            });

            // 2. 모든 그룹 채팅의 unreadCount 합산
            const groupRoomsSnapshot = await admin.firestore()
                .collection('groupChats')
                .where('members', 'array-contains', recipientId)
                .get();

            groupRoomsSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.unreadCount && data.unreadCount[recipientId]) {
                    totalUnreadCount += data.unreadCount[recipientId];
                }
            });

            // FCM 메시지 구성 (Data-only 방식)
            const fcmMessage = {
                data: {
                    type: 'chat',
                    title: senderName,
                    body: message.content || message.text || '메시지',
                    roomId: roomId,
                    senderId: message.senderId,
                    unreadCount: totalUnreadCount.toString(),
                    channelId: channelId, // 사용자 설정에 따른 채널 ID
                },
                token: fcmToken,
                android: {
                    priority: 'high',
                },
            };

            const response = await admin.messaging().send(fcmMessage);

            console.log(`✅ DM 알림 전송 완료:`, response);
        } catch (error) {
            console.error('❌ DM 알림 전송 실패:', error);
        }
    });
