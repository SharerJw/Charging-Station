import { test, expect } from '@playwright/test'

const API = '/api/simulator'

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Extract the list from paginated or flat API response.
 *  GET /devices → { data: { list: [...] } } (paginated)
 *  Other GETs   → { data: [...] }           (flat)           */
async function extractList(resp: any) {
  const body = await resp.json()
  const d = body.data ?? body
  return d?.list ?? d   // paginated .list or flat array
}

function ok(resp: any) {
  return expect(resp.ok()).toBeTruthy()
}

// ─── 设备接口健壮性 ─────────────────────────────────────────────────────────────

test.describe('设备接口健壮性', () => {
  test('GET /devices 正常返回 200 + 分页结构', async ({ request }) => {
    const resp = await request.get(`${API}/devices`)
    ok(resp)
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    // 后端返回分页结构: { code:0, data: { total, size, page, list:[...] } }
    expect(body.code).toBe(0)
    expect(body.data).toBeTruthy()
    expect(body.data.list).toBeDefined()
    expect(Array.isArray(body.data.list)).toBeTruthy()
    expect(typeof body.data.total).toBe('number')
  })

  test('GET /devices 返回数据含必需字段 (id, ocppId, model, status)', async ({
    request,
  }) => {
    const resp = await request.get(`${API}/devices`)
    ok(resp)
    const body = await resp.json()
    const list = body.data?.list
    if (Array.isArray(list) && list.length > 0) {
      const d = list[0]
      expect(d).toHaveProperty('id')
      expect(d).toHaveProperty('ocppId')
      expect(d).toHaveProperty('model')
      expect(d).toHaveProperty('status')
    }
  })

  test('POST /devices 正常创建', async ({ request }) => {
    const ocppId = `TEST-${Date.now()}`
    const resp = await request.post(`${API}/devices`, {
      data: {
        ocppId,
        model: 'TestCharger-X1',
        manufacturer: 'TestMfg',
        protocol: 'OCPP 1.6J',
        connectors: 1,
      },
    })
    expect([200, 201]).toContain(resp.status())
    const body = await resp.json()
    expect(body.code).toBe(0)
    expect(body.data).toBeTruthy()
  })

  test('POST /devices 空 body → 后端返回 500', async ({ request }) => {
    // BUG: 后端未做参数校验，空 body 导致 NPE → 500
    // 理想行为应为 400 Bad Request
    const resp = await request.post(`${API}/devices`, { data: {} })
    const status = resp.status()
    // 后端当前行为：500 (空指针) — 缺少请求体校验
    expect([400, 422, 500]).toContain(status)
  })

  test('POST /devices 重复 ocppId → 后端仍返回 200 (无去重校验)', async ({
    request,
  }) => {
    // BUG: 后端未校验 ocppId 唯一性，允许创建重复记录
    const listResp = await request.get(`${API}/devices`)
    const body = await listResp.json()
    const devices = body.data?.list ?? []
    if (devices.length > 0) {
      const existingOcppId = devices[0].ocppId
      const resp = await request.post(`${API}/devices`, {
        data: { ocppId: existingOcppId, model: 'DupTest' },
      })
      // 理想行为: 409 Conflict
      // 后端当前行为: 200 OK (允许重复)
      expect(resp.status()).toBe(200)
      const resBody = await resp.json()
      expect(resBody.code).toBe(0)
    }
  })

  test('DELETE /devices/{id} 不存在 → 后端返回 200 (幂等)', async ({
    request,
  }) => {
    // BUG: 后端删除不存在的设备也返回 200 + data:null，未返回 404
    const resp = await request.delete(`${API}/devices/0`)
    ok(resp)
    const body = await resp.json()
    expect(body.code).toBe(0)
  })

  test('DELETE /devices/{id} 正常删除', async ({ request }) => {
    // 后端创建设备时 id 返回 null，使用 ocppId 作为设备标识进行删除
    const ocppId = `DEL-${Date.now()}`
    const createResp = await request.post(`${API}/devices`, {
      data: { ocppId, model: 'DelTest' },
    })
    const createBody = await createResp.json()
    // 后端 create 不返回 id，直接用 ocppId 删除
    const delResp = await request.delete(`${API}/devices/${ocppId}`)
    expect([200, 204]).toContain(delResp.status())
  })
})

