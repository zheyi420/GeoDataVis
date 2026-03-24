# GPU Instancing 详细实现

## 场景：批量渲染 1000 架相同外形无人机

### 方案一：ModelInstanceCollection（推荐，需本地 glTF）

```js
import {
  ModelInstanceCollection,
  Transforms,
  Cartesian3,
  HeadingPitchRoll,
  Math as CesiumMath,
} from 'cesium'

/**
 * 创建 GPU 实例化无人机集合
 * @param {Cesium.Viewer} viewer
 * @param {Array<{lon, lat, alt, heading}>} uavList
 */
export function createUAVInstanceCollection(viewer, uavList) {
  const instances = uavList.map(uav => {
    const position = Cartesian3.fromDegrees(uav.lon, uav.lat, uav.alt)
    const hpr = new HeadingPitchRoll(
      CesiumMath.toRadians(uav.heading ?? 0),
      0,
      0
    )
    return {
      modelMatrix: Transforms.headingPitchRollToFixedFrame(position, hpr),
    }
  })

  return viewer.scene.primitives.add(
    new ModelInstanceCollection({
      url: 'models/uav.glb',
      instances,
      minimumPixelSize: 16,
      maximumScale: 200,
    })
  )
}
```

### 方案二：GeometryInstance + Primitive（无需外部模型文件）

用简单几何体（球 / 圆锥）代表无人机，适合不需要精细模型的场景：

```js
import {
  Primitive,
  GeometryInstance,
  SphereGeometry,
  PerInstanceColorAppearance,
  ColorGeometryInstanceAttribute,
  Color,
  Transforms,
  Cartesian3,
  Matrix4,
} from 'cesium'

export function createMassSpherePrimitive(viewer, positions) {
  const instances = positions.map((pos, i) => {
    const center = Cartesian3.fromDegrees(pos.lon, pos.lat, pos.alt)
    const modelMatrix = Matrix4.multiplyByUniformScale(
      Transforms.eastNorthUpToFixedFrame(center),
      10, // 半径 10m
      new Matrix4()
    )

    return new GeometryInstance({
      geometry: new SphereGeometry({ radius: 1.0, stackPartitions: 6, slicePartitions: 6 }),
      modelMatrix,
      id: `uav_${i}`,
      attributes: {
        color: ColorGeometryInstanceAttribute.fromColor(
          Color.fromHsl(i / positions.length, 1.0, 0.6)
        ),
      },
    })
  })

  return viewer.scene.primitives.add(
    new Primitive({
      geometryInstances: instances,
      appearance: new PerInstanceColorAppearance({ flat: true }),
      releaseGeometryInstances: false, // 保留以便后续更新
      interleave: true,               // 交错存储，提升 GPU 缓存命中率
    })
  )
}
```

### 实时更新实例位置

GeometryInstance 位置更新需要重建 Primitive（频繁更新时不推荐），推荐改用 `PointPrimitiveCollection`：

```js
// 高频实时更新（> 10Hz）→ PointPrimitiveCollection
// 低频位置变化（< 1Hz）→ 重建 Primitive 或 ModelInstanceCollection
```

### 性能对比参考

| 方案 | 1000 个对象 FPS | 10000 个对象 FPS | 适用场景 |
|------|---------------|----------------|---------|
| Entity | ~15 | 崩溃 | 少量静态对象 |
| PointPrimitiveCollection | 60 | 60 | 大量动态点位 |
| GeometryInstance Primitive | 60 | 55 | 中量带形状对象 |
| ModelInstanceCollection | 60 | 45 | 精细 3D 模型 |
