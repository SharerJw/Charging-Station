import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusTag from './StatusTag.vue'
import { OrderStatus } from '@/types'

describe('订单 StatusTag', () => {
  it('不同状态显示不同文本', () => {
    const cases = [
      { status: OrderStatus.CREATED, expected: '已创建' },
      { status: OrderStatus.CHARGING, expected: '充电中' },
      { status: OrderStatus.STOPPING, expected: '停止中' },
      { status: OrderStatus.STOPPED, expected: '已停止' },
      { status: OrderStatus.SETTLING, expected: '结算中' },
      { status: OrderStatus.SETTLED, expected: '已结算' },
      { status: OrderStatus.PAYING, expected: '支付中' },
      { status: OrderStatus.PAID, expected: '已完成' },
      { status: OrderStatus.REFUNDING, expected: '退款中' },
      { status: OrderStatus.ABNORMAL, expected: '异常' },
      { status: OrderStatus.CANCELLED, expected: '已取消' },
    ]

    for (const { status, expected } of cases) {
      const wrapper = mount(StatusTag, { props: { status } })
      expect(wrapper.text()).toBe(expected)
    }
  })

  it('已知状态列表完整覆盖所有 OrderStatus 枚举值', () => {
    const allStatuses = Object.values(OrderStatus)
    expect(allStatuses).toHaveLength(11)
    expect(allStatuses).toContain('CREATED')
    expect(allStatuses).toContain('CHARGING')
    expect(allStatuses).toContain('PAID')
    expect(allStatuses).toContain('ABNORMAL')
    expect(allStatuses).toContain('CANCELLED')

    for (const status of allStatuses) {
      const wrapper = mount(StatusTag, { props: { status } })
      expect(wrapper.text()).toBeTruthy()
    }
  })

  it('未知状态应 fallback 显示原始值', () => {
    const wrapper = mount(StatusTag, { props: { status: 'UNKNOWN' as any } })
    expect(wrapper.text()).toBe('UNKNOWN')
  })
})
