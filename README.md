# GeoDataVis


## 一、功能

### 1. 地理数据

#### （1）数据加载

- Web Map
  - [ ] WMS
    - [ ] 添加缓存
    - [ ] 标准参数
    - [ ] 特定供应商参数
  - [ ] WMTS

- 三维数据
  - [ ] 3D Tiles/Cesium3DTiles
  - [ ] glTF
  - [ ] CZML

- DEM



### 2. 面板

- [x] 底部数值栏
  - [x] 相机数据
    - [x] 经度、纬度、高度
    - [x] 方位角、俯仰角、倾斜角
  - [X] 鼠标数据
    - [X] 经度、纬度、高度

- [ ] 数据加载面板
  - [ ] 通过服务地址URL加载数据

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
