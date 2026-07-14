import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'
import { usePermissionStore } from './permission'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('admin_token') || '')
  const userInfo = ref({
    id: '',
    username: '',
    nickname: '',
    avatar: '',
    roles: [] as string[],
  })

  const isLoggedIn = computed(() => !!token.value)

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('admin_token', newToken)
  }

  function setUserInfo(info: typeof userInfo.value) {
    userInfo.value = info
  }

  async function login(data: { username: string; password: string }) {
    const res = await authApi.login(data)
    setToken(res.token)
    setUserInfo({
      id: res.user.id,
      username: res.user.username,
      nickname: res.user.nickname,
      avatar: res.user.avatar || '',
      roles: res.user.roles,
    })
    // 同步到 permissionStore
    const permissionStore = usePermissionStore()
    permissionStore.setToken(res.token)
    permissionStore.setUserInfo({
      id: res.user.id,
      username: res.user.username,
      nickname: res.user.nickname,
      avatar: res.user.avatar || '',
      roles: res.user.roles,
      permissions: [],
      tenantId: 'T001',
      tenantName: 'EV充电集团',
      orgId: 'ORG001',
      orgName: '总部',
    })
  }

  function logout() {
    token.value = ''
    userInfo.value = { id: '', username: '', nickname: '', avatar: '', roles: [] }
    localStorage.removeItem('admin_token')
    const permissionStore = usePermissionStore()
    permissionStore.logout()
  }

  return { token, userInfo, isLoggedIn, setToken, setUserInfo, login, logout }
})
