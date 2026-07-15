import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MessageLine from './MessageLine.vue'

const mockMessage = {
  messageId: 'MSG-001',
  action: 'Heartbeat',
  type: 'CallResult',
  payload: {},
  timestamp: '2026-07-13T10:30:00.123Z',
  direction: 'inbound' as const,
  chargePointId: 'EVSE-001',
}

describe('MessageLine', () => {
  it('应渲染消息行', () => {
    const wrapper = mount(MessageLine, { props: { message: mockMessage } })
    expect(wrapper.find('.log-line').exists()).toBe(true)
  })

  it('应显示来源', () => {
    const wrapper = mount(MessageLine, { props: { message: mockMessage } })
    expect(wrapper.find('.log-source').text()).toBe('EVSE-001')
  })

  it('应显示动作名', () => {
    const wrapper = mount(MessageLine, { props: { message: mockMessage } })
    expect(wrapper.find('.log-action').text()).toBe('Heartbeat')
  })

  it('入站应显示 ←', () => {
    const wrapper = mount(MessageLine, { props: { message: mockMessage } })
    expect(wrapper.find('.log-direction').text()).toBe('←')
    expect(wrapper.find('.log-direction').classes()).toContain('inbound')
  })

  it('出站应显示 →', () => {
    const outMsg = { ...mockMessage, direction: 'outbound' as const }
    const wrapper = mount(MessageLine, { props: { message: outMsg } })
    expect(wrapper.find('.log-direction').text()).toBe('→')
    expect(wrapper.find('.log-direction').classes()).toContain('outbound')
  })

  it('Call 类型应有对应样式', () => {
    const callMsg = { ...mockMessage, type: 'Call' }
    const wrapper = mount(MessageLine, { props: { message: callMsg } })
    expect(wrapper.find('.log-type').classes()).toContain('Call')
  })

  it('CallResult 类型应有对应样式', () => {
    const wrapper = mount(MessageLine, { props: { message: mockMessage } })
    expect(wrapper.find('.log-type').classes()).toContain('CallResult')
  })

  it('空 payload 应显示 {}', () => {
    const wrapper = mount(MessageLine, { props: { message: mockMessage } })
    expect(wrapper.find('.log-payload').text()).toBe('{}')
  })

  it('有 payload 应显示 JSON', () => {
    const msgWithPayload = { ...mockMessage, payload: { value: 45.2 } }
    const wrapper = mount(MessageLine, { props: { message: msgWithPayload } })
    expect(wrapper.find('.log-payload').text()).toContain('45.2')
  })
})
