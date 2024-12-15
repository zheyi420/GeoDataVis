/*
 * @Author: zheyi420
 * @Date: 2024-10-23 01:01:54
 * @LastEditors: zheyi420
 * @LastEditTime: 2024-12-13 00:54:45
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
    window.Cesium.Camera.DEFAULT_VIEW_RECTANGLE = window.Cesium.Rectangle.fromDegrees(west, south, east, north)

    this.viewerContainer = container
    // 默认的部件设定策略
    const defaultWidgetConfig = {
      animation: false, // Animation widget
      baseLayerPicker: true, // 底图选择器
      fullscreenButton: false, // 全屏按钮
      geocoder: false, // Geocoder widget
      homeButton: true, // 主视图按钮
      sceneModePicker: false, // 场景模式选择器
      selectionIndicator: false, // 选择指示器
      timeline: false, // 时间轴
      navigationHelpButton: false, // 导航帮助按钮
      infoBox: false, // 信息框
      scene3DOnly: true, // 仅3D场景
      shouldAnimate: false, // 时钟事件模拟
    }
    this.viewer = new window.Cesium.Viewer(container, {
      ...defaultWidgetConfig,
      ...options,
    })
    this.viewer.cesiumWidget.creditContainer.style.display = 'none' // 隐藏版权信息

    // 修改鼠标控制策略
    const control = this.viewer.scene.screenSpaceCameraController
    control.rotateEventTypes = window.Cesium.CameraEventType.LEFT_DRAG
    control.tiltEventTypes = [window.Cesium.CameraEventType.MIDDLE_DRAG, { eventType : window.Cesium.CameraEventType.LEFT_DRAG, modifier : window.Cesium.KeyboardEventModifier.CTRL }]
    control.lookEventTypes = window.Cesium.CameraEventType.RIGHT_DRAG
    control.zoomEventTypes = window.Cesium.CameraEventType.WHEEL

    this.viewer.camera.percentageChanged = 0.001 // 设置更高的灵敏度
    
    // # 确保camera.roll始终为0
    this.keepCameraRollZero(this.viewer)

    return this.viewer
  }

  /**
   * 确保camera.roll始终为0
   * 通过监听camera.changed事件来保持camera.roll为0
   * @param {Object} viewer
   * @returns {Function} removeCallBack4KeepCameraRollZero
   */
  keepCameraRollZero(viewer) {
    // 监听camera.changed事件，确保camera.roll始终为0
    const removeCallBack4KeepCameraRollZero = viewer.camera.changed.addEventListener(() => {
      if (viewer.camera.roll === 0) return

      viewer.camera.setView({
        orientation: {
          heading: viewer.camera.heading,
          pitch: viewer.camera.pitch,
          roll: 0.0,
        },
      })
    })
    return removeCallBack4KeepCameraRollZero
  }

  /**
   * 确保camera.roll始终为0
   * 通过监听鼠标事件来保持camera.roll为0
   * @param {Object} viewer
   */
  _keepCameraRollZero(viewer) {
    // 创建事件处理器
    const handler = new window.Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    // 记录鼠标初始位置
    let startMousePosition

    // 监听右键按下事件
    handler.setInputAction(function (movement) {
      startMousePosition = movement.position // 记录初始位置
    }, window.Cesium.ScreenSpaceEventType.RIGHT_DOWN)

    // 监听鼠标移动事件
    handler.setInputAction(function (movement) {
      if (startMousePosition) {
        // 重置roll值为0
        // 使用setView方法设置新的视角，保持roll为0
        viewer.camera.setView({
          destination: viewer.camera.position, // 保持当前位置不变
          orientation: {
            heading: viewer.camera.heading,
            pitch: viewer.camera.pitch,
            roll: 0, // 确保roll为0
          },
        })
      }
    }, window.Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    // 监听右键抬起事件以重置初始位置
    handler.setInputAction(function () {
      startMousePosition = undefined // 清除初始位置
    }, window.Cesium.ScreenSpaceEventType.RIGHT_UP)
  }
}

export default ViewerManager
