<template>
  <view class="process-page">
    <view class="loading-state" v-if="loading">
      <text class="loading-text">加载中...</text>
    </view>

    <template v-else>
      <!-- 设备验证 -->
      <view class="section-card">
        <text class="section-title">设备验证</text>
        <view class="verify-row">
          <view class="verify-info">
            <text class="verify-label">设备编号</text>
            <text class="verify-value">{{ form.deviceCode || '请扫码或NFC验证' }}</text>
          </view>
          <view class="verify-actions">
            <button class="verify-btn" @tap="scanQR">扫码</button>
            <button class="verify-btn nfc" @tap="scanNFC">NFC</button>
          </view>
        </view>
        <view class="verify-status" v-if="form.verified" :class="form.verified ? 'verified' : ''">
          <text class="verify-status-text">验证通过</text>
        </view>
      </view>

      <!-- 故障诊断 -->
      <view class="section-card">
        <text class="section-title">故障诊断</text>
        <view class="form-group">
          <text class="form-label">诊断结果</text>
          <textarea
            class="form-textarea"
            v-model="form.diagnosis"
            placeholder="请描述故障诊断结果"
            :maxlength="500"
          />
        </view>
      </view>

      <!-- 三级故障原因选择 -->
      <view class="section-card">
        <text class="section-title">故障原因</text>
        <view class="cause-selector">
          <!-- 一级分类 -->
          <view class="cause-level">
            <text class="cause-level-label">一级分类</text>
            <scroll-view scroll-x class="cause-scroll">
              <view class="cause-tags">
                <text
                  v-for="item in level1Causes"
                  :key="item.id"
                  class="cause-tag"
                  :class="{ active: form.causeL1 === item.id }"
                  @tap="selectCauseL1(item)"
                >{{ item.name }}</text>
              </view>
            </scroll-view>
          </view>
          <!-- 二级分类 -->
          <view class="cause-level" v-if="form.causeL1">
            <text class="cause-level-label">二级分类</text>
            <scroll-view scroll-x class="cause-scroll">
              <view class="cause-tags">
                <text
                  v-for="item in level2Causes"
                  :key="item.id"
                  class="cause-tag"
                  :class="{ active: form.causeL2 === item.id }"
                  @tap="selectCauseL2(item)"
                >{{ item.name }}</text>
              </view>
            </scroll-view>
          </view>
          <!-- 三级分类 -->
          <view class="cause-level" v-if="form.causeL2">
            <text class="cause-level-label">三级分类</text>
            <scroll-view scroll-x class="cause-scroll">
              <view class="cause-tags">
                <text
                  v-for="item in level3Causes"
                  :key="item.id"
                  class="cause-tag"
                  :class="{ active: form.causeL3 === item.id }"
                  @tap="selectCauseL3(item)"
                >{{ item.name }}</text>
              </view>
            </scroll-view>
          </view>
        </view>
      </view>

      <!-- 处理措施 -->
      <view class="section-card">
        <text class="section-title">处理措施</text>
        <textarea
          class="form-textarea tall"
          v-model="form.treatment"
          placeholder="请详细描述处理措施"
          :maxlength="1000"
        />
      </view>

      <!-- 维修前后照片 -->
      <view class="section-card">
        <text class="section-title">维修照片</text>
        <view class="photo-section">
          <view class="photo-group">
            <text class="photo-label">维修前</text>
            <view class="photo-grid">
              <view class="photo-item" v-for="(img, idx) in form.beforePhotos" :key="'b' + idx">
                <image :src="img" class="photo-img" mode="aspectFill" @tap="previewPhoto(form.beforePhotos, idx)" />
                <view class="photo-remove" @tap="removePhoto('before', idx)">
                  <text class="photo-remove-x">x</text>
                </view>
              </view>
              <view class="photo-add" @tap="addPhoto('before')" v-if="form.beforePhotos.length < 6">
                <text class="photo-add-icon">+</text>
                <text class="photo-add-text">拍照/相册</text>
              </view>
            </view>
          </view>
          <view class="photo-group">
            <text class="photo-label">维修后</text>
            <view class="photo-grid">
              <view class="photo-item" v-for="(img, idx) in form.afterPhotos" :key="'a' + idx">
                <image :src="img" class="photo-img" mode="aspectFill" @tap="previewPhoto(form.afterPhotos, idx)" />
                <view class="photo-remove" @tap="removePhoto('after', idx)">
                  <text class="photo-remove-x">x</text>
                </view>
              </view>
              <view class="photo-add" @tap="addPhoto('after')" v-if="form.afterPhotos.length < 6">
                <text class="photo-add-icon">+</text>
                <text class="photo-add-text">拍照/相册</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 备件消耗 -->
      <view class="section-card">
        <text class="section-title">备件消耗</text>
        <view class="spare-list" v-if="form.spareParts.length > 0">
          <view class="spare-item" v-for="(part, idx) in form.spareParts" :key="idx">
            <view class="spare-info">
              <input class="spare-input" v-model="part.name" placeholder="备件名称" />
              <input class="spare-input small" v-model="part.quantity" type="number" placeholder="数量" />
            </view>
            <view class="spare-remove" @tap="removeSparePart(idx)">
              <text class="spare-remove-text">删除</text>
            </view>
          </view>
        </view>
        <button class="add-spare-btn" @tap="addSparePart">+ 添加备件</button>
      </view>

      <!-- 测试结果 -->
      <view class="section-card">
        <text class="section-title">测试结果</text>
        <view class="test-results">
          <view class="test-item" v-for="(test, idx) in testItems" :key="idx">
            <text class="test-name">{{ test.name }}</text>
            <view class="test-toggle">
              <text
                class="toggle-btn pass"
                :class="{ active: test.pass === true }"
                @tap="setTestResult(idx, true)"
              >通过</text>
              <text
                class="toggle-btn fail"
                :class="{ active: test.pass === false }"
                @tap="setTestResult(idx, false)"
              >不通过</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 提交按钮 -->
      <view class="submit-area">
        <button class="submit-btn" :disabled="submitting" @tap="handleSubmit">
          {{ submitting ? '提交中...' : '提交处理结果' }}
        </button>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/api'

