import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'

export interface TabItem {
  path: string
  title: string
  name: string
  closable: boolean
  query?: Record<string, any>
}

export const useTabStore = defineStore('tabs', () => {
  const tabs = ref<TabItem[]>([
    { path: '/dashboard', title: '工作台', name: 'Dashboard', closable: false },
  ])
  const activeTab = ref('/dashboard')

  function addTab(route: RouteLocationNormalized) {
    const exists = tabs.value.find(t => t.path === route.path)
    if (!exists) {
      tabs.value.push({
        path: route.path,
        title: (route.meta?.title as string) || route.name?.toString() || '未命名',
        name: route.name?.toString() || '',
        closable: route.path !== '/dashboard',
      })
    }
    activeTab.value = route.path
  }

  function removeTab(path: string) {
    const idx = tabs.value.findIndex(t => t.path === path)
    if (idx === -1) return
    tabs.value.splice(idx, 1)
    if (activeTab.value === path) {
      activeTab.value = tabs.value[Math.min(idx, tabs.value.length - 1)]?.path || '/dashboard'
    }
    return activeTab.value
  }

  function removeOtherTabs(path: string) {
    tabs.value = tabs.value.filter(t => !t.closable || t.path === path)
    activeTab.value = path
  }

  function removeAllTabs() {
    tabs.value = tabs.value.filter(t => !t.closable)
    activeTab.value = tabs.value[0]?.path || '/dashboard'
    return activeTab.value
  }

  return { tabs, activeTab, addTab, removeTab, removeOtherTabs, removeAllTabs }
})
