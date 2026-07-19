<script setup lang="ts">
import { onMounted, computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, PieChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { useFinanceStore } from '@/store/finance'
import type { Settlement } from '@/store/finance'

use([CanvasRenderer, BarChart, PieChart, LineChart, GridComponent, TooltipComponent, LegendComponent])

const store = useFinanceStore()

// ==================== 格式化工具 ====================

function fmtMoney(cents: number): string {
  return (cents / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtEnergy(wh: number): string {
  return (wh / 1000).toFixed(2)
}

// ==================== 图表配置（全部基于 API 数据） ====================

const revenueChart = computed(() => {
  const trend = store.revenueTrend
  const labels = trend.map(d => d.date)
  const elecData = trend.map(d => d.electricityRevenue)
  const svcData = trend.map(d => d.serviceRevenue)

  return {
    tooltip: {
      trigger: 'axis' as const,
      valueFormatter: (val: number) => `¥${fmtMoney(val)}`,
    },
    legend: { data: ['电费收入', '服务费收入'], bottom: 0 },
    grid: { left: 60, right: 20, top: 20, bottom: 40 },
    xAxis: { type: 'category' as const, data: labels, boundaryGap: true },
    yAxis: { type: 'value' as const, name: '元', axisLabel: { formatter: (v: number) => `¥${(v / 100).toFixed(0)}` } },
    series: [
      {
        name: '电费收入',
        type: 'bar' as const,
        stack: 'revenue',
        data: elecData,
        itemStyle: { color: '#1677FF' },
        barMaxWidth: 32,
      },
      {
        name: '服务费收入',
        type: 'bar' as const,
        stack: 'revenue',
        data: svcData,
        itemStyle: { color: '#4096FF' },
        barMaxWidth: 32,
      },
    ],
  }
})

const channelColors: Record<string, string> = {
  WECHAT: '#07C160',
  ALIPAY: '#1677FF',
  BALANCE: '#FAAD14',
  UNIONPAY: '#FF4D4F',
}

const channelChart = computed(() => {
  const channels = store.paymentChannels
  if (!channels.length) {
    return { tooltip: { trigger: 'item' as const }, series: [] }
  }
  return {
    tooltip: {
      trigger: 'item' as const,
      valueFormatter: (val: number) => `¥${fmtMoney(val)}`,
    },
    series: [{
      type: 'pie' as const,
      radius: ['40%', '70%'],
      avoidLabelOverlap: true,
      label: { show: true, formatter: '{b}\n{d}%' },
      data: channels.map(ch => ({
        value: ch.amount,
        name: ch.name,
        itemStyle: { color: channelColors[ch.channel] || '#999' },
      })),
    }],
  }
})

// ==================== 状态映射 ====================

const billStatusColors: Record<string, string> = {
  '已入账': 'success',
  '待结算': 'warning',
  '已退款': 'info',
  '已结算': 'success',
  '待支付': 'warning',
}

const settlementStatusMap: Record<string, { label: string; type: string }> = {
  PENDING: { label: '待确认', type: 'warning' },
  CONFIRMED: { label: '已确认', type: 'primary' },
  PAID: { label: '已打款', type: 'success' },
  REJECTED: { label: '已驳回', type: 'danger' },
}

const invoiceStatusMap: Record<string, { label: string; type: string }> = {
  PENDING: { label: '待开票', type: 'info' },
  ISSUED: { label: '已开票', type: 'success' },
  SENT: { label: '已寄出', type: 'primary' },
  REVOKED: { label: '已作废', type: 'danger' },
}

const invoiceTypeMap: Record<string, string> = {
  NORMAL: '普通发票',
  SPECIAL: '专用发票',
}

const fundFlowTypeMap: Record<string, { label: string; type: string }> = {
  INCOME: { label: '充电收入', type: 'success' },
  REFUND: { label: '退款', type: 'danger' },
  SETTLEMENT: { label: '结算支出', type: 'warning' },
  PLATFORM_FEE: { label: '平台服务费', type: 'primary' },
  WITHDRAWAL: { label: '提现', type: 'info' },
}

const fundFlowTypeOptions = [
  { label: '全部', value: '' },
  { label: '充电收入', value: 'INCOME' },
  { label: '退款', value: 'REFUND' },
  { label: '结算支出', value: 'SETTLEMENT' },
  { label: '平台服务费', value: 'PLATFORM_FEE' },
  { label: '提现', value: 'WITHDRAWAL' },
]

// ==================== 交互 ====================

function handlePeriodChange(val: string | number | boolean | undefined) {
  store.updateDateRange(String(val ?? ''))
  store.fetchSummary()
  store.fetchRevenueTrend()
  store.fetchPaymentChannels()
  // Reset pagination and reload the active tab data
  switch (store.activeTab) {
    case 'bills': store.fetchBills(); break
    case 'settlements': store.fetchSettlements(); break
    case 'invoices': store.fetchInvoices(); break
    case 'fundFlows': store.fetchFundFlows(); break
  }
}

function handleTabChange() {
  switch (store.activeTab) {
    case 'bills': store.fetchBills(); break
    case 'settlements': store.fetchSettlements(); break
    case 'invoices': store.fetchInvoices(); break
    case 'fundFlows': store.fetchFundFlows(); break
  }
}

function handleFundFlowTypeChange() {
  store.fundFlowsQuery.page = 1
  store.fetchFundFlows()
}

function handleSettlementSelect(rows: Settlement[]) {
  store.selectedSettlementIds = rows.map(r => r.id)
}

// ==================== 初始化 ====================

onMounted(() => {
  store.loadAll()
})
</script>

<template>
  <div class="finance-page">
    <!-- ==================== 汇总卡片 ==================== -->
    <div class="summary-grid">
      <el-card shadow="hover">
        <div class="summary-item">
          <div class="summary-label">总收入</div>
          <div class="summary-value primary">¥{{ fmtMoney(store.summary.totalRevenue) }}</div>
        </div>
      </el-card>
      <el-card shadow="hover">
        <div class="summary-item">
          <div class="summary-label">总订单数</div>
          <div class="summary-value">{{ store.summary.totalOrderCount }}</div>
        </div>
      </el-card>
      <el-card shadow="hover">
        <div class="summary-item">
          <div class="summary-label">电费收入</div>
          <div class="summary-value">¥{{ fmtMoney(store.summary.totalElectricityFee) }}</div>
        </div>
      </el-card>
      <el-card shadow="hover">
        <div class="summary-item">
          <div class="summary-label">服务费收入</div>
          <div class="summary-value">¥{{ fmtMoney(store.summary.totalServiceFee) }}</div>
        </div>
      </el-card>
      <el-card shadow="hover">
        <div class="summary-item">
          <div class="summary-label">已退款</div>
          <div class="summary-value warn">¥{{ fmtMoney(store.summary.refundAmount) }}</div>
        </div>
      </el-card>
    </div>

    <!-- ==================== 图表区 ==================== -->
    <el-row :gutter="16">
      <el-col :span="14">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>营收趋势</span>
              <el-radio-group :model-value="store.period" size="small" @update:model-value="handlePeriodChange">
                <el-radio-button value="today">今日</el-radio-button>
                <el-radio-button value="week">近7天</el-radio-button>
                <el-radio-button value="month">本月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <v-chart
            v-loading="store.loadingChart"
            :option="revenueChart"
            style="height: 300px"
            autoresize
          />
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <template #header><span>支付渠道分布</span></template>
          <v-chart
            v-loading="store.loadingChart"
            :option="channelChart"
            style="height: 300px"
            autoresize
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- ==================== 数据管理区（Tab 切换） ==================== -->
    <el-card>
      <el-tabs v-model="store.activeTab" @tab-change="handleTabChange">
        <!-- ========== 账单明细 ========== -->
        <el-tab-pane label="账单明细" name="bills">
          <div class="tab-toolbar">
            <span />
            <el-button type="primary" plain @click="store.exportBills">
              <el-icon class="el-icon--left"><i class="el-icon" /></el-icon>
              导出账单
            </el-button>
          </div>
          <el-table :data="store.bills" stripe size="small" v-loading="store.loadingBills">
            <el-table-column prop="orderNo" label="订单号" width="170" />
            <el-table-column label="用户" width="100">
              <template #default="{ row }">{{ row.userNickname || '-' }}</template>
            </el-table-column>
            <el-table-column prop="stationName" label="充电站" show-overflow-tooltip />
            <el-table-column label="电量(kWh)" width="110" align="right">
              <template #default="{ row }">
                <span class="font-number">{{ fmtEnergy(row.energyWh) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="金额" width="120" align="right">
              <template #default="{ row }">
                <span class="font-number amount">¥{{ fmtMoney(row.totalAmount) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="支付方式" width="100" align="center">
              <template #default="{ row }">{{ row.payMethod || '-' }}</template>
            </el-table-column>
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="(billStatusColors[row.status] as any)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="时间" width="160" />
          </el-table>
          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="store.billsQuery.page"
              v-model:page-size="store.billsQuery.size"
              :total="store.billsTotal"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="store.handleBillsPageChange"
              @size-change="store.handleBillsSizeChange"
            />
          </div>
        </el-tab-pane>

        <!-- ========== 结算管理 ========== -->
        <el-tab-pane label="结算管理" name="settlements">
          <div class="tab-toolbar">
            <div>
              <el-button
                type="primary"
                :disabled="!store.selectedSettlementIds.length"
                @click="store.batchInvoice"
              >
                批量开票 ({{ store.selectedSettlementIds.length }})
              </el-button>
            </div>
            <el-button type="primary" plain @click="store.exportSettlements">
              导出结算列表
            </el-button>
          </div>
          <el-table
            :data="store.settlements"
            stripe
            size="small"
            v-loading="store.loadingSettlements"
            @selection-change="handleSettlementSelect"
          >
            <el-table-column type="selection" width="45" />
            <el-table-column prop="settlementNo" label="结算单号" width="170" />
            <el-table-column prop="partyName" label="结算方" width="140" show-overflow-tooltip />
            <el-table-column prop="stationName" label="充电站" show-overflow-tooltip />
            <el-table-column label="结算周期" width="210">
              <template #default="{ row }">
                {{ row.periodStart }} ~ {{ row.periodEnd }}
              </template>
            </el-table-column>
            <el-table-column label="电费" width="110" align="right">
              <template #default="{ row }">
                <span class="font-number">¥{{ fmtMoney(row.electricityAmount) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="服务费" width="110" align="right">
              <template #default="{ row }">
                <span class="font-number">¥{{ fmtMoney(row.serviceAmount) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="平台抽成" width="110" align="right">
              <template #default="{ row }">
                <span class="font-number warn">¥{{ fmtMoney(row.platformFee) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="结算金额" width="120" align="right">
              <template #default="{ row }">
                <span class="font-number amount">¥{{ fmtMoney(row.netAmount) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="(settlementStatusMap[row.status]?.type as any)" size="small">
                  {{ settlementStatusMap[row.status]?.label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="160" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === 'PENDING'"
                  type="primary"
                  link
                  size="small"
                  @click="store.confirmSettlement(row.id)"
                >
                  确认
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="store.settlementsQuery.page"
              v-model:page-size="store.settlementsQuery.size"
              :total="store.settlementsTotal"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="store.handleSettlementsPageChange"
              @size-change="store.handleSettlementsSizeChange"
            />
          </div>
        </el-tab-pane>

        <!-- ========== 发票管理 ========== -->
        <el-tab-pane label="发票管理" name="invoices">
          <el-table :data="store.invoices" stripe size="small" v-loading="store.loadingInvoices">
            <el-table-column prop="invoiceNo" label="发票号" width="170" />
            <el-table-column prop="settlementNo" label="结算单号" width="170" />
            <el-table-column prop="partyName" label="抬头" show-overflow-tooltip />
            <el-table-column prop="taxNo" label="税号" width="170" show-overflow-tooltip />
            <el-table-column label="类型" width="100" align="center">
              <template #default="{ row }">
                {{ invoiceTypeMap[row.type] || row.type }}
              </template>
            </el-table-column>
            <el-table-column label="金额" width="120" align="right">
              <template #default="{ row }">
                <span class="font-number amount">¥{{ fmtMoney(row.amount) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="税额" width="110" align="right">
              <template #default="{ row }">
                <span class="font-number">¥{{ fmtMoney(row.taxAmount) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="(invoiceStatusMap[row.status]?.type as any)" size="small">
                  {{ invoiceStatusMap[row.status]?.label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="开票时间" width="160">
              <template #default="{ row }">{{ row.issueTime || '-' }}</template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="store.invoicesQuery.page"
              v-model:page-size="store.invoicesQuery.size"
              :total="store.invoicesTotal"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="store.handleInvoicesPageChange"
              @size-change="store.handleInvoicesSizeChange"
            />
          </div>
        </el-tab-pane>

        <!-- ========== 资金流水 ========== -->
        <el-tab-pane label="资金流水" name="fundFlows">
          <div class="tab-toolbar">
            <el-select
              v-model="store.fundFlowTypeFilter"
              placeholder="交易类型"
              clearable
              style="width: 160px"
              @change="handleFundFlowTypeChange"
            >
              <el-option
                v-for="opt in fundFlowTypeOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-button type="primary" plain @click="store.exportFundFlows">
              导出流水
            </el-button>
          </div>
          <el-table :data="store.fundFlows" stripe size="small" v-loading="store.loadingFundFlows">
            <el-table-column prop="flowNo" label="流水号" width="190" />
            <el-table-column label="类型" width="110" align="center">
              <template #default="{ row }">
                <el-tag :type="(fundFlowTypeMap[row.type]?.type as any)" size="small">
                  {{ fundFlowTypeMap[row.type]?.label || row.typeName }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="关联订单" width="170">
              <template #default="{ row }">{{ row.orderNo || '-' }}</template>
            </el-table-column>
            <el-table-column label="金额" width="120" align="right">
              <template #default="{ row }">
                <span class="font-number" :class="row.direction === 'IN' ? 'income' : 'expense'">
                  {{ row.direction === 'IN' ? '+' : '-' }}¥{{ fmtMoney(row.amount) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="余额" width="120" align="right">
              <template #default="{ row }">
                <span class="font-number">¥{{ fmtMoney(row.balanceAfter) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="支付方式" width="100" align="center">
              <template #default="{ row }">{{ row.payMethod || '-' }}</template>
            </el-table-column>
            <el-table-column prop="description" label="说明" show-overflow-tooltip />
            <el-table-column prop="createTime" label="时间" width="160" />
          </el-table>
          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="store.fundFlowsQuery.page"
              v-model:page-size="store.fundFlowsQuery.size"
              :total="store.fundFlowsTotal"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="store.handleFundFlowsPageChange"
              @size-change="store.handleFundFlowsSizeChange"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped>
.finance-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.summary-item {
  text-align: center;
  padding: 8px 0;
}

.summary-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.summary-value.primary {
  color: #1677FF;
}

.summary-value.warn {
  color: #FAAD14;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tab-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.amount {
  color: #1677FF;
  font-weight: bold;
}

.income {
  color: #52C41A;
  font-weight: bold;
}

.expense {
  color: #FF4D4F;
  font-weight: bold;
}
</style>
