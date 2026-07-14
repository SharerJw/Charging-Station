import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { deviceApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Device } from '@/types'
import { DeviceStatus } from '@/types'

export const useDeviceStore = defineStore('device', () => {
  const list = ref<Device[]>([])
  const total = ref(0)
  const loading = ref(false)
  const currentDevice = ref<Device | null>(null)
  const detailVisible = ref(false)

  const query = reactive({
    keyword: '',
    stationId: '',
    status: undefined as DeviceStatus | undefined,
    page: 1,
    size: 10,
  })

  const statusOptions = [
    { label: '全部', value: undefined },
    { label: '在线', value: DeviceStatus.ONLINE },
    { label: '充电中', value: DeviceStatus.CHARGING },
    { label: '离线', value: DeviceStatus.OFFLINE },
    { label: '故障', value: DeviceStatus.FAULT },
  ]

  async function fetchList() {
    loading.value = true
    try {
      const result = await deviceApi.list(query)
      list.value = result.list
      total.value = result.total
    } catch (error: any) {
      ElMessage.error(error.message || '获取设备列表失败')
    } finally {
      loading.value = false
    }
  }

  async function viewDetail(id: string) {
    loading.value = true
    try {
      currentDevice.value = await deviceApi.detail(id)
      detailVisible.value = true
    } catch (error: any) {
      ElMessage.error(error.message || '获取设备详情失败')
    } finally {
      loading.value = false
    }
  }

  async function handleReset(id: string) {
    try {
      await ElMessageBox.confirm('确定要重置该设备吗？将断开所有连接。', '确认重置', { type: 'warning' })
      loading.value = true
      await deviceApi.reset(id)
      ElMessage.success('设备已重置')
      await fetchList()
    } catch (error: any) {
      if (error !== 'cancel') {
        ElMessage.error(error.message || '重置失败')
      }
    } finally {
      loading.value = false
    }
  }

  function handlePageChange(page: number) {
    query.page = page
    fetchList()
  }

  function handleSizeChange(size: number) {
    query.size = size
    query.page = 1
    fetchList()
  }

  function handleSearch() {
    query.page = 1
    fetchList()
  }

  return {
    list, total, loading, currentDevice, detailVisible, query, statusOptions,
    fetchList, viewDetail, handleReset, handlePageChange, handleSizeChange, handleSearch,
  }
})
