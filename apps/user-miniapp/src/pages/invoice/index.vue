<template>
  <view class="invoice-page">
    <!-- 顶部 Tab 切换 -->
    <view class="tab-bar">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: currentTab === tab.value }"
        @tap="switchTab(tab.value)"
      >
        <text class="tab-text">{{ tab.label }}</text>
        <view v-if="currentTab === tab.value" class="tab-indicator" />
      </view>
    </view>

    <!-- ========== 待开票 Tab ========== -->
    <view v-if="currentTab === 'pending'" class="tab-content">
      <!-- 多选订单列表 -->
      <view class="card" v-if="billableOrders.length > 0">
        <view class="card-header">
          <text class="card-title">可开票订单</text>
          <view class="select-all" @tap="toggleSelectAll">
            <view class="check-box" :class="{ checked: isAllSelected }">
              <text v-if="isAllSelected" class="check-icon">✓</text>
            </view>
            <text class="select-all-text">全选</text>
          </view>
        </view>
        <view class="order-list">
          <view
            v-for="order in billableOrders"
            :key="order.id"
            class="order-item"
            :class="{ checked: selectedOrders.has(order.id) }"
            @tap="toggleOrder(order.id)"
          >
            <view class="check-box" :class="{ checked: selectedOrders.has(order.id) }">
              <text v-if="selectedOrders.has(order.id)" class="check-icon">✓</text>
            </view>
            <view class="order-info">
              <text class="order-station">{{ order.stationName }}</text>
              <text class="order-meta">{{ order.orderNo }} | {{ order.startTime }}</text>
            </view>
            <text class="order-amount">¥{{ order.totalAmount.toFixed(2) }}</text>
          </view>
        </view>
        <!-- 已选合计 -->
        <view class="selection-bar">
          <text class="selection-count">已选 {{ selectedOrders.size }} 单</text>
          <text class="selection-total">合计 ¥{{ selectedTotal.toFixed(2) }}</text>
        </view>
      </view>

      <view class="empty-card" v-else>
        <text class="empty-icon">📄</text>
        <text class="empty-text">暂无可开票订单</text>
        <text class="empty-sub">完成充电支付后的订单将在此显示</text>
      </view>

      <!-- 发票申请表单 -->
      <view class="card" v-if="selectedOrders.size > 0">
        <text class="card-title">发票信息</text>

        <!-- 发票类型 -->
        <view class="form-section">
          <text class="form-label">发票类型</text>
          <view class="type-options">
            <view
              v-for="t in invoiceTypeOptions"
              :key="t.value"
              class="type-option"
              :class="{ active: invoiceForm.type === t.value }"
              @tap="invoiceForm.type = t.value"
            >
              <view class="type-radio" :class="{ checked: invoiceForm.type === t.value }">
                <view v-if="invoiceForm.type === t.value" class="radio-dot" />
              </view>
              <view class="type-detail">
                <text class="type-name">{{ t.label }}</text>
                <text class="type-desc">{{ t.desc }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 抬头类型 -->
        <view class="form-section">
          <text class="form-label">发票抬头</text>
          <view class="header-type-toggle">
            <view
              class="toggle-btn"
              :class="{ active: invoiceForm.headerType === 'personal' }"
              @tap="invoiceForm.headerType = 'personal'"
            >
              <text class="toggle-text">个人</text>
            </view>
            <view
              class="toggle-btn"
              :class="{ active: invoiceForm.headerType === 'company' }"
              @tap="invoiceForm.headerType = 'company'"
            >
              <text class="toggle-text">企业</text>
            </view>
          </view>

          <!-- 个人抬头 -->
          <view v-if="invoiceForm.headerType === 'personal'" class="form-fields">
            <view class="field-row">
              <text class="field-label">姓名</text>
              <input
                class="field-input"
                v-model="invoiceForm.personalName"
                placeholder="请输入姓名（选填）"
              />
            </view>
          </view>

          <!-- 企业抬头 -->
          <view v-if="invoiceForm.headerType === 'company'" class="form-fields">
            <!-- 常用抬头快捷选择 -->
            <view v-if="savedHeaders.length > 0" class="quick-headers">
              <text class="quick-label">常用抬头</text>
              <scroll-view scroll-x class="quick-scroll">
                <view class="quick-list">
                  <view
                    v-for="h in savedHeaders"
                    :key="h.id"
                    class="quick-chip"
                    @tap="applyHeader(h)"
                  >
                    <text class="quick-chip-text">{{ h.companyName }}</text>
                  </view>
                </view>
              </scroll-view>
            </view>
            <view class="field-row">
              <text class="field-label required">公司名称</text>
              <input
                class="field-input"
                v-model="invoiceForm.companyName"
                placeholder="请输入公司全称"
              />
            </view>
            <view class="field-row">
              <text class="field-label required">纳税人识别号</text>
              <input
                class="field-input"
                v-model="invoiceForm.taxNumber"
                placeholder="请输入统一社会信用代码"
              />
            </view>
            <view v-if="invoiceForm.type === 'vat_special'" class="field-row">
              <text class="field-label required">注册地址</text>
              <input
                class="field-input"
                v-model="invoiceForm.companyAddress"
                placeholder="请输入公司注册地址"
              />
            </view>
            <view v-if="invoiceForm.type === 'vat_special'" class="field-row">
              <text class="field-label required">注册电话</text>
              <input
                class="field-input"
                v-model="invoiceForm.companyPhone"
                placeholder="请输入联系电话"
                type="number"
              />
            </view>
            <view v-if="invoiceForm.type === 'vat_special'" class="field-row">
              <text class="field-label required">开户银行</text>
              <input
                class="field-input"
                v-model="invoiceForm.bankName"
                placeholder="请输入开户行名称"
              />
            </view>
            <view v-if="invoiceForm.type === 'vat_special'" class="field-row">
              <text class="field-label required">银行账号</text>
              <input
                class="field-input"
                v-model="invoiceForm.bankAccount"
                placeholder="请输入银行账号"
                type="number"
              />
            </view>
          </view>
        </view>

        <!-- 接收邮箱 -->
        <view class="form-section">
          <text class="form-label">接收邮箱</text>
          <view class="field-row">
            <input
              class="field-input"
              v-model="invoiceForm.email"
              placeholder="请输入接收发票的邮箱地址"
              type="text"
            />
          </view>
        </view>

        <!-- 保存抬头 -->
        <view v-if="invoiceForm.headerType === 'company'" class="save-header-row">
          <view class="check-box small" :class="{ checked: saveHeader }" @tap="saveHeader = !saveHeader">
            <text v-if="saveHeader" class="check-icon">✓</text>
          </view>
          <text class="save-header-text">保存为常用抬头</text>
        </view>

        <!-- 提交按钮 -->
        <button
          class="submit-btn"
          :disabled="!canSubmit"
          :class="{ disabled: !canSubmit }"
          @tap="handleSubmitInvoice"
        >
          提交开票申请
        </button>
      </view>
    </view>

    <!-- ========== 已开票 Tab ========== -->
    <view v-if="currentTab === 'issued'" class="tab-content">
      <view v-if="issuedList.length > 0" class="invoice-list">
        <view v-for="inv in issuedList" :key="inv.id" class="invoice-card">
          <view class="invoice-top">
            <text class="invoice-title-text">{{ inv.title }}</text>
            <view class="invoice-status-badge" :class="inv.status">
              <text class="status-text">{{ statusMap[inv.status] || inv.status }}</text>
            </view>
          </view>
          <view class="invoice-amount-row">
            <text class="invoice-amount-label">开票金额</text>
            <text class="invoice-amount-value">¥{{ inv.amount.toFixed(2) }}</text>
          </view>
          <view class="invoice-detail-row">
            <text class="detail-label">抬头</text>
            <text class="detail-value">{{ inv.headerName || inv.title }}</text>
          </view>
          <view class="invoice-detail-row">
            <text class="detail-label">开票时间</text>
            <text class="detail-value">{{ inv.createTime }}</text>
          </view>
          <view class="invoice-detail-row" v-if="inv.invoiceNo">
            <text class="detail-label">发票号码</text>
            <text class="detail-value">{{ inv.invoiceNo }}</text>
          </view>
          <view class="invoice-actions">
            <view class="action-btn" @tap="viewPdf(inv)">
              <text class="action-text">查看PDF</text>
            </view>
            <view class="action-btn" @tap="sendToEmail(inv)">
              <text class="action-text">发送邮箱</text>
            </view>
            <view class="action-btn primary" @tap="downloadInvoice(inv)">
              <text class="action-text primary">下载</text>
            </view>
          </view>
        </view>
      </view>
      <view v-else class="empty-card">
        <text class="empty-icon">🧾</text>
        <text class="empty-text">暂无已开发票</text>
        <text class="empty-sub">开票申请通过后将在此显示</text>
      </view>
    </view>

    <!-- ========== 已红冲 Tab ========== -->
    <view v-if="currentTab === 'reversed'" class="tab-content">
      <view v-if="reversedList.length > 0" class="invoice-list">
        <view v-for="inv in reversedList" :key="inv.id" class="invoice-card reversed">
          <view class="invoice-top">
            <text class="invoice-title-text">{{ inv.title }}</text>
            <view class="invoice-status-badge reversed">
              <text class="status-text">已红冲</text>
            </view>
          </view>
          <view class="invoice-amount-row">
            <text class="invoice-amount-label">红冲金额</text>
            <text class="invoice-amount-value reversed">-¥{{ inv.amount.toFixed(2) }}</text>
          </view>
          <view class="invoice-detail-row">
            <text class="detail-label">原发票号</text>
            <text class="detail-value">{{ inv.originalInvoiceNo || '--' }}</text>
          </view>
          <view class="invoice-detail-row">
            <text class="detail-label">红冲时间</text>
            <text class="detail-value">{{ inv.reverseTime || inv.createTime }}</text>
          </view>
          <view class="invoice-detail-row">
            <text class="detail-label">红冲原因</text>
            <text class="detail-value">{{ inv.reverseReason || '发票信息有误' }}</text>
          </view>
        </view>
      </view>
      <view v-else class="empty-card">
        <text class="empty-icon">🔄</text>
        <text class="empty-text">暂无红冲记录</text>
        <text class="empty-sub">红冲发票将在此显示</text>
      </view>
    </view>

    <!-- ========== 抬头管理弹窗 ========== -->
    <view v-if="showHeaderManager" class="modal-mask" @tap.self="showHeaderManager = false">
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">常用抬头管理</text>
          <view class="modal-close" @tap="showHeaderManager = false">
            <text class="close-icon">×</text>
          </view>
        </view>

        <!-- 抬头列表 -->
        <view v-if="!editingHeader" class="header-list-area">
          <view v-if="savedHeaders.length === 0" class="empty-headers">
            <text class="empty-text">暂无保存的抬头</text>
          </view>
          <view v-for="h in savedHeaders" :key="h.id" class="header-item">
            <view class="header-item-info">
              <text class="header-company">{{ h.companyName }}</text>
              <text class="header-tax">税号: {{ h.taxNumber }}</text>
            </view>
            <view class="header-item-actions">
              <view class="hdr-action" @tap="startEditHeader(h)">
                <text class="hdr-action-text">编辑</text>
              </view>
              <view class="hdr-action danger" @tap="deleteHeader(h.id)">
                <text class="hdr-action-text danger">删除</text>
              </view>
            </view>
          </view>
          <button class="add-header-btn" @tap="startAddHeader">
            + 新增抬头
          </button>
        </view>

        <!-- 编辑/新增抬头表单 -->
        <view v-else class="header-form-area">
          <text class="form-label">{{ editingHeader.id ? '编辑抬头' : '新增抬头' }}</text>
          <view class="field-row">
            <text class="field-label required">公司名称</text>
            <input class="field-input" v-model="editingHeader.companyName" placeholder="公司全称" />
          </view>
          <view class="field-row">
            <text class="field-label required">纳税人识别号</text>
            <input class="field-input" v-model="editingHeader.taxNumber" placeholder="统一社会信用代码" />
          </view>
          <view class="field-row">
            <text class="field-label">注册地址</text>
            <input class="field-input" v-model="editingHeader.address" placeholder="公司注册地址" />
          </view>
          <view class="field-row">
            <text class="field-label">联系电话</text>
            <input class="field-input" v-model="editingHeader.phone" placeholder="联系电话" type="number" />
          </view>
          <view class="field-row">
            <text class="field-label">开户银行</text>
            <input class="field-input" v-model="editingHeader.bankName" placeholder="开户行名称" />
          </view>
          <view class="field-row">
            <text class="field-label">银行账号</text>
            <input class="field-input" v-model="editingHeader.bankAccount" placeholder="银行账号" type="number" />
          </view>
          <view class="form-actions">
            <button class="cancel-btn" @tap="editingHeader = null">取消</button>
            <button class="save-btn" :disabled="!canSaveHeader" @tap="saveHeaderItem">保存</button>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部抬头管理入口 -->
    <view class="bottom-bar" @tap="showHeaderManager = true">
      <text class="bottom-bar-text">管理常用抬头</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { api, type Order } from '@/api/index'
import type { TabValue, InvoiceType, HeaderType, InvoiceStatus, InvoiceRecord, HeaderItem } from '@/types'

/* ========== 常量 ========== */

const tabs: { label: string; value: TabValue }[] = [
  { label: '待开票', value: 'pending' },
  { label: '已开票', value: 'issued' },
  { label: '已红冲', value: 'reversed' },
]

const invoiceTypeOptions: { value: InvoiceType; label: string; desc: string }[] = [
  { value: 'personal_einvoice', label: '个人电子普票', desc: '无需填写企业信息' },
  { value: 'vat_general', label: '企业增值税普票', desc: '需填写公司名称及税号' },
  { value: 'vat_special', label: '企业增值税专票', desc: '需填写完整企业开票信息' },
]

const statusMap: Record<string, string> = {
  pending: '待开具',
  processing: '开具中',
  issued: '已开具',
  failed: '开具失败',
  reversed: '已红冲',
}

/* ========== 响应式状态 ========== */

const currentTab = ref<TabValue>('pending')
const selectedOrders = ref(new Set<string>())
const billableOrders = ref<Order[]>([])
const showHeaderManager = ref(false)
const saveHeader = ref(false)

// 发票申请表单
const invoiceForm = reactive({
  type: 'personal_einvoice' as InvoiceType,
  headerType: 'personal' as HeaderType,
  personalName: '',
  companyName: '',
  taxNumber: '',
  companyAddress: '',
  companyPhone: '',
  bankName: '',
  bankAccount: '',
  email: '',
})

// 已开票 / 已红冲 列表
const issuedList = ref<InvoiceRecord[]>([])
const reversedList = ref<InvoiceRecord[]>([])

// 常用抬头
const savedHeaders = ref<HeaderItem[]>([])
const editingHeader = ref<HeaderItem | null>(null)

/* ========== 计算属性 ========== */

const selectedTotal = computed(() => {
  let total = 0
  billableOrders.value.forEach(o => {
    if (selectedOrders.value.has(o.id)) total += o.totalAmount
  })
  return total
})

const isAllSelected = computed(() => {
  return billableOrders.value.length > 0 && selectedOrders.value.size === billableOrders.value.length
})

const canSubmit = computed(() => {
  if (selectedOrders.value.size === 0) return false
  if (!invoiceForm.email || !invoiceForm.email.includes('@')) return false

  if (invoiceForm.headerType === 'company') {
    if (!invoiceForm.companyName.trim() || !invoiceForm.taxNumber.trim()) return false
    if (invoiceForm.type === 'vat_special') {
      if (!invoiceForm.companyAddress.trim()) return false
      if (!invoiceForm.companyPhone.trim()) return false
      if (!invoiceForm.bankName.trim()) return false
      if (!invoiceForm.bankAccount.trim()) return false
    }
  }
  return true
})

const canSaveHeader = computed(() => {
  return editingHeader.value && editingHeader.value.companyName.trim() && editingHeader.value.taxNumber.trim()
})

/* ========== Tab 切换 ========== */

function switchTab(tab: TabValue) {
  currentTab.value = tab
  if (tab === 'issued') loadIssuedInvoices()
  if (tab === 'reversed') loadReversedInvoices()
}

/* ========== 订单多选 ========== */

function toggleOrder(orderId: string) {
  const s = new Set(selectedOrders.value)
  if (s.has(orderId)) s.delete(orderId)
  else s.add(orderId)
  selectedOrders.value = s
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedOrders.value = new Set()
  } else {
    selectedOrders.value = new Set(billableOrders.value.map(o => o.id))
  }
}

