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

  it('正趋势应显示绿色和上箭头', () => {
    const wrapper = mount(KpiCard, { props: defaultProps })
    const trend = wrapper.find('.trend-item')
    expect(trend.attributes('style')).toContain('color: rgb(82, 196, 26)')
    expect(trend.text()).toContain('↑')
  })

  it('负趋势应显示红色和下箭头', () => {
    const wrapper = mount(KpiCard, {
      props: { ...defaultProps, dailyTrend: -5.2, weeklyTrend: -3.1 },
    })
    const trends = wrapper.findAll('.trend-item')
    expect(trends[0].attributes('style')).toContain('color: rgb(255, 77, 79)')
    expect(trends[0].text()).toContain('↓')
    expect(trends[0].text()).toContain('-5.2%')
    expect(trends[1].text()).toContain('↓')
    expect(trends[1].text()).toContain('-3.1%')
  })

  it('零趋势应显示灰色和右箭头', () => {
    const wrapper = mount(KpiCard, {
      props: { ...defaultProps, dailyTrend: 0, weeklyTrend: 0 },
    })
    const trends = wrapper.findAll('.trend-item')
    expect(trends[0].attributes('style')).toContain('color: rgb(153, 153, 153)')
    expect(trends[0].text()).toContain('→')
    expect(trends[0].text()).toContain('0%')
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

  it('未提供 trend 时应默认为 0', () => {
    const wrapper = mount(KpiCard, {
      props: { ...defaultProps, dailyTrend: undefined, weeklyTrend: undefined },
    })
    const trends = wrapper.findAll('.trend-item')
    expect(trends[0].text()).toContain('0%')
    expect(trends[1].text()).toContain('0%')
  })
})
