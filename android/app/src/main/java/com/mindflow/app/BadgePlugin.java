package com.mindflow.app;

import android.content.Context;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import me.leolin.shortcutbadger.ShortcutBadger;

@CapacitorPlugin(name = "Badge")
public class BadgePlugin extends Plugin {

    /**
     * 배지 숫자 설정
     */
    @PluginMethod
    public void set(PluginCall call) {
        Integer count = call.getInt("count");
        if (count == null) {
            call.reject("Count is required");
            return;
        }

        Context context = getContext();
        try {
            boolean success = ShortcutBadger.applyCount(context, count);

            JSObject ret = new JSObject();
            ret.put("success", success);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to set badge", e);
        }
    }

    /**
     * 배지 제거
     */
    @PluginMethod
    public void clear(PluginCall call) {
        Context context = getContext();
        try {
            boolean success = ShortcutBadger.removeCount(context);

            JSObject ret = new JSObject();
            ret.put("success", success);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to clear badge", e);
        }
    }

    /**
     * 배지 증가
     */
    @PluginMethod
    public void increase(PluginCall call) {
        Integer amount = call.getInt("amount", 1);

        // 현재 값을 가져올 수 없으므로, JavaScript에서 관리하도록 안내
        call.reject("Use set() method instead. Badge count should be managed in JavaScript.");
    }

    /**
     * 배지 감소
     */
    @PluginMethod
    public void decrease(PluginCall call) {
        Integer amount = call.getInt("amount", 1);

        // 현재 값을 가져올 수 없으므로, JavaScript에서 관리하도록 안내
        call.reject("Use set() method instead. Badge count should be managed in JavaScript.");
    }
}
