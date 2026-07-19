import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const userInfo = ref({
    id: '',
    nickname: '',
    phone: '',
    avatar: '',
  })
  const isLoggedIn = ref(false)

  function setToken(newToken: string) {
    token.value = newToken
    uni.setStorageSync('token', newToken)
  }

  function setUserInfo(info: typeof userInfo.value) {
    userInfo.value = info
    isLoggedIn.value = true
    uni.setStorageSync('userInfo', JSON.stringify(info))
  }

  /** 增量更新用户信息字段（不覆盖未传字段） */
  function mergeUserInfo(partial: Partial<typeof userInfo.value>) {
    Object.assign(userInfo.value, partial)
    uni.setStorageSync('userInfo', JSON.stringify(userInfo.value))
  }

  /** 从本地存储恢复用户信息（App 启动时调用） */
  function initFromStorage() {
    const tokenStr = uni.getStorageSync('token')
    if (tokenStr) {
      token.value = tokenStr
    }
    const raw = uni.getStorageSync('userInfo')
    if (raw) {
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (parsed && typeof parsed === 'object') {
          userInfo.value = { id: '', nickname: '', phone: '', avatar: '', ...parsed }
          isLoggedIn.value = true
        }
      } catch {
        // 解析失败忽略
      }
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = { id: '', nickname: '', phone: '', avatar: '' }
    isLoggedIn.value = false
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')
  }

  return { token, userInfo, isLoggedIn, setToken, setUserInfo, mergeUserInfo, initFromStorage, logout }
})
