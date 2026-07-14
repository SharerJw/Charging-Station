import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MetricCard from './MetricCard.vue'

const defaultProps = {
  icon: '⚡',
  value: 45.2,
  unit: 'kW',
  label: '实时功率',
}

describe('MetricCard', () => {
  it('应渲染指标卡片', () => {
    const wrapper = mount(MetricCard, { props: defaultProps })
    expect(wrapper.find('.metric-card').exists()).toBe(true)
  })

  it('应显示图标', () => {
    const wrapper = mount(MetricCard, { props: defaultProps })
    expect(wrapper.find('.metric-icon').text()).toBe('⚡')
  })

  it('应显示数值', () => {
    const wrapper = mount(MetricCard, { props: defaultProps })
    expect(wrapper.find('.metric-value').text()).toBe('45.2')
  })

  it('应显示单位', () => {
    const wrapper = mount(MetricCard, { props: defaultProps })
    expect(wrapper.find('.metric-unit').text()).toBe('kW')
  })

  it('应显示标签', () => {
    const wrapper = mount(MetricCard, { props: defaultProps })
    expect(wrapper.find('.metric-label').text()).toBe('实时功率')
  })

  it('应支持字符串数值', () => {
    const wrapper = mount(MetricCard, { props: { ...defaultProps, value: '01:23:45' } })
    expect(wrapper.find('.metric-value').text()).toBe('01:23:45')
  })
})
