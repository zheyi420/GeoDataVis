import { ref, markRaw } from 'vue'
import { defineStore } from 'pinia'

/**
 * @typedef {import('@/map/LayerManager').default} LayerManager
 */

export const useLayerStore = defineStore('layers', () => {
  // 所有图层的数据集合（包括地图服务图层和数据文件图层）
  const layers = ref([]);

  /**
   * 获取LayerManager实例
   * @returns {LayerManager|null} LayerManager实例
   */
  function getLayerManager() {
    return window.layerManager || null;
  }

  // 添加新图层
  function _addLayer(layer) {
    // 确保layer有必要的属性
    const newLayer = {
      name: layer.name || '未命名图层',
      type: layer.type || 'unknown', // 'service' 或 'file' 或 'model'
      visible: layer.visible !== undefined ? layer.visible : true,
      opacity: layer.opacity !== undefined ? layer.opacity : 1,
      sourceType: layer.sourceType || '', // 例如：'WMS', 'GeoJSON', 'Cesium3DTiles'等
      layerInstance: markRaw(layer.layerInstance) || null, // 实际图层对象的引用
      metadata: layer.metadata || {} // 其他元数据
    };

    // 为 3DTiles 图层添加调试状态
    if (layer.sourceType === 'Cesium3DTiles') {
      newLayer.debugShowBoundingVolume = false;
      newLayer.debugShowContentBoundingVolume = false;
    }

    // 自动重命名逻辑：确保图层名称唯一
    newLayer.name = getUniqueLayerName(newLayer.name);
    newLayer.id = `layer_${Date.now()}`;

    layers.value.push(newLayer);
    return newLayer.id;
  }

  /**
   * 获取唯一的图层名称
   * @param {String} baseName - 基础名称
   * @returns {String} 唯一的图层名称
   */
  function getUniqueLayerName(baseName) {
    const existingNames = layers.value.map(l => l.name);

    // 如果基础名称不存在，直接返回
    if (!existingNames.includes(baseName)) {
      return baseName;
    }

    // 查找可用的编号
    let counter = 1;
    let candidateName;
    do {
      candidateName = `${baseName}(${counter})`;
      counter++;
    } while (existingNames.includes(candidateName));

    return candidateName;
  }

  /**
   * 添加WMS图层
   * @param {String} layerName - 图层名称
   * @param {Object} wmsOptions - WMS图层选项
   * @returns {Promise<String>} 返回图层ID的Promise
   */
  function addWmsLayer(layerName, wmsOptions) {
    const layerManager = getLayerManager();
    if (!layerManager) {
      return Promise.reject(new Error('LayerManager 未初始化'));
    }

    return layerManager.addWmsLayer(wmsOptions)
      .then(layerInstance => {
        if (layerInstance) {
          // 添加到 store 中
          const layerId = _addLayer({
            name: layerName,
            type: 'service',
            sourceType: 'WMS',
            visible: true,
            opacity: 1,
            layerInstance: layerInstance,
            metadata: wmsOptions
          });
          return layerId;
        } else {
          throw new Error('图层创建失败');
        }
      });
  }

  /**
   * 添加WMTS图层
   * @param {String} layerName - 图层名称
   * @param {Object} wmtsOptions - WMTS图层选项
   * @returns {Promise<String>} 返回图层ID的Promise
   */
  function addWmtsLayer(layerName, wmtsOptions) {
    const layerManager = getLayerManager();
    if (!layerManager) {
      return Promise.reject(new Error('LayerManager 未初始化'));
    }

    return layerManager.addWmtsLayer(wmtsOptions)
      .then(layerInstance => {
        if (layerInstance) {
          // 添加到 store 中
          const layerId = _addLayer({
            name: layerName,
            type: 'service',
            sourceType: 'WMTS',
            visible: true,
            opacity: 1,
            layerInstance: layerInstance,
            metadata: wmtsOptions
          });
          return layerId;
        } else {
          throw new Error('WMTS图层创建失败');
        }
      });
  }

  /**
   * 添加 Cesium 3DTiles 模型
   * @param {String} layerName - 图层名称
   * @param {Object} tilesOptions - 3DTiles 配置项
   * @returns {Promise<String>} 返回图层ID的Promise
   */
  function add3DTilesLayer(layerName, tilesOptions) {
    const layerManager = getLayerManager();
    if (!layerManager) {
      return Promise.reject(new Error('LayerManager 未初始化'));
    }

    return layerManager.add3DTilesLayer(tilesOptions)
      .then(tileset => {
        if (tileset) {
          // 添加到 store 中
          const layerId = _addLayer({
            name: layerName,
            type: 'model',
            sourceType: 'Cesium3DTiles',
            visible: true,
            opacity: 1,
            layerInstance: tileset,
            metadata: tilesOptions
          });
          return layerId;
        } else {
          throw new Error('3DTiles 模型创建失败');
        }
      });
  }

  // 移除指定ID的图层
  function removeLayer(layerId) {
    console.log('开始移除图层:', layerId);
    const index = layers.value.findIndex(layer => layer.id === layerId);
    if (index !== -1) {
      const layer = layers.value[index];
      console.log('找到图层:', layer);

      // 通过 LayerManager 从 Cesium 中移除图层
      const layerManager = getLayerManager();
      console.log('LayerManager实例:', layerManager);
      console.log('图层实例:', layer.layerInstance);
      console.log('图层类型:', layer.type);

      if (layerManager && layer.layerInstance) {
        // 传递图层类型，让 LayerManager 选择正确的移除方法
        const success = layerManager.removeLayerFromCesium(layer.layerInstance, layer.type);
        console.log('从Cesium移除图层结果:', success);

        if (!success) {
          console.warn('从Cesium移除图层失败');
        }
      } else {
        console.warn('LayerManager或图层实例为空:', { layerManager, layerInstance: layer.layerInstance });
      }

      // 从store中移除
      layers.value.splice(index, 1);
      console.log('从store移除图层完成');
      return true;
    }
    console.warn('未找到指定ID的图层:', layerId);
    return false;
  }

  // 设置图层可见性
  function setLayerVisibility(layerId, visible) {
    const layer = layers.value.find(layer => layer.id === layerId);
    if (layer) {
      // 通过 LayerManager 更新 Cesium 图层状态
      const layerManager = getLayerManager();
      if (layerManager && layer.layerInstance) {
        let success = false;
        // 根据图层类型选择不同的方法
        if (layer.type === 'model') {
          success = layerManager.set3DTilesVisibility(layer.layerInstance, visible);
        } else {
          success = layerManager.setLayerVisibility(layer.layerInstance, visible);
        }

        if (success) {
          // 只有 Cesium 操作成功时才更新 store 状态
          layer.visible = visible;
          return true;
        }
      } else {
        // 如果没有 LayerManager 或图层实例，只更新 store 状态
        layer.visible = visible;
        return true;
      }
    }
    return false;
  }

  // 设置图层透明度
  function setLayerOpacity(layerId, opacity) {
    const layer = layers.value.find(layer => layer.id === layerId);
    if (layer) {
      // 通过 LayerManager 更新 Cesium 图层状态
      const layerManager = getLayerManager();
      if (layerManager && layer.layerInstance) {
        const success = layerManager.setLayerOpacity(layer.layerInstance, opacity);
        if (success) {
          // 只有 Cesium 操作成功时才更新 store 状态
          layer.opacity = opacity;
          return true;
        }
      } else {
        // 如果没有 LayerManager 或图层实例，只更新 store 状态
        layer.opacity = opacity;
        return true;
      }
    }
    return false;
  }

  // 按顺序移动图层（上移或下移）
  function moveLayer(layerId, direction) {
    const index = layers.value.findIndex(layer => layer.id === layerId);
    if (index === -1) return false;

    if (direction === 'up' && index > 0) {
      // 上移
      const temp = layers.value[index];
      layers.value[index] = layers.value[index - 1];
      layers.value[index - 1] = temp;
      return true;
    } else if (direction === 'down' && index < layers.value.length - 1) {
      // 下移
      const temp = layers.value[index];
      layers.value[index] = layers.value[index + 1];
      layers.value[index + 1] = temp;
      return true;
    }

    return false;
  }

  // 获取服务类型图层
  function getServiceLayers() {
    return layers.value.filter(layer => ['service', 'model'].includes(layer.type));
  }

  // 获取数据文件类型图层
  function getFileLayers() {
    return layers.value.filter(layer => layer.type === 'file');
  }

  // 获取所有图层
  function getAllLayers() {
    return layers.value;
  }

  // 获取指定ID的图层
  function getLayerById(layerId) {
    return layers.value.find(layer => layer.id === layerId) || null;
  }

  // 清空所有图层
  function clearAllLayers() {
    const layerManager = getLayerManager();

    // 逐一移除所有图层（包括从 Cesium 中移除）
    const allLayers = [...layers.value]; // 创建副本避免遍历时修改数组
    allLayers.forEach(layer => {
      if (layerManager && layer.layerInstance) {
        layerManager.removeLayerFromCesium(layer.layerInstance, layer.type);
      }
    });

    // 清空 store
    layers.value = [];
  }

  // 更新现有图层的属性
  function updateLayer(layerId, properties) {
    const layer = layers.value.find(layer => layer.id === layerId);
    if (layer) {
      Object.assign(layer, properties);
      return true;
    }
    return false;
  }

  /**
   * 设置 3DTiles 调试选项
   * @param {String} layerId - 图层ID
   * @param {Object} options - 调试选项
   * @param {Boolean} options.showBoundingVolume - 是否显示瓦片边界体积
   * @param {Boolean} options.showContentBoundingVolume - 是否显示内容边界体积
   * @returns {Boolean} 是否成功设置
   */
  function set3DTilesDebugOptions(layerId, options) {
    const layer = layers.value.find(layer => layer.id === layerId);
    if (!layer || layer.sourceType !== 'Cesium3DTiles') {
      return false;
    }

    const layerManager = getLayerManager();
    if (!layerManager || !layer.layerInstance) {
      return false;
    }

    let success = true;

    // 设置瓦片边界体积显示
    if (options.showBoundingVolume !== undefined) {
      const result = layerManager.set3DTilesBoundingVolumeVisibility(
        layer.layerInstance,
        options.showBoundingVolume
      );
      if (result) {
        layer.debugShowBoundingVolume = options.showBoundingVolume;
      }
      success = success && result;
    }

    // 设置内容边界体积显示
    if (options.showContentBoundingVolume !== undefined) {
      const result = layerManager.set3DTilesContentBoundingVolumeVisibility(
        layer.layerInstance,
        options.showContentBoundingVolume
      );
      if (result) {
        layer.debugShowContentBoundingVolume = options.showContentBoundingVolume;
      }
      success = success && result;
    }

    return success;
  }

  return {
    layers,
    addWmsLayer,
    addWmtsLayer,
    add3DTilesLayer,
    removeLayer,
    setLayerVisibility,
    setLayerOpacity,
    moveLayer,
    getServiceLayers,
    getFileLayers,
    getAllLayers,
    getLayerById,
    clearAllLayers,
    updateLayer,
    set3DTilesDebugOptions
  }
})
