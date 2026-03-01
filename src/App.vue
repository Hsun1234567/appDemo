<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { useDeviceStore } from "@/stores/device.store";
import { useSafetyStore } from "@/stores/safety.store";
import { useUtilityStore } from "@/stores/utility.store";

onLaunch(async () => {
  console.log("App Launch");

  // Initialize stores: load paired devices, settings, and utility config from storage
  const safetyStore = useSafetyStore();
  const deviceStore = useDeviceStore();
  const utilityStore = useUtilityStore();

  try {
    await safetyStore.init();
  } catch (e) {
    console.error("[App] 安全设置初始化失败:", e);
  }

  try {
    await deviceStore.init();
  } catch (e) {
    console.error("[App] 设备管理初始化失败:", e);
  }

  try {
    await utilityStore.init();
  } catch (e) {
    console.error("[App] 辅助功能初始化失败:", e);
  }

  // #ifdef APP-PLUS
  // Register BLE alarm signal listener → alarm response flow
  const { useAlarmStore } = await import("@/stores/alarm.store");
  const alarmStore = useAlarmStore();
  deviceStore.onAlarmSignal(async (deviceId: string) => {
    console.log("[App] 收到报警信号:", deviceId);
    try {
      await alarmStore.executeAlarmResponse(deviceId);
    } catch (err) {
      console.error("[App] 报警响应失败:", err);
    }
  });
  // #endif
});

onShow(() => {
  console.log("App Show");
});

onHide(() => {
  console.log("App Hide");
});
</script>
<style></style>
