<template>
  <view class="sheet-mask" :class="{ 'sheet-mask--visible': visible }" @tap="handleClose" />
  <view class="charging-settings-sheet" :class="{ 'sheet--visible': visible }">
    <!-- ===== 拖拽把手条 ===== -->
    <view class="handle-bar" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
      <view class="handle-pill" />
    </view>

    <!-- ===== 可滚动内容区 ===== -->
    <scroll-view scroll-y class="sheet-scroll" :show-scrollbar="false" :enhanced="true" :bounces="false">

      <!-- 1. 设备信息头 -->
      <view class="device-header">
        <view class="device-code-row">
          <text class="device-code-text">{{ deviceCode || '--' }}</text>
          <view class="status-tag" v-if="deviceStatus">
            <text class="status-tag-text">{{ deviceStatus }}</text>
          </view>
        </view>
        <text class="station-name">{{ stationName }}</text>
        <text class="station-address">{{ stationAddress }}</text>

        <view class="price-row">
          <view class="price-main">
            <text class="price-symbol">&yen;</text>
            <text class="price-value">{{ currentPrice }}</text>
            <text class="price-unit">/度</text>
            <view class="price-tag" :class="pricePeriodClass">
              <text class="price-tag-text">{{ pricePeriodLabel }}</text>
            </view>
          </view>
        </view>
        <view class="next-period-hint" v-if="nextPeriodHint">
          <text class="next-period-icon">&#128337;</text>
          <text class="next-period-text">{{ nextPeriodHint }}</text>
        </view>
      </view>

      <!-- 2. 充电方式选择（3卡片单选） -->
      <view class="section">
        <text class="section-title">充电方式</text>
        <view class="mode-cards">
          <!-- 卡片 A: 充满即停（默认选中） -->
          <view
            class="mode-card"
            :class="{ 'mode-card--selected': selectedMode === 'auto' }"
            @tap="selectMode('auto')"
          >
            <view class="mode-card__check" v-if="selectedMode === 'auto'">
              <text class="check-mark">&#10003;</text>
            </view>
            <view class="mode-card__icon-wrap mode-card__icon-wrap--green">
              <text class="mode-card__icon">&#128267;</text>
            </view>
            <view class="mode-card__body">
              <text class="mode-card__label">充满即停</text>
              <text class="mode-card__desc">充到满电自动停止</text>
              <text class="mode-card__hint">适合长时间停车</text>
            </view>
          </view>

          <!-- 卡片 B: 按金额 -->
          <view
            class="mode-card"
            :class="{ 'mode-card--selected': selectedMode === 'amount' }"
            @tap="selectMode('amount')"
          >
            <view class="mode-card__check" v-if="selectedMode === 'amount'">
              <text class="check-mark">&#10003;</text>
            </view>
            <view class="mode-card__icon-wrap mode-card__icon-wrap--orange">
              <text class="mode-card__icon">&#128176;</text>
            </view>
            <view class="mode-card__body">
              <text class="mode-card__label">按金额充电</text>
              <text class="mode-card__desc">达到目标金额自动停止</text>
            </view>
            <view class="quick-btns" v-if="selectedMode === 'amount'" @tap.stop>
              <view
                v-for="val in amountPresets"
                :key="val"
                class="quick-btn"
                :class="{ 'quick-btn--active': customAmount === val }"
                @tap="selectAmountPreset(val)"
              >
                <text class="quick-btn__text">&yen;{{ val }}</text>
              </view>
              <view class="quick-input-wrap">
                <input
                  class="quick-input"
                  type="digit"
                  v-model="customAmountInput"
                  placeholder="自定义"
                  @input="onCustomAmountInput"
                  @tap.stop
                />
                <text class="quick-input__unit">元</text>
              </view>
            </view>
          </view>

          <!-- 卡片 C: 按电量 -->
          <view
            class="mode-card"
            :class="{ 'mode-card--selected': selectedMode === 'kwh' }"
            @tap="selectMode('kwh')"
          >
            <view class="mode-card__check" v-if="selectedMode === 'kwh'">
              <text class="check-mark">&#10003;</text>
            </view>
            <view class="mode-card__icon-wrap mode-card__icon-wrap--blue">
              <text class="mode-card__icon">&#9889;</text>
            </view>
            <view class="mode-card__body">
              <text class="mode-card__label">按电量充电</text>
              <text class="mode-card__desc">达到目标电量自动停止</text>
            </view>
            <view class="quick-btns" v-if="selectedMode === 'kwh'" @tap.stop>
              <view
                v-for="val in kwhPresets"
                :key="val"
                class="quick-btn"
                :class="{ 'quick-btn--active': customKwh === val }"
                @tap="selectKwhPreset(val)"
              >
                <text class="quick-btn__text">{{ val }}度</text>
              </view>
              <view class="quick-input-wrap">
                <input
                  class="quick-input"
                  type="digit"
                  v-model="customKwhInput"
                  placeholder="自定义"
                  @input="onCustomKwhInput"
                  @tap.stop
                />
                <text class="quick-input__unit">度</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 3. 优惠券入口 -->
      <view class="section section--flat">
        <view class="coupon-row" @tap="openCouponPicker">
          <view class="coupon-left">
            <text class="coupon-icon">&#127915;</text>
            <text class="coupon-label">优惠券</text>
          </view>
          <view class="coupon-right">
            <view class="coupon-badge" v-if="availableCoupons.length > 0 && !selectedCoupon">
              <text class="coupon-badge__text">{{ availableCoupons.length }}张可用</text>
            </view>
            <text class="coupon-selected-text" v-if="selectedCoupon">
              已选：{{ selectedCoupon.name }}
            </text>
            <text class="coupon-arrow">&#8250;</text>
          </view>
        </view>
      </view>

      <!-- 4. 支付方式 -->
      <view class="section">
        <text class="section-title">支付方式</text>
        <view class="payment-list">
          <!-- 微信支付（默认） -->
          <view
            class="payment-item"
            :class="{ 'payment-item--active': selectedPayment === 'wechat' }"
            @tap="selectedPayment = 'wechat'"
          >
            <view class="payment-icon-wrap payment-icon-wrap--wechat">
              <text class="payment-icon">&#128998;</text>
            </view>
            <text class="payment-name">微信支付</text>
            <view class="payment-radio" :class="{ 'payment-radio--active': selectedPayment === 'wechat' }">
              <view class="radio-dot" v-if="selectedPayment === 'wechat'" />
            </view>
          </view>

          <!-- 余额 -->
          <view
            class="payment-item"
            :class="{
              'payment-item--active': selectedPayment === 'balance',
              'payment-item--disabled': !balanceSufficient,
            }"
            @tap="balanceSufficient && (selectedPayment = 'balance')"
          >
            <view class="payment-icon-wrap payment-icon-wrap--balance">
              <text class="payment-icon">&#128176;</text>
            </view>
            <view class="payment-info">
              <text class="payment-name">余额支付</text>
              <text class="payment-balance" :class="{ 'payment-balance--insufficient': !balanceSufficient }">
                余额 &yen;{{ userBalance.toFixed(2) }}
              </text>
            </view>
            <view class="payment-radio" :class="{ 'payment-radio--active': selectedPayment === 'balance' }">
              <view class="radio-dot" v-if="selectedPayment === 'balance'" />
            </view>
          </view>

          <!-- 组合支付 -->
          <view
            class="payment-item"
            :class="{ 'payment-item--active': selectedPayment === 'combined' }"
            @tap="selectedPayment = 'combined'"
          >
            <view class="payment-icon-wrap payment-icon-wrap--combo">
              <text class="payment-icon">&#128260;</text>
            </view>
            <view class="payment-info">
              <text class="payment-name">组合支付</text>
              <text class="payment-hint">余额 + 微信补足</text>
            </view>
            <view class="payment-radio" :class="{ 'payment-radio--active': selectedPayment === 'combined' }">
              <view class="radio-dot" v-if="selectedPayment === 'combined'" />
            </view>
          </view>
        </view>
      </view>

      <!-- 5. 费用预估卡 -->
      <view class="estimate-card">
        <view class="estimate-header">
          <text class="estimate-title">预估费用</text>
          <view class="estimate-saving-tip" v-if="savingTip">
            <text class="saving-tip-text">{{ savingTip }}</text>
          </view>
        </view>
        <view class="estimate-price-row">
          <text class="estimate-currency">&yen;</text>
          <text class="estimate-current">{{ estimatedCost }}</text>
          <text class="estimate-original" v-if="couponDiscount > 0">&yen;{{ estimatedCostBeforeCoupon }}</text>
        </view>
        <view class="estimate-breakdown" v-if="couponDiscount > 0">
          <text class="breakdown-icon">&#127873;</text>
          <text class="breakdown-text">优惠券已抵扣 &yen;{{ couponDiscount.toFixed(2) }}</text>
        </view>
        <view class="estimate-detail" v-if="selectedMode !== 'auto'">
          <text class="detail-text">
            {{ selectedMode === 'amount' ? `目标金额 &yen;${customAmount}` : `目标电量 ${customKwh}度` }}
            &times; 综合电价 &yen;{{ combinedPrice.toFixed(2) }}/度
          </text>
        </view>
      </view>

      <!-- 底部占位，避免被固定按钮遮挡 -->
      <view class="bottom-spacer" />
    </scroll-view>

    <!-- ===== 优惠券选择弹窗 ===== -->
    <view class="popup-overlay" v-if="showCouponPicker" @tap="showCouponPicker = false">
      <view class="popup-card" @tap.stop>
        <view class="popup-header">
          <text class="popup-title">选择优惠券</text>
          <view class="popup-close" @tap="showCouponPicker = false">
            <text class="popup-close-icon">&#10005;</text>
          </view>
        </view>
        <scroll-view scroll-y class="coupon-scroll" :show-scrollbar="false" :enhanced="true">
          <view
            v-for="coupon in availableCoupons"
            :key="coupon.id"
            class="coupon-option"
            :class="{ 'coupon-option--selected': selectedCoupon?.id === coupon.id }"
            @tap="toggleCoupon(coupon)"
          >
            <view class="coupon-option__left">
              <text class="coupon-option__currency">&yen;</text>
              <text class="coupon-option__value">{{ coupon.amount }}</text>
              <text class="coupon-option__condition">满{{ coupon.minAmount }}可用</text>
            </view>
            <view class="coupon-option__right">
              <text class="coupon-option__name">{{ coupon.name }}</text>
              <text class="coupon-option__expire">{{ coupon.expireDate }}到期</text>
            </view>
            <view class="coupon-option__check" :class="{ 'coupon-option__check--active': selectedCoupon?.id === coupon.id }">
              <text class="check-mark" v-if="selectedCoupon?.id === coupon.id">&#10003;</text>
            </view>
          </view>
          <!-- 不使用优惠券 -->
          <view
            class="coupon-option"
            :class="{ 'coupon-option--selected': !selectedCoupon }"
            @tap="selectedCoupon = null"
          >
            <view class="coupon-option__right" style="flex:1">
              <text class="coupon-option__name">不使用优惠券</text>
            </view>
            <view class="coupon-option__check" :class="{ 'coupon-option__check--active': !selectedCoupon }">
              <text class="check-mark" v-if="!selectedCoupon">&#10003;</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- ===== 固定底部栏：协议 + 开始充电按钮 ===== -->
    <view class="bottom-bar">
      <text class="agreement-text">
        点击开始即表示同意
        <text class="agreement-link" @tap="openAgreement">《充电服务协议》</text>
      </text>
      <ChargeButton
        variant="primary"
        size="large"
        :loading="btnState === 'loading'"
        :disabled="btnState === 'loading'"
        @tap="handleStartCharging"
      >
        <view v-if="btnState === 'normal'" class="btn-content">
          <text class="btn-icon">&#9889;</text>
          <text class="btn-label">开始充电</text>
        </view>
        <text v-else-if="btnState === 'loading'" class="btn-label">正在启动...</text>
        <text v-else-if="btnState === 'error'" class="btn-label btn-label--error">启动失败，点击重试</text>
      </ChargeButton>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/api/index'
