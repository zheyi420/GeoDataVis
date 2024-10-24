<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import ViewerManager from '@/map/ViewerManager';

const mapContainer = ref(null);
const viewerManager = new ViewerManager();

onMounted(() => {
  window.viewer = viewerManager.createViewer(mapContainer.value, {
    // TODO Add your viewer options here
  });
});
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
}
</style>
