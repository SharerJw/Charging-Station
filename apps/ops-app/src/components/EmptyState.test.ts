import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from './EmptyState.vue'

describe('EmptyState', () => {
  it('应显示默认图标和标题', () => {
    const wrapper = mount(EmptyState, {})
    expect(wrapper.find('.empty-icon').text()).toBe('📭')
    expect(wrapper.find('.empty-title').text()).toBe('暂无数据')
  })

  it('应显示自定义图标', () => {
    const wrapper = mount(EmptyState, { props: { icon: '🏭' } })
    expect(wrapper.find('.empty-icon').text()).toBe('🏭')
  })

  it('应显示自定义标题', () => {
    const wrapper = mount(EmptyState, { props: { title: '暂无告警' } })
    expect(wrapper.find('.empty-title').text()).toBe('暂无告警')
  })

  it('应显示描述文字（当提供时）', () => {
    const wrapper = mount(EmptyState, {
      props: { description: '请稍后再来查看' },
    })
    expect(wrapper.find('.empty-desc').text()).toBe('请稍后再来查看')
  })

  it('未提供描述时不应渲染描述元素', () => {
    const wrapper = mount(EmptyState, {})
    expect(wrapper.find('.empty-desc').exists()).toBe(false)
  })

  it('应包含正确的 CSS class', () => {
    const wrapper = mount(EmptyState, {})
    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.find('.empty-icon').exists()).toBe(true)
    expect(wrapper.find('.empty-title').exists()).toBe(true)
  })
})
