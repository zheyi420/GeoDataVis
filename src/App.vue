<!--
 * @Author: zheyi420
 * @Date: 2024-12-26
 * @LastEditors: zheyi420
 * @LastEditTime: 2025-04-15
 * @FilePath: \GeoDataVis\src\App.vue
 * @Description:
 *
-->

<template>
  <div class="app-container">
    <MapContainer class="map-container" />
    <ToolBarLoadPanel class="toolbar-load-panel" />
    <LayerManagerPanel class="layer-manager-panel" :style="layerManagerStyle" />
    <MapParamsPanel class="map-params-panel" @height-change="handleHeightChange" />
    <!-- TODO 是否需要改为异步组件，调用时再加载 -->
    <DialogGeoServerWmsServiceParam />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import MapContainer from '@/views/MapContainer.vue';
import MapParamsPanel from '@/views/panels/MapParamsPanel.vue'
import ToolBarLoadPanel from '@/views/panels/ToolBarLoadPanel.vue'
import LayerManagerPanel from '@/views/panels/LayerManagerPanel.vue'
import DialogGeoServerWmsServiceParam from '@/views/panels/DialogGeoServerWmsServiceParam.vue'

const paramsPanelHeight = ref(0) // 默认高度

const handleHeightChange = (height) => {
  paramsPanelHeight.value = height
}

const layerManagerStyle = computed(() => ({
  // height: `calc(100vh - 40px - ${paramsPanelHeight.value}px)`,
  bottom: `${paramsPanelHeight.value}px`
}))
</script>

<style scoped lang="scss">
.app-container {
  position: relative;

  .map-container {
    z-index: 0;
  }

  .toolbar-load-panel {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 10; /* 确保在 MapContainer 上面 */
  }

  .layer-manager-panel {
    position: absolute;
    max-height: 70%;
    left: 0;
    z-index: 10;
  }

  .map-params-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    z-index: 10;
  }
}

</style>
