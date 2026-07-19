import { defineStore } from 'pinia'
import { ref } from 'vue'

/** 默认坐标（北京天安门） */
const DEFAULT_LAT = 39.92
const DEFAULT_LNG = 116.46
const LOCATE_TIMEOUT = 8000
const GEOCODE_TIMEOUT = 5000

export const useLocationStore = defineStore('location', () => {
  // ==================== 状态 ====================
  const latitude = ref(0)
  const longitude = ref(0)
  const gpsGranted = ref(false)
  const city = ref('定位中...')

  // Promise 缓存：保证全局只发起一次定位请求
  let locatingPromise: Promise<void> | null = null

  /** 带超时的 Promise 包装 */
  function withTimeout<T>(promise: Promise<T>, ms: number, label = 'timeout'): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(label)), ms)
      promise.then(
        (v) => { clearTimeout(timer); resolve(v) },
        (e) => { clearTimeout(timer); reject(e) },
      )
    })
  }

  // ==================== 核心方法 ====================

  /**
   * 确保定位已获取（首次调用发起定位，后续调用直接返回缓存结果）
   * 所有页面通过此方法获取统一的用户位置
   */
  async function ensureLocation(): Promise<void> {
    // 已定位过（含降级）
    if (latitude.value !== 0 && longitude.value !== 0) return
    // 正在定位中，复用同一个 Promise
    if (locatingPromise) return locatingPromise
    locatingPromise = doLocate().finally(() => {
      locatingPromise = null // 完成后清除，允许重试
    })
    return locatingPromise
  }

  // ==================== 内部实现 ====================

  async function doLocate(): Promise<void> {
    try {
      // #ifdef H5
      if (navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              latitude.value = pos.coords.latitude
              longitude.value = pos.coords.longitude
              gpsGranted.value = true
              await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
              resolve()
            },
            () => { fallback(); resolve() },
            { enableHighAccuracy: true, timeout: LOCATE_TIMEOUT }
          )
        })
      } else {
        fallback()
      }
      return
      // #endif

      // #ifndef H5
      // 检查位置权限
      try {
        const authRes: any = await new Promise((resolve) => {
          uni.getSetting({ success: resolve, fail: () => resolve({}) })
        })
        if (authRes.authSetting?.['scope.userLocation'] === false) {
          uni.showModal({
            title: '需要定位权限',
            content: '请在设置中开启定位权限，以获取附近充电站',
            confirmText: '去设置',
            success: (res) => { if (res.confirm) uni.openSetting({}) },
          })
          fallback()
          return
        }
      } catch { /* getSetting 失败不阻塞 */ }

      // 带超时的定位请求
      const loc: any = await withTimeout(
        new Promise((resolve, reject) => {
          uni.getLocation({ type: 'gcj02', isHighAccuracy: true, success: resolve, fail: reject })
        }),
        LOCATE_TIMEOUT,
        'getLocation timeout',
      )
      latitude.value = loc.latitude
      longitude.value = loc.longitude
      gpsGranted.value = true
      // 逆地理编码（独立超时，失败不影响定位结果）
      await reverseGeocode(loc.latitude, loc.longitude)
      // #endif
    } catch {
      fallback()
    }
  }

  /** 逆地理编码获取城市名 */
  async function reverseGeocode(lat: number, lng: number) {
    try {
      const res: any = await withTimeout(
        new Promise((resolve, reject) => {
          uni.request({
            url: `https://restapi.amap.com/v3/geocode/regeo?key=c86443d9a8cd72e5a26af987f46345ca&location=${lng},${lat}`,
            success: resolve,
            fail: reject,
          })
        }),
        GEOCODE_TIMEOUT,
        'geocode timeout',
      )
      const raw = res.data?.regeocode?.addressComponent?.city
      city.value = (typeof raw === 'string' && raw) ? raw.replace(/市$/, '') || '未知城市' : '未知城市'
    } catch {
      city.value = '未知城市'
    }
  }

  /** 定位降级：使用默认坐标 */
  function fallback() {
    latitude.value = DEFAULT_LAT
    longitude.value = DEFAULT_LNG
    city.value = '北京'
  }

  // ==================== 工具方法 ====================

  /** Haversine 公式计算两点距离（米） */
  function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  return {
    latitude,
    longitude,
    gpsGranted,
    city,
    ensureLocation,
    calcDistance,
  }
})
