# GeoDataVis

基于 **Cesium + Vue 3** 的 WebGIS 数据可视化平台。

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

## 开发路线图

> 当前时间：2026年3月 | 项目定位：作品集 / 技术演示平台
> 目标：展示 WebGIS 底层技术能力，为低空监控等业务做技术储备

| 阶段 | 时间范围 | 基础功能 | 实战技术场景 | 作品集价值 | 状态 |
|------|---------|---------|------------|----------|------|
| **基础加固** | 2026 Q1<br/>(3–5月) | GeoJSON/KML/CZML<br/>文件加载 | PostProcessStage<br/>• 高程分层渲染<br/>• 实时阴影效果 | 地形分析可视化能力 | 🔵 进行中 |
| **视觉飞跃** | 2026 Q2<br/>(6–8月) | 3DTiles 属性查询<br/>与高亮 | CustomShader<br/>• 动态预警圈（禁飞区）<br/>• 实时流场可视化<br/>• 动态轨迹渲染 | 低空监控技术预研 | ⚪ 计划中 |
| **性能突破** | 2026 Q3<br/>(9–11月) | 大规模数据<br/>LOD 优化 | Primitive API<br/>• 10万级点实时更新<br/>• 点位聚类与拾取<br/>• 实例化渲染 | 城市级监控场景模拟 | ⚪ 计划中 |
| **架构升级** | 2026 Q4<br/>(12月–2027年2月) | 多源数据<br/>聚合接口 | 环境模拟<br/>• 物理阴影<br/>• 动态天气 | 完整场景渲染能力 | ⚪ 计划中 |
| **业务落地** | 2027 全年 | — | 视频融合 / 实时监控 / 航路规划 | 行业解决方案 | ⚪ 计划中 |

---

## 功能清单

### 📡 数据加载

#### 服务加载
- [x] WMS (Web Map Service) — 影像底图
- [x] WMTS (Web Map Tile Service) — 瓦片地图
- [x] 3D Tiles (Cesium3DTiles) — 倾斜摄影 / BIM 模型
- [x] DEM 地形 (CesiumTerrain) — 高程数据

#### 文件加载
- [ ] GeoJSON (拖拽 / 选择) — 矢量数据
- [ ] KML / KMZ — Google Earth 数据
- [ ] CZML (动态数据) — 实时轨迹
- [ ] Shapefile — GIS 标准格式（后期可选，建议先转为 GeoJSON 后加载）

---

### 🎨 数据可视化增强（Shader 技术）

#### PostProcessStage — 场景级效果
- [ ] 高程分层渲染（地形高度可视化，低空航路规划辅助）
- [ ] 边缘检测（建筑物轮廓提取，空间分析辅助）
- [ ] 实时阴影（物理光照模拟）

#### CustomShader — 要素级效果
- [ ] 动态预警圈（禁飞区 / 监控范围可视化）
- [ ] 实时流场可视化（风场 / 热力图）
- [ ] 动态轨迹渲染（运动目标拖尾）

---

### ⚡ 高性能渲染（Primitive API）

- [ ] 10万级点位实时更新（城市级监控场景模拟）
- [ ] 点位聚类与 LOD（缩放级别自适应）
- [ ] GPU Instancing（实例化批量渲染）
- [ ] 快速拾取与查询（点击响应 < 100ms）

---

### 🚁 业务场景（2027 年目标）

- [ ] 视频融合（监控 / 无人机视频投射到地形）
- [ ] 实时监控（海量动态目标轨迹）
- [ ] 低空航路规划（3D 避障算法）

---

### 🛠️ 工具与调试

- [x] 图层管理（可见性 / 透明度 / 排序）
- [x] 3DTiles 调试可视化（包围球 / 包围盒 / 坐标轴）
- [x] 相机 / 鼠标位置实时显示
- [x] 地形切换管理

---

## 免费服务测试

- **WMS**
  - 服务地址：`https://wms.gebco.net/mapserv`
  - 关键参数：`request=getmap`, `service=wms`, `crs=EPSG:4326`, `layers=gebco_latest`, `version=1.3.0`

---

## 项目运行

### 环境准备

确保已全局安装 pnpm：

```bash
npm install -g pnpm
```

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建项目

```bash
pnpm build
```

### 预览构建结果

```bash
pnpm preview
```

### 代码格式化

```bash
pnpm format
```

### 代码检查与修复

```bash
pnpm lint
```

---

## 学习资源

- [Cesium 官方文档](https://cesium.com/learn/cesiumjs/)
- [Cesium 技术博客](https://cesium.com/blog)（重点：3D Tiles Next、Custom Shader、Metadata）
- [Cesium 源码 Shaders 目录](node_modules/.pnpm/@cesium+engine@*/node_modules/@cesium/engine/Source/Shaders/)
