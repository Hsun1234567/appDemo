<template>
  <view class="settings-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">{{ t("settings.title") }}</text>
    </view>

    <!-- ═══ 1. 紧急联系人 ═══ -->
    <view class="card">
      <view class="card-header">
        <text class="card-title">{{ t("settings.emergencyContacts") }}</text>
        <text class="card-subtitle">{{ safetyStore.contacts.length }}/5</text>
      </view>

      <!-- 联系人列表 -->
      <view v-if="safetyStore.contacts.length > 0" class="contact-list">
        <view
          v-for="contact in safetyStore.contacts"
          :key="contact.id"
          class="contact-item"
        >
          <view class="contact-info">
            <text class="contact-name">{{ contact.name }}</text>
            <text class="contact-phone">{{ contact.phone }}</text>
          </view>
          <view class="contact-actions">
            <button class="icon-btn" @tap="onEditContact(contact)">
              <text class="icon-btn-text">{{ t("common.edit") }}</text>
            </button>
            <button
              class="icon-btn icon-btn-danger"
              @tap="onDeleteContact(contact)"
            >
              <text class="icon-btn-text-danger">{{ t("common.delete") }}</text>
            </button>
          </view>
        </view>
      </view>
      <view v-else class="empty-state">
        <text class="empty-text">{{ t("settings.noContacts") }}</text>
      </view>

      <!-- 添加联系人按钮 -->
      <button
        v-if="safetyStore.canAddContact"
        class="add-btn"
        @tap="onAddContact"
      >
        <text class="add-btn-text">+ {{ t("settings.addContact") }}</text>
      </button>
      <view v-else class="max-hint">
        <text class="max-hint-text">{{ t("settings.maxContacts") }}</text>
      </view>
    </view>

    <!-- ═══ 联系人编辑弹窗 ═══ -->
    <view
      v-if="showContactDialog"
      class="dialog-mask"
      @tap.self="closeContactDialog"
    >
      <view class="dialog">
        <text class="dialog-title">{{
          editingContact ? t("settings.editContact") : t("settings.addContact")
        }}</text>
        <view class="form-group">
          <text class="form-label">{{ t("settings.contactName") }}</text>
          <input
            v-model="contactForm.name"
            class="form-input"
            :placeholder="t('settings.contactNamePlaceholder')"
          />
        </view>
        <view class="form-group">
          <text class="form-label">{{ t("settings.contactPhone") }}</text>
          <input
            v-model="contactForm.phone"
            class="form-input"
            type="number"
            :placeholder="t('settings.contactPhonePlaceholder')"
            maxlength="11"
          />
          <text v-if="phoneError" class="form-error">{{
            t("settings.invalidPhoneTip")
          }}</text>
        </view>
        <view class="dialog-actions">
          <button
            class="dialog-btn dialog-btn-cancel"
            @tap="closeContactDialog"
          >
            <text class="dialog-btn-text">{{ t("common.cancel") }}</text>
          </button>
          <button class="dialog-btn dialog-btn-confirm" @tap="onSaveContact">
            <text class="dialog-btn-text-confirm">{{ t("common.save") }}</text>
          </button>
        </view>
      </view>
    </view>

    <!-- ═══ 2. 报警短信模板 ═══ -->
    <view class="card">
      <text class="card-title">{{ t("settings.alarmTemplate") }}</text>
      <textarea
        v-model="templateContent"
        class="template-textarea"
        :placeholder="t('settings.templatePlaceholder')"
        :maxlength="200"
        @blur="onTemplateSave"
      />
      <view class="template-footer">
        <view
          class="template-length"
          :class="{ 'length-warning': templateContent.length > 200 }"
        >
          <text class="template-length-text"
            >{{ templateContent.length }}/200
            {{ t("settings.templateLength") }}</text
          >
        </view>
        <view v-if="safetyStore.templateMissingGPS" class="gps-tip">
          <text class="gps-tip-text"
            >💡 {{ t("settings.templateGPSTip") }}</text
          >
        </view>
      </view>
      <!-- 变量插入按钮 -->
      <view class="variable-row">
        <text class="variable-label">{{ t("settings.insertVariable") }}:</text>
        <button class="var-btn" @tap="insertVariable('{GPS位置}')">
          <text class="var-btn-text">{{ t("settings.variableGPS") }}</text>
        </button>
        <button class="var-btn" @tap="insertVariable('{时间}')">
          <text class="var-btn-text">{{ t("settings.variableTime") }}</text>
        </button>
        <button class="var-btn" @tap="insertVariable('{用户名}')">
          <text class="var-btn-text">{{ t("settings.variableUserName") }}</text>
        </button>
      </view>
      <!-- 恢复默认 -->
      <button class="reset-btn" @tap="onResetTemplate">
        <text class="reset-btn-text">{{ t("settings.resetTemplate") }}</text>
      </button>
    </view>

    <!-- ═══ 3. 报警模式 ═══ -->
    <view class="card">
      <text class="card-title">{{ t("settings.alarmMode") }}</text>
      <view class="mode-list">
        <view
          v-for="mode in alarmModes"
          :key="mode.value"
          class="mode-item"
          :class="{ 'mode-active': safetyStore.alarmMode === mode.value }"
          @tap="onSelectMode(mode.value)"
        >
          <view class="mode-radio">
            <view class="radio-outer">
              <view
                v-if="safetyStore.alarmMode === mode.value"
                class="radio-inner"
              />
            </view>
          </view>
          <view class="mode-content">
            <text class="mode-name">{{ mode.label }}</text>
            <text class="mode-desc">{{ mode.desc }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ═══ 4. 安全计时器 ═══ -->
    <view class="card">
      <text class="card-title">{{ t("settings.safetyTimer") }}</text>

      <!-- 运行中状态 -->
      <view v-if="utilityStore.timerState.isRunning" class="timer-running">
        <text class="timer-remaining-text">{{
          utilityStore.formattedRemaining
        }}</text>
        <button class="cancel-timer-btn" @tap="onCancelTimer">
          <text class="cancel-timer-btn-text">{{
            t("settings.timerCancel")
          }}</text>
        </button>
      </view>

      <!-- 未运行 - 预设时长 -->
      <view v-else>
        <text class="section-label">{{ t("settings.timerPresets") }}</text>
        <view class="preset-row">
          <button
            v-for="preset in timerPresets"
            :key="preset.ms"
            class="preset-btn"
            :class="{ 'preset-active': selectedPreset === preset.ms }"
            @tap="selectedPreset = preset.ms"
          >
            <text
              class="preset-btn-text"
              :class="{ 'preset-text-active': selectedPreset === preset.ms }"
              >{{ preset.label }}</text
            >
          </button>
        </view>

        <!-- 自定义时长 -->
        <text class="section-label">{{ t("settings.timerCustom") }}</text>
        <view class="custom-timer-row">
          <input
            v-model="customMinutes"
            class="custom-input"
            type="number"
            placeholder="30"
          />
          <text class="custom-unit">{{ t("settings.customMinutes") }}</text>
        </view>

        <!-- 启动按钮 -->
        <button class="start-timer-btn" @tap="onStartTimer">
          <text class="start-timer-btn-text">{{
            t("settings.timerStart")
          }}</text>
        </button>
      </view>
    </view>

    <!-- ═══ 5. 模拟来电 ═══ -->
    <view class="card">
      <text class="card-title">{{ t("settings.fakeCall") }}</text>

      <!-- 延迟时间 -->
      <text class="section-label">{{ t("settings.fakeCallDelay") }}</text>
      <view class="delay-row">
        <button
          v-for="delay in fakeCallDelays"
          :key="delay.seconds"
          class="delay-btn"
          :class="{
            'delay-active':
              utilityStore.fakeCallConfig.delaySeconds === delay.seconds,
          }"
          @tap="onSelectDelay(delay.seconds)"
        >
          <text
            class="delay-btn-text"
            :class="{
              'delay-text-active':
                utilityStore.fakeCallConfig.delaySeconds === delay.seconds,
            }"
            >{{ delay.label }}</text
          >
        </button>
      </view>

      <!-- 来电人名称 -->
      <text class="section-label">{{ t("settings.fakeCallCallerName") }}</text>
      <input
        :value="utilityStore.fakeCallConfig.callerName"
        class="form-input"
        :placeholder="t('settings.fakeCallCallerNamePlaceholder')"
        @blur="onCallerNameChange"
      />

      <!-- 触发按钮 -->
      <button class="trigger-call-btn" @tap="onTriggerFakeCall">
        <text class="trigger-call-btn-text">{{
          t("settings.fakeCallTrigger")
        }}</text>
      </button>
    </view>

    <!-- 底部安全间距 -->
    <view class="bottom-spacer" />
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useSafetyStore } from "@/stores/safety.store";
import {
  useUtilityStore,
  PRESET_DURATIONS,
  FAKE_CALL_DELAYS,
} from "@/stores/utility.store";
import type { EmergencyContact, AlarmMode } from "@/models/types";

