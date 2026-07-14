<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const strategyDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const isEdit = ref(false)
const strategyFormRef = ref<FormInstance>()
const currentStrategy = ref<any>(null)
const strategyForm = ref({ name: '', type: '统一', basePrice: 1.2, servicePrice: 0.5 })

const strategyRules: FormRules = {
  name: [{ required: true, message: '请输入策略名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  basePrice: [{ required: true, message: '请输入电价', trigger: 'blur' }],
  servicePrice: [{ required: true, message: '请输入服务费', trigger: 'blur' }],
}

const strategies = ref([
  { id: 1, name: '标准电价', type: '统一', electricity: 1.2, service: 0.5, stations: 5, status: '生效中' },
  { id: 2, name: '峰谷电价', type: '分时', electricity: 0, service: 0.5, stations: 3, status: '生效中' },
  { id: 3, name: '会员优惠', type: '阶梯', electricity: 1.0, service: 0.3, stations: 0, status: '已停用' },
])

const timeSlots = ref([
  { label: '尖峰', time: '10:00-12:00, 14:00-17:00', price: 1.8, color: '#FF4D4F' },
  { label: '高峰', time: '08:00-10:00, 17:00-21:00', price: 1.5, color: '#FAAD14' },
  { label: '平段', time: '06:00-08:00, 12:00-14:00, 21:00-23:00', price: 1.2, color: '#1677FF' },
  { label: '低谷', time: '23:00-06:00', price: 0.6, color: '#52C41A' },
])

const stationPricing = ref([
  { station: '北京朝阳充电站', strategy: '标准电价', electricity: 1.2, service: 0.5, total: 1.7 },
  { station: '上海浦东快充站', strategy: '峰谷电价', electricity: '分时', service: 0.5, total: '-' },
  { station: '深圳南山超充站', strategy: '标准电价', electricity: 1.0, service: 0.4, total: 1.4 },
  { station: '杭州西湖慢充站', strategy: '标准电价', electricity: 0.8, service: 0.3, total: 1.1 },
])

function openCreate() {
  isEdit.value = false
  strategyForm.value = { name: '', type: '统一', basePrice: 1.2, servicePrice: 0.5 }
  strategyDialogVisible.value = true
}

function openEdit(row: any) {
  isEdit.value = true
  strategyForm.value = { ...row }
  strategyDialogVisible.value = true
}

function submitStrategy() {
  strategyFormRef.value?.validate().then(() => {
    ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
    strategyDialogVisible.value = false
  }).catch(() => {})
}

function viewStrategyDetail(strategy: any) {
  currentStrategy.value = strategy
  detailDialogVisible.value = true
}
</script>

<template>
  <div class="pricing-page">
    <!-- 电价策略 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>电价策略</span>
          <el-button type="primary" @click="openCreate">新增策略</el-button>
        </div>
      </template>
      <el-table :data="strategies" stripe border>
        <el-table-column prop="name" label="策略名称" min-width="120" />
        <el-table-column prop="type" label="类型" width="80">
          <template #default="{ row }"><el-tag size="small">{{ row.type }}</el-tag></template>
        </el-table-column>
        <el-table-column label="电价(元/kWh)" width="120" align="right">
          <template #default="{ row }"><span class="font-number">{{ row.type === '分时' ? '见分时表' : `¥${row.electricity}` }}</span></template>
        </el-table-column>
        <el-table-column label="服务费(元/kWh)" width="120" align="right">
          <template #default="{ row }"><span class="font-number">¥{{ row.service }}</span></template>
        </el-table-column>
        <el-table-column prop="stations" label="适用站点" width="100" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }"><el-tag :type="row.status === '生效中' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
            <el-button type="info" link size="small" @click="viewStrategyDetail(row)">详情</el-button>
            <el-button :type="row.status === '生效中' ? 'warning' : 'success'" link size="small">{{ row.status === '生效中' ? '停用' : '启用' }}</el-button>
            <el-button type="info" link size="small">应用到站点</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 分时电价配置 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>分时电价配置</span>
          <el-button type="primary" size="small">编辑分时</el-button>
        </div>
      </template>
      <el-table :data="timeSlots" stripe border>
        <el-table-column label="时段" width="100">
          <template #default="{ row }"><el-tag :color="row.color" style="color: #fff" size="small">{{ row.label }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="time" label="时间范围" />
        <el-table-column label="电价(元/kWh)" width="150" align="right">
          <template #default="{ row }"><span class="font-number" :style="{ color: row.color, fontWeight: 'bold' }">¥{{ row.price }}</span></template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 站点定价 -->
    <el-card>
      <template #header><span>站点定价</span></template>
      <el-table :data="stationPricing" stripe border>
        <el-table-column prop="station" label="充电站" min-width="160" />
        <el-table-column prop="strategy" label="当前策略" width="120" />
        <el-table-column label="电价" width="100" align="right">
          <template #default="{ row }"><span class="font-number">{{ typeof row.electricity === 'number' ? `¥${row.electricity}` : row.electricity }}</span></template>
        </el-table-column>
        <el-table-column label="服务费" width="100" align="right">
          <template #default="{ row }"><span class="font-number">¥{{ row.service }}</span></template>
        </el-table-column>
        <el-table-column label="综合电价" width="120" align="right">
          <template #default="{ row }"><span class="font-number amount">{{ typeof row.total === 'number' ? `¥${row.total}` : row.total }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default><el-button type="primary" link size="small">变更策略</el-button></template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 策略弹窗 -->
    <el-dialog v-model="strategyDialogVisible" :title="isEdit ? '编辑策略' : '新增策略'" width="500px">
      <el-form ref="strategyFormRef" :model="strategyForm" :rules="strategyRules" label-width="100px">
        <el-form-item label="策略名称" required><el-input v-model="strategyForm.name" /></el-form-item>
        <el-form-item label="类型" required>
          <el-radio-group v-model="strategyForm.type">
            <el-radio value="统一">统一电价</el-radio>
            <el-radio value="分时">分时电价</el-radio>
            <el-radio value="阶梯">阶梯电价</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="strategyForm.type === '统一'" label="电价(元/kWh)" required>
          <el-input-number v-model="strategyForm.basePrice" :min="0" :max="10" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="服务费(元/kWh)" required>
          <el-input-number v-model="strategyForm.servicePrice" :min="0" :max="10" :precision="2" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="strategyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitStrategy">{{ isEdit ? '更新' : '创建' }}</el-button>
      </template>
    </el-dialog>

    <!-- 策略详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="策略详情" width="500px">
      <template v-if="currentStrategy">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="策略名称">{{ currentStrategy.name }}</el-descriptions-item>
          <el-descriptions-item label="类型"><el-tag size="small">{{ currentStrategy.type }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="电价">{{ currentStrategy.type === '分时' ? '见分时表' : `¥${currentStrategy.electricity}/kWh` }}</el-descriptions-item>
          <el-descriptions-item label="服务费">¥{{ currentStrategy.service }}/kWh</el-descriptions-item>
          <el-descriptions-item label="适用站点">{{ currentStrategy.stations }} 个</el-descriptions-item>
          <el-descriptions-item label="状态"><el-tag :type="currentStrategy.status === '生效中' ? 'success' : 'info'" size="small">{{ currentStrategy.status }}</el-tag></el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.pricing-page { display: flex; flex-direction: column; gap: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.amount { color: #FF4D4F; font-weight: bold; }
</style>
