<template>
  <view class="countdown-timer">
    <view v-if="remainingMs > 0" class="timer-display">
      <text v-if="hours > 0" class="time-segment">
        <text class="time-value">{{ padded(hours) }}</text>
        <text class="time-unit">{{
          t("components.countdownTimer.hours")
        }}</text>
      </text>
      <text class="time-segment">
        <text class="time-value">{{ padded(minutes) }}</text>
        <text class="time-unit">{{
          t("components.countdownTimer.minutes")
        }}</text>
      </text>
      <text class="time-segment">
        <text class="time-value">{{ padded(seconds) }}</text>
        <text class="time-unit">{{
          t("components.countdownTimer.seconds")
        }}</text>
      </text>
    </view>
    <view v-else class="timer-expired">
      <text class="expired-text">{{
        t("components.countdownTimer.expired")
      }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  remainingMs: number;
}>();

defineEmits<{
  expired: [];
}>();

const { t } = useI18n();

const totalSeconds = computed(() =>
  Math.max(0, Math.ceil(props.remainingMs / 1000))
);
const hours = computed(() => Math.floor(totalSeconds.value / 3600));
const minutes = computed(() => Math.floor((totalSeconds.value % 3600) / 60));
const seconds = computed(() => totalSeconds.value % 60);

function padded(n: number): string {
  return String(n).padStart(2, "0");
}
</script>

<style scoped>
.countdown-timer {
  display: flex;
  align-items: center;
  justify-content: center;
}

.timer-display {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
}

.time-segment {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.time-value {
  font-size: 48rpx;
  font-weight: 700;
  color: #2563eb;
  font-variant-numeric: tabular-nums;
}

.time-unit {
  font-size: 24rpx;
  color: #888;
  font-weight: 500;
}

.timer-expired {
  padding: 8rpx 0;
}

.expired-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #ef4444;
}
</style>
