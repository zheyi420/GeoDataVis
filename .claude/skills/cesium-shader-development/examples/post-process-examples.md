# PostProcessStage 示例

## 边缘检测（建筑物轮廓提取）

**业务价值**："提取建筑物轮廓，辅助城市空间分析"

```js
const edgeShader = `
  uniform sampler2D colorTexture;
  uniform sampler2D depthTexture;
  in vec2 v_textureCoordinates;

  void main() {
    vec2 texelSize = vec2(1.0 / czm_viewport.z, 1.0 / czm_viewport.w);

    float d  = texture(depthTexture, v_textureCoordinates).r;
    float dL = texture(depthTexture, v_textureCoordinates + vec2(-texelSize.x, 0.0)).r;
    float dR = texture(depthTexture, v_textureCoordinates + vec2( texelSize.x, 0.0)).r;
    float dU = texture(depthTexture, v_textureCoordinates + vec2(0.0,  texelSize.y)).r;
    float dD = texture(depthTexture, v_textureCoordinates + vec2(0.0, -texelSize.y)).r;

    float edge = abs(d - dL) + abs(d - dR) + abs(d - dU) + abs(d - dD);
    edge = step(0.001, edge); // 阈值，调整轮廓粗细

    vec4 color = texture(colorTexture, v_textureCoordinates);
    vec3 edgeColor = vec3(0.0, 1.0, 1.0); // 青色轮廓
    out_FragColor = vec4(mix(color.rgb, edgeColor, edge * 0.9), 1.0);
  }
`
```

## 夜视仪效果（演示用）

```js
const nightVisionShader = `
  uniform sampler2D colorTexture;
  in vec2 v_textureCoordinates;

  void main() {
    vec4 color = texture(colorTexture, v_textureCoordinates);
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    out_FragColor = vec4(0.0, gray * 1.5, 0.0, 1.0);
  }
`
```

## 开启 / 关闭封装

```js
// PostProcessManager.js
const stages = new Map()

export function enableStage(viewer, name, fragmentShader, uniforms = {}) {
  if (stages.has(name)) return
  const stage = new PostProcessStage({ fragmentShader, uniforms })
  viewer.scene.postProcessStages.add(stage)
  stages.set(name, stage)
}

export function disableStage(viewer, name) {
  const stage = stages.get(name)
  if (stage) {
    viewer.scene.postProcessStages.remove(stage)
    stages.delete(name)
  }
}
```