/* ========== 发票申请提交 ========== */

async function handleSubmitInvoice() {
  if (!canSubmit.value) return

  try {
    await api.submitInvoice({
      orderIds: Array.from(selectedOrders.value),
      type: invoiceForm.type,
      headerType: invoiceForm.headerType,
      email: invoiceForm.email,
      title: invoiceForm.headerType === 'personal'
        ? (invoiceForm.personalName || '个人')
        : invoiceForm.companyName,
      taxNumber: invoiceForm.headerType === 'company' ? invoiceForm.taxNumber : undefined,
      companyAddress: invoiceForm.type === 'vat_special' ? invoiceForm.companyAddress : undefined,
      companyPhone: invoiceForm.type === 'vat_special' ? invoiceForm.companyPhone : undefined,
      bankName: invoiceForm.type === 'vat_special' ? invoiceForm.bankName : undefined,
      bankAccount: invoiceForm.type === 'vat_special' ? invoiceForm.bankAccount : undefined,
    })

    // 如果勾选了保存抬头且是企业类型
    if (saveHeader.value && invoiceForm.headerType === 'company') {
      const newHeader: HeaderItem = {
        id: Date.now().toString(),
        companyName: invoiceForm.companyName,
        taxNumber: invoiceForm.taxNumber,
        address: invoiceForm.companyAddress,
        phone: invoiceForm.companyPhone,
        bankName: invoiceForm.bankName,
        bankAccount: invoiceForm.bankAccount,
      }
      savedHeaders.value.push(newHeader)
      uni.setStorageSync('invoice_headers', savedHeaders.value)
    }

    uni.showToast({ title: '开票申请已提交', icon: 'success' })

    // 重置表单
    selectedOrders.value = new Set()
    invoiceForm.email = ''
    invoiceForm.personalName = ''
    invoiceForm.companyName = ''
    invoiceForm.taxNumber = ''
    invoiceForm.companyAddress = ''
    invoiceForm.companyPhone = ''
    invoiceForm.bankName = ''
    invoiceForm.bankAccount = ''
    saveHeader.value = false

    // 刷新待开票列表
    loadBillableOrders()
  } catch (e) {
    // api 层已处理 toast
  }
}

