<template>
  <view class="device-card" @tap="$emit('tap', device)">
    <view class="device-header">
      <text class="device-name">{{ device.name }}</text>
      <view class="status-badge" :class="`status-${connectionState}`">
        <text class="status-label">{{ statusLabel }}</text>
      </view>
    </view>
    <view class="device-meta">
      <view v-if="battery != null" class="meta-item">
        <text class="meta-icon">🔋</text>
        <text class="meta-value" :class="{ 'low-battery': battery < 20 }">
          {{ t("components.deviceCard.battery", { percent: battery }) }}
        </text>
      </view>
      <view v-if="rssi != null" class="meta-item">
        <text class="meta-icon">📶</text>
        <text class="meta-value">
          {{ t("components.deviceCard.signal", { rssi }) }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { PairedDevice, ConnectionState } from "@/models/types";

const props = defineProps<{
  device: PairedDevice;
  connectionState?: ConnectionState;
  battery?: number;
  rssi?: number;
}>();

defineEmits<{
  tap: [device: PairedDevice];
}>();

const { t } = useI18n();

const statusLabel = computed(() => {
  const state = props.connectionState ?? "disconnected";
  return t(`components.deviceCard.${state}`);
});
</script>

<style scoped>
.device-card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.device-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.device-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a2e;
}

.status-badge {
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
}

.status-connected {
  background-color: rgba(34, 197, 94, 0.12);
}

.status-disconnected {
  background-color: rgba(239, 68, 68, 0.12);
}

.status-connecting {
  background-color: rgba(245, 158, 11, 0.12);
}

.status-label {
  font-size: 24rpx;
  font-weight: 500;
}

.status-connected .status-label {
  color: #22c55e;
}

.status-disconnected .status-label {
  color: #ef4444;
}

.status-connecting .status-label {
  color: #f59e0b;
}

.device-meta {
  display: flex;
  align-items: center;
  gap: 32rpx;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.meta-icon {
  font-size: 26rpx;
}

.meta-value {
  font-size: 26rpx;
  color: #666;
}

.low-battery {
  color: #ef4444;
  font-weight: 500;
}
</style>
