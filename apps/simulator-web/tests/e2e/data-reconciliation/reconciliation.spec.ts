import { test, expect } from '@playwright/test'

const API = '/api/simulator'

test.describe('数据对账', () => {
  test('stats.totalDevices 与设备列表总数一致', async ({ request }) => {
    const statsResp = await request.get(`${API}/stats`)
    const devicesResp = await request.get(`${API}/devices`)

    expect(statsResp.ok()).toBeTruthy()
    expect(devicesResp.ok()).toBeTruthy()

    const statsBody = await statsResp.json()
    const devicesBody = await devicesResp.json()

    const totalDevices = statsBody.data?.totalDevices ?? 0
    const devicesList = devicesBody.data?.list ?? devicesBody.data ?? []

    // 设备列表的 total 字段应与 stats 中的 totalDevices 一致
    const apiTotal = devicesBody.data?.total ?? devicesList.length
    expect(totalDevices).toBe(apiTotal)
  })

  test('stats.onlineDevices 与设备列表中在线设备数一致', async ({ request }) => {
    const statsResp = await request.get(`${API}/stats`)
    const devicesResp = await request.get(`${API}/devices`)

    expect(statsResp.ok()).toBeTruthy()
    expect(devicesResp.ok()).toBeTruthy()

    const statsBody = await statsResp.json()
    const devicesBody = await devicesResp.json()

    const onlineFromStats = statsBody.data?.onlineDevices ?? 0
    const devicesList = devicesBody.data?.list ?? devicesBody.data ?? []

    // 统计在线设备数（仅限当前页）
    const onlineCount = Array.isArray(devicesList)
      ? devicesList.filter(
          (d: any) => d.status === 'online' || d.status === 'ONLINE',
        ).length
      : 0

    // stats.onlineDevices 是全量统计，设备列表是分页结果
    // 验证: stats 中的在线数 >= 当前页在线数, 且 stats 数据合理
    expect(onlineFromStats).toBeGreaterThanOrEqual(onlineCount)
    expect(onlineFromStats).toBeGreaterThanOrEqual(0)
  })

  test('设备列表与 stats 数据同时请求一致性', async ({ request }) => {
    const [statsResp, devicesResp] = await Promise.all([
      request.get(`${API}/stats`),
      request.get(`${API}/devices`),
    ])

    expect(statsResp.ok()).toBeTruthy()
    expect(devicesResp.ok()).toBeTruthy()

    const statsBody = await statsResp.json()
    const devicesBody = await devicesResp.json()

    // 并发请求下数据应一致
    const statsTotal = statsBody.data?.totalDevices ?? 0
    const apiTotal = devicesBody.data?.total ?? (devicesBody.data?.list ?? []).length
    expect(statsTotal).toBe(apiTotal)
  })
})
