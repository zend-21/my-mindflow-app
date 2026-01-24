package com.mindflow.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * ✅ 백그라운드 알람 플러그인 (앱 종료 후에도 작동)
 * - LocalNotifications의 한계 극복
 * - Android AlarmManager 직접 사용
 * - 앱이 완전히 종료되어도 알람 울림
 */
@CapacitorPlugin(name = "ScheduleAlarm")
public class ScheduleAlarmPlugin extends Plugin {

    private static final String TAG = "ScheduleAlarmPlugin";

    /**
     * 알람 예약
     * @param call - notificationId, title, body, triggerTime
     */
    @PluginMethod
    public void scheduleAlarm(PluginCall call) {
        Log.e(TAG, "================================================");
        Log.e(TAG, "🚨🚨🚨 [v14-REBUILD] scheduleAlarm 호출됨 🚨🚨🚨");
        Log.e(TAG, "📅 빌드: 2026-01-24 18:00 KST");
        Log.e(TAG, "🔧 Intent.setAction 적용됨");
        Log.e(TAG, "================================================");
        Log.d(TAG, "📅 scheduleAlarm 실행 시작");

        try {
            int notificationId = call.getInt("notificationId", -1);
            String title = call.getString("title", "알람");
            String body = call.getString("body", "");
            long triggerTime = call.getLong("triggerTime", 0L);
            // ✅ JavaScript 값을 무시하고 무조건 v10 사용!
            String channelId = "alarm_channel_v10";
            String soundFileName = call.getString("sound", "schedule_alarm");
            boolean enableVibration = call.getBoolean("enableVibration", true);

            if (notificationId == -1 || triggerTime == 0L) {
                call.reject("notificationId와 triggerTime은 필수입니다");
                return;
            }

            Log.d(TAG, "📋 알람 정보:");
            Log.d(TAG, "  - ID: " + notificationId);
            Log.d(TAG, "  - 제목: " + title);
            Log.d(TAG, "  - 내용: " + body);
            Log.d(TAG, "  - 시간: " + triggerTime);
            Log.d(TAG, "  - 채널: " + channelId + " (강제 v10)");

            Context context = getContext();
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

            // BroadcastReceiver로 전달할 Intent (명시적 action 설정)
            Intent intent = new Intent(context, AlarmReceiver.class);
            intent.setAction("com.mindflow.app.SCHEDULE_ALARM");  // ✅ 명시적 action
            intent.putExtra("notificationId", notificationId);
            intent.putExtra("title", title);
            intent.putExtra("body", body);
            intent.putExtra("channelId", channelId);
            intent.putExtra("sound", soundFileName);
            intent.putExtra("enableVibration", enableVibration);

            Log.d(TAG, "🎯 Intent Action 설정: com.mindflow.app.SCHEDULE_ALARM");

            // PendingIntent 생성 (Android 12+ FLAG_IMMUTABLE 필수)
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                notificationId,
                intent,
                flags
            );

            // ✅ Android 12+ 정확한 알람 권한 체크
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                boolean canSchedule = alarmManager.canScheduleExactAlarms();
                Log.d(TAG, "📱 Android 버전: " + Build.VERSION.SDK_INT + " (API 31+ = Android 12+)");
                Log.d(TAG, "🔍 canScheduleExactAlarms: " + canSchedule);

                if (!canSchedule) {
                    Log.e(TAG, "❌ [CRITICAL] 정확한 알람 권한이 없습니다!");
                    Log.e(TAG, "❌ 설정 > 앱 > ShareNote > 알람 및 리마인더 권한을 허용하세요");
                    call.reject("정확한 알람 권한이 필요합니다. 설정에서 허용해주세요.");
                    return;
                } else {
                    Log.d(TAG, "✅ 정확한 알람 권한 확인됨");
                }
            } else {
                Log.d(TAG, "✅ Android 11 이하 - 정확한 알람 권한 불필요");
            }

            // ✅ setExactAndAllowWhileIdle 사용 (배터리 절약 모드에서도 작동)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerTime,
                    pendingIntent
                );
                Log.d(TAG, "✅ setExactAndAllowWhileIdle 사용 (Android 6+)");
            } else {
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    triggerTime,
                    pendingIntent
                );
                Log.d(TAG, "✅ setExact 사용 (Android 5 이하)");
            }

            Log.d(TAG, "✅ 알람 예약 완료: " + notificationId);
            call.resolve();

        } catch (Exception e) {
            Log.e(TAG, "❌ 알람 예약 실패", e);
            call.reject("알람 예약 실패: " + e.getMessage());
        }
    }

    /**
     * 알람 취소
     * @param call - notificationId
     */
    @PluginMethod
    public void cancelAlarm(PluginCall call) {
        Log.d(TAG, "🗑️ cancelAlarm 호출됨");

        try {
            int notificationId = call.getInt("notificationId", -1);

            if (notificationId == -1) {
                call.reject("notificationId는 필수입니다");
                return;
            }

            Context context = getContext();
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

            Intent intent = new Intent(context, AlarmReceiver.class);
            intent.setAction("com.mindflow.app.SCHEDULE_ALARM");  // ✅ action 추가
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                notificationId,
                intent,
                flags
            );

            alarmManager.cancel(pendingIntent);
            pendingIntent.cancel();

            Log.d(TAG, "✅ 알람 취소 완료: " + notificationId);
            call.resolve();

        } catch (Exception e) {
            Log.e(TAG, "❌ 알람 취소 실패", e);
            call.reject("알람 취소 실패: " + e.getMessage());
        }
    }

    /**
     * 정확한 알람 권한 체크 (Android 12+)
     */
    @PluginMethod
    public void canScheduleExactAlarms(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager alarmManager = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
            boolean canSchedule = alarmManager.canScheduleExactAlarms();
            call.resolve(new com.getcapacitor.JSObject().put("canSchedule", canSchedule));
        } else {
            // Android 12 미만은 권한 필요 없음
            call.resolve(new com.getcapacitor.JSObject().put("canSchedule", true));
        }
    }
}
