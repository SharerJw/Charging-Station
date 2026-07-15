import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from './user'

// Mock API
vi.mock('@/api', () => ({
  authApi: {
    login: vi.fn().mockResolvedValue({
      token: 'mock-token-123',
      user: { id: '1', username: 'admin', nickname: '管理员', roles: ['admin'] },
    }),
    logout: vi.fn().mockResolvedValue(undefined),
    profile: vi.fn().mockResolvedValue({
      id: '1',
      username: 'admin',
      nickname: '管理员',
      roles: ['admin'],
    }),
  },
}))

// Mock router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('useUserStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('初始状态应为空', () => {
    const store = useUserStore()
    expect(store.token).toBe('')
    expect(store.userInfo.username).toBe('')
  })

  it('setToken 应更新 token', () => {
    const store = useUserStore()
    store.setToken('test-token')
    expect(store.token).toBe('test-token')
    expect(localStorage.getItem('admin_token')).toBe('test-token')
  })

  it('setUserInfo 应更新用户信息', () => {
    const store = useUserStore()
    const user = { id: '1', username: 'admin', nickname: '管理员', avatar: '', roles: ['admin'] }
    store.setUserInfo(user)
    expect(store.userInfo.username).toBe('admin')
  })

  it('isLoggedIn 应根据 token 判断', () => {
    const store = useUserStore()
    expect(store.isLoggedIn).toBe(false)
    store.setToken('test-token')
    expect(store.isLoggedIn).toBe(true)
  })

  it('logout 应清除用户数据', () => {
    const store = useUserStore()
    store.setToken('test-token')
    store.setUserInfo({ id: '1', username: 'admin', nickname: '', avatar: '', roles: [] })
    store.logout()
    expect(store.token).toBe('')
    expect(store.userInfo.username).toBe('')
  })
})
