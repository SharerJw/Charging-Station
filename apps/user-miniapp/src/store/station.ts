import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api'
import type { Station } from '@/types'
import { useLocationStore } from './location'

const PAGE_SIZE = 10

export const useStationStore = defineStore('station', () => {
  // ==================== 状态 ====================
  const allStations = ref<Station[]>([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const currentPage = ref(1)
  const allLoaded = ref(false)
  const searchKeyword = ref('')
  const selectedStation = ref<Station | null>(null)

  // ==================== 计算属性 ====================

  /** 根据搜索关键词过滤站点 */
  const filteredStations = computed(() => {
    const keyword = searchKeyword.value.trim().toLowerCase()
    if (!keyword) return allStations.value
    return allStations.value.filter(
      s => s.name.toLowerCase().includes(keyword) || s.address.toLowerCase().includes(keyword),
    )
  })

  /** 当前分页展示的站点 */
  const displayedStations = computed(() => {
    return filteredStations.value.slice(0, currentPage.value * PAGE_SIZE)
  })

  /** 是否还有更多数据 */
  const hasMore = computed(() => {
    return displayedStations.value.length < filteredStations.value.length
  })

  // ==================== Actions ====================

  /**
   * Haversine 公式计算两点距离（米）
   */
  function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  /**
   * 加载站点列表（首次加载或搜索后重新加载）
   * @param reset 是否重置分页（默认 true）
   */
  async function fetchStations(reset = true): Promise<void> {
    if (loading.value) return

    loading.value = true
    try {
      if (reset) {
        currentPage.value = 1
        allLoaded.value = false
      }

      const locationStore = useLocationStore()
      const params: Record<string, any> = {
        page: currentPage.value,
        size: PAGE_SIZE,
      }

      // 仅 GPS 授权后传坐标参数
      if (locationStore.gpsGranted && locationStore.latitude && locationStore.longitude) {
        params.latitude = locationStore.latitude
        params.longitude = locationStore.longitude
        params.radius = 50
      }

      if (searchKeyword.value.trim()) {
        params.keyword = searchKeyword.value.trim()
      }

      const result = await api.getStations(params).catch(() => [])

      const list = result
        .filter(s => s.latitude && s.longitude)
        .map(s => ({
          ...s,
          distance: (locationStore.latitude && locationStore.longitude)
            ? calcDistance(locationStore.latitude, locationStore.longitude, s.latitude, s.longitude)
            : 999999,
        }))
        .sort((a: Station, b: Station) => a.distance - b.distance)

      if (reset) {
        allStations.value = list
      } else {
        allStations.value.push(...list)
      }

      if (list.length < PAGE_SIZE) {
        allLoaded.value = true
      }
    } catch (error) {
      console.error('[stationStore] 加载充电站失败:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载更多站点（触底/点击触发）
   */
  async function loadMore(): Promise<void> {
    if (loadingMore.value || allLoaded.value || loading.value) return

    loadingMore.value = true
    try {
      currentPage.value++
      await fetchStations(false)
    } finally {
      loadingMore.value = false
    }
  }

  /**
   * 搜索站点（设置关键词后重新加载）
   */
  async function searchStations(keyword: string): Promise<void> {
    searchKeyword.value = keyword
    await fetchStations(true)
  }

  /**
   * 选择站点
   */
  function selectStation(station: Station | null): void {
    if (selectedStation.value?.id === station?.id) {
      selectedStation.value = null
    } else {
      selectedStation.value = station
    }
  }

  /**
   * 清空选择
   */
  function clearSelection(): void {
    selectedStation.value = null
  }

  /**
   * 重置所有状态
   */
  function reset(): void {
    allStations.value = []
    loading.value = false
    loadingMore.value = false
    currentPage.value = 1
    allLoaded.value = false
    searchKeyword.value = ''
    selectedStation.value = null
  }

  return {
    // state
    allStations,
    loading,
    loadingMore,
    currentPage,
    allLoaded,
    searchKeyword,
    selectedStation,
    // computed
    filteredStations,
    displayedStations,
    hasMore,
    // actions
    fetchStations,
    loadMore,
    searchStations,
    selectStation,
    clearSelection,
    calcDistance,
    reset,
  }
})
