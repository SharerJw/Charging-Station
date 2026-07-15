import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useOpsStore } from './ops'

// Mock uni global
global.uni = {
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
} as any

describe('useOpsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始状态应为空', () => {
    const store = useOpsStore()
    expect(store.token).toBe('')
    expect(store.userInfo.name).toBe('')
    expect(store.isLoggedIn).toBe(false)
  })

  it('setToken 应更新 token', () => {
    const store = useOpsStore()
    store.setToken('test-token')
    expect(store.token).toBe('test-token')
    expect(uni.setStorageSync).toHaveBeenCalledWith('ops_token', 'test-token')
  })

  it('setUserInfo 应更新用户信息', () => {
    const store = useOpsStore()
    store.setUserInfo({ id: '1', name: '运维人员', role: 'operator', avatar: '' })
    expect(store.userInfo.name).toBe('运维人员')
    expect(store.isLoggedIn).toBe(true)
  })

  it('logout 应清除用户数据', () => {
    const store = useOpsStore()
    store.setToken('test-token')
    store.setUserInfo({ id: '1', name: '运维人员', role: 'operator', avatar: '' })
    store.logout()
    expect(store.token).toBe('')
    expect(store.userInfo.name).toBe('')
    expect(store.isLoggedIn).toBe(false)
  })
})
