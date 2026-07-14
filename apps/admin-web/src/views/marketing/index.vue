<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const activeTab = ref('coupons')
const couponDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const isEditCoupon = ref(false)
const couponFormRef = ref<FormInstance>()
const currentCoupon = ref<any>(null)

const couponRules: FormRules = {
  name: [{ required: true, message: '请输入优惠券名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  value: [{ required: true, message: '请输入面值/折扣', trigger: 'blur' }],
  total: [{ required: true, message: '请输入发放总量', trigger: 'blur' }],
  validEnd: [{ required: true, message: '请选择有效期', trigger: 'change' }],
}

const coupons = ref([
  { id: 1, name: '新用户立减5元', type: '满减', value: '5.00', condition: '满20元可用', total: 1000, used: 234, status: '进行中', validEnd: '2026-12-31' },
  { id: 2, name: '充电8折券', type: '折扣', value: '8折', condition: '无门槛', total: 500, used: 120, status: '进行中', validEnd: '2026-09-30' },
  { id: 3, name: '周末特惠', type: '满减', value: '10.00', condition: '满50元可用', total: 200, used: 200, status: '已结束', validEnd: '2026-06-30' },
])

const couponForm = ref({ name: '', type: '满减', value: '', condition: '', total: 100, validStart: '', validEnd: '' })

const activities = ref([
  { id: 1, name: '新用户首充优惠', type: '首充', time: '2026-01-01 ~ 2026-12-31', status: '进行中', participants: 567 },
  { id: 2, name: '夏季充电节', type: '限时', time: '2026-06-01 ~ 2026-08-31', status: '进行中', participants: 1234 },
  { id: 3, name: '春节充电红包', type: '红包', time: '2026-01-20 ~ 2026-02-10', status: '已结束', participants: 890 },
])

function openCreateCoupon() {
  isEditCoupon.value = false
  couponForm.value = { name: '', type: '满减', value: '', condition: '', total: 100, validStart: '', validEnd: '' }
  couponDialogVisible.value = true
}

function openEditCoupon(row: any) {
  isEditCoupon.value = true
  couponForm.value = { ...row }
  couponDialogVisible.value = true
}

function submitCoupon() {
  couponFormRef.value?.validate().then(() => {
    ElMessage.success(isEditCoupon.value ? '更新成功' : '创建成功')
    couponDialogVisible.value = false
  }).catch(() => {})
}

function viewCouponDetail(coupon: any) {
  currentCoupon.value = coupon
  detailDialogVisible.value = true
}
</script>

<template>
  <div class="marketing-page">
    <el-card shadow="never">
      <el-tabs v-model="activeTab">
        <!-- 优惠券管理 -->
        <el-tab-pane label="优惠券管理" name="coupons">
          <div class="tab-header">
            <el-button type="primary" @click="openCreateCoupon">创建优惠券</el-button>
          </div>
          <el-table :data="coupons" stripe border>
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="name" label="优惠券名称" min-width="150" />
            <el-table-column prop="type" label="类型" width="80">
              <template #default="{ row }"><el-tag size="small" :type="row.type === '满减' ? 'info' : 'warning'">{{ row.type }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="value" label="面值/折扣" width="100" />
            <el-table-column prop="condition" label="使用条件" width="120" />
            <el-table-column label="领取/总量" width="120" align="center">
              <template #default="{ row }"><span class="font-number">{{ row.used }}/{{ row.total }}</span></template>
            </el-table-column>
            <el-table-column label="进度" width="120">
              <template #default="{ row }"><el-progress :percentage="Math.floor(row.used / row.total * 100)" :stroke-width="6" /></template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }"><el-tag :type="row.status === '进行中' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag></template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewCouponDetail(row)">详情</el-button>
                <el-button type="primary" link size="small" @click="openEditCoupon(row)">编辑</el-button>
                <el-button type="warning" link size="small">停用</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 活动管理 -->
        <el-tab-pane label="活动管理" name="activities">
          <div class="tab-header">
            <el-button type="primary">创建活动</el-button>
          </div>
          <el-table :data="activities" stripe border>
            <el-table-column prop="name" label="活动名称" min-width="150" />
            <el-table-column prop="type" label="类型" width="80">
              <template #default="{ row }"><el-tag size="small">{{ row.type }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="time" label="活动时间" width="240" />
            <el-table-column prop="participants" label="参与人数" width="100" align="center" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }"><el-tag :type="row.status === '进行中' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag></template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default>
                <el-button type="primary" link size="small">编辑</el-button>
                <el-button type="info" link size="small">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 优惠券弹窗 -->
    <el-dialog v-model="couponDialogVisible" :title="isEditCoupon ? '编辑优惠券' : '创建优惠券'" width="550px">
      <el-form ref="couponFormRef" :model="couponForm" :rules="couponRules" label-width="100px">
        <el-form-item label="优惠券名称" required><el-input v-model="couponForm.name" placeholder="请输入名称" /></el-form-item>
        <el-form-item label="类型" required>
          <el-radio-group v-model="couponForm.type">
            <el-radio value="满减">满减</el-radio>
            <el-radio value="折扣">折扣</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="couponForm.type === '满减' ? '减免金额(元)' : '折扣率'" required>
          <el-input v-model="couponForm.value" :placeholder="couponForm.type === '满减' ? '如 5.00' : '如 8'" />
        </el-form-item>
        <el-form-item label="使用条件"><el-input v-model="couponForm.condition" placeholder="如 满20元可用" /></el-form-item>
        <el-form-item label="发放总量" required><el-input-number v-model="couponForm.total" :min="1" :max="100000" style="width: 100%" /></el-form-item>
        <el-form-item label="有效期" required>
          <el-date-picker v-model="couponForm.validEnd" type="date" placeholder="选择截止日期" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="couponDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCoupon">{{ isEditCoupon ? '更新' : '创建' }}</el-button>
      </template>
    </el-dialog>

    <!-- 优惠券详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="优惠券详情" width="550px">
      <template v-if="currentCoupon">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="ID">{{ currentCoupon.id }}</el-descriptions-item>
          <el-descriptions-item label="名称">{{ currentCoupon.name }}</el-descriptions-item>
          <el-descriptions-item label="类型"><el-tag size="small" :type="currentCoupon.type === '满减' ? 'info' : 'warning'">{{ currentCoupon.type }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="面值/折扣">{{ currentCoupon.value }}</el-descriptions-item>
          <el-descriptions-item label="使用条件">{{ currentCoupon.condition }}</el-descriptions-item>
          <el-descriptions-item label="状态"><el-tag :type="currentCoupon.status === '进行中' ? 'success' : 'info'" size="small">{{ currentCoupon.status }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="已领取">{{ currentCoupon.used }} / {{ currentCoupon.total }}</el-descriptions-item>
          <el-descriptions-item label="有效期至">{{ currentCoupon.validEnd }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.marketing-page { display: flex; flex-direction: column; gap: 16px; }
.tab-header { margin-bottom: 16px; }
</style>
