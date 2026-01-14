/*
 * @Description: 图层管理器（单例模式）
 * LayerManager 专注于 Cesium 操作，不管理 store 状态
 */

import { createWmsImageryLayer, createWmtsImageryLayer, create3DTilesLayer } from './utils/ImageryLayerUtils';
import { HeadingPitchRange, Math as CesiumMath } from 'cesium';

class LayerManager {
  #viewer; // 私有属性
  static #instance; // 单例实例 静态私有属性

  constructor(viewer) {
    if (LayerManager.#instance) {
      return LayerManager.#instance;
    }

    this.#viewer = viewer;

    LayerManager.#instance = this;
  }

  /**
   * 获取LayerManager实例
   * @param {Cesium.Viewer} viewer - Cesium Viewer实例
   * @returns {LayerManager} LayerManager实例
   */
  static getInstance(viewer) {
    if (!LayerManager.#instance && viewer) {
      LayerManager.#instance = new LayerManager(viewer);
    }
    return LayerManager.#instance;
  }

  /**
   * 添加WMS图层
   * @param {Object} wmsOptions - 图层选项
   * @returns {Promise<Cesium.ImageryLayer>} 返回创建图层的Promise
   */
  addWmsLayer(wmsOptions) {
    console.log('addWmsLayer', wmsOptions);
    return createWmsImageryLayer(wmsOptions)
      .then(layer => {
        if (layer) {
          // 确保图层被添加到viewer中
          this.#viewer.imageryLayers.add(layer);
          return layer;
        }
        return null;
      });
  }

  /**
   * 添加WMTS图层
   * @param {Object} wmtsOptions - WMTS图层选项
   * @returns {Promise<Cesium.ImageryLayer>} 返回创建图层的Promise
   */
  addWmtsLayer(wmtsOptions) {
    console.log('addWmtsLayer', wmtsOptions);
    return createWmtsImageryLayer(wmtsOptions)
      .then(layer => {
        if (layer) {
          // 确保图层被添加到viewer中
          this.#viewer.imageryLayers.add(layer);
          return layer;
        }
        return null;
      });
  }


  /**
   * 添加 Cesium 3DTiles 模型
   * @param {Object} tilesOptions - 3DTiles 配置项
   * @param {string} tilesOptions.url - tileset.json 的 URL
   * @param {number} tilesOptions.maximumScreenSpaceError - 屏幕空间误差（默认 16）
   * @returns {Promise<Object>} 返回 tileset 实例的 Promise
   */
  async add3DTilesLayer(tilesOptions) {
    console.log('add3DTilesLayer', tilesOptions);
    try {
      // 1. 使用工具函数创建 3DTiles 模型
      const tileset = await create3DTilesLayer(tilesOptions);

      // 2. 添加到 Cesium viewer 的 primitives
      this.#viewer.scene.primitives.add(tileset);

      // 3. 自动聚焦 camera 到模型位置
      this._zoomToTileset(tileset);

      return tileset;
    } catch (error) {
      console.error('加载 3DTiles 失败:', error);
      throw new Error(`加载 3DTiles 模型失败: ${error.message}`);
    }
  }

  /**
   * 聚焦 camera 到 3DTiles 模型
   * @param {Object} tileset - Cesium 3DTiles 实例
   */
  _zoomToTileset(tileset) {
    try {
      if (tileset.boundingSphere) {
        const boundingSphere = tileset.boundingSphere;
        this.#viewer.camera.flyToBoundingSphere(boundingSphere, {
          duration: 1.0,
          offset: new HeadingPitchRange(
            CesiumMath.toRadians(0),
            CesiumMath.toRadians(-45),
            boundingSphere.radius * 2
          ),
        });
      }
    } catch (error) {
      console.error('聚焦失败:', error);
    }
  }

  /**
   * 移除 3DTiles 模型
   * @param {Object} tileset - Cesium 3DTiles 实例
   * @returns {Boolean} 是否成功移除
   */
  remove3DTilesLayer(tileset) {
    if (tileset) {
      const result = this.#viewer.scene.primitives.remove(tileset);
      return result;
    }
    return false;
  }

  /**
   * 从 Cesium 中移除图层（通用方法）
   * @param {Cesium.ImageryLayer|Cesium3DTileset} layerInstance - 图层实例
   * @param {String} layerType - 图层类型 ('service' 或 'model')
   * @returns {Boolean} 是否成功移除
   */
  removeLayerFromCesium(layerInstance, layerType) {
    if (!layerInstance) {
      return false;
    }

    // 根据图层类型选择不同的移除方法
    if (layerType === 'model') {
      // 3DTiles 模型使用 primitives.remove
      return this.remove3DTilesLayer(layerInstance);
    } else {
      // ImageryLayer 使用 imageryLayers.remove
      const result = this.#viewer.imageryLayers.remove(layerInstance, true);
      return result;
    }
  }

  /**
   * 设置图层可见性
   * @param {Cesium.ImageryLayer} layerInstance - 图层实例
   * @param {Boolean} visible - 是否可见
   * @returns {Boolean} 是否成功设置
   */
  setLayerVisibility(layerInstance, visible) {
    if (layerInstance) {
      layerInstance.show = visible;
      return true;
    }
    return false;
  }

  /**
   * 设置图层透明度
   * @param {Cesium.ImageryLayer} layerInstance - 图层实例
   * @param {Number} opacity - 透明度值（0-1）
   * @returns {Boolean} 是否成功设置
   */
  setLayerOpacity(layerInstance, opacity) {
    if (layerInstance) {
      layerInstance.alpha = opacity;
      return true;
    }
    return false;
  }

  /**
   * 设置 3DTiles 瓦片边界体积显示
   * @param {Cesium3DTileset} tileset - 3DTiles 实例
   * @param {Boolean} visible - 是否显示
   * @returns {Boolean} 是否成功设置
   */
  set3DTilesBoundingVolumeVisibility(tileset, visible) {
    if (tileset) {
      tileset.debugShowBoundingVolume = visible;
      return true;
    }
    return false;
  }

  /**
   * 设置 3DTiles 内容边界体积显示
   * @param {Cesium3DTileset} tileset - 3DTiles 实例
   * @param {Boolean} visible - 是否显示
   * @returns {Boolean} 是否成功设置
   */
  set3DTilesContentBoundingVolumeVisibility(tileset, visible) {
    if (tileset) {
      tileset.debugShowContentBoundingVolume = visible;
      return true;
    }
    return false;
  }

  /**
   * 设置 3DTiles 可见性
   * @param {Cesium3DTileset} tileset - 3DTiles 实例
   * @param {Boolean} visible - 是否可见
   * @returns {Boolean} 是否成功设置
   */
  set3DTilesVisibility(tileset, visible) {
    if (tileset) {
      tileset.show = visible;
      return true;
    }
    return false;
  }

  /**
   * 获取viewer实例（用于其他需要direct access的场景）
   * @returns {Cesium.Viewer} viewer实例
   */
  getViewer() {
    return this.#viewer;
  }

  /**
   * 重置单例实例（主要用于测试或重新初始化）
   */
  static resetInstance() {
    LayerManager.#instance = null;
  }
}

export default LayerManager;
