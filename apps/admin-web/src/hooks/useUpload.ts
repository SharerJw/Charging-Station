import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadFile, UploadRawFile } from 'element-plus'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export function useUpload() {
  const uploading = ref(false)
  const progress = ref(0)

  /**
   * 获取上传请求头
   */
  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
  })

  /**
   * 上传头像
   */
  const uploadAvatar = async (file: UploadRawFile): Promise<string | null> => {
    try {
      uploading.value = true
      progress.value = 0

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${BASE_URL}/api/v1/user/avatar`, {
        method: 'POST',
        headers: getHeaders(),
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.code === 0 || data.code === 200) {
        ElMessage.success('头像上传成功')
        return data.data.url
      } else {
        throw new Error(data.message || '上传失败')
      }
    } catch (error: any) {
      console.error('上传头像失败:', error)
      ElMessage.error(error.message || '上传失败')
      return null
    } finally {
      uploading.value = false
      progress.value = 0
    }
  }

  /**
   * 上传设备图片
   */
  const uploadDeviceImage = async (file: UploadRawFile): Promise<string | null> => {
    try {
      uploading.value = true
      progress.value = 0

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${BASE_URL}/api/v1/upload/device`, {
        method: 'POST',
        headers: getHeaders(),
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.code === 0 || data.code === 200) {
        ElMessage.success('图片上传成功')
        return data.data.url
      } else {
        throw new Error(data.message || '上传失败')
      }
    } catch (error: any) {
      console.error('上传设备图片失败:', error)
      ElMessage.error(error.message || '上传失败')
      return null
    } finally {
      uploading.value = false
      progress.value = 0
    }
  }

  /**
   * 上传充电站图片
   */
  const uploadStationImage = async (file: UploadRawFile): Promise<string | null> => {
    try {
      uploading.value = true
      progress.value = 0

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${BASE_URL}/api/v1/upload/station`, {
        method: 'POST',
        headers: getHeaders(),
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.code === 0 || data.code === 200) {
        ElMessage.success('图片上传成功')
        return data.data.url
      } else {
        throw new Error(data.message || '上传失败')
      }
    } catch (error: any) {
      console.error('上传充电站图片失败:', error)
      ElMessage.error(error.message || '上传失败')
      return null
    } finally {
      uploading.value = false
      progress.value = 0
    }
  }

  /**
   * 通用文件上传
   */
  const uploadFile = async (file: UploadRawFile, directory: string = 'common'): Promise<string | null> => {
    try {
      uploading.value = true
      progress.value = 0

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${BASE_URL}/api/v1/upload/${directory}`, {
        method: 'POST',
        headers: getHeaders(),
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.code === 0 || data.code === 200) {
        ElMessage.success('文件上传成功')
        return data.data.url
      } else {
        throw new Error(data.message || '上传失败')
      }
    } catch (error: any) {
      console.error('文件上传失败:', error)
      ElMessage.error(error.message || '上传失败')
      return null
    } finally {
      uploading.value = false
      progress.value = 0
    }
  }

  return {
    uploading,
    progress,
    getHeaders,
    uploadAvatar,
    uploadDeviceImage,
    uploadStationImage,
    uploadFile,
  }
}
