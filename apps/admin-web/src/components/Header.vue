<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePermissionStore } from '@/store/permission'
import { Search, Bell, SwitchButton, User as UserIcon } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const permissionStore = usePermissionStore()
const searchVisible = ref(false)
const searchQuery = ref('')

// 面包屑
const breadcrumbs = computed(() => {
  const matched = route.matched.filter(r => r.meta?.title)
  return matched.map(r => ({
    title: r.meta.title as string,
    path: r.path,
  }))
})

// 通知数量
const notificationCount = ref(3)
const todoCount = ref(2)

function handleLogout() {
  permissionStore.logout()
  router.push('/login')
}

function toggleSearch() {
  searchVisible.value = !searchVisible.value
  if (searchVisible.value) {
    searchQuery.value = ''
  }
}
</script>

<template>
  <div class="header">
    <!-- 左侧：面包屑 -->
    <div class="header-left">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path" :to="{ path: item.path }">
          {{ item.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 右侧：功能区 -->
    <div class="header-right">
      <!-- 全局搜索 -->
      <div class="header-icon" @click="toggleSearch" title="Ctrl+K 搜索">
        <el-icon :size="18"><Search /></el-icon>
      </div>

      <!-- 通知 -->
      <el-badge :value="notificationCount" :max="99" class="header-badge">
        <div class="header-icon">
          <el-icon :size="18"><Bell /></el-icon>
        </div>
      </el-badge>

      <!-- 待办 -->
      <el-badge :value="todoCount" :max="99" class="header-badge">
        <div class="header-icon" title="待办事项">
          <el-icon :size="18"><el-icon-tickets /></el-icon>
        </div>
      </el-badge>

      <!-- 用户下拉 -->
      <el-dropdown trigger="click">
        <div class="user-info">
          <el-avatar :size="28" :icon="UserIcon" />
          <span class="username">{{ permissionStore.userInfo?.nickname || '管理员' }}</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>
              <el-icon><UserIcon /></el-icon>
              个人设置
            </el-dropdown-item>
            <el-dropdown-item divided @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 搜索弹窗 -->
    <el-dialog v-model="searchVisible" width="600px" :show-close="false" class="search-dialog">
      <el-input
        v-model="searchQuery"
        placeholder="搜索站点、设备、用户、订单..."
        size="large"
        :prefix-icon="Search"
        autofocus
      />
      <div class="search-hint">
        <span>支持搜索：站点名称/编号、设备编号、用户手机号、订单号</span>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 16px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.header-icon:hover {
  background: #f5f5f5;
  color: #1677FF;
}

.header-badge {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.user-info:hover {
  background: #f5f5f5;
}

.username {
  font-size: 14px;
  color: #333;
}

.search-hint {
  margin-top: 12px;
  color: #999;
  font-size: 12px;
}
</style>