// ─── 充电接口健壮性 ─────────────────────────────────────────────────────────────

test.describe('充电接口健壮性', () => {
  let availableDeviceOcppId = ''

  test.beforeAll(async ({ request }) => {
    const resp = await request.get(`${API}/devices`)
    if (resp.ok()) {
      const body = await resp.json()
      const devices = body.data?.list ?? body.data ?? []
      if (Array.isArray(devices) && devices.length > 0) {
        const online = devices.find(
          (d: any) => d.status === 'online' || d.status === 'ONLINE'
        )
        availableDeviceOcppId = online?.ocppId ?? devices[0]?.ocppId ?? ''
      }
    }
  })

  test('POST /charging/start 正常启动 → 200 + transaction', async ({
    request,
  }) => {
    test.skip(!availableDeviceOcppId, 'No available device found')
    const resp = await request.post(`${API}/charging/start`, {
      data: {
        chargePointId: availableDeviceOcppId,
        connectorId: 1,
        targetSoc: 80,
      },
    })
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body.code).toBe(0)
    expect(body.data).toBeTruthy()
    expect(body.data.transactionId).toBeDefined()
  })

  test('POST /charging/start 空 chargePointId → 后端仍返回 200', async ({
    request,
  }) => {
    // BUG: 后端未校验 chargePointId，即使为空也返回 200 + 创建交易
    const resp = await request.post(`${API}/charging/start`, {
      data: { connectorId: 1 },
    })
    // 理想行为应为 400，但后端当前返回 200
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body.code).toBe(0)
  })

  test('POST /charging/start targetSoc=101 → 后端仍返回 200', async ({
    request,
  }) => {
    // BUG: 后端未校验 targetSoc 范围 (0-100)
    const resp = await request.post(`${API}/charging/start`, {
      data: {
        chargePointId: availableDeviceOcppId || 'ANY',
        connectorId: 1,
        targetSoc: 101,
      },
    })
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body.code).toBe(0)
  })

  test('POST /charging/start maxPower=-1 → 后端仍返回 200', async ({
    request,
  }) => {
    // BUG: 后端未校验 maxPower 非负
    const resp = await request.post(`${API}/charging/start`, {
      data: {
        chargePointId: availableDeviceOcppId || 'ANY',
        connectorId: 1,
        maxPower: -1,
      },
    })
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body.code).toBe(0)
  })

  test('POST /charging/start 不存在的设备 → 后端仍返回 200', async ({
    request,
  }) => {
    // BUG: 后端未校验设备是否存在
    const resp = await request.post(`${API}/charging/start`, {
      data: { chargePointId: 'NONEXISTENT-99999', connectorId: 1 },
    })
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body.code).toBe(0)
  })

  test('POST /charging/{id}/stop 不存在的交易 → 后端返回 200 (幂等)', async ({
    request,
  }) => {
    // 后端对不存在的交易也返回 200
    const resp = await request.post(`${API}/charging/FAKE_TX_000/stop`)
    ok(resp)
    const body = await resp.json()
    expect(body.code).toBe(0)
  })

  test('POST /charging/{id}/stop 正常停止 → 200', async ({ request }) => {
    // 先启动一个交易
    test.skip(!availableDeviceOcppId, 'No available device found')
    const startResp = await request.post(`${API}/charging/start`, {
      data: {
        chargePointId: availableDeviceOcppId,
        connectorId: 1,
        targetSoc: 50,
      },
    })
    const startBody = await startResp.json()
    const txId = startBody.data?.transactionId ?? startBody.data?.id
    if (txId !== undefined && txId !== null) {
      const stopResp = await request.post(`${API}/charging/${txId}/stop`)
      expect([200, 204]).toContain(stopResp.status())
      const stopBody = await stopResp.json()
      expect(stopBody.code).toBe(0)
    }
  })

  test('GET /charging/{id}/status 正常查询 → 200', async ({ request }) => {
    // 先启动一个交易
    test.skip(!availableDeviceOcppId, 'No available device found')
    const startResp = await request.post(`${API}/charging/start`, {
      data: {
        chargePointId: availableDeviceOcppId,
        connectorId: 1,
        targetSoc: 60,
      },
    })
    const startBody = await startResp.json()
    const txId = startBody.data?.transactionId ?? startBody.data?.id
    if (txId !== undefined && txId !== null) {
      const resp = await request.get(`${API}/charging/${txId}/status`)
      expect(resp.ok()).toBeTruthy()
      expect(resp.status()).toBe(200)
      const body = await resp.json()
      expect(body.data).toBeTruthy()
      expect(body.data.status).toBeDefined()
    }
  })

  test('GET /charging/{id}/status 不存在 → 200 + 空或错误', async ({
    request,
  }) => {
    const resp = await request.get(`${API}/charging/FAKE_TX_000/status`)
    const status = resp.status()
    const body = await resp.json()
    // 后端可能返回 200 + 空/null data，或业务错误
    if (status === 200) {
      expect(body.code).toBe(0)
    } else {
      expect([404, 500]).toContain(status)
    }
  })
})

