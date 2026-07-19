<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { usePricingStore } from '@/store/pricing'
import { PricingStrategyType, PricingStrategyStatus, DeviceType } from '@/types'
import type { PricingStrategy, StationPricingOverride } from '@/types'
import type { FormInstance, FormRules } from 'element-plus'

const pricingStore = usePricingStore()
const strategyFormRef = ref<FormInstance>()

onMounted(() => {
  pricingStore.fetchList()
  pricingStore.fetchStationList()
})

const strategyTypeMap: Record<string, { label: string; type: string }> = {
  [PricingStrategyType.UNIFORM]: { label: '统一电价', type: '' },
  [PricingStrategyType.TIME_OF_USE]: { label: '分时电价', type: 'warning' },
  [PricingStrategyType.TIERED]: { label: '阶梯电价', type: 'success' },
}

const statusMap: Record<string, { label: string; type: string }> = {
  [PricingStrategyStatus.ACTIVE]: { label: '生效中', type: 'success' },
  [PricingStrategyStatus.INACTIVE]: { label: '已停用', type: 'info' },
}

const deviceTypeMap: Record<string, string> = {
  [DeviceType.DC]: '直流快充',
  [DeviceType.AC]: '交流慢充',
}

const periodTypeOptions = [
  { value: 'SUPER_PEAK', label: '尖峰' },
  { value: 'PEAK', label: '高峰' },
  { value: 'FLAT', label: '平段' },
  { value: 'VALLEY', label: '低谷' },
]

const periodTypeColorMap: Record<string, string> = {
  SUPER_PEAK: '#FF4D4F',
  PEAK: '#FAAD14',
  FLAT: '#1677FF',
  VALLEY: '#52C41A',
}

const showTimePeriods = computed(() => pricingStore.form.type === PricingStrategyType.TIME_OF_USE)
const showUniformFees = computed(() => pricingStore.form.type !== PricingStrategyType.TIME_OF_USE)

const strategyRules: FormRules = {
  name: [{ required: true, message: '请输入策略名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择策略类型', trigger: 'change' }],
  deviceType: [{ required: true, message: '请选择设备类型', trigger: 'change' }],
  electricityFee: [{ required: true, message: '请输入电费', trigger: 'blur' }],
  serviceFee: [{ required: true, message: '请输入服务费', trigger: 'blur' }],
}

const formatFee = (fee: number | undefined) => {
  if (fee === undefined || fee === null) return '-'
  return `¥${fee.toFixed(2)}`
}

function openCreate() {
  pricingStore.openCreateDialog()
}

function openEdit(row: any) {
  pricingStore.openEditDialog(row)
}

async function submitStrategy() {
  try {
    await strategyFormRef.value?.validate()
    await pricingStore.handleSubmit()
  } catch {
    // validation failed
  }
}
</script>

