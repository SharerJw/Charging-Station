import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import KpiCard from './KpiCard.vue'

describe('KpiCard', () => {
  const defaultProps = {
    title: '今日充电量',
    value: '1,234',
    unit: 'kWh',
    icon: '⚡',
    color: '#1677FF',
    loading: false,
  }

  it('应正确渲染标题', () => {
    const wrapper = mount(KpiCard, { props: defaultProps })
    expect(wrapper.find('.kpi-title').text()).toBe('今日充电量')
  })

  it('应正确渲染值和单位', () => {
    const wrapper = mount(KpiCard, { props: defaultProps })
    expect(wrapper.find('.kpi-value').text()).toContain('1,234')
    expect(wrapper.find('.kpi-unit').text()).toBe('kWh')
  })

  it('应正确渲染图标', () => {
    const wrapper = mount(KpiCard, { props: defaultProps })
    expect(wrapper.find('.kpi-icon').text()).toBe('⚡')
  })

  it('loading 状态应显示省略号', () => {
    const wrapper = mount(KpiCard, {
      props: { ...defaultProps, loading: true, value: '' },
    })
    expect(wrapper.find('.kpi-value').text()).toContain('...')
  })

  it('空值应显示占位符', () => {
    const wrapper = mount(KpiCard, {
      props: { ...defaultProps, value: '' },
    })
    expect(wrapper.find('.kpi-value').text()).toContain('--')
  })

  it('零值应正常显示', () => {
    const wrapper = mount(KpiCard, {
      props: { ...defaultProps, value: '0' },
    })
    expect(wrapper.find('.kpi-value').text()).toContain('0')
  })

  it('应应用自定义颜色', () => {
    const wrapper = mount(KpiCard, { props: defaultProps })
    const icon = wrapper.find('.kpi-icon')
    expect(icon.attributes('style')).toContain('rgb(22, 119, 255)')
  })

  it('loading 状态应添加 is-loading 类', () => {
    const wrapper = mount(KpiCard, {
      props: { ...defaultProps, loading: true },
    })
    expect(wrapper.find('.kpi-card').classes()).toContain('is-loading')
  })
})