import ChargeButton from '@/components/ChargeButton.vue'

/* ──────────────────── 类型定义 ──────────────────── */

interface Coupon {
  id: string
  name: string
  amount: number
  minAmount: number
  expireDate: string
}

interface DeviceInfo {
  deviceCode: string
  stationName: string
  stationAddress: string
  electricityPrice: number
  servicePrice: number
  pricePeriod: 'peak' | 'flat' | 'valley'
  pricePeriodLabel: string
  nextPeriodTime: string
  nextPeriodPrice: number
  nextPeriodLabel: string
  status: string
}

type ChargingMode = 'auto' | 'amount' | 'kwh'
type BtnState = 'normal' | 'loading' | 'error'

/* ──────────────────── 页面可见性 & 拖拽关闭 ──────────────────── */

const visible = ref(false)

let touchStartY = 0
let touchDeltaY = 0

function onTouchStart(e: any) {
  touchStartY = e.touches?.[0]?.clientY || 0
  touchDeltaY = 0
}

function onTouchMove(e: any) {
  const currentY = e.touches?.[0]?.clientY || 0
  touchDeltaY = currentY - touchStartY
}

function onTouchEnd() {
  // 向下拖拽超过 80px 则关闭
  if (touchDeltaY > 80) {
    handleClose()
  }
  touchDeltaY = 0
}

