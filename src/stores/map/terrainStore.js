import { ref, markRaw, computed } from 'vue'
import { defineStore } from 'pinia'
import { useLayerStore } from '@/stores/map/layerStore'
import { createArcGISTerrainProvider } from '@/map/utils/ImageryLayerUtils'

/**
 * @typedef {import('@/map/LayerManager').default} LayerManager
 */

/** 内置地形定义（不可删除、不持久化） */
const BUILTIN_TERRAIN_DEFINITIONS = [
  {
    id: 'builtin_arcgis_WorldElevation3D_Terrain3D',
    name: 'ArcGIS 全球高程',
    url: 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer',
    type: 'ArcGISTiledElevation',
  },
]

/** 内置地形 provider 缓存（懒加载后复用） */
const builtinProviderCache = new Map()

export const useTerrainStore = defineStore('terrain', () => {
  /** @type {import('vue').Ref<Array<{id: string, name: string, providerInstance: import("cesium").TerrainProvider, metadata: Object}>>} */
  const terrainList = ref([])

  /** @type {import('vue').Ref<'none'|string>} */
  const activeTerrainId = ref('none')

  /** 展示用地形列表（内置 + 用户自添加的） */
  const displayTerrainList = computed(() => [...BUILTIN_TERRAIN_DEFINITIONS, ...terrainList.value])

  /**
   * 判断是否为内置地形（不可删除）
   * @param {string} id - 地形 ID
   */
  function isBuiltIn(id) {
    return BUILTIN_TERRAIN_DEFINITIONS.some((t) => t.id === id)
  }

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
    useLayerStore().updateAllGeoJsonClampToGround(true)

    return id
  }

  /**
   * 移除地形
   * @param {string} id - 地形 ID
   * @returns {boolean} 是否成功移除
   */
  function removeTerrain(id) {
    if (isBuiltIn(id)) {
      return false
    }
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
        useLayerStore().updateAllGeoJsonClampToGround(false)
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
      useLayerStore().updateAllGeoJsonClampToGround(false)
      return true
    }

    const builtin = BUILTIN_TERRAIN_DEFINITIONS.find((t) => t.id === id)
    if (builtin) {
      activeTerrainId.value = id
      const loadAndApply = async () => {
        let promise = builtinProviderCache.get(id)
        if (!promise) {
          promise = createArcGISTerrainProvider({ url: builtin.url })
          builtinProviderCache.set(id, promise)
        }
        const provider = await promise
        if (activeTerrainId.value === id && layerManager) {
          layerManager.setTerrainProvider(provider)
          useLayerStore().updateAllGeoJsonClampToGround(true)
        }
      }
      loadAndApply().catch((err) => {
        console.error('加载 ArcGIS 地形失败:', err)
        builtinProviderCache.delete(id)
        activeTerrainId.value = 'none'
        if (layerManager) {
          layerManager.setTerrainProvider(layerManager.getDefaultTerrainProvider())
          useLayerStore().updateAllGeoJsonClampToGround(false)
        }
      })
      return true
    }

    const terrain = terrainList.value.find((t) => t.id === id)
    if (!terrain) {
      return false
    }

    activeTerrainId.value = id
    layerManager.setTerrainProvider(terrain.providerInstance)
    useLayerStore().updateAllGeoJsonClampToGround(true)
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
    displayTerrainList,
    isBuiltIn,
    addTerrain,
    removeTerrain,
    setActiveTerrain,
    getActiveTerrain,
    getLayerManager,
  }
})
