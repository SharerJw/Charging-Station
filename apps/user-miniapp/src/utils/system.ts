/**
 * 获取系统信息（兼容新旧 API）
 * 微信基础库 2.20.2+ 推荐 getWindowInfo/getDeviceInfo/getAppBaseInfo
 * 旧版本回退到 getSystemInfoSync
 */
export function getStatusBarHeight(): number {
  try {
    // 优先使用新 API（getWindowInfo）
    const winInfo = (uni as any).getWindowInfo?.()
    if (winInfo && winInfo.statusBarHeight != null) return winInfo.statusBarHeight
  } catch { /* ignore */ }
  try {
    // 回退到旧 API
    return uni.getSystemInfoSync().statusBarHeight ?? 20
  } catch { return 20 }
}

export function getWindowWidth(): number {
  try {
    const winInfo = (uni as any).getWindowInfo?.()
    if (winInfo && winInfo.windowWidth != null) return winInfo.windowWidth
  } catch { /* ignore */ }
  try {
    return uni.getSystemInfoSync().windowWidth ?? 375
  } catch { return 375 }
}

export function getPixelRatio(): number {
  try {
    const devInfo = (uni as any).getDeviceInfo?.()
    if (devInfo && devInfo.pixelRatio != null) return devInfo.pixelRatio
  } catch { /* ignore */ }
  try {
    return uni.getSystemInfoSync().pixelRatio ?? 2
  } catch { return 2 }
}