function handleClose() {
  visible.value = false
  setTimeout(() => {
    uni.navigateBack()
  }, 300)
}

/* ──────────────────── 页面参数 ──────────────────── */

const deviceCode = ref('')
const stationId = ref('')
const connectorId = ref('1')

/* ──────────────────── 设备与电价信息 ──────────────────── */

const deviceInfo = ref<DeviceInfo | null>(null)
const stationName = ref('')
const stationAddress = ref('')
const currentPrice = ref('1.28')
const pricePeriod = ref<'peak' | 'flat' | 'valley'>('flat')
const pricePeriodLabel = ref('平段')
const pricePeriodClass = computed(() => {
  const map: Record<string, string> = {
    peak: 'price-tag--peak',
    flat: 'price-tag--flat',
    valley: 'price-tag--valley',
  }
  return map[pricePeriod.value] || 'price-tag--flat'
})
const nextPeriodHint = ref('')
const deviceStatus = ref('')

const electricityPrice = ref(0.68)
const servicePrice = ref(0.60)
const combinedPrice = computed(() => electricityPrice.value + servicePrice.value)

/* ──────────────────── 充电方式选择 ──────────────────── */

const selectedMode = ref<ChargingMode>('auto')

const amountPresets = [20, 30, 50, 100]
const kwhPresets = [10, 20, 30, 50]

