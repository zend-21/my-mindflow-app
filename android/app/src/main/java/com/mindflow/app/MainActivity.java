package com.mindflow.app;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.view.ViewGroup;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Log.d("MainActivity", "🚀 onCreate 시작");

        // ⚠️ CRITICAL: registerPlugin()은 super.onCreate() 이전에 호출되어야 함 (Capacitor 4+)
        registerPlugin(BadgePlugin.class);
        Log.d("MainActivity", "✅ BadgePlugin 등록 완료");
        registerPlugin(NotificationSettingsPlugin.class);
        Log.d("MainActivity", "✅ NotificationSettingsPlugin 등록 완료");

        super.onCreate(savedInstanceState);
        Log.d("MainActivity", "✅ super.onCreate() 완료");

        // FCM 알림 채널 생성 (Android 8.0+) - Context 초기화 후 실행
        createNotificationChannels();
        Log.d("MainActivity", "✅ createNotificationChannels() 호출 완료");

        // 화면 겹침 방지 (Android edge-to-edge 처리)
        handleEdgeToEdge();
        Log.d("MainActivity", "✅ handleEdgeToEdge() 호출 완료");

        // WebView 폰트 크기 고정 (시스템 폰트 크기 설정 무시)
        bridge.getWebView().getSettings().setTextZoom(100);
        Log.d("MainActivity", "✅ WebView 텍스트 줌 100%로 고정");
    }

    /**
     * Android edge-to-edge 화면 겹침 방지
     * WebView에 시스템바 insets을 margin으로 적용
     */
    private void handleEdgeToEdge() {
        ViewCompat.setOnApplyWindowInsetsListener(bridge.getWebView(), (v, windowInsets) -> {
            Insets insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
            ViewGroup.MarginLayoutParams mlp = (ViewGroup.MarginLayoutParams) v.getLayoutParams();
            mlp.leftMargin = insets.left;
            mlp.bottomMargin = insets.bottom;
            mlp.rightMargin = insets.right;
            mlp.topMargin = insets.top;
            v.setLayoutParams(mlp);
            Log.d("MainActivity", "📐 Insets 적용: top=" + insets.top + ", bottom=" + insets.bottom);
            return WindowInsetsCompat.CONSUMED;
        });
    }

    /**
     * FCM 알림 채널 생성 (Android 8.0 이상)
     * 커스텀 알림음 사용 (notification_sound.wav)
     */
    private void createNotificationChannels() {
        Log.d("MainActivity", "📱 createNotificationChannels() 시작");
        Log.d("MainActivity", "📱 Android SDK 버전: " + Build.VERSION.SDK_INT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Log.d("MainActivity", "✅ Android 8.0+ 감지 - 채널 생성 시작");

            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            Log.d("MainActivity", "NotificationManager: " + (notificationManager != null ? "OK" : "NULL"));

            // 채팅 알림음 URI 생성 (res/raw/sharenote.mp3)
            Uri chatSoundUri = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.sharenote);
            Log.d("MainActivity", "🔊 채팅 알림음 URI: " + chatSoundUri);

            // 타이머 알림음 URI 생성 (res/raw/timer_alarm.mp3)
            Uri timerSoundUri = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.timer_alarm);
            Log.d("MainActivity", "🔊 타이머 알림음 URI: " + timerSoundUri);

            // 스케줄 알람음 URI 생성 (res/raw/schedule_alarm.mp3)
            Uri alarmSoundUri = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.schedule_alarm);
            Log.d("MainActivity", "🔊 스케줄 알람음 URI: " + alarmSoundUri);

            // 알림음이 배경음악과 믹스되어 재생되도록 설정
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .build();

            // 1. 타이머 채널 - timer_alarm.mp3 사용
            NotificationChannel timerChannel = new NotificationChannel(
                "timer_channel",
                "타이머",
                NotificationManager.IMPORTANCE_HIGH
            );
            timerChannel.setDescription("타이머 완료 알림");
            timerChannel.enableVibration(true);
            timerChannel.setShowBadge(false); // 타이머는 배지 표시 안 함
            timerChannel.setSound(timerSoundUri, audioAttributes);
            Log.d("MainActivity", "✅ 타이머 채널 생성 완료 (timer_alarm.mp3)");

            // 2. 알람 채널 (소리 + 진동) - schedule_alarm.mp3 사용
            NotificationChannel alarmChannel = new NotificationChannel(
                "alarm_channel_v2",
                "캘린더 알람 (소리+진동)",
                NotificationManager.IMPORTANCE_HIGH
            );
            alarmChannel.setDescription("캘린더 스케줄 알람 (소리+진동)");
            alarmChannel.enableVibration(true);
            alarmChannel.setShowBadge(true);
            alarmChannel.setSound(alarmSoundUri, audioAttributes);
            Log.d("MainActivity", "✅ 알람 채널 생성 완료 (schedule_alarm.mp3)");

            // 2-1. 알람 소리만 채널 (진동 없음)
            NotificationChannel alarmSoundOnlyChannel = new NotificationChannel(
                "alarm_channel_sound_only_v2",
                "캘린더 알람 (소리만)",
                NotificationManager.IMPORTANCE_HIGH
            );
            alarmSoundOnlyChannel.setDescription("캘린더 알람 (소리만, 진동 없음)");
            alarmSoundOnlyChannel.enableVibration(false);
            alarmSoundOnlyChannel.setShowBadge(true);
            alarmSoundOnlyChannel.setSound(alarmSoundUri, audioAttributes);
            Log.d("MainActivity", "✅ 알람 소리만 채널 생성 완료");

            // 2-2. 알람 진동만 채널 (소리 없음)
            NotificationChannel alarmVibrationOnlyChannel = new NotificationChannel(
                "alarm_channel_vibration_only_v2",
                "캘린더 알람 (진동만)",
                NotificationManager.IMPORTANCE_HIGH
            );
            alarmVibrationOnlyChannel.setDescription("캘린더 알람 (진동만, 소리 없음)");
            alarmVibrationOnlyChannel.enableVibration(true);
            alarmVibrationOnlyChannel.setShowBadge(true);
            alarmVibrationOnlyChannel.setSound(null, null);
            Log.d("MainActivity", "✅ 알람 진동만 채널 생성 완료");

            // 3. 채팅 채널 (채팅 메시지) - sharenote.mp3 사용
            NotificationChannel chatChannel = new NotificationChannel(
                "chat_channel_v3",
                "채팅",
                NotificationManager.IMPORTANCE_HIGH
            );
            chatChannel.setDescription("새 채팅 메시지 알림");
            chatChannel.enableVibration(true);
            chatChannel.setShowBadge(true);
            chatChannel.setSound(chatSoundUri, audioAttributes);
            Log.d("MainActivity", "✅ 채팅 채널 생성 완료 (sharenote.mp3)");

            // 4. 채팅 소리만 채널 (진동 없음)
            NotificationChannel chatSoundOnlyChannel = new NotificationChannel(
                "chat_channel_sound_only_v3",
                "채팅 (소리만)",
                NotificationManager.IMPORTANCE_HIGH
            );
            chatSoundOnlyChannel.setDescription("채팅 알림 (소리만, 진동 없음)");
            chatSoundOnlyChannel.enableVibration(false);
            chatSoundOnlyChannel.setShowBadge(true);
            chatSoundOnlyChannel.setSound(chatSoundUri, audioAttributes);
            Log.d("MainActivity", "✅ 채팅 소리만 채널 생성 완료");

            // 5. 채팅 진동만 채널 (소리 없음)
            NotificationChannel chatVibrationOnlyChannel = new NotificationChannel(
                "chat_channel_vibration_only_v3",
                "채팅 (진동만)",
                NotificationManager.IMPORTANCE_HIGH
            );
            chatVibrationOnlyChannel.setDescription("채팅 알림 (진동만, 소리 없음)");
            chatVibrationOnlyChannel.enableVibration(true);
            chatVibrationOnlyChannel.setShowBadge(true);
            chatVibrationOnlyChannel.setSound(null, null);
            Log.d("MainActivity", "✅ 채팅 진동만 채널 생성 완료");

            // 6. 채팅 완전 무음 채널 (소리/진동 모두 없음)
            NotificationChannel chatAllSilentChannel = new NotificationChannel(
                "chat_channel_all_silent_v3",
                "채팅 (완전 무음)",
                NotificationManager.IMPORTANCE_HIGH
            );
            chatAllSilentChannel.setDescription("채팅 알림 (소리/진동 모두 없음)");
            chatAllSilentChannel.enableVibration(false);
            chatAllSilentChannel.setShowBadge(true);
            chatAllSilentChannel.setSound(null, null);
            Log.d("MainActivity", "✅ 채팅 완전 무음 채널 생성 완료");

            // 채널 등록
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(timerChannel);
                Log.d("MainActivity", "✅ 타이머 채널 등록 완료");
                notificationManager.createNotificationChannel(alarmChannel);
                Log.d("MainActivity", "✅ 알람 채널 등록 완료");
                notificationManager.createNotificationChannel(alarmSoundOnlyChannel);
                Log.d("MainActivity", "✅ 알람 소리만 채널 등록 완료");
                notificationManager.createNotificationChannel(alarmVibrationOnlyChannel);
                Log.d("MainActivity", "✅ 알람 진동만 채널 등록 완료");
                notificationManager.createNotificationChannel(chatChannel);
                Log.d("MainActivity", "✅ 채팅 채널 등록 완료");
                notificationManager.createNotificationChannel(chatSoundOnlyChannel);
                Log.d("MainActivity", "✅ 채팅 소리만 채널 등록 완료");
                notificationManager.createNotificationChannel(chatVibrationOnlyChannel);
                Log.d("MainActivity", "✅ 채팅 진동만 채널 등록 완료");
                notificationManager.createNotificationChannel(chatAllSilentChannel);
                Log.d("MainActivity", "✅ 채팅 완전 무음 채널 등록 완료");
            } else {
                Log.e("MainActivity", "❌ NotificationManager가 null입니다!");
            }
        } else {
            Log.d("MainActivity", "⚠️ Android 8.0 미만 - 채널 생성 건너뜀");
        }
    }
}
