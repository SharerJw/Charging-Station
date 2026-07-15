import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EventStream from './EventStream.vue'

interface OcppMessage {
  messageId: string
  action: string
  type: 'Call' | 'CallResult' | 'CallError'
  payload: Record<string, any>
  timestamp: string
  direction: 'inbound' | 'outbound'
  chargePointId: string
}

const mockEvents: OcppMessage[] = [
  { messageId: 'MSG-001', action: 'Heartbeat', type: 'CallResult', payload: {}, timestamp: '2026-07-13T10:30:00Z', direction: 'inbound', chargePointId: 'EVSE-001' },
  { messageId: 'MSG-002', action: 'MeterValues', type: 'Call', payload: { value: 45.2 }, timestamp: '2026-07-13T10:30:05Z', direction: 'outbound', chargePointId: 'EVSE-002' },
  { messageId: 'MSG-003', action: 'StatusNotification', type: 'Call', payload: { status: 'Charging' }, timestamp: '2026-07-13T10:30:10Z', direction: 'inbound', chargePointId: 'EVSE-001' },
]

describe('EventStream', () => {
  it('应渲染事件列表', () => {
    const wrapper = mount(EventStream, { props: { events: mockEvents } })
    expect(wrapper.find('.events-list').exists()).toBe(true)
  })

  it('应显示所有事件项', () => {
    const wrapper = mount(EventStream, { props: { events: mockEvents } })
    expect(wrapper.findAll('.event-item')).toHaveLength(3)
  })

  it('应显示事件来源', () => {
    const wrapper = mount(EventStream, { props: { events: mockEvents } })
    expect(wrapper.text()).toContain('EVSE-001')
    expect(wrapper.text()).toContain('EVSE-002')
  })

  it('应显示事件动作', () => {
    const wrapper = mount(EventStream, { props: { events: mockEvents } })
    expect(wrapper.text()).toContain('Heartbeat')
    expect(wrapper.text()).toContain('MeterValues')
  })

  it('入站方向应有 inbound 类', () => {
    const wrapper = mount(EventStream, { props: { events: mockEvents } })
    const dirs = wrapper.findAll('.event-dir.inbound')
    expect(dirs.length).toBeGreaterThan(0)
  })

  it('出站方向应有 outbound 类', () => {
    const wrapper = mount(EventStream, { props: { events: mockEvents } })
    const dirs = wrapper.findAll('.event-dir.outbound')
    expect(dirs.length).toBeGreaterThan(0)
  })

  it('空事件列表应不显示任何项', () => {
    const wrapper = mount(EventStream, { props: { events: [] } })
    expect(wrapper.findAll('.event-item')).toHaveLength(0)
  })
})