const customAmount = ref(0)
const customAmountInput = ref('')
const customKwh = ref(0)
const customKwhInput = ref('')

function selectMode(mode: ChargingMode) {
  selectedMode.value = mode
  btnState.value = 'normal'
}

function selectAmountPreset(val: number) {
  customAmount.value = val
  customAmountInput.value = String(val)
}

function onCustomAmountInput() {
  const parsed = parseFloat(customAmountInput.value)
  customAmount.value = isNaN(parsed) ? 0 : parsed
}

function selectKwhPreset(val: number) {
  customKwh.value = val
  customKwhInput.value = String(val)
}

function onCustomKwhInput() {
  const parsed = parseFloat(customKwhInput.value)
  customKwh.value = isNaN(parsed) ? 0 : parsed
}

/* ──────────────────── 优惠券 ──────────────────── */

const availableCoupons = ref<Coupon[]>([])
const selectedCoupon = ref<Coupon | null>(null)
const showCouponPicker = ref(false)

function openCouponPicker() {
  showCouponPicker.value = true
}

function toggleCoupon(coupon: Coupon) {
  if (selectedCoupon.value?.id === coupon.id) {
    selectedCoupon.value = null
  } else {
    selectedCoupon.value = coupon
  }
}

const couponDiscount = computed(() => {
  if (!selectedCoupon.value) return 0
  const estimated = parseFloat(estimatedCostBeforeCoupon.value)
  if (isNaN(estimated)) return 0
  if (estimated < selectedCoupon.value.minAmount) return 0
  return selectedCoupon.value.amount
})

/* ──────────────────── 支付方式 ──────────────────── */

const selectedPayment = ref('wechat')
const userBalance = ref(0)
const balanceSufficient = computed(() => {
  const cost = parseFloat(estimatedCost.value)
  return userBalance.value >= (isNaN(cost) ? 0 : cost)
})

/* ──────────────────── 费用预估 ──────────────────── */

const estimatedCostBeforeCoupon = computed(() => {
  let cost = 0
  if (selectedMode.value === 'auto') {
    // 预估充满：假设约 60kWh 电池容量
    cost = 60 * combinedPrice.value
  } else if (selectedMode.value === 'amount') {
    cost = customAmount.value || 0
  } else if (selectedMode.value === 'kwh') {
    cost = (customKwh.value || 0) * combinedPrice.value
  }
  return Math.max(0, cost).toFixed(2)
})

const estimatedCost = computed(() => {
  const base = parseFloat(estimatedCostBeforeCoupon.value)
  const discount = couponDiscount.value
  return Math.max(0, base - discount).toFixed(2)
})

const savingTip = computed(() => {
  if (pricePeriod.value === 'valley') {
    return '谷段电价优惠中'
  }
  if (pricePeriod.value === 'flat') {
    return '平段电价较优惠'
  }
  return ''
})

/* ──────────────────── 按钮状态 ──────────────────── */

const btnState = ref<BtnState>('normal')

/* ──────────────────── 操作 ──────────────────── */

