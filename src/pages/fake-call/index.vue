<template>
  <view class="fake-call-page">
    <!-- Ringing state -->
    <template v-if="callState === 'ringing'">
      <view class="call-top">
        <text class="caller-label">{{ t("fakeCall.incomingCall") }}</text>
        <view class="avatar">
          <text class="avatar-text">{{ avatarLetter }}</text>
        </view>
        <text class="caller-name">{{ callerName }}</text>
      </view>

      <view class="call-actions">
        <view class="action-item" @tap="onDecline">
          <view class="action-circle action-decline">
            <text class="action-icon">✕</text>
          </view>
          <text class="action-label">{{ t("fakeCall.decline") }}</text>
        </view>
        <view class="action-item" @tap="onAnswer">
          <view class="action-circle action-answer">
            <text class="action-icon">✓</text>
          </view>
          <text class="action-label">{{ t("fakeCall.answer") }}</text>
        </view>
      </view>
    </template>

    <!-- Answered state (on call) -->
    <template v-if="callState === 'answered'">
      <view class="call-top">
        <text class="caller-label calling-label">{{
          t("fakeCall.calling")
        }}</text>
        <view class="avatar avatar-active">
          <text class="avatar-text">{{ avatarLetter }}</text>
        </view>
        <text class="caller-name">{{ callerName }}</text>
        <text class="call-duration">{{ formattedDuration }}</text>
      </view>

      <view class="call-actions">
        <view class="action-item" @tap="onHangUp">
          <view class="action-circle action-decline">
            <text class="action-icon">✕</text>
          </view>
          <text class="action-label">{{ t("fakeCall.decline") }}</text>
        </view>
      </view>
    </template>

    <!-- Ended state -->
    <template v-if="callState === 'ended'">
      <view class="call-top">
        <text class="caller-label ended-label">{{
          t("fakeCall.callEnded")
        }}</text>
        <view class="avatar avatar-ended">
          <text class="avatar-text">{{ avatarLetter }}</text>
        </view>
        <text class="caller-name caller-name-ended">{{ callerName }}</text>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useI18n } from "vue-i18n";
import { useUtilityStore } from "@/stores/utility.store";
import { AudioService } from "@/services/audio.service";

const { t } = useI18n();
const utilityStore = useUtilityStore();
const audioService = new AudioService();

type CallState = "ringing" | "answered" | "ended";
const callState = ref<CallState>("ringing");

/** Call duration in seconds */
const callDuration = ref(0);
let durationInterval: ReturnType<typeof setInterval> | null = null;

/** Caller name from utility store config */
const callerName = computed(
  () => utilityStore.fakeCallConfig.callerName || t("common.unknown")
);

/** First letter of caller name for avatar */
const avatarLetter = computed(() => {
  const name = callerName.value;
  return name ? name.charAt(0).toUpperCase() : "?";
});

/** Formatted call duration mm:ss */
const formattedDuration = computed(() => {
  const m = Math.floor(callDuration.value / 60);
  const s = callDuration.value % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
});

onLoad(() => {
  // Start playing ringtone when page loads
  audioService.playRingtone();
});

onUnmounted(() => {
  cleanup();
});

function onAnswer() {
  callState.value = "answered";
  audioService.stopRingtone();
  audioService.playCallAudio();
  callDuration.value = 0;
  durationInterval = setInterval(() => {
    callDuration.value++;
  }, 1000);
}

function onDecline() {
  endCall();
}

function onHangUp() {
  endCall();
}

function endCall() {
  callState.value = "ended";
  cleanup();
  utilityStore.endFakeCall();
  // Auto-close after a short delay
  setTimeout(() => {
    uni.navigateBack();
  }, 1500);
}

function cleanup() {
  audioService.destroy();
  if (durationInterval !== null) {
    clearInterval(durationInterval);
    durationInterval = null;
  }
}
</script>

<style scoped>
.fake-call-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 120rpx 48rpx 100rpx;
  padding-bottom: calc(100rpx + env(safe-area-inset-bottom));
}

/* ── Top section ── */
.call-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.caller-label {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 2rpx;
}

.calling-label {
  color: #4ade80;
}

.ended-label {
  color: rgba(255, 255, 255, 0.4);
}

/* ── Avatar ── */
.avatar {
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20rpx 0;
  box-shadow: 0 8rpx 40rpx rgba(37, 99, 235, 0.3);
}

.avatar-active {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  box-shadow: 0 8rpx 40rpx rgba(34, 197, 94, 0.3);
}

.avatar-ended {
  background: linear-gradient(135deg, #6b7280, #4b5563);
  box-shadow: none;
}

.avatar-text {
  font-size: 72rpx;
  font-weight: 700;
  color: #ffffff;
}

.caller-name {
  font-size: 48rpx;
  font-weight: 600;
  color: #ffffff;
  text-align: center;
}

.caller-name-ended {
  color: rgba(255, 255, 255, 0.5);
}

.call-duration {
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.7);
  font-variant-numeric: tabular-nums;
}

/* ── Action buttons ── */
.call-actions {
  display: flex;
  justify-content: center;
  gap: 120rpx;
  padding-bottom: 40rpx;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.action-circle {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-answer {
  background-color: #22c55e;
  box-shadow: 0 6rpx 24rpx rgba(34, 197, 94, 0.4);
}

.action-decline {
  background-color: #ef4444;
  box-shadow: 0 6rpx 24rpx rgba(239, 68, 68, 0.4);
}

.action-icon {
  font-size: 44rpx;
  font-weight: 700;
  color: #ffffff;
}

.action-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}
</style>
