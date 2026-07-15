<script setup lang="ts">
/**
 * MapPicker 组件 - 高德地图选点
 * 功能: 在弹窗中显示地图，点击选择坐标，自动填充地址信息
 */
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

const props = defineProps<{
  modelValue: { longitude: number; latitude: number; address?: string }
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: { longitude: number; latitude: number; address: string; province: string; city: string; district: string }): void
  (e: 'close'): void
}>()

const AMAP_KEY = 'c86443d9a8cd72e5a26af987f46345ca'
const mapContainer = ref<HTMLDivElement>()
let map: any = null
let marker: any = null
let geocoder: any = null

const selectedAddress = ref('')
const selectedLng = ref(props.modelValue.longitude || 116.46)
const selectedLat = ref(props.modelValue.latitude || 39.92)

// 动态加载高德地图SDK
function loadAmapSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).AMap) { resolve(); return }
    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}&plugin=AMap.Geocoder,AMap.Marker`
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('高德地图加载失败'))
    document.head.appendChild(script)
  })
}

async function initMap() {
  await loadAmapSDK()
  await nextTick()
  if (!mapContainer.value) return

  const AMap = (window as any).AMap
  map = new AMap.Map(mapContainer.value, {
    zoom: 13,
    center: [selectedLng.value, selectedLat.value],
    mapStyle: 'amap://styles/normal',
  })

  marker = new AMap.Marker({
    position: [selectedLng.value, selectedLat.value],
    draggable: true,
    cursor: 'move',
  })
  map.add(marker)

  geocoder = new AMap.Geocoder({ city: '全国' })

  // 点击地图选点
  map.on('click', (e: any) => {
    const lnglat = e.lnglat
    updatePosition(lnglat.lng, lnglat.lat)
  })

  // 拖拽标记
  marker.on('dragend', (e: any) => {
    const lnglat = e.target.getPosition()
    updatePosition(lnglat.lng, lnglat.lat)
  })
}

function updatePosition(lng: number, lat: number) {
  selectedLng.value = Math.round(lng * 1000000) / 1000000
  selectedLat.value = Math.round(lat * 1000000) / 1000000
  marker.setPosition([lng, lat])
  map.setCenter([lng, lat])

  // 逆地理编码获取地址
  geocoder.getAddress([lng, lat], (status: string, result: any) => {
    if (status === 'complete' && result.regeocode) {
      const addr = result.regeocode
      selectedAddress.value = addr.formattedAddress || ''
      emit('update:modelValue', {
        longitude: selectedLng.value,
        latitude: selectedLat.value,
        address: addr.formattedAddress || '',
        province: addr.addressComponent?.province || '',
        city: addr.addressComponent?.city || '',
        district: addr.addressComponent?.district || '',
      })
    }
  })
}

function handleConfirm() {
  if (selectedAddress.value) {
    emit('close')
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    nextTick(() => initMap())
  }
})

onBeforeUnmount(() => {
  if (map) { map.destroy(); map = null }
})
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="地图选点"
    width="800px"
    @close="emit('close')"
    destroy-on-close
  >
    <div class="map-picker">
      <div class="map-info">
        <el-tag type="info">点击地图或拖拽标记选择坐标，地址自动填充</el-tag>
        <span v-if="selectedAddress" class="map-address">{{ selectedAddress }}</span>
      </div>
      <div ref="mapContainer" class="map-container"></div>
      <div class="map-coords">
        <span>经度: {{ selectedLng }}</span>
        <span>纬度: {{ selectedLat }}</span>
      </div>
    </div>
    <template #footer>
      <el-button @click="emit('close')">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确认选点</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.map-picker { display: flex; flex-direction: column; gap: 12px; }
.map-info { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.map-address { font-size: 14px; color: #333; }
.map-container { width: 100%; height: 400px; border-radius: 8px; border: 1px solid #e4e7ed; }
.map-coords { display: flex; gap: 24px; font-size: 13px; color: #666; }
</style>
