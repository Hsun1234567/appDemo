<template>
  <view class="profile-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">{{ t("profile.title") }}</text>
    </view>

    <!-- ═══ 1. 报警历史记录 ═══ -->
    <view class="card">
      <view class="card-header">
        <text class="card-title">{{ t("profile.alarmHistory") }}</text>
        <view v-if="dataStore.alarmRecords.length > 0" class="header-actions">
          <button v-if="!batchMode" class="icon-btn" @tap="enterBatchMode">
            <text class="icon-btn-text">{{ t("common.batchDelete") }}</text>
          </button>
          <template v-else>
            <button class="icon-btn" @tap="toggleSelectAll">
              <text class="icon-btn-text">{{ t("common.selectAll") }}</text>
            </button>
            <button class="icon-btn icon-btn-danger" @tap="onBatchDelete">
              <text class="icon-btn-text-danger"
                >{{ t("common.delete") }}({{ selectedIds.length }})</text
              >
            </button>
            <button class="icon-btn" @tap="exitBatchMode">
              <text class="icon-btn-text">{{ t("common.cancel") }}</text>
            </button>
          </template>
        </view>
      </view>

      <view v-if="dataStore.alarmRecords.length > 0" class="record-list">
        <view
          v-for="record in dataStore.alarmRecords"
          :key="record.id"
          class="record-item"
          @tap="onRecordTap(record)"
        >
          <view
            v-if="batchMode"
            class="checkbox-wrap"
            @tap.stop="toggleSelect(record.id)"
          >
            <view
              class="checkbox"
              :class="{ 'checkbox-checked': selectedIds.includes(record.id) }"
            >
              <text v-if="selectedIds.includes(record.id)" class="check-mark"
                >✓</text
              >
            </view>
          </view>
          <view class="record-content">
            <view class="record-top">
              <text class="record-time">{{
                formatTime(record.triggeredAt)
              }}</text>
              <text class="record-mode">{{
                t(`alarmMode.${record.alarmMode}`)
              }}</text>
            </view>
            <text class="record-location">
              {{
                record.location?.address ||
                (record.location
                  ? `${record.location.latitude.toFixed(
                      4
                    )}, ${record.location.longitude.toFixed(4)}`
                  : t("alarmDetail.locationUnavailable"))
              }}
            </text>
          </view>
          <view v-if="!batchMode" class="record-actions">
            <button
              class="icon-btn icon-btn-danger"
              @tap.stop="onDeleteRecord(record.id)"
            >
              <text class="icon-btn-text-danger">{{ t("common.delete") }}</text>
            </button>
          </view>
        </view>
      </view>
      <view v-else class="empty-state">
        <text class="empty-text">{{ t("profile.noAlarmRecords") }}</text>
      </view>
    </view>

    <!-- ═══ 2. 设备事件日志 ═══ -->
    <view class="card">
      <view class="card-header">
        <text class="card-title">{{ t("profile.eventLogs") }}</text>
        <button
          v-if="dataStore.eventLogs.length > 0"
          class="icon-btn icon-btn-danger"
          @tap="onClearLogs"
        >
          <text class="icon-btn-text-danger">{{ t("profile.clearLogs") }}</text>
        </button>
      </view>

      <view v-if="dataStore.eventLogs.length > 0" class="log-list">
        <view v-for="log in dataStore.eventLogs" :key="log.id" class="log-item">
          <view class="log-left">
            <text class="log-type">{{ t(`eventType.${log.eventType}`) }}</text>
            <text class="log-desc">{{ log.description }}</text>
          </view>
          <text class="log-time">{{ formatTime(log.timestamp) }}</text>
        </view>
      </view>
      <view v-else class="empty-state">
        <text class="empty-text">{{ t("profile.noEventLogs") }}</text>
      </view>
    </view>

    <!-- ═══ 3. 备份与恢复 ═══ -->
    <view class="card">
      <text class="card-title">{{ t("profile.backupRestore") }}</text>
      <view class="backup-row">
        <button class="backup-btn backup-export" @tap="onExportBackup">
          <text class="backup-btn-text"
            >📤 {{ t("profile.exportBackup") }}</text
          >
        </button>
        <button class="backup-btn backup-import" @tap="onImportBackup">
          <text class="backup-btn-text-import"
            >📥 {{ t("profile.importBackup") }}</text
          >
        </button>
      </view>
    </view>

    <!-- ═══ 4. 语言设置 ═══ -->
    <view class="card">
      <text class="card-title">{{ t("profile.language") }}</text>
      <view class="lang-row">
        <button
          class="lang-btn"
          :class="{ 'lang-active': currentLocale === 'zh-CN' }"
          @tap="switchLanguage('zh-CN')"
        >
          <text
            class="lang-btn-text"
            :class="{ 'lang-text-active': currentLocale === 'zh-CN' }"
          >
            {{ t("profile.languageChinese") }}
          </text>
        </button>
        <button
          class="lang-btn"
          :class="{ 'lang-active': currentLocale === 'en-US' }"
          @tap="switchLanguage('en-US')"
        >
          <text
            class="lang-btn-text"
            :class="{ 'lang-text-active': currentLocale === 'en-US' }"
          >
            {{ t("profile.languageEnglish") }}
          </text>
        </button>
      </view>
    </view>

    <!-- ═══ 5. 安全知识库入口 ═══ -->
    <view class="card card-link" @tap="onNavigateKnowledge">
      <view class="link-row">
        <text class="link-text">📚 {{ t("profile.knowledgeBase") }}</text>
        <text class="link-arrow">›</text>
      </view>
    </view>

    <!-- ═══ 6. 关于 ═══ -->
    <view class="card">
      <text class="card-title">{{ t("profile.about") }}</text>
      <view class="about-row">
        <text class="about-label">{{ t("profile.version") }}</text>
        <text class="about-value">1.0.0</text>
      </view>
    </view>

    <!-- 底部安全间距 -->
    <view class="bottom-spacer" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useDataStore } from "@/stores/data.store";
