import { ref } from 'vue'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export function useUpload() {
  const uploading = ref(false)
  const progress = ref(0)

  /**
   * 上传设备故障图片
   */
  const uploadFaultImage = async (): Promise<string | null> => {
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
          url: `${BASE_URL}/api/v1/ops/upload/fault`,
          filePath: filePath,
          name: 'file',
          header: {
            Authorization: `Bearer ${uni.getStorageSync('ops_token')}`,
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
          title: '图片上传成功',
          icon: 'success',
        })
        return data.data.url
      } else {
        throw new Error(data.message || '上传失败')
      }
    } catch (error: any) {
      if (error.errMsg && error.errMsg.includes('chooseImage:fail')) {
        return null
      }
      console.error('上传故障图片失败:', error)
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
   * 上传巡检图片
   */
  const uploadInspectionImage = async (): Promise<string | null> => {
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
          url: `${BASE_URL}/api/v1/ops/upload/inspection`,
          filePath: filePath,
          name: 'file',
          header: {
            Authorization: `Bearer ${uni.getStorageSync('ops_token')}`,
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
          title: '图片上传成功',
          icon: 'success',
        })
        return data.data.url
      } else {
        throw new Error(data.message || '上传失败')
      }
    } catch (error: any) {
      if (error.errMsg && error.errMsg.includes('chooseImage:fail')) {
        return null
      }
      console.error('上传巡检图片失败:', error)
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
   * 上传工单完成图片
   */
  const uploadWorkorderImage = async (): Promise<string | null> => {
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
          url: `${BASE_URL}/api/v1/ops/upload/workorder`,
          filePath: filePath,
          name: 'file',
          header: {
            Authorization: `Bearer ${uni.getStorageSync('ops_token')}`,
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
          title: '图片上传成功',
          icon: 'success',
        })
        return data.data.url
      } else {
        throw new Error(data.message || '上传失败')
      }
    } catch (error: any) {
      if (error.errMsg && error.errMsg.includes('chooseImage:fail')) {
        return null
      }
      console.error('上传工单图片失败:', error)
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
    uploadFaultImage,
    uploadInspectionImage,
    uploadWorkorderImage,
  }
}
