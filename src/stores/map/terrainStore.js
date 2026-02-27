import { ref, markRaw } from 'vue'
import { defineStore } from 'pinia'

/**
 * @typedef {import('@/map/LayerManager').default} LayerManager
 */

export const useTerrainStore = defineStore('terrain', () => {
  /** @type {import('vue').Ref<Array<{id: string, name: string, providerInstance: import("cesium").TerrainProvider, metadata: Object}>>} */
  const terrainList = ref([])

  /** @type {import('vue').Ref<'none'|string>} */
  const activeTerrainId = ref('none')

  /**
   * 获取 LayerManager 实例
   * @returns {LayerManager|null}
   */
  function getLayerManager() {
    return window.layerManager || null
  }

  /**
   * 添加地形并设为激活
   * @param {string} name - 地形名称
   * @param {import("cesium").TerrainProvider} providerInstance - Cesium 地形提供者实例
   * @param {Object} metadata - 元数据（如 url、requestVertexNormals 等）
   * @returns {string} 地形 ID
   */
  function addTerrain(name, providerInstance, metadata = {}) {
    const layerManager = getLayerManager()
    if (!layerManager) {
      throw new Error('LayerManager 未初始化')
    }

    const id = `terrain_${Date.now()}`
    const terrain = {
      id,
      name: name || '未命名地形',
      providerInstance: markRaw(providerInstance),
      metadata,
    }

    terrainList.value.push(terrain)
    activeTerrainId.value = id
    layerManager.setTerrainProvider(providerInstance)

    return id
  }

  /**
   * 移除地形
   * @param {string} id - 地形 ID
   * @returns {boolean} 是否成功移除
   */
  function removeTerrain(id) {
    const layerManager = getLayerManager()
    const index = terrainList.value.findIndex((t) => t.id === id)
    if (index === -1) {
      return false
    }

    const wasActive = activeTerrainId.value === id
    terrainList.value.splice(index, 1)

    if (wasActive) {
      activeTerrainId.value = 'none'
      if (layerManager) {
        const defaultProvider = layerManager.getDefaultTerrainProvider()
        layerManager.setTerrainProvider(defaultProvider)
      }
    }

    return true
  }

  /**
   * 切换激活地形
   * @param {string} id - 地形 ID，'none' 表示恢复默认椭球
   * @returns {boolean} 是否成功切换
   */
  function setActiveTerrain(id) {
    const layerManager = getLayerManager()
    if (!layerManager) {
      return false
    }

    if (id === 'none') {
      activeTerrainId.value = 'none'
      const defaultProvider = layerManager.getDefaultTerrainProvider()
      layerManager.setTerrainProvider(defaultProvider)
      return true
    }

    const terrain = terrainList.value.find((t) => t.id === id)
    if (!terrain) {
      return false
    }

    activeTerrainId.value = id
    layerManager.setTerrainProvider(terrain.providerInstance)
    return true
  }

  /**
   * 获取当前激活的地形
   * @returns {Object|null}
   */
  function getActiveTerrain() {
    if (activeTerrainId.value === 'none') {
      return null
    }
    return terrainList.value.find((t) => t.id === activeTerrainId.value) || null
  }

  return {
    terrainList,
    activeTerrainId,
    addTerrain,
    removeTerrain,
    setActiveTerrain,
    getActiveTerrain,
    getLayerManager,
  }
})
