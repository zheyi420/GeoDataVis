<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup>
import { onMounted, ref, inject } from 'vue'
import ViewerManager from '@/map/ViewerManager'
import LayerManager from '@/map/LayerManager'

const mapContainer = ref(null)
const viewerManager = new ViewerManager()
const isViewerReady = inject('isViewerReady')

onMounted(async () => {
  window.viewer = await viewerManager.createViewer(mapContainer.value, {
    // Add your viewer options here
  })
  window.layerManager = new LayerManager(window.viewer)
  isViewerReady.value = true
})
</script>

<style scoped>
.map-container {
  position: relative;
  width: 100vw;
  height: 100vh;
}
</style>
