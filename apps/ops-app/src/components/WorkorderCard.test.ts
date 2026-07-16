import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WorkorderCard from './WorkorderCard.vue'

describe('WorkorderCard', () => {
  const defaultProps = {
    orderNo: 'WO-20260716-001',
    type: 'repair',
    title: '充电桩无法启动',
    station: '朝阳充电站',
    priority: 'high',
    status: 'pending',
  }

  it('应正确渲染工单编号', () => {
    const wrapper = mount(WorkorderCard, { props: defaultProps })
    expect(wrapper.find('.workorder-no').text()).toBe('WO-20260716-001')
  })

  it('应正确渲染工单标题', () => {
    const wrapper = mount(WorkorderCard, { props: defaultProps })
    expect(wrapper.find('.workorder-title').text()).toBe('充电桩无法启动')
  })

  it('应正确渲染站点名称', () => {
    const wrapper = mount(WorkorderCard, { props: defaultProps })
    expect(wrapper.find('.meta-item').text()).toContain('朝阳充电站')
  })

  it('维修类型应显示"维修"标签', () => {
    const wrapper = mount(WorkorderCard, { props: { ...defaultProps, type: 'repair' } })
    expect(wrapper.find('.type-tag').text()).toBe('维修')
    expect(wrapper.find('.type-tag').classes()).toContain('repair')
  })

  it('保养类型应显示"保养"标签', () => {
    const wrapper = mount(WorkorderCard, { props: { ...defaultProps, type: 'maintenance' } })
    expect(wrapper.find('.type-tag').text()).toBe('保养')
    expect(wrapper.find('.type-tag').classes()).toContain('maintenance')
  })

  it('高优先级应包含 high class', () => {
    const wrapper = mount(WorkorderCard, { props: { ...defaultProps, priority: 'high' } })
    expect(wrapper.find('.workorder-priority').classes()).toContain('high')
    expect(wrapper.find('.workorder-priority').text()).toBe('高')
  })

  it('中优先级应包含 medium class', () => {
    const wrapper = mount(WorkorderCard, { props: { ...defaultProps, priority: 'medium' } })
    expect(wrapper.find('.workorder-priority').classes()).toContain('medium')
    expect(wrapper.find('.workorder-priority').text()).toBe('中')
  })

  it('低优先级应包含 low class', () => {
    const wrapper = mount(WorkorderCard, { props: { ...defaultProps, priority: 'low' } })
    expect(wrapper.find('.workorder-priority').classes()).toContain('low')
    expect(wrapper.find('.workorder-priority').text()).toBe('低')
  })

  it('pending 状态应显示"待处理"', () => {
    const wrapper = mount(WorkorderCard, { props: { ...defaultProps, status: 'pending' } })
    expect(wrapper.find('.workorder-status').text()).toBe('待处理')
  })

  it('accepted 状态应显示"已接单"', () => {
    const wrapper = mount(WorkorderCard, { props: { ...defaultProps, status: 'accepted' } })
    expect(wrapper.find('.workorder-status').text()).toBe('已接单')
  })

  it('completed 状态应显示"已完成"', () => {
    const wrapper = mount(WorkorderCard, { props: { ...defaultProps, status: 'completed' } })
    expect(wrapper.find('.workorder-status').text()).toBe('已完成')
  })
})
