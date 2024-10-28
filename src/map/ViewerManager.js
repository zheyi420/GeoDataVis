/*
 * @Author: zheyi420
 * @Date: 2024-10-23 01:01:54
 * @LastEditors: zheyi420
 * @LastEditTime: 2024-10-29 00:35:49
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
    this.viewerContainer = container
    // 默认的部件设定策略
    const defaultWidgetConfig = {
      animation: false,
      baseLayerPicker: true, // false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      infoBox: false,
      scene3DOnly: true,
      shouldAnimate: false,
    }
    this.viewer = new window.Cesium.Viewer(container, {
      ...defaultWidgetConfig,
      ...options,
    })
    this.viewer.cesiumWidget.creditContainer.style.display = 'none'

    // 修改鼠标控制策略
    const control = this.viewer.scene.screenSpaceCameraController
    control.tiltEventTypes = window.Cesium.CameraEventType.RIGHT_DRAG
    control.zoomEventTypes = window.Cesium.CameraEventType.WHEEL

    return this.viewer
  }
}

export default ViewerManager
