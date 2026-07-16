<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import SvgIcon from '@/components/SvgIcon.vue'

const router = useRouter()
const route = useRoute()
const isCollapse = ref(false)

const menuItems = [
  { index: '/dashboard', icon: 'dashboard', title: '仪表盘' },
  { index: '/charging', icon: 'lightning', title: '充电模拟' },
  { index: '/device', icon: 'device', title: '设备管理' },
  { index: '/scenario', icon: 'scenario', title: '场景编排' },
  { index: '/logs', icon: 'terminal', title: '日志终端' },
]

const handleMenuSelect = (index: string) => {
  router.push(index)
}

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}
</script>

<template>
  <el-container class="h-screen">
    <el-aside :width="isCollapse ? '64px' : '200px'" class="sidebar">
      <div class="logo">
        <SvgIcon name="lightning" :size="24" color="#3B82F6" />
        <span v-if="!isCollapse" class="logo-text">EV充电模拟器</span>
      </div>
      <el-menu
        :default-active="route.path"
        :collapse="isCollapse"
        background-color="#111827"
        text-color="#9CA3AF"
        active-text-color="#3B82F6"
        @select="handleMenuSelect"
      >
        <el-menu-item v-for="item in menuItems" :key="item.index" :index="item.index">
          <el-icon><SvgIcon :name="item.icon" :size="18" /></el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleCollapse">
            <SvgIcon v-if="!isCollapse" name="collapse" :size="18" />
            <SvgIcon v-else name="expand" :size="18" />
          </el-icon>
          <div class="connection-status">
            <span class="status-dot online"></span>
            <span class="status-text">已连接</span>
          </div>
        </div>
        <div class="header-right">
          <span class="version">v0.1.0</span>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.sidebar {
  background-color: #0e1525;
  border-right: 1px solid rgba(255, 255, 255, 0.04);
  transition: width 0.3s;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  color: #E5E7EB;
  font-size: 16px;
  font-weight: bold;
}

.header {
  background: #0e1525;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #9CA3AF;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-text {
  font-size: 14px;
  color: #10B981;
}

.version {
  font-size: 12px;
  color: #6B7280;
}

.main-content {
  background: #0B1120;
  padding: 24px;
  overflow-y: auto;
}
</style>
