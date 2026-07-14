<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePermissionStore } from '@/store/permission'
import {
  DataAnalysis, Location, Monitor, ShoppingCart, Money,
  User as UserIcon, Present, Lightning, Bell, Box,
  TrendCharts, Setting, ArrowLeft, ArrowRight,
} from '@element-plus/icons-vue'

const props = defineProps<{ collapsed: boolean }>()
const emit = defineEmits(['toggle'])

const router = useRouter()
const route = useRoute()
const permissionStore = usePermissionStore()

const iconMap: Record<string, any> = {
  DataAnalysis, Location, Monitor, ShoppingCart, Money,
  User: UserIcon, Present, Lightning, Bell, Box,
  TrendCharts, Setting,
}

interface MenuItem {
  path: string
  title: string
  icon: string
  roles: string[]
}

const allMenus: MenuItem[] = [
  { path: '/dashboard', title: '工作台', icon: 'DataAnalysis', roles: ['admin', 'operator', 'finance', 'ops'] },
  { path: '/station', title: '站点管理', icon: 'Location', roles: ['admin', 'operator'] },
  { path: '/device', title: '设备管理', icon: 'Monitor', roles: ['admin', 'operator', 'ops'] },
  { path: '/order', title: '订单中心', icon: 'ShoppingCart', roles: ['admin', 'operator', 'finance'] },
  { path: '/finance', title: '财务管理', icon: 'Money', roles: ['admin', 'finance'] },
  { path: '/user', title: '用户管理', icon: 'User', roles: ['admin', 'operator'] },
  { path: '/marketing', title: '营销中心', icon: 'Present', roles: ['admin', 'operator'] },
  { path: '/pricing', title: '电价管理', icon: 'Lightning', roles: ['admin', 'operator'] },
  { path: '/alert', title: '告警中心', icon: 'Bell', roles: ['admin', 'ops'] },
  { path: '/ops', title: '运维管理', icon: 'Box', roles: ['admin', 'ops'] },
  { path: '/analytics', title: '数据分析', icon: 'TrendCharts', roles: ['admin'] },
  { path: '/system', title: '系统管理', icon: 'Setting', roles: ['admin'] },
]

const visibleMenus = computed(() => {
  return allMenus.filter(menu => {
    return menu.roles.some(role => permissionStore.hasRole(role))
  })
})

function handleMenuClick(path: string) {
  router.push(path)
}
</script>

<template>
  <div class="sidebar" :class="{ collapsed }">
    <!-- 品牌区 -->
    <div class="brand">
      <span class="brand-icon">⚡</span>
      <span v-if="!collapsed" class="brand-text">智慧充电运营管理平台</span>
    </div>

    <!-- 菜单 -->
    <el-menu
      :default-active="route.path"
      :collapse="collapsed"
      background-color="#001529"
      text-color="#ffffffa6"
      active-text-color="#1677FF"
      :collapse-transition="false"
      @select="handleMenuClick"
    >
      <el-menu-item v-for="menu in visibleMenus" :key="menu.path" :index="menu.path">
        <el-icon><component :is="iconMap[menu.icon]" /></el-icon>
        <template #title>{{ menu.title }}</template>
      </el-menu-item>
    </el-menu>

    <!-- 底部折叠按钮 -->
    <div class="sidebar-footer">
      <div class="collapse-btn" @click="emit('toggle')">
        <el-icon>
          <ArrowLeft v-if="!collapsed" />
          <ArrowRight v-else />
        </el-icon>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #001529;
  transition: width 0.3s;
  overflow: hidden;
}

.brand {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0 16px;
  flex-shrink: 0;
}

.brand-icon {
  font-size: 24px;
}

.brand-text {
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
}

.collapsed .brand-text {
  display: none;
}

.el-menu {
  flex: 1;
  overflow-y: auto;
  border-right: none;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  color: #ffffffa6;
  transition: all 0.2s;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}
</style>