const { t } = useI18n();
const safetyStore = useSafetyStore();
const utilityStore = useUtilityStore();

// ── Alarm modes config ──
const alarmModes = [
  {
    value: "full" as AlarmMode,
    label: t("settings.modeFull"),
    desc: t("settings.modeFullDesc"),
  },
  {
    value: "silent" as AlarmMode,
    label: t("settings.modeSilent"),
    desc: t("settings.modeSilentDesc"),
  },
  {
    value: "deterrent" as AlarmMode,
    label: t("settings.modeDeterrent"),
    desc: t("settings.modeDeterrentDesc"),
  },
];

// ── Timer presets ──
const timerPresets = [
  { ms: PRESET_DURATIONS[0].ms, label: t("settings.timer15min") },
  { ms: PRESET_DURATIONS[1].ms, label: t("settings.timer30min") },
  { ms: PRESET_DURATIONS[2].ms, label: t("settings.timer1h") },
  { ms: PRESET_DURATIONS[3].ms, label: t("settings.timer2h") },
];

// ── Fake call delays ──
const fakeCallDelays = [
  {
    seconds: FAKE_CALL_DELAYS[0].seconds,
    label: t("settings.fakeCallImmediate"),
  },
  { seconds: FAKE_CALL_DELAYS[1].seconds, label: t("settings.fakeCall30s") },
  { seconds: FAKE_CALL_DELAYS[2].seconds, label: t("settings.fakeCall1min") },
  { seconds: FAKE_CALL_DELAYS[3].seconds, label: t("settings.fakeCall5min") },
];

