<template>
  <view class="knowledge-page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <input class="search-input" placeholder="搜索知识库文章" v-model="keyword" @confirm="searchArticles" />
      <view class="search-btn" @tap="searchArticles">
        <text class="search-btn-text">搜索</text>
      </view>
    </view>

    <!-- 分类导航 -->
    <view class="category-section" v-if="!selectedArticle">
      <text class="section-title">知识分类</text>
      <view class="category-grid">
        <view
          class="category-item"
          v-for="cat in categories"
          :key="cat.id"
          @tap="filterByCategory(cat.id)"
          :class="{ active: selectedCategory === cat.id }"
        >
          <text class="category-icon">{{ cat.icon }}</text>
          <text class="category-name">{{ cat.name }}</text>
          <text class="category-count">{{ cat.count }}篇</text>
        </view>
      </view>
    </view>

    <!-- 文章列表 -->
    <view class="article-section" v-if="!selectedArticle">
      <view class="section-header">
        <text class="section-title">{{ selectedCategoryName || '全部文章' }}</text>
        <view class="sort-btn" @tap="toggleSort">
          <text class="sort-text">{{ sortLabels[sortBy] }}</text>
        </view>
      </view>
      <view class="article-list">
        <view class="article-card" v-for="article in articles" :key="article.id" @tap="openArticle(article)">
          <text class="article-title">{{ article.title }}</text>
          <view class="article-meta">
            <view class="meta-tag">{{ article.categoryName }}</view>
            <text class="meta-views">{{ article.views }}次阅读</text>
            <text class="meta-date">{{ article.date }}</text>
          </view>
          <text class="article-summary" v-if="article.summary">{{ article.summary }}</text>
        </view>
      </view>
      <view class="empty-state" v-if="articles.length === 0 && !loading">
        <text class="empty-icon">📚</text>
        <text class="empty-text">暂无相关文章</text>
      </view>
    </view>

    <!-- 文章详情 -->
    <view class="article-detail" v-if="selectedArticle">
      <view class="back-row" @tap="selectedArticle = null">
        <text class="back-text">← 返回列表</text>
      </view>
      <view class="detail-header">
        <text class="detail-title">{{ selectedArticle.title }}</text>
        <view class="detail-meta">
          <view class="meta-tag">{{ selectedArticle.categoryName }}</view>
          <text class="meta-views">{{ selectedArticle.views }}次阅读</text>
          <text class="meta-date">{{ selectedArticle.date }}</text>
        </view>
      </view>
      <view class="detail-body">
        <text class="detail-content">{{ selectedArticle.content || '文章内容加载中...' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/api'
import type { KnowledgeCategory as Category, Article } from '@/types'

const keyword = ref('')
const loading = ref(false)
const categories = ref<Category[]>([])
const articles = ref<Article[]>([])
const selectedCategory = ref('')
const selectedArticle = ref<Article | null>(null)
const sortBy = ref<'date' | 'views'>('date')

const sortLabels: Record<string, string> = {
  date: '最新发布',
  views: '最多阅读',
}

const selectedCategoryName = computed(() => {
  if (!selectedCategory.value) return ''
  const cat = categories.value.find(c => c.id === selectedCategory.value)
  return cat?.name || ''
})

async function loadCategories() {
  try {
    const result = await api.getKnowledgeCategories()
    categories.value = result || []
  } catch {
    console.error('加载分类失败')
  }
}

async function loadArticles() {
  loading.value = true
  try {
    const params: any = { sortBy: sortBy.value }
    if (keyword.value) params.keyword = keyword.value
    if (selectedCategory.value) params.categoryId = selectedCategory.value
    const result = await api.getKnowledgeArticles(params)
    articles.value = result?.list || result || []
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function searchArticles() {
  selectedCategory.value = ''
  loadArticles()
}

function filterByCategory(catId: string) {
  selectedCategory.value = selectedCategory.value === catId ? '' : catId
  loadArticles()
}

function toggleSort() {
  sortBy.value = sortBy.value === 'date' ? 'views' : 'date'
  loadArticles()
}

function openArticle(article: Article) {
  selectedArticle.value = article
}

onMounted(() => {
  loadCategories()
  loadArticles()
})
</script>

<style scoped>
.knowledge-page {
  padding: 24rpx;
  background: #F0F2F5;
  min-height: 100vh;
}

.search-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.search-input {
  flex: 1;
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
}

.search-btn {
  background: #1677FF;
  border-radius: 12rpx;
  padding: 20rpx 32rpx;
  display: flex;
  align-items: center;
}

.search-btn-text {
  color: #fff;
  font-size: 28rpx;
  white-space: nowrap;
}

.category-section {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 16rpx;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 8rpx;
  border-radius: 12rpx;
  background: #F5F7FA;
}

.category-item.active {
  background: #E6F7FF;
  border: 2rpx solid #1677FF;
}

.category-icon {
  font-size: 48rpx;
  margin-bottom: 8rpx;
}

.category-name {
  font-size: 24rpx;
  color: #333;
  display: block;
  text-align: center;
}

.category-count {
  font-size: 20rpx;
  color: #999;
  display: block;
}

.article-section {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.sort-btn {
  background: #F5F7FA;
  border-radius: 8rpx;
  padding: 8rpx 16rpx;
}

.sort-text {
  font-size: 24rpx;
  color: #666;
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.article-card {
  background: #F5F7FA;
  border-radius: 8rpx;
  padding: 24rpx;
}

.article-card:active {
  background: #E6F7FF;
}

.article-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 12rpx;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex-wrap: wrap;
}

.meta-tag {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
  background: #E6F7FF;
  color: #1677FF;
}

.meta-views,
.meta-date {
  font-size: 22rpx;
  color: #999;
}

.article-summary {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-top: 12rpx;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 文章详情 */
.article-detail {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
}

.back-row {
  margin-bottom: 16rpx;
}

.back-text {
  font-size: 28rpx;
  color: #1677FF;
}

.detail-header {
  margin-bottom: 24rpx;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.detail-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 12rpx;
  line-height: 1.4;
}

.detail-body {
  min-height: 400rpx;
}

.detail-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.8;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;
}

.empty-icon {
  font-size: 80rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-top: 16rpx;
}
</style>
