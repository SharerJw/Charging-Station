<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import SvgIcon from '@/components/SvgIcon.vue'
import { useTheme } from '@/composables/useTheme'

const router = useRouter()
const route = useRoute()
const isCollapse = ref(false)
const { theme, toggleTheme } = useTheme()

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
          <button class="theme-toggle" @click="toggleTheme" :title="theme === 'dark' ? '切换亮色' : '切换暗色'">
            <SvgIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="18" />
          </button>
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
  background-color: var(--color-bg-sidebar);
  border-right: 1px solid var(--color-border-subtle);
  transition: width 0.3s, background-color var(--duration-slow);
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: bold;
}

.header {
  background: var(--color-bg-header);
  border-bottom: 1px solid var(--color-border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  transition: background var(--duration-slow);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: color var(--duration-normal);
}

.collapse-btn:hover {
  color: var(--color-text-primary);
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-text {
  font-size: 14px;
  color: var(--color-success);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.theme-toggle {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--color-border-subtle);
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--duration-normal) var(--easing-default);
}

.theme-toggle:hover {
  background: var(--color-border-light);
  color: var(--color-text-primary);
}

.version {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.main-content {
  background: var(--color-bg-page);
  padding: 24px;
  overflow-y: auto;
  transition: background var(--duration-slow);
}
</style>
