import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export interface CrudApi<T = any> {
  list: (params: any) => Promise<{ list: T[]; total: number }>
  detail?: (id: string) => Promise<T>
  create?: (data: any) => Promise<T>
  update?: (id: string, data: any) => Promise<T>
  delete?: (id: string) => Promise<void>
}

export interface CrudOptions<T = any> {
  /** 表单默认值 */
  defaultForm?: () => Partial<T>
  /** 创建前的钩子 */
  beforeCreate?: (form: any) => boolean | void
  /** 更新前的钩子 */
  beforeUpdate?: (form: any, row: T) => boolean | void
  /** 删除确认消息 */
  deleteMessage?: string
  /** 成功消息 */
  successMessage?: string
}

/**
 * 创建标准 CRUD Store 工厂函数
 * @param name Store 名称
 * @param api API 接口对象
 * @param options 配置选项
 */
export function createCrudStore<T extends { id: string }>(
  name: string,
  api: CrudApi<T>,
  options: CrudOptions<T> = {},
) {
  return defineStore(name, () => {
    // ===== 状态 =====
    const list = ref<T[]>([]) as any
    const total = ref(0)
    const loading = ref(false)
    const currentRow = ref<T | null>(null) as any
    const dialogVisible = ref(false)
    const isEdit = ref(false)
    const detailVisible = ref(false)

    const query = reactive<Record<string, any>>({
      page: 1,
      size: 10,
    })

    const form = reactive<Record<string, any>>(
      options.defaultForm ? options.defaultForm() : {},
    )

    // ===== 方法 =====

    /** 获取列表 */
    async function fetchList() {
      loading.value = true
      try {
        const result = await api.list(query)
        list.value = result.list
        total.value = result.total
      } catch (error: any) {
        ElMessage.error(error.message || '获取列表失败')
      } finally {
        loading.value = false
      }
    }

    /** 搜索 */
    function handleSearch() {
      query.page = 1
      fetchList()
    }

    /** 重置搜索 */
    function handleReset() {
      Object.keys(query).forEach(key => {
        if (key !== 'page' && key !== 'size') {
          query[key] = undefined
        }
      })
      query.page = 1
      fetchList()
    }

    /** 翻页 */
    function handlePageChange(page: number) {
      query.page = page
      fetchList()
    }

    /** 每页条数 */
    function handleSizeChange(size: number) {
      query.size = size
      query.page = 1
      fetchList()
    }

    /** 打开新增弹窗 */
    function openCreateDialog() {
      isEdit.value = false
      currentRow.value = null
      resetForm()
      dialogVisible.value = true
    }

    /** 打开编辑弹窗 */
    function openEditDialog(row: T) {
      isEdit.value = true
      currentRow.value = row
      Object.assign(form, row)
      dialogVisible.value = true
    }

    /** 查看详情 */
    async function viewDetail(id: string) {
      if (!api.detail) return
      loading.value = true
      try {
        currentRow.value = await api.detail(id)
        detailVisible.value = true
      } catch (error: any) {
        ElMessage.error(error.message || '获取详情失败')
      } finally {
        loading.value = false
      }
    }

    /** 提交表单 */
    async function handleSubmit() {
      // 钩子检查
      if (isEdit.value && options.beforeUpdate) {
        if (options.beforeUpdate(form, currentRow.value!) === false) return
      } else if (!isEdit.value && options.beforeCreate) {
        if (options.beforeCreate(form) === false) return
      }

      loading.value = true
      try {
        if (isEdit.value && currentRow.value) {
          await api.update!(currentRow.value.id, { ...form })
          ElMessage.success(options.successMessage || '更新成功')
        } else {
          await api.create!({ ...form })
          ElMessage.success(options.successMessage || '创建成功')
        }
        dialogVisible.value = false
        await fetchList()
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败')
      } finally {
        loading.value = false
      }
    }

    /** 删除 */
    async function handleDelete(id: string) {
      if (!api.delete) return
      try {
        await ElMessageBox.confirm(
          options.deleteMessage || '确定要删除该记录吗？此操作不可恢复。',
          '确认删除',
          { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' },
        )
        loading.value = true
        await api.delete(id)
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

    /** 重置表单 */
    function resetForm() {
      const defaults = options.defaultForm ? options.defaultForm() : {}
      Object.keys(form).forEach(key => {
        const f = form as Record<string, any>
        const d = defaults as Record<string, any>
        f[key] = d[key] ?? (Array.isArray(f[key]) ? [] : typeof f[key] === 'number' ? 0 : '')
      })
    }

    return {
      // 状态
      list, total, loading, currentRow, dialogVisible, isEdit,
      detailVisible, query, form,
      // 方法
      fetchList, handleSearch, handleReset,
      handlePageChange, handleSizeChange,
      openCreateDialog, openEditDialog, viewDetail,
      handleSubmit, handleDelete, resetForm,
    }
  })
}