interface CauseItem {
  id: string
  name: string
  children?: CauseItem[]
}

interface SparePart {
  name: string
  quantity: string
}

interface TestItem {
  name: string
  pass: boolean | null
}

const workorderId = ref('')
const loading = ref(false)
const submitting = ref(false)

const form = ref({
  deviceCode: '',
  verified: false,
  diagnosis: '',
  causeL1: '',
  causeL2: '',
  causeL3: '',
  treatment: '',
  beforePhotos: [] as string[],
  afterPhotos: [] as string[],
  spareParts: [] as SparePart[],
})

// 三级故障原因数据
const faultCauseTree = ref<CauseItem[]>([
  {
    id: 'hardware', name: '硬件故障', children: [
      {
        id: 'power', name: '电源模块', children: [
          { id: 'power-fuse', name: '保险丝烧毁' },
          { id: 'power-board', name: '电源板损坏' },
          { id: 'power-cable', name: '线缆老化' },
        ]
      },
      {
        id: 'connector', name: '充电枪/接口', children: [
          { id: 'conn-lock', name: '锁止机构故障' },
          { id: 'conn-pin', name: '触点烧蚀' },
          { id: 'conn-cable', name: '线缆破损' },
        ]
      },
      {
        id: 'screen', name: '显示屏', children: [
          { id: 'screen-black', name: '黑屏' },
          { id: 'screen-touch', name: '触控失灵' },
        ]
      },
    ]
  },
  {
    id: 'software', name: '软件故障', children: [
      {
        id: 'comm', name: '通信异常', children: [
          { id: 'comm-4g', name: '4G信号丢失' },
          { id: 'comm-wifi', name: 'WiFi连接失败' },
          { id: 'comm-ocpp', name: 'OCPP连接断开' },
        ]
      },
      {
        id: 'meter', name: '计量异常', children: [
          { id: 'meter-drift', name: '电表漂移' },
          { id: 'meter-reset', name: '计量数据重置' },
        ]
      },
    ]
  },
  {
    id: 'env', name: '环境因素', children: [
      {
        id: 'power-grid', name: '电网问题', children: [
          { id: 'grid-over', name: '过压' },
          { id: 'grid-under', name: '欠压' },
          { id: 'grid-phase', name: '缺相' },
        ]
      },
      {
        id: 'weather', name: '天气影响', children: [
          { id: 'weather-heat', name: '高温过温' },
          { id: 'weather-water', name: '进水/潮湿' },
        ]
      },
    ]
  },
])

const level1Causes = computed(() => faultCauseTree.value)

const level2Causes = computed(() => {
  const l1 = faultCauseTree.value.find(c => c.id === form.value.causeL1)
  return l1?.children || []
})

const level3Causes = computed(() => {
  const l1 = faultCauseTree.value.find(c => c.id === form.value.causeL1)
  const l2 = l1?.children?.find(c => c.id === form.value.causeL2)
  return l2?.children || []
})

const testItems = ref<TestItem[]>([
  { name: '充电启动测试', pass: null },
  { name: '充电停止测试', pass: null },
  { name: '通信连接测试', pass: null },
  { name: '安全保护测试', pass: null },
  { name: '计量精度测试', pass: null },
])

