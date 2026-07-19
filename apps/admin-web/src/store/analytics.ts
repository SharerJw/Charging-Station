import { defineStore } from 'pinia'
import { ref } from 'vue'
import { analyticsApi } from '@/api'

// ==================== 类型定义 ====================

export interface UserGrowthItem {
  date: string
  newUsers: number
  activeUsers: number
}

export interface RetentionFunnel {
  registered: number
  firstCharge: number
  secondCharge: number
  d7Retention: number
  d30Retention: number
}

export interface RfmSegment {
  segment: string
  label: string
  count: number
  percentage: number
  avgRevenue: number
}

export interface StationRevenueItem {
  stationId: string
  stationName: string
  revenue: number
  orderCount: number
}

export interface UtilizationCell {
  hour: number
  dayOfWeek: number
  value: number
}

export interface GeoStation {
  stationId: string
  stationName: string
  lat: number
  lng: number
  revenue: number
  deviceCount: number
  onlineCount: number
}

export interface PeakHourItem {
  hour: number
  orderCount: number
  level: 'low' | 'medium' | 'high' | 'peak'
}

export interface DurationBucket {
  range: string
  count: number
  percentage: number
}

export interface SocBucket {
  range: string
  startCount: number
  endCount: number
}

export interface EnergyTrendItem {
  date: string
  energy: number
  orderCount: number
}

export const useAnalyticsStore = defineStore('analytics', () => {
  // ==================== 状态 ====================
  const period = ref('7d')
  const activeTab = ref<'user' | 'station' | 'charging'>('user')

  // 用户分析
  const userGrowth = ref<UserGrowthItem[]>([])
  const retentionFunnel = ref<RetentionFunnel | null>(null)
  const rfmSegments = ref<RfmSegment[]>([])

  // 站点分析
  const stationRevenueRanking = ref<StationRevenueItem[]>([])
  const utilizationData = ref<UtilizationCell[]>([])
  const geoDistribution = ref<GeoStation[]>([])

  // 充电分析
  const peakHours = ref<PeakHourItem[]>([])
  const durationDistribution = ref<DurationBucket[]>([])
  const socDistribution = ref<SocBucket[]>([])
  const energyTrend = ref<EnergyTrendItem[]>([])

  // 加载状态
  const loadingUser = ref(false)
  const loadingStation = ref(false)
  const loadingCharging = ref(false)

  // ==================== 用户分析 Actions ====================

  async function fetchUserGrowth() {
    const data = await analyticsApi.getUserGrowth({ period: period.value })
    userGrowth.value = data ?? []
  }

  async function fetchUserRetention() {
    const data = await analyticsApi.getUserRetention({ period: period.value })
    retentionFunnel.value = data ?? null
  }

  async function fetchUserRfm() {
    const data = await analyticsApi.getUserRfm({ period: period.value })
    rfmSegments.value = data ?? []
  }

  async function fetchAllUserAnalytics() {
    loadingUser.value = true
    try {
      await Promise.all([fetchUserGrowth(), fetchUserRetention(), fetchUserRfm()])
    } finally {
      loadingUser.value = false
    }
  }

  // ==================== 站点分析 Actions ====================

  async function fetchStationRevenueRanking(limit = 10) {
    const data = await analyticsApi.getStationRevenueRanking({ period: period.value, limit })
    stationRevenueRanking.value = data ?? []
  }

  async function fetchStationUtilization(stationId?: string) {
    const data = await analyticsApi.getStationUtilization({ period: period.value, stationId })
    utilizationData.value = data ?? []
  }

  async function fetchGeoDistribution() {
    const data = await analyticsApi.getStationGeoDistribution({ period: period.value })
    geoDistribution.value = data ?? []
  }

  async function fetchAllStationAnalytics() {
    loadingStation.value = true
    try {
      await Promise.all([fetchStationRevenueRanking(), fetchStationUtilization(), fetchGeoDistribution()])
    } finally {
      loadingStation.value = false
    }
  }

  // ==================== 充电分析 Actions ====================

  async function fetchPeakHours() {
    const data = await analyticsApi.getChargingPeakHours({ period: period.value })
    peakHours.value = data ?? []
  }

  async function fetchDurationDistribution() {
    const data = await analyticsApi.getChargingDuration({ period: period.value })
    durationDistribution.value = data ?? []
  }

  async function fetchSocDistribution() {
    const data = await analyticsApi.getChargingSoc({ period: period.value })
    socDistribution.value = data ?? []
  }

  async function fetchEnergyTrend() {
    const data = await analyticsApi.getChargingEnergyTrend({ period: period.value })
    energyTrend.value = data ?? []
  }

  async function fetchAllChargingAnalytics() {
    loadingCharging.value = true
    try {
      await Promise.all([fetchPeakHours(), fetchDurationDistribution(), fetchSocDistribution(), fetchEnergyTrend()])
    } finally {
      loadingCharging.value = false
    }
  }

  // ==================== 通用 ====================

  function setPeriod(p: string) {
    period.value = p
  }

  function setActiveTab(tab: 'user' | 'station' | 'charging') {
    activeTab.value = tab
  }

  return {
    // 状态
    period, activeTab,
    userGrowth, retentionFunnel, rfmSegments,
    stationRevenueRanking, utilizationData, geoDistribution,
    peakHours, durationDistribution, socDistribution, energyTrend,
    loadingUser, loadingStation, loadingCharging,
    // 用户分析
    fetchUserGrowth, fetchUserRetention, fetchUserRfm, fetchAllUserAnalytics,
    // 站点分析
    fetchStationRevenueRanking, fetchStationUtilization, fetchGeoDistribution, fetchAllStationAnalytics,
    // 充电分析
    fetchPeakHours, fetchDurationDistribution, fetchSocDistribution, fetchEnergyTrend, fetchAllChargingAnalytics,
    // 通用
    setPeriod, setActiveTab,
  }
})