import type { AlarmRecord } from "@/models/types";

const { t, locale } = useI18n();
const dataStore = useDataStore();

// ── Batch delete state ──
const batchMode = ref(false);
const selectedIds = ref<string[]>([]);

const currentLocale = computed(() => locale.value);

// ── Lifecycle ──
onMounted(async () => {
  await dataStore.loadAlarmRecords(1, 50);
  await dataStore.loadEventLogs(1, 50);
});

// ── Time formatting ──
function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

// ═══════════════════════════════════════════
// ── Alarm history ──
// ═══════════════════════════════════════════

function onRecordTap(record: AlarmRecord) {
  if (batchMode.value) {
    toggleSelect(record.id);
    return;
  }
  uni.navigateTo({ url: `/pages/alarm-detail/index?id=${record.id}` });
}

function onDeleteRecord(id: string) {
  uni.showModal({
    title: t("dialogs.deleteTitle"),
    content: t("profile.deleteRecordConfirm"),
    success: async (res) => {
      if (res.confirm) {
        await dataStore.deleteAlarmRecord(id);
        uni.showToast({ title: t("profile.recordDeleted"), icon: "success" });
      }
    },
  });
}

function enterBatchMode() {
  batchMode.value = true;
  selectedIds.value = [];
}

function exitBatchMode() {
  batchMode.value = false;
  selectedIds.value = [];
}

function toggleSelect(id: string) {
  const idx = selectedIds.value.indexOf(id);
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1);
  } else {
    selectedIds.value.push(id);
  }
}

function toggleSelectAll() {
  if (selectedIds.value.length === dataStore.alarmRecords.length) {
    selectedIds.value = [];
  } else {
    selectedIds.value = dataStore.alarmRecords.map((r) => r.id);
  }
}

function onBatchDelete() {
  if (selectedIds.value.length === 0) return;
  const count = selectedIds.value.length;
  uni.showModal({
    title: t("dialogs.deleteTitle"),
    content: t("profile.batchDeleteConfirm", { count }),
    success: async (res) => {
      if (res.confirm) {
        await dataStore.deleteAlarmRecords([...selectedIds.value]);
        uni.showToast({ title: t("profile.recordDeleted"), icon: "success" });
        exitBatchMode();
      }
    },
  });
}

// ═══════════════════════════════════════════
// ── Event logs ──
// ═══════════════════════════════════════════

function onClearLogs() {
  uni.showModal({
    title: t("dialogs.clearTitle"),
    content: t("profile.clearLogsConfirm"),
    success: async (res) => {
      if (res.confirm) {
        await dataStore.clearEventLogs();
        uni.showToast({ title: t("profile.logsCleared"), icon: "success" });
      }
    },
  });
}

// ═══════════════════════════════════════════
// ── Backup & Restore ──
// ═══════════════════════════════════════════

async function onExportBackup() {
  uni.showModal({
    title: t("common.tip"),
    content: t("profile.exportBackup") + "?",
    success: async (res) => {
      if (res.confirm) {
        const result = await dataStore.exportBackup();
        if (result.success) {
          uni.showToast({ title: t("profile.exportSuccess"), icon: "success" });
        } else {
          uni.showToast({ title: t("profile.exportFailed"), icon: "none" });
        }
      }
    },
  });
}

