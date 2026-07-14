import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { usePermissionStore } from '@/store/permission'
import { useTabStore } from '@/store/tabs'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/403.vue'),
    meta: { title: '无权限', requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '工作台', icon: 'DataAnalysis', roles: ['admin', 'operator', 'finance', 'ops'] },
      },
      {
        path: 'station',
        name: 'Station',
        component: () => import('@/views/station/index.vue'),
        meta: { title: '站点管理', icon: 'Location', roles: ['admin', 'operator'] },
      },
      {
        path: 'device',
        name: 'Device',
        component: () => import('@/views/device/index.vue'),
        meta: { title: '设备管理', icon: 'Monitor', roles: ['admin', 'operator', 'ops'] },
      },
      {
        path: 'order',
        name: 'Order',
        component: () => import('@/views/order/index.vue'),
        meta: { title: '订单中心', icon: 'ShoppingCart', roles: ['admin', 'operator', 'finance'] },
      },
      {
        path: 'finance',
        name: 'Finance',
        component: () => import('@/views/finance/index.vue'),
        meta: { title: '财务管理', icon: 'Money', roles: ['admin', 'finance'] },
      },
      {
        path: 'user',
        name: 'User',
        component: () => import('@/views/user/index.vue'),
        meta: { title: '用户管理', icon: 'User', roles: ['admin', 'operator'] },
      },
      {
        path: 'marketing',
        name: 'Marketing',
        component: () => import('@/views/marketing/index.vue'),
        meta: { title: '营销中心', icon: 'Present', roles: ['admin', 'operator'] },
      },
      {
        path: 'pricing',
        name: 'Pricing',
        component: () => import('@/views/pricing/index.vue'),
        meta: { title: '电价管理', icon: 'Lightning', roles: ['admin', 'operator'] },
      },
      {
        path: 'alert',
        name: 'Alert',
        component: () => import('@/views/alert/index.vue'),
        meta: { title: '告警中心', icon: 'Bell', roles: ['admin', 'ops'] },
      },
      {
        path: 'ops',
        name: 'Ops',
        component: () => import('@/views/ops/index.vue'),
        meta: { title: '运维管理', icon: 'Box', roles: ['admin', 'ops'] },
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/views/analytics/index.vue'),
        meta: { title: '数据分析', icon: 'TrendCharts', roles: ['admin'] },
      },
      {
        path: 'system',
        name: 'System',
        component: () => import('@/views/system/index.vue'),
        meta: { title: '系统管理', icon: 'Setting', roles: ['admin'] },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  document.title = `${to.meta.title || 'EV充电平台'} - 后台管理`

  const permissionStore = usePermissionStore()

  // 1. 不需要认证的页面直接放行
  if (to.meta.requiresAuth === false) {
    next()
    return
  }

  // 2. 检查 Token
  if (!permissionStore.isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  // 3. 检查用户信息是否已拉取
  if (!permissionStore.userInfo) {
    try {
      // Mock 模式下直接设置用户信息
      permissionStore.setUserInfo({
        id: 'A001',
        username: 'admin',
        nickname: '超级管理员',
        avatar: '',
        roles: ['admin'],
        permissions: [],
        tenantId: 'T001',
        tenantName: 'EV充电集团',
        orgId: 'ORG001',
        orgName: '总部',
      })
    } catch (error) {
      permissionStore.logout()
      next({ path: '/login', query: { redirect: to.fullPath } })
      return
    }
  }

  // 4. 检查路由权限
  const requiredRoles = to.meta?.roles as string[] | undefined
  if (requiredRoles && requiredRoles.length > 0) {
    const hasAccess = requiredRoles.some(role => permissionStore.hasRole(role))
    if (!hasAccess) {
      next('/403')
      return
    }
  }

  // 5. 添加标签页
  const tabStore = useTabStore()
  tabStore.addTab(to)

  next()
})

export default router
