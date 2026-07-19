<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useSystemStore } from '@/store/system'
import type { OrgNode, Role, AdminUser } from '@/types'
import LogTypeTag from './components/LogTypeTag.vue'

const store = useSystemStore()

// ==================== 生命周期 ====================

onMounted(() => {
  store.fetchOrgTree()
})

// ==================== 组织架构 ====================

function handleOrgNodeClick(data: OrgNode) {
  store.selectOrgNode(data)
}

function handleAddChild(parentNode: OrgNode) {
  store.openCreateOrg(parentNode.id)
}

// ==================== 角色管理 ====================

function onRoleTabEnter() {
  store.fetchRoles()
}

// ==================== 管理员账号 ====================

function onAdminUserTabEnter() {
  store.fetchAdminUsers()
}

// ==================== 审计日志 ====================

const logModuleOptions = ['认证', '充电站', '设备', '订单', '用户', '财务', '营销', '运维', '系统']
const logActionOptions = ['登录', '新增', '编辑', '删除', '处理', '退款', '导出', '配置', '分配', '重置']

function onAuditLogTabEnter() {
  store.fetchAuditLogs()
}

// ==================== 系统配置 ====================

const configActiveGroups = ref(['basic', 'charging', 'payment', 'notification', 'map', 'security'])

function onConfigTabEnter() {
  store.fetchSystemConfig()
}

// ==================== 工具 ====================

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

// 监听 tab 切换加载对应数据
function handleTabChange(tab: string | number) {
  store.activeTab = tab as string
  if (tab === 'roles') onRoleTabEnter()
  else if (tab === 'users') onAdminUserTabEnter()
  else if (tab === 'logs') onAuditLogTabEnter()
  else if (tab === 'config') onConfigTabEnter()
  else if (tab === 'org') store.fetchOrgTree()
}
</script>

