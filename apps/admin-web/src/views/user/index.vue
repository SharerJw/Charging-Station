<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useUserStore } from '@/store/userManagement'
import { UserStatus } from '@/types'
import DetailDialog from './components/DetailDialog.vue'

const userStore = useUserStore()
const detailVisible = ref(false)

onMounted(() => {
  userStore.fetchList()
})

function viewDetail(row: any) {
  userStore.currentUser = row
  detailVisible.value = true
}
</script>

<template>
  <div class="user-page">
    <el-card shadow="never">
      <el-form :model="userStore.query" inline>
        <el-form-item label="关键词">
          <el-input v-model="userStore.query.keyword" placeholder="昵称/手机号" clearable style="width: 200px" @keyup.enter="userStore.handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="userStore.query.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="正常" :value="UserStatus.ACTIVE" />
            <el-option label="禁用" :value="UserStatus.DISABLED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="userStore.handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="userStore.list" v-loading="userStore.loading" stripe border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column label="余额" width="120" align="right">
          <template #default="{ row }"><span class="font-number">¥{{ row.balance.toFixed(2) }}</span></template>
        </el-table-column>
        <el-table-column prop="orderCount" label="订单数" width="100" align="center" />
        <el-table-column label="累计消费" width="140" align="right">
          <template #default="{ row }"><span class="font-number amount">¥{{ row.totalConsumption.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === UserStatus.ACTIVE ? 'success' : 'danger'" size="small">
              {{ row.status === UserStatus.ACTIVE ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="注册时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <el-button
              :type="row.status === UserStatus.ACTIVE ? 'danger' : 'success'" link size="small"
              @click="userStore.handleStatusChange(row.id, row.status === UserStatus.ACTIVE ? UserStatus.DISABLED : UserStatus.ACTIVE)"
            >{{ row.status === UserStatus.ACTIVE ? '禁用' : '启用' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="userStore.query.page" v-model:page-size="userStore.query.size" :total="userStore.total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper" @current-change="userStore.handlePageChange" @size-change="userStore.handleSizeChange" />
      </div>
    </el-card>

    <DetailDialog v-model:visible="detailVisible" />
  </div>
</template>

<style scoped>
.user-page { display: flex; flex-direction: column; gap: 16px; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
.amount { color: #FF4D4F; }
</style>
