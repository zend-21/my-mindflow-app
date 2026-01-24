package com.mindflow.app;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Log.d("MainActivity", "🚀 onCreate 시작");

        // ⚠️ CRITICAL: registerPlugin()은 super.onCreate() 이전에 호출되어야 함 (Capacitor 4+)
        registerPlugin(BadgePlugin.class);
        Log.d("MainActivity", "✅ BadgePlugin 등록 완료");
        registerPlugin(NotificationSettingsPlugin.class);
        Log.d("MainActivity", "✅ NotificationSettingsPlugin 등록 완료");
        registerPlugin(ScheduleAlarmPlugin.class);
        Log.d("MainActivity", "✅ ScheduleAlarmPlugin 등록 완료");

        super.onCreate(savedInstanceState);
        Log.d("MainActivity", "✅ super.onCreate() 완료");

        // WebView 디버깅 활성화 (Chrome/Edge DevTools에서 디버깅 가능)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            android.webkit.WebView.setWebContentsDebuggingEnabled(true);
            Log.d("MainActivity", "✅ WebView 디버깅 활성화 완료");
        }

        // FCM 알림 채널 생성 (Android 8.0+) - Context 초기화 후 실행
        createNotificationChannels();
        Log.d("MainActivity", "✅ createNotificationChannels() 호출 완료");

        // 화면 겹침 방지 (Android edge-to-edge 처리)
        handleEdgeToEdge();
        Log.d("MainActivity", "✅ handleEdgeToEdge() 호출 완료");

        // 상태바/네비게이션바 색상 강제 적용
        setupSystemBars();
        Log.d("MainActivity", "✅ setupSystemBars() 호출 완료");

        // WebView 폰트 크기 고정 (시스템 폰트 크기 설정 무시)
        bridge.getWebView().getSettings().setTextZoom(100);
        Log.d("MainActivity", "✅ WebView 텍스트 줌 100%로 고정");
    }

    @Override
    public void onResume() {
        super.onResume();
        // 앱이 포그라운드로 올 때마다 시스템바 색상 재적용 (플러그인 덮어쓰기 방지)
        setupSystemBars();
        Log.d("MainActivity", "✅ onResume - setupSystemBars() 재적용");
    }

    /**
     * 상태바/네비게이션바 색상 강제 적용
     * ============================================================
     * - 상태바 배경색: #2a2d34 (헤더 상단과 동일)
     * - 네비게이션바 배경색: #202126 (푸터와 동일)
     * - 아이콘/텍스트: #ffffff (흰색)
     * - 네비게이션 버튼: #ffffff (흰색)
     *
     * ⚠️ 사용자의 지시를 받기 전 변경 불가
     * ============================================================
     */
    private void setupSystemBars() {
        Window window = getWindow();

        // 상태바 색상 설정: #2a2d34
        window.setStatusBarColor(Color.parseColor("#2a2d34"));

        // 네비게이션바 색상 설정: #202126
        window.setNavigationBarColor(Color.parseColor("#202126"));

        // WindowInsetsControllerCompat을 사용하여 아이콘 색상 제어
        WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(window, window.getDecorView());
        if (insetsController != null) {
            // 상태바 아이콘을 밝은 색(흰색)으로 설정 (어두운 배경용)
            insetsController.setAppearanceLightStatusBars(false);
            // 네비게이션바 버튼을 밝은 색(흰색)으로 설정 (어두운 배경용)
            insetsController.setAppearanceLightNavigationBars(false);
            Log.d("MainActivity", "🎨 시스템바 아이콘 흰색으로 설정 완료");
        }

        Log.d("MainActivity", "🎨 상태바: #2a2d34, 네비게이션바: #202126");
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

            // 일반 알림음 설정 (채팅, 타이머 등)
            AudioAttributes notificationAudioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .build();

            // ✅ 알람 전용 AudioAttributes (백그라운드에서도 울림)
            AudioAttributes alarmAudioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_ALARM)  // ← 알람용으로 변경!
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
            timerChannel.setSound(timerSoundUri, notificationAudioAttributes);
            Log.d("MainActivity", "✅ 타이머 채널 생성 완료 (timer_alarm.mp3)");

            // 2. 알람 채널 (소리 + 진동) - schedule_alarm.mp3 사용
            NotificationChannel alarmChannel = new NotificationChannel(
                "alarm_channel_v2",
                "캘린더 알람 (소리+진동)",
                NotificationManager.IMPORTANCE_MAX  // ✅ 백그라운드 알람을 위해 MAX 사용
            );
            alarmChannel.setDescription("캘린더 스케줄 알람 (소리+진동)");
            alarmChannel.enableVibration(true);
            alarmChannel.setShowBadge(true);
            alarmChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);  // ✅ 잠금화면 표시
            alarmChannel.setSound(alarmSoundUri, alarmAudioAttributes);  // ✅ 알람용 속성 사용
            Log.d("MainActivity", "✅ 알람 채널 생성 완료 (schedule_alarm.mp3)");

            // 2-1. 알람 소리만 채널 (진동 없음)
            NotificationChannel alarmSoundOnlyChannel = new NotificationChannel(
                "alarm_channel_sound_only_v2",
                "캘린더 알람 (소리만)",
                NotificationManager.IMPORTANCE_MAX  // ✅ 백그라운드 알람을 위해 MAX 사용
            );
            alarmSoundOnlyChannel.setDescription("캘린더 알람 (소리만, 진동 없음)");
            alarmSoundOnlyChannel.enableVibration(false);
            alarmSoundOnlyChannel.setShowBadge(true);
            alarmSoundOnlyChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);  // ✅ 잠금화면 표시
            alarmSoundOnlyChannel.setSound(alarmSoundUri, alarmAudioAttributes);  // ✅ 알람용 속성 사용
            Log.d("MainActivity", "✅ 알람 소리만 채널 생성 완료");

            // 2-2. 알람 진동만 채널 (소리 없음)
            NotificationChannel alarmVibrationOnlyChannel = new NotificationChannel(
                "alarm_channel_vibration_only_v2",
                "캘린더 알람 (진동만)",
                NotificationManager.IMPORTANCE_MAX  // ✅ 백그라운드 알람을 위해 MAX 사용
            );
            alarmVibrationOnlyChannel.setDescription("캘린더 알람 (진동만, 소리 없음)");
            alarmVibrationOnlyChannel.enableVibration(true);
            alarmVibrationOnlyChannel.setShowBadge(true);
            alarmVibrationOnlyChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);  // ✅ 잠금화면 표시
            alarmVibrationOnlyChannel.setSound(null, null);
            Log.d("MainActivity", "✅ 알람 진동만 채널 생성 완료");

            // 3. 채팅 채널 (채팅 메시지) - sharenote.mp3 사용
            NotificationChannel chatChannel = new NotificationChannel(
                "chat_channel_v4",
                "채팅",
                NotificationManager.IMPORTANCE_HIGH
            );
            chatChannel.setDescription("새 채팅 메시지 알림");
            chatChannel.enableVibration(true);
            chatChannel.setShowBadge(true);
            chatChannel.setSound(chatSoundUri, notificationAudioAttributes);
            Log.d("MainActivity", "✅ 채팅 채널 생성 완료 (sharenote.mp3)");

            // 4. 채팅 소리만 채널 (진동 없음)
            NotificationChannel chatSoundOnlyChannel = new NotificationChannel(
                "chat_channel_sound_only_v4",
                "채팅 (소리만)",
                NotificationManager.IMPORTANCE_HIGH
            );
            chatSoundOnlyChannel.setDescription("채팅 알림 (소리만, 진동 없음)");
            chatSoundOnlyChannel.enableVibration(false);
            chatSoundOnlyChannel.setShowBadge(true);
            chatSoundOnlyChannel.setSound(chatSoundUri, notificationAudioAttributes);
            Log.d("MainActivity", "✅ 채팅 소리만 채널 생성 완료");

            // 5. 채팅 진동만 채널 (소리 없음)
            NotificationChannel chatVibrationOnlyChannel = new NotificationChannel(
                "chat_channel_vibration_only_v4",
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
                "chat_channel_all_silent_v4",
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
