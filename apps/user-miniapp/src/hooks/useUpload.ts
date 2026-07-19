import { ref } from 'vue'
import { api } from '@/api'

export function useUpload() {
  const uploading = ref(false)
  const progress = ref(0)

  /**
   * 上传头像
   */
  const uploadAvatar = async (): Promise<string | null> => {
    try {
      // 选择图片
      const res = await new Promise<UniApp.ChooseImageSuccessCallbackResult>((resolve, reject) => {
        uni.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera'],
          success: resolve,
          fail: reject,
        })
      })

      if (res.tempFilePaths.length === 0) {
        return null
      }

      uploading.value = true
      progress.value = 0

      const filePath = res.tempFilePaths[0]

      // 上传文件
      const uploadRes = await new Promise<UniApp.UploadFileSuccessCallbackResult>((resolve, reject) => {
        const uploadTask = uni.uploadFile({
          url: `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080'}/api/v1/user/avatar`,
          filePath: filePath,
          name: 'file',
          header: {
            Authorization: `Bearer ${uni.getStorageSync('token')}`,
          },
          success: resolve,
          fail: reject,
        })

        uploadTask.onProgressUpdate((res) => {
          progress.value = res.progress
        })
      })

      const data = JSON.parse(uploadRes.data)
      if (data.code === 0) {
        uni.showToast({
          title: '头像上传成功',
          icon: 'success',
        })
        return data.data.url
      } else {
        throw new Error(data.message || '上传失败')
      }
    } catch (error: any) {
      if (error.errMsg && error.errMsg.includes('chooseImage:fail')) {
        // 用户取消选择
        return null
      }
      console.error('上传头像失败:', error)
      uni.showToast({
        title: error.message || '上传失败',
        icon: 'none',
      })
      return null
    } finally {
      uploading.value = false
      progress.value = 0
    }
  }

  /**
   * 上传退款凭证图片
   */
  const uploadRefundImage = async (): Promise<string | null> => {
    try {
      const res = await new Promise<UniApp.ChooseImageSuccessCallbackResult>((resolve, reject) => {
        uni.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera'],
          success: resolve,
          fail: reject,
        })
      })

      if (res.tempFilePaths.length === 0) {
        return null
      }

      uploading.value = true
      progress.value = 0

      const filePath = res.tempFilePaths[0]

      const uploadRes = await new Promise<UniApp.UploadFileSuccessCallbackResult>((resolve, reject) => {
        const uploadTask = uni.uploadFile({
          url: `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080'}/api/v1/upload/refund`,
          filePath: filePath,
          name: 'file',
          header: {
            Authorization: `Bearer ${uni.getStorageSync('token')}`,
          },
          success: resolve,
          fail: reject,
        })

        uploadTask.onProgressUpdate((res) => {
          progress.value = res.progress
        })
      })

      const data = JSON.parse(uploadRes.data)
      if (data.code === 0) {
        return data.data.url
      } else {
        throw new Error(data.message || '上传失败')
      }
    } catch (error: any) {
      if (error.errMsg && error.errMsg.includes('chooseImage:fail')) {
        return null
      }
      console.error('上传图片失败:', error)
      uni.showToast({
        title: error.message || '上传失败',
        icon: 'none',
      })
      return null
    } finally {
      uploading.value = false
      progress.value = 0
    }
  }

  return {
    uploading,
    progress,
    uploadAvatar,
    uploadRefundImage,
  }
}
