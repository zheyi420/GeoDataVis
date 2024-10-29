/*
 * @Author: zheyi420
 * @Date: 2024-10-29 23:46:36
 * @LastEditors: zheyi420
 * @LastEditTime: 2024-10-30 00:18:42
 * @FilePath: \GeoDataVis\src\map\utils\CesiumViewInfo.js
 * @Description: 工具函数，获取当前视图的的信息，如当前相机的高度，显示的地图的坐标范围等。
 *
 */

/**
 * @name 获取当前视图的坐标范围
 * @param { Object } viewer - 地图视图对象
 * @returns { Object }
 * @returns { Object.InCartesian3 }
 * @returns { Object.InCartographic }
 * @returns { Object.InDegree }
 */
export function getCurrentViewExtent(viewer) {
  const scene = viewer.scene
  const ellipsoid = scene.globe.ellipsoid
  const canvas = scene.canvas

  const canvasRect = canvas.getBoundingClientRect()
  const canvasWidth = canvasRect.width
  const canvasHeight = canvasRect.height

  const pickLeftTop = new window.Cesium.Cartesian2(0, 0)
  const pickRightTop = new window.Cesium.Cartesian2(canvasWidth, 0)
  const pickRightBottom = new window.Cesium.Cartesian2(
    canvasWidth,
    canvasHeight,
  )
  const pickLeftBottom = new window.Cesium.Cartesian2(0, canvasHeight)

  // TODO
  const pick11 = scene.pickPosition(pickLeftTop)
  const pick22 = scene.pickPosition(pickRightBottom)
  const pick33 = scene.pickPosition(pickRightTop)
  const pick44 = scene.pickPosition(pickLeftBottom)

  const cartographic1 = ellipsoid.cartesianToCartographic(pick11)
  const cartographic2 = ellipsoid.cartesianToCartographic(pick22)
  const cartographic3 = ellipsoid.cartesianToCartographic(pick33)
  const cartographic4 = ellipsoid.cartesianToCartographic(pick44)

  const lon1 = window.Cesium.Math.toDegrees(cartographic1.longitude)
  const lat1 = window.Cesium.Math.toDegrees(cartographic1.latitude)
  const lon2 = window.Cesium.Math.toDegrees(cartographic2.longitude)
  const lat2 = window.Cesium.Math.toDegrees(cartographic2.latitude)
  const lon3 = window.Cesium.Math.toDegrees(cartographic3.longitude)
  const lat3 = window.Cesium.Math.toDegrees(cartographic3.latitude)
  const lon4 = window.Cesium.Math.toDegrees(cartographic4.longitude)
  const lat4 = window.Cesium.Math.toDegrees(cartographic4.latitude)

  const extent = {
    InCartesian3: {
      pick11,
      pick22,
      pick33,
      pick44,
    },
    InCartographic: {
      cartographic1,
      cartographic2,
      cartographic3,
      cartographic4,
    },
    InDegree: {
      lon1,
      lat1,
      lon2,
      lat2,
      lon3,
      lat3,
      lon4,
      lat4,
    },
  }

  return extent
}