<template>
  <div class="pricing-page">
    <!-- ==================== 定价策略列表 ==================== -->
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">定价策略</span>
          <el-button type="primary" @click="openCreate">新增策略</el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="pricingStore.query" inline class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="pricingStore.query.keyword"
            placeholder="策略名称"
            clearable
            style="width: 200px"
            @keyup.enter="pricingStore.handleSearch"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="pricingStore.query.type" placeholder="全部" clearable style="width: 130px">
            <el-option label="统一电价" :value="PricingStrategyType.UNIFORM" />
            <el-option label="分时电价" :value="PricingStrategyType.TIME_OF_USE" />
            <el-option label="阶梯电价" :value="PricingStrategyType.TIERED" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备类型">
          <el-select v-model="pricingStore.query.deviceType" placeholder="全部" clearable style="width: 120px">
            <el-option label="直流快充" :value="DeviceType.DC" />
            <el-option label="交流慢充" :value="DeviceType.AC" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="pricingStore.query.status" placeholder="全部" clearable style="width: 110px">
            <el-option label="生效中" :value="PricingStrategyStatus.ACTIVE" />
            <el-option label="已停用" :value="PricingStrategyStatus.INACTIVE" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="pricingStore.handleSearch">搜索</el-button>
          <el-button @click="pricingStore.handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 策略数据表 -->
      <el-table :data="pricingStore.list" v-loading="pricingStore.loading" stripe border>
        <el-table-column prop="name" label="策略名称" min-width="140" show-overflow-tooltip />
        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="(strategyTypeMap[row.type]?.type as any)" size="small">
              {{ strategyTypeMap[row.type]?.label || row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="设备类型" width="100" align="center">
          <template #default="{ row }">
            {{ deviceTypeMap[row.deviceType] || row.deviceType }}
          </template>
        </el-table-column>
        <el-table-column label="电费(元/kWh)" width="120" align="right">
          <template #default="{ row }">
            <span class="font-number">
              {{ row.type === PricingStrategyType.TIME_OF_USE ? '见分时配置' : formatFee(row.electricityFee) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="服务费(元/kWh)" width="120" align="right">
          <template #default="{ row }">
            <span class="font-number">{{ formatFee(row.serviceFee) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="stationCount" label="适用站点" width="100" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="(statusMap[row.status]?.type as any)" size="small">
              {{ statusMap[row.status]?.label || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
            <el-button type="primary" link size="small" @click="pricingStore.fetchDetail(row.id)">详情</el-button>
            <el-button
              :type="row.status === PricingStrategyStatus.ACTIVE ? 'warning' : 'success'"
              link size="small"
              @click="pricingStore.handleToggleStatus(row as unknown as PricingStrategy)"
            >
              {{ row.status === PricingStrategyStatus.ACTIVE ? '停用' : '启用' }}
            </el-button>
            <el-button type="danger" link size="small" @click="pricingStore.handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pricingStore.query.page"
          v-model:page-size="pricingStore.query.size"
          :total="pricingStore.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="pricingStore.handlePageChange"
          @size-change="pricingStore.handleSizeChange"
        />
      </div>
    </el-card>

    <!-- ==================== 站点定价覆盖 ==================== -->
    <el-card shadow="never">
      <template #header>
        <span class="card-title">站点定价</span>
      </template>

      <el-form :model="pricingStore.stationQuery" inline class="search-form">
        <el-form-item label="站点名称">
          <el-input
            v-model="pricingStore.stationQuery.keyword"
            placeholder="搜索站点名称"
            clearable
            style="width: 200px"
            @keyup.enter="pricingStore.handleStationSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="pricingStore.handleStationSearch">搜索</el-button>
          <el-button @click="pricingStore.handleStationReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="pricingStore.stationList" v-loading="pricingStore.stationLoading" stripe border>
        <el-table-column prop="stationName" label="充电站" min-width="160" show-overflow-tooltip />
        <el-table-column prop="strategyName" label="当前策略" width="120" />
        <el-table-column label="策略电费" width="110" align="right">
          <template #default="{ row }">
            <span class="font-number">{{ formatFee(row.electricityFee) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="策略服务费" width="110" align="right">
          <template #default="{ row }">
            <span class="font-number">{{ formatFee(row.serviceFee) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="覆盖电费" width="110" align="right">
          <template #default="{ row }">
            <span class="font-number" :class="{ 'text-override': row.overrideElectricityFee !== undefined }">
              {{ row.overrideElectricityFee !== undefined ? formatFee(row.overrideElectricityFee) : '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="覆盖服务费" width="110" align="right">
          <template #default="{ row }">
            <span class="font-number" :class="{ 'text-override': row.overrideServiceFee !== undefined }">
              {{ row.overrideServiceFee !== undefined ? formatFee(row.overrideServiceFee) : '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="生效综合电价" width="130" align="right">
          <template #default="{ row }">
            <span class="font-number amount">{{ formatFee(row.effectiveFee) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="pricingStore.openStationOverride(row as unknown as StationPricingOverride)">变更策略</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pricingStore.stationQuery.page"
          v-model:page-size="pricingStore.stationQuery.size"
          :total="pricingStore.stationTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="pricingStore.handleStationPageChange"
          @size-change="pricingStore.handleStationSizeChange"
        />
      </div>
    </el-card>

    <!-- ==================== 策略新增/编辑弹窗 ==================== -->
    <el-dialog
      v-model="pricingStore.dialogVisible"
      :title="pricingStore.isEdit ? '编辑定价策略' : '新增定价策略'"
      width="720px"
      destroy-on-close
    >
      <el-form
        ref="strategyFormRef"
        :model="pricingStore.form"
        :rules="strategyRules"
        label-width="110px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="策略名称" prop="name">
              <el-input v-model="pricingStore.form.name" placeholder="如：峰谷电价策略" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备类型" prop="deviceType">
              <el-select v-model="pricingStore.form.deviceType" style="width: 100%">
                <el-option label="直流快充" :value="DeviceType.DC" />
                <el-option label="交流慢充" :value="DeviceType.AC" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="策略类型" prop="type">
              <el-select v-model="pricingStore.form.type" style="width: 100%">
                <el-option label="统一电价" :value="PricingStrategyType.UNIFORM" />
                <el-option label="分时电价" :value="PricingStrategyType.TIME_OF_USE" />
                <el-option label="阶梯电价" :value="PricingStrategyType.TIERED" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="pricingStore.form.status" style="width: 100%">
                <el-option label="生效中" :value="PricingStrategyStatus.ACTIVE" />
                <el-option label="已停用" :value="PricingStrategyStatus.INACTIVE" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 统一/阶梯电价基础费用 -->
        <template v-if="showUniformFees">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="电费(元/kWh)" prop="electricityFee">
                <el-input-number v-model="pricingStore.form.electricityFee" :min="0" :max="10" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="服务费(元/kWh)" prop="serviceFee">
                <el-input-number v-model="pricingStore.form.serviceFee" :min="0" :max="10" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <!-- 分时电价时段配置 -->
        <template v-if="showTimePeriods">
          <el-divider content-position="left">分时电价时段配置</el-divider>
          <div v-for="(period, index) in pricingStore.form.timePeriods" :key="index" class="time-period-row">
            <el-row :gutter="12" align="middle">
              <el-col :span="5">
                <el-form-item label="时段类型" label-width="70px">
                  <el-select v-model="period.periodType" style="width: 100%">
                    <el-option
                      v-for="opt in periodTypeOptions"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="开始" label-width="45px">
                  <el-time-select v-model="period.startTime" start="00:00" step="00:30" end="23:30" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="结束" label-width="45px">
                  <el-time-select v-model="period.endTime" start="00:00" step="00:30" end="23:30" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="电费" label-width="45px">
                  <el-input-number v-model="period.electricityFee" :min="0" :max="10" :precision="2" controls-position="right" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="服务费" label-width="50px">
                  <el-input-number v-model="period.serviceFee" :min="0" :max="10" :precision="2" controls-position="right" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="3" class="row-actions">
                <el-button
                  v-if="pricingStore.form.timePeriods.length > 1"
                  type="danger"
                  :icon="'Delete'"
                  circle
                  size="small"
                  @click="pricingStore.removeTimePeriod(index)"
                />
                <el-button
                  v-if="index === pricingStore.form.timePeriods.length - 1"
                  type="primary"
                  :icon="'Plus'"
                  circle
                  size="small"
                  @click="pricingStore.addTimePeriod()"
                />
              </el-col>
            </el-row>
          </div>
        </template>

        <!-- 会员折扣配置 -->
        <el-divider content-position="left">会员折扣配置</el-divider>
        <div v-for="(discount, index) in pricingStore.form.memberDiscounts" :key="index" class="discount-row">
          <el-row :gutter="12" align="middle">
            <el-col :span="7">
              <el-form-item label="会员等级" label-width="70px">
                <el-input v-model="discount.level" placeholder="如：普通会员" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="折扣率" label-width="60px">
                <el-input-number v-model="discount.discountRate" :min="0" :max="1" :step="0.05" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="7">
              <el-form-item label="说明" label-width="45px">
                <el-input v-model="discount.description" placeholder="如：9.5折优惠" />
              </el-form-item>
            </el-col>
            <el-col :span="4" class="row-actions">
              <el-button
                v-if="pricingStore.form.memberDiscounts.length > 1"
                type="danger"
                :icon="'Delete'"
                circle
                size="small"
                @click="pricingStore.removeMemberDiscount(index)"
              />
              <el-button
                v-if="index === pricingStore.form.memberDiscounts.length - 1"
                type="primary"
                :icon="'Plus'"
                circle
                size="small"
                @click="pricingStore.addMemberDiscount()"
              />
            </el-col>
          </el-row>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="pricingStore.dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="pricingStore.loading" @click="submitStrategy">
          {{ pricingStore.isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- ==================== 策略详情弹窗 ==================== -->
    <el-dialog
      v-model="pricingStore.detailVisible"
      title="策略详情"
      width="600px"
      destroy-on-close
    >
      <template v-if="pricingStore.currentStrategy">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="策略名称">{{ pricingStore.currentStrategy.name }}</el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag :type="(strategyTypeMap[pricingStore.currentStrategy.type]?.type as any)" size="small">
              {{ strategyTypeMap[pricingStore.currentStrategy.type]?.label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="设备类型">
            {{ deviceTypeMap[pricingStore.currentStrategy.deviceType] }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="(statusMap[pricingStore.currentStrategy.status]?.type as any)" size="small">
              {{ statusMap[pricingStore.currentStrategy.status]?.label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="电费">
            {{ pricingStore.currentStrategy.type === PricingStrategyType.TIME_OF_USE
              ? '见分时配置'
              : formatFee(pricingStore.currentStrategy.electricityFee) + '/kWh'
            }}
          </el-descriptions-item>
          <el-descriptions-item label="服务费">
            {{ formatFee(pricingStore.currentStrategy.serviceFee) }}/kWh
          </el-descriptions-item>
          <el-descriptions-item label="适用站点" :span="2">
            {{ pricingStore.currentStrategy.stationCount }} 个站点
          </el-descriptions-item>
        </el-descriptions>

        <!-- 分时详情表 -->
        <template v-if="pricingStore.currentStrategy.timePeriods.length > 0">
          <el-divider content-position="left">分时电价时段</el-divider>
          <el-table :data="pricingStore.currentStrategy.timePeriods" stripe border size="small">
            <el-table-column label="时段" width="80">
              <template #default="{ row }">
                <el-tag
                  :color="periodTypeColorMap[row.periodType]"
                  style="color: #fff"
                  size="small"
                >
                  {{ periodTypeOptions.find((o) => o.value === row.periodType)?.label || row.periodType }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="时间范围">
              <template #default="{ row }">{{ row.startTime }} - {{ row.endTime }}</template>
            </el-table-column>
            <el-table-column label="电费(元/kWh)" width="120" align="right">
              <template #default="{ row }">
                <span class="font-number" :style="{ color: periodTypeColorMap[row.periodType], fontWeight: 'bold' }">
                  {{ formatFee(row.electricityFee) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="服务费(元/kWh)" width="120" align="right">
              <template #default="{ row }">
                <span class="font-number">{{ formatFee(row.serviceFee) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </template>

        <!-- 会员折扣详情 -->
        <template v-if="pricingStore.currentStrategy.memberDiscounts.length > 0">
          <el-divider content-position="left">会员折扣</el-divider>
          <el-table :data="pricingStore.currentStrategy.memberDiscounts" stripe border size="small">
            <el-table-column prop="level" label="会员等级" width="120" />
            <el-table-column label="折扣率" width="100" align="center">
              <template #default="{ row }">{{ (row.discountRate * 100).toFixed(0) }}%</template>
            </el-table-column>
            <el-table-column prop="description" label="说明" />
          </el-table>
        </template>
      </template>

      <template #footer>
        <el-button @click="pricingStore.detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- ==================== 站点定价覆盖弹窗 ==================== -->
    <el-dialog
      v-model="pricingStore.stationDialogVisible"
      title="站点定价覆盖"
      width="480px"
      destroy-on-close
    >
      <template v-if="pricingStore.currentStationPricing">
        <el-alert
          :closable="false"
          type="info"
          style="margin-bottom: 16px"
        >
          当前站点: <strong>{{ pricingStore.currentStationPricing.stationName }}</strong>
          ，关联策略: <strong>{{ pricingStore.currentStationPricing.strategyName }}</strong>
        </el-alert>
        <el-form label-width="110px">
          <el-form-item label="覆盖电费">
            <el-input-number
              v-model="pricingStore.stationOverrideForm.overrideElectricityFee"
              :min="0"
              :max="10"
              :precision="2"
              style="width: 100%"
            />
            <div class="form-tip">留空则使用策略默认电费: {{ formatFee(pricingStore.currentStationPricing.electricityFee) }}</div>
          </el-form-item>
          <el-form-item label="覆盖服务费">
            <el-input-number
              v-model="pricingStore.stationOverrideForm.overrideServiceFee"
              :min="0"
              :max="10"
              :precision="2"
              style="width: 100%"
            />
            <div class="form-tip">留空则使用策略默认服务费: {{ formatFee(pricingStore.currentStationPricing.serviceFee) }}</div>
          </el-form-item>
        </el-form>
      </template>

      <template #footer>
        <el-button @click="pricingStore.stationDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="pricingStore.stationLoading" @click="pricingStore.handleStationOverrideSubmit">
          确认覆盖
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.pricing-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
}
.search-form {
  margin-bottom: 16px;
}
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.amount {
  color: #FF4D4F;
  font-weight: bold;
}
.text-override {
  color: #FAAD14;
  font-weight: 600;
}
.text-success {
  color: #52C41A;
}
.time-period-row,
.discount-row {
  padding: 8px 0;
  border-bottom: 1px dashed #ebeef5;
}
.time-period-row:last-child,
.discount-row:last-child {
  border-bottom: none;
}
.row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.form-tip {
  font-size: 12px;
  color: #999;
  line-height: 1.5;
  margin-top: 4px;
}
</style>
