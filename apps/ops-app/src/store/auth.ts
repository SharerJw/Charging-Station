import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref('')
  const userInfo = ref({
    id: '',
    name: '',
    role: '',
    avatar: '',
  })
  const isLoggedIn = ref(false)

  function setToken(newToken: string) {
    token.value = newToken
    uni.setStorageSync('ops_token', newToken)
  }

  function setUserInfo(info: typeof userInfo.value) {
    userInfo.value = info
    isLoggedIn.value = true
  }

  function logout() {
    token.value = ''
    userInfo.value = { id: '', name: '', role: '', avatar: '' }
    isLoggedIn.value = false
    uni.removeStorageSync('ops_token')
  }

  return { token, userInfo, isLoggedIn, setToken, setUserInfo, logout }
})
