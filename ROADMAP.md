# GeoDataVis 开发路线图

> 当前时间：2026年3月 | 项目定位：作品集 / 技术演示平台
> 目标：展示 WebGIS 底层技术能力，为低空监控等业务做技术储备

---

## 产品定位

**作品集 / 技术演示平台** — 向面试官/客户展示 WebGIS 底层开发能力，为低空监控等业务场景做技术储备。

> 核心原则：每项技术必须对应可说明的业务场景，避免"为技术而技术"。

## 核心策略：双轨并行

- **20% 基础功能** — 补齐文件加载、数据查询等"有用"功能
- **80% 实战技术场景** — 死磕 Shader / Primitive / 算法，建立不可替代性

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 地图引擎 | Cesium (`@cesium/engine`) |
| 前端框架 | Vue 3 + Composition API |
| 状态管理 | Pinia |
| 构建工具 | Vite |
| UI 组件库 | Element Plus |
| 样式 | SCSS |

---

## 季度里程碑

| 阶段 | 时间范围 | 基础功能 | 实战技术场景 | 作品集价值 | 状态 |
|------|---------|---------|------------|----------|------|
| **基础加固** | 2026 Q1<br/>(3–5月) | GeoJSON/KML/CZML<br/>文件加载 | PostProcessStage<br/>• 高程分层渲染<br/>• 实时阴影效果 | 地形分析可视化能力 | 🔵 进行中 |
| **视觉飞跃** | 2026 Q2<br/>(6–8月) | 3DTiles 属性查询<br/>与高亮 | CustomShader<br/>• 动态预警圈（禁飞区）<br/>• 实时流场可视化<br/>• 动态轨迹渲染 | 低空监控技术预研 | ⚪ 计划中 |
| **性能突破** | 2026 Q3<br/>(9–11月) | 大规模数据<br/>LOD 优化 | Primitive API<br/>• 10万级点实时更新<br/>• 点位聚类与拾取<br/>• 实例化渲染 | 城市级监控场景模拟 | ⚪ 计划中 |
| **架构升级** | 2026 Q4<br/>(12月–2027年2月) | 多源数据<br/>聚合接口 | 环境模拟<br/>• 物理阴影<br/>• 动态天气 | 完整场景渲染能力 | ⚪ 计划中 |
| **业务落地** | 2027 全年 | — | 视频融合 / 实时监控 / 航路规划 | 行业解决方案 | ⚪ 计划中 |

---

## 关键文件与扩展点

| 功能 | 涉及文件 | 扩展方式 |
|------|---------|---------|
| 文件加载 | `ToolBarLoadPanel.vue`、新增 `DialogGeoJsonParam.vue` | `handleChange4FileLoadType` 分支 + LayerManager |
| DataSource | `LayerManager.js` | 新增 `addGeoJsonDataSource` / `addKmlDataSource` / `addCzmlDataSource` |
| PostProcessStage | `ViewerManager.js` 或新建 `PostProcessManager.js` | `viewer.scene.postProcessStages.add()` |
| CustomShader | 新建 `src/map/shaders/` | Fabric 材质或 Primitive 自定义材质 |
| Primitive 大规模点 | 新建 `src/map/business/MassPointRenderer.js` | `Primitive` + `GeometryInstance` + Instancing |
| 航路规划 | 新建 `src/map/business/PathPlanner.js` | 地形采样 API + 3D A* |

---

## 学习资源

- [Cesium 官方文档](https://cesium.com/learn/cesiumjs/)
- [Cesium 技术博客](https://cesium.com/blog)（重点：3D Tiles Next、Custom Shader、Metadata）
- [Cesium 源码 Shaders 目录](node_modules/.pnpm/@cesium+engine@*/node_modules/@cesium/engine/Source/Shaders/)
