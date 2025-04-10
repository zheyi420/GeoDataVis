/*
 * @Description: 图层管理器（单例模式）
 */

import { loadWmsImagery } from './utils/ImageryLayerUtils';

class LayerManager {
  #viewer; // 私有属性
  static #instance; // 单例实例 静态私有属性

  constructor(viewer) {
    if (LayerManager.#instance) {
      return LayerManager.#instance;
    }

    this.#viewer = viewer;
    this.layerMap = new Map(); // 存储图层名称与图层对象的映射

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
   * @param {String} layerName - 图层名称
   * @param {Object} options - 图层选项
   * @returns {Cesium.ImageryLayer} 图层对象
   */
  addWmsLayer(layerName, options) {
    console.log('addWmsLayer', layerName, options);
    const layer = loadWmsImagery(layerName, options);
    if (layer) {
      this.layerMap.set(layerName, layer);
      // 确保图层被添加到viewer中
      this.#viewer.imageryLayers.add(layer);
    }
    return layer;
  }

  /**
   * 通过名称获取图层
   * @param {String} layerName - 图层名称
   * @returns {Cesium.ImageryLayer|undefined} 图层对象
   */
  getLayerByName(layerName) {
    return this.layerMap.get(layerName);
  }

  /**
   * 移除图层
   * @param {String} layerName - 图层名称
   * @returns {Boolean} 是否成功移除
   */
  removeLayer(layerName) {
    const layer = this.layerMap.get(layerName);
    if (layer) {
      this.#viewer.imageryLayers.remove(layer, true);
      this.layerMap.delete(layerName);
      return true;
    }
    return false;
  }

  /**
   * 显示或隐藏图层
   * @param {String} layerName - 图层名称
   * @param {Boolean} visible - 是否可见
   */
  setLayerVisibility(layerName, visible) {
    const layer = this.layerMap.get(layerName);
    if (layer) {
      layer.show = visible;
    }
  }

  /**
   * 移除所有图层
   * @returns {Number} 移除的图层数量
   */
  removeAllLayers() {
    // 保存要移除的图层名称
    const layerNames = Array.from(this.layerMap.keys());
    let count = 0;

    // 移除每个图层
    for (const layerName of layerNames) {
      if (this.removeLayer(layerName)) {
        count++;
      }
    }

    return count;
  }

  /**
   * 重置单例实例（主要用于测试或重新初始化）
   */
  static resetInstance() {
    LayerManager.#instance = null;
  }
}

export default LayerManager;