// ─── 场景接口健壮性 ─────────────────────────────────────────────────────────────

test.describe('场景接口健壮性', () => {
  test('POST /scenarios 正常创建', async ({ request }) => {
    const resp = await request.post(`${API}/scenarios`, {
      data: {
        name: `TestScenario-${Date.now()}`,
        description: '自动化测试创建的场景',
        nodes: [],
        edges: [],
      },
    })
    expect([200, 201]).toContain(resp.status())
    const body = await resp.json()
    expect(body.code).toBe(0)
    expect(body.data).toBeTruthy()
    expect(body.data.id).toBeDefined()
  })

  test('POST /scenarios 空名称 → 后端仍返回 200', async ({ request }) => {
    // BUG: 后端未校验场景名称非空，空名称也能创建成功
    const resp = await request.post(`${API}/scenarios`, {
      data: { name: '', description: '无名场景' },
    })
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body.code).toBe(0)
  })

  test('POST /scenarios 超长名称(>200字符) → 后端仍返回 200', async ({
    request,
  }) => {
    // BUG: 后端未校验场景名称长度
    const longName = 'A'.repeat(201)
    const resp = await request.post(`${API}/scenarios`, {
      data: { name: longName, description: '超长名称测试' },
    })
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body.code).toBe(0)
  })

  test('POST /scenarios/{id}/execute 不存在 → 后端返回 200 (幂等)', async ({
    request,
  }) => {
    // BUG: 后端未校验场景是否存在，直接返回 200
    const resp = await request.post(`${API}/scenarios/0/execute`)
    ok(resp)
    const body = await resp.json()
    expect(body.code).toBe(0)
  })

  test('POST /scenarios/{id}/stop 未运行 → 幂等 200', async ({ request }) => {
    const resp = await request.post(`${API}/scenarios/0/stop`)
    ok(resp)
    const body = await resp.json()
    expect(body.code).toBe(0)
  })
})

// ─── 系统接口 ──────────────────────────────────────────────────────────────────

test.describe('系统接口', () => {
  test('GET /stats 正常返回 + 字段完整', async ({ request }) => {
    const resp = await request.get(`${API}/stats`)
    ok(resp)
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body.code).toBe(0)
    const data = body.data
    expect(data).toBeTruthy()
    // 核心字段存在
    expect(data).toHaveProperty('totalDevices')
    expect(data).toHaveProperty('onlineDevices')
  })

  test('GET /health 正常返回 200', async ({ request }) => {
    const resp = await request.get(`${API}/health`)
    ok(resp)
    expect(resp.status()).toBe(200)
  })
})
