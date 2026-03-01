<template>
  <view class="contact-item">
    <view class="contact-info" @tap="$emit('tap', contact)">
      <text class="contact-name">{{ contact.name }}</text>
      <text class="contact-phone">{{ contact.phone }}</text>
    </view>
    <view class="contact-actions">
      <button class="action-btn edit-btn" @tap.stop="$emit('edit', contact)">
        <text class="action-label">{{ t("components.contactItem.edit") }}</text>
      </button>
      <button
        class="action-btn delete-btn"
        @tap.stop="$emit('delete', contact)"
      >
        <text class="action-label delete-label">{{
          t("components.contactItem.delete")
        }}</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { EmergencyContact } from "@/models/types";

defineProps<{
  contact: EmergencyContact;
}>();

defineEmits<{
  tap: [contact: EmergencyContact];
  edit: [contact: EmergencyContact];
  delete: [contact: EmergencyContact];
}>();

const { t } = useI18n();
</script>

<style scoped>
.contact-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx 28rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.contact-info {
  flex: 1;
  min-width: 0;
}

.contact-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a2e;
  display: block;
  margin-bottom: 6rpx;
}

.contact-phone {
  font-size: 26rpx;
  color: #888;
  display: block;
}

.contact-actions {
  display: flex;
  gap: 16rpx;
  flex-shrink: 0;
  margin-left: 20rpx;
}

.action-btn {
  padding: 10rpx 20rpx;
  border-radius: 12rpx;
  border: none;
  font-size: 24rpx;
  line-height: 1;
  background-color: #eef2ff;
}

.action-btn::after {
  border: none;
}

.action-label {
  font-size: 24rpx;
  color: #2563eb;
}

.delete-btn {
  background-color: #fef2f2;
}

.delete-label {
  color: #ef4444;
}
</style>
