<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const scenarios = ref([
  { id: 1, name: '正常充电流程', description: '模拟完整的充电流程：插枪→启动→充电→停止→拔枪', status: 'ready', steps: 5 },
  { id: 2, name: '异常断电测试', description: '模拟充电过程中突然断电的场景', status: 'ready', steps: 4 },
  { id: 3, name: '高并发测试', description: '模拟多个充电桩同时充电的场景', status: 'ready', steps: 3 },
  { id: 4, name: 'OCPP心跳测试', description: '测试设备心跳上报和超时处理', status: 'ready', steps: 2 },
])

const runningScenario = ref<number | null>(null)

const handleRun = (scenario: any) => {
  runningScenario.value = scenario.id
  scenario.status = 'running'
  ElMessage.success(`场景「${scenario.name}」开始执行`)
  // 模拟执行完成
  setTimeout(() => {
    if (scenario.status === 'running') {
      scenario.status = 'completed'
      runningScenario.value = null
      ElMessage.success(`场景「${scenario.name}」执行完成`)
    }
  }, 5000 + Math.random() * 10000)
}

const handleStop = (scenario: any) => {
  runningScenario.value = null
  scenario.status = 'ready'
  ElMessage.info(`场景「${scenario.name}」已停止`)
}

const statusColors: Record<string, string> = {
  ready: 'info',
  running: 'warning',
  completed: 'success',
  failed: 'danger',
}

const statusLabels: Record<string, string> = {
  ready: '就绪',
  running: '运行中',
  completed: '已完成',
  failed: '失败',
}
</script>

<template>
  <div class="scenario-page">
    <div class="page-header">
      <h2 class="page-title">场景编排</h2>
      <el-button type="primary">创建场景</el-button>
    </div>

    <div class="scenario-list">
      <div v-for="scenario in scenarios" :key="scenario.id" class="scenario-card card">
        <div class="scenario-header">
          <div class="scenario-info">
            <h3 class="scenario-name">{{ scenario.name }}</h3>
            <p class="scenario-desc">{{ scenario.description }}</p>
          </div>
          <el-tag :type="(statusColors[scenario.status] as any)" size="small">
            {{ statusLabels[scenario.status] }}
          </el-tag>
        </div>

        <div class="scenario-meta">
          <span class="meta-item">步骤数: {{ scenario.steps }}</span>
        </div>

        <div class="scenario-actions">
          <el-button
            v-if="scenario.status === 'ready'"
            type="primary"
            size="small"
            @click="handleRun(scenario)"
          >
            运行
          </el-button>
          <el-button
            v-if="scenario.status === 'running'"
            type="danger"
            size="small"
            @click="handleStop(scenario)"
          >
            停止
          </el-button>
          <el-button size="small">编辑</el-button>
          <el-button size="small" type="info">查看日志</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scenario-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 20px;
  color: var(--text-primary);
  margin: 0;
}

.scenario-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.scenario-card {
  padding: 20px;
}

.scenario-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.scenario-name {
  font-size: 18px;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.scenario-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.scenario-meta {
  margin-bottom: 16px;
}

.meta-item {
  font-size: 14px;
  color: var(--text-secondary);
}

.scenario-actions {
  display: flex;
  gap: 12px;
}
</style>