async function handleStartCharging() {
  if (btnState.value === 'loading') return

  // 校验输入
  if (selectedMode.value === 'amount' && customAmount.value <= 0) {
    uni.showToast({ title: '请输入目标金额', icon: 'none' })
    return
  }
  if (selectedMode.value === 'kwh' && customKwh.value <= 0) {
    uni.showToast({ title: '请输入目标电量', icon: 'none' })
    return
  }

  btnState.value = 'loading'

  try {
    const params: Record<string, any> = {
      stationId: stationId.value,
      deviceCode: deviceCode.value,
      connectorId: connectorId.value,
      chargeMode: selectedMode.value,
      paymentMethod: selectedPayment.value,
    }

    if (selectedMode.value === 'amount' && customAmount.value > 0) {
      params.targetAmount = customAmount.value
    }
    if (selectedMode.value === 'kwh' && customKwh.value > 0) {
      params.targetEnergy = customKwh.value
    }
    if (selectedCoupon.value) {
      params.couponId = selectedCoupon.value.id
    }

    const result = await api.startChargingWithOptions(params)

    uni.showToast({ title: '充电已启动', icon: 'success' })
    btnState.value = 'normal'

    setTimeout(() => {
      const orderId = (result as any)?.orderId || ''
      uni.redirectTo({
        url: `/pages/charging/index?orderId=${orderId}`,
      })
    }, 800)
  } catch (e: any) {
    btnState.value = 'error'
    uni.showToast({
      title: e?.message || '启动失败',
      icon: 'none',
    })
  }
}

function openAgreement() {
  uni.navigateTo({ url: '/pages/settings/index' })
}

/* ──────────────────── Mock 回退数据 ──────────────────── */

function applyMockDeviceData() {
  stationName.value = stationName.value || '北京朝阳充电站'
  stationAddress.value = stationAddress.value || '北京市朝阳区望京SOHO T1 B1层'
  currentPrice.value = '1.28'
  electricityPrice.value = 0.68
  servicePrice.value = 0.60
  pricePeriod.value = 'flat'
  pricePeriodLabel.value = '平段'
  nextPeriodHint.value = '17:00 起进入峰段 ¥1.58/度'
  deviceStatus.value = '空闲'
}

/* ──────────────────── 生命周期 ──────────────────── */

onMounted(async () => {
  // 入场动画延迟
  setTimeout(() => {
    visible.value = true
  }, 50)

  // 1. 读取页面参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = (currentPage as any)?.$page?.options || (currentPage as any)?.options || {}

  deviceCode.value = options.deviceCode || ''
  stationId.value = options.stationId || ''
  connectorId.value = options.connectorId || '1'

  // 2. 获取设备 / 站点信息
  if (stationId.value) {
    try {
      const detail = await api.getStationDetail(stationId.value)
      stationName.value = (detail as any)?.name || ''
      stationAddress.value = (detail as any)?.address || ''
      if ((detail as any)?.electricityPrice) {
        electricityPrice.value = (detail as any).electricityPrice
      }
      if ((detail as any)?.servicePrice) {
        servicePrice.value = (detail as any).servicePrice
      }
      currentPrice.value = combinedPrice.value.toFixed(2)
    } catch (e) {
      applyMockDeviceData()
    }
  } else {
    applyMockDeviceData()
  }

  if (!deviceCode.value) {
    deviceCode.value = 'CP-BJ-00123-A'
  }

  // 推算当前时段
  const hour = new Date().getHours()
  if (hour >= 8 && hour < 11) {
    pricePeriod.value = 'peak'
    pricePeriodLabel.value = '峰段'
    nextPeriodHint.value = '11:00 起进入平段'
  } else if (hour >= 17 && hour < 21) {
    pricePeriod.value = 'peak'
    pricePeriodLabel.value = '峰段'
    nextPeriodHint.value = '21:00 起进入平段'
  } else if (hour >= 23 || hour < 7) {
    pricePeriod.value = 'valley'
    pricePeriodLabel.value = '谷段'
    nextPeriodHint.value = '07:00 起进入平段'
  } else {
    pricePeriod.value = 'flat'
    pricePeriodLabel.value = '平段'
    nextPeriodHint.value = '17:00 起进入峰段 ¥1.58/度'
  }

  // 3. 加载用户余额
  try {
    const user = await api.getUserInfo()
    if (user) {
      userBalance.value = user.balance || 0
    }
  } catch (e) {
    userBalance.value = 128.50
  }

  // 4. 加载可用优惠券
  try {
    const coupons = await api.getAvailableCoupons()
    availableCoupons.value = Array.isArray(coupons) ? coupons : []
  } catch (e) {
    availableCoupons.value = [
      { id: '1', name: '满30减5元券', amount: 5, minAmount: 30, expireDate: '2026-08-31' },
      { id: '2', name: '满50减10元券', amount: 10, minAmount: 50, expireDate: '2026-09-15' },
      { id: '3', name: '新人立减3元券', amount: 3, minAmount: 0, expireDate: '2026-07-31' },
    ]
  }
})
</script>