/* ========== 已开票操作 ========== */

function viewPdf(inv: InvoiceRecord) {
  if (inv.pdfUrl) {
    uni.downloadFile({
      url: inv.pdfUrl,
      success(res) {
        if (res.statusCode === 200) {
          uni.openDocument({
            filePath: res.tempFilePath,
            fileType: 'pdf',
            fail() {
              uni.showToast({ title: '无法打开PDF', icon: 'none' })
            },
          })
        }
      },
      fail() {
        uni.showToast({ title: '下载失败', icon: 'none' })
      },
    })
  } else {
    uni.showToast({ title: '暂无PDF文件', icon: 'none' })
  }
}

async function sendToEmail(inv: InvoiceRecord) {
  uni.showModal({
    title: '发送发票',
    content: '将发票PDF发送到您的邮箱？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await api.submitInvoice({ invoiceId: inv.id, action: 'resend_email' } as any)
          uni.showToast({ title: '已发送至邮箱', icon: 'success' })
        } catch (e) {
          uni.showToast({ title: '发送失败', icon: 'none' })
        }
      }
    },
  })
}

function downloadInvoice(inv: InvoiceRecord) {
  if (inv.pdfUrl) {
    uni.downloadFile({
      url: inv.pdfUrl,
      success(res) {
        if (res.statusCode === 200) {
          uni.saveFile({
            tempFilePath: res.tempFilePath,
            success(saveRes) {
              uni.showToast({ title: '已保存到本地', icon: 'success' })
            },
            fail() {
              uni.showToast({ title: '保存失败', icon: 'none' })
            },
          })
        }
      },
      fail() {
        uni.showToast({ title: '下载失败', icon: 'none' })
      },
    })
  } else {
    uni.showToast({ title: '暂无可下载文件', icon: 'none' })
  }
}

