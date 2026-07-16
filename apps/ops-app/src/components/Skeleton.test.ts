import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Skeleton from './Skeleton.vue'

describe('Skeleton', () => {
  it('应渲染骨架屏基础结构', () => {
    const wrapper = mount(Skeleton)
    expect(wrapper.find('.skeleton-wrapper').exists()).toBe(true)
    expect(wrapper.find('.skeleton-title').exists()).toBe(true)
  })

  it('默认应渲染3行骨架', () => {
    const wrapper = mount(Skeleton)
    const rows = wrapper.findAll('.skeleton-row')
    expect(rows).toHaveLength(3)
  })

  it('自定义 rows 应渲染指定行数', () => {
    const wrapper = mount(Skeleton, { props: { rows: 5 } })
    const rows = wrapper.findAll('.skeleton-row')
    expect(rows).toHaveLength(5)
  })

  it('avatar=false 时不应渲染头像', () => {
    const wrapper = mount(Skeleton, { props: { avatar: false } })
    expect(wrapper.find('.skeleton-avatar').exists()).toBe(false)
  })

  it('avatar=true 时应渲染头像', () => {
    const wrapper = mount(Skeleton, { props: { avatar: true } })
    expect(wrapper.find('.skeleton-avatar').exists()).toBe(true)
  })

  it('最后一行宽度应为60%', () => {
    const wrapper = mount(Skeleton, { props: { rows: 3 } })
    const rows = wrapper.findAll('.skeleton-row')
    const lastRow = rows[rows.length - 1]
    expect(lastRow.attributes('style')).toContain('60%')
  })

  it('非最后一行宽度应为100%', () => {
    const wrapper = mount(Skeleton, { props: { rows: 3 } })
    const rows = wrapper.findAll('.skeleton-row')
    expect(rows[0].attributes('style')).toContain('100%')
  })
})
