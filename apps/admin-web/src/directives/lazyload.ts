import type { App, Directive } from 'vue'

/**
 * 图片懒加载指令
 * 使用 IntersectionObserver API，图片进入可视区域时才加载真实 src
 *
 * 用法：
 *   <img v-lazy="item.image" src="/placeholder.png" />
 *   <img v-lazy="{ src: item.image, error: '/error.png' }" src="/placeholder.png" />
 */

const LAZY_OBSERVER_KEY = '__lazy_observer__'

interface LazyOptions {
  src: string
  error?: string
  loading?: string
}

function loadImage(el: HTMLImageElement, src: string, errorSrc?: string) {
  const img = new Image()
  img.src = src
  img.onload = () => {
    el.src = src
    el.classList.add('lazy-loaded')
    el.classList.remove('lazy-loading')
  }
  img.onerror = () => {
    if (errorSrc) {
      el.src = errorSrc
    }
    el.classList.add('lazy-error')
    el.classList.remove('lazy-loading')
  }
}

function getObserver(): IntersectionObserver {
  // 复用全局单例 observer
  const g = globalThis as Record<string, unknown>
  if (!g[LAZY_OBSERVER_KEY]) {
    g[LAZY_OBSERVER_KEY] = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLImageElement
            const dataset = el.dataset as Record<string, string>
            const src = dataset.lazySrc
            const errorSrc = dataset.lazyError

            if (src) {
              el.classList.add('lazy-loading')
              loadImage(el, src, errorSrc)
            }

            // 加载后取消观察
            ;(g[LAZY_OBSERVER_KEY] as IntersectionObserver).unobserve(el)
          }
        })
      },
      {
        rootMargin: '100px 0px',
        threshold: 0.01,
      }
    )
  }
  return g[LAZY_OBSERVER_KEY] as IntersectionObserver
}

const lazyDirective: Directive = {
  mounted(el: HTMLElement, binding) {
    if (el.tagName !== 'IMG') {
      console.warn('[v-lazy] 指令仅支持 <img> 元素')
      return
    }

    const imgEl = el as HTMLImageElement
    const value = binding.value

    let src: string
    let errorSrc: string | undefined

    if (typeof value === 'string') {
      src = value
    } else if (value && typeof value === 'object') {
      const opts = value as LazyOptions
      src = opts.src
      errorSrc = opts.error
    } else {
      return
    }

    // 将真实地址存入 data 属性
    imgEl.dataset.lazySrc = src
    if (errorSrc) {
      imgEl.dataset.lazyError = errorSrc
    }

    // 开始观察
    getObserver().observe(imgEl)
  },

  updated(el: HTMLElement, binding) {
    const imgEl = el as HTMLImageElement
    const value = binding.value
    const oldValue = binding.oldValue

    const newSrc = typeof value === 'string' ? value : value?.src
    const oldSrc = typeof oldValue === 'string' ? oldValue : oldValue?.src

    // src 变化时重新观察
    if (newSrc && newSrc !== oldSrc) {
      const observer = getObserver()
      observer.unobserve(imgEl)

      imgEl.dataset.lazySrc = newSrc
      if (typeof value === 'object' && value?.error) {
        imgEl.dataset.lazyError = value.error
      }

      observer.observe(imgEl)
    }
  },

  unmounted(el: HTMLElement) {
    const observer = getObserver()
    observer.unobserve(el as HTMLImageElement)
  },
}

/**
 * 注册懒加载指令到 Vue 应用
 */
export function setupLazyload(app: App) {
  app.directive('lazy', lazyDirective)
}
