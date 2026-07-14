<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormRules } from 'element-plus'

const activeTab = ref('users')

const configRules: FormRules = {
  platformName: [{ required: true, message: '请输入平台名称', trigger: 'blur' }],
  customerServicePhone: [{ required: true, message: '请输入客服电话', trigger: 'blur' }],
  defaultElectricityPrice: [{ required: true, message: '请输入默认电价', trigger: 'blur' }],
  defaultServicePrice: [{ required: true, message: '请输入默认服务费', trigger: 'blur' }],
}

function saveConfig() {
  ElMessage.success('配置已保存')
}

// 用户管理
const users = ref([
  { id: 1, username: 'admin', nickname: '超级管理员', role: '超级管理员', status: '正常', lastLogin: '2026-07-13 14:30:00' },
  { id: 2, username: 'operator', nickname: '运营人员', role: '运营', status: '正常', lastLogin: '2026-07-13 10:00:00' },
  { id: 3, username: 'finance01', nickname: '财务小王', role: '财务', status: '正常', lastLogin: '2026-07-12 09:00:00' },
  { id: 4, username: 'ops01', nickname: '运维张工', role: '运维', status: '禁用', lastLogin: '2026-07-10 16:00:00' },
])

// 角色管理
const roles = ref([
  { id: 1, name: '超级管理员', description: '拥有所有权限', users: 1, permissions: '全部菜单 + 全部按钮' },
  { id: 2, name: '运营', description: '充电站和订单管理权限', users: 3, permissions: '站点+设备+订单+用户+营销+电价' },
  { id: 3, name: '财务', description: '财务管理权限', users: 2, permissions: '订单+财务' },
  { id: 4, name: '运维', description: '运维管理权限', users: 5, permissions: '设备+告警+运维' },
])

// 操作日志
const logs = ref([
  { id: 1, operator: '超级管理员', type: '登录', content: '用户登录系统', ip: '192.168.1.100', time: '2026-07-13 14:30:00' },
  { id: 2, operator: '运营人员', type: '编辑', content: '修改充电站 北京朝阳充电站 电价', ip: '192.168.1.101', time: '2026-07-13 10:15:00' },
  { id: 3, operator: '超级管理员', type: '新增', content: '创建优惠券 新用户立减5元', ip: '192.168.1.100', time: '2026-07-12 16:00:00' },
  { id: 4, operator: '运维张工', type: '处理', content: '处理告警 设备离线告警 A001', ip: '192.168.1.102', time: '2026-07-12 18:30:00' },
  { id: 5, operator: '超级管理员', type: '删除', content: '删除充电站 广州天河充电站', ip: '192.168.1.100', time: '2026-07-11 09:00:00' },
])

// 系统配置
const config = ref({
  platformName: 'EV充电平台',
  customerServicePhone: '400-123-4567',
  defaultElectricityPrice: 1.2,
  defaultServicePrice: 0.5,
  orderTimeout: 30,
  heartbeatInterval: 60,
  maxChargingDuration: 480,
})

// 组织架构
const orgTree = ref([
  {
    id: 'ORG001', label: 'EV充电集团', children: [
      { id: 'ORG002', label: '华北区域公司', children: [
        { id: 'ORG005', label: '北京分公司', children: [] },
        { id: 'ORG006', label: '天津分公司', children: [] },
      ]},
      { id: 'ORG003', label: '华东区域公司', children: [
        { id: 'ORG007', label: '上海分公司', children: [] },
        { id: 'ORG008', label: '杭州分公司', children: [] },
      ]},
      { id: 'ORG004', label: '华南区域公司', children: [
        { id: 'ORG009', label: '深圳分公司', children: [] },
      ]},
    ],
  },
])

const logTypeColors: Record<string, string> = {
  登录: '', 编辑: 'warning', 新增: 'success', 删除: 'danger', 处理: 'info',
}
</script>

