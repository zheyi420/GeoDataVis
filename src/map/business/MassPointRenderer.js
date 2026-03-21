/*
 * @Description: 大规模点位渲染器（PointPrimitiveCollection 封装）
 * 用于替代 GeoJsonDataSource Entity Billboard 渲染 Point/MultiPoint 要素，
 * 在 10 万级点位场景下保持低内存、高帧率。
 */

import { PointPrimitiveCollection, Cartesian3, Color, BlendOption } from 'cesium'

const SLICE_SIZE = 5000

class MassPointRenderer {
  /** @type {import("cesium").Viewer} */
  #viewer
  /** @type {import("cesium").PointPrimitiveCollection} */
  #collection

  /**
   * @param {import("cesium").Viewer} viewer
   */
  constructor(viewer) {
    this.#viewer = viewer
    this.#collection = viewer.scene.primitives.add(
      new PointPrimitiveCollection({
        // 全部为不透明点时可用 OPAQUE 提升最多 2x 性能
        blendOption: BlendOption.OPAQUE,
      })
    )
  }

  /**
   * 从 GeoJSON Feature 数组中提取 Point / MultiPoint 坐标并批量添加。
   * 适合 WFS 流式场景：每批 ~5000 条调用一次，调用后可释放 features 引用。
   * @param {Object[]} features
   */
  addPointsFromFeatures(features) {
    if (!Array.isArray(features) || features.length === 0) return
    for (const f of features) {
      const g = f?.geometry
      if (!g) continue
      const coords =
        g.type === 'Point'
          ? [g.coordinates]
          : g.type === 'MultiPoint'
            ? g.coordinates
            : []
      for (const c of coords) {
        if (!Array.isArray(c) || c.length < 2) continue
        this.#collection.add({
          position: Cartesian3.fromDegrees(c[0], c[1], c[2] ?? 0),
          color: Color.CYAN,
          pixelSize: 6,
        })
      }
    }
  }

  /**
   * 对已在内存中的大批量 features 做分片添加（每片 SLICE_SIZE 条），
   * 降低单次堆压力。适合文件 / .json URL 场景。
   * @param {Object[]} features
   */
  addPointsInSlices(features) {
    if (!Array.isArray(features) || features.length === 0) return
    for (let i = 0; i < features.length; i += SLICE_SIZE) {
      this.addPointsFromFeatures(features.slice(i, i + SLICE_SIZE))
    }
  }

  /** 已添加的点数量 */
  get pointCount() {
    return this.#collection.length
  }

  /** 可见性控制 */
  set show(value) {
    this.#collection.show = value
  }

  get show() {
    return this.#collection.show
  }

  /**
   * 从场景中移除集合并释放资源
   */
  destroy() {
    if (!this.#collection.isDestroyed()) {
      this.#viewer.scene.primitives.remove(this.#collection)
    }
  }

  isDestroyed() {
    return this.#collection.isDestroyed()
  }
}

export default MassPointRenderer