function selectCauseL1(item: CauseItem) {
  form.value.causeL1 = item.id
  form.value.causeL2 = ''
  form.value.causeL3 = ''
}

function selectCauseL2(item: CauseItem) {
  form.value.causeL2 = item.id
  form.value.causeL3 = ''
}

function selectCauseL3(item: CauseItem) {
  form.value.causeL3 = item.id
}

function scanQR() {
  uni.scanCode({
    scanType: ['qrCode', 'barCode'],
    success: (res) => {
      form.value.deviceCode = res.result
      form.value.verified = true
      uni.showToast({ title: '设备验证通过', icon: 'success' })
    },
    fail: () => {
      uni.showToast({ title: '扫码取消', icon: 'none' })
    },
  })
}

function scanNFC() {
  // NFC 读取设备标签
  uni.showToast({ title: '请将设备靠近NFC感应区', icon: 'none', duration: 2000 })
  // 模拟NFC验证
  setTimeout(() => {
    form.value.deviceCode = 'NFC-' + Date.now().toString(36).toUpperCase()
    form.value.verified = true
    uni.showToast({ title: 'NFC验证通过', icon: 'success' })
  }, 1500)
}

function addPhoto(type: 'before' | 'after') {
  uni.chooseImage({
    count: 6,
    sizeType: ['compressed'],
    sourceType: ['camera', 'album'],
    success: (res) => {
      const target = type === 'before' ? form.value.beforePhotos : form.value.afterPhotos
      res.tempFilePaths.forEach((path) => {
        if (target.length < 6) {
          // 添加时间水印（通过服务端或uni canvas实现）
          const now = new Date()
          const watermark = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
          // 实际项目中应通过canvas绘制水印后上传，此处简化为直接使用临时路径
          target.push(path)
        }
      })
    },
  })
}

function previewPhoto(list: string[], idx: number) {
  uni.previewImage({ urls: list, current: idx })
}

function removePhoto(type: 'before' | 'after', idx: number) {
  if (type === 'before') {
    form.value.beforePhotos.splice(idx, 1)
  } else {
    form.value.afterPhotos.splice(idx, 1)
  }
}

function addSparePart() {
  form.value.spareParts.push({ name: '', quantity: '' })
}

function removeSparePart(idx: number) {
  form.value.spareParts.splice(idx, 1)
}

function setTestResult(idx: number, pass: boolean) {
  testItems.value[idx].pass = pass
}

