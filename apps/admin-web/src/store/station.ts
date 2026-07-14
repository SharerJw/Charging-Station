import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { stationApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Station, StationForm, StationQuery } from '@/types'
import { StationStatus } from '@/types'

export const useStationStore = defineStore('station', () => {
  const list = ref<Station[]>([])
  const total = ref(0)
  const loading = ref(false)
  const currentStation = ref<Station | null>(null)
  const dialogVisible = ref(false)
  const isEdit = ref(false)

  const query = reactive<StationQuery>({
    keyword: '',
    status: undefined,
    page: 1,
    size: 10,
  })

  const form = reactive<StationForm>({
    name: '',
    code: '',
    address: '',
    province: '',
    city: '',
    district: '',
    longitude: 116.46,
    latitude: 39.92,
    contactName: '',
    contactPhone: '',
    businessHours: '00:00-24:00',
    parkingFee: 0,
    electricityPrice: 1.0,
    servicePrice: 0.5,
  })

  async function fetchList() {
    loading.value = true
    try {
      const result = await stationApi.list(query)
      list.value = result.list
      total.value = result.total
    } catch (error: any) {
      ElMessage.error(error.message || '获取充电站列表失败')
    } finally {
      loading.value = false
    }
  }

  async function fetchDetail(id: string) {
    loading.value = true
    try {
      currentStation.value = await stationApi.detail(id)
    } catch (error: any) {
      ElMessage.error(error.message || '获取充电站详情失败')
    } finally {
      loading.value = false
    }
  }

  function openCreateDialog() {
    isEdit.value = false
    resetForm()
    dialogVisible.value = true
  }

  function openEditDialog(station: Station) {
    isEdit.value = true
    currentStation.value = station
    Object.assign(form, {
      name: station.name,
      code: station.code,
      address: station.address,
      province: station.province,
      city: station.city,
      district: station.district,
      longitude: station.longitude,
      latitude: station.latitude,
      contactName: station.contactName,
      contactPhone: station.contactPhone,
      businessHours: station.businessHours,
      parkingFee: station.parkingFee,
      electricityPrice: station.electricityPrice,
      servicePrice: station.servicePrice,
    })
    dialogVisible.value = true
  }

  function resetForm() {
    Object.assign(form, {
      name: '', code: '', address: '', province: '', city: '', district: '',
      longitude: 116.46, latitude: 39.92, contactName: '', contactPhone: '',
      businessHours: '00:00-24:00', parkingFee: 0, electricityPrice: 1.0, servicePrice: 0.5,
    })
  }

  async function handleSubmit() {
    loading.value = true
    try {
      if (isEdit.value && currentStation.value) {
        await stationApi.update(currentStation.value.id, form)
        ElMessage.success('更新成功')
      } else {
        await stationApi.create(form)
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      await fetchList()
    } catch (error: any) {
      ElMessage.error(error.message || '操作失败')
    } finally {
      loading.value = false
    }
  }

  async function handleDelete(id: string) {
    try {
      await ElMessageBox.confirm('确定要删除该充电站吗？此操作不可恢复。', '确认删除', {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
      })
      loading.value = true
      await stationApi.delete(id)
      ElMessage.success('删除成功')
      await fetchList()
    } catch (error: any) {
      if (error !== 'cancel') {
        ElMessage.error(error.message || '删除失败')
      }
    } finally {
      loading.value = false
    }
  }

  async function handleStatusChange(id: string, status: StationStatus) {
    try {
      await stationApi.updateStatus(id, status)
      ElMessage.success('状态更新成功')
      await fetchList()
    } catch (error: any) {
      ElMessage.error(error.message || '状态更新失败')
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

  function handleReset() {
    query.keyword = ''
    query.status = undefined
    query.page = 1
    fetchList()
  }

  return {
    list, total, loading, currentStation, dialogVisible, isEdit, query, form,
    fetchList, fetchDetail, openCreateDialog, openEditDialog, handleSubmit,
    handleDelete, handleStatusChange, handlePageChange, handleSizeChange,
    handleSearch, handleReset, resetForm,
  }
})
