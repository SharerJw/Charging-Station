import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AlertCard from './AlertCard.vue'

// Mock uni global for component tests
;(global as any).uni = {
  showToast: vi.fn(),
  navigateTo: vi.fn(),
}

describe('AlertCard', () => {
  const defaultProps = {
    level: 'P0',
    title: '充电桩通信中断',
    description: '站点A充电桩001超过30秒未上报心跳',
    stationName: '朝阳充电站',
    status: 'pending',
    createTime: '2026-07-16 10:30:00',
  }

  it('应正确渲染告警级别', () => {
    const wrapper = mount(AlertCard, { props: defaultProps })
    const levelEl = wrapper.find('.alert-level')
    expect(levelEl.text()).toBe('P0')
    expect(levelEl.classes()).toContain('p0')
  })

  it('应正确渲染告警标题', () => {
    const wrapper = mount(AlertCard, { props: defaultProps })
    expect(wrapper.find('.alert-title').text()).toBe('充电桩通信中断')
  })

  it('应正确渲染告警描述', () => {
    const wrapper = mount(AlertCard, { props: defaultProps })
    expect(wrapper.find('.alert-desc').text()).toContain('站点A充电桩001')
  })

  it('应正确渲染站点名称', () => {
    const wrapper = mount(AlertCard, { props: defaultProps })
    expect(wrapper.find('.alert-meta').text()).toContain('朝阳充电站')
  })

  it('pending 状态应显示"待处理"', () => {
    const wrapper = mount(AlertCard, { props: { ...defaultProps, status: 'pending' } })
    expect(wrapper.find('.alert-status').text()).toBe('待处理')
  })

  it('resolved 状态应显示"已解决"', () => {
    const wrapper = mount(AlertCard, { props: { ...defaultProps, status: 'resolved' } })
    expect(wrapper.find('.alert-status').text()).toBe('已解决')
  })

  it('P1 级别应包含 p1 class', () => {
    const wrapper = mount(AlertCard, { props: { ...defaultProps, level: 'P1' } })
    expect(wrapper.find('.alert-level').classes()).toContain('p1')
  })

  it('P2 级别应包含 p2 class', () => {
    const wrapper = mount(AlertCard, { props: { ...defaultProps, level: 'P2' } })
    expect(wrapper.find('.alert-level').classes()).toContain('p2')
  })
})