<style scoped>
/* ===== 遮罩层 ===== */
.sheet-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0);
  z-index: 199;
  transition: background 300ms ease;
  pointer-events: none;
}

.sheet-mask--visible {
  background: rgba(0, 0, 0, 0.45);
  pointer-events: auto;
}

/* ===== 底部弹出容器（85% 屏幕高度） ===== */
.charging-settings-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 85vh;
  background: #ffffff;
  border-radius: 32rpx 32rpx 0 0;
  display: flex;
  flex-direction: column;
  z-index: 200;
  box-shadow: 0 -8rpx 48rpx rgba(0, 0, 0, 0.15);
  transform: translateY(100%);
  transition: transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
  overflow: hidden;
}

.sheet--visible {
  transform: translateY(0);
}

/* ===== 拖拽把手条 ===== */
.handle-bar {
  display: flex;
  justify-content: center;
  padding: 24rpx 0 12rpx;
  flex-shrink: 0;
}

.handle-pill {
  width: 64rpx;
  height: 6rpx;
  border-radius: 3rpx;
  background: #D9D9D9;
}

/* ===== 滚动区域 ===== */
.sheet-scroll {
  flex: 1;
  overflow: hidden;
}

/* ===== 设备信息头 ===== */
.device-header {
  padding: 16rpx 32rpx 28rpx;
  border-bottom: 1rpx solid #F0F0F0;
}

.device-code-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.device-code-text {
  font-size: 28rpx;
  font-weight: 700;
  color: #1A1A1A;
  font-family: 'DIN Alternate', 'DIN', 'PingFang SC', monospace;
  letter-spacing: 0.5rpx;
}

.status-tag {
  background: #E6FFF0;
  border-radius: 6rpx;
  padding: 2rpx 12rpx;
}

.status-tag-text {
  font-size: 20rpx;
  color: #07C160;
  font-weight: 500;
}

.station-name {
  font-size: 22rpx;
  color: #666666;
  display: block;
  margin-top: 10rpx;
}

.station-address {
  font-size: 22rpx;
  color: #999999;
  display: block;
  margin-top: 4rpx;
}

