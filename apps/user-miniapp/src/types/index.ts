// =====================================================================
// Centralized Type Definitions for user-miniapp
// =====================================================================

// ==================== API Core Types ====================

export interface Station {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  distance: number
  availableCount: number
  totalCount: number
  electricityPrice: number
  servicePrice: number
}

export interface UserInfo {
  id: string
  nickname: string
  phone: string
  avatar: string
  balance: number
  couponCount: number
}

export interface Order {
  id: string
  orderNo: string
  stationName: string
  status: string
  startTime: string
  consumedEnergy: number
  totalAmount: number
}

export interface ChargingSession {
  orderId: string
  stationName: string
  deviceCode: string
  status: 'charging' | 'completed' | 'stopped'
  currentSoc: number
  power: number
  energy: number
  duration: number
  cost: number
  startTime: string
}

export interface Transaction {
  id: string
  type: 'income' | 'expense'
  category: string
  icon: string
  description: string
  amount: number
  time: string
}

export interface UserStats {
  chargeCount: number
  totalEnergy: number
  totalSaved: number
  carbonReduction: number
}

// ==================== Coupon ====================

export interface Coupon {
  id: string
  name: string
  description: string
  type: 'fixed' | 'discount' | 'energy'
  amount: number
  discount: number
  energyKwh: number
  minAmount: number
  scope: string
  startTime: string
  endTime: string
  status: 'available' | 'used' | 'expired'
  usedTime: string
}

// ==================== ChargingSettings ====================

export interface ChargingSettingsCoupon {
  id: string
  name: string
  amount: number
  minAmount: number
  expireDate: string
}

