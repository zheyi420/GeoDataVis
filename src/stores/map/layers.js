import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useLayersStore = defineStore('layers', () => {
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
  function addLayer(layer) {
    // 确保layer有必要的属性
    const newLayer = {
      id: layer.id || `layer_${Date.now()}`,
      name: layer.name || '未命名图层',
      type: layer.type || 'unknown', // 'service' 或 'data'
      visible: layer.visible !== undefined ? layer.visible : true,
      opacity: layer.opacity !== undefined ? layer.opacity : 1,
      sourceType: layer.sourceType || '', // 例如：'WMS', 'GeoJSON'等
      layerInstance: layer.layerInstance || null, // 实际图层对象的引用
      metadata: layer.metadata || {} // 其他元数据
    };

    // 如果是同名图层，可以添加序号
    const similarLayers = layers.value.filter(l => l.name.startsWith(newLayer.name));
    if (similarLayers.length > 0) {
      newLayer.name = `${newLayer.name} (${similarLayers.length})`;
    }

    layers.value.push(newLayer);
    return newLayer.id;
  }

  /**
   * 添加WMS图层（包含完整的创建和管理流程）
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
          const layerId = addLayer({
            id: layerName,
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

  // 移除指定ID的图层
  function removeLayer(layerId) {
    const index = layers.value.findIndex(layer => layer.id === layerId);
    if (index !== -1) {
      const layer = layers.value[index];

      // 通过 LayerManager 从 Cesium 中移除图层
      const layerManager = getLayerManager();
      if (layerManager && layer.layerInstance) {
        layerManager.removeLayerFromCesium(layer.layerInstance);
      }

      // 从store中移除
      layers.value.splice(index, 1);
      return true;
    }
    return false;
  }

  // 设置图层可见性
  function setLayerVisibility(layerId, visible) {
    const layer = layers.value.find(layer => layer.id === layerId);
    if (layer) {
      // 通过 LayerManager 更新 Cesium 图层状态
      const layerManager = getLayerManager();
      if (layerManager && layer.layerInstance) {
        const success = layerManager.setLayerVisibility(layer.layerInstance, visible);
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
    return layers.value.filter(layer => layer.type === 'service');
  }

  // 获取数据文件类型图层
  function getDataLayers() {
    return layers.value.filter(layer => layer.type === 'data');
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
        layerManager.removeLayerFromCesium(layer.layerInstance);
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

  return {
    layers,
    addLayer,
    addWmsLayer,
    removeLayer,
    setLayerVisibility,
    setLayerOpacity,
    moveLayer,
    getServiceLayers,
    getDataLayers,
    getAllLayers,
    getLayerById,
    clearAllLayers,
    updateLayer
  }
})