/* ========== 常用抬头管理 ========== */

function applyHeader(h: HeaderItem) {
  invoiceForm.headerType = 'company'
  invoiceForm.companyName = h.companyName
  invoiceForm.taxNumber = h.taxNumber
  invoiceForm.companyAddress = h.address || ''
  invoiceForm.companyPhone = h.phone || ''
  invoiceForm.bankName = h.bankName || ''
  invoiceForm.bankAccount = h.bankAccount || ''
  uni.showToast({ title: '已填入抬头信息', icon: 'success' })
}

function startAddHeader() {
  editingHeader.value = {
    id: '',
    companyName: '',
    taxNumber: '',
    address: '',
    phone: '',
    bankName: '',
    bankAccount: '',
  }
}

function startEditHeader(h: HeaderItem) {
  editingHeader.value = { ...h }
}

function saveHeaderItem() {
  if (!editingHeader.value || !canSaveHeader.value) return

  if (editingHeader.value.id) {
    // 编辑
    const idx = savedHeaders.value.findIndex(h => h.id === editingHeader.value!.id)
    if (idx >= 0) savedHeaders.value[idx] = { ...editingHeader.value }
  } else {
    // 新增
    savedHeaders.value.push({ ...editingHeader.value, id: Date.now().toString() })
  }

  uni.setStorageSync('invoice_headers', savedHeaders.value)
  editingHeader.value = null
  uni.showToast({ title: '保存成功', icon: 'success' })
}

