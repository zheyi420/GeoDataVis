/*
 * @Description: 图层管理器（单例模式）
 * LayerManager 专注于 Cesium 操作，不管理 store 状态
 */

import { createWmsImageryLayer } from './utils/ImageryLayerUtils';

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
   * 创建WMS图层（不添加到store，由调用方处理）
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
   * 从 Cesium 中移除图层
   * @param {Cesium.ImageryLayer} layerInstance - 图层实例
   * @returns {Boolean} 是否成功移除
   */
  removeLayerFromCesium(layerInstance) {
    if (layerInstance) {
      this.#viewer.imageryLayers.remove(layerInstance, true);
      return true;
    }
    return false;
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
