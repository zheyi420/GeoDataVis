<!--
 * @Author: zheyi420
 * @Date: 2024-10-15 23:46:12
 * @LastEditors: zheyi420
 * @LastEditTime: 2024-12-15 03:44:18
 * @FilePath: \GeoDataVis\src\App.vue
 * @Description: 
 * 
-->

<template>
  <div class="app-container">
    <MapContainer />
    <ToolBarLoadPanel class="toolbar-load-panel" />
    <MapParamsPanel class="map-params-panel" />
  </div>
</template>

<script setup>
import MapContainer from '@/views/MapContainer.vue';
import MapParamsPanel from '@/views/panels/MapParamsPanel.vue'
import ToolBarLoadPanel from '@/views/panels/ToolBarLoadPanel.vue'
</script>

<style scoped lang="scss">
.app-container {
  position: relative;
  
  .toolbar-load-panel {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 10; /* 确保在 MapContainer 上面 */
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
