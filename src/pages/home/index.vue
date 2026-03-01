<template>
  <view class="home-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">{{ $t("home.title") }}</text>
    </view>

    <!-- 设备状态卡片 -->
    <view class="card device-card">
      <text class="card-title">{{ $t("home.deviceStatus") }}</text>
      <view v-if="primaryDevice" class="device-info">
        <view class="status-row">
          <view class="status-dot" :class="connectionClass" />
          <text class="status-text">{{ connectionLabel }}</text>
        </view>
        <view
          v-if="
            deviceState?.connectionState === 'connected' &&
            deviceState.battery >= 0
          "
          class="battery-row"
        >
          <text class="battery-icon">🔋</text>
          <text class="battery-text">{{ deviceState.battery }}%</text>
        </view>
      </view>
      <view v-else class="no-device">
        <text class="no-device-text">{{ $t("home.noDevice") }}</text>
      </view>
    </view>

    <!-- 当前报警模式 -->
    <view class="card mode-card">
      <text class="card-title">{{ $t("home.currentMode") }}</text>
      <view class="mode-display">
        <text class="mode-name">{{ modeLabel }}</text>
      </view>
    </view>

    <!-- SOS 按钮 - H5 端隐藏 -->
    <PlatformGuard platform="app">
      <view class="sos-section">
        <button
          class="sos-button"
          :disabled="alarmStore.isAlarming"
          @tap="onSOSTap"
        >
          <text class="sos-text">{{ $t("home.sosButton") }}</text>
        </button>
      </view>
    </PlatformGuard>

    <!-- 安全计时器状态 -->
    <view class="card timer-card">
      <text class="card-title">{{ $t("home.safetyTimer") }}</text>
      <view v-if="utilityStore.timerState.isRunning" class="timer-running">
        <text class="timer-label">{{ $t("home.timerRunning") }}</text>
        <text class="timer-remaining">{{
          utilityStore.formattedRemaining
        }}</text>
      </view>
      <view v-else class="timer-idle">
        <text class="timer-idle-text">{{ $t("home.timerNotRunning") }}</text>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="card actions-card">
      <text class="card-title">{{ $t("home.quickActions") }}</text>
      <view class="actions-row">
        <button class="action-btn" @tap="onStartTimer">
          <text class="action-text">{{ $t("home.startTimer") }}</text>
        </button>
        <button class="action-btn" @tap="onFakeCall">
          <text class="action-text">{{ $t("home.fakeCall") }}</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useDeviceStore } from "@/stores/device.store";
import { useSafetyStore } from "@/stores/safety.store";
import { useAlarmStore } from "@/stores/alarm.store";
import { useUtilityStore } from "@/stores/utility.store";
// @ts-ignore - Vue SFC module
import PlatformGuard from "@/components/PlatformGuard.vue";

const { t } = useI18n();

const deviceStore = useDeviceStore();
const safetyStore = useSafetyStore();
const alarmStore = useAlarmStore();
const utilityStore = useUtilityStore();

/** First paired device (primary) */
const primaryDevice = computed(() => deviceStore.pairedDevices[0] ?? null);

/** Runtime state for primary device */
const deviceState = computed(() => {
  if (!primaryDevice.value) return null;
  return deviceStore.getRuntimeState(primaryDevice.value.deviceId) ?? null;
});

/** Connection status CSS class */
const connectionClass = computed(() => {
  const state = deviceState.value?.connectionState ?? "disconnected";
  return `status-${state}`;
});

/** Connection status label */
const connectionLabel = computed(() => {
  const state = deviceState.value?.connectionState ?? "disconnected";
  if (state === "connected") return t("home.connected");
  if (state === "connecting") return t("home.connecting");
  return t("home.disconnected");
});

/** Current alarm mode display label */
const modeLabel = computed(() => {
  const mode = safetyStore.alarmMode;
  return t(`alarmMode.${mode}`);
});

/** SOS button tap handler */
function onSOSTap() {
  uni.showModal({
    title: t("dialogs.alarmTitle"),
    content: t("home.sosConfirm"),
    success: (res) => {
      if (res.confirm) {
        triggerSOS();
      }
    },
  });
}

/** Execute SOS alarm */
async function triggerSOS() {
  const check = safetyStore.canEnableAlarm();
  if (!check.enabled) {
    uni.showToast({ title: check.message, icon: "none" });
    return;
  }
  try {
    await alarmStore.executeAlarmResponse("sos-manual");
    uni.showToast({ title: t("common.success"), icon: "success" });
  } catch {
    uni.showToast({ title: t("common.error"), icon: "none" });
  }
}

/** Navigate to start timer (settings page timer section) */
function onStartTimer() {
  if (utilityStore.timerState.isRunning) {
    uni.showToast({ title: t("home.timerRunning"), icon: "none" });
    return;
  }
  // Start a default 15-minute timer
  utilityStore.startTimer(15 * 60 * 1000);
  uni.showToast({ title: t("settings.timerStarted"), icon: "success" });
}

/** Trigger fake call */
function onFakeCall() {
  utilityStore.triggerFakeCall();
}
</script>

<style scoped>
.home-page {
  padding: 24rpx;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.page-header {
  padding: 20rpx 0 32rpx;
}

.page-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #1a1a2e;
}

/* Card base */
.card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.card-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #666;
  margin-bottom: 16rpx;
}

/* Device status */
.device-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.status-dot {
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
}

.status-connected {
  background-color: #22c55e;
}

.status-disconnected {
  background-color: #ef4444;
}

.status-connecting {
  background-color: #f59e0b;
}

.status-text {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.battery-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.battery-icon {
  font-size: 28rpx;
}

.battery-text {
  font-size: 28rpx;
  color: #555;
}

.no-device {
  padding: 12rpx 0;
}

.no-device-text {
  font-size: 28rpx;
  color: #999;
}

/* Alarm mode */
.mode-display {
  padding: 8rpx 0;
}

.mode-name {
  font-size: 34rpx;
  font-weight: 600;
  color: #2563eb;
}

/* SOS button */
.sos-section {
  display: flex;
  justify-content: center;
  padding: 32rpx 0;
}

.sos-button {
  width: 260rpx;
  height: 260rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 8rpx 30rpx rgba(239, 68, 68, 0.4);
}

.sos-button[disabled] {
  opacity: 0.5;
}

.sos-button::after {
  border: none;
}

.sos-text {
  font-size: 36rpx;
  font-weight: 700;
  color: #ffffff;
  text-align: center;
}

/* Timer */
.timer-running {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.timer-label {
  font-size: 28rpx;
  color: #22c55e;
  font-weight: 500;
}

.timer-remaining {
  font-size: 40rpx;
  font-weight: 700;
  color: #1a1a2e;
  font-variant-numeric: tabular-nums;
}

.timer-idle-text {
  font-size: 28rpx;
  color: #999;
}

/* Quick actions */
.actions-row {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 12rpx;
  background-color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.action-btn::after {
  border: none;
}

.action-text {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: 500;
}
</style>