function deleteHeader(id: string) {
  uni.showModal({
    title: '确认删除',
    content: '确定删除该常用抬头？',
    success(res) {
      if (res.confirm) {
        savedHeaders.value = savedHeaders.value.filter(h => h.id !== id)
        uni.setStorageSync('invoice_headers', savedHeaders.value)
        uni.showToast({ title: '已删除', icon: 'success' })
      }
    },
  })
}

/* ========== 数据加载 ========== */

async function loadBillableOrders() {
  try {
    const orders = await api.getOrders()
    const list = Array.isArray(orders) ? orders : []
    billableOrders.value = list.filter((o: Order) => o.status === 'completed' || o.status === 'paid')
  } catch (e) {
    billableOrders.value = []
  }
}

async function loadIssuedInvoices() {
  try {
    const data = await api.getInvoices()
    if (Array.isArray(data)) {
      issuedList.value = data.filter((inv: InvoiceRecord) => inv.status === 'issued')
    }
  } catch (e) {
    issuedList.value = []
  }
}

async function loadReversedInvoices() {
  try {
    const data = await api.getInvoices()
    if (Array.isArray(data)) {
      reversedList.value = data.filter((inv: InvoiceRecord) => inv.status === 'reversed')
    }
  } catch (e) {
    reversedList.value = []
  }
}

