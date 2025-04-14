import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useLayersStore = defineStore('layers', () => {
  // 所有图层的数据集合（包括地图服务图层和数据文件图层）
  const layers = ref([]);

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

  // 移除指定ID的图层
  function removeLayer(layerId) {
    const index = layers.value.findIndex(layer => layer.id === layerId);
    if (index !== -1) {
      // 如果有图层管理器实例，尝试从地图中移除
      const layer = layers.value[index];
      if (layer.layerInstance && window.layerManager) {
        // 根据图层类型调用不同的移除方法
        window.layerManager.removeLayer(layerId);
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
      layer.visible = visible;
      // 更新实际图层的可见性
      if (layer.layerInstance && window.layerManager) {
        window.layerManager.setLayerVisibility(layerId, visible);
      }
      return true;
    }
    return false;
  }

  // 设置图层透明度
  function setLayerOpacity(layerId, opacity) {
    const layer = layers.value.find(layer => layer.id === layerId);
    if (layer) {
      layer.opacity = opacity;
      // 更新实际图层的透明度
      if (layer.layerInstance && window.layerManager) {
        // 假设LayerManager中有setLayerOpacity方法
        if (typeof window.layerManager.setLayerOpacity === 'function') {
          window.layerManager.setLayerOpacity(layerId, opacity);
        }
      }
      return true;
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
    // 如果有图层管理器实例，尝试从地图中移除所有图层
    if (window.layerManager) {
      window.layerManager.removeAllLayers();
    }
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
