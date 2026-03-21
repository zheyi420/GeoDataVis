---
name: cesium-primitive-rendering
description: Cesium Primitive API 高性能渲染指南，用于城市级监控场景模拟（10万级点实时更新、GPU Instancing、点位聚类与拾取）。Use when rendering large-scale point data, real-time monitoring simulation, performance optimization, GPU instancing, mass point rendering, or when Entity API is too slow.
---

# Cesium Primitive API 高性能渲染

## 为什么用 Primitive 而不是 Entity

| 对比项 | Entity API | Primitive API |
|-------|-----------|--------------|
| 渲染方式 | 每个对象独立绘制调用 | 批量合并为一次 Draw Call |
| 适用规模 | < 1000 个动态对象 | 10万+ 动态对象 |
| 灵活性 | 高（内置动画、属性绑定） | 低（需手动管理） |
| CPU 开销 | 高（每帧更新 JS 对象） | 低（数据直接传 GPU） |

**判断准则**：超过 1000 个需要实时更新的点位，切换到 Primitive。

---

## §1 基础：PointPrimitiveCollection（万级点位）

当前项目已落地 `MassPointRenderer`，核心是将 Point/MultiPoint 从 Entity 路径分流到 `PointPrimitiveCollection`：

```js
import { PointPrimitiveCollection, Cartesian3, Color, BlendOption } from 'cesium'

class MassPointRenderer {
  #viewer
  #collection

  constructor(viewer) {
    this.#viewer = viewer
    this.#collection = viewer.scene.primitives.add(
      new PointPrimitiveCollection({
        blendOption: BlendOption.OPAQUE,
      })
    )
  }

  /**
   * 从 GeoJSON features 批量提取 Point / MultiPoint 并添加
   * @param {Object[]} features
   */
  addPointsFromFeatures(features) {
    for (const f of features) {
      const g = f?.geometry
      const coords =
        g?.type === 'Point'
          ? [g.coordinates]
          : g?.type === 'MultiPoint'
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
   * 对已在内存中的大数组做分片添加，降低堆压力
   * @param {Object[]} features
   */
  addPointsInSlices(features) {
    const sliceSize = 5000
    for (let i = 0; i < features.length; i += sliceSize) {
      this.addPointsFromFeatures(features.slice(i, i + sliceSize))
    }
  }

  destroy() {
    this.#viewer.scene.primitives.remove(this.#collection)
  }
}
```

### WFS 流式接入（当前项目主路径）

```js
const receiver = layerManager.createStreamingReceiver()

await loadWfsAsGeoJsonStreaming(url, {
  onBatch: (features) => receiver.processBatch(features),
})

const { layerInstance } = await receiver.finalize()
// layerInstance = { massPointRenderer, dataSource2D, dataSource3D }
```

说明：
- `processBatch` 内部按几何分流：Point/MultiPoint -> `MassPointRenderer`
- 非 Point 要素进入 buffer，`finalize` 时一次性转 `GeoJsonDataSource`
- 失败路径需调用 `receiver.dispose()`，避免资源泄漏

---

## §2 GPU Instancing（单模型批量渲染）

适合渲染相同外形的大量对象（如无人机模型）：

```js
import { ModelInstanceCollection } from 'cesium' // 需 Cesium Ion 或本地 glTF

// 准备实例数据（位置矩阵数组）
const instances = uavPositions.map(pos => ({
  modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(
    Cartesian3.fromDegrees(pos.lon, pos.lat, pos.alt)
  ),
}))

const collection = viewer.scene.primitives.add(
  new ModelInstanceCollection({
    url: 'models/uav.glb',
    instances,
  })
)
```

详细实现见 [examples/gpu-instancing.md](examples/gpu-instancing.md)。

---

## §3 点位拾取优化（< 100ms 响应）

```js
// 高效拾取：只检测碰撞，不遍历所有点
const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)

handler.setInputAction(event => {
  const picked = viewer.scene.pick(event.position)

  if (picked && picked.primitive instanceof Cesium.PointPrimitive) {
    const pointId = picked.primitive.id
    console.log('点击目标 ID:', pointId)
    // 高亮选中点
    picked.primitive.color = Color.YELLOW
    picked.primitive.pixelSize = 14
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK)
```

---

## §4 LOD 聚类（缩放自适应）

```js
// 根据相机高度动态调整点的显示方式
viewer.scene.camera.changed.addEventListener(() => {
  const height = viewer.camera.positionCartographic.height

  if (height > 500000) {
    // 高空：隐藏个体，显示聚合热力图
    renderer.setVisible(false)
    heatmapLayer.show = true
  } else if (height > 100000) {
    // 中空：显示聚合点（每个格网一个代表点）
    renderer.setVisible(true)
    renderer.setPixelSize(4)
  } else {
    // 低空：显示全部个体点位
    renderer.setVisible(true)
    renderer.setPixelSize(8)
  }
})
```

---

## §5 验收标准

在 10 万点实时更新场景下：

| 指标 | 目标值 | 检测方法 |
|------|-------|---------|
| FPS | ≥ 50 | `viewer.scene.debugShowFramesPerSecond = true` |
| 内存增量 | < 500MB | Chrome DevTools → Memory |
| 点击拾取延迟 | < 100ms | `console.time/timeEnd` |
| 坐标更新延迟 | < 16ms（60FPS） | `performance.now()` 前后计时 |

---

## 文件规划

```
src/map/business/
├── MassPointRenderer.js   # 已实现：PointPrimitiveCollection 封装（Point/MultiPoint 分流）
└── PathPlanner.js         # 低空航路规划（依赖 DEM，规划中）
```

## 更多示例

- [GPU Instancing 详细实现](examples/gpu-instancing.md)
