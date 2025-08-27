/*
 * @Description: Viewer 初始化（单例模式）
 *
 */

class ViewerManager {
  /**
   * @name 地图视图类（单例模式）
   */
  #viewer; // 私有属性
  #viewerContainer; // 私有属性
  static #instance; // 单例实例 静态私有属性

  constructor() {
    if (ViewerManager.#instance) {
      return ViewerManager.#instance;
    }

    this.#viewer = null;
    this.#viewerContainer = null;

    ViewerManager.#instance = this;
  }

  /**
   * 获取ViewerManager实例
   * @returns {ViewerManager} ViewerManager实例
   */
  static getInstance() {
    if (!ViewerManager.#instance) {
      ViewerManager.#instance = new ViewerManager();
    }
    return ViewerManager.#instance;
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

    this.#viewerContainer = container

    // 创建自定义时钟和时钟视图模型
    /* const clock = new window.Cesium.Clock({
      shouldAnimate: false,
      multiplier: 1.0,
      currentTime: window.Cesium.JulianDate.now()
    });

    const clockViewModel = new window.Cesium.ClockViewModel(clock);
    // 立即禁用同步机制
    clockViewModel.synchronize = function() {
      // 空函数，防止同步导致的递归调用
    }; */

    // 默认的部件设定策略
    const defaultWidgetConfig = {
      animation: true, // Animation widget 动画面板
      baseLayerPicker: true, // 底图选择器
      fullscreenButton: false, // 全屏按钮
      geocoder: false, // Geocoder widget
      homeButton: true, // 主视图按钮
      sceneModePicker: false, // 场景模式选择器
      selectionIndicator: false, // 选择指示器
      timeline: true, // 时间轴面板
      navigationHelpButton: false, // 导航帮助按钮
      infoBox: false, // 信息框
      scene3DOnly: true, // 仅3D场景
      /* 不设置shouldAnimate，让clockViewModel控制 */
      // shouldAnimate: false, // 禁用时钟动画（默认 false）
      // clockViewModel: clockViewModel,  // 使用自定义的时钟视图模型
    }
    this.#viewer = new window.Cesium.Viewer(container, {
      ...defaultWidgetConfig,
      ...options,
    })
    // 隐藏动画面板
    this.#viewer.animation.container.style.visibility = 'hidden'
    // 隐藏时间轴面板
    this.#viewer.timeline.container.style.visibility = 'hidden'
    // 隐藏版权信息
    this.#viewer.cesiumWidget.creditContainer.style.display = 'none'

    /* 修改鼠标控制策略 */
    const control = this.#viewer.scene.screenSpaceCameraController
    // 左键拖拽：平移
    control.rotateEventTypes = window.Cesium.CameraEventType.LEFT_DRAG
    // 中键拖拽：倾斜
    control.tiltEventTypes = [window.Cesium.CameraEventType.MIDDLE_DRAG, { eventType : window.Cesium.CameraEventType.LEFT_DRAG, modifier : window.Cesium.KeyboardEventModifier.CTRL }]
    // 右键拖拽：相机位置不动，仅朝向改变
    control.lookEventTypes = window.Cesium.CameraEventType.RIGHT_DRAG
    // 滚轮：缩放
    control.zoomEventTypes = window.Cesium.CameraEventType.WHEEL

    this.#viewer.camera.percentageChanged = 0.001 // 设置更高的灵敏度

    // # 确保camera.roll始终为0
    this.keepCameraRollZero(this.#viewer)

    return this.#viewer
  }

  /**
   * 获取viewer实例
   * @returns {Object} viewer实例
   */
  get viewer() {
    return this.#viewer;
  }

  /**
   * 获取viewerContainer
   * @returns {Element|string} viewerContainer
   */
  get viewerContainer() {
    return this.#viewerContainer;
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

  /**
   * 重置单例实例（主要用于测试或重新初始化）
   */
  static resetInstance() {
    ViewerManager.#instance = null;
  }
}

export default ViewerManager
