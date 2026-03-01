<template>
  <view class="device-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">{{ t("device.title") }}</text>
    </view>

    <!-- 扫描区域 - H5 端隐藏 -->
    <PlatformGuard platform="app">
      <view class="card scan-card">
        <view class="scan-header">
          <text class="card-title">{{ t("device.scanButton") }}</text>
          <button
            v-if="!deviceStore.isScanning"
            class="scan-btn"
            @tap="onStartScan"
          >
            <text class="scan-btn-text">{{ t("device.scanButton") }}</text>
          </button>
          <button v-else class="scan-btn scan-btn-stop" @tap="onStopScan">
            <text class="scan-btn-text">{{ t("device.stopScan") }}</text>
          </button>
        </view>

        <!-- 扫描中指示器 -->
        <view v-if="deviceStore.isScanning" class="scanning-indicator">
          <view class="scanning-dot" />
          <text class="scanning-text">{{ t("device.scanning") }}</text>
        </view>

        <!-- 扫描结果列表 -->
        <view
          v-if="deviceStore.discoveredDevices.length > 0"
          class="scan-results"
        >
          <text class="section-label">{{ t("device.deviceFound") }}</text>
          <view
            v-for="device in deviceStore.discoveredDevices"
            :key="device.deviceId"
            class="scan-item"
          >
            <view class="scan-item-info">
              <text class="scan-item-name">{{ device.name }}</text>
              <text class="scan-item-rssi"
                >{{ t("device.signalStrength") }}: {{ device.RSSI }} dBm</text
              >
            </view>
            <button
              class="pair-btn"
              :disabled="
                pairingDeviceId === device.deviceId || !deviceStore.canPairMore
              "
              @tap="onPairDevice(device)"
            >
              <text class="pair-btn-text">{{
                pairingDeviceId === device.deviceId
                  ? t("device.pairing")
                  : !deviceStore.canPairMore
                  ? t("device.maxDevices")
                  : t("device.pair")
              }}</text>
            </button>
          </view>
        </view>
      </view>
    </PlatformGuard>

    <!-- 已配对设备列表 -->
    <view class="card paired-card">
      <text class="card-title">{{ t("device.pairedDevices") }}</text>

      <view v-if="deviceStore.pairedDevices.length === 0" class="empty-state">
        <text class="empty-text">{{ t("device.noPairedDevices") }}</text>
      </view>

      <view
        v-for="device in deviceStore.pairedDevices"
        :key="device.deviceId"
        class="device-detail-card"
      >
        <!-- 设备名称与配对时间 -->
        <view class="detail-header">
          <text class="detail-name">{{ device.name }}</text>
          <text class="detail-paired-at"
            >{{ t("device.pairedAt") }}: {{ formatTime(device.pairedAt) }}</text
          >
        </view>

        <!-- 连接状态 -->
        <view class="detail-row">
          <text class="detail-label">{{ t("device.connectionState") }}</text>
          <view
            class="status-badge"
            :class="'badge-' + getState(device.deviceId).connectionState"
          >
            <text class="status-badge-text">{{
              t("connectionState." + getState(device.deviceId).connectionState)
            }}</text>
          </view>
        </view>

        <!-- 电量 -->
        <view class="detail-row">
          <text class="detail-label">{{ t("device.battery") }}</text>
          <view class="battery-display">
            <text class="battery-icon">{{
              getBatteryIcon(getState(device.deviceId).battery)
            }}</text>
            <text class="battery-value">{{
              getState(device.deviceId).battery >= 0
                ? getState(device.deviceId).battery + "%"
                : t("device.batteryUnknown")
            }}</text>
          </view>
        </view>

        <!-- 固件版本 -->
        <view class="detail-row">
          <text class="detail-label">{{ t("device.firmwareVersion") }}</text>
          <text class="detail-value">{{
            device.firmwareVersion || t("device.firmwareUnknown")
          }}</text>
        </view>

        <!-- 操作按钮 -->
        <view class="detail-actions">
          <!-- 手动重连按钮 - H5 端隐藏 -->
          <PlatformGuard platform="app">
            <button
              v-if="getState(device.deviceId).connectionState !== 'connected'"
              class="action-btn reconnect-btn"
              :disabled="reconnectingDeviceId === device.deviceId"
              @tap="onReconnect(device.deviceId)"
            >
              <text class="action-btn-text">{{
                reconnectingDeviceId === device.deviceId
                  ? t("device.reconnecting")
                  : t("device.reconnect")
              }}</text>
            </button>
          </PlatformGuard>

          <button
            class="action-btn remove-btn"
            @tap="onRemoveDevice(device.deviceId)"
          >
            <text class="action-btn-text remove-btn-text">{{
              t("device.removeDevice")
            }}</text>
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useDeviceStore } from "@/stores/device.store";
import type { BLEDevice, DeviceRuntimeState } from "@/models/types";
// @ts-ignore - Vue SFC module
import PlatformGuard from "@/components/PlatformGuard.vue";

const { t } = useI18n();
const deviceStore = useDeviceStore();

const pairingDeviceId = ref<string | null>(null);
const reconnectingDeviceId = ref<string | null>(null);

/** Default runtime state for devices without one */
const defaultState: DeviceRuntimeState = {
  deviceId: "",
  connectionState: "disconnected",
  battery: -1,
  lastBatteryRead: 0,
};

