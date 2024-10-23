/*
 * @Author: zheyi420
 * @Date: 2024-10-23 01:01:54
 * @LastEditors: zheyi420
 * @LastEditTime: 2024-10-24 00:32:55
 * @FilePath: \GeoDataVis\src\map\ViewerManager.js
 * @Description: Viewer 初始化
 *
 */

class ViewerManager {
  /**
   * @name 地图视图类
   */
  constructor() {
    this.viewer = null
    this.viewerContainer = null
  }

  /**
   * @name 创建视图
   * @param { Element | string } container - The DOM element or ID that will contain the widget.
   * @param { Object } options - 场景参数
   * @param { String } options.baseColor - 地球背景色
   * @param { Boolean } options.show - 是否显示球体
   * @param { Boolean } options.depthTestAgainstTerrain - 开启深度监测
   * @param { Boolean } options.enableLighting - 开启光照
   * @param { Number } options.globeAlpha - 球体透明度
   * @param { Number } options.minimumDisableDepthTestDistance - 禁用深度测试最小距离
   * @returns { Object } Viewer
   */
  createViewer(container, options) {
    // 设置椭球体
    /* const obj = [6378137.0, 6378137.0, 6356752.3142451793]
    window.Cesium.Ellipsoid.WGS84 = new window.Cesium.Ellipsoid(
      obj[0],
      obj[1],
      obj[2],
    ) */
    this.viewerContainer = container
    this.viewer = new window.Cesium.Viewer(container, {
      infoBox: false,
      ...options,
    })
    // this.viewer._cesiumWidget._creditContainer.style.display = 'none'
    /* let control = this.viewer.scene.screenSpaceCameraController
    control.tiltEventTypes = window.Cesium.CameraEventType.RIGHT_DRAG
    control.zoomEventTypes = [
      window.Cesium.CameraEventType.WHEEL,
      window.Cesium.CameraEventType.PINCH,
    ] */
    return this.viewer
  }
}

export default ViewerManager