function loadSavedHeaders() {
  const stored = uni.getStorageSync('invoice_headers')
  if (Array.isArray(stored)) {
    savedHeaders.value = stored as HeaderItem[]
  }
}

/* ========== 生命周期 ========== */

onMounted(() => {
  loadBillableOrders()
  loadSavedHeaders()
})
</script>

<style scoped>
.invoice-page {
  min-height: 100vh;
  background: #F6F7FB;
  padding-bottom: 120rpx;
}

/* ===== Tab 栏 ===== */
.tab-bar {
  display: flex;
  background: #fff;
  padding: 0 24rpx;
  position: sticky;
  top: 0;
  z-index: 10;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 0 16rpx;
  position: relative;
}

.tab-text {
  font-size: 28rpx;
  color: #666;
  transition: color 0.2s;
}

.tab-item.active .tab-text {
  color: #07C160;
  font-weight: 600;
}

.tab-indicator {
  width: 48rpx;
  height: 6rpx;
  background: #07C160;
  border-radius: 3rpx;
  margin-top: 8rpx;
}

/* ===== 内容区 ===== */
.tab-content {
  padding: 24rpx;
}

/* ===== 卡片 ===== */
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.card-header .card-title {
  margin-bottom: 0;
}

/* ===== 全选 ===== */
.select-all {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.select-all-text {
  font-size: 24rpx;
  color: #666;
}

/* ===== 勾选框 ===== */
.check-box {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #d0d0d0;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
}

.check-box.small {
  width: 32rpx;
  height: 32rpx;
  border-radius: 6rpx;
}

.check-box.checked {
  background: #07C160;
  border-color: #07C160;
}

.check-icon {
  color: #fff;
  font-size: 22rpx;
  font-weight: bold;
}

/* ===== 订单列表 ===== */
.order-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 16rpx;
  border: 2rpx solid #f0f0f0;
  border-radius: 12rpx;
  transition: all 0.15s;
}

