<template>
  <view class="alarm-record-item" @tap="$emit('tap', record)">
    <view class="record-header">
      <text class="record-time">{{ formattedTime }}</text>
      <view class="mode-badge" :class="`mode-${record.alarmMode}`">
        <text class="mode-label">{{ modeLabel }}</text>
      </view>
    </view>
    <text class="record-location">{{ locationSummary }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { AlarmRecord } from "@/models/types";

const props = defineProps<{
  record: AlarmRecord;
}>();

defineEmits<{
  tap: [record: AlarmRecord];
}>();

const { t } = useI18n();

const modeLabel = computed(() => {
  const key = `components.alarmRecordItem.mode${capitalize(
    props.record.alarmMode
  )}`;
  return t(key);
});

const formattedTime = computed(() => {
  const d = new Date(props.record.triggeredAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
});

const locationSummary = computed(() => {
  const loc = props.record.location;
  if (!loc) return t("components.alarmRecordItem.locationUnknown");
  if (loc.address) return loc.address;
  return `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`;
});

function capitalize(s: string): string {
  const map: Record<string, string> = {
    full: "Full",
    silent: "Silent",
    deterrent: "Deterrent",
  };
  return map[s] ?? s;
}
</script>

<style scoped>
.alarm-record-item {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx 28rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.record-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.record-time {
  font-size: 28rpx;
  font-weight: 600;
  color: #1a1a2e;
}

.mode-badge {
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
}

.mode-full {
  background-color: rgba(37, 99, 235, 0.1);
}

.mode-silent {
  background-color: rgba(107, 114, 128, 0.1);
}

.mode-deterrent {
  background-color: rgba(245, 158, 11, 0.1);
}

.mode-label {
  font-size: 22rpx;
  font-weight: 500;
}

.mode-full .mode-label {
  color: #2563eb;
}

.mode-silent .mode-label {
  color: #6b7280;
}

.mode-deterrent .mode-label {
  color: #f59e0b;
}

.record-location {
  font-size: 26rpx;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
