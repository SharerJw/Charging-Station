<script setup lang="ts">
defineProps<{
  name: string
  size?: number
  color?: string
}>()
</script>

<template>
  <svg
    class="svg-icon"
    :width="size || 20"
    :height="size || 20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- 充电桩 / 工厂 -->
    <path v-if="name === 'station'" d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z" :fill="color || 'currentColor'" />
    <!-- 闪电 -->
    <path v-else-if="name === 'lightning'" d="M7 2v11h3v9l7-12h-4l4-8H7z" :fill="color || 'currentColor'" />
    <!-- 电池 -->
    <path v-else-if="name === 'battery'" d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4zm-2.72 13.95h-1.9v-1.9h1.9v1.9zm0-3.57h-1.9V8.62h1.9v5.76z" :fill="color || 'currentColor'" />
    <!-- 在线/绿点 -->
    <path v-else-if="name === 'online'" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" :fill="color || '#10B981'" />
    <!-- 设备/CPU -->
    <path v-else-if="name === 'device'" d="M15 9H9v6h6V9zm-2 4h-2v-2h2v2zm8-2V9h-2V7c0-1.1-.9-2-2-2h-2V3h-2v2h-2V3H9v2H7c-1.1 0-2 .9-2 2v2H3v2h2v2H3v2h2v2c0 1.1.9 2 2 2h2v2h2v-2h2v2h2v-2h2c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2zm-4 6H7V7h10v10z" :fill="color || 'currentColor'" />
    <!-- 连接 -->
    <path v-else-if="name === 'connection'" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM6.5 9L10 5.5 13.5 9H11v4H9V9H6.5zm11 6L14 18.5 10.5 15H13v-4h2v4h2.5z" :fill="color || 'currentColor'" />
    <!-- 文档 -->
    <path v-else-if="name === 'document'" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" :fill="color || 'currentColor'" />
    <!-- 仪表盘 -->
    <path v-else-if="name === 'dashboard'" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" :fill="color || 'currentColor'" />
    <!-- 时钟 -->
    <path v-else-if="name === 'timer'" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" :fill="color || 'currentColor'" />
    <!-- 人民币 -->
    <path v-else-if="name === 'money'" d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" :fill="color || 'currentColor'" />
    <!-- 插头 -->
    <path v-else-if="name === 'plug'" d="M16.01 7L16 3h-2v4h-4V3H8v4h-.01C7 8.01 6 9.01 6 10.01v5.49L9.5 19v3h5v-3l3.5-3.5v-5.5c0-1-.99-1.99-1.99-2.01zM16 16.5L12.5 19.99h-1L8 16.5v-5.5c0-.55.45-1 1-1h6c.55 0 1 .45 1 1v5.5z" :fill="color || 'currentColor'" />
    <!-- 温度计 -->
    <path v-else-if="name === 'temperature'" d="M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-4-8c0-.55.45-1 1-1s1 .45 1 1h-1v1h1v2h-1v1h1v2h-2V5z" :fill="color || 'currentColor'" />
    <!-- 信号/趋势 -->
    <path v-else-if="name === 'trend'" d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z" :fill="color || 'currentColor'" />
    <!-- 设置齿轮 -->
    <path v-else-if="name === 'settings'" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" :fill="color || 'currentColor'" />
    <!-- WiFi/信号 -->
    <path v-else-if="name === 'wifi'" d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" :fill="color || 'currentColor'" />
    <!-- 搜索 -->
    <path v-else-if="name === 'search'" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" :fill="color || 'currentColor'" />
    <!-- 场景/编排 -->
    <path v-else-if="name === 'scenario'" d="M22 11V3h-7v3H9V3H2v8h7V8h2v10h4v3h7v-8h-7v3h-2V8h2v3h7zM7 9H4V5h3v4zm10 6h3v4h-3v-4zm0-10h3v4h-3V5z" :fill="color || 'currentColor'" />
    <!-- 终端/命令行 -->
    <path v-else-if="name === 'terminal'" d="M20 19.59V8l-6-6H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c.45 0 .85-.15 1.19-.4l-4.43-4.43c-.8.52-1.74.83-2.76.83-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5c0 1.02-.31 1.96-.83 2.75L20 19.59zM9 13c0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3-3 1.34-3 3z" :fill="color || 'currentColor'" />
    <!-- 事件/通知 -->
    <path v-else-if="name === 'event'" d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" :fill="color || 'currentColor'" />
    <!-- 刷新 -->
    <path v-else-if="name === 'refresh'" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" :fill="color || 'currentColor'" />
    <!-- 暂停 -->
    <path v-else-if="name === 'pause'" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" :fill="color || 'currentColor'" />
    <!-- 播放 -->
    <path v-else-if="name === 'play'" d="M8 5v14l11-7z" :fill="color || 'currentColor'" />
    <!-- 停止 -->
    <path v-else-if="name === 'stop'" d="M6 6h12v12H6z" :fill="color || 'currentColor'" />
    <!-- 数据/图表 -->
    <path v-else-if="name === 'chart'" d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z" :fill="color || 'currentColor'" />
    <!-- 网格 -->
    <path v-else-if="name === 'grid'" d="M3 3v18h18V3H3zm8 16H5v-6h6v6zm0-8H5V5h6v6zm8 8h-6v-6h6v6zm0-8h-6V5h6v6z" :fill="color || 'currentColor'" />
    <!-- 展开 -->
    <path v-else-if="name === 'expand'" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" :fill="color || 'currentColor'" />
    <!-- 收起 -->
    <path v-else-if="name === 'collapse'" d="M3 18h13v-2H3v2zm0-5h10v-2H3v2zm0-7v2h18V6H3zm18 12.41L17.59 15 16 16.59 19.41 20 16 23.41 17.59 25 23 19.59z" :fill="color || 'currentColor'" />
    <!-- 默认问号 -->
    <path v-else d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" :fill="color || 'currentColor'" />
  </svg>
</template>

<style scoped>
.svg-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