// ═══════════════════════════════════════════
// ── Contact management ──
// ═══════════════════════════════════════════

const showContactDialog = ref(false);
const editingContact = ref<EmergencyContact | null>(null);
const contactForm = ref({ name: "", phone: "" });
const phoneError = ref(false);

function onAddContact() {
  editingContact.value = null;
  contactForm.value = { name: "", phone: "" };
  phoneError.value = false;
  showContactDialog.value = true;
}

function onEditContact(contact: EmergencyContact) {
  editingContact.value = contact;
  contactForm.value = { name: contact.name, phone: contact.phone };
  phoneError.value = false;
  showContactDialog.value = true;
}

function closeContactDialog() {
  showContactDialog.value = false;
  editingContact.value = null;
  phoneError.value = false;
}

async function onSaveContact() {
  const { name, phone } = contactForm.value;
  if (!name.trim() || !phone.trim()) return;

  if (editingContact.value) {
    const result = await safetyStore.updateContact(editingContact.value.id, {
      name: name.trim(),
      phone: phone.trim(),
    });
    if (!result.success) {
      if (result.message.includes("手机号")) {
        phoneError.value = true;
      }
      uni.showToast({ title: result.message, icon: "none" });
      return;
    }
  } else {
    const result = await safetyStore.addContact(name.trim(), phone.trim());
    if (!result.success) {
      if (result.message.includes("手机号")) {
        phoneError.value = true;
      }
      uni.showToast({ title: result.message, icon: "none" });
      return;
    }
  }

  uni.showToast({ title: t("settings.contactSaved"), icon: "success" });
  closeContactDialog();
}

function onDeleteContact(contact: EmergencyContact) {
  uni.showModal({
    title: t("dialogs.deleteTitle"),
    content: t("settings.deleteContactConfirm"),
    success: async (res) => {
      if (res.confirm) {
        await safetyStore.removeContact(contact.id);
      }
    },
  });
}

// ═══════════════════════════════════════════
// ── Alarm template ──
// ═══════════════════════════════════════════

const templateContent = ref(safetyStore.alarmTemplate.content);

// Sync from store when it changes externally
watch(
  () => safetyStore.alarmTemplate.content,
  (val) => {
    templateContent.value = val;
  }
);

