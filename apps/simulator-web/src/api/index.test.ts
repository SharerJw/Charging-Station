import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./request', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}))

import { get, post, put, del } from './request'
import {
  deviceApi,
  chargingApi,
  scenarioApi,
  ocppApi,
  systemApi,
} from './index'

const mockGet = vi.mocked(get)
const mockPost = vi.mocked(post)
const mockPut = vi.mocked(put)
const mockDel = vi.mocked(del)

beforeEach(() => {
  vi.clearAllMocks()
})

// ── deviceApi ──────────────────────────────────────────────
describe('deviceApi', () => {
  it('list() returns data on success', async () => {
    const items = [{ id: '1' }, { id: '2' }]
    mockGet.mockResolvedValue(items as any)
    const result = await deviceApi.list()
    expect(result).toEqual(items)
    expect(mockGet).toHaveBeenCalledWith('/simulator/devices', undefined)
  })

  it('list() accepts params', async () => {
    mockGet.mockResolvedValue([] as any)
    await deviceApi.list({ page: 1, size: 10 })
    expect(mockGet).toHaveBeenCalledWith('/simulator/devices', { page: 1, size: 10 })
  })

  it('list() returns empty list', async () => {
    mockGet.mockResolvedValue([] as any)
    const result = await deviceApi.list()
    expect(result).toEqual([])
  })

  it('create() posts data to correct URL', async () => {
    const data = { name: 'Station-A', type: 'AC' }
    mockPost.mockResolvedValue({ id: '3' } as any)
    const result = await deviceApi.create(data)
    expect(result).toEqual({ id: '3' })
    expect(mockPost).toHaveBeenCalledWith('/simulator/devices', data)
  })

  it('update() sends PUT with id in URL', async () => {
    const data = { name: 'Updated' }
    mockPut.mockResolvedValue(undefined as any)
    await deviceApi.update('abc', data)
    expect(mockPut).toHaveBeenCalledWith('/simulator/devices/abc', data)
  })

  it('delete() sends DELETE with id in URL', async () => {
    mockDel.mockResolvedValue(undefined as any)
    await deviceApi.delete('xyz')
    expect(mockDel).toHaveBeenCalledWith('/simulator/devices/xyz')
  })

  it('reset() POSTs to id/reset URL', async () => {
    mockPost.mockResolvedValue(undefined as any)
    await deviceApi.reset('d1')
    expect(mockPost).toHaveBeenCalledWith('/simulator/devices/d1/reset')
  })
})

// ── chargingApi ────────────────────────────────────────────
describe('chargingApi', () => {
  it('start() POSTs to correct URL', async () => {
    const data = { deviceId: 'd1', connectorId: 1 }
    mockPost.mockResolvedValue({ txId: 't1' } as any)
    const result = await chargingApi.start(data)
    expect(result).toEqual({ txId: 't1' })
    expect(mockPost).toHaveBeenCalledWith('/simulator/charging/start', data)
  })

  it('start() passes data through', async () => {
    const data = { mode: 'fast' }
    mockPost.mockResolvedValue(null as any)
    await chargingApi.start(data)
    expect(mockPost).toHaveBeenCalledWith('/simulator/charging/start', data)
  })

  it('stop() POSTs to id/stop URL', async () => {
    mockPost.mockResolvedValue(undefined as any)
    await chargingApi.stop('tx99')
    expect(mockPost).toHaveBeenCalledWith('/simulator/charging/tx99/stop')
  })

  it('status() GETs id/status URL', async () => {
    const st = { charging: true }
    mockGet.mockResolvedValue(st as any)
    const result = await chargingApi.status('tx99')
    expect(result).toEqual(st)
    expect(mockGet).toHaveBeenCalledWith('/simulator/charging/tx99/status')
  })
})

// ── scenarioApi ────────────────────────────────────────────
describe('scenarioApi', () => {
  it('list() GETs correct URL', async () => {
    mockGet.mockResolvedValue([] as any)
    const result = await scenarioApi.list()
    expect(result).toEqual([])
    expect(mockGet).toHaveBeenCalledWith('/simulator/scenarios', undefined)
  })

  it('execute() POSTs to id/execute URL', async () => {
    mockPost.mockResolvedValue(undefined as any)
    await scenarioApi.execute('s1')
    expect(mockPost).toHaveBeenCalledWith('/simulator/scenarios/s1/execute')
  })

  it('stop() POSTs to id/stop URL', async () => {
    mockPost.mockResolvedValue(undefined as any)
    await scenarioApi.stop('s2')
    expect(mockPost).toHaveBeenCalledWith('/simulator/scenarios/s2/stop')
  })

  it('create() posts data to correct URL', async () => {
    const data = { name: 'Scenario-A' }
    mockPost.mockResolvedValue({ id: 's3' } as any)
    const result = await scenarioApi.create(data)
    expect(result).toEqual({ id: 's3' })
    expect(mockPost).toHaveBeenCalledWith('/simulator/scenarios', data)
  })

  it('delete() sends DELETE with id in URL', async () => {
    mockDel.mockResolvedValue(undefined as any)
    await scenarioApi.delete('s4')
    expect(mockDel).toHaveBeenCalledWith('/simulator/scenarios/s4')
  })
})

// ── ocppApi ────────────────────────────────────────────────
describe('ocppApi', () => {
  it('send() POSTs data to correct URL', async () => {
    const data = { action: 'Heartbeat' }
    mockPost.mockResolvedValue(undefined as any)
    await ocppApi.send(data)
    expect(mockPost).toHaveBeenCalledWith('/simulator/ocpp/send', data)
  })

  it('history() GETs correct URL', async () => {
    mockGet.mockResolvedValue([] as any)
    await ocppApi.history({ limit: 50 })
    expect(mockGet).toHaveBeenCalledWith('/simulator/ocpp/history', { limit: 50 })
  })
})

// ── systemApi ──────────────────────────────────────────────
describe('systemApi', () => {
  it('stats() GETs /simulator/stats', async () => {
    mockGet.mockResolvedValue({ total: 10 } as any)
    const result = await systemApi.stats()
    expect(result).toEqual({ total: 10 })
    expect(mockGet).toHaveBeenCalledWith('/simulator/stats')
  })

  it('health() GETs /simulator/health', async () => {
    mockGet.mockResolvedValue({ ok: true } as any)
    const result = await systemApi.health()
    expect(result).toEqual({ ok: true })
    expect(mockGet).toHaveBeenCalledWith('/simulator/health')
  })
})
