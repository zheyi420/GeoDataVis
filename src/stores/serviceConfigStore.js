import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useLayerStore } from '@/stores/map/layerStore'
import { useTerrainStore } from '@/stores/map/terrainStore'
import { createCesiumTerrainProvider } from '@/map/utils/ImageryLayerUtils'

const STORAGE_KEY = 'geodatavis_service_configs'
const STORAGE_VERSION = 1

/** 恢复顺序：0=地形 1=影像/数据 2=3D模型。新增类型需在此登记，未登记默认 1（影像层） */
const RESTORE_ORDER = {
  CesiumTerrain: 0,
  WMS: 1,
  WMTS: 1,
  Cesium3DTiles: 2,
  // 未来扩展：XYZ: 1, GeoJSON: 1, KML: 1, CZML: 1 等
}

function isClient() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

/**
 * 帧让出工具函数
 */
function yieldToFrame() {
  return new Promise((r) => requestAnimationFrame(r))
}

function normalizeConfig(raw) {
  if (!raw || typeof raw !== 'object') return null
  const { configId, type, layerName, options, visible, opacity } = raw
  if (!configId || !type || !layerName || !options) return null
  return {
    configId,
    type,
    layerName,
    options,
    visible: visible !== undefined ? visible : true,
    opacity: opacity !== undefined ? opacity : 1,
  }
}

