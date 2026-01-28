package com.testsnote.app;

import android.app.ActivityManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import me.leolin.shortcutbadger.ShortcutBadger;
import java.util.List;

/**
 * Firebase Cloud Messaging 서비스
 * 백그라운드에서 FCM 알림을 수신하고 처리
 */
public class MyFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "FCMService";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Log.d(TAG, "📬 FCM 메시지 수신: " + remoteMessage.getFrom());

        // 앱이 포그라운드인지 확인
        boolean isAppInForeground = isAppInForeground();
        Log.d(TAG, "📱 앱 상태: " + (isAppInForeground ? "포그라운드 (알림 표시 안 함)" : "백그라운드 (알림 표시)"));

        // 포그라운드에서는 알림 팝업 표시하지 않음
        // Capacitor의 pushNotificationReceived 리스너가 처리함
        if (isAppInForeground) {
            Log.d(TAG, "⏭️ 포그라운드 상태 - 알림 표시 건너뜀 (JS에서 소리만 재생)");
            return;
        }

        // 백그라운드에서만 알림 표시
        // 알림 데이터 확인
        if (remoteMessage.getData().size() > 0) {
            Log.d(TAG, "📦 Data Payload: " + remoteMessage.getData());

            String type = remoteMessage.getData().get("type");
            String title = remoteMessage.getData().get("title");
            String body = remoteMessage.getData().get("body");

            // notification 필드가 있으면 우선 사용
            if (remoteMessage.getNotification() != null) {
                title = remoteMessage.getNotification().getTitle();
                body = remoteMessage.getNotification().getBody();
            }

            // 알림 표시 (백그라운드에서만)
            sendNotification(title, body, type, remoteMessage.getData());
        }

        // Notification payload가 있는 경우
        if (remoteMessage.getNotification() != null) {
            Log.d(TAG, "📢 Notification: " + remoteMessage.getNotification().getTitle());
        }
    }

    /**
     * 앱이 포그라운드에서 실행 중인지 확인
     */
    private boolean isAppInForeground() {
        ActivityManager activityManager = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
        List<ActivityManager.RunningAppProcessInfo> appProcesses = activityManager.getRunningAppProcesses();
        if (appProcesses == null) {
            return false;
        }
        final String packageName = getPackageName();
        for (ActivityManager.RunningAppProcessInfo appProcess : appProcesses) {
            if (appProcess.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
                    && appProcess.processName.equals(packageName)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 알림 표시
     */
    private void sendNotification(String title, String body, String type, java.util.Map<String, String> data) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);

        // 데이터를 Intent에 추가
        for (java.util.Map.Entry<String, String> entry : data.entrySet()) {
            intent.putExtra(entry.getKey(), entry.getValue());
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE
        );

        // 알림 채널 ID 결정 (data에서 channelId가 지정되어 있으면 사용)
        String channelId = data.get("channelId");
        if (channelId == null || channelId.isEmpty()) {
            // 기본값: type에 따라 결정
            channelId = "chat".equals(type) ? "chat_channel_v3" : "alarm_channel";
        }
        Log.d(TAG, "🔔 사용할 채널 ID: " + channelId);

        NotificationCompat.Builder notificationBuilder =
            new NotificationCompat.Builder(this, channelId)
                .setSmallIcon(android.R.drawable.ic_dialog_info) // 기본 아이콘 사용
                .setContentTitle(title)
                .setContentText(body)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pendingIntent);
        // 소리와 진동은 알림 채널에서 설정된 것을 사용 (중복 방지)

        NotificationManager notificationManager =
            (NotificationManager) getSystemService(NOTIFICATION_SERVICE);

        // Android O 이상에서는 채널이 필수
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = notificationManager.getNotificationChannel(channelId);
            if (channel == null) {
                Log.e(TAG, "❌ 채널이 없습니다: " + channelId);
                // 채널이 없으면 생성
                createNotificationChannel(notificationManager, channelId);
            }
        }

        // 알림 표시
        int notificationId = (int) System.currentTimeMillis();
        notificationManager.notify(notificationId, notificationBuilder.build());

        Log.d(TAG, "✅ 알림 표시 완료: " + title);

        // 배지는 BottomNav.jsx에서 자동으로 관리됨 (앱이 열려있을 때)
        // FCM에서는 배지를 업데이트하지 않음
    }

    /**
     * Notification Channel 생성 (백업용)
     * 채팅 채널은 sharenote.mp3, 알람은 notification_sound.wav 사용
     */
    private void createNotificationChannel(NotificationManager notificationManager, String channelId) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // 채널 타입에 따라 다른 알림음 사용
            Uri customSoundUri;
            if (channelId.startsWith("chat_channel_v3")) {
                // 채팅 채널은 sharenote.mp3 사용
                customSoundUri = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.sharenote);
            } else {
                // 알람 채널은 notification_sound.wav 사용
                customSoundUri = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.notification_sound);
            }

            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .build();

            String channelName = channelId.startsWith("chat_channel") ? "채팅" : "알람";
            NotificationChannel channel = new NotificationChannel(
                channelId,
                channelName,
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("새 메시지 알림");
            channel.enableVibration(true);
            channel.setShowBadge(true);
            channel.setSound(customSoundUri, audioAttributes);

            notificationManager.createNotificationChannel(channel);
            Log.d(TAG, "✅ 채널 생성 완료 (커스텀 사운드): " + channelId);
        }
    }

    @Override
    public void onNewToken(String token) {
        Log.d(TAG, "🔑 새 FCM 토큰: " + token);
        // TODO: 서버에 토큰 전송 (Capacitor가 처리함)
    }
}
