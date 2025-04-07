/*
 * @Description: wms 服务图层工具函数
 *
 */


/**
 * 加载WMS服务图层
 * @param {String} layerName - 图层名称
 * @param {Object} constructorOptions - WebMapServiceImageryProvider构造选项
 * @param {String} constructorOptions.url - WMS服务地址
 * @param {String} constructorOptions.layers - 图层名称
 * @param {Object} constructorOptions.parameters - WMS参数
 * @param {Number} [constructorOptions.tileWidth=256] - 瓦片宽度
 * @param {Number} [constructorOptions.tileHeight=256] - 瓦片高度
 * @param {String} [constructorOptions.srs] - 坐标系(非版本1.3.0)
 * @param {String} [constructorOptions.crs] - 坐标系(版本1.3.0)
 * @returns {Cesium.ImageryLayer} 创建的图层对象
 */
export function loadWmsImagery(layerName, constructorOptions) {
  try {
    console.log('加载WMS图层:', layerName, constructorOptions);

    // 创建WMS图层提供者
    const provider = new window.Cesium.WebMapServiceImageryProvider(constructorOptions);

    // 添加瓦片加载错误的事件监听
    provider.errorEvent.addEventListener(error => {
      console.error('WMS瓦片加载错误:', error);
    });

    // 创建图层(但不添加到viewer中)
    const imageryLayer = new window.Cesium.ImageryLayer(provider);

    return imageryLayer;
  } catch (error) {
    console.error('创建WMS图层失败:', error);
    // 这里可以添加错误通知给用户
    return null;
  }
}
