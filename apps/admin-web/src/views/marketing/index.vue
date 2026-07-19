<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useCouponStore, useActivityStore, useRechargePackageStore } from '@/store/marketing'
import type { Coupon, Activity, RechargePackage } from '@/store/marketing'
import type { FormInstance, FormRules } from 'element-plus'

const activeTab = ref('coupons')

const couponStore = useCouponStore()
const activityStore = useActivityStore()
const packageStore = useRechargePackageStore()

const couponFormRef = ref<FormInstance>()
const activityFormRef = ref<FormInstance>()
const packageFormRef = ref<FormInstance>()

// ==================== Coupon ====================

const couponRules: FormRules = {
  name: [{ required: true, message: '请输入优惠券名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  value: [{ required: true, message: '请输入面值/折扣', trigger: 'blur' }],
  total: [{ required: true, message: '请输入发放总量', trigger: 'blur' }],
  validEnd: [{ required: true, message: '请选择有效期', trigger: 'change' }],
}

const couponTypeMap: Record<string, { label: string; tagType: string }> = {
  FIXED: { label: '满减', tagType: 'info' },
  PERCENT: { label: '折扣', tagType: 'warning' },
}

const couponStatusMap: Record<string, { label: string; tagType: string }> = {
  ACTIVE: { label: '进行中', tagType: 'success' },
  DISABLED: { label: '已停用', tagType: 'info' },
  EXPIRED: { label: '已过期', tagType: 'danger' },
}

function submitCoupon() {
  couponFormRef.value?.validate().then(() => {
    couponStore.handleSubmit()
  }).catch(() => {})
}

// ==================== Activity ====================

const activityRules: FormRules = {
  name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择活动类型', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
}

const activityTypeMap: Record<string, string> = {
  FIRST_CHARGE: '首充',
  LIMITED_TIME: '限时',
  RED_ENVELOPE: '红包',
  OTHER: '其他',
}

const activityStatusMap: Record<string, { label: string; tagType: string }> = {
  ACTIVE: { label: '进行中', tagType: 'success' },
  DISABLED: { label: '已停用', tagType: 'info' },
  EXPIRED: { label: '已结束', tagType: 'danger' },
}

function submitActivity() {
  activityFormRef.value?.validate().then(() => {
    activityStore.handleSubmit()
  }).catch(() => {})
}

// ==================== Recharge Package ====================

const packageRules: FormRules = {
  name: [{ required: true, message: '请输入套餐名称', trigger: 'blur' }],
  amount: [{ required: true, message: '请输入充值金额', trigger: 'blur' }],
}

function submitPackage() {
  packageFormRef.value?.validate().then(() => {
    packageStore.handleSubmit()
  }).catch(() => {})
}

const packageStatusMap: Record<string, { label: string; tagType: string }> = {
  ACTIVE: { label: '上架', tagType: 'success' },
  DISABLED: { label: '下架', tagType: 'info' },
}

// ==================== Lifecycle ====================

onMounted(() => {
  couponStore.fetchList()
  activityStore.fetchList()
  packageStore.fetchList()
})
</script>

<template>
  <div class="marketing-page">
    <el-card shadow="never">
      <el-tabs v-model="activeTab">

        <!-- ==================== 优惠券管理 ==================== -->
        <el-tab-pane label="优惠券管理" name="coupons">
          <!-- 搜索栏 -->
          <el-form :model="couponStore.query" inline class="search-form">
            <el-form-item label="关键词">
              <el-input v-model="couponStore.query.keyword" placeholder="优惠券名称" clearable style="width: 200px" @keyup.enter="couponStore.handleSearch" />
            </el-form-item>
            <el-form-item label="类型">
              <el-select v-model="couponStore.query.type" placeholder="全部" clearable style="width: 120px">
                <el-option label="满减" value="FIXED" />
                <el-option label="折扣" value="PERCENT" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="couponStore.query.status" placeholder="全部" clearable style="width: 120px">
                <el-option label="进行中" value="ACTIVE" />
                <el-option label="已停用" value="DISABLED" />
                <el-option label="已过期" value="EXPIRED" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="couponStore.handleSearch">搜索</el-button>
              <el-button @click="couponStore.handleReset">重置</el-button>
              <el-button type="success" @click="couponStore.openCreateDialog">创建优惠券</el-button>
            </el-form-item>
          </el-form>

          <!-- 数据表格 -->
          <el-table :data="couponStore.list" v-loading="couponStore.loading" stripe border>
            <el-table-column prop="id" label="ID" width="80" show-overflow-tooltip />
            <el-table-column prop="name" label="优惠券名称" min-width="160" show-overflow-tooltip />
            <el-table-column label="类型" width="80" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="(couponTypeMap[row.type]?.tagType as any) || 'info'">
                  {{ couponTypeMap[row.type]?.label || row.type }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="面值/折扣" width="110" align="right">
              <template #default="{ row }">
                <span class="font-number">
                  {{ row.type === 'FIXED' ? `¥${row.value}` : `${row.value}折` }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="使用门槛" width="110" align="right">
              <template #default="{ row }">
                <span class="font-number">{{ row.minAmount > 0 ? `满¥${row.minAmount}` : '无门槛' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="领取/总量" width="120" align="center">
              <template #default="{ row }">
                <span class="font-number">{{ row.usedCount }}/{{ row.total }}</span>
              </template>
            </el-table-column>
            <el-table-column label="进度" width="130">
              <template #default="{ row }">
                <el-progress :percentage="row.total > 0 ? Math.floor(row.usedCount / row.total * 100) : 0" :stroke-width="6" />
              </template>
            </el-table-column>
            <el-table-column label="有效期至" width="120">
              <template #default="{ row }">
                <span class="font-number">{{ row.validEnd?.slice(0, 10) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="(couponStatusMap[row.status]?.tagType as any) || 'info'">
                  {{ couponStatusMap[row.status]?.label || row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="210" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="couponStore.viewDetail(row as unknown as Coupon)">详情</el-button>
                <el-button type="primary" link size="small" @click="couponStore.openEditDialog(row as unknown as Coupon)">编辑</el-button>
                <el-button
                  v-if="row.status === 'ACTIVE'"
                  type="warning" link size="small"
                  @click="couponStore.handleToggle(row.id, 'DISABLED')"
                >停用</el-button>
                <el-button
                  v-else-if="row.status === 'DISABLED'"
                  type="success" link size="small"
                  @click="couponStore.handleToggle(row.id, 'ACTIVE')"
                >启用</el-button>
                <el-button type="danger" link size="small" @click="couponStore.handleDelete(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="couponStore.query.page"
              v-model:page-size="couponStore.query.size"
              :total="couponStore.total"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="couponStore.handlePageChange"
              @size-change="couponStore.handleSizeChange"
            />
          </div>
        </el-tab-pane>

        <!-- ==================== 活动管理 ==================== -->
        <el-tab-pane label="活动管理" name="activities">
          <!-- 搜索栏 -->
          <el-form :model="activityStore.query" inline class="search-form">
            <el-form-item label="关键词">
              <el-input v-model="activityStore.query.keyword" placeholder="活动名称" clearable style="width: 200px" @keyup.enter="activityStore.handleSearch" />
            </el-form-item>
            <el-form-item label="类型">
              <el-select v-model="activityStore.query.type" placeholder="全部" clearable style="width: 120px">
                <el-option label="首充" value="FIRST_CHARGE" />
                <el-option label="限时" value="LIMITED_TIME" />
                <el-option label="红包" value="RED_ENVELOPE" />
                <el-option label="其他" value="OTHER" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="activityStore.query.status" placeholder="全部" clearable style="width: 120px">
                <el-option label="进行中" value="ACTIVE" />
                <el-option label="已停用" value="DISABLED" />
                <el-option label="已结束" value="EXPIRED" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="activityStore.handleSearch">搜索</el-button>
              <el-button @click="activityStore.handleReset">重置</el-button>
              <el-button type="success" @click="activityStore.openCreateDialog">创建活动</el-button>
            </el-form-item>
          </el-form>

          <!-- 数据表格 -->
          <el-table :data="activityStore.list" v-loading="activityStore.loading" stripe border>
            <el-table-column prop="id" label="ID" width="80" show-overflow-tooltip />
            <el-table-column prop="name" label="活动名称" min-width="160" show-overflow-tooltip />
            <el-table-column label="类型" width="80" align="center">
              <template #default="{ row }">
                <el-tag size="small">{{ activityTypeMap[row.type] || row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="活动时间" min-width="240">
              <template #default="{ row }">
                <span class="font-number">{{ row.startTime?.slice(0, 10) }} ~ {{ row.endTime?.slice(0, 10) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="参与人数" width="100" align="center">
              <template #default="{ row }">
                <span class="font-number">{{ row.participantCount }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="(activityStatusMap[row.status]?.tagType as any) || 'info'">
                  {{ activityStatusMap[row.status]?.label || row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="210" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="activityStore.viewDetail(row as unknown as Activity)">详情</el-button>
                <el-button type="primary" link size="small" @click="activityStore.openEditDialog(row as unknown as Activity)">编辑</el-button>
                <el-button
                  v-if="row.status === 'ACTIVE'"
                  type="warning" link size="small"
                  @click="activityStore.handleToggle(row.id, 'DISABLED')"
                >停用</el-button>
                <el-button
                  v-else-if="row.status === 'DISABLED'"
                  type="success" link size="small"
                  @click="activityStore.handleToggle(row.id, 'ACTIVE')"
                >启用</el-button>
                <el-button type="danger" link size="small" @click="activityStore.handleDelete(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="activityStore.query.page"
              v-model:page-size="activityStore.query.size"
              :total="activityStore.total"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="activityStore.handlePageChange"
              @size-change="activityStore.handleSizeChange"
            />
          </div>
        </el-tab-pane>

        <!-- ==================== 充值套餐管理 ==================== -->
        <el-tab-pane label="充值套餐管理" name="packages">
          <!-- 搜索栏 -->
          <el-form :model="packageStore.query" inline class="search-form">
            <el-form-item label="关键词">
              <el-input v-model="packageStore.query.keyword" placeholder="套餐名称" clearable style="width: 200px" @keyup.enter="packageStore.handleSearch" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="packageStore.query.status" placeholder="全部" clearable style="width: 120px">
                <el-option label="上架" value="ACTIVE" />
                <el-option label="下架" value="DISABLED" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="packageStore.handleSearch">搜索</el-button>
              <el-button @click="packageStore.handleReset">重置</el-button>
              <el-button type="success" @click="packageStore.openCreateDialog">新增套餐</el-button>
            </el-form-item>
          </el-form>

          <!-- 数据表格 -->
          <el-table :data="packageStore.list" v-loading="packageStore.loading" stripe border>
            <el-table-column prop="id" label="ID" width="80" show-overflow-tooltip />
            <el-table-column prop="name" label="套餐名称" min-width="160" show-overflow-tooltip />
            <el-table-column label="充值金额" width="120" align="right">
              <template #default="{ row }">
                <span class="font-number">¥{{ row.amount }}</span>
              </template>
            </el-table-column>
            <el-table-column label="赠送金额" width="120" align="right">
              <template #default="{ row }">
                <span class="font-number text-success">¥{{ row.giftAmount }}</span>
              </template>
            </el-table-column>
            <el-table-column label="已售" width="80" align="center">
              <template #default="{ row }">
                <span class="font-number">{{ row.soldCount }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="sort" label="排序" width="80" align="center" />
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="(packageStatusMap[row.status]?.tagType as any) || 'info'">
                  {{ packageStatusMap[row.status]?.label || row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="210" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="packageStore.viewDetail(row as unknown as RechargePackage)">详情</el-button>
                <el-button type="primary" link size="small" @click="packageStore.openEditDialog(row as unknown as RechargePackage)">编辑</el-button>
                <el-button
                  v-if="row.status === 'ACTIVE'"
                  type="warning" link size="small"
                  @click="packageStore.handleToggle(row.id, 'DISABLED')"
                >下架</el-button>
                <el-button
                  v-else-if="row.status === 'DISABLED'"
                  type="success" link size="small"
                  @click="packageStore.handleToggle(row.id, 'ACTIVE')"
                >上架</el-button>
                <el-button type="danger" link size="small" @click="packageStore.handleDelete(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="packageStore.query.page"
              v-model:page-size="packageStore.query.size"
              :total="packageStore.total"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="packageStore.handlePageChange"
              @size-change="packageStore.handleSizeChange"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- ==================== 优惠券 弹窗 ==================== -->
    <el-dialog v-model="couponStore.dialogVisible" :title="couponStore.isEdit ? '编辑优惠券' : '创建优惠券'" width="550px" destroy-on-close>
      <el-form ref="couponFormRef" :model="couponStore.form" :rules="couponRules" label-width="100px">
        <el-form-item label="优惠券名称" prop="name">
          <el-input v-model="couponStore.form.name" placeholder="请输入优惠券名称" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="couponStore.form.type">
            <el-radio value="FIXED">满减</el-radio>
            <el-radio value="PERCENT">折扣</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="couponStore.form.type === 'FIXED' ? '减免金额(元)' : '折扣率'" prop="value">
          <el-input-number v-model="couponStore.form.value" :min="0" :precision="2" :step="1" style="width: 100%" :placeholder="couponStore.form.type === 'FIXED' ? '如 5.00' : '如 8.00'" />
        </el-form-item>
        <el-form-item label="使用门槛(元)">
          <el-input-number v-model="couponStore.form.minAmount" :min="0" :precision="2" :step="1" style="width: 100%" placeholder="0 表示无门槛" />
        </el-form-item>
        <el-form-item label="发放总量" prop="total">
          <el-input-number v-model="couponStore.form.total" :min="1" :max="100000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="有效期" prop="validEnd">
          <el-date-picker v-model="couponStore.form.validEnd" type="date" placeholder="选择截止日期" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="couponStore.form.description" type="textarea" :rows="3" placeholder="优惠券描述（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="couponStore.dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="couponStore.loading" @click="submitCoupon">
          {{ couponStore.isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 优惠券详情弹窗 -->
    <el-dialog v-model="couponStore.detailVisible" title="优惠券详情" width="550px" destroy-on-close>
      <template v-if="couponStore.currentRow">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="ID">{{ couponStore.currentRow.id }}</el-descriptions-item>
          <el-descriptions-item label="名称">{{ couponStore.currentRow.name }}</el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag size="small" :type="(couponTypeMap[couponStore.currentRow.type]?.tagType as any) || 'info'">
              {{ couponTypeMap[couponStore.currentRow.type]?.label || couponStore.currentRow.type }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="面值/折扣">
            {{ couponStore.currentRow.type === 'FIXED' ? `¥${couponStore.currentRow.value}` : `${couponStore.currentRow.value}折` }}
          </el-descriptions-item>
          <el-descriptions-item label="使用门槛">
            {{ couponStore.currentRow.minAmount > 0 ? `满¥${couponStore.currentRow.minAmount}` : '无门槛' }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="(couponStatusMap[couponStore.currentRow.status]?.tagType as any) || 'info'" size="small">
              {{ couponStatusMap[couponStore.currentRow.status]?.label || couponStore.currentRow.status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="已领取">{{ couponStore.currentRow.usedCount }} / {{ couponStore.currentRow.total }}</el-descriptions-item>
          <el-descriptions-item label="有效期至">{{ couponStore.currentRow.validEnd?.slice(0, 10) }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ couponStore.currentRow.description || '-' }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>

    <!-- ==================== 活动 弹窗 ==================== -->
    <el-dialog v-model="activityStore.dialogVisible" :title="activityStore.isEdit ? '编辑活动' : '创建活动'" width="550px" destroy-on-close>
      <el-form ref="activityFormRef" :model="activityStore.form" :rules="activityRules" label-width="100px">
        <el-form-item label="活动名称" prop="name">
          <el-input v-model="activityStore.form.name" placeholder="请输入活动名称" />
        </el-form-item>
        <el-form-item label="活动类型" prop="type">
          <el-select v-model="activityStore.form.type" style="width: 100%">
            <el-option label="首充" value="FIRST_CHARGE" />
            <el-option label="限时" value="LIMITED_TIME" />
            <el-option label="红包" value="RED_ENVELOPE" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker v-model="activityStore.form.startTime" type="datetime" placeholder="选择开始时间" style="width: 100%" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker v-model="activityStore.form.endTime" type="datetime" placeholder="选择结束时间" style="width: 100%" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="活动描述">
          <el-input v-model="activityStore.form.description" type="textarea" :rows="3" placeholder="活动描述" />
        </el-form-item>
        <el-form-item label="活动规则">
          <el-input v-model="activityStore.form.rules" type="textarea" :rows="3" placeholder="活动规则说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="activityStore.dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="activityStore.loading" @click="submitActivity">
          {{ activityStore.isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 活动详情弹窗 -->
    <el-dialog v-model="activityStore.detailVisible" title="活动详情" width="550px" destroy-on-close>
      <template v-if="activityStore.currentRow">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="ID">{{ activityStore.currentRow.id }}</el-descriptions-item>
          <el-descriptions-item label="名称">{{ activityStore.currentRow.name }}</el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag size="small">{{ activityTypeMap[activityStore.currentRow.type] || activityStore.currentRow.type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="(activityStatusMap[activityStore.currentRow.status]?.tagType as any) || 'info'" size="small">
              {{ activityStatusMap[activityStore.currentRow.status]?.label || activityStore.currentRow.status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ activityStore.currentRow.startTime }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ activityStore.currentRow.endTime }}</el-descriptions-item>
          <el-descriptions-item label="参与人数">{{ activityStore.currentRow.participantCount }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ activityStore.currentRow.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ activityStore.currentRow.description || '-' }}</el-descriptions-item>
          <el-descriptions-item label="规则" :span="2">{{ activityStore.currentRow.rules || '-' }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>

    <!-- ==================== 充值套餐 弹窗 ==================== -->
    <el-dialog v-model="packageStore.dialogVisible" :title="packageStore.isEdit ? '编辑充值套餐' : '新增充值套餐'" width="550px" destroy-on-close>
      <el-form ref="packageFormRef" :model="packageStore.form" :rules="packageRules" label-width="100px">
        <el-form-item label="套餐名称" prop="name">
          <el-input v-model="packageStore.form.name" placeholder="如：充100送10" />
        </el-form-item>
        <el-form-item label="充值金额(元)" prop="amount">
          <el-input-number v-model="packageStore.form.amount" :min="1" :precision="2" :step="10" style="width: 100%" />
        </el-form-item>
        <el-form-item label="赠送金额(元)">
          <el-input-number v-model="packageStore.form.giftAmount" :min="0" :precision="2" :step="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="排序权重">
          <el-input-number v-model="packageStore.form.sort" :min="0" :max="999" style="width: 100%" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="packageStore.form.description" type="textarea" :rows="3" placeholder="套餐描述（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="packageStore.dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="packageStore.loading" @click="submitPackage">
          {{ packageStore.isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 充值套餐详情弹窗 -->
    <el-dialog v-model="packageStore.detailVisible" title="充值套餐详情" width="550px" destroy-on-close>
      <template v-if="packageStore.currentRow">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="ID">{{ packageStore.currentRow.id }}</el-descriptions-item>
          <el-descriptions-item label="名称">{{ packageStore.currentRow.name }}</el-descriptions-item>
          <el-descriptions-item label="充值金额">¥{{ packageStore.currentRow.amount }}</el-descriptions-item>
          <el-descriptions-item label="赠送金额">¥{{ packageStore.currentRow.giftAmount }}</el-descriptions-item>
          <el-descriptions-item label="已售数量">{{ packageStore.currentRow.soldCount }}</el-descriptions-item>
          <el-descriptions-item label="排序权重">{{ packageStore.currentRow.sort }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="(packageStatusMap[packageStore.currentRow.status]?.tagType as any) || 'info'" size="small">
              {{ packageStatusMap[packageStore.currentRow.status]?.label || packageStore.currentRow.status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ packageStore.currentRow.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ packageStore.currentRow.description || '-' }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.marketing-page { display: flex; flex-direction: column; gap: 16px; }
.search-form { margin-bottom: 16px; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
.font-number { font-family: 'DIN Alternate', monospace; }
.text-success { color: #52C41A; }
</style>
