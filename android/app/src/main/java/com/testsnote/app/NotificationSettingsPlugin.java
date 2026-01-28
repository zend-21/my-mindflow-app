package com.testsnote.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * 알림 설정 관리 플러그인
 * JavaScript에서 안드로이드 SharedPreferences에 접근하여 알림 설정 저장/조회
 */
@CapacitorPlugin(name = "NotificationSettings")
public class NotificationSettingsPlugin extends Plugin {
    private static final String TAG = "NotificationSettings";
    private static final String PREFS_NAME = "NotificationSettings";
    private static final String KEY_SOUND_ENABLED = "soundEnabled";
    private static final String KEY_VOLUME = "volume";

    /**
     * 알림음 활성화 상태 저장
     */
    @PluginMethod
    public void setSoundEnabled(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled", true);

        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putBoolean(KEY_SOUND_ENABLED, enabled);
        editor.apply();

        Log.d(TAG, "🔔 알림음 설정 저장: " + enabled);

        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("enabled", enabled);
        call.resolve(ret);
    }

    /**
     * 알림음 볼륨 저장
     */
    @PluginMethod
    public void setVolume(PluginCall call) {
        Double volume = call.getDouble("volume", 0.1);

        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putFloat(KEY_VOLUME, volume.floatValue());
        editor.apply();

        Log.d(TAG, "🔊 알림음 볼륨 저장: " + volume);

        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("volume", volume);
        call.resolve(ret);
    }

    /**
     * 알림음 활성화 상태 조회
     */
    @PluginMethod
    public void getSoundEnabled(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean enabled = prefs.getBoolean(KEY_SOUND_ENABLED, true);

        Log.d(TAG, "🔔 알림음 설정 조회: " + enabled);

        JSObject ret = new JSObject();
        ret.put("enabled", enabled);
        call.resolve(ret);
    }

    /**
     * 알림음 볼륨 조회
     */
    @PluginMethod
    public void getVolume(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        float volume = prefs.getFloat(KEY_VOLUME, 0.1f);

        Log.d(TAG, "🔊 알림음 볼륨 조회: " + volume);

        JSObject ret = new JSObject();
        ret.put("volume", volume);
        call.resolve(ret);
    }

    /**
     * FCM에서 사용할 채널 ID 반환 (알림음 설정에 따라)
     */
    @PluginMethod
    public void getChatChannelId(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean enabled = prefs.getBoolean(KEY_SOUND_ENABLED, true);

        String channelId = enabled ? "chat_channel" : "chat_channel_silent";

        Log.d(TAG, "📢 채팅 채널 ID 반환: " + channelId + " (알림음: " + enabled + ")");

        JSObject ret = new JSObject();
        ret.put("channelId", channelId);
        ret.put("soundEnabled", enabled);
        call.resolve(ret);
    }
}
