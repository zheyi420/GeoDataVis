/*
 * @Author: zheyi420
 * @Date: 2024-10-29 23:46:36
 * @LastEditors: zheyi420
 * @LastEditTime: 2024-10-31 01:07:04
 * @FilePath: \GeoDataVis\src\map\utils\CesiumViewInfo.js
 * @Description: 工具函数，获取当前视图的的信息，如当前相机的高度，显示的地图的坐标范围等。
 *
 */

/**
 * @name 获取当前视图的坐标范围，返回的四个角的顺序为左上，右上，右下，左下
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

  const pickLeftTopInCartesian2 = new window.Cesium.Cartesian2(0, 0)
  const pickRightTopInCartesian2 = new window.Cesium.Cartesian2(canvasWidth, 0)
  const pickRightBottomInCartesian2 = new window.Cesium.Cartesian2(canvasWidth, canvasHeight)
  const pickLeftBottomInCartesian2 = new window.Cesium.Cartesian2(0, canvasHeight)

  const pickLeftTopInCartesian3 = scene.camera.pickEllipsoid(pickLeftTopInCartesian2)
  const pickRightTopInCartesian3 = scene.camera.pickEllipsoid(pickRightTopInCartesian2)
  const pickRightBottomInCartesian3 = scene.camera.pickEllipsoid(pickRightBottomInCartesian2)
  const pickLeftBottomInCartesian3 = scene.camera.pickEllipsoid(pickLeftBottomInCartesian2)

  const pickLeftTopInCartographic = ellipsoid.cartesianToCartographic(pickLeftTopInCartesian3)
  const pickRightTopInCartographic = ellipsoid.cartesianToCartographic(pickRightTopInCartesian3)
  const pickRightBottomInCartographic = ellipsoid.cartesianToCartographic(pickRightBottomInCartesian3)
  const pickLeftBottomInCartographic = ellipsoid.cartesianToCartographic(pickLeftBottomInCartesian3)

  const pickLeftTopInDegreeLon = window.Cesium.Math.toDegrees(pickLeftTopInCartographic.longitude)
  const pickLeftTopInDegreeLat = window.Cesium.Math.toDegrees(pickLeftTopInCartographic.latitude)
  const pickRightTopInDegreeLon = window.Cesium.Math.toDegrees(pickRightTopInCartographic.longitude)
  const pickRightTopInDegreeLat = window.Cesium.Math.toDegrees(pickRightTopInCartographic.latitude)
  const pickRightBottomInDegreeLon = window.Cesium.Math.toDegrees(pickRightBottomInCartographic.longitude)
  const pickRightBottomInDegreeLat = window.Cesium.Math.toDegrees(pickRightBottomInCartographic.latitude)
  const pickLeftBottomInDegreeLon = window.Cesium.Math.toDegrees(pickLeftBottomInCartographic.longitude)
  const pickLeftBottomInDegreeLat = window.Cesium.Math.toDegrees(pickLeftBottomInCartographic.latitude)

  const extent = {
    InCartesian3: {
      pickLeftTopInCartesian3,
      pickRightTopInCartesian3,
      pickRightBottomInCartesian3,
      pickLeftBottomInCartesian3,
    },
    InCartographic: {
      pickLeftTopInCartographic,
      pickRightTopInCartographic,
      pickRightBottomInCartographic,
      pickLeftBottomInCartographic,
    },
    InDegree: {
      LeftTop: [pickLeftTopInDegreeLon, pickLeftTopInDegreeLat],
      RightTop: [pickRightTopInDegreeLon, pickRightTopInDegreeLat],
      RightBottom: [pickRightBottomInDegreeLon, pickRightBottomInDegreeLat],
      LeftBottom: [pickLeftBottomInDegreeLon, pickLeftBottomInDegreeLat],
    },
  }

  return extent
}
