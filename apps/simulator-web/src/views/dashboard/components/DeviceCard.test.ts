import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DeviceCard from './DeviceCard.vue'
import type { Device } from '@/store/simulator'

const mockDevice: Device = {
  id: 'CP001',
  name: '充电桩-001',
  ocppId: 'EVSE-001',
  model: 'DC-120kW',
  status: 'charging',
  power: 45.2,
  voltage: 400,
  current: 113,
  soc: 65,
  temperature: 38,
  lastHeartbeat: '2026-07-13T10:30:00Z',
}

describe('DeviceCard', () => {
  it('应渲染设备卡片', () => {
    const wrapper = mount(DeviceCard, { props: { device: mockDevice } })
    expect(wrapper.find('.device-card').exists()).toBe(true)
  })

  it('应显示设备名称', () => {
    const wrapper = mount(DeviceCard, { props: { device: mockDevice } })
    expect(wrapper.find('.device-name').text()).toBe('充电桩-001')
  })

  it('应显示设备型号', () => {
    const wrapper = mount(DeviceCard, { props: { device: mockDevice } })
    expect(wrapper.find('.device-model').text()).toBe('DC-120kW')
  })

  it('应显示充电中状态', () => {
    const wrapper = mount(DeviceCard, { props: { device: mockDevice } })
    expect(wrapper.find('.status-badge').text()).toBe('充电中')
    expect(wrapper.find('.status-badge').classes()).toContain('charging')
  })

  it('应显示在线状态', () => {
    const onlineDevice = { ...mockDevice, status: 'online' as const }
    const wrapper = mount(DeviceCard, { props: { device: onlineDevice } })
    expect(wrapper.find('.status-badge').text()).toBe('在线')
    expect(wrapper.find('.status-badge').classes()).toContain('online')
  })

  it('应显示功率数值', () => {
    const wrapper = mount(DeviceCard, { props: { device: mockDevice } })
    expect(wrapper.text()).toContain('45.2')
  })

  it('应显示SOC数值', () => {
    const wrapper = mount(DeviceCard, { props: { device: mockDevice } })
    expect(wrapper.text()).toContain('65')
  })

  it('选中时应有selected类', () => {
    const wrapper = mount(DeviceCard, { props: { device: mockDevice, selected: true } })
    expect(wrapper.find('.device-card').classes()).toContain('selected')
  })

  it('未选中时不应有selected类', () => {
    const wrapper = mount(DeviceCard, { props: { device: mockDevice, selected: false } })
    expect(wrapper.find('.device-card').classes()).not.toContain('selected')
  })
})
