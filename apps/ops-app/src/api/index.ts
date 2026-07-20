// 模块化 API 导出
export {
  stationApi,
  alertApi,
  workorderApi,
  inspectionApi,
  authApi,
  deviceApi,
  sparePartApi,
  knowledgeApi,
  shiftApi,
  messageApi,
  dispatchApi,
} from './modules'

// 兼容旧版 api 对象
import {
  stationApi,
  alertApi,
  workorderApi,
  inspectionApi,
  authApi,
  deviceApi,
  sparePartApi,
  knowledgeApi,
  shiftApi,
  messageApi,
  dispatchApi,
} from './modules'

export const api = {
  ...stationApi,
  ...alertApi,
  ...workorderApi,
  ...inspectionApi,
  ...authApi,
  ...deviceApi,
  ...sparePartApi,
  ...knowledgeApi,
  ...shiftApi,
  ...messageApi,
  ...dispatchApi,
}
