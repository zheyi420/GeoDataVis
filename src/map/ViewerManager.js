/*
 * @Author: zheyi420
 * @Date: 2024-10-23 01:01:54
 * @LastEditors: zheyi420
 * @LastEditTime: 2024-10-30 00:17:22
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
    // set the default view for the 3D scene.
    // 又是homeButton响应后的回调函数中camera.flyHome()方法的目的地
    const [west, south, east, north] = [111.11, 21.66568, 115.861587, 23.881399]
    // The default rectangle the camera will view on creation.
    window.Cesium.Camera.DEFAULT_VIEW_FACTOR = 0 // 控制相机与指定矩形之间距离的参数
    window.Cesium.Camera.DEFAULT_VIEW_RECTANGLE =
      window.Cesium.Rectangle.fromDegrees(west, south, east, north)

    this.viewerContainer = container
    // 默认的部件设定策略
    const defaultWidgetConfig = {
      animation: false,
      baseLayerPicker: true, // false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: true, // false,
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