.order-item.checked {
  border-color: #07C160;
  background: #F0FFF4;
}

.order-info {
  flex: 1;
  min-width: 0;
}

.order-station {
  font-size: 28rpx;
  color: #333;
  display: block;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-meta {
  font-size: 22rpx;
  color: #999;
  display: block;
  margin-top: 6rpx;
}

.order-amount {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  flex-shrink: 0;
}

/* ===== 选择合计栏 ===== */
.selection-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f5f5f5;
}

.selection-count {
  font-size: 24rpx;
  color: #666;
}

.selection-total {
  font-size: 28rpx;
  font-weight: 600;
  color: #07C160;
}

/* ===== 表单区域 ===== */
.form-section {
  margin-bottom: 28rpx;
}

.form-label {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 16rpx;
}

/* ===== 发票类型选项 ===== */
.type-options {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.type-option {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx;
  border: 2rpx solid #e8e8e8;
  border-radius: 12rpx;
  transition: all 0.15s;
}

.type-option.active {
  border-color: #07C160;
  background: #F0FFF4;
}

.type-radio {
  width: 36rpx;
  height: 36rpx;
  border: 2rpx solid #d0d0d0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.type-radio.checked {
  border-color: #07C160;
}

.radio-dot {
  width: 20rpx;
  height: 20rpx;
  background: #07C160;
  border-radius: 50%;
}

.type-detail {
  flex: 1;
}

.type-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  display: block;
}

.type-desc {
  font-size: 22rpx;
  color: #999;
  display: block;
  margin-top: 4rpx;
}

/* ===== 抬头类型切换 ===== */
.header-type-toggle {
  display: flex;
  gap: 0;
  background: #f5f5f5;
  border-radius: 10rpx;
  padding: 4rpx;
  margin-bottom: 20rpx;
}

.toggle-btn {
  flex: 1;
  text-align: center;
  padding: 14rpx 0;
  border-radius: 8rpx;
  transition: all 0.2s;
}

.toggle-btn.active {
  background: #07C160;
}

.toggle-text {
  font-size: 26rpx;
  color: #666;
}

.toggle-btn.active .toggle-text {
  color: #fff;
  font-weight: 500;
}

/* ===== 表单字段 ===== */
.form-fields {
  margin-top: 8rpx;
}

.field-row {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.field-label {
  font-size: 26rpx;
  color: #666;
  width: 180rpx;
  flex-shrink: 0;
}

.field-label.required::before {
  content: '*';
  color: #FF4D4F;
  margin-right: 4rpx;
}

.field-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  border: none;
  background: transparent;
  padding: 0;
}

/* ===== 常用抬头快捷选择 ===== */
.quick-headers {
  margin-bottom: 16rpx;
}

.quick-label {
  font-size: 22rpx;
  color: #999;
  display: block;
  margin-bottom: 12rpx;
}

.quick-scroll {
  white-space: nowrap;
}

.quick-list {
  display: flex;
  gap: 12rpx;
}

.quick-chip {
  display: inline-flex;
  padding: 10rpx 20rpx;
  background: #F0FFF4;
  border: 1rpx solid #B7EB8F;
  border-radius: 24rpx;
  flex-shrink: 0;
}

.quick-chip-text {
  font-size: 22rpx;
  color: #07C160;
  white-space: nowrap;
}

/* ===== 保存抬头 ===== */
.save-header-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 24rpx;
}

.save-header-text {
  font-size: 24rpx;
  color: #666;
}

/* ===== 按钮 ===== */
.submit-btn {
  background: #07C160;
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
  border-radius: 12rpx;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  border: none;
  width: 100%;
}

