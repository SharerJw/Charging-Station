import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SocRing from './SocRing.vue'

describe('SocRing', () => {
  it('应渲染 SOC 环形图', () => {
    const wrapper = mount(SocRing, { props: { value: 65 } })
    expect(wrapper.find('.soc-ring-wrapper').exists()).toBe(true)
  })

  it('应显示 SOC 数值', () => {
    const wrapper = mount(SocRing, { props: { value: 65 } })
    expect(wrapper.find('.soc-value').text()).toBe('65%')
  })

  it('应显示 SOC 标签', () => {
    const wrapper = mount(SocRing, { props: { value: 65 } })
    expect(wrapper.find('.soc-label').text()).toBe('SOC')
  })

  it('0% 应显示 0', () => {
    const wrapper = mount(SocRing, { props: { value: 0 } })
    expect(wrapper.find('.soc-value').text()).toBe('0%')
  })

  it('100% 应显示 100', () => {
    const wrapper = mount(SocRing, { props: { value: 100 } })
    expect(wrapper.find('.soc-value').text()).toBe('100%')
  })

  it('应包含 SVG 环形', () => {
    const wrapper = mount(SocRing, { props: { value: 50 } })
    expect(wrapper.find('svg.soc-ring').exists()).toBe(true)
  })
})
