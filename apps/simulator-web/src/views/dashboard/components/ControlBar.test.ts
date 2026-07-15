import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ControlBar from './ControlBar.vue'
import type { Device } from '@/store/simulator'

const mockDevices: Device[] = [
  { id: 'CP001', name: '充电桩-001', ocppId: 'EVSE-001', model: 'AC-7kW', status: 'online', power: 0, voltage: 220, current: 0, soc: 0, temperature: 25, lastHeartbeat: new Date().toISOString() },
  { id: 'CP002', name: '充电桩-002', ocppId: 'EVSE-002', model: 'DC-60kW', status: 'charging', power: 45.2, voltage: 400, current: 113, soc: 65, temperature: 38, lastHeartbeat: new Date().toISOString() },
]

const defaultProps = {
  devices: mockDevices,
  selectedDevice: 'CP001',
  refreshInterval: 3000,
  isPaused: false,
}

describe('ControlBar', () => {
  it('应渲染控制栏容器', () => {
    const wrapper = mount(ControlBar, { props: defaultProps })
    expect(wrapper.find('.control-bar').exists()).toBe(true)
  })

  it('应显示 LIVE 指示器', () => {
    const wrapper = mount(ControlBar, { props: defaultProps })
    const indicator = wrapper.find('.live-indicator')
    expect(indicator.exists()).toBe(true)
    expect(indicator.text()).toContain('LIVE')
  })

  it('运行中时 LIVE 指示器不应有 paused 类', () => {
    const wrapper = mount(ControlBar, { props: { ...defaultProps, isPaused: false } })
    expect(wrapper.find('.live-indicator').classes()).not.toContain('paused')
  })

  it('暂停时 LIVE 指示器应有 paused 类', () => {
    const wrapper = mount(ControlBar, { props: { ...defaultProps, isPaused: true } })
    expect(wrapper.find('.live-indicator').classes()).toContain('paused')
  })

  it('应包含控制栏左右两个区域', () => {
    const wrapper = mount(ControlBar, { props: defaultProps })
    expect(wrapper.find('.control-left').exists()).toBe(true)
    expect(wrapper.find('.control-right').exists()).toBe(true)
  })

  it('应包含设备标签', () => {
    const wrapper = mount(ControlBar, { props: defaultProps })
    expect(wrapper.text()).toContain('设备')
  })

  it('应包含刷新标签', () => {
    const wrapper = mount(ControlBar, { props: defaultProps })
    expect(wrapper.text()).toContain('刷新')
  })

  it('应显示暂停按钮', () => {
    const wrapper = mount(ControlBar, { props: defaultProps })
    expect(wrapper.text()).toContain('暂停')
  })

  it('暂停状态应显示继续按钮', () => {
    const wrapper = mount(ControlBar, { props: { ...defaultProps, isPaused: true } })
    expect(wrapper.text()).toContain('继续')
  })

  it('应显示刷新间隔选项', () => {
    const wrapper = mount(ControlBar, { props: defaultProps })
    expect(wrapper.text()).toContain('1s')
    expect(wrapper.text()).toContain('3s')
    expect(wrapper.text()).toContain('5s')
    expect(wrapper.text()).toContain('10s')
  })
})