export const useServiceConfigStore = defineStore('serviceConfig', () => {
  const serviceConfigs = ref([])
  const activeTerrainConfigId = ref(null)
  const isRestoring = ref(false)

  const layerIdToConfigId = new Map()
  const terrainConfigIdToTerrainId = new Map()
  const terrainIdToConfigId = new Map()

  function loadFromStorage() {
    if (!isClient()) return
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return
    try {
      const data = JSON.parse(saved)
      if (data?.version !== STORAGE_VERSION) return
      if (Array.isArray(data.serviceConfigs)) {
        serviceConfigs.value = data.serviceConfigs
          .map(normalizeConfig)
          .filter(Boolean)
      }
      activeTerrainConfigId.value = data.activeTerrainConfigId || null
    } catch (error) {
      console.warn('解析本地服务配置失败:', error)
    }
  }

  function persistToStorage() {
    if (!isClient()) return
    const payload = {
      version: STORAGE_VERSION,
      serviceConfigs: serviceConfigs.value,
      activeTerrainConfigId: activeTerrainConfigId.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }

  loadFromStorage()

  watch([serviceConfigs, activeTerrainConfigId], persistToStorage, { deep: true })

  function addServiceConfig(type, layerName, options, layerId) {
    const configId = `cfg_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
    const config = {
      configId,
      type,
      layerName,
      options,
      visible: true,
      opacity: 1,
    }
    serviceConfigs.value.push(config)
    if (layerId) {
      layerIdToConfigId.set(layerId, configId)
      if (type === 'CesiumTerrain') {
        terrainIdToConfigId.set(layerId, configId)
      }
    }
    return configId
  }

  function removeServiceConfig(configId) {
    const index = serviceConfigs.value.findIndex((item) => item.configId === configId)
    if (index === -1) return false
    serviceConfigs.value.splice(index, 1)
    if (activeTerrainConfigId.value === configId) {
      activeTerrainConfigId.value = null
    }
    const terrainId = terrainConfigIdToTerrainId.get(configId)
    if (terrainId) {
      terrainConfigIdToTerrainId.delete(configId)
      terrainIdToConfigId.delete(terrainId)
    }
    return true
  }

  function updateServiceConfig(configId, patch) {
    const config = serviceConfigs.value.find((item) => item.configId === configId)
    if (!config) return false
    Object.assign(config, patch)
    return true
  }

  function reorderServiceConfig(fromIndex, toIndex) {
    if (fromIndex === toIndex) return true
    if (fromIndex < 0 || toIndex < 0) return false
    if (fromIndex >= serviceConfigs.value.length || toIndex >= serviceConfigs.value.length) return false
    const [moved] = serviceConfigs.value.splice(fromIndex, 1)
    serviceConfigs.value.splice(toIndex, 0, moved)
    return true
  }

  function setActiveTerrainConfigId(configId) {
    activeTerrainConfigId.value = configId
  }

  function getConfigIdByLayerId(layerId) {
    return layerIdToConfigId.get(layerId) || null
  }

  function getConfigIdByTerrainId(terrainId) {
    return terrainIdToConfigId.get(terrainId) || null
  }

  async function restoreAll() {
    if (isRestoring.value) return
    isRestoring.value = true
    layerIdToConfigId.clear()
    terrainConfigIdToTerrainId.clear()
    terrainIdToConfigId.clear()

    const layerStore = useLayerStore()
    const terrainStore = useTerrainStore()

    // 按业务依赖排序：Terrain → 影像/数据 → 3D模型，减轻首帧负担。未知类型默认 1（影像层）
    const sortedConfigs = [...serviceConfigs.value].sort(
      (a, b) => (RESTORE_ORDER[a.type] ?? 1) - (RESTORE_ORDER[b.type] ?? 1)
    )

    for (const config of sortedConfigs) {
      try {
        if (config.type === 'WMS') {
          const initialState = { visible: config.visible, opacity: config.opacity }
          const layerId = await layerStore.addWmsLayer(config.layerName, config.options, initialState)
          layerIdToConfigId.set(layerId, config.configId)
          if (config.visible === false) {
            layerStore.setLayerVisibility(layerId, false)
          }
          if (config.opacity !== undefined && config.opacity !== 1) {
            layerStore.setLayerOpacity(layerId, config.opacity)
          }
          await yieldToFrame()
          continue
        }

        if (config.type === 'WMTS') {
          const initialState = { visible: config.visible, opacity: config.opacity }
          const layerId = await layerStore.addWmtsLayer(config.layerName, config.options, initialState)
          layerIdToConfigId.set(layerId, config.configId)
          if (config.visible === false) {
            layerStore.setLayerVisibility(layerId, false)
          }
          if (config.opacity !== undefined && config.opacity !== 1) {
            layerStore.setLayerOpacity(layerId, config.opacity)
          }
          await yieldToFrame()
          continue
        }

        if (config.type === 'Cesium3DTiles') {
          const initialState = { visible: config.visible, skipZoom: true }
          const layerId = await layerStore.add3DTilesLayer(config.layerName, config.options, initialState)
          layerIdToConfigId.set(layerId, config.configId)
          if (config.visible === false) {
            layerStore.setLayerVisibility(layerId, false)
          }
          // 3DTiles 不恢复透明度，保持默认（opacity=1）
          await yieldToFrame()
          continue
        }

        if (config.type === 'CesiumTerrain') {
          const provider = await createCesiumTerrainProvider(config.options)
          const terrainId = terrainStore.addTerrain(config.layerName, provider, config.options)
          terrainConfigIdToTerrainId.set(config.configId, terrainId)
          terrainIdToConfigId.set(terrainId, config.configId)
          await yieldToFrame()
        }
      } catch (error) {
        console.error('恢复服务配置失败:', config, error)
      }
    }

    if (activeTerrainConfigId.value) {
      const terrainId = terrainConfigIdToTerrainId.get(activeTerrainConfigId.value)
      if (terrainId) {
        terrainStore.setActiveTerrain(terrainId)
      }
    }

    isRestoring.value = false
  }

  return {
    serviceConfigs,
    activeTerrainConfigId,
    addServiceConfig,
    removeServiceConfig,
    updateServiceConfig,
    reorderServiceConfig,
    setActiveTerrainConfigId,
    getConfigIdByLayerId,
    getConfigIdByTerrainId,
    restoreAll,
  }
})
