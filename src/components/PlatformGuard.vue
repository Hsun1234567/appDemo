<script setup lang="ts">
/**
 * 平台功能守卫组件
 * 根据 platform prop 控制插槽内容的渲染
 * - platform="app": 仅在 App 端渲染（H5 端隐藏硬件功能入口）
 * - platform="h5": 仅在 H5 端渲染
 * - platform="all": 所有平台均渲染
 */
import { computed } from "vue";
import { isH5, isApp } from "@/utils/platform";

const props = withDefaults(
  defineProps<{
    /** 目标平台：'app' 仅 App 端显示，'h5' 仅 H5 端显示，'all' 所有平台显示 */
    platform: "app" | "h5" | "all";
  }>(),
  {
    platform: "app",
  }
);

const visible = computed(() => {
  if (props.platform === "all") {
    return true;
  }
  if (props.platform === "app") {
    return isApp();
  }
  return isH5();
});
</script>

<template>
  <!-- #ifdef APP-PLUS -->
  <slot v-if="platform === 'app' || platform === 'all'" />
  <!-- #endif -->
  <!-- #ifdef H5 -->
  <slot v-if="platform === 'h5' || platform === 'all'" />
  <!-- #endif -->
</template>
