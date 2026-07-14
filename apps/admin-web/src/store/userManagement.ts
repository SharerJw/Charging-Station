import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { userApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { User } from '@/types'
import { UserStatus } from '@/types'

export const useUserStore = defineStore('userManagement', () => {
  const list = ref<User[]>([])
  const total = ref(0)
  const loading = ref(false)
  const currentUser = ref<User | null>(null)
  const detailVisible = ref(false)

  const query = reactive({
    keyword: '',
    status: undefined as UserStatus | undefined,
    page: 1,
    size: 10,
  })

  async function fetchList() {
    loading.value = true
    try {
      const result = await userApi.list(query)
      list.value = result.list
      total.value = result.total
    } catch (error: any) {
      ElMessage.error(error.message || '获取用户列表失败')
    } finally {
      loading.value = false
    }
  }

  async function viewDetail(id: string) {
    loading.value = true
    try {
      currentUser.value = await userApi.detail(id)
      detailVisible.value = true
    } catch (error: any) {
      ElMessage.error(error.message || '获取用户详情失败')
    } finally {
      loading.value = false
    }
  }

  async function handleStatusChange(id: string, status: UserStatus) {
    const action = status === UserStatus.DISABLED ? '禁用' : '启用'
    try {
      await ElMessageBox.confirm(`确定要${action}该用户吗？`, '确认操作', { type: 'warning' })
      loading.value = true
      await userApi.updateStatus(id, status)
      ElMessage.success(`${action}成功`)
      await fetchList()
    } catch (error: any) {
      if (error !== 'cancel') {
        ElMessage.error(error.message || `${action}失败`)
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
    list, total, loading, currentUser, detailVisible, query,
    fetchList, viewDetail, handleStatusChange, handlePageChange, handleSizeChange, handleSearch,
  }
})