.price-row {
  margin-top: 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.price-main {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.price-symbol {
  font-size: 26rpx;
  font-weight: 700;
  color: #1A1A1A;
  font-family: 'DIN Alternate', 'DIN', monospace;
}

.price-value {
  font-size: 40rpx;
  font-weight: 700;
  color: #1A1A1A;
  font-family: 'DIN Alternate', 'DIN', monospace;
  letter-spacing: -1rpx;
}

.price-unit {
  font-size: 22rpx;
  color: #999999;
  margin-left: 2rpx;
  margin-right: 12rpx;
}

.price-tag {
  border-radius: 6rpx;
  padding: 2rpx 14rpx;
}

.price-tag--flat {
  background: #E6F4FF;
}

.price-tag--flat .price-tag-text {
  color: #1677FF;
}

.price-tag--peak {
  background: #FFF2F0;
}

.price-tag--peak .price-tag-text {
  color: #FF4D4F;
}

.price-tag--valley {
  background: #E6FFF0;
}

.price-tag--valley .price-tag-text {
  color: #07C160;
}

.price-tag-text {
  font-size: 22rpx;
  font-weight: 500;
}

.next-period-hint {
  margin-top: 8rpx;
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.next-period-icon {
  font-size: 20rpx;
}

.next-period-text {
  font-size: 20rpx;
  color: #BFBFBF;
}

/* ===== 通用区块 ===== */
.section {
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #F0F0F0;
}

.section--flat {
  padding: 0;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1A1A1A;
  display: block;
  margin-bottom: 20rpx;
}

/* ===== 充电方式卡片 ===== */
.mode-cards {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.mode-card {
  position: relative;
  background: #FAFAFA;
  border: 3rpx solid transparent;
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 16rpx;
  transition: all 0.25s ease;
  overflow: hidden;
}

.mode-card--selected {
  border-color: #07C160;
  background: linear-gradient(135deg, #F0FFF4 0%, #E8F8EE 100%);
  box-shadow: 0 4rpx 16rpx rgba(7, 193, 96, 0.12);
}

.mode-card__check {
  position: absolute;
  top: 0;
  right: 0;
  width: 44rpx;
  height: 44rpx;
  background: #07C160;
  border-radius: 0 16rpx 0 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-mark {
  font-size: 22rpx;
  color: #ffffff;
  font-weight: 700;
}

.mode-card__icon-wrap {
  width: 64rpx;
  height: 64rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mode-card__icon-wrap--green {
  background: linear-gradient(135deg, #E6FFF0 0%, #D4F5E0 100%);
}

.mode-card__icon-wrap--orange {
  background: linear-gradient(135deg, #FFF7E6 0%, #FFE8CC 100%);
}

.mode-card__icon-wrap--blue {
  background: linear-gradient(135deg, #E6F4FF 0%, #CCE8FF 100%);
}

.mode-card__icon {
  font-size: 36rpx;
}

.mode-card__body {
  flex: 1;
  min-width: 0;
}

.mode-card__label {
  font-size: 28rpx;
  font-weight: 600;
  color: #1A1A1A;
  display: block;
}

.mode-card__desc {
  font-size: 22rpx;
  color: #999999;
  display: block;
  margin-top: 4rpx;
}

.mode-card__hint {
  font-size: 20rpx;
  color: #07C160;
  display: block;
  margin-top: 4rpx;
  font-weight: 500;
}

/* ===== 快捷按钮 ===== */
.quick-btns {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}

.quick-btn {
  padding: 10rpx 28rpx;
  border-radius: 28rpx;
  background: #ffffff;
  border: 2rpx solid #E8E8E8;
  transition: all 0.15s ease;
}

.quick-btn--active {
  background: linear-gradient(135deg, #07C160 0%, #06AD56 100%);
  border-color: #07C160;
  box-shadow: 0 4rpx 12rpx rgba(7, 193, 96, 0.2);
}

.quick-btn--active .quick-btn__text {
  color: #ffffff;
}

.quick-btn__text {
  font-size: 24rpx;
  color: #333333;
  font-weight: 500;
}

.quick-input-wrap {
  flex: 1;
  min-width: 120rpx;
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding: 6rpx 16rpx;
  border-radius: 28rpx;
  background: #ffffff;
  border: 2rpx solid #E8E8E8;
}

.quick-input {
  flex: 1;
  font-size: 24rpx;
  color: #333333;
  height: 40rpx;
}

.quick-input__unit {
  font-size: 22rpx;
  color: #999999;
  flex-shrink: 0;
}

/* ===== 优惠券行 ===== */
.coupon-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #F0F0F0;
}

.coupon-left {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.coupon-icon {
  font-size: 32rpx;
}

.coupon-label {
  font-size: 28rpx;
  color: #1A1A1A;
  font-weight: 500;
}

.coupon-right {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.coupon-badge {
  background: #FFF2F0;
  border-radius: 8rpx;
  padding: 2rpx 12rpx;
}

.coupon-badge__text {
  font-size: 22rpx;
  color: #FF4D4F;
  font-weight: 500;
}

.coupon-selected-text {
  font-size: 24rpx;
  color: #07C160;
  font-weight: 500;
}

.coupon-arrow {
  font-size: 32rpx;
  color: #BFBFBF;
  line-height: 1;
}

/* ===== 支付方式列表 ===== */
.payment-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.payment-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 24rpx;
  background: #FAFAFA;
  border: 2rpx solid transparent;
  border-radius: 12rpx;
  transition: all 0.2s ease;
}

.payment-item--active {
  background: #F0FFF4;
  border-color: #07C160;
  box-shadow: 0 2rpx 8rpx rgba(7, 193, 96, 0.1);
}

.payment-item--disabled {
  opacity: 0.45;
  pointer-events: none;
}

.payment-icon-wrap {
  width: 48rpx;
  height: 48rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.payment-icon-wrap--wechat {
  background: #E6FFF0;
}

.payment-icon-wrap--balance {
  background: #FFF7E6;
}

.payment-icon-wrap--combo {
  background: #E6F4FF;
}

.payment-icon {
  font-size: 32rpx;
}

.payment-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.payment-name {
  font-size: 28rpx;
  color: #1A1A1A;
  font-weight: 500;
}

.payment-balance {
  font-size: 22rpx;
  color: #999999;
  margin-top: 2rpx;
}

.payment-balance--insufficient {
  color: #FF4D4F;
}

.payment-hint {
  font-size: 22rpx;
  color: #999999;
  margin-top: 2rpx;
}

.payment-radio {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 3rpx solid #D9D9D9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color 0.2s ease;
}

.payment-radio--active {
  border-color: #07C160;
}

.radio-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: #07C160;
}

/* ===== 费用预估卡 ===== */
.estimate-card {
  margin: 24rpx 32rpx;
  background: linear-gradient(135deg, #E6FFF0 0%, #F0FFF4 100%);
  border-radius: 16rpx;
  padding: 28rpx;
  border: 1rpx solid rgba(7, 193, 96, 0.15);
}

.estimate-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.estimate-title {
  font-size: 26rpx;
  color: #333333;
  font-weight: 600;
}

.estimate-saving-tip {
  background: rgba(7, 193, 96, 0.15);
  border-radius: 6rpx;
  padding: 4rpx 14rpx;
}

.saving-tip-text {
  font-size: 20rpx;
  color: #07C160;
  font-weight: 500;
}

.estimate-price-row {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
  margin-top: 12rpx;
}

.estimate-currency {
  font-size: 28rpx;
  font-weight: 700;
  color: #07C160;
  font-family: 'DIN Alternate', 'DIN', monospace;
}

.estimate-current {
  font-size: 52rpx;
  font-weight: 700;
  color: #07C160;
  font-family: 'DIN Alternate', 'DIN', monospace;
  letter-spacing: -2rpx;
  line-height: 1.1;
}

.estimate-original {
  font-size: 26rpx;
  color: #BFBFBF;
  text-decoration: line-through;
  font-family: 'DIN Alternate', 'DIN', monospace;
  margin-left: 12rpx;
}

.estimate-breakdown {
  margin-top: 8rpx;
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.breakdown-icon {
  font-size: 20rpx;
}

.breakdown-text {
  font-size: 22rpx;
  color: #52C41A;
  font-weight: 500;
}

.estimate-detail {
  margin-top: 6rpx;
}

.detail-text {
  font-size: 20rpx;
  color: #999999;
}

/* ===== 底部占位 ===== */
.bottom-spacer {
  height: 240rpx;
}

/* ===== 优惠券选择弹窗 ===== */
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 300;
}

.popup-card {
  width: 100%;
  max-height: 60vh;
  background: #ffffff;
  border-radius: 32rpx 32rpx 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 32rpx 24rpx;
  border-bottom: 1rpx solid #F0F0F0;
  flex-shrink: 0;
}

.popup-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1A1A1A;
}

.popup-close {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #F5F5F5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.popup-close-icon {
  font-size: 24rpx;
  color: #999999;
}

.coupon-scroll {
  flex: 1;
  max-height: calc(60vh - 80rpx);
  padding: 16rpx 32rpx 32rpx;
}

.coupon-option {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx 20rpx;
  border-radius: 12rpx;
  border: 2rpx solid #F0F0F0;
  margin-bottom: 16rpx;
  transition: all 0.2s ease;
}

.coupon-option--selected {
  border-color: #07C160;
  background: linear-gradient(135deg, #F0FFF4 0%, #E8F8EE 100%);
  box-shadow: 0 2rpx 8rpx rgba(7, 193, 96, 0.1);
}

.coupon-option__left {
  min-width: 130rpx;
  text-align: center;
  flex-shrink: 0;
}

.coupon-option__currency {
  font-size: 24rpx;
  font-weight: 700;
  color: #FF4D4F;
  font-family: 'DIN Alternate', 'DIN', monospace;
}

.coupon-option__value {
  font-size: 40rpx;
  font-weight: 700;
  color: #FF4D4F;
  font-family: 'DIN Alternate', 'DIN', monospace;
}

.coupon-option__condition {
  font-size: 20rpx;
  color: #999999;
  display: block;
  margin-top: 4rpx;
}

.coupon-option__right {
  flex: 1;
  min-width: 0;
}

.coupon-option__name {
  font-size: 26rpx;
  color: #1A1A1A;
  font-weight: 500;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.coupon-option__expire {
  font-size: 20rpx;
  color: #BFBFBF;
  display: block;
  margin-top: 4rpx;
}

.coupon-option__check {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 2rpx solid #D9D9D9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.coupon-option__check--active {
  background: #07C160;
  border-color: #07C160;
}

.coupon-option__check--active .check-mark {
  color: #ffffff;
}

/* ===== 固定底部栏 ===== */
.bottom-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16rpx 32rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom, 34px));
  background: #ffffff;
  box-shadow: 0 -2rpx 16rpx rgba(0, 0, 0, 0.06);
  z-index: 10;
  flex-shrink: 0;
}

.agreement-text {
  font-size: 20rpx;
  color: #BFBFBF;
  display: block;
  text-align: center;
  margin-bottom: 12rpx;
}

.agreement-link {
  color: #1677FF;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.btn-icon {
  font-size: 32rpx;
}

.btn-label {
  font-size: 32rpx;
  font-weight: 600;
  color: #ffffff;
}

.btn-label--error {
  color: #ffffff;
}
</style>
