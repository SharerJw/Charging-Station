import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserInfo {
  id: string
  username: string
  nickname: string
  avatar: string
  roles: string[]
  permissions: string[]
  tenantId: string
  tenantName: string
  orgId: string
  orgName: string
}

// 角色-菜单映射
const ROLE_MENUS: Record<string, string[]> = {
  admin: ['dashboard', 'station', 'device', 'order', 'finance', 'user', 'marketing', 'pricing', 'alert', 'ops', 'analytics', 'system'],
  operator: ['dashboard', 'station', 'device', 'order', 'user', 'marketing', 'pricing'],
  finance: ['dashboard', 'order', 'finance'],
  ops: ['dashboard', 'device', 'alert', 'ops'],
}

// 角色-按钮权限映射
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    'station:create', 'station:edit', 'station:delete', 'station:status',
    'device:reset', 'device:unlock', 'device:firmware',
    'order:detail', 'order:refund', 'order:export',
    'user:detail', 'user:status', 'user:recharge',
    'finance:view', 'finance:export',
    'marketing:create', 'marketing:edit', 'marketing:delete',
    'system:user', 'system:role', 'system:config', 'system:log',
  ],
  operator: [
    'station:create', 'station:edit', 'station:status',
    'device:reset', 'device:unlock',
    'order:detail', 'order:export',
    'user:detail', 'user:status',
    'marketing:create', 'marketing:edit',
  ],
  finance: ['order:detail', 'order:export', 'order:refund', 'finance:view', 'finance:export'],
  ops: ['device:reset', 'device:unlock', 'alert:handle', 'ops:accept', 'ops:complete'],
}

export const usePermissionStore = defineStore('permission', () => {
  const userInfo = ref<UserInfo | null>(null)
  const token = ref(localStorage.getItem('admin_token') || '')
  const isLoggedIn = computed(() => !!token.value)
  const roles = computed(() => userInfo.value?.roles || [])
  const permissions = computed(() => userInfo.value?.permissions || [])

  // 当前角色可访问的菜单
  const accessibleMenus = computed(() => {
    const menus = new Set<string>()
    roles.value.forEach(role => {
      (ROLE_MENUS[role] || []).forEach(m => menus.add(m))
    })
    return Array.from(menus)
  })

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('admin_token', newToken)
  }

  function setUserInfo(info: UserInfo) {
    userInfo.value = info
    // 合并角色对应的权限
    const perms = new Set<string>()
    info.roles.forEach(role => {
      (ROLE_PERMISSIONS[role] || []).forEach(p => perms.add(p))
    })
    ;(info.permissions || []).forEach(p => perms.add(p))
    userInfo.value.permissions = Array.from(perms)
  }

  function hasPermission(perm: string): boolean {
    return permissions.value.includes(perm)
  }

  function hasRole(role: string): boolean {
    return roles.value.includes(role)
  }

  function hasAnyPermission(perms: string[]): boolean {
    return perms.some(p => permissions.value.includes(p))
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('admin_token')
  }

  return {
    userInfo, token, isLoggedIn, roles, permissions,
    accessibleMenus,
    setToken, setUserInfo, hasPermission, hasRole, hasAnyPermission, logout,
  }
})