async function onTemplateSave() {
  const result = await safetyStore.updateTemplate(templateContent.value);
  if (!result.success) {
    uni.showToast({ title: result.message, icon: "none" });
    return;
  }
  if (result.missingGPS) {
    // Toast already shown via store message
  }
}

function insertVariable(variable: string) {
  templateContent.value += variable;
}

function onResetTemplate() {
  uni.showModal({
    title: t("common.tip"),
    content: t("settings.resetTemplateConfirm"),
    success: async (res) => {
      if (res.confirm) {
        await safetyStore.resetTemplate();
        templateContent.value = safetyStore.alarmTemplate.content;
      }
    },
  });
}

// ═══════════════════════════════════════════
// ── Alarm mode ──
// ═══════════════════════════════════════════

async function onSelectMode(mode: AlarmMode) {
  await safetyStore.setAlarmMode(mode);
  uni.showToast({ title: t("settings.modeSaved"), icon: "success" });
}

// ═══════════════════════════════════════════
// ── Safety timer ──
// ═══════════════════════════════════════════

const selectedPreset = ref(PRESET_DURATIONS[0].ms);
const customMinutes = ref("");

function onStartTimer() {
  let durationMs: number;

  if (customMinutes.value && Number(customMinutes.value) > 0) {
    durationMs = Number(customMinutes.value) * 60 * 1000;
  } else {
    durationMs = selectedPreset.value;
  }

  utilityStore.startTimer(durationMs);
  customMinutes.value = "";
  uni.showToast({ title: t("settings.timerStarted"), icon: "success" });
}

function onCancelTimer() {
  uni.showModal({
    title: t("dialogs.cancelTimerTitle"),
    content: t("settings.timerCancelConfirm"),
    success: (res) => {
      if (res.confirm) {
        utilityStore.cancelTimer();
        uni.showToast({ title: t("settings.timerCancelled"), icon: "success" });
      }
    },
  });
}

// ═══════════════════════════════════════════
// ── Fake call ──
// ═══════════════════════════════════════════

async function onSelectDelay(seconds: number) {
  await utilityStore.updateFakeCallConfig({ delaySeconds: seconds });
}

async function onCallerNameChange(e: any) {
  const name = e.detail?.value ?? "";
  if (name.trim()) {
    await utilityStore.updateFakeCallConfig({ callerName: name.trim() });
  }
}

function onTriggerFakeCall() {
  utilityStore.triggerFakeCall();
  uni.showToast({ title: t("settings.fakeCallScheduled"), icon: "success" });
}
</script>

<style scoped>
.settings-page {
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

.card-subtitle {
  font-size: 24rpx;
  color: #999;
}

/* ── Contact list ── */
.contact-list {
  margin-bottom: 16rpx;
}

.contact-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.contact-item:last-child {
  border-bottom: none;
}

.contact-info {
  flex: 1;
}

.contact-name {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.contact-phone {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
}

.contact-actions {
  display: flex;
  gap: 12rpx;
}

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

.add-btn {
  width: 100%;
  height: 72rpx;
  border-radius: 12rpx;
  background-color: #f0f4ff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx dashed #2563eb;
  margin-top: 8rpx;
}

.add-btn::after {
  border: none;
}

.add-btn-text {
  font-size: 28rpx;
  color: #2563eb;
  font-weight: 500;
}

.max-hint {
  padding: 12rpx 0;
  text-align: center;
}

.max-hint-text {
  font-size: 24rpx;
  color: #999;
}

.empty-state {
  padding: 32rpx 0;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

/* ── Dialog ── */
.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.dialog {
  width: 600rpx;
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx;
}

.dialog-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 32rpx;
  text-align: center;
}

.form-group {
  margin-bottom: 24rpx;
}

.form-label {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.form-input {
  width: 100%;
  height: 80rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
}

.form-error {
  font-size: 22rpx;
  color: #ef4444;
  margin-top: 6rpx;
}

.dialog-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 32rpx;
}

.dialog-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.dialog-btn::after {
  border: none;
}

.dialog-btn-cancel {
  background-color: #f5f5f5;
}

.dialog-btn-confirm {
  background-color: #2563eb;
}

.dialog-btn-text {
  font-size: 28rpx;
  color: #666;
}

.dialog-btn-text-confirm {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: 500;
}

/* ── Template ── */
.template-textarea {
  width: 100%;
  height: 200rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
  line-height: 1.6;
}

.template-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12rpx;
  flex-wrap: wrap;
  gap: 8rpx;
}

.template-length-text {
  font-size: 22rpx;
  color: #999;
}

.length-warning .template-length-text {
  color: #ef4444;
}

.gps-tip {
  flex: 1;
  text-align: right;
}

.gps-tip-text {
  font-size: 22rpx;
  color: #f59e0b;
}

.variable-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 16rpx;
  flex-wrap: wrap;
}

