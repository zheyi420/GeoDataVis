# GeoDataVis

基于 **Cesium + Vue 3** 的 WebGIS 数据可视化平台。

---

## 功能清单

### 📡 数据加载

#### 服务加载
- [x] WMS (Web Map Service) — 影像底图
- [x] WMTS (Web Map Tile Service) — 瓦片地图
- [x] 3D Tiles (Cesium3DTiles) — 倾斜摄影 / BIM 模型
- [x] DEM 地形 (CesiumTerrain) — 高程数据

#### 文件加载
- [x] GeoJSON (拖拽 / 选择、WFS URL) — 矢量数据（支持 Point/LineString/Polygon，加载后自动定位、可点击要素定位；WFS URL 支持 >5000 自动分批、失败重试、空数据提示）
- [ ] KML / KMZ — Google Earth 数据
- [ ] CZML (动态数据) — 实时轨迹
- [ ] Shapefile — 已移除入口，后期再考虑是否开发此功能

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

### 🚁 业务场景

- [ ] 视频融合（监控 / 无人机视频投射到地形）
- [ ] 实时监控（海量动态目标轨迹）
- [ ] 低空航路规划（3D 避障算法）

---

### 🛠️ 工具与调试

- [x] 图层管理（可见性 / 透明度 / 排序）
- [x] 3DTiles 调试可视化（包围球 / 包围盒 / 坐标轴）
- [x] 相机 / 鼠标位置实时显示（含高程信息，有地形时相机距地 ≤50km 显示）
- [x] 服务配置本地持久化（刷新后恢复 WMS/WMTS/3DTiles/Terrain）
- [x] 地形切换管理（含 ArcGIS 全球高程内置地形）
