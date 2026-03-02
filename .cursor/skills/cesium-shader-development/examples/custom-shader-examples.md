# CustomShader 示例

## 动态轨迹渲染（带拖尾）

**业务价值**："运动目标拖尾效果，实时监控数据直观展示"

拖尾通过 `PolylineTrailMaterialProperty`（Fabric 材质）实现，更易集成：

```js
import { Material, Color } from 'cesium'

// 注册自定义 Fabric 材质
Material._materialCache.addMaterial('PolylineTrail', {
  fabric: {
    type: 'PolylineTrail',
    uniforms: {
      color: Color.CYAN,
      image: 'Assets/Textures/gradient.png', // 拖尾纹理
      time: 0,
    },
    source: `
      czm_material czm_getMaterial(czm_materialInput materialInput) {
        czm_material material = czm_getDefaultMaterial(materialInput);
        vec2 st = materialInput.st;
        // 沿线方向形成渐变拖尾
        float trail = pow(1.0 - st.s, 2.0) * (0.5 + 0.5 * sin(st.s * 20.0 - czm_frameNumber * 0.1));
        material.diffuse = color.rgb;
        material.alpha = trail * color.a;
        return material;
      }
    `,
  },
  translucent: true,
})

// 使用
viewer.entities.add({
  polyline: {
    positions: coordinates,
    width: 3,
    material: new Cesium.PolylineTrailMaterialProperty({
      color: Color.CYAN,
      duration: 3000,
    }),
  },
})
```

## 实时流场可视化（风场 / 热力）

**业务价值**："气象数据、人流热力等分析结果的动态展示"

```js
// 使用 Canvas 动态更新纹理实现流场效果
function createFlowFieldTexture(viewer, vectorData) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  // 每帧绘制粒子运动
  function update() {
    ctx.fillStyle = 'rgba(0,0,0,0.1)' // 拖尾
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    vectorData.particles.forEach(p => {
      const vx = vectorData.getU(p.x, p.y)
      const vy = vectorData.getV(p.x, p.y)
      p.x += vx * 0.5
      p.y += vy * 0.5

      const speed = Math.sqrt(vx * vx + vy * vy)
      ctx.fillStyle = `hsl(${240 - speed * 20}, 100%, 60%)`
      ctx.fillRect(p.x, p.y, 2, 2)

      // 超出边界则重置
      if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
        p.x = Math.random() * canvas.width
        p.y = Math.random() * canvas.height
      }
    })

    requestAnimationFrame(update)
  }

  update()
  return canvas
}

// 将 Canvas 作为纹理贴到地球
const flowEntity = viewer.entities.add({
  rectangle: {
    coordinates: Cesium.Rectangle.fromDegrees(lon1, lat1, lon2, lat2),
    material: new Cesium.ImageMaterialProperty({
      image: canvas,
      transparent: true,
    }),
  },
})
```

## 3DTiles CustomShader 颜色高亮

```js
import { CustomShader, UniformType } from 'cesium'

// 根据属性值动态着色（如建筑高度热力图）
const heightHeatmapShader = new CustomShader({
  uniforms: {
    u_minHeight: { type: UniformType.FLOAT, value: 0.0 },
    u_maxHeight: { type: UniformType.FLOAT, value: 200.0 },
  },
  fragmentShaderText: `
    void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
      // 从 feature 属性读取高度（需要 tileset 有 height 属性）
      float height = fsInput.featureIds.featureId_0; // 简化示例
      float t = clamp((height - u_minHeight) / (u_maxHeight - u_minHeight), 0.0, 1.0);
      // 蓝→绿→红热力配色
      vec3 cold = vec3(0.0, 0.0, 1.0);
      vec3 warm = vec3(1.0, 0.0, 0.0);
      material.diffuse = mix(cold, warm, t);
    }
  `,
})

tileset.customShader = heightHeatmapShader
```
