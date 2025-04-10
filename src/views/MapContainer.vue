<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import ViewerManager from '@/map/ViewerManager'

const mapContainer = ref(null)
const viewerManager = ViewerManager.getInstance()

onMounted(() => {
  window.viewer = viewerManager.createViewer(mapContainer.value, {
    // Add your viewer options here
  })
})
</script>

<style scoped>
.map-container {
  position: relative;
  width: 100vw;
  height: 100vh;
}
</style>
