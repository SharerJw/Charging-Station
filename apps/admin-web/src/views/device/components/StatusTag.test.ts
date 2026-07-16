import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusTag from './StatusTag.vue'
import { DeviceStatus } from '@/types'

describe('设备 StatusTag', () => {
  it('不同状态显示不同文本', () => {
    const cases = [
      { status: DeviceStatus.ONLINE, expected: '在线' },
      { status: DeviceStatus.OFFLINE, expected: '离线' },
      { status: DeviceStatus.CHARGING, expected: '充电中' },
      { status: DeviceStatus.FAULT, expected: '故障' },
      { status: DeviceStatus.MAINTENANCE, expected: '维护中' },
    ]

    for (const { status, expected } of cases) {
      const wrapper = mount(StatusTag, { props: { status } })
      expect(wrapper.text()).toBe(expected)
    }
  })

  it('已知状态列表完整覆盖所有 DeviceStatus 枚举值', () => {
    const allStatuses = Object.values(DeviceStatus)
    expect(allStatuses).toHaveLength(5)

    for (const status of allStatuses) {
      const wrapper = mount(StatusTag, { props: { status } })
      expect(wrapper.text()).toBeTruthy()
    }
  })

  it('未知状态应 fallback 显示原始值', () => {
    const wrapper = mount(StatusTag, { props: { status: 'UNKNOWN_STATUS' as any } })
    expect(wrapper.text()).toBe('UNKNOWN_STATUS')
  })
})
