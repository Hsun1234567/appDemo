<template>
  <view class="knowledge-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">{{ t("knowledge.title") }}</text>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar">
      <input
        class="search-input"
        type="text"
        :placeholder="t('knowledge.searchPlaceholder')"
        v-model="searchKeyword"
        confirm-type="search"
        @confirm="onSearch"
        @input="onSearch"
      />
      <view v-if="searchKeyword" class="search-clear" @tap="clearSearch">
        <text class="search-clear-icon">✕</text>
      </view>
    </view>

    <!-- 分类标签 -->
    <scroll-view scroll-x class="category-tabs">
      <view class="tabs-inner">
        <view
          v-for="cat in categories"
          :key="cat.key"
          class="tab-item"
          :class="{ 'tab-active': activeCategory === cat.key }"
          @tap="onCategoryTap(cat.key)"
        >
          <text
            class="tab-text"
            :class="{ 'tab-text-active': activeCategory === cat.key }"
            >{{ cat.label }}</text
          >
        </view>
      </view>
    </scroll-view>

    <!-- 文章数量 -->
    <view class="article-count-bar">
      <text class="article-count-text">{{
        t("knowledge.articleCount", { count: filteredArticles.length })
      }}</text>
    </view>

    <!-- 文章列表 -->
    <view v-if="filteredArticles.length > 0" class="article-list">
      <view
        v-for="article in filteredArticles"
        :key="article.id"
        class="article-card"
        @tap="toggleArticle(article.id)"
      >
        <view class="article-header">
          <text class="article-title">{{ article.title }}</text>
          <text class="article-category-tag" :class="`tag-${article.category}`">
            {{ getCategoryLabel(article.category) }}
          </text>
        </view>
        <text
          class="article-content"
          :class="{ 'article-content-expanded': expandedId === article.id }"
          >{{ article.content }}</text
        >
      </view>
    </view>

    <!-- 空状态 -->
    <view v-else class="empty-state">
      <text class="empty-text">{{ t("knowledge.noResults") }}</text>
    </view>

    <view class="bottom-spacer" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useUtilityStore } from "@/stores/utility.store";
import type { KnowledgeArticle } from "@/models/types";

const { t } = useI18n();
const utilityStore = useUtilityStore();

const searchKeyword = ref("");
const activeCategory = ref<string>("all");
const expandedId = ref<string>("");

const categories = computed(() => [
  { key: "all", label: t("knowledge.categoryAll") },
  { key: "travel", label: t("knowledge.categoryTravel") },
  { key: "home", label: t("knowledge.categoryHome") },
  { key: "emergency", label: t("knowledge.categoryEmergency") },
]);

const filteredArticles = computed<KnowledgeArticle[]>(() => {
  let results: KnowledgeArticle[];

  if (searchKeyword.value.trim()) {
    results = utilityStore.searchArticles(searchKeyword.value);
  } else if (activeCategory.value === "all") {
    results = utilityStore.articles;
  } else {
    results = utilityStore.getArticlesByCategory(
      activeCategory.value as KnowledgeArticle["category"]
    );
  }

  return results;
});

function getCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    travel: t("knowledge.categoryTravel"),
    home: t("knowledge.categoryHome"),
    emergency: t("knowledge.categoryEmergency"),
  };
  return map[category] || category;
}

function onCategoryTap(key: string) {
  activeCategory.value = key;
  searchKeyword.value = "";
  expandedId.value = "";
}

function onSearch() {
  activeCategory.value = "all";
  expandedId.value = "";
}

function clearSearch() {
  searchKeyword.value = "";
  expandedId.value = "";
}

function toggleArticle(id: string) {
  expandedId.value = expandedId.value === id ? "" : id;
}
</script>

<style scoped>
.knowledge-page {
  padding: 24rpx;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.page-header {
  padding: 20rpx 0 24rpx;
}

.page-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #1a1a2e;
}

/* ── Search bar ── */
.search-bar {
  position: relative;
  margin-bottom: 20rpx;
}

.search-input {
  width: 100%;
  height: 80rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 0 80rpx 0 28rpx;
  font-size: 28rpx;
  color: #333;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.search-clear {
  position: absolute;
  right: 20rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-clear-icon {
  font-size: 28rpx;
  color: #999;
}

/* ── Category tabs ── */
.category-tabs {
  white-space: nowrap;
  margin-bottom: 16rpx;
}

.tabs-inner {
  display: flex;
  gap: 16rpx;
  padding: 4rpx 0;
}

.tab-item {
  flex-shrink: 0;
  height: 64rpx;
  padding: 0 32rpx;
  border-radius: 32rpx;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.tab-active {
  background-color: #2563eb;
}

.tab-text {
  font-size: 26rpx;
  color: #666;
}

.tab-text-active {
  color: #ffffff;
  font-weight: 500;
}

/* ── Article count ── */
.article-count-bar {
  margin-bottom: 16rpx;
}

.article-count-text {
  font-size: 24rpx;
  color: #999;
}

/* ── Article list ── */
.article-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.article-card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.article-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.article-title {
  flex: 1;
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a2e;
  line-height: 1.4;
}

.article-category-tag {
  flex-shrink: 0;
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  font-weight: 500;
}

.tag-travel {
  background-color: #eff6ff;
  color: #2563eb;
}

.tag-home {
  background-color: #f0fdf4;
  color: #16a34a;
}

.tag-emergency {
  background-color: #fef2f2;
  color: #dc2626;
}

/* ── Article content ── */
.article-content {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.article-content-expanded {
  -webkit-line-clamp: unset;
  display: block;
}

/* ── Empty state ── */
.empty-state {
  padding: 80rpx 0;
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
