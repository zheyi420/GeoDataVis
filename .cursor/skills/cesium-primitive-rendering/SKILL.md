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

最简单的高性能点集合，适合静态或低频更新的大规模点：

```js
// src/map/business/MassPointRenderer.js
import { PointPrimitiveCollection, Color, Cartesian3 } from 'cesium'

export class MassPointRenderer {
  #viewer
  #collection

  constructor(viewer) {
    this.#viewer = viewer
    this.#collection = viewer.scene.primitives.add(new PointPrimitiveCollection())
  }

  /**
   * 批量添加点位
   * @param {Array<{lon, lat, alt, color, id}>} points
   */
  addPoints(points) {
    points.forEach(p => {
      this.#collection.add({
        position: Cartesian3.fromDegrees(p.lon, p.lat, p.alt ?? 0),
        color: p.color ?? Color.CYAN,
        pixelSize: 8,
        id: p.id, // 用于后续拾取
      })
    })
  }

  /**
   * 实时更新点位坐标（模拟监控数据推送）
   * @param {Map<string, {lon, lat, alt}>} updates - id → 新坐标
   */
  updatePositions(updates) {
    for (let i = 0; i < this.#collection.length; i++) {
      const point = this.#collection.get(i)
      const newPos = updates.get(point.id)
      if (newPos) {
        point.position = Cartesian3.fromDegrees(newPos.lon, newPos.lat, newPos.alt ?? 0)
      }
    }
  }

  destroy() {
    this.#viewer.scene.primitives.remove(this.#collection)
  }
}
```

### 使用示例（模拟 10 万架无人机）

```js
const renderer = new MassPointRenderer(viewer)

// 生成模拟数据
const uavPoints = Array.from({ length: 100000 }, (_, i) => ({
  id: `uav_${i}`,
  lon: 113.0 + Math.random() * 2,
  lat: 22.5 + Math.random() * 1.5,
  alt: 50 + Math.random() * 500,
  color: Color.fromHsl(Math.random(), 1.0, 0.5),
}))

renderer.addPoints(uavPoints)

// 模拟实时数据推送（每 100ms 更新一批）
setInterval(() => {
  const updates = new Map()
  uavPoints.forEach(p => {
    p.lon += (Math.random() - 0.5) * 0.001
    p.lat += (Math.random() - 0.5) * 0.001
    updates.set(p.id, { lon: p.lon, lat: p.lat, alt: p.alt })
  })
  renderer.updatePositions(updates)
}, 100)
```

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
├── MassPointRenderer.js   # PointPrimitiveCollection 封装
└── PathPlanner.js         # 低空航路规划（依赖 DEM）
```

## 更多示例

- [GPU Instancing 详细实现](examples/gpu-instancing.md)