.submit-btn.disabled {
  background: #ccc;
  color: #999;
}

/* ===== 发票卡片（已开票/已红冲）===== */
.invoice-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.invoice-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.invoice-card.reversed {
  border-left: 6rpx solid #FF4D4F;
}

.invoice-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.invoice-title-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 16rpx;
}

.invoice-status-badge {
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  flex-shrink: 0;
}

.invoice-status-badge.issued {
  background: #F0FFF4;
}

.invoice-status-badge.processing {
  background: #E6F7FF;
}

.invoice-status-badge.pending {
  background: #FFF7E6;
}

.invoice-status-badge.failed {
  background: #FFF2F0;
}

.invoice-status-badge.reversed {
  background: #FFF2F0;
}

.status-text {
  font-size: 22rpx;
}

.invoice-status-badge.issued .status-text {
  color: #52C41A;
}

.invoice-status-badge.processing .status-text {
  color: #1677FF;
}

.invoice-status-badge.pending .status-text {
  color: #FAAD14;
}

.invoice-status-badge.failed .status-text,
.invoice-status-badge.reversed .status-text {
  color: #FF4D4F;
}

.invoice-amount-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f5f5f5;
  margin-bottom: 12rpx;
}

.invoice-amount-label {
  font-size: 24rpx;
  color: #999;
}

.invoice-amount-value {
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
  font-family: 'DIN Alternate', monospace;
}

.invoice-amount-value.reversed {
  color: #FF4D4F;
}

.invoice-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6rpx 0;
}

.detail-label {
  font-size: 24rpx;
  color: #999;
}

.detail-value {
  font-size: 24rpx;
  color: #666;
}

.invoice-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  margin-top: 20rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f5f5f5;
}

.action-btn {
  padding: 10rpx 24rpx;
  border: 1rpx solid #e8e8e8;
  border-radius: 24rpx;
}

.action-btn.primary {
  border-color: #07C160;
}

.action-text {
  font-size: 24rpx;
  color: #666;
}

.action-text.primary {
  color: #07C160;
}

/* ===== 空状态 ===== */
.empty-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 80rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.empty-sub {
  font-size: 22rpx;
  color: #ccc;
}

/* ===== 弹窗 ===== */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
  display: flex;
  align-items: flex-end;
}

.modal-content {
  width: 100%;
  max-height: 85vh;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 32rpx;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.modal-close {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-icon {
  font-size: 40rpx;
  color: #999;
}

/* ===== 抬头管理列表 ===== */
.header-list-area {
  max-height: 60vh;
  overflow-y: auto;
}

.empty-headers {
  padding: 60rpx 0;
  text-align: center;
}

.header-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.header-item-info {
  flex: 1;
  min-width: 0;
}

.header-company {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-tax {
  font-size: 22rpx;
  color: #999;
  display: block;
  margin-top: 4rpx;
}

.header-item-actions {
  display: flex;
  gap: 20rpx;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.hdr-action {
  padding: 8rpx 16rpx;
}

.hdr-action-text {
  font-size: 24rpx;
  color: #07C160;
}

.hdr-action-text.danger {
  color: #FF4D4F;
}

.add-header-btn {
  margin-top: 24rpx;
  background: #F0FFF4;
  color: #07C160;
  font-size: 28rpx;
  border: 1rpx dashed #07C160;
  border-radius: 12rpx;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
}

/* ===== 编辑抬头表单 ===== */
.header-form-area {
  max-height: 65vh;
  overflow-y: auto;
}

.form-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 32rpx;
}

.cancel-btn {
  flex: 1;
  background: #f5f5f5;
  color: #666;
  font-size: 28rpx;
  border-radius: 12rpx;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border: none;
}

.save-btn {
  flex: 1;
  background: #07C160;
  color: #fff;
  font-size: 28rpx;
  border-radius: 12rpx;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border: none;
}

.save-btn[disabled] {
  background: #ccc;
  color: #999;
}

/* ===== 底部管理入口 ===== */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  text-align: center;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.06);
  z-index: 5;
}

.bottom-bar-text {
  font-size: 28rpx;
  color: #07C160;
  font-weight: 500;
}
</style>
