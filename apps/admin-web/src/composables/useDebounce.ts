import { ref, watch } from 'vue'

/**
 * 防抖 Hook
 * @param value 要防抖的值
 * @param delay 延迟毫秒数
 */
export function useDebounce<T>(value: Ref<T>, delay: number = 300): Ref<T> {
  const debouncedValue = ref<T>(value.value) as Ref<T>
  let timer: ReturnType<typeof setTimeout> | null = null

  watch(value, (newVal) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      debouncedValue.value = newVal
    }, delay)
  })

  return debouncedValue
}

/**
 * 防抖函数
 */
export function useDebounceFn<T extends (...args: any[]) => any>(fn: T, delay: number = 300): T {
  let timer: ReturnType<typeof setTimeout> | null = null
  return ((...args: any[]) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }) as T
}

import type { Ref } from 'vue'
