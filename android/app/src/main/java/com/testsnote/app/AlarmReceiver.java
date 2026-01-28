package com.testsnote.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;

/**
 * ✅ 알람 트리거 시 실행되는 BroadcastReceiver
 * - 앱이 종료되어 있어도 작동
 * - 알림 생성 및 소리/진동 처리
 */
public class AlarmReceiver extends BroadcastReceiver {

    private static final String TAG = "AlarmReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "🔔 AlarmReceiver.onReceive() 호출됨");
        Log.d(TAG, "📱 앱 상태: " + (isAppRunning(context) ? "실행 중" : "종료됨"));

        try {
            int notificationId = intent.getIntExtra("notificationId", -1);
            String title = intent.getStringExtra("title");
            String body = intent.getStringExtra("body");
            String channelId = intent.getStringExtra("channelId");
            String soundFileName = intent.getStringExtra("sound");
            boolean enableVibration = intent.getBooleanExtra("enableVibration", true);

            Log.d(TAG, "📋 알람 정보:");
            Log.d(TAG, "  - ID: " + notificationId);
            Log.d(TAG, "  - 제목: " + title);
            Log.d(TAG, "  - 내용: " + body);
            Log.d(TAG, "  - 채널: " + channelId);
            Log.d(TAG, "  - 현재 시간: " + System.currentTimeMillis());

            if (notificationId == -1 || title == null) {
                Log.e(TAG, "❌ 필수 데이터가 없습니다");
                return;
            }

            // ✅ 소리 URI 강제 지정 (리소스 ID 사용)
            Uri soundUri = Uri.parse("android.resource://" + context.getPackageName() + "/" + R.raw.schedule_alarm);
            Log.d(TAG, "🔊 알림음 URI 생성: " + soundUri);

            // 앱 실행 Intent (일반 클릭)
            Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
            if (launchIntent == null) {
                launchIntent = new Intent(context, MainActivity.class);
            }
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pendingIntent = PendingIntent.getActivity(context, notificationId, launchIntent, flags);

            // ✅ [백그라운드 알람] Full Screen Intent 생성
            // 백그라운드에서도 화면을 깨우고 알림을 즉시 표시
            Intent fullScreenIntent = new Intent(context, MainActivity.class);
            fullScreenIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
                context,
                notificationId + 1000,
                fullScreenIntent,
                flags
            );

            // ✅ 알림 생성
            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
                .setSmallIcon(context.getApplicationInfo().icon)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setAutoCancel(true)
                .setSound(soundUri)  // ✅ 소리 설정
                .setDefaults(NotificationCompat.DEFAULT_VIBRATE)  // ✅ 진동 설정
                .setFullScreenIntent(pendingIntent, true);

            // 알림 표시
            NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                // ✅ 채널 존재 확인 (안전장치)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    NotificationChannel existingChannel = notificationManager.getNotificationChannel(channelId);
                    if (existingChannel == null) {
                        Log.e(TAG, "❌ 채널이 존재하지 않습니다: " + channelId);
                    } else {
                        Log.d(TAG, "✅ 채널 존재 확인: " + channelId + " - 소리: " + (existingChannel.getSound() != null));
                    }
                }

                notificationManager.notify(notificationId, builder.build());
                Log.d(TAG, "✅ 알림 표시 완료");
            } else {
                Log.e(TAG, "❌ NotificationManager가 null입니다");
            }

            // ✅ [긴급 수정] 알림 채널 소리가 작동하지 않으므로 MediaPlayer로 직접 재생
            // MediaPlayer를 사용하여 알람음을 명시적으로 재생 (BroadcastReceiver에서 안전)
            if (soundUri != null) {
                try {
                    Log.d(TAG, "🔊 MediaPlayer로 직접 알람음 재생 시작: " + soundUri);

                    final MediaPlayer mediaPlayer = new MediaPlayer();

                    // 알림 스트림 사용 (알림 볼륨 사용, 방해금지 모드 존중)
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        AudioAttributes audioAttributes = new AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build();
                        mediaPlayer.setAudioAttributes(audioAttributes);
                        Log.d(TAG, "✅ MediaPlayer AudioAttributes 설정: USAGE_NOTIFICATION");
                    } else {
                        mediaPlayer.setAudioStreamType(AudioManager.STREAM_NOTIFICATION);
                        Log.d(TAG, "✅ MediaPlayer StreamType 설정: STREAM_NOTIFICATION");
                    }

                    mediaPlayer.setDataSource(context, soundUri);
                    mediaPlayer.setLooping(false);
                    mediaPlayer.prepare();
                    mediaPlayer.start();

                    Log.d(TAG, "✅ MediaPlayer.start() 호출 완료");
                    Log.d(TAG, "🎵 재생 시간: " + mediaPlayer.getDuration() + "ms");

                    // 재생 완료 시 자동으로 리소스 해제
                    mediaPlayer.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
                        @Override
                        public void onCompletion(MediaPlayer mp) {
                            Log.d(TAG, "✅ 알람음 재생 완료");
                            mp.release();
                        }
                    });

                    // 에러 발생 시 처리
                    mediaPlayer.setOnErrorListener(new MediaPlayer.OnErrorListener() {
                        @Override
                        public boolean onError(MediaPlayer mp, int what, int extra) {
                            Log.e(TAG, "❌ MediaPlayer 에러: what=" + what + ", extra=" + extra);
                            mp.release();
                            return true;
                        }
                    });

                } catch (Exception e) {
                    Log.e(TAG, "❌ MediaPlayer 알람음 재생 실패", e);
                }
            } else {
                Log.d(TAG, "⚠️ soundUri가 null - 알람음 재생 건너뜀");
            }

        } catch (Exception e) {
            Log.e(TAG, "❌ 알림 생성 실패", e);
        }
    }

    /**
     * 앱이 실행 중인지 확인
     */
    private boolean isAppRunning(Context context) {
        android.app.ActivityManager activityManager = (android.app.ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
        if (activityManager != null) {
            for (android.app.ActivityManager.RunningAppProcessInfo processInfo : activityManager.getRunningAppProcesses()) {
                if (processInfo.processName.equals(context.getPackageName())) {
                    return true;
                }
            }
        }
        return false;
    }
}
