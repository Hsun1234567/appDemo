<template>
  <view class="alarm-detail-page">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @tap="onBack">
        <text class="nav-back-icon">‹</text>
        <text class="nav-back-text">{{ t("common.back") }}</text>
      </view>
      <text class="nav-title">{{ t("alarmDetail.title") }}</text>
      <view class="nav-placeholder" />
    </view>

    <template v-if="record">
      <!-- 触发时间 -->
      <view class="card">
        <text class="card-label">{{ t("alarmDetail.triggerTime") }}</text>
        <text class="card-value">{{ formatTime(record.triggeredAt) }}</text>
      </view>

      <!-- 位置信息 -->
      <view class="card">
        <text class="card-label">{{ t("alarmDetail.location") }}</text>
        <template v-if="record.location">
          <view class="location-info">
            <view class="info-row">
              <text class="info-label">{{ t("alarmDetail.latitude") }}</text>
              <text class="info-value">{{
                record.location.latitude.toFixed(6)
              }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">{{ t("alarmDetail.longitude") }}</text>
              <text class="info-value">{{
                record.location.longitude.toFixed(6)
              }}</text>
            </view>
            <view v-if="record.location.address" class="info-row">
              <text class="info-label">{{ t("alarmDetail.address") }}</text>
              <text class="info-value">{{ record.location.address }}</text>
            </view>
          </view>
        </template>
        <text v-else class="card-value card-value-muted">{{
          t("alarmDetail.locationUnavailable")
        }}</text>
      </view>

      <!-- 报警模式 -->
      <view class="card">
        <text class="card-label">{{ t("alarmDetail.alarmMode") }}</text>
        <view class="mode-badge">
          <text class="mode-badge-text">{{
            t(`alarmMode.${record.alarmMode}`)
          }}</text>
        </view>
      </view>

      <!-- 通知的联系人 -->
      <view class="card">
        <text class="card-label">{{ t("alarmDetail.contactsNotified") }}</text>
        <view v-if="record.contactsNotified.length > 0" class="contacts-list">
          <view
            v-for="contact in record.contactsNotified"
            :key="contact.id"
            class="contact-row"
          >
            <text class="contact-name">{{ contact.name }}</text>
            <text class="contact-phone">{{ contact.phone }}</text>
          </view>
        </view>
        <text v-else class="card-value card-value-muted">{{
          t("alarmDetail.noContactsNotified")
        }}</text>
      </view>

      <!-- 执行步骤结果 -->
      <view class="card">
        <text class="card-label">{{ t("alarmDetail.stepResults") }}</text>
        <view class="steps-list">
          <view
            v-for="(step, index) in record.stepResults"
            :key="index"
            class="step-row"
          >
            <view class="step-left">
              <view
                class="step-icon"
                :class="step.success ? 'step-icon-success' : 'step-icon-fail'"
              >
                <text class="step-icon-text">{{
                  step.success ? "✓" : "✗"
                }}</text>
              </view>
              <text class="step-name">{{ getStepLabel(step.step) }}</text>
            </view>
            <text
              class="step-status"
              :class="step.success ? 'step-status-success' : 'step-status-fail'"
            >
              {{
                step.success
                  ? t("alarmDetail.stepSuccess")
                  : t("alarmDetail.stepFailed")
              }}
            </text>
          </view>
          <!-- 失败步骤的错误原因 -->
          <view
            v-for="(step, index) in failedSteps"
            :key="'err-' + index"
            class="step-error"
          >
            <text class="step-error-label"
              >{{ getStepLabel(step.step) }} -
              {{ t("alarmDetail.failureReason") }}:</text
            >
            <text class="step-error-text">{{ step.error }}</text>
          </view>
        </view>
      </view>

      <!-- 触发设备 -->
      <view class="card">
        <text class="card-label">{{ t("alarmDetail.deviceId") }}</text>
        <text class="card-value">{{
          record.deviceId || t("common.unknown")
        }}</text>
      </view>
    </template>

    <!-- 记录未找到 -->
    <view v-else class="empty-state">
      <text class="empty-text">{{ t("common.noData") }}</text>
    </view>

    <view class="bottom-spacer" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useI18n } from "vue-i18n";
