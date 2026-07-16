import { ref, watch } from 'vue'

type Theme = 'dark' | 'light'

const THEME_KEY = 'ev-simulator-theme'
const theme = ref<Theme>((localStorage.getItem(THEME_KEY) as Theme) || 'dark')

function applyTheme(t: Theme) {
  document.documentElement.setAttribute('data-theme', t)
  localStorage.setItem(THEME_KEY, t)
}

// 初始化
applyTheme(theme.value)

watch(theme, (t) => {
  applyTheme(t)
})

export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  function setTheme(t: Theme) {
    theme.value = t
  }

  return {
    theme,
    toggleTheme,
    setTheme,
    isDark: () => theme.value === 'dark',
  }
}
