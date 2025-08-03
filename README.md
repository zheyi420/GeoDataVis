# GeoDataVis


## 一、功能

### 1. 地理数据加载

#### 1.1 服务加载

##### 1.1.1 Web Map Service

- WMS
- WMTS

##### 1.1.2 3D-Data

- 3D Tiles/Cesium3DTiles
- glTF模型数据
- DEM地形数据
- CZML动态数据
- KML/KMZ文件

#### 1.2 文件加载

##### 1.2.1 GeoJSON

##### 1.2.2 Shapefile


### 2. 面板

#### 2.1 底部数值栏

- 相机数据
  - 经度、纬度、高度
  - 方位角、俯仰角、倾斜角
- 鼠标数据
  - 经度、纬度、高度

#### 2.2 图层管理面板


## 二、代码

### css

- [x] 使用样式表预处理器sass，使用语法SCSS


## 三、免费服务测试

- WMS
  - 服务地址：https://wms.gebco.net/mapserv
  - 请求参数：
    - request=getmap
    - service=wms
    - BBOX=-90,-180,90,360
    - crs=EPSG:4326
    - format=image/jpeg
    - layers=gebco_latest
    - width=1200
    - height=600
    - version=1.3.0

## 四、项目运行

### 环境准备

确保已全局安装pnpm：

```bash
npm install -g pnpm
```

### 安装依赖

```bash
pnpm install
```

### 复制Cesium资源

```bash
pnpm copy-cesium-assets
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

### 可选：创建一个pnpm-workspace.yaml文件

如果将来你打算将项目扩展为monorepo结构，可以在根目录创建一个`pnpm-workspace.yaml`文件：

```yaml
packages:
  - 'src/**'
  # 未来其他包的路径
```

### 可选：添加.npmrc文件

在项目根目录添加一个`.npmrc`文件，可以设置一些pnpm的配置选项：