import { useDataStore } from "@/stores/data.store";
import type { AlarmRecord, AlarmStepResult } from "@/models/types";

const { t } = useI18n();
const dataStore = useDataStore();

const id = ref("");
const record = ref<AlarmRecord | null>(null);

/** Failed steps with error messages */
const failedSteps = computed(() => {
  if (!record.value) return [];
  return record.value.stepResults.filter((s) => !s.success && s.error);
});

onLoad((options) => {
  if (options?.id) {
    id.value = options.id as string;
    loadRecord();
  }
});

async function loadRecord() {
  const found = await dataStore.getAlarmRecordDetail(id.value);
  record.value = found ?? null;
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Map step key to i18n label */
function getStepLabel(step: AlarmStepResult["step"]): string {
  const map: Record<AlarmStepResult["step"], string> = {
    gps: t("alarmDetail.stepGPS"),
    readContacts: t("alarmDetail.stepReadContacts"),
    sendSMS: t("alarmDetail.stepSendSMS"),
    makeCall: t("alarmDetail.stepMakeCall"),
    saveRecord: t("alarmDetail.stepSaveRecord"),
    notification: t("alarmDetail.stepNotification"),
  };
  return map[step] || step;
}

function onBack() {
  uni.navigateBack();
}
</script>

<style scoped>
.alarm-detail-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-bottom: env(safe-area-inset-bottom);
}

/* ── Nav bar ── */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background-color: #ffffff;
  border-bottom: 1rpx solid #eee;
}

.nav-back {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.nav-back-icon {
  font-size: 40rpx;
  color: #2563eb;
  font-weight: 300;
}

.nav-back-text {
  font-size: 28rpx;
  color: #2563eb;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a2e;
}

.nav-placeholder {
  width: 100rpx;
}

/* ── Card ── */
.card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin: 20rpx 24rpx 0;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.card-label {
  font-size: 24rpx;
  font-weight: 600;
  color: #999;
  margin-bottom: 12rpx;
  text-transform: uppercase;
  letter-spacing: 1rpx;
}

.card-value {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.card-value-muted {
  color: #bbb;
}

/* ── Location info ── */
.location-info {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.info-label {
  font-size: 26rpx;
  color: #666;
}

.info-value {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
  max-width: 60%;
  text-align: right;
}

/* ── Mode badge ── */
.mode-badge {
  display: inline-flex;
  padding: 8rpx 24rpx;
  background-color: #f0f4ff;
  border-radius: 8rpx;
}

.mode-badge-text {
  font-size: 28rpx;
  color: #2563eb;
  font-weight: 500;
}

/* ── Contacts list ── */
.contacts-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.contact-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 16rpx;
  background-color: #f9fafb;
  border-radius: 10rpx;
}

.contact-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.contact-phone {
  font-size: 26rpx;
  color: #666;
}

/* ── Steps list ── */
.steps-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.step-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.step-row:last-child {
  border-bottom: none;
}

.step-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.step-icon {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-icon-success {
  background-color: #dcfce7;
}

.step-icon-fail {
  background-color: #fee2e2;
}

.step-icon-text {
  font-size: 22rpx;
  font-weight: 700;
}

.step-icon-success .step-icon-text {
  color: #16a34a;
}

.step-icon-fail .step-icon-text {
  color: #dc2626;
}

.step-name {
  font-size: 28rpx;
  color: #333;
}

.step-status {
  font-size: 24rpx;
  font-weight: 500;
}

.step-status-success {
  color: #16a34a;
}

.step-status-fail {
  color: #dc2626;
}

/* ── Step error ── */
.step-error {
  padding: 12rpx 16rpx;
  background-color: #fef2f2;
  border-radius: 8rpx;
  margin-top: 4rpx;
}

.step-error-label {
  font-size: 24rpx;
  color: #dc2626;
  font-weight: 500;
}

.step-error-text {
  font-size: 24rpx;
  color: #991b1b;
  margin-top: 4rpx;
}

/* ── Empty state ── */
.empty-state {
  padding: 120rpx 0;
  text-align: center;
}

.empty-text {
  font-size: 30rpx;
  color: #999;
}

.bottom-spacer {
  height: 60rpx;
}
</style>
