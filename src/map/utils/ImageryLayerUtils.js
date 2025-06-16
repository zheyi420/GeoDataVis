/*
 * @Description: wms 服务图层工具函数
 *
 */

import { ElMessage } from "element-plus";


/**
 * 加载WMS服务图层
 * @param {Object} wmsOptions - WebMapServiceImageryProvider构造选项
 * @param {String} wmsOptions.url - WMS服务地址
 * @param {String} wmsOptions.layers - 图层名称
 * @param {Object} wmsOptions.parameters - 传递给WMS服务器以用于GetMap URL的附加参数。
 * @param {Number} [wmsOptions.tileWidth=256] - 瓦片宽度
 * @param {Number} [wmsOptions.tileHeight=256] - 瓦片高度
 * @param {String} [wmsOptions.srs] - 坐标系(非版本1.3.0)
 * @param {String} [wmsOptions.crs] - 坐标系(版本1.3.0)
 * @returns {Promise<Cesium.ImageryLayer>} 创建的图层对象的Promise
 */
export function createWmsImageryLayer(wmsOptions) {
  return new Promise((resolve, reject) => {
    try {
      console.log('createWmsImageryLayer 参数', wmsOptions);

      // 创建WMS图层提供者
      const provider = new window.Cesium.WebMapServiceImageryProvider(wmsOptions);

      // Registers a callback function to be executed whenever the event is raised.
      // An optional scope can be provided to serve as the this pointer in which the function will execute.
      // 监听提供者错误事件
      const removeCallback4ProviderErrEvt = provider.errorEvent.addEventListener((tileProviderError) => {
        // TODO
        console.error('tileProviderError', tileProviderError)
        // ElMessage.error(tileProviderError.message)
      })

      // 创建图层
      const imageryLayer = new window.Cesium.ImageryLayer(provider);

      // 监听图层错误事件
      const removeLayerErrorCallback = imageryLayer.errorEvent.addEventListener((error) => {
        console.error('WMS图层错误:', error);
        ElMessage.error(`图层错误: ${error.message || error}`);
      });

      // 可以添加一个简单的连通性测试
      // 尝试请求一个基础瓦片来验证服务是否可用
      // TODO 有可能不存在基础瓦片(0,0,0)
      /*
      provider.requestImage(0, 0, 0)
        .then(() => {
          // 服务可用，解析Promise
          resolve(imageryLayer);
        })
        .catch((error) => {
          // 服务不可用，拒绝Promise
          console.error('WMS服务连通性测试失败:', error);
          reject(new Error(`WMS服务不可用: ${error.message || '连接失败'}`));
        });
      */
      resolve(imageryLayer);

    } catch (error) {
      console.error('创建WMS图层失败:', error);
      reject(new Error(`创建WMS图层失败: ${error.message || '未知错误'}`));
    }
  });
}
