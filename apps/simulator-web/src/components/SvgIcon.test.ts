import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SvgIcon from './SvgIcon.vue'

describe('SvgIcon', () => {
  it('应渲染指定 name 的 SVG path', () => {
    const wrapper = mount(SvgIcon, { props: { name: 'station' } })
    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.findAll('path').length).toBeGreaterThanOrEqual(1)
  })

  it('默认 size 为 20', () => {
    const wrapper = mount(SvgIcon, { props: { name: 'lightning' } })
    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('20')
    expect(svg.attributes('height')).toBe('20')
  })

  it('size 属性设置 width/height', () => {
    const wrapper = mount(SvgIcon, { props: { name: 'battery', size: 32 } })
    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('32')
    expect(svg.attributes('height')).toBe('32')
  })

  it('无 color 时 fill 为 currentColor', () => {
    const wrapper = mount(SvgIcon, { props: { name: 'device' } })
    const path = wrapper.find('path')
    expect(path.attributes('fill')).toBe('currentColor')
  })

  it('color 属性设置 fill', () => {
    const wrapper = mount(SvgIcon, { props: { name: 'connection', color: '#FF0000' } })
    const path = wrapper.find('path')
    expect(path.attributes('fill')).toBe('#FF0000')
  })

  it('未知 name 渲染默认图标', () => {
    const wrapper = mount(SvgIcon, { props: { name: 'unknown-icon' } })
    const svg = wrapper.find('svg')
    const paths = svg.findAll('path')
    expect(paths.length).toBeGreaterThanOrEqual(1)
  })

  it('多个图标名称均可渲染不报错', () => {
    const iconNames = [
      'station', 'lightning', 'battery', 'online', 'device',
      'document', 'dashboard', 'settings', 'search', 'chart',
      'play', 'pause', 'stop', 'refresh', 'wifi',
    ]
    iconNames.forEach((name) => {
      const wrapper = mount(SvgIcon, { props: { name } })
      expect(wrapper.find('svg').exists()).toBe(true)
      expect(wrapper.find('path').exists()).toBe(true)
    })
  })

  it('应包含 .svg-icon class', () => {
    const wrapper = mount(SvgIcon, { props: { name: 'station' } })
    const svg = wrapper.find('svg')
    expect(svg.classes()).toContain('svg-icon')
  })
})
