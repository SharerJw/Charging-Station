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
    dailyTrend: 12.5,
    weeklyTrend: 8.3,
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

  it('应显示日环比趋势', () => {
    const wrapper = mount(KpiCard, { props: defaultProps })
    const trends = wrapper.findAll('.trend-item')
    expect(trends[0].text()).toContain('+12.5%')
    expect(trends[0].text()).toContain('日环比')
  })

  it('应显示周同比趋势', () => {
    const wrapper = mount(KpiCard, { props: defaultProps })
    const trends = wrapper.findAll('.trend-item')
    expect(trends[1].text()).toContain('+8.3%')
    expect(trends[1].text()).toContain('周同比')
  })

  it('正趋势应显示绿色', () => {
    const wrapper = mount(KpiCard, { props: defaultProps })
    const trend = wrapper.find('.trend-item')
    expect(trend.attributes('style')).toContain('color: rgb(82, 196, 26)')
  })

  it('负趋势应显示红色', () => {
    const wrapper = mount(KpiCard, {
      props: { ...defaultProps, dailyTrend: -5.2 },
    })
    const trend = wrapper.find('.trend-item')
    expect(trend.attributes('style')).toContain('color: rgb(255, 77, 79)')
  })

  it('loading 状态应显示省略号', () => {
    const wrapper = mount(KpiCard, {
      props: { ...defaultProps, loading: true, value: '' },
    })
    expect(wrapper.find('.kpi-value').text()).toContain('...')
  })

  it('应应用自定义颜色', () => {
    const wrapper = mount(KpiCard, { props: defaultProps })
    const icon = wrapper.find('.kpi-icon')
    expect(icon.attributes('style')).toContain('rgb(22, 119, 255)')
  })
})