async function handleSubmit() {
  // 表单校验
  if (!form.value.diagnosis) {
    uni.showToast({ title: '请填写诊断结果', icon: 'none' })
    return
  }
  if (!form.value.causeL1) {
    uni.showToast({ title: '请选择故障原因', icon: 'none' })
    return
  }
  if (!form.value.treatment) {
    uni.showToast({ title: '请填写处理措施', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    const causeNames: string[] = []
    const l1 = faultCauseTree.value.find(c => c.id === form.value.causeL1)
    if (l1) causeNames.push(l1.name)
    const l2 = l1?.children?.find(c => c.id === form.value.causeL2)
    if (l2) causeNames.push(l2.name)
    const l3 = l2?.children?.find(c => c.id === form.value.causeL3)
    if (l3) causeNames.push(l3.name)

    await api.processWorkorder(workorderId.value, {
      deviceCode: form.value.deviceCode,
      diagnosis: form.value.diagnosis,
      causeCategory: causeNames.join(' > '),
      causeCode: form.value.causeL3 || form.value.causeL2 || form.value.causeL1,
      treatment: form.value.treatment,
      beforePhotos: form.value.beforePhotos,
      afterPhotos: form.value.afterPhotos,
      spareParts: form.value.spareParts.filter(p => p.name),
      testResults: testItems.value.map(t => ({ name: t.name, pass: t.pass })),
    })
    uni.showToast({ title: '提交成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch {
    uni.showToast({ title: '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

async function loadWorkorderData() {
  loading.value = true
  try {
    const result = await api.getWorkorderDetail(workorderId.value)
    if (result) {
      form.value.deviceCode = result.deviceCode || ''
    }
  } catch {
    // 允许手动填写
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  workorderId.value = currentPage?.options?.id || currentPage?.$page?.options?.id || ''
  if (workorderId.value) {
    loadWorkorderData()
  } else {
    loading.value = false
  }
})
</script>

<style scoped>
.process-page {
  padding: 24rpx;
  background: #F0F2F5;
  min-height: 100vh;
  padding-bottom: 180rpx;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 120rpx 0;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

.section-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 16rpx;
}

/* 设备验证 */
.verify-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.verify-info {
  flex: 1;
}

.verify-label {
  font-size: 22rpx;
  color: #999;
  display: block;
}

.verify-value {
  font-size: 26rpx;
  color: #333;
  font-family: monospace;
  margin-top: 4rpx;
}

.verify-actions {
  display: flex;
  gap: 12rpx;
}

.verify-btn {
  font-size: 24rpx;
  background: #1677FF;
  color: #fff;
  border: none;
  border-radius: 8rpx;
  padding: 12rpx 32rpx;
}

.verify-btn.nfc {
  background: #722ED1;
}

.verify-status {
  margin-top: 12rpx;
  padding: 8rpx 16rpx;
  background: #F6FFED;
  border-radius: 8rpx;
}

.verify-status-text {
  font-size: 24rpx;
  color: #52C41A;
}

/* 表单 */
.form-group {
  margin-bottom: 16rpx;
}

.form-label {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-bottom: 8rpx;
}

.form-textarea {
  width: 100%;
  min-height: 120rpx;
  background: #FAFAFA;
  border: 1rpx solid #E8E8E8;
  border-radius: 8rpx;
  padding: 16rpx;
  font-size: 26rpx;
  color: #333;
  box-sizing: border-box;
}

.form-textarea.tall {
  min-height: 200rpx;
}

/* 故障原因选择 */
.cause-selector {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.cause-level {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.cause-level-label {
  font-size: 22rpx;
  color: #999;
}

.cause-scroll {
  white-space: nowrap;
}

.cause-tags {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}

.cause-tag {
  display: inline-block;
  font-size: 24rpx;
  padding: 10rpx 24rpx;
  background: #F5F5F5;
  border-radius: 8rpx;
  color: #666;
  border: 2rpx solid transparent;
}

.cause-tag.active {
  background: #E6F7FF;
  color: #1677FF;
  border-color: #1677FF;
  font-weight: bold;
}

/* 照片 */
.photo-section {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.photo-group {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.photo-label {
  font-size: 24rpx;
  color: #666;
  font-weight: bold;
}

.photo-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.photo-item {
  position: relative;
  width: 160rpx;
  height: 160rpx;
}

.photo-img {
  width: 160rpx;
  height: 160rpx;
  border-radius: 8rpx;
}

.photo-remove {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 36rpx;
  height: 36rpx;
  background: #FF4D4F;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-remove-x {
  color: #fff;
  font-size: 20rpx;
  font-weight: bold;
}

.photo-add {
  width: 160rpx;
  height: 160rpx;
  background: #FAFAFA;
  border: 2rpx dashed #D9D9D9;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
}

.photo-add-icon {
  font-size: 48rpx;
  color: #D9D9D9;
  line-height: 1;
}

.photo-add-text {
  font-size: 20rpx;
  color: #BBB;
}

/* 备件消耗 */
.spare-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.spare-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.spare-info {
  flex: 1;
  display: flex;
  gap: 12rpx;
}

.spare-input {
  flex: 1;
  background: #FAFAFA;
  border: 1rpx solid #E8E8E8;
  border-radius: 8rpx;
  padding: 12rpx 16rpx;
  font-size: 24rpx;
}

.spare-input.small {
  max-width: 140rpx;
}

.spare-remove {
  padding: 8rpx 16rpx;
}

.spare-remove-text {
  font-size: 22rpx;
  color: #FF4D4F;
}

.add-spare-btn {
  font-size: 24rpx;
  color: #1677FF;
  background: #E6F7FF;
  border: 2rpx dashed #1677FF;
  border-radius: 8rpx;
  padding: 16rpx;
  width: 100%;
  box-sizing: border-box;
}

/* 测试结果 */
.test-results {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.test-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #F5F5F5;
}

.test-item:last-child {
  border-bottom: none;
}

.test-name {
  font-size: 26rpx;
  color: #333;
}

.test-toggle {
  display: flex;
  gap: 12rpx;
}

.toggle-btn {
  font-size: 24rpx;
  padding: 8rpx 24rpx;
  border-radius: 8rpx;
  background: #F5F5F5;
  color: #999;
}

.toggle-btn.pass.active {
  background: #F6FFED;
  color: #52C41A;
  border: 2rpx solid #52C41A;
}

.toggle-btn.fail.active {
  background: #FFF2F0;
  color: #FF4D4F;
  border: 2rpx solid #FF4D4F;
}

/* 提交按钮 */
.submit-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx;
  background: #fff;
  box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.06);
  z-index: 100;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #1677FF;
  color: #fff;
  font-size: 30rpx;
  font-weight: bold;
  border-radius: 12rpx;
  border: none;
}

.submit-btn[disabled] {
  opacity: 0.6;
}
</style>
