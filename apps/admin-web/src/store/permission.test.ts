import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePermissionStore, type UserInfo } from './permission'

describe('usePermissionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  const adminUser: UserInfo = {
    id: '1',
    username: 'admin',
    nickname: '管理员',
    avatar: '',
    roles: ['admin'],
    permissions: [],
    tenantId: 'T001',
    tenantName: 'EV充电集团',
    orgId: 'ORG001',
    orgName: '总部',
  }

  const operatorUser: UserInfo = {
    id: '2',
    username: 'operator',
    nickname: '运营人员',
    avatar: '',
    roles: ['operator'],
    permissions: [],
    tenantId: 'T001',
    tenantName: 'EV充电集团',
    orgId: 'ORG001',
    orgName: '总部',
  }

  it('初始状态应为空', () => {
    const store = usePermissionStore()
    expect(store.token).toBe('')
    expect(store.userInfo).toBeNull()
    expect(store.isLoggedIn).toBe(false)
  })

  it('setToken 应更新 token', () => {
    const store = usePermissionStore()
    store.setToken('test-token')
    expect(store.token).toBe('test-token')
    expect(localStorage.getItem('admin_token')).toBe('test-token')
  })

  it('setUserInfo 应更新用户信息', () => {
    const store = usePermissionStore()
    store.setToken('test-token')
    store.setUserInfo(adminUser)
    expect(store.userInfo?.username).toBe('admin')
    expect(store.isLoggedIn).toBe(true)
  })

  it('admin 角色应有所有菜单权限', () => {
    const store = usePermissionStore()
    store.setUserInfo(adminUser)
    expect(store.accessibleMenus).toContain('dashboard')
    expect(store.accessibleMenus).toContain('station')
    expect(store.accessibleMenus).toContain('device')
    expect(store.accessibleMenus).toContain('order')
    expect(store.accessibleMenus).toContain('finance')
    expect(store.accessibleMenus).toContain('user')
    expect(store.accessibleMenus).toContain('system')
  })

  it('operator 角色应有受限菜单', () => {
    const store = usePermissionStore()
    store.setUserInfo(operatorUser)
    expect(store.accessibleMenus).toContain('dashboard')
    expect(store.accessibleMenus).toContain('station')
    expect(store.accessibleMenus).not.toContain('finance')
    expect(store.accessibleMenus).not.toContain('system')
  })

  it('admin 应有所有按钮权限', () => {
    const store = usePermissionStore()
    store.setUserInfo(adminUser)
    expect(store.hasPermission('station:create')).toBe(true)
    expect(store.hasPermission('device:reset')).toBe(true)
    expect(store.hasPermission('order:refund')).toBe(true)
    expect(store.hasPermission('system:user')).toBe(true)
  })

  it('operator 应有部分按钮权限', () => {
    const store = usePermissionStore()
    store.setUserInfo(operatorUser)
    expect(store.hasPermission('station:create')).toBe(true)
    expect(store.hasPermission('device:reset')).toBe(true)
    expect(store.hasPermission('order:refund')).toBe(false)
    expect(store.hasPermission('system:user')).toBe(false)
  })

  it('hasRole 应正确判断角色', () => {
    const store = usePermissionStore()
    store.setUserInfo(adminUser)
    expect(store.hasRole('admin')).toBe(true)
    expect(store.hasRole('operator')).toBe(false)
  })

  it('hasAnyPermission 应判断任一权限', () => {
    const store = usePermissionStore()
    store.setUserInfo(operatorUser)
    expect(store.hasAnyPermission(['station:create', 'order:refund'])).toBe(true)
    expect(store.hasAnyPermission(['order:refund', 'system:user'])).toBe(false)
  })

  it('logout 应清除所有数据', () => {
    const store = usePermissionStore()
    store.setToken('test-token')
    store.setUserInfo(adminUser)
    store.logout()
    expect(store.token).toBe('')
    expect(store.userInfo).toBeNull()
    expect(store.isLoggedIn).toBe(false)
  })
})
