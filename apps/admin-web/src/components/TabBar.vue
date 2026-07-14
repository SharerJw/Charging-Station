<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useTabStore } from '@/store/tabs'
import { Close, Refresh, CloseBold, FolderRemove } from '@element-plus/icons-vue'

const router = useRouter()
const tabStore = useTabStore()

function handleTabClick(path: string) {
  tabStore.activeTab = path
  router.push(path)
}

function handleClose(path: string) {
  const nextPath = tabStore.removeTab(path)
  if (nextPath) {
    router.push(nextPath)
  }
}

function handleCommand(command: string) {
  switch (command) {
    case 'closeOther':
      tabStore.removeOtherTabs(tabStore.activeTab)
      break
    case 'closeAll':
      const path = tabStore.removeAllTabs()
      router.push(path)
      break
    case 'refresh':
      router.replace({ path: '/redirect' + tabStore.activeTab })
      break
  }
}
</script>

<template>
  <div class="tab-bar">
    <div class="tabs-scroll">
      <div
        v-for="tab in tabStore.tabs"
        :key="tab.path"
        class="tab-item"
        :class="{ active: tabStore.activeTab === tab.path }"
        @click="handleTabClick(tab.path)"
        @contextmenu.prevent
      >
        <span class="tab-title">{{ tab.title }}</span>
        <el-icon
          v-if="tab.closable"
          class="tab-close"
          :size="12"
          @click.stop="handleClose(tab.path)"
        >
          <Close />
        </el-icon>
      </div>
    </div>

    <el-dropdown trigger="click" @command="handleCommand" class="tab-actions">
      <div class="tab-action-btn">
        <el-icon :size="14"><CloseBold /></el-icon>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="refresh">
            <el-icon><Refresh /></el-icon> 刷新当前页
          </el-dropdown-item>
          <el-dropdown-item command="closeOther">
            <el-icon><FolderRemove /></el-icon> 关闭其他
          </el-dropdown-item>
          <el-dropdown-item command="closeAll">
            <el-icon><CloseBold /></el-icon> 关闭全部
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style scoped>
.tab-bar {
  display: flex;
  align-items: center;
  height: 40px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 8px;
}

.tabs-scroll {
  flex: 1;
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
}

.tabs-scroll::-webkit-scrollbar {
  display: none;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  font-size: 12px;
  color: #666;
  transition: all 0.2s;
  flex-shrink: 0;
}

.tab-item:hover {
  background: #f5f5f5;
}

.tab-item.active {
  background: #e6f4ff;
  color: #1677FF;
  font-weight: 500;
}

.tab-close {
  border-radius: 50%;
  transition: all 0.2s;
}

.tab-close:hover {
  background: rgba(0, 0, 0, 0.1);
}

.tab-actions {
  flex-shrink: 0;
  margin-left: 8px;
}

.tab-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.tab-action-btn:hover {
  background: #f5f5f5;
}
</style>