/** Get runtime state for a device, with fallback */
function getState(deviceId: string): DeviceRuntimeState {
  return deviceStore.getRuntimeState(deviceId) ?? { ...defaultState, deviceId };
}

/** Format timestamp to readable date string */
function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/** Get battery icon based on level */
function getBatteryIcon(battery: number): string {
  if (battery < 0) return "🔋";
  if (battery <= 20) return "🪫";
  if (battery <= 50) return "🔋";
  return "🔋";
}

/** Start BLE scan */
async function onStartScan() {
  try {
    await deviceStore.startScan();
  } catch {
    uni.showToast({ title: t("device.bleNotEnabledTip"), icon: "none" });
  }
}

/** Stop BLE scan */
async function onStopScan() {
  await deviceStore.stopScan();
}

/** Pair a discovered device */
async function onPairDevice(device: BLEDevice) {
  if (!deviceStore.canPairMore) {
    uni.showToast({ title: t("device.maxDevices"), icon: "none" });
    return;
  }

  pairingDeviceId.value = device.deviceId;
  try {
    await deviceStore.pairDevice(device);
    uni.showToast({ title: t("device.pairSuccess"), icon: "success" });
  } catch {
    uni.showToast({ title: t("device.pairFailedTip"), icon: "none" });
  } finally {
    pairingDeviceId.value = null;
  }
}

/** Manual reconnect */
async function onReconnect(deviceId: string) {
  reconnectingDeviceId.value = deviceId;
  try {
    await deviceStore.manualReconnect(deviceId);
    uni.showToast({ title: t("connectionState.connected"), icon: "success" });
  } catch {
    uni.showToast({ title: t("device.reconnectFailedTip"), icon: "none" });
  } finally {
    reconnectingDeviceId.value = null;
  }
}

/** Remove a paired device with confirmation */
function onRemoveDevice(deviceId: string) {
  uni.showModal({
    title: t("dialogs.deleteTitle"),
    content: t("device.removeDeviceConfirm"),
    success: async (res) => {
      if (res.confirm) {
        await deviceStore.removeDevice(deviceId);
      }
    },
  });
}
</script>

<style scoped>
.device-page {
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

/* Scan section */
.scan-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.scan-btn {
  height: 64rpx;
  padding: 0 28rpx;
  border-radius: 12rpx;
  background-color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.scan-btn::after {
  border: none;
}

.scan-btn-stop {
  background-color: #ef4444;
}

.scan-btn-text {
  font-size: 26rpx;
  color: #ffffff;
  font-weight: 500;
}

/* Scanning indicator */
.scanning-indicator {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 0;
}

.scanning-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background-color: #2563eb;
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}

.scanning-text {
  font-size: 26rpx;
  color: #2563eb;
}

/* Scan results */
.scan-results {
  margin-top: 12rpx;
}

.section-label {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 12rpx;
}

.scan-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.scan-item:last-child {
  border-bottom: none;
}

.scan-item-info {
  flex: 1;
}

.scan-item-name {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.scan-item-rssi {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
}

.pair-btn {
  height: 56rpx;
  padding: 0 24rpx;
  border-radius: 10rpx;
  background-color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  margin-left: 16rpx;
}

.pair-btn::after {
  border: none;
}

.pair-btn[disabled] {
  opacity: 0.5;
}

.pair-btn-text {
  font-size: 24rpx;
  color: #ffffff;
  font-weight: 500;
}

/* Empty state */
.empty-state {
  padding: 40rpx 0;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

/* Device detail card */
.device-detail-card {
  background-color: #fafbfc;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  border: 1rpx solid #eef0f4;
}

.device-detail-card:last-child {
  margin-bottom: 0;
}

.detail-header {
  margin-bottom: 20rpx;
}

.detail-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a2e;
}

.detail-paired-at {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
}

/* Detail rows */
.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 0;
}

.detail-label {
  font-size: 26rpx;
  color: #666;
}

.detail-value {
  font-size: 26rpx;
  color: #333;
}

/* Status badge */
.status-badge {
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}

.badge-connected {
  background-color: rgba(34, 197, 94, 0.1);
}

.badge-disconnected {
  background-color: rgba(239, 68, 68, 0.1);
}

.badge-connecting {
  background-color: rgba(245, 158, 11, 0.1);
}

.status-badge-text {
  font-size: 24rpx;
  font-weight: 500;
}

.badge-connected .status-badge-text {
  color: #22c55e;
}

.badge-disconnected .status-badge-text {
  color: #ef4444;
}

.badge-connecting .status-badge-text {
  color: #f59e0b;
}

/* Battery display */
.battery-display {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.battery-icon {
  font-size: 28rpx;
}

.battery-value {
  font-size: 26rpx;
  color: #333;
}

/* Action buttons */
.detail-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #eef0f4;
}

.action-btn {
  flex: 1;
  height: 72rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.action-btn::after {
  border: none;
}

.action-btn[disabled] {
  opacity: 0.5;
}

.reconnect-btn {
  background-color: #2563eb;
}

.remove-btn {
  background-color: #fff;
  border: 1rpx solid #ef4444 !important;
}

.action-btn-text {
  font-size: 26rpx;
  color: #ffffff;
  font-weight: 500;
}

.remove-btn-text {
  color: #ef4444;
}
</style>
