---
name: cesium-shader-development
description: Cesium Shader 开发指南，涵盖 PostProcessStage 场景级效果（高程分层渲染、实时阴影）和 CustomShader 要素级效果（动态预警圈、流场可视化、轨迹渲染）。Use when implementing PostProcessStage, CustomShader, GLSL shaders, data visualization effects, terrain analysis, flight zone warning visualization, or any visual effects in GeoDataVis.
---

# Cesium Shader 开发指南

## 快速定位

| 需求 | 方案 | 参考 |
|------|------|------|
| 场景整体色调 / 分析效果 | PostProcessStage | 下方 §1 |
| 单个 3DTiles 模型效果 | CustomShader (tileset) | 下方 §2 |
| 地面 / 图元动态效果 | CustomShader (Primitive + Fabric) | 下方 §2 |
| 实时流场 / 热力 | CustomShader + 纹理更新 | [examples/custom-shader-examples.md](examples/custom-shader-examples.md) |

---

## §1 PostProcessStage — 场景级效果

挂载在 `viewer.scene.postProcessStages`，每帧对整个渲染结果做图像处理。

### 基础模板

```js
// src/map/PostProcessManager.js
import { PostProcessStage } from 'cesium'

export function addPostProcessStage(viewer, fragmentShader, uniforms = {}) {
  const stage = new PostProcessStage({ fragmentShader, uniforms })
  viewer.scene.postProcessStages.add(stage)
  return stage
}

export function removePostProcessStage(viewer, stage) {
  viewer.scene.postProcessStages.remove(stage)
}
```

GLSL 内置变量（片元着色器）：
- `uniform sampler2D colorTexture` — 当前帧颜色缓冲
- `uniform sampler2D depthTexture` — 深度缓冲
- `in vec2 v_textureCoordinates` — UV 坐标 [0,1]

### 高程分层渲染（✅ Q1 实战场景）

**业务价值**："地形高度可视化分析，辅助低空航路规划识别高海拔危险区域"

```js
const elevationShader = `
  uniform sampler2D colorTexture;
  uniform sampler2D depthTexture;
  in vec2 v_textureCoordinates;

  // 将深度值还原为线性高度的工具函数（简化版）
  float getHeight(vec2 uv) {
    float depth = texture(depthTexture, uv).r;
    // depth 接近 1.0 表示远处/地面；接近 0.0 表示近处
    return 1.0 - depth;
  }

  void main() {
    vec4 color = texture(colorTexture, v_textureCoordinates);
    float h = getHeight(v_textureCoordinates);

    // 高程分层着色（低→高：蓝→绿→黄→红）
    vec3 layerColor;
    if (h < 0.25)      layerColor = mix(vec3(0.0,0.0,1.0), vec3(0.0,1.0,0.0), h/0.25);
    else if (h < 0.5)  layerColor = mix(vec3(0.0,1.0,0.0), vec3(1.0,1.0,0.0), (h-0.25)/0.25);
    else if (h < 0.75) layerColor = mix(vec3(1.0,1.0,0.0), vec3(1.0,0.5,0.0), (h-0.5)/0.25);
    else               layerColor = mix(vec3(1.0,0.5,0.0), vec3(1.0,0.0,0.0), (h-0.75)/0.25);

    out_FragColor = vec4(mix(color.rgb, layerColor, 0.6), 1.0);
  }
`

// 使用
const stage = addPostProcessStage(viewer, elevationShader)
// 关闭
removePostProcessStage(viewer, stage)
```

---

## §2 CustomShader — 要素级效果

作用于单个 3DTiles Tileset 或 Primitive，精确控制模型 / 图元表面颜色。

### 动态预警圈（✅ Q2 实战场景）

**业务价值**："模拟无人机禁飞区 / 监控范围的动态可视化，低空管理核心需求"

```js
import { CustomShader, UniformType } from 'cesium'

// 用于 3DTiles tileset.customShader
export function createWarningRingShader(centerLon, centerLat, radiusMeters) {
  return new CustomShader({
    uniforms: {
      u_center:  { type: UniformType.VEC2, value: new Cesium.Cartesian2(centerLon, centerLat) },
      u_radius:  { type: UniformType.FLOAT, value: radiusMeters },
      u_time:    { type: UniformType.FLOAT, value: 0.0 },
    },
    fragmentShaderText: `
      void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
        vec2 posLonLat = fsInput.attributes.positionMC.xy; // 简化：实际需转换坐标
        float dist = length(posLonLat - u_center);
        float ring = abs(dist - u_radius * (0.8 + 0.2 * sin(u_time * 2.0)));
        float alpha = smoothstep(500.0, 0.0, ring); // 环宽 500m
        material.diffuse = mix(material.diffuse, vec3(1.0, 0.0, 0.0), alpha * 0.7);
        material.alpha = max(material.alpha, alpha * 0.8);
      }
    `,
  })
}

// 动画更新（在 viewer.scene.preUpdate 事件中）
let startTime = Date.now()
viewer.scene.preUpdate.addEventListener(() => {
  const t = (Date.now() - startTime) / 1000.0
  tileset.customShader.setUniform('u_time', t)
})
```

### 动态轨迹渲染（✅ Q2 实战场景）

**业务价值**："运动目标拖尾效果，实时监控数据的直观展示"

完整示例见 [examples/custom-shader-examples.md](examples/custom-shader-examples.md)。

---

## §3 调试技巧

1. **Shader 编译错误**：控制台会输出 `GLSL compile error`，定位到行号后检查变量类型
2. **PostProcessStage 不生效**：确认 `stage.enabled = true`，检查 `viewer.scene.postProcessStages` 是否包含该 stage
3. **CustomShader 颜色异常**：先把 `fragmentMain` 输出纯色（`material.diffuse = vec3(1,0,0)`）确认着色器在执行
4. **性能监控**：`viewer.scene.debugShowFramesPerSecond = true`

---

## 文件结构

```
src/map/
├── PostProcessManager.js      # PostProcessStage 统一管理
└── shaders/
    ├── elevationLayer.glsl    # 高程分层
    ├── warningRing.glsl       # 动态预警圈
    └── trajectoryTrail.glsl  # 轨迹拖尾
```

## 更多示例

- [PostProcessStage 示例](examples/post-process-examples.md)
- [CustomShader 示例](examples/custom-shader-examples.md)
