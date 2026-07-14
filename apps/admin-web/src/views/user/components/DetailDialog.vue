<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/store/userManagement'
import { UserStatus } from '@/types'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['update:visible'])

const userStore = useUserStore()

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const user = computed(() => userStore.currentUser)
</script>

<template>
  <el-dialog v-model="dialogVisible" title="用户详情" width="650px" destroy-on-close>
    <template v-if="user">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户ID">{{ user.id }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ user.nickname }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ user.phone }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="user.status === UserStatus.ACTIVE ? 'success' : 'danger'">
            {{ user.status === UserStatus.ACTIVE ? '正常' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="余额">
          <span class="font-number">¥{{ user.balance.toFixed(2) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="订单数">{{ user.orderCount }} 笔</el-descriptions-item>
        <el-descriptions-item label="累计消费">
          <span class="font-number amount">¥{{ user.totalConsumption.toFixed(2) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ user.createTime }}</el-descriptions-item>
      </el-descriptions>

      <div style="margin-top: 20px; display: flex; gap: 12px;">
        <el-button type="primary">充值</el-button>
        <el-button>查看订单</el-button>
        <el-button>查看车辆</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.amount { color: #FF4D4F; font-weight: bold; }
</style>
