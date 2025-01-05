# GeoDataVis


## 一、功能

### 1. 地理数据

#### （1）数据加载

- Web Map
  - [ ] WMS
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
  - https://wms.gebco.net/mapserv?request=getmap&service=wms&BBOX=-90,-180,90,360&crs=EPSG:4326&format=image/jpeg&layers=gebco_latest&width=1200&height=600&version=1.3.0
