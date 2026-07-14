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
  }

  function logout() {
    token.value = ''
    userInfo.value = { id: '', nickname: '', phone: '', avatar: '' }
    isLoggedIn.value = false
    uni.removeStorageSync('token')
  }

  return { token, userInfo, isLoggedIn, setToken, setUserInfo, logout }
})
