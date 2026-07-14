import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '仪表盘' },
      },
      {
        path: 'charging',
        name: 'Charging',
        component: () => import('@/views/charging/index.vue'),
        meta: { title: '充电模拟' },
      },
      {
        path: 'device',
        name: 'Device',
        component: () => import('@/views/device/index.vue'),
        meta: { title: '设备管理' },
      },
      {
        path: 'scenario',
        name: 'Scenario',
        component: () => import('@/views/scenario/index.vue'),
        meta: { title: '场景编排' },
      },
      {
        path: 'logs',
        name: 'Logs',
        component: () => import('@/views/logs/index.vue'),
        meta: { title: '日志终端' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || '模拟器'} - EV充电模拟器`
  next()
})

export default router
