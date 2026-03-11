---
name: geodatavis-progress-tracker
description: GeoDataVis 进度追踪工作流，指导如何在功能完成后更新 README.md 的功能清单和开发路线图。Use when a feature is completed and needs to be marked in README, when updating project progress, when finishing a quarterly milestone, or when the user asks to update project status.
---

# GeoDataVis 进度追踪工作流

## 触发时机

- 一个功能模块开发并手动测试通过后
- 达到季度里程碑时
- 每月回顾时

---

## 更新流程（每次完成功能后执行）

### 步骤 1：确认功能已完成

检查清单（全部满足再继续）：

- [ ] 代码已实现，无明显 bug
- [ ] 在浏览器中手动测试通过
- [ ] 若涉及性能，已验证达标（FPS / 内存 / 响应时间）

### 步骤 2：更新 README.md 功能清单

在 `README.md` 找到对应条目，将 `[ ]` 改为 `[x]`，并补充括号内的说明：

```markdown
# 修改前
- [ ] GeoJSON (拖拽/选择) — 矢量数据

# 修改后
- [x] GeoJSON (拖拽/选择) — 矢量数据（支持 Point/LineString/Polygon，加载后自动定位、可点击要素定位）
```

### 步骤 3：如达到季度里程碑，更新路线图表格状态

将对应行的"状态"列改为 `✅ 已完成`：

```markdown
# 修改前
| **基础加固** | 2026 Q1 (3–5月) | ... | 🔵 进行中 |

# 修改后
| **基础加固** | 2026 Q1 (3–5月) | ... | ✅ 已完成 |
```

下一阶段标记为 `🔵 进行中`。

### 步骤 4（可选）：添加演示截图或 GIF

在对应功能清单条目下方添加：

```markdown
- [x] 高程分层渲染 (地形高度可视化，低空航路规划辅助)

  ![高程分层渲染演示](docs/screenshots/elevation-layer.gif)
```

截图存放路径：`docs/screenshots/`（如目录不存在则创建）。

### 步骤 5：Git 提交

使用以下格式的提交信息：

```
docs(readme): mark [功能名称] as completed

- [x] [具体功能描述]
- 验收：[关键指标，如"5MB GeoJSON 前端秒级加载"]
- 文件：[主要修改的源文件]
```

**示例**：

```
docs(readme): mark GeoJSON file loading as completed

- [x] GeoJSON (拖拽/选择) — 矢量数据
- 验收：5MB+ GeoJSON 前端加载 < 1s，支持 Point/Line/Polygon，可点击定位
- 文件：LayerManager.js, DialogGeoJsonParam.vue, layerStore.js
```

---

## README 中各功能对应的验收标准速查

| 功能 | 验收标准 |
|------|---------|
| GeoJSON 文件加载 | 5MB+ 文件 < 1s，Point / Line / Polygon 均可渲染，可点击定位（已达成） |
| KML / KMZ | 加载后图层自动定位到数据范围 |
| CZML | 动态时序数据可播放，轨迹可见 |
| PostProcessStage 高程分层 | 高低海拔明显区分颜色，可开关 |
| CustomShader 动态预警圈 | 呼吸动画流畅（≥ 30FPS），支持自定义圆心和半径 |
| Primitive 10万级点 | FPS ≥ 50，内存增量 < 500MB，点击拾取 < 100ms |
| GPU Instancing | 1000 个模型实例 FPS ≥ 60 |

---

## 快捷检查：当前进度

> 运行以下 shell 命令快速查看 README 中的未完成项：

```bash
rg "\- \[ \]" README.md
```

> 查看已完成项：

```bash
rg "\- \[x\]" README.md
```