export interface DeviceInfo {
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

export type ChargingMode = 'auto' | 'amount' | 'kwh'

export type BtnState = 'normal' | 'loading' | 'error'

// ==================== Wallet ====================

export interface WalletInfo {
  balance: number
  couponCount: number
  points: number
  monthlySpend: number
}

export interface RechargeTier {
  amount: number
  gift: number
  isCustom?: boolean
}

export interface PromoBanner {
  tag: string
  title: string
  desc: string
  bg: string
  actionAmount: number
}

// ==================== Vehicle ====================

export interface Vehicle {
  id: string
  brand: string
  model: string
  plateNumber: string
  batteryCapacity: number
  range: number
  type: string
  isDefault: boolean
  vin?: string
  plugAndCharge?: boolean
}

// ==================== StationDetail ====================

export interface ChargingPoint {
  id: string
  code: string
  type: 'DC' | 'AC'
  model?: string
  connector?: string
  voltageRange?: string
  power: number
  status: 'free' | 'charging' | 'fault'
  electricityPrice?: number
  servicePrice?: number
  usageRate?: number
}

export interface Review {
  id: string
  nickname: string
  avatar?: string
  rating: number
  content: string
  time: string
  likeCount?: number
  tags?: string[]
}

export interface Facility {
  icon: string
  label: string
  available: boolean
}

export interface TimelineSlot {
  price: string
  level: string
  color: string
  hour: number
}

// ==================== Recharge ====================

export interface RechargeTierDetail {
  amount: number
  gift: number
  couponCount: number
  points: number
  desc: string
  badge?: string
  badgeType?: 'recommend' | 'best'
}

export interface GiftDetail {
  giftAmount: number
  couponCount: number
  points: number
}

export interface ConfettiParticle {
  left: number
  delay: number
  duration: number
  color: string
  size: number
  shape: 'circle' | 'rect'
}

// ==================== Settlement ====================

export interface TimeSegment {
  label: string
  energy: number
  electricityFee: number
  serviceFee: number
}

export interface SettlementData {
  orderId: string
  orderNo: string
  stationName: string
  totalEnergy: number
  totalElectricity: number
  totalService: number
  originalAmount: number
  actualAmount: number
  couponDiscount: number
  memberDiscount: number
  status: string
  timeSegments: TimeSegment[]
  duration: number
}

// ==================== Settings ====================

export interface Settings {
  chargeMode: string
  payMethod: string
  chargeCompleteNotify: boolean
  lowBatteryNotify: boolean
  lowBatteryThreshold: number
  plugAndCharge: boolean
  chargeNotify: boolean
  marketingNotify: boolean
  dndStart: string
  dndEnd: string
  darkMode: 'system' | 'light' | 'dark'
  fontSize: 'small' | 'standard' | 'large'
  defaultMap: 'tencent' | 'amap' | 'baidu'
  mapZoom: number
}

// ==================== Message ====================

export type MessageType = 'charging' | 'system' | 'promotion' | 'interactive'

export type MessageCategory = 'all' | 'charging' | 'system' | 'promotion' | 'interactive'

export interface AppMessage {
  id: string
  type: MessageType
  title: string
  summary: string
  content: string
  time: string
  read: boolean
  categoryLabel?: string
  link?: string
}

export interface TabItem {
  label: string
  value: MessageCategory
  unread: number
}

// ==================== Membership ====================

export type Tier = 'normal' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'

export interface TierInfo {
  icon: string
  label: string
  shortLabel: string
  requiredPoints: number
  benefits: BenefitItem[]
}

export interface BenefitItem {
  icon: string
  name: string
  desc: string
}

export interface MembershipData {
  tier: Tier
  memberNo: string
  nickname: string
  avatar: string
  points: number
  totalChargeCount: number
  savedAmount: number
  pointsToNext: number
}

// ==================== Invoice ====================

export type TabValue = 'pending' | 'issued' | 'reversed'

export type InvoiceType = 'personal_einvoice' | 'vat_general' | 'vat_special'

export type HeaderType = 'personal' | 'company'

export type InvoiceStatus = 'pending' | 'processing' | 'issued' | 'failed' | 'reversed'

export interface InvoiceRecord {
  id: string
  title: string
  headerName?: string
  amount: number
  status: InvoiceStatus
  createTime: string
  invoiceNo?: string
  pdfUrl?: string
  reverseTime?: string
  reverseReason?: string
  originalInvoiceNo?: string
}

export interface HeaderItem {
  id: string
  companyName: string
  taxNumber: string
  address?: string
  phone?: string
  bankName?: string
  bankAccount?: string
}

// ==================== Points ====================

export interface EarnMethod {
  id: string
  icon: string
  name: string
  points: number
  desc: string
  actionText: string
  bgGradient: string
}

export interface PointsProduct {
  id: string
  name: string
  description: string
  icon: string
  image: string
  points: number
  category: 'charging' | 'physical' | 'lifestyle' | 'charity'
  exchangedCount: number
  stock: number
  tag: string
}

export interface RedeemRecord {
  id: string
  name: string
  icon: string
  image: string
  points: number
  time: string
  status: 'pending' | 'used' | 'shipping'
}

// ==================== Favorites ====================

export interface FavoriteStation extends Station {
  _offsetX: number
  _rating: number
  _sortOrder: number
}

// ==================== OrderDetail ====================

export interface TimeSegmentData {
  label: string
  energy: number
  unitPrice: number
  amount: number
  color: string
}

export interface OrderDetailData {
  id: string
  orderNo: string
  stationName: string
  stationAddress: string
  deviceCode: string
  connectorId: string
  status: string
  startTime: string
  endTime: string
  duration: number
  totalEnergy: number
  socStart: number
  socEnd: number
  electricityFee: number
  serviceFee: number
  couponDiscount: number
  memberDiscount: number
  actualAmount: number
  originalAmount: number
  powerCurve: number[]
  timeSegments: TimeSegmentData[]
  ecoData: { co2Offset: number; treeEquivalent: number }
  pointsEarned: number
}

// ==================== ChargingStatus ====================

export interface ChargingStatus {
  orderId: string
  stationName: string
  deviceCode: string
  status: 'charging' | 'completed' | 'stopped' | 'error'
  currentSoc: number
  power: number
  energy: number
  duration: number
  cost: number
  startTime: string
  lastUpdateTime: string
}
