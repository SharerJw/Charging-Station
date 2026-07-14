import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatCard from './StatCard.vue'

const defaultProps = {
  icon: '⚡',
  value: 128,
  label: '在线设备',
}

describe('StatCard', () => {
  it('应渲染统计卡片', () => {
    const wrapper = mount(StatCard, { props: defaultProps })
    expect(wrapper.find('.stat-card').exists()).toBe(true)
  })

  it('应显示图标', () => {
    const wrapper = mount(StatCard, { props: defaultProps })
    expect(wrapper.find('.stat-icon').text()).toBe('⚡')
  })

  it('应显示数值', () => {
    const wrapper = mount(StatCard, { props: defaultProps })
    expect(wrapper.find('.stat-value').text()).toBe('128')
  })

  it('应显示标签', () => {
    const wrapper = mount(StatCard, { props: defaultProps })
    expect(wrapper.find('.stat-label').text()).toBe('在线设备')
  })

  it('应支持字符串数值', () => {
    const wrapper = mount(StatCard, { props: { ...defaultProps, value: '1,234' } })
    expect(wrapper.find('.stat-value').text()).toBe('1,234')
  })
})
