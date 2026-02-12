/*
 * @Description: 影像图层工具函数
 *
 */
import { ImageryLayer, WebMapServiceImageryProvider, WebMapTileServiceImageryProvider, WebMercatorTilingScheme, Cesium3DTileset } from 'cesium'
import { ElMessage } from "element-plus";

/**
 * @typedef {import("cesium").ImageryLayer} ImageryLayer
 */

/**
 * 创建WMS服务图层
 * @param {Object} wmsOptions - WebMapServiceImageryProvider构造选项
 * @param {String} wmsOptions.url - WMS服务地址
 * @param {String} wmsOptions.layers - 图层名称
 * @param {Object} wmsOptions.parameters - 传递给WMS服务器以用于GetMap URL的附加参数。
 * @param {Number} [wmsOptions.tileWidth=256] - 瓦片宽度
 * @param {Number} [wmsOptions.tileHeight=256] - 瓦片高度
 * @param {String} [wmsOptions.srs] - 坐标系(非版本1.3.0)
 * @param {String} [wmsOptions.crs] - 坐标系(版本1.3.0)
 * @returns {Promise<ImageryLayer>} 创建的图层对象的Promise
 */
export function createWmsImageryLayer(wmsOptions) {
  return new Promise((resolve, reject) => {
    try {
      console.log('createWmsImageryLayer 参数', wmsOptions);

      // 创建WMS图层提供者
      const provider = new WebMapServiceImageryProvider(wmsOptions);

      // Registers a callback function to be executed whenever the event is raised.
      // An optional scope can be provided to serve as the this pointer in which the function will execute.
      // 监听提供者错误事件
      const removeCallback4ProviderErrEvt = provider.errorEvent.addEventListener((tileProviderError) => {
        // TODO
        console.error('tileProviderError', tileProviderError)
        // ElMessage.error(tileProviderError.message)
      })

      // 创建图层
      const imageryLayer = new ImageryLayer(provider);

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

/**
 * 创建WMTS服务图层
 * @param {Object} wmtsOptions - WebMapTileServiceImageryProvider构造选项
 * @param {String} wmtsOptions.url - WMTS服务地址
 * @param {String} wmtsOptions.layer - 图层名称
 * @param {String} wmtsOptions.style - 样式名称
 * @param {String} wmtsOptions.format - 图片格式
 * @param {String} wmtsOptions.tileMatrixSetID - 瓦片矩阵集标识符
 * @param {Object} [wmtsOptions.tileMatrixLabels] - 瓦片矩阵标签
 * @param {Number} [wmtsOptions.minimumLevel] - The minimum level-of-detail supported by the imagery provider.
 * @param {Number} [wmtsOptions.maximumLevel] - The maximum level-of-detail supported by the imagery provider, or undefined if there is no limit.
 * @param {Number} [wmtsOptions.tileWidth=256] - 瓦片宽度
 * @param {Number} [wmtsOptions.tileHeight=256] - 瓦片高度
 * @param {import("cesium").TilingScheme} [wmtsOptions.tilingScheme] - The tiling scheme corresponding to the organization of the tiles in the TileMatrixSet.
 * @returns {Promise<ImageryLayer>} 创建的图层对象的Promise
 */
export function createWmtsImageryLayer(wmtsOptions) {
  return new Promise((resolve, reject) => {
    try {
      console.log('createWmtsImageryLayer 参数', wmtsOptions);

      // 创建WMTS图层提供者
      const provideConstructorOptions = {
        url: wmtsOptions.url,
        layer: wmtsOptions.layer,
        style: wmtsOptions.style,
        format: wmtsOptions.format,
        tileMatrixSetID: wmtsOptions.tileMatrixSetID,
        ...(Object.hasOwn(wmtsOptions, 'tileMatrixLabels') && { tileMatrixLabels: wmtsOptions.tileMatrixLabels }),
        ...(Object.hasOwn(wmtsOptions, 'minimumLevel') && { minimumLevel: wmtsOptions.minimumLevel }),
        ...(Object.hasOwn(wmtsOptions, 'maximumLevel') && { maximumLevel: wmtsOptions.maximumLevel }),
        ...(Object.hasOwn(wmtsOptions, 'tileWidth') && { tileWidth: wmtsOptions.tileWidth }),
        ...(Object.hasOwn(wmtsOptions, 'tileHeight') && { tileHeight: wmtsOptions.tileHeight }),
        ...(Object.hasOwn(wmtsOptions, 'tilingScheme') && { tilingScheme: wmtsOptions.tilingScheme }),
        // ...(!Object.hasOwn(wmtsOptions, 'tilingScheme') && { tilingScheme: new WebMercatorTilingScheme() })
      }
      console.log('Cesium.WebMapTileServiceImageryProvider.ConstructorOptions', provideConstructorOptions);
      const provider = new WebMapTileServiceImageryProvider(provideConstructorOptions);

      // 监听提供者错误事件
      const removeCallback4ProviderErrEvt = provider.errorEvent.addEventListener((tileProviderError) => {
        console.error('WMTS tileProviderError', tileProviderError);
        // ElMessage.error(tileProviderError.message)
      });

      // 创建图层
      const imageryLayer = new ImageryLayer(provider);

      // 监听图层错误事件
      const removeLayerErrorCallback = imageryLayer.errorEvent.addEventListener((error) => {
        console.error('WMTS图层错误:', error);
        ElMessage.error(`WMTS图层错误: ${error.message || error}`);
      });

      resolve(imageryLayer);

    } catch (error) {
      console.error('创建WMTS图层失败:', error);
      reject(new Error(`创建WMTS图层失败: ${error.message || '未知错误'}`));
    }
  });
}

/**
 * 创建 Cesium 3DTiles 模型
 * @param {Object} options - 配置项
 * @param {string} options.url - tileset.json 的 URL
 * @param {number} [options.maximumScreenSpaceError=16] - 屏幕空间误差
 * @returns {Promise<Cesium3DTileset>} Cesium 3DTiles 实例的 Promise
 */
export async function create3DTilesLayer(options) {
  const {
    url,
    maximumScreenSpaceError = 16
  } = options

  if (!url) {
    throw new Error('tileset.json URL 不能为空')
  }

  try {
    console.log('create3DTilesLayer 参数', options)

    // 使用 Cesium3DTileset.fromUrl 加载 3DTiles
    const tileset = await Cesium3DTileset.fromUrl(url, {
      maximumScreenSpaceError: maximumScreenSpaceError
    })

    console.log('Cesium 3DTiles 加载成功:', tileset)
    return tileset
  } catch (error) {
    console.error('创建 3DTiles 失败:', error)

    // 提供更详细的错误信息
    if (error.message.includes('404')) {
      throw new Error('tileset.json 文件不存在（404），请检查 URL 是否正确')
    } else if (error.message.includes('CORS')) {
      throw new Error('跨域请求被阻止，请检查服务器 CORS 配置')
    } else if (error.message.includes('timeout')) {
      throw new Error('加载超时，请检查网络连接和服务器状态')
    } else if (error.message.includes('Network')) {
      throw new Error('网络错误，请检查服务器状态和网络连接')
    } else {
      throw new Error(`加载失败: ${error.message}`)
    }
  }
}

/**
 * 验证 tileset.json URL 格式
 * @param {string} url - 要验证的 URL
 * @returns {boolean} 是否为有效的 URL 格式
 */
export function validateTilesetUrl(url) {
  if (!url) return false

  // 基础 URL 格式验证
  const urlRegex = /^https?:\/\/.+\.json$/i
  return urlRegex.test(url)
}
