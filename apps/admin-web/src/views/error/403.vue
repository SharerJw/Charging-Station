<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/dashboard')
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="error-page">
    <div class="error-content">
      <div class="error-code">403</div>
      <div class="error-title">抱歉，您没有权限访问此页面</div>
      <div class="error-desc">请联系管理员获取相应权限</div>
      <div class="error-actions">
        <el-button type="primary" @click="goHome">返回首页</el-button>
        <el-button @click="goBack">返回上一页</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #F0F2F5;
}

.error-content {
  text-align: center;
}

.error-code {
  font-size: 120px;
  font-weight: bold;
  color: #1677FF;
  line-height: 1;
}

.error-title {
  font-size: 24px;
  color: #333;
  margin-top: 24px;
}

.error-desc {
  font-size: 14px;
  color: #999;
  margin-top: 12px;
}

.error-actions {
  margin-top: 32px;
  display: flex;
  gap: 16px;
  justify-content: center;
}
</style>