.variable-label {
  font-size: 24rpx;
  color: #666;
}

.var-btn {
  height: 52rpx;
  padding: 0 20rpx;
  border-radius: 8rpx;
  background-color: #f0f4ff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid #d0dcf0;
}

.var-btn::after {
  border: none;
}

.var-btn-text {
  font-size: 22rpx;
  color: #2563eb;
}

.reset-btn {
  margin-top: 16rpx;
  height: 60rpx;
  border-radius: 10rpx;
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.reset-btn::after {
  border: none;
}

.reset-btn-text {
  font-size: 24rpx;
  color: #999;
  text-decoration: underline;
}

/* ── Alarm mode ── */
.mode-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.mode-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 20rpx;
  border-radius: 12rpx;
  border: 2rpx solid #e0e0e0;
  transition: all 0.2s;
}

.mode-active {
  border-color: #2563eb;
  background-color: #f0f4ff;
}

.mode-radio {
  padding-top: 4rpx;
}

.radio-outer {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 2rpx solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mode-active .radio-outer {
  border-color: #2563eb;
}

.radio-inner {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background-color: #2563eb;
}

.mode-content {
  flex: 1;
}

.mode-name {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.mode-desc {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
  line-height: 1.4;
}

/* ── Safety timer ── */
.section-label {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 12rpx;
}

.timer-running {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.timer-remaining-text {
  font-size: 48rpx;
  font-weight: 700;
  color: #2563eb;
  font-variant-numeric: tabular-nums;
}

.cancel-timer-btn {
  height: 72rpx;
  padding: 0 32rpx;
  border-radius: 12rpx;
  background-color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.cancel-timer-btn::after {
  border: none;
}

.cancel-timer-btn-text {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: 500;
}

.preset-row {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
  margin-bottom: 20rpx;
}

.preset-btn {
  flex: 1;
  min-width: 140rpx;
  height: 64rpx;
  border-radius: 10rpx;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #e0e0e0;
}

.preset-btn::after {
  border: none;
}

.preset-active {
  background-color: #2563eb;
  border-color: #2563eb;
}

.preset-btn-text {
  font-size: 26rpx;
  color: #333;
}

.preset-text-active {
  color: #ffffff;
  font-weight: 500;
}

.custom-timer-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.custom-input {
  flex: 1;
  height: 72rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #333;
}

.custom-unit {
  font-size: 26rpx;
  color: #666;
}

.start-timer-btn {
  width: 100%;
  height: 80rpx;
  border-radius: 12rpx;
  background-color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.start-timer-btn::after {
  border: none;
}

.start-timer-btn-text {
  font-size: 30rpx;
  color: #ffffff;
  font-weight: 600;
}

/* ── Fake call ── */
.delay-row {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
  margin-bottom: 20rpx;
}

.delay-btn {
  flex: 1;
  min-width: 120rpx;
  height: 64rpx;
  border-radius: 10rpx;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #e0e0e0;
}

.delay-btn::after {
  border: none;
}

.delay-active {
  background-color: #2563eb;
  border-color: #2563eb;
}

.delay-btn-text {
  font-size: 26rpx;
  color: #333;
}

.delay-text-active {
  color: #ffffff;
  font-weight: 500;
}

.trigger-call-btn {
  width: 100%;
  height: 80rpx;
  border-radius: 12rpx;
  background-color: #22c55e;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  margin-top: 20rpx;
}

.trigger-call-btn::after {
  border: none;
}

.trigger-call-btn-text {
  font-size: 30rpx;
  color: #ffffff;
  font-weight: 600;
}

.bottom-spacer {
  height: 120rpx;
}
</style>
