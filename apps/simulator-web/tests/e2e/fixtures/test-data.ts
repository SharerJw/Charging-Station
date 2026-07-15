export const testData = {
  device: {
    name: '测试充电桩-自动',
    ocppId: 'EVSE-AUTO-001',
    model: 'DC-120kW',
    power: 120,
  },
  scenario: {
    name: '自动测试场景',
    description: '自动化测试创建的场景',
    steps: [
      { action: 'startCharging', duration: 60 },
      { action: 'stopCharging', duration: 0 },
    ],
  },
  thresholds: {
    loadTime: 3000,
    chartRender: 2000,
    apiResponse: 1000,
    memoryLimit: 100 * 1024 * 1024,
    ghostDataRefreshCount: 5,
    screenshotDiff: 1000,
  },
  urls: {
    dashboard: '/dashboard',
    charging: '/charging',
    device: '/device',
    scenario: '/scenario',
    logs: '/logs',
  },
  colors: {
    background: 'rgb(11, 17, 32)',
    card: 'rgb(17, 24, 39)',
    accent: 'rgb(59, 130, 246)',
    success: 'rgb(34, 197, 94)',
    warning: 'rgb(234, 179, 8)',
    error: 'rgb(239, 68, 68)',
  },
}
