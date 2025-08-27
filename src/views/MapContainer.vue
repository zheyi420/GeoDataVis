<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import ViewerManager from '@/map/ViewerManager'
import LayerManager from '@/map/LayerManager'

const mapContainer = ref(null)
const viewerManager = new ViewerManager()

onMounted(() => {
  window.viewer = viewerManager.createViewer(mapContainer.value, {
    // Add your viewer options here
  })
  window.layerManager = new LayerManager(window.viewer)
})
</script>

<style scoped>
.map-container {
  position: relative;
  width: 100vw;
  height: 100vh;
}
</style>