<template>
  <div class="system-page">
    <el-card shadow="never">
      <el-tabs v-model="activeTab">
        <!-- 组织架构 -->
        <el-tab-pane label="组织架构" name="org">
          <el-row :gutter="16">
            <el-col :span="8">
              <el-card shadow="never">
                <template #header>
                  <div class="card-header"><span>组织树</span><el-button type="primary" size="small">新增</el-button></div>
                </template>
                <el-tree :data="orgTree" node-key="id" default-expand-all highlight-current>
                  <template #default="{ data }">
                    <span class="tree-node">
                      <span>{{ data.label }}</span>
                      <span class="tree-actions">
                        <el-button type="primary" link size="small">编辑</el-button>
                        <el-button type="primary" link size="small">添加子组织</el-button>
                      </span>
                    </span>
                  </template>
                </el-tree>
              </el-card>
            </el-col>
            <el-col :span="16">
              <el-card shadow="never">
                <template #header><span>组织详情</span></template>
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="组织名称">EV充电集团</el-descriptions-item>
                  <el-descriptions-item label="组织编码">ORG001</el-descriptions-item>
                  <el-descriptions-item label="负责人">张总</el-descriptions-item>
                  <el-descriptions-item label="联系电话">13800000000</el-descriptions-item>
                  <el-descriptions-item label="管辖站点">128 个</el-descriptions-item>
                  <el-descriptions-item label="成员数">56 人</el-descriptions-item>
                </el-descriptions>
              </el-card>
            </el-col>
          </el-row>
        </el-tab-pane>

        <!-- 角色权限 -->
        <el-tab-pane label="角色权限" name="roles">
          <div class="card-header"><span></span><el-button type="primary">新增角色</el-button></div>
          <el-table :data="roles" stripe border>
            <el-table-column prop="name" label="角色名称" width="140" />
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="permissions" label="权限范围" min-width="200" show-overflow-tooltip />
            <el-table-column prop="users" label="用户数" width="80" align="center" />
            <el-table-column label="操作" width="200">
              <template #default>
                <el-button type="primary" link size="small">编辑</el-button>
                <el-button type="primary" link size="small">权限配置</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 用户管理 -->
        <el-tab-pane label="系统用户" name="users">
          <div class="card-header"><span></span><el-button type="primary">新增用户</el-button></div>
          <el-table :data="users" stripe border>
            <el-table-column prop="username" label="用户名" width="120" />
            <el-table-column prop="nickname" label="昵称" width="120" />
            <el-table-column prop="role" label="角色" width="120" />
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }"><el-tag :type="row.status === '正常' ? 'success' : 'danger'" size="small">{{ row.status }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="lastLogin" label="最后登录" width="180" />
            <el-table-column label="操作" width="250">
              <template #default="{ row }">
                <el-button type="primary" link size="small">编辑</el-button>
                <el-button type="warning" link size="small">重置密码</el-button>
                <el-button :type="row.status === '正常' ? 'danger' : 'success'" link size="small">{{ row.status === '正常' ? '禁用' : '启用' }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 操作日志 -->
        <el-tab-pane label="操作日志" name="logs">
          <el-form inline style="margin-bottom: 16px">
            <el-form-item label="操作人"><el-input placeholder="搜索操作人" clearable style="width: 150px" /></el-form-item>
            <el-form-item label="类型">
              <el-select placeholder="全部" clearable style="width: 100px">
                <el-option v-for="t in ['登录','编辑','新增','删除','处理']" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
            <el-form-item><el-button type="primary">搜索</el-button></el-form-item>
          </el-form>
          <el-table :data="logs" stripe border>
            <el-table-column prop="operator" label="操作人" width="120" />
            <el-table-column label="类型" width="80" align="center">
              <template #default="{ row }"><el-tag :type="(logTypeColors[row.type] as any)" size="small">{{ row.type }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="content" label="操作内容" min-width="200" />
            <el-table-column prop="ip" label="IP地址" width="140" />
            <el-table-column prop="time" label="时间" width="180" />
          </el-table>
        </el-tab-pane>

        <!-- 系统配置 -->
        <el-tab-pane label="系统配置" name="config">
          <el-form :model="config" :rules="configRules" label-width="150px" style="max-width: 600px">
            <el-divider content-position="left">基本配置</el-divider>
            <el-form-item label="平台名称"><el-input v-model="config.platformName" /></el-form-item>
            <el-form-item label="客服电话"><el-input v-model="config.customerServicePhone" /></el-form-item>
            <el-divider content-position="left">充电配置</el-divider>
            <el-form-item label="默认电价(元/kWh)"><el-input-number v-model="config.defaultElectricityPrice" :min="0" :max="10" :precision="2" style="width: 100%" /></el-form-item>
            <el-form-item label="默认服务费(元/kWh)"><el-input-number v-model="config.defaultServicePrice" :min="0" :max="10" :precision="2" style="width: 100%" /></el-form-item>
            <el-form-item label="订单超时(分钟)"><el-input-number v-model="config.orderTimeout" :min="5" :max="120" style="width: 100%" /></el-form-item>
            <el-form-item label="心跳间隔(秒)"><el-input-number v-model="config.heartbeatInterval" :min="10" :max="300" style="width: 100%" /></el-form-item>
            <el-form-item label="最大充电时长(分钟)"><el-input-number v-model="config.maxChargingDuration" :min="30" :max="1440" style="width: 100%" /></el-form-item>
            <el-form-item><el-button type="primary" @click="saveConfig">保存配置</el-button></el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped>
.system-page { display: flex; flex-direction: column; gap: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.tree-node { display: flex; align-items: center; justify-content: space-between; width: 100%; padding-right: 8px; }
.tree-actions { display: none; }
.tree-node:hover .tree-actions { display: inline-flex; }
</style>
