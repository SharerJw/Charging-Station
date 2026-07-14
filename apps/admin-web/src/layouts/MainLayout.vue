<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import Header from '@/components/Header.vue'
import TabBar from '@/components/TabBar.vue'

const collapsed = ref(false)

function toggleSidebar() {
  collapsed.value = !collapsed.value
}
</script>

<template>
  <el-container class="main-layout">
    <!-- 侧边栏 -->
    <el-aside :width="collapsed ? '64px' : '240px'" class="layout-aside">
      <Sidebar :collapsed="collapsed" @toggle="toggleSidebar" />
    </el-aside>

    <!-- 右侧区域 -->
    <el-container class="layout-right">
      <!-- Header -->
      <el-header class="layout-header" height="56px">
        <Header />
      </el-header>

      <!-- TabBar -->
      <div class="layout-tabs">
        <TabBar />
      </div>

      <!-- 内容区 -->
      <el-main class="layout-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.main-layout {
  height: 100vh;
  overflow: hidden;
}

.layout-aside {
  background-color: #001529;
  transition: width 0.3s;
  overflow: hidden;
  flex-shrink: 0;
}

.layout-right {
  flex: 1;
  overflow: hidden;
}

.layout-header {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  z-index: 10;
  padding: 0;
}

.layout-tabs {
  flex-shrink: 0;
}

.layout-main {
  background: #F0F2F5;
  padding: 16px;
  overflow-y: auto;
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
