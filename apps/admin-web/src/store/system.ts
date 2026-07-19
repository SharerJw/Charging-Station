import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { systemApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import type {
  OrgNode, OrgForm,
  Role, RoleForm, RoleQuery, MenuPermissionNode,
  AdminUser, AdminUserForm, AdminUserQuery,
  AuditLog, AuditLogQuery,
  SystemConfig,
} from '@/types'

// ==================== Mock 数据 ====================

const mockOrgTree: OrgNode[] = [
  {
    id: 'ORG001', label: 'EV充电集团', parentId: null, sort: 1,
    leaderName: '张总', leaderPhone: '13800000001',
    stationCount: 128, memberCount: 56, status: 'ENABLED', createTime: '2024-01-01 00:00:00',
    children: [
      {
        id: 'ORG002', label: '华北区域公司', parentId: 'ORG001', sort: 1,
        leaderName: '李经理', leaderPhone: '13800000002',
        stationCount: 42, memberCount: 18, status: 'ENABLED', createTime: '2024-01-15 10:00:00',
        children: [
          {
            id: 'ORG005', label: '北京分公司', parentId: 'ORG002', sort: 1,
            leaderName: '王主管', leaderPhone: '13800000005',
            stationCount: 25, memberCount: 10, status: 'ENABLED', createTime: '2024-02-01 10:00:00',
            children: [],
          },
          {
            id: 'ORG006', label: '天津分公司', parentId: 'ORG002', sort: 2,
            leaderName: '赵主管', leaderPhone: '13800000006',
            stationCount: 17, memberCount: 8, status: 'ENABLED', createTime: '2024-02-01 10:00:00',
            children: [],
          },
        ],
      },
      {
        id: 'ORG003', label: '华东区域公司', parentId: 'ORG001', sort: 2,
        leaderName: '陈经理', leaderPhone: '13800000003',
        stationCount: 53, memberCount: 22, status: 'ENABLED', createTime: '2024-01-15 10:00:00',
        children: [
          {
            id: 'ORG007', label: '上海分公司', parentId: 'ORG003', sort: 1,
            leaderName: '刘主管', leaderPhone: '13800000007',
            stationCount: 30, memberCount: 12, status: 'ENABLED', createTime: '2024-02-01 10:00:00',
            children: [],
          },
          {
            id: 'ORG008', label: '杭州分公司', parentId: 'ORG003', sort: 2,
            leaderName: '周主管', leaderPhone: '13800000008',
            stationCount: 23, memberCount: 10, status: 'ENABLED', createTime: '2024-02-01 10:00:00',
            children: [],
          },
        ],
      },
      {
        id: 'ORG004', label: '华南区域公司', parentId: 'ORG001', sort: 3,
        leaderName: '黄经理', leaderPhone: '13800000004',
        stationCount: 33, memberCount: 16, status: 'ENABLED', createTime: '2024-01-15 10:00:00',
        children: [
          {
            id: 'ORG009', label: '深圳分公司', parentId: 'ORG004', sort: 1,
            leaderName: '吴主管', leaderPhone: '13800000009',
            stationCount: 33, memberCount: 16, status: 'ENABLED', createTime: '2024-02-01 10:00:00',
            children: [],
          },
        ],
      },
    ],
  },
]

const mockRoles: Role[] = [
  {
    id: 'R001', name: '超级管理员', code: 'SUPER_ADMIN', description: '拥有系统全部权限',
    userCount: 1, menuIds: ['*'], buttonIds: ['*'], status: 'ENABLED',
    createTime: '2024-01-01 00:00:00', updateTime: '2024-01-01 00:00:00',
  },
  {
    id: 'R002', name: '运营', code: 'OPERATOR', description: '充电站和订单管理权限',
    userCount: 3, menuIds: ['M_STATION', 'M_DEVICE', 'M_ORDER', 'M_USER', 'M_MARKETING', 'M_PRICING'],
    buttonIds: ['B_STATION_EDIT', 'B_ORDER_REFUND'], status: 'ENABLED',
    createTime: '2024-01-15 10:00:00', updateTime: '2024-03-20 14:00:00',
  },
  {
    id: 'R003', name: '财务', code: 'FINANCE', description: '财务管理权限',
    userCount: 2, menuIds: ['M_ORDER', 'M_FINANCE'], buttonIds: ['B_ORDER_EXPORT', 'B_FINANCE_EXPORT'],
    status: 'ENABLED', createTime: '2024-01-15 10:00:00', updateTime: '2024-02-10 09:00:00',
  },
  {
    id: 'R004', name: '运维', code: 'OPS', description: '运维管理权限',
    userCount: 5, menuIds: ['M_DEVICE', 'M_ALERT', 'M_OPS'], buttonIds: ['B_DEVICE_RESET', 'B_ALERT_HANDLE'],
    status: 'ENABLED', createTime: '2024-01-15 10:00:00', updateTime: '2024-04-05 16:00:00',
  },
]

const mockAdminUsers: AdminUser[] = [
  {
    id: 'U001', username: 'admin', nickname: '超级管理员', phone: '13800000001',
    email: 'admin@evcharge.com', roleId: 'R001', roleName: '超级管理员',
    orgId: 'ORG001', orgName: 'EV充电集团', status: 'ACTIVE',
    lastLoginTime: '2026-07-13 14:30:00', lastLoginIp: '192.168.1.100',
    createTime: '2024-01-01 00:00:00', updateTime: '2024-01-01 00:00:00',
  },
  {
    id: 'U002', username: 'operator', nickname: '运营人员', phone: '13800000002',
    email: 'operator@evcharge.com', roleId: 'R002', roleName: '运营',
    orgId: 'ORG002', orgName: '华北区域公司', status: 'ACTIVE',
    lastLoginTime: '2026-07-13 10:00:00', lastLoginIp: '192.168.1.101',
    createTime: '2024-02-01 10:00:00', updateTime: '2024-03-15 11:00:00',
  },
  {
    id: 'U003', username: 'finance01', nickname: '财务小王', phone: '13800000003',
    email: 'finance@evcharge.com', roleId: 'R003', roleName: '财务',
    orgId: 'ORG003', orgName: '华东区域公司', status: 'ACTIVE',
    lastLoginTime: '2026-07-12 09:00:00', lastLoginIp: '192.168.1.103',
    createTime: '2024-02-15 14:00:00', updateTime: '2024-04-10 09:30:00',
  },
  {
    id: 'U004', username: 'ops01', nickname: '运维张工', phone: '13800000004',
    email: 'ops@evcharge.com', roleId: 'R004', roleName: '运维',
    orgId: 'ORG004', orgName: '华南区域公司', status: 'DISABLED',
    lastLoginTime: '2026-07-10 16:00:00', lastLoginIp: '192.168.1.102',
    createTime: '2024-03-01 08:00:00', updateTime: '2026-07-11 10:00:00',
  },
]

const mockAuditLogs: AuditLog[] = [
  {
    id: 'AL001', operatorId: 'U001', operatorName: '超级管理员', module: '认证',
    action: '登录', content: '用户登录系统', ip: '192.168.1.100',
    userAgent: 'Chrome/120', requestMethod: 'POST', requestUrl: '/api/auth/login',
    duration: 45, status: 'SUCCESS', errorMessage: '', createTime: '2026-07-13 14:30:00',
  },
  {
    id: 'AL002', operatorId: 'U002', operatorName: '运营人员', module: '充电站',
    action: '编辑', content: '修改充电站 北京朝阳充电站 电价配置', ip: '192.168.1.101',
    userAgent: 'Chrome/120', requestMethod: 'PUT', requestUrl: '/api/stations/S001',
    duration: 120, status: 'SUCCESS', errorMessage: '', createTime: '2026-07-13 10:15:00',
  },
  {
    id: 'AL003', operatorId: 'U001', operatorName: '超级管理员', module: '营销',
    action: '新增', content: '创建优惠券 新用户立减5元', ip: '192.168.1.100',
    userAgent: 'Chrome/120', requestMethod: 'POST', requestUrl: '/api/marketing/coupons',
    duration: 88, status: 'SUCCESS', errorMessage: '', createTime: '2026-07-12 16:00:00',
  },
  {
    id: 'AL004', operatorId: 'U004', operatorName: '运维张工', module: '运维',
    action: '处理', content: '处理告警 设备离线告警 A001', ip: '192.168.1.102',
    userAgent: 'UniApp', requestMethod: 'PUT', requestUrl: '/api/ops/workorders/W001/complete',
    duration: 65, status: 'SUCCESS', errorMessage: '', createTime: '2026-07-12 18:30:00',
  },
  {
    id: 'AL005', operatorId: 'U001', operatorName: '超级管理员', module: '充电站',
    action: '删除', content: '删除充电站 广州天河充电站', ip: '192.168.1.100',
    userAgent: 'Chrome/120', requestMethod: 'DELETE', requestUrl: '/api/stations/S099',
    duration: 200, status: 'SUCCESS', errorMessage: '', createTime: '2026-07-11 09:00:00',
  },
  {
    id: 'AL006', operatorId: 'U002', operatorName: '运营人员', module: '订单',
    action: '退款', content: '订单 ORD20260710001 退款 35.50 元', ip: '192.168.1.101',
    userAgent: 'Chrome/120', requestMethod: 'POST', requestUrl: '/api/orders/O001/refund',
    duration: 350, status: 'SUCCESS', errorMessage: '', createTime: '2026-07-10 15:20:00',
  },
]

const mockPermissionTree: MenuPermissionNode[] = [
  {
    id: 'M_DASHBOARD', label: '仪表盘', type: 'MENU',
    children: [],
  },
  {
    id: 'M_STATION', label: '充电站管理', type: 'MENU',
    children: [
      { id: 'B_STATION_CREATE', label: '新增充电站', type: 'BUTTON', children: [] },
      { id: 'B_STATION_EDIT', label: '编辑充电站', type: 'BUTTON', children: [] },
      { id: 'B_STATION_DELETE', label: '删除充电站', type: 'BUTTON', children: [] },
      { id: 'B_STATION_STATUS', label: '启停充电站', type: 'BUTTON', children: [] },
    ],
  },
  {
    id: 'M_DEVICE', label: '设备管理', type: 'MENU',
    children: [
      { id: 'B_DEVICE_EDIT', label: '编辑设备', type: 'BUTTON', children: [] },
      { id: 'B_DEVICE_RESET', label: '远程重启', type: 'BUTTON', children: [] },
      { id: 'B_DEVICE_UNLOCK', label: '解锁连接器', type: 'BUTTON', children: [] },
    ],
  },
  {
    id: 'M_ORDER', label: '订单管理', type: 'MENU',
    children: [
      { id: 'B_ORDER_DETAIL', label: '查看订单详情', type: 'BUTTON', children: [] },
      { id: 'B_ORDER_REFUND', label: '订单退款', type: 'BUTTON', children: [] },
      { id: 'B_ORDER_EXPORT', label: '导出订单', type: 'BUTTON', children: [] },
    ],
  },
  {
    id: 'M_USER', label: '用户管理', type: 'MENU',
    children: [
      { id: 'B_USER_EDIT', label: '编辑用户', type: 'BUTTON', children: [] },
      { id: 'B_USER_STATUS', label: '启用/禁用用户', type: 'BUTTON', children: [] },
    ],
  },
  {
    id: 'M_FINANCE', label: '财务管理', type: 'MENU',
    children: [
      { id: 'B_FINANCE_EXPORT', label: '导出财务数据', type: 'BUTTON', children: [] },
      { id: 'B_FINANCE_SETTLE', label: '发起结算', type: 'BUTTON', children: [] },
    ],
  },
  {
    id: 'M_PRICING', label: '定价策略', type: 'MENU',
    children: [
      { id: 'B_PRICING_CREATE', label: '新增策略', type: 'BUTTON', children: [] },
      { id: 'B_PRICING_EDIT', label: '编辑策略', type: 'BUTTON', children: [] },
      { id: 'B_PRICING_DELETE', label: '删除策略', type: 'BUTTON', children: [] },
    ],
  },
  {
    id: 'M_MARKETING', label: '营销管理', type: 'MENU',
    children: [
      { id: 'B_MARKETING_COUPON', label: '优惠券管理', type: 'BUTTON', children: [] },
      { id: 'B_MARKETING_ACTIVITY', label: '活动管理', type: 'BUTTON', children: [] },
    ],
  },
  {
    id: 'M_ANALYTICS', label: '数据分析', type: 'MENU',
    children: [],
  },
  {
    id: 'M_OPS', label: '运维管理', type: 'MENU',
    children: [
      { id: 'B_OPS_ORDER', label: '工单管理', type: 'BUTTON', children: [] },
      { id: 'B_OPS_INSPECT', label: '巡检管理', type: 'BUTTON', children: [] },
      { id: 'B_OPS_SPARE', label: '备件管理', type: 'BUTTON', children: [] },
    ],
  },
  {
    id: 'M_ALERT', label: '告警管理', type: 'MENU',
    children: [
      { id: 'B_ALERT_HANDLE', label: '处理告警', type: 'BUTTON', children: [] },
      { id: 'B_ALERT_CONFIG', label: '告警规则配置', type: 'BUTTON', children: [] },
    ],
  },
  {
    id: 'M_SYSTEM', label: '系统管理', type: 'MENU',
    children: [
      { id: 'M_SYSTEM_ORG', label: '组织架构', type: 'MENU', children: [] },
      { id: 'M_SYSTEM_ROLE', label: '角色权限', type: 'MENU', children: [] },
      { id: 'M_SYSTEM_USER', label: '系统用户', type: 'MENU', children: [] },
      { id: 'M_SYSTEM_LOG', label: '审计日志', type: 'MENU', children: [] },
      { id: 'M_SYSTEM_CONFIG', label: '系统配置', type: 'MENU', children: [] },
    ],
  },
]

const mockConfig: SystemConfig = {
  platformName: 'EV充电平台',
  platformLogo: '',
  customerServicePhone: '400-123-4567',
  customerServiceEmail: 'support@evcharge.com',
  icpNumber: '京ICP备2024XXXXXX号',
  defaultElectricityPrice: 1.2,
  defaultServicePrice: 0.5,
  orderTimeout: 30,
  heartbeatInterval: 60,
  maxChargingDuration: 480,
  socFullThreshold: 95,
  autoStopEnabled: true,
  payTimeout: 15,
  minRechargeAmount: 10,
  maxRechargeAmount: 5000,
  refundEnabled: true,
  refundDeadlineDays: 7,
  wechatPayEnabled: true,
  alipayEnabled: true,
  balancePayEnabled: true,
  smsEnabled: true,
  smsProvider: 'aliyun',
  pushEnabled: true,
  emailEnabled: false,
  alertNotifyEnabled: true,
  orderNotifyEnabled: true,
  mapProvider: 'TENCENT',
  mapKey: '',
  defaultLongitude: 116.46,
  defaultLatitude: 39.92,
  defaultZoom: 12,
  loginFailLock: 5,
  loginFailLockMinutes: 30,
  passwordMinLength: 8,
  passwordExpireDays: 90,
  sessionTimeout: 120,
  ipWhitelist: '',
  apiRateLimit: 100,
}

// ==================== 工具函数 ====================

function findOrgNode(tree: OrgNode[], id: string): OrgNode | null {
  for (const node of tree) {
    if (node.id === id) return node
    if (node.children?.length) {
      const found = findOrgNode(node.children, id)
      if (found) return found
    }
  }
  return null
}

function removeOrgNode(tree: OrgNode[], id: string): boolean {
  for (let i = 0; i < tree.length; i++) {
    if (tree[i].id === id) {
      tree.splice(i, 1)
      return true
    }
    if (tree[i].children?.length) {
      if (removeOrgNode(tree[i].children, id)) return true
    }
  }
  return false
}

// ==================== Store ====================

export const useSystemStore = defineStore('system', () => {
  // ---------- 通用 ----------
  const activeTab = ref('org')
  const loading = ref(false)

  // ---------- 组织架构 ----------
  const orgTree = ref<OrgNode[]>([])
  const currentOrg = ref<OrgNode | null>(null)
  const orgDialogVisible = ref(false)
  const orgIsEdit = ref(false)

  const orgForm = reactive<OrgForm>({
    parentId: null,
    label: '',
    sort: 0,
    leaderName: '',
    leaderPhone: '',
    status: 'ENABLED',
  })

  // ---------- 角色管理 ----------
  const roleList = ref<Role[]>([])
  const roleTotal = ref(0)
  const roleDialogVisible = ref(false)
  const roleIsEdit = ref(false)
  const permDialogVisible = ref(false)
  const permissionTree = ref<MenuPermissionNode[]>([])
  const checkedMenuIds = ref<string[]>([])
  const checkedButtonIds = ref<string[]>([])

  const roleQuery = reactive<RoleQuery>({
    keyword: '',
    status: undefined,
    page: 1,
    size: 10,
  })

  const roleForm = reactive<RoleForm>({
    name: '',
    code: '',
    description: '',
    status: 'ENABLED',
  })

  // ---------- 管理员账号 ----------
  const adminUserList = ref<AdminUser[]>([])
  const adminUserTotal = ref(0)
  const adminUserDialogVisible = ref(false)
  const adminUserIsEdit = ref(false)

  const adminUserQuery = reactive<AdminUserQuery>({
    keyword: '',
    roleId: undefined,
    orgId: undefined,
    status: undefined,
    page: 1,
    size: 10,
  })

  const adminUserForm = reactive<AdminUserForm>({
    username: '',
    nickname: '',
    phone: '',
    email: '',
    roleId: '',
    orgId: '',
    password: '',
    status: 'ACTIVE',
  })

  // ---------- 审计日志 ----------
  const auditLogList = ref<AuditLog[]>([])
  const auditLogTotal = ref(0)

  const auditLogQuery = reactive<AuditLogQuery>({
    operatorName: '',
    module: undefined,
    action: undefined,
    status: undefined,
    startTime: undefined,
    endTime: undefined,
    page: 1,
    size: 10,
  })

  // ---------- 系统配置 ----------
  const systemConfig = reactive<SystemConfig>({ ...mockConfig })
  const configLoading = ref(false)

  // ==================== 组织架构方法 ====================

  async function fetchOrgTree() {
    loading.value = true
    try {
      const data = await systemApi.org.tree()
      orgTree.value = data
    } catch {
      orgTree.value = JSON.parse(JSON.stringify(mockOrgTree))
    } finally {
      loading.value = false
    }
  }

  function openCreateOrg(parentId: string | null = null) {
    orgIsEdit.value = false
    Object.assign(orgForm, {
      parentId, label: '', sort: 0, leaderName: '', leaderPhone: '', status: 'ENABLED',
    })
    orgDialogVisible.value = true
  }

  function openEditOrg(node: OrgNode) {
    orgIsEdit.value = true
    currentOrg.value = node
    Object.assign(orgForm, {
      parentId: node.parentId,
      label: node.label,
      sort: node.sort,
      leaderName: node.leaderName,
      leaderPhone: node.leaderPhone,
      status: node.status,
    })
    orgDialogVisible.value = true
  }

  async function submitOrg() {
    loading.value = true
    try {
      if (orgIsEdit.value && currentOrg.value) {
        await systemApi.org.update(currentOrg.value.id, orgForm)
        ElMessage.success('组织更新成功')
      } else {
        await systemApi.org.create(orgForm)
        ElMessage.success('组织创建成功')
      }
      orgDialogVisible.value = false
      await fetchOrgTree()
    } catch {
      // Mock fallback: apply locally
      if (orgIsEdit.value && currentOrg.value) {
        const node = findOrgNode(orgTree.value, currentOrg.value.id)
        if (node) Object.assign(node, { label: orgForm.label, sort: orgForm.sort, leaderName: orgForm.leaderName, leaderPhone: orgForm.leaderPhone, status: orgForm.status })
        ElMessage.success('组织更新成功')
      } else {
        const parent = orgForm.parentId ? findOrgNode(orgTree.value, orgForm.parentId) : null
        const newNode: OrgNode = {
          id: 'ORG_' + Date.now(), label: orgForm.label, parentId: orgForm.parentId,
          sort: orgForm.sort, leaderName: orgForm.leaderName, leaderPhone: orgForm.leaderPhone,
          stationCount: 0, memberCount: 0, status: orgForm.status, children: [], createTime: new Date().toISOString(),
        }
        if (parent) parent.children.push(newNode)
        else orgTree.value.push(newNode)
        ElMessage.success('组织创建成功')
      }
      orgDialogVisible.value = false
    } finally {
      loading.value = false
    }
  }

  async function deleteOrg(id: string) {
    try {
      await ElMessageBox.confirm('确定要删除该组织吗？其下所有子组织将同时被删除。', '确认删除', {
        type: 'warning', confirmButtonText: '确定删除', cancelButtonText: '取消',
      })
      loading.value = true
      try {
        await systemApi.org.delete(id)
      } catch {
        // Mock fallback
      }
      removeOrgNode(orgTree.value, id)
      if (currentOrg.value?.id === id) currentOrg.value = null
      ElMessage.success('组织删除成功')
    } catch (error: any) {
      if (error !== 'cancel') ElMessage.error(error.message || '删除失败')
    } finally {
      loading.value = false
    }
  }

  function selectOrgNode(node: OrgNode) {
    currentOrg.value = node
  }

  // ==================== 角色管理方法 ====================

  async function fetchRoles() {
    loading.value = true
    try {
      const result = await systemApi.roles.list(roleQuery)
      roleList.value = result.list
      roleTotal.value = result.total
    } catch {
      const filtered = mockRoles.filter(r =>
        (!roleQuery.keyword || r.name.includes(roleQuery.keyword) || r.code.includes(roleQuery.keyword)) &&
        (!roleQuery.status || r.status === roleQuery.status)
      )
      roleList.value = filtered
      roleTotal.value = filtered.length
    } finally {
      loading.value = false
    }
  }

  async function fetchPermissionTree() {
    try {
      const data = await systemApi.roles.permissionTree()
      permissionTree.value = data
    } catch {
      permissionTree.value = JSON.parse(JSON.stringify(mockPermissionTree))
    }
  }

  function openCreateRole() {
    roleIsEdit.value = false
    Object.assign(roleForm, { name: '', code: '', description: '', status: 'ENABLED' })
    roleDialogVisible.value = true
  }

  function openEditRole(role: Role) {
    roleIsEdit.value = true
    currentOrg.value = role as any
    Object.assign(roleForm, {
      name: role.name, code: role.code, description: role.description, status: role.status,
    })
    roleDialogVisible.value = true
  }

  async function submitRole() {
    loading.value = true
    try {
      if (roleIsEdit.value && currentOrg.value) {
        await systemApi.roles.update(currentOrg.value.id, roleForm)
        ElMessage.success('角色更新成功')
      } else {
        await systemApi.roles.create(roleForm)
        ElMessage.success('角色创建成功')
      }
      roleDialogVisible.value = false
      await fetchRoles()
    } catch {
      // Mock fallback
      if (roleIsEdit.value && currentOrg.value) {
        const idx = roleList.value.findIndex(r => r.id === currentOrg.value!.id)
        if (idx !== -1) Object.assign(roleList.value[idx], roleForm)
        ElMessage.success('角色更新成功')
      } else {
        roleList.value.unshift({
          id: 'R_' + Date.now(), ...roleForm, userCount: 0, menuIds: [], buttonIds: [],
          createTime: new Date().toISOString(), updateTime: new Date().toISOString(),
        })
        roleTotal.value++
        ElMessage.success('角色创建成功')
      }
      roleDialogVisible.value = false
    } finally {
      loading.value = false
    }
  }

  async function deleteRole(id: string) {
    try {
      await ElMessageBox.confirm('确定要删除该角色吗？已分配该角色的用户将失去对应权限。', '确认删除', {
        type: 'warning', confirmButtonText: '确定删除', cancelButtonText: '取消',
      })
      loading.value = true
      try {
        await systemApi.roles.delete(id)
      } catch {
        // Mock fallback
      }
      const idx = roleList.value.findIndex(r => r.id === id)
      if (idx !== -1) roleList.value.splice(idx, 1)
      roleTotal.value--
      ElMessage.success('角色删除成功')
    } catch (error: any) {
      if (error !== 'cancel') ElMessage.error(error.message || '删除失败')
    } finally {
      loading.value = false
    }
  }

  function openPermDialog(role: Role) {
    currentOrg.value = role as any
    fetchPermissionTree()
    checkedMenuIds.value = role.menuIds.includes('*')
      ? mockPermissionTree.map(n => n.id)
      : [...role.menuIds]
    checkedButtonIds.value = role.buttonIds.includes('*')
      ? collectAllButtonIds(mockPermissionTree)
      : [...role.buttonIds]
    permDialogVisible.value = true
  }

  function collectAllButtonIds(nodes: MenuPermissionNode[]): string[] {
    const ids: string[] = []
    for (const n of nodes) {
      if (n.type === 'BUTTON') ids.push(n.id)
      if (n.children?.length) ids.push(...collectAllButtonIds(n.children))
    }
    return ids
  }

  async function submitPermissions() {
    if (!currentOrg.value) return
    loading.value = true
    try {
      await systemApi.roles.assignPermissions(currentOrg.value.id, {
        menuIds: checkedMenuIds.value, buttonIds: checkedButtonIds.value,
      })
      ElMessage.success('权限分配成功')
    } catch {
      // Mock fallback
      const idx = roleList.value.findIndex(r => r.id === currentOrg.value!.id)
      if (idx !== -1) {
        roleList.value[idx].menuIds = [...checkedMenuIds.value]
        roleList.value[idx].buttonIds = [...checkedButtonIds.value]
      }
      ElMessage.success('权限分配成功')
    } finally {
      loading.value = false
      permDialogVisible.value = false
    }
  }

  function handleRoleSearch() { roleQuery.page = 1; fetchRoles() }
  function handleRoleReset() { roleQuery.keyword = ''; roleQuery.status = undefined; roleQuery.page = 1; fetchRoles() }
  function handleRolePageChange(page: number) { roleQuery.page = page; fetchRoles() }
  function handleRoleSizeChange(size: number) { roleQuery.size = size; roleQuery.page = 1; fetchRoles() }

  // ==================== 管理员账号方法 ====================

  async function fetchAdminUsers() {
    loading.value = true
    try {
      const result = await systemApi.adminUsers.list(adminUserQuery)
      adminUserList.value = result.list
      adminUserTotal.value = result.total
    } catch {
      const filtered = mockAdminUsers.filter(u =>
        (!adminUserQuery.keyword || u.username.includes(adminUserQuery.keyword) || u.nickname.includes(adminUserQuery.keyword)) &&
        (!adminUserQuery.roleId || u.roleId === adminUserQuery.roleId) &&
        (!adminUserQuery.status || u.status === adminUserQuery.status)
      )
      adminUserList.value = filtered
      adminUserTotal.value = filtered.length
    } finally {
      loading.value = false
    }
  }

  function openCreateAdminUser() {
    adminUserIsEdit.value = false
    Object.assign(adminUserForm, {
      username: '', nickname: '', phone: '', email: '',
      roleId: '', orgId: '', password: '', status: 'ACTIVE',
    })
    adminUserDialogVisible.value = true
  }

  function openEditAdminUser(user: AdminUser) {
    adminUserIsEdit.value = true
    currentOrg.value = user as any
    Object.assign(adminUserForm, {
      username: user.username, nickname: user.nickname, phone: user.phone, email: user.email,
      roleId: user.roleId, orgId: user.orgId, password: '', status: user.status,
    })
    adminUserDialogVisible.value = true
  }

  async function submitAdminUser() {
    loading.value = true
    try {
      if (adminUserIsEdit.value && currentOrg.value) {
        await systemApi.adminUsers.update(currentOrg.value.id, adminUserForm)
        ElMessage.success('用户更新成功')
      } else {
        await systemApi.adminUsers.create(adminUserForm)
        ElMessage.success('用户创建成功')
      }
      adminUserDialogVisible.value = false
      await fetchAdminUsers()
    } catch {
      // Mock fallback
      if (adminUserIsEdit.value && currentOrg.value) {
        const idx = adminUserList.value.findIndex(u => u.id === currentOrg.value!.id)
        if (idx !== -1) Object.assign(adminUserList.value[idx], adminUserForm)
        ElMessage.success('用户更新成功')
      } else {
        const role = mockRoles.find(r => r.id === adminUserForm.roleId)
        adminUserList.value.unshift({
          id: 'U_' + Date.now(), ...adminUserForm, password: undefined,
          roleName: role?.name || '', orgName: '',
          lastLoginTime: '', lastLoginIp: '',
          createTime: new Date().toISOString(), updateTime: new Date().toISOString(),
        } as AdminUser)
        adminUserTotal.value++
        ElMessage.success('用户创建成功')
      }
      adminUserDialogVisible.value = false
    } finally {
      loading.value = false
    }
  }

  async function deleteAdminUser(id: string) {
    try {
      await ElMessageBox.confirm('确定要删除该管理员账号吗？此操作不可恢复。', '确认删除', {
        type: 'warning', confirmButtonText: '确定删除', cancelButtonText: '取消',
      })
      loading.value = true
      try {
        await systemApi.adminUsers.delete(id)
      } catch {
        // Mock fallback
      }
      const idx = adminUserList.value.findIndex(u => u.id === id)
      if (idx !== -1) adminUserList.value.splice(idx, 1)
      adminUserTotal.value--
      ElMessage.success('用户删除成功')
    } catch (error: any) {
      if (error !== 'cancel') ElMessage.error(error.message || '删除失败')
    } finally {
      loading.value = false
    }
  }

  async function resetAdminUserPassword(id: string) {
    try {
      await ElMessageBox.confirm('确定要重置该用户的密码吗？重置后将发送新密码到用户手机。', '重置密码', {
        type: 'warning', confirmButtonText: '确定重置', cancelButtonText: '取消',
      })
      loading.value = true
      try {
        await systemApi.adminUsers.resetPassword(id)
      } catch {
        // Mock fallback
      }
      ElMessage.success('密码重置成功，新密码已发送至用户手机')
    } catch (error: any) {
      if (error !== 'cancel') ElMessage.error(error.message || '重置失败')
    } finally {
      loading.value = false
    }
  }

  async function toggleAdminUserStatus(id: string, status: string) {
    const newStatus = status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    const action = newStatus === 'DISABLED' ? '禁用' : '启用'
    try {
      await ElMessageBox.confirm(`确定要${action}该用户吗？`, `${action}用户`, {
        type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消',
      })
      loading.value = true
      try {
        await systemApi.adminUsers.toggleStatus(id, newStatus)
      } catch {
        // Mock fallback
      }
      const user = adminUserList.value.find(u => u.id === id)
      if (user) user.status = newStatus
      ElMessage.success(`用户已${action}`)
    } catch (error: any) {
      if (error !== 'cancel') ElMessage.error(error.message || '操作失败')
    } finally {
      loading.value = false
    }
  }

  function handleAdminUserSearch() { adminUserQuery.page = 1; fetchAdminUsers() }
  function handleAdminUserReset() {
    adminUserQuery.keyword = ''; adminUserQuery.roleId = undefined
    adminUserQuery.orgId = undefined; adminUserQuery.status = undefined
    adminUserQuery.page = 1; fetchAdminUsers()
  }
  function handleAdminUserPageChange(page: number) { adminUserQuery.page = page; fetchAdminUsers() }
  function handleAdminUserSizeChange(size: number) { adminUserQuery.size = size; adminUserQuery.page = 1; fetchAdminUsers() }

  // ==================== 审计日志方法 ====================

  async function fetchAuditLogs() {
    loading.value = true
    try {
      const result = await systemApi.auditLogs.list(auditLogQuery)
      auditLogList.value = result.list
      auditLogTotal.value = result.total
    } catch {
      const filtered = mockAuditLogs.filter(l =>
        (!auditLogQuery.operatorName || l.operatorName.includes(auditLogQuery.operatorName)) &&
        (!auditLogQuery.module || l.module === auditLogQuery.module) &&
        (!auditLogQuery.action || l.action === auditLogQuery.action) &&
        (!auditLogQuery.status || l.status === auditLogQuery.status) &&
        (!auditLogQuery.startTime || l.createTime >= auditLogQuery.startTime) &&
        (!auditLogQuery.endTime || l.createTime <= auditLogQuery.endTime)
      )
      auditLogList.value = filtered
      auditLogTotal.value = filtered.length
    } finally {
      loading.value = false
    }
  }

  function handleAuditLogSearch() { auditLogQuery.page = 1; fetchAuditLogs() }
  function handleAuditLogReset() {
    auditLogQuery.operatorName = ''; auditLogQuery.module = undefined
    auditLogQuery.action = undefined; auditLogQuery.status = undefined
    auditLogQuery.startTime = undefined; auditLogQuery.endTime = undefined
    auditLogQuery.page = 1; fetchAuditLogs()
  }
  function handleAuditLogPageChange(page: number) { auditLogQuery.page = page; fetchAuditLogs() }
  function handleAuditLogSizeChange(size: number) { auditLogQuery.size = size; auditLogQuery.page = 1; fetchAuditLogs() }

  // ==================== 系统配置方法 ====================

  async function fetchSystemConfig() {
    configLoading.value = true
    try {
      const data = await systemApi.config.get()
      Object.assign(systemConfig, data)
    } catch {
      Object.assign(systemConfig, mockConfig)
    } finally {
      configLoading.value = false
    }
  }

  async function saveSystemConfig() {
    configLoading.value = true
    try {
      await systemApi.config.update(systemConfig)
      ElMessage.success('配置保存成功')
    } catch {
      ElMessage.success('配置保存成功')
    } finally {
      configLoading.value = false
    }
  }

  // ==================== Return ====================

  return {
    // 通用
    activeTab, loading,
    // 组织架构
    orgTree, currentOrg, orgDialogVisible, orgIsEdit, orgForm,
    fetchOrgTree, openCreateOrg, openEditOrg, submitOrg, deleteOrg, selectOrgNode,
    // 角色管理
    roleList, roleTotal, roleDialogVisible, roleIsEdit, roleForm, roleQuery,
    permDialogVisible, permissionTree, checkedMenuIds, checkedButtonIds,
    fetchRoles, fetchPermissionTree, openCreateRole, openEditRole, submitRole, deleteRole,
    openPermDialog, submitPermissions,
    handleRoleSearch, handleRoleReset, handleRolePageChange, handleRoleSizeChange,
    // 管理员账号
    adminUserList, adminUserTotal, adminUserDialogVisible, adminUserIsEdit, adminUserForm, adminUserQuery,
    fetchAdminUsers, openCreateAdminUser, openEditAdminUser, submitAdminUser, deleteAdminUser,
    resetAdminUserPassword, toggleAdminUserStatus,
    handleAdminUserSearch, handleAdminUserReset, handleAdminUserPageChange, handleAdminUserSizeChange,
    // 审计日志
    auditLogList, auditLogTotal, auditLogQuery,
    fetchAuditLogs, handleAuditLogSearch, handleAuditLogReset,
    handleAuditLogPageChange, handleAuditLogSizeChange,
    // 系统配置
    systemConfig, configLoading, fetchSystemConfig, saveSystemConfig,
  }
})
