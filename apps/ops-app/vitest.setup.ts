import { vi } from 'vitest'

// Register UniApp custom elements as standard HTML tags
// so @vue/test-utils can render them in jsdom
beforeAll(() => {
  // @ts-ignore
  globalThis.HTMLElement.prototype.attachShadow = () => ({})
})

// Mock uni global (available everywhere)
;(globalThis as any).uni = {
  showToast: vi.fn(),
  showModal: vi.fn((opts: any) => opts.success?.({ confirm: true })),
  navigateTo: vi.fn(),
  reLaunch: vi.fn(),
  switchTab: vi.fn(),
  getStorageSync: vi.fn(() => ''),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  request: vi.fn(),
}