async function onImportBackup() {
  uni.showModal({
    title: t("dialogs.restoreTitle"),
    content: t("profile.restoreConfirm"),
    success: async (res) => {
      if (res.confirm) {
        const result = await dataStore.importBackup();
        if (result.success) {
          uni.showToast({ title: t("profile.importSuccess"), icon: "success" });
        } else {
          uni.showToast({
            title: result.message || t("profile.importFailed"),
            icon: "none",
          });
        }
      }
    },
  });
}

// ═══════════════════════════════════════════
// ── Language switch ──
// ═══════════════════════════════════════════

function switchLanguage(lang: "zh-CN" | "en-US") {
  if (locale.value === lang) return;
  locale.value = lang;
  uni.setStorageSync("app_language", lang);
  uni.showToast({ title: t("profile.languageSwitched"), icon: "success" });
}

// ═══════════════════════════════════════════
// ── Knowledge base ──
// ═══════════════════════════════════════════

function onNavigateKnowledge() {
  uni.navigateTo({ url: "/pages/knowledge/index" });
}
</script>

<style scoped>
.profile-page {
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

/* ── Card ── */
.card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
  flex-wrap: wrap;
  gap: 12rpx;
}

.card-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #666;
  margin-bottom: 16rpx;
}

.card-header .card-title {
  margin-bottom: 0;
}

.header-actions {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
}

/* ── Buttons ── */
.icon-btn {
  height: 52rpx;
  padding: 0 20rpx;
  border-radius: 8rpx;
  background-color: #f0f4ff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.icon-btn::after {
  border: none;
}

.icon-btn-danger {
  background-color: #fff0f0;
}

.icon-btn-text {
  font-size: 22rpx;
  color: #2563eb;
}

.icon-btn-text-danger {
  font-size: 22rpx;
  color: #ef4444;
}

/* ── Alarm record list ── */
.record-list {
  max-height: 600rpx;
  overflow-y: auto;
}

.record-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.record-item:last-child {
  border-bottom: none;
}

.checkbox-wrap {
  margin-right: 16rpx;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border-radius: 8rpx;
  border: 2rpx solid #d0d0d0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox-checked {
  background-color: #2563eb;
  border-color: #2563eb;
}

.check-mark {
  font-size: 24rpx;
  color: #ffffff;
  font-weight: 700;
}

.record-content {
  flex: 1;
  min-width: 0;
}

.record-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6rpx;
}

.record-time {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

.record-mode {
  font-size: 22rpx;
  color: #2563eb;
  background-color: #f0f4ff;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}

.record-location {
  font-size: 24rpx;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-actions {
  margin-left: 12rpx;
}

/* ── Event log list ── */
.log-list {
  max-height: 500rpx;
  overflow-y: auto;
}

.log-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  gap: 16rpx;
}

.log-item:last-child {
  border-bottom: none;
}

.log-left {
  flex: 1;
  min-width: 0;
}

.log-type {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

.log-desc {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-time {
  font-size: 22rpx;
  color: #bbb;
  white-space: nowrap;
}

/* ── Backup ── */
.backup-row {
  display: flex;
  gap: 20rpx;
}

.backup-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.backup-btn::after {
  border: none;
}

.backup-export {
  background-color: #2563eb;
}

.backup-import {
  background-color: #f0f4ff;
  border: 2rpx solid #2563eb;
}

.backup-btn-text {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: 500;
}

.backup-btn-text-import {
  font-size: 28rpx;
  color: #2563eb;
  font-weight: 500;
}

/* ── Language ── */
.lang-row {
  display: flex;
  gap: 20rpx;
}

.lang-btn {
  flex: 1;
  height: 72rpx;
  border-radius: 12rpx;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #e0e0e0;
}

.lang-btn::after {
  border: none;
}

.lang-active {
  background-color: #2563eb;
  border-color: #2563eb;
}

.lang-btn-text {
  font-size: 28rpx;
  color: #333;
}

.lang-text-active {
  color: #ffffff;
  font-weight: 500;
}

/* ── Knowledge link ── */
.card-link {
  padding: 28rpx;
}

.link-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.link-text {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.link-arrow {
  font-size: 36rpx;
  color: #ccc;
  font-weight: 300;
}

/* ── About ── */
.about-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.about-label {
  font-size: 28rpx;
  color: #666;
}

.about-value {
  font-size: 28rpx;
  color: #333;
}

/* ── Empty state ── */
.empty-state {
  padding: 32rpx 0;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.bottom-spacer {
  height: 120rpx;
}
</style>