<template>
  <div class="system-page">
    <el-card shadow="never">
      <el-tabs v-model="store.activeTab" @update:model-value="handleTabChange">

        <!-- ==================== 组织架构 ==================== -->
        <el-tab-pane label="组织架构" name="org">
          <el-row :gutter="16">
            <!-- 左侧：组织树 -->
            <el-col :span="8">
              <el-card shadow="never" class="inner-card">
                <template #header>
                  <div class="card-header">
                    <span>组织树</span>
                    <el-button type="primary" size="small" @click="store.openCreateOrg()">新增根组织</el-button>
                  </div>
                </template>
                <el-tree
                  :data="store.orgTree"
                  node-key="id"
                  default-expand-all
                  highlight-current
                  :expand-on-click-node="false"
                  v-loading="store.loading"
                  @current-change="(_, node) => node && handleOrgNodeClick(node.data as unknown as OrgNode)"
                >
                  <template #default="{ data }">
                    <span class="tree-node">
                      <span class="tree-label">{{ data.label }}</span>
                      <span class="tree-actions">
                        <el-button type="primary" link size="small" @click.stop="store.openEditOrg(data)">编辑</el-button>
                        <el-button type="primary" link size="small" @click.stop="handleAddChild(data)">添加子组织</el-button>
                        <el-button type="danger" link size="small" @click.stop="store.deleteOrg(data.id)">删除</el-button>
                      </span>
                    </span>
                  </template>
                </el-tree>
              </el-card>
            </el-col>

            <!-- 右侧：组织详情 -->
            <el-col :span="16">
              <el-card shadow="never" class="inner-card">
                <template #header><span>组织详情</span></template>
                <template v-if="store.currentOrg">
                  <el-descriptions :column="2" border>
                    <el-descriptions-item label="组织名称">{{ store.currentOrg.label }}</el-descriptions-item>
                    <el-descriptions-item label="组织编码">{{ store.currentOrg.id }}</el-descriptions-item>
                    <el-descriptions-item label="负责人">{{ store.currentOrg.leaderName }}</el-descriptions-item>
                    <el-descriptions-item label="联系电话">{{ store.currentOrg.leaderPhone }}</el-descriptions-item>
                    <el-descriptions-item label="管辖站点">{{ store.currentOrg.stationCount }} 个</el-descriptions-item>
                    <el-descriptions-item label="成员数">{{ store.currentOrg.memberCount }} 人</el-descriptions-item>
                    <el-descriptions-item label="状态">
                      <el-tag :type="store.currentOrg.status === 'ENABLED' ? 'success' : 'danger'" size="small">
                        {{ store.currentOrg.status === 'ENABLED' ? '启用' : '禁用' }}
                      </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="创建时间">{{ store.currentOrg.createTime }}</el-descriptions-item>
                  </el-descriptions>
                </template>
                <el-empty v-else description="请在左侧选择组织节点" />
              </el-card>
            </el-col>
          </el-row>
        </el-tab-pane>

        <!-- ==================== 角色权限 ==================== -->
        <el-tab-pane label="角色权限" name="roles">
          <!-- 搜索栏 -->
          <el-form :model="store.roleQuery" inline style="margin-bottom: 16px">
            <el-form-item label="关键词">
              <el-input v-model="store.roleQuery.keyword" placeholder="角色名称/编码" clearable style="width: 200px" @keyup.enter="store.handleRoleSearch" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="store.roleQuery.status" placeholder="全部" clearable style="width: 120px">
                <el-option label="启用" value="ENABLED" />
                <el-option label="禁用" value="DISABLED" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="store.handleRoleSearch">搜索</el-button>
              <el-button @click="store.handleRoleReset">重置</el-button>
              <el-button type="success" @click="store.openCreateRole">新增角色</el-button>
            </el-form-item>
          </el-form>

          <!-- 数据表格 -->
          <el-table :data="store.roleList" v-loading="store.loading" stripe border>
            <el-table-column prop="name" label="角色名称" width="140" />
            <el-table-column prop="code" label="角色编码" width="150" />
            <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
            <el-table-column prop="userCount" label="用户数" width="80" align="center" />
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'ENABLED' ? 'success' : 'danger'" size="small">
                  {{ row.status === 'ENABLED' ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="170" />
            <el-table-column label="操作" width="240" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="store.openEditRole(row as unknown as Role)">编辑</el-button>
                <el-button type="primary" link size="small" @click="store.openPermDialog(row as unknown as Role)">权限配置</el-button>
                <el-button type="danger" link size="small" @click="store.deleteRole(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="store.roleQuery.page"
              v-model:page-size="store.roleQuery.size"
              :total="store.roleTotal"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="store.handleRolePageChange"
              @size-change="store.handleRoleSizeChange"
            />
          </div>
        </el-tab-pane>

        <!-- ==================== 系统用户 ==================== -->
        <el-tab-pane label="系统用户" name="users">
          <!-- 搜索栏 -->
          <el-form :model="store.adminUserQuery" inline style="margin-bottom: 16px">
            <el-form-item label="关键词">
              <el-input v-model="store.adminUserQuery.keyword" placeholder="用户名/昵称" clearable style="width: 180px" @keyup.enter="store.handleAdminUserSearch" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="store.adminUserQuery.status" placeholder="全部" clearable style="width: 100px">
                <el-option label="正常" value="ACTIVE" />
                <el-option label="禁用" value="DISABLED" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="store.handleAdminUserSearch">搜索</el-button>
              <el-button @click="store.handleAdminUserReset">重置</el-button>
              <el-button type="success" @click="store.openCreateAdminUser">新增用户</el-button>
            </el-form-item>
          </el-form>

          <!-- 数据表格 -->
          <el-table :data="store.adminUserList" v-loading="store.loading" stripe border>
            <el-table-column prop="username" label="用户名" width="120" />
            <el-table-column prop="nickname" label="昵称" width="120" />
            <el-table-column prop="roleName" label="角色" width="120" />
            <el-table-column prop="orgName" label="所属组织" min-width="140" show-overflow-tooltip />
            <el-table-column prop="phone" label="手机号" width="130" />
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'danger'" size="small">
                  {{ row.status === 'ACTIVE' ? '正常' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="lastLoginTime" label="最后登录" width="170" />
            <el-table-column prop="lastLoginIp" label="登录IP" width="130" />
            <el-table-column label="操作" width="260" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="store.openEditAdminUser(row as unknown as AdminUser)">编辑</el-button>
                <el-button type="warning" link size="small" @click="store.resetAdminUserPassword(row.id)">重置密码</el-button>
                <el-button
                  :type="row.status === 'ACTIVE' ? 'danger' : 'success'"
                  link size="small"
                  @click="store.toggleAdminUserStatus(row.id, row.status)"
                >{{ row.status === 'ACTIVE' ? '禁用' : '启用' }}</el-button>
                <el-button type="danger" link size="small" @click="store.deleteAdminUser(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="store.adminUserQuery.page"
              v-model:page-size="store.adminUserQuery.size"
              :total="store.adminUserTotal"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="store.handleAdminUserPageChange"
              @size-change="store.handleAdminUserSizeChange"
            />
          </div>
        </el-tab-pane>

        <!-- ==================== 操作日志 ==================== -->
        <el-tab-pane label="操作日志" name="logs">
          <!-- 搜索栏 -->
          <el-form :model="store.auditLogQuery" inline style="margin-bottom: 16px">
            <el-form-item label="操作人">
              <el-input v-model="store.auditLogQuery.operatorName" placeholder="操作人姓名" clearable style="width: 140px" @keyup.enter="store.handleAuditLogSearch" />
            </el-form-item>
            <el-form-item label="模块">
              <el-select v-model="store.auditLogQuery.module" placeholder="全部" clearable style="width: 110px">
                <el-option v-for="m in logModuleOptions" :key="m" :label="m" :value="m" />
              </el-select>
            </el-form-item>
            <el-form-item label="操作类型">
              <el-select v-model="store.auditLogQuery.action" placeholder="全部" clearable style="width: 110px">
                <el-option v-for="a in logActionOptions" :key="a" :label="a" :value="a" />
              </el-select>
            </el-form-item>
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="store.auditLogQuery.startTime"
                type="datetime"
                placeholder="开始时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 180px"
              />
              <span style="margin: 0 4px">-</span>
              <el-date-picker
                v-model="store.auditLogQuery.endTime"
                type="datetime"
                placeholder="结束时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 180px"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="store.handleAuditLogSearch">搜索</el-button>
              <el-button @click="store.handleAuditLogReset">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 数据表格 -->
          <el-table :data="store.auditLogList" v-loading="store.loading" stripe border>
            <el-table-column prop="operatorName" label="操作人" width="120" />
            <el-table-column prop="module" label="模块" width="90" align="center" />
            <el-table-column label="类型" width="80" align="center">
              <template #default="{ row }">
                <LogTypeTag :type="row.action" />
              </template>
            </el-table-column>
            <el-table-column prop="content" label="操作内容" min-width="240" show-overflow-tooltip />
            <el-table-column prop="ip" label="IP地址" width="130" />
            <el-table-column label="耗时" width="80" align="right">
              <template #default="{ row }">
                <span class="font-number" :class="{ 'text-warning': row.duration > 500 }">
                  {{ formatDuration(row.duration) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="结果" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'SUCCESS' ? 'success' : 'danger'" size="small">
                  {{ row.status === 'SUCCESS' ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="操作时间" width="170" />
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="store.auditLogQuery.page"
              v-model:page-size="store.auditLogQuery.size"
              :total="store.auditLogTotal"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="store.handleAuditLogPageChange"
              @size-change="store.handleAuditLogSizeChange"
            />
          </div>
        </el-tab-pane>

        <!-- ==================== 系统配置 ==================== -->
        <el-tab-pane label="系统配置" name="config">
          <el-form
            :model="store.systemConfig"
            label-width="160px"
            style="max-width: 700px"
            v-loading="store.configLoading"
          >
            <el-collapse v-model="configActiveGroups">
              <!-- 基础配置 -->
              <el-collapse-item title="基础配置" name="basic">
                <el-form-item label="平台名称">
                  <el-input v-model="store.systemConfig.platformName" placeholder="请输入平台名称" />
                </el-form-item>
                <el-form-item label="客服电话">
                  <el-input v-model="store.systemConfig.customerServicePhone" placeholder="请输入客服电话" />
                </el-form-item>
                <el-form-item label="客服邮箱">
                  <el-input v-model="store.systemConfig.customerServiceEmail" placeholder="请输入客服邮箱" />
                </el-form-item>
                <el-form-item label="ICP备案号">
                  <el-input v-model="store.systemConfig.icpNumber" placeholder="请输入ICP备案号" />
                </el-form-item>
              </el-collapse-item>

              <!-- 充电配置 -->
              <el-collapse-item title="充电配置" name="charging">
                <el-form-item label="默认电价(元/kWh)">
                  <el-input-number v-model="store.systemConfig.defaultElectricityPrice" :min="0" :max="10" :precision="2" style="width: 100%" />
                </el-form-item>
                <el-form-item label="默认服务费(元/kWh)">
                  <el-input-number v-model="store.systemConfig.defaultServicePrice" :min="0" :max="10" :precision="2" style="width: 100%" />
                </el-form-item>
                <el-form-item label="订单超时(分钟)">
                  <el-input-number v-model="store.systemConfig.orderTimeout" :min="5" :max="120" style="width: 100%" />
                </el-form-item>
                <el-form-item label="心跳间隔(秒)">
                  <el-input-number v-model="store.systemConfig.heartbeatInterval" :min="10" :max="300" style="width: 100%" />
                </el-form-item>
                <el-form-item label="最大充电时长(分钟)">
                  <el-input-number v-model="store.systemConfig.maxChargingDuration" :min="30" :max="1440" style="width: 100%" />
                </el-form-item>
                <el-form-item label="SOC满电阈值(%)">
                  <el-input-number v-model="store.systemConfig.socFullThreshold" :min="80" :max="100" style="width: 100%" />
                </el-form-item>
                <el-form-item label="SOC满自动停充">
                  <el-switch v-model="store.systemConfig.autoStopEnabled" />
                </el-form-item>
              </el-collapse-item>

              <!-- 支付配置 -->
              <el-collapse-item title="支付配置" name="payment">
                <el-form-item label="支付超时(分钟)">
                  <el-input-number v-model="store.systemConfig.payTimeout" :min="5" :max="60" style="width: 100%" />
                </el-form-item>
                <el-form-item label="最低充值金额(元)">
                  <el-input-number v-model="store.systemConfig.minRechargeAmount" :min="1" :max="100" style="width: 100%" />
                </el-form-item>
                <el-form-item label="最高充值金额(元)">
                  <el-input-number v-model="store.systemConfig.maxRechargeAmount" :min="100" :max="50000" style="width: 100%" />
                </el-form-item>
                <el-form-item label="允许退款">
                  <el-switch v-model="store.systemConfig.refundEnabled" />
                </el-form-item>
                <el-form-item label="退款截止天数">
                  <el-input-number v-model="store.systemConfig.refundDeadlineDays" :min="1" :max="30" style="width: 100%" />
                </el-form-item>
                <el-form-item label="微信支付">
                  <el-switch v-model="store.systemConfig.wechatPayEnabled" />
                </el-form-item>
                <el-form-item label="支付宝支付">
                  <el-switch v-model="store.systemConfig.alipayEnabled" />
                </el-form-item>
                <el-form-item label="余额支付">
                  <el-switch v-model="store.systemConfig.balancePayEnabled" />
                </el-form-item>
              </el-collapse-item>

              <!-- 通知配置 -->
              <el-collapse-item title="通知配置" name="notification">
                <el-form-item label="短信通知">
                  <el-switch v-model="store.systemConfig.smsEnabled" />
                </el-form-item>
                <el-form-item label="短信服务商" v-if="store.systemConfig.smsEnabled">
                  <el-select v-model="store.systemConfig.smsProvider" style="width: 100%">
                    <el-option label="阿里云" value="aliyun" />
                    <el-option label="腾讯云" value="tencent" />
                    <el-option label="华为云" value="huawei" />
                  </el-select>
                </el-form-item>
                <el-form-item label="推送通知">
                  <el-switch v-model="store.systemConfig.pushEnabled" />
                </el-form-item>
                <el-form-item label="邮件通知">
                  <el-switch v-model="store.systemConfig.emailEnabled" />
                </el-form-item>
                <el-form-item label="告警通知">
                  <el-switch v-model="store.systemConfig.alertNotifyEnabled" />
                </el-form-item>
                <el-form-item label="订单通知">
                  <el-switch v-model="store.systemConfig.orderNotifyEnabled" />
                </el-form-item>
              </el-collapse-item>

              <!-- 地图配置 -->
              <el-collapse-item title="地图配置" name="map">
                <el-form-item label="地图服务商">
                  <el-select v-model="store.systemConfig.mapProvider" style="width: 100%">
                    <el-option label="腾讯地图" value="TENCENT" />
                    <el-option label="高德地图" value="AMAP" />
                  </el-select>
                </el-form-item>
                <el-form-item label="地图API Key">
                  <el-input v-model="store.systemConfig.mapKey" placeholder="请输入地图API Key" show-password />
                </el-form-item>
                <el-form-item label="默认经度">
                  <el-input-number v-model="store.systemConfig.defaultLongitude" :min="73" :max="136" :precision="4" style="width: 100%" />
                </el-form-item>
                <el-form-item label="默认纬度">
                  <el-input-number v-model="store.systemConfig.defaultLatitude" :min="3" :max="54" :precision="4" style="width: 100%" />
                </el-form-item>
                <el-form-item label="默认缩放级别">
                  <el-input-number v-model="store.systemConfig.defaultZoom" :min="3" :max="18" style="width: 100%" />
                </el-form-item>
              </el-collapse-item>

              <!-- 安全配置 -->
              <el-collapse-item title="安全配置" name="security">
                <el-form-item label="登录失败锁定次数">
                  <el-input-number v-model="store.systemConfig.loginFailLock" :min="3" :max="20" style="width: 100%" />
                </el-form-item>
                <el-form-item label="锁定时长(分钟)">
                  <el-input-number v-model="store.systemConfig.loginFailLockMinutes" :min="5" :max="1440" style="width: 100%" />
                </el-form-item>
                <el-form-item label="密码最小长度">
                  <el-input-number v-model="store.systemConfig.passwordMinLength" :min="6" :max="32" style="width: 100%" />
                </el-form-item>
                <el-form-item label="密码过期天数">
                  <el-input-number v-model="store.systemConfig.passwordExpireDays" :min="30" :max="365" style="width: 100%" />
                </el-form-item>
                <el-form-item label="会话超时(分钟)">
                  <el-input-number v-model="store.systemConfig.sessionTimeout" :min="15" :max="1440" style="width: 100%" />
                </el-form-item>
                <el-form-item label="IP白名单">
                  <el-input v-model="store.systemConfig.ipWhitelist" type="textarea" :rows="3" placeholder="多个IP用逗号分隔，留空不限制" />
                </el-form-item>
                <el-form-item label="API限流(次/分钟)">
                  <el-input-number v-model="store.systemConfig.apiRateLimit" :min="10" :max="10000" style="width: 100%" />
                </el-form-item>
              </el-collapse-item>
            </el-collapse>

            <div style="margin-top: 24px">
              <el-button type="primary" size="large" @click="store.saveSystemConfig" :loading="store.configLoading">保存配置</el-button>
            </div>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- ==================== 组织架构弹窗 ==================== -->
    <el-dialog
      v-model="store.orgDialogVisible"
      :title="store.orgIsEdit ? '编辑组织' : '新增组织'"
      width="500px"
      destroy-on-close
    >
      <el-form :model="store.orgForm" label-width="100px">
        <el-form-item label="上级组织">
          <el-input :model-value="store.orgForm.parentId ? '(已选择上级)' : '顶级组织'" disabled />
        </el-form-item>
        <el-form-item label="组织名称" required>
          <el-input v-model="store.orgForm.label" placeholder="请输入组织名称" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="store.orgForm.sort" :min="0" :max="9999" style="width: 100%" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="store.orgForm.leaderName" placeholder="请输入负责人姓名" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="store.orgForm.leaderPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="store.orgForm.status">
            <el-radio value="ENABLED">启用</el-radio>
            <el-radio value="DISABLED">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="store.orgDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="store.submitOrg" :loading="store.loading">确定</el-button>
      </template>
    </el-dialog>

    <!-- ==================== 角色弹窗 ==================== -->
    <el-dialog
      v-model="store.roleDialogVisible"
      :title="store.roleIsEdit ? '编辑角色' : '新增角色'"
      width="500px"
      destroy-on-close
    >
      <el-form :model="store.roleForm" label-width="100px">
        <el-form-item label="角色名称" required>
          <el-input v-model="store.roleForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码" required>
          <el-input v-model="store.roleForm.code" placeholder="请输入角色编码，如 ADMIN" :disabled="store.roleIsEdit" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="store.roleForm.description" type="textarea" :rows="3" placeholder="请输入角色描述" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="store.roleForm.status">
            <el-radio value="ENABLED">启用</el-radio>
            <el-radio value="DISABLED">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="store.roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="store.submitRole" :loading="store.loading">确定</el-button>
      </template>
    </el-dialog>

    <!-- ==================== 权限配置弹窗 ==================== -->
    <el-dialog
      v-model="store.permDialogVisible"
      title="权限配置"
      width="600px"
      destroy-on-close
    >
      <p style="margin-bottom: 12px; color: #606266; font-size: 14px">
        为角色 <strong>{{ (store.currentOrg as unknown as Role)?.name }}</strong> 分配菜单和按钮权限：
      </p>
      <el-scrollbar max-height="400px">
        <el-tree
          :data="store.permissionTree"
          node-key="id"
          show-checkbox
          default-expand-all
          :default-checked-keys="store.checkedMenuIds"
          @check="(_, { checkedKeys: _checkedKeys, checkedNodes }) => {
            store.checkedMenuIds = (checkedNodes as any[]).filter((n: any) => n.type === 'MENU').map((n: any) => n.id)
            store.checkedButtonIds = (checkedNodes as any[]).filter((n: any) => n.type === 'BUTTON').map((n: any) => n.id)
          }"
        >
          <template #default="{ data }">
            <span>
              <el-tag v-if="data.type === 'MENU'" size="small" type="primary" style="margin-right: 6px">菜单</el-tag>
              <el-tag v-else size="small" type="warning" style="margin-right: 6px">按钮</el-tag>
              {{ data.label }}
            </span>
          </template>
        </el-tree>
      </el-scrollbar>
      <template #footer>
        <el-button @click="store.permDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="store.submitPermissions" :loading="store.loading">保存权限</el-button>
      </template>
    </el-dialog>

    <!-- ==================== 管理员用户弹窗 ==================== -->
    <el-dialog
      v-model="store.adminUserDialogVisible"
      :title="store.adminUserIsEdit ? '编辑用户' : '新增用户'"
      width="550px"
      destroy-on-close
    >
      <el-form :model="store.adminUserForm" label-width="100px">
        <el-form-item label="用户名" required>
          <el-input v-model="store.adminUserForm.username" placeholder="请输入用户名" :disabled="store.adminUserIsEdit" />
        </el-form-item>
        <el-form-item v-if="!store.adminUserIsEdit" label="密码" required>
          <el-input v-model="store.adminUserForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="昵称" required>
          <el-input v-model="store.adminUserForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="手机号" required>
          <el-input v-model="store.adminUserForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="store.adminUserForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="store.adminUserForm.roleId" placeholder="请选择角色" style="width: 100%">
            <el-option v-for="role in store.roleList" :key="role.id" :label="role.name" :value="role.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属组织">
          <el-tree-select
            v-model="store.adminUserForm.orgId"
            :data="store.orgTree"
            node-key="id"
            :props="{ label: 'label', children: 'children' }"
            placeholder="请选择组织"
            check-strictly
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="store.adminUserForm.status">
            <el-radio value="ACTIVE">正常</el-radio>
            <el-radio value="DISABLED">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="store.adminUserDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="store.submitAdminUser" :loading="store.loading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.system-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.inner-card {
  min-height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 8px;
}

.tree-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-actions {
  display: none;
  flex-shrink: 0;
  margin-left: 8px;
}

.tree-node:hover .tree-actions {
  display: inline-flex;
}

.font-number {
  font-family: 'DIN Alternate', monospace;
}

.text-warning {
  color: #FAAD14;
}
</style>
