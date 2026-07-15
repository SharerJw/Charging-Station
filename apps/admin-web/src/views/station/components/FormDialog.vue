<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useStationStore } from '@/store/station'
import MapPicker from './MapPicker.vue'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['update:visible', 'success'])

const stationStore = useStationStore()
const formRef = ref<FormInstance>()

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入充电站名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入充电站编号', trigger: 'blur' },
    { pattern: /^[A-Z]{2}-[A-Z]{2}-\d{3}$/, message: '格式如 BJ-CY-001', trigger: 'blur' },
  ],
  province: [{ required: true, message: '请选择省份', trigger: 'change' }],
  city: [{ required: true, message: '请选择城市', trigger: 'change' }],
  district: [{ required: true, message: '请输入区县', trigger: 'blur' }],
  address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }],
  contactName: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  electricityPrice: [{ required: true, message: '请输入电价', trigger: 'blur' }],
  servicePrice: [{ required: true, message: '请输入服务费', trigger: 'blur' }],
}

const provinceOptions = ['北京市', '上海市', '广东省', '浙江省', '江苏省', '四川省', '湖北省']
const cityMap: Record<string, string[]> = {
  '北京市': ['北京市'], '上海市': ['上海市'],
  '广东省': ['广州市', '深圳市', '东莞市', '佛山市'],
  '浙江省': ['杭州市', '宁波市', '温州市', '嘉兴市'],
  '江苏省': ['南京市', '苏州市', '无锡市', '常州市'],
  '四川省': ['成都市', '绵阳市'], '湖北省': ['武汉市', '宜昌市'],
}

const cities = computed(() => cityMap[stationStore.form.province] || [])

// 地图选点
const showMapPicker = ref(false)
function handleMapSelect(val: { longitude: number; latitude: number; address: string; province: string; city: string; district: string }) {
  stationStore.form.longitude = val.longitude
  stationStore.form.latitude = val.latitude
  if (val.address) stationStore.form.address = val.address
  if (val.province) stationStore.form.province = val.province
  if (val.city) stationStore.form.city = val.city
  if (val.district) stationStore.form.district = val.district
  console.log('[MapPicker] 数据已回填:', val)
}

watch(() => stationStore.form.province, () => {
  stationStore.form.city = ''
})

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    await stationStore.handleSubmit()
    emit('success')
  } catch {
    // 表单验证失败
  }
}

function handleClose() {
  formRef.value?.resetFields()
  dialogVisible.value = false
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="stationStore.isEdit ? '编辑充电站' : '新增充电站'"
    width="720px"
    destroy-on-close
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="stationStore.form"
      :rules="rules"
      label-width="100px"
      label-position="right"
    >
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="充电站名称" prop="name">
            <el-input v-model="stationStore.form.name" placeholder="请输入名称" maxlength="50" show-word-limit />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="编号" prop="code">
            <el-input v-model="stationStore.form.code" placeholder="如 BJ-CY-001" :disabled="stationStore.isEdit" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="省份" prop="province">
            <el-select v-model="stationStore.form.province" placeholder="选择省份" style="width: 100%">
              <el-option v-for="p in provinceOptions" :key="p" :label="p" :value="p" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="城市" prop="city">
            <el-select v-model="stationStore.form.city" placeholder="选择城市" style="width: 100%">
              <el-option v-for="c in cities" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="区县" prop="district">
            <el-input v-model="stationStore.form.district" placeholder="区/县" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="详细地址" prop="address">
        <el-input v-model="stationStore.form.address" placeholder="请输入详细地址">
          <template #append>
            <el-button @click="showMapPicker = true">📍 地图选点</el-button>
          </template>
        </el-input>
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="经度" prop="longitude">
            <el-input-number v-model="stationStore.form.longitude" :min="73" :max="135" :precision="6" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="纬度" prop="latitude">
            <el-input-number v-model="stationStore.form.latitude" :min="3" :max="53" :precision="6" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="营业时间" prop="businessHours">
            <el-input v-model="stationStore.form.businessHours" placeholder="00:00-24:00" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="联系人" prop="contactName">
            <el-input v-model="stationStore.form.contactName" placeholder="请输入联系人" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="联系电话" prop="contactPhone">
            <el-input v-model="stationStore.form.contactPhone" placeholder="请输入手机号" maxlength="11" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="电价(元/kWh)" prop="electricityPrice">
            <el-input-number v-model="stationStore.form.electricityPrice" :min="0" :max="10" :precision="2" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="服务费(元/kWh)" prop="servicePrice">
            <el-input-number v-model="stationStore.form.servicePrice" :min="0" :max="10" :precision="2" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="停车费(元/h)">
            <el-input-number v-model="stationStore.form.parkingFee" :min="0" :max="100" :precision="1" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="stationStore.loading" @click="handleSubmit">
        {{ stationStore.isEdit ? '更新' : '创建' }}
      </el-button>
    </template>
  </el-dialog>

  <MapPicker
    :visible="showMapPicker"
    :model-value="{ longitude: stationStore.form.longitude, latitude: stationStore.form.latitude }"
    @update:model-value="handleMapSelect"
    @close="showMapPicker = false"
  />
</template>
