<script setup lang="ts">
import { ref, computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'

use([CanvasRenderer, LineChart, BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent])

const period = ref('7d')
const analysisType = ref('user')

const userGrowthChart = computed(() => ({
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: ['7/7', '7/8', '7/9', '7/10', '7/11', '7/12', '7/13'] },
  yAxis: { type: 'value' },
  series: [
    { name: '新增用户', type: 'bar', data: [12, 15, 8, 22, 18, 25, 20], itemStyle: { color: '#1677FF' } },
    { name: '活跃用户', type: 'line', data: [180, 195, 170, 220, 210, 245, 230], itemStyle: { color: '#52C41A' } },
  ],
}))

const stationRevenueChart = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
  xAxis: { type: 'value' },
  yAxis: { type: 'category', data: ['广州天河', '杭州西湖', '深圳南山', '上海浦东', '北京朝阳'].reverse() },
  series: [{ type: 'bar', data: [15234, 28789, 32456, 38901, 45678].reverse(), itemStyle: { color: '#1677FF' }, label: { show: true, position: 'right', formatter: '¥{c}' } }],
}))

const chargingBehaviorChart = computed(() => ({
  tooltip: { trigger: 'item' },
  series: [{
    type: 'pie', radius: ['40%', '70%'],
    data: [
      { value: 35, name: '30分钟以内' },
      { value: 40, name: '30-60分钟' },
      { value: 18, name: '1-2小时' },
      { value: 7, name: '2小时以上' },
    ],
  }],
}))

const socChart = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['开始SOC', '结束SOC'] },
  xAxis: { type: 'category', data: ['10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%'] },
  yAxis: { type: 'value', name: '订单占比(%)' },
  series: [
    { name: '开始SOC', type: 'bar', data: [5, 15, 25, 20, 15, 10, 7, 3], itemStyle: { color: '#FAAD14' } },
    { name: '结束SOC', type: 'bar', data: [1, 2, 3, 5, 8, 12, 25, 44], itemStyle: { color: '#52C41A' } },
  ],
}))

const peakHoursChart = computed(() => ({
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: Array.from({ length: 24 }, (_, i) => `${i}:00`) },
  yAxis: { type: 'value', name: '订单量' },
  series: [{
    type: 'bar',
    data: [5, 3, 2, 2, 3, 8, 15, 25, 30, 28, 22, 20, 25, 28, 32, 35, 30, 25, 22, 28, 35, 30, 20, 10],
    itemStyle: {
      color: (params: any) => {
        const hour = params.dataIndex
        if (hour >= 10 && hour < 12 || hour >= 14 && hour < 17) return '#FF4D4F'
        if (hour >= 8 && hour < 10 || hour >= 17 && hour < 21) return '#FAAD14'
        if (hour >= 23 || hour < 6) return '#52C41A'
        return '#1677FF'
      },
    },
  }],
}))
</script>

<template>
  <div class="analytics-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>数据分析</span>
          <div>
            <el-radio-group v-model="analysisType" size="small" style="margin-right: 12px">
              <el-radio-button value="user">用户分析</el-radio-button>
              <el-radio-button value="station">站点分析</el-radio-button>
              <el-radio-button value="behavior">充电行为</el-radio-button>
            </el-radio-group>
            <el-radio-group v-model="period" size="small">
              <el-radio-button value="7d">近7天</el-radio-button>
              <el-radio-button value="30d">近30天</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <!-- 用户分析 -->
      <template v-if="analysisType === 'user'">
        <el-row :gutter="16">
          <el-col :span="12">
            <h4 class="chart-title">用户增长趋势</h4>
            <v-chart :option="userGrowthChart" style="height: 300px" autoresize />
          </el-col>
          <el-col :span="12">
            <h4 class="chart-title">用户活跃度分布</h4>
            <div class="stat-cards">
              <div class="stat-item"><div class="stat-num">1,024</div><div class="stat-label">总用户数</div></div>
              <div class="stat-item"><div class="stat-num">230</div><div class="stat-label">今日活跃</div></div>
              <div class="stat-item"><div class="stat-num">78%</div><div class="stat-label">7日留存率</div></div>
              <div class="stat-item"><div class="stat-num">45%</div><div class="stat-label">30日留存率</div></div>
            </div>
          </el-col>
        </el-row>
      </template>

      <!-- 站点分析 -->
      <template v-if="analysisType === 'station'">
        <el-row :gutter="16">
          <el-col :span="12">
            <h4 class="chart-title">站点营收排行</h4>
            <v-chart :option="stationRevenueChart" style="height: 300px" autoresize />
          </el-col>
          <el-col :span="12">
            <h4 class="chart-title">充电高峰时段</h4>
            <v-chart :option="peakHoursChart" style="height: 300px" autoresize />
          </el-col>
        </el-row>
      </template>

      <!-- 充电行为 -->
      <template v-if="analysisType === 'behavior'">
        <el-row :gutter="16">
          <el-col :span="12">
            <h4 class="chart-title">充电时长分布</h4>
            <v-chart :option="chargingBehaviorChart" style="height: 300px" autoresize />
          </el-col>
          <el-col :span="12">
            <h4 class="chart-title">SOC 分布</h4>
            <v-chart :option="socChart" style="height: 300px" autoresize />
          </el-col>
        </el-row>
      </template>
    </el-card>
  </div>
</template>

<style scoped>
.analytics-page { display: flex; flex-direction: column; gap: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.chart-title { font-size: 15px; color: #333; margin: 0 0 12px; }
.stat-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.stat-item { background: #fafafa; border-radius: 8px; padding: 24px; text-align: center; }
.stat-num { font-size: 28px; font-weight: bold; color: #1677FF; }
.stat-label { font-size: 13px; color: #999; margin-top: 4px; }
</style>
