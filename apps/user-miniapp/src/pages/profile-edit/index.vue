<template>
  <view class="profile-edit">
    <!-- 头像上传 -->
    <view class="avatar-section" @click="handleAvatarUpload">
      <text class="label">头像</text>
      <view class="avatar-wrapper">
        <image
          v-if="userInfo.avatar"
          :src="userInfo.avatar"
          class="avatar"
          mode="aspectFill"
        />
        <view v-else class="avatar avatar-placeholder">
          <text class="placeholder-text">{{ userInfo.nickname?.charAt(0) || '用' }}</text>
        </view>
        <view v-if="uploading" class="upload-overlay">
          <text class="upload-text">{{ progress }}%</text>
        </view>
        <uni-icons type="right" size="20" color="#999" />
      </view>
    </view>

    <!-- 昵称 -->
    <view class="form-item" @click="showNicknameInput = true">
      <text class="label">昵称</text>
      <view class="value-wrapper">
        <text class="value">{{ userInfo.nickname || '未设置' }}</text>
        <uni-icons type="right" size="20" color="#999" />
      </view>
    </view>

    <!-- 手机号 -->
    <view class="form-item">
      <text class="label">手机号</text>
      <view class="value-wrapper">
        <text class="value">{{ maskPhone(userInfo.phone) || '未绑定' }}</text>
      </view>
    </view>

    <!-- 保存按钮 -->
    <view class="btn-wrapper">
      <button class="save-btn" @click="handleSave" :disabled="saving">
        {{ saving ? '保存中...' : '保存' }}
      </button>
    </view>

    <!-- 昵称编辑弹窗 -->
    <uni-popup ref="nicknamePopup" type="dialog">
      <uni-popup-dialog
        mode="input"
        title="修改昵称"
        :value="userInfo.nickname"
        placeholder="请输入昵称"
        @confirm="handleNicknameConfirm"
      />
    </uni-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/api'
import { useUpload } from '@/hooks/useUpload'

const { uploading, progress, uploadAvatar } = useUpload()

const userInfo = reactive({
  nickname: '',
  phone: '',
  avatar: '',
})

const showNicknameInput = ref(false)
const saving = ref(false)

// 获取用户信息
onMounted(async () => {
  try {
    const info = await api.getUserInfo()
    Object.assign(userInfo, info)
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
})

// 手机号脱敏
const maskPhone = (phone: string) => {
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

// 头像上传
const handleAvatarUpload = async () => {
  const url = await uploadAvatar()
  if (url) {
    userInfo.avatar = url
  }
}

// 昵称确认
const handleNicknameConfirm = (value: string) => {
  userInfo.nickname = value
  showNicknameInput.value = false
}

// 保存用户信息
const handleSave = async () => {
  try {
    saving.value = true
    await api.updateProfile({
      nickname: userInfo.nickname,
      avatar: userInfo.avatar,
    })
    uni.showToast({
      title: '保存成功',
      icon: 'success',
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error: any) {
    uni.showToast({
      title: error.message || '保存失败',
      icon: 'none',
    })
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.profile-edit {
  min-height: 100vh;
  background-color: #f6f7fb;
  padding: 20rpx 0;
}

.avatar-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 40rpx;
  background-color: #fff;
  margin-bottom: 20rpx;
}

.form-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 40rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #f0f0f0;
}

.label {
  font-size: 32rpx;
  color: #333;
}

.value-wrapper {
  display: flex;
  align-items: center;
}

.value {
  font-size: 32rpx;
  color: #666;
  margin-right: 16rpx;
}

.avatar-wrapper {
  display: flex;
  align-items: center;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}

.avatar-placeholder {
  background: linear-gradient(135deg, #07c160, #06ad56);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-text {
  font-size: 48rpx;
  color: #fff;
  font-weight: bold;
}

.upload-overlay {
  position: absolute;
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-text {
  font-size: 24rpx;
  color: #fff;
}

.btn-wrapper {
  padding: 60rpx 40rpx;
}

.save-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #07c160, #06ad56);
  color: #fff;
  font-size: 32rpx;
  font-weight: 500;
  border-radius: 48rpx;
  border: none;

  &:disabled {
    opacity: 0.6;
  }
}
</style>
