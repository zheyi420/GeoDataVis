<template>
  <div class="map-indicator-data-panel">
    <div class="camera-indicator-data-panel">
      <span>相机：</span>
      <span>经度 {{ cameraIndicatorData.longitude }}°</span>
      <span>纬度 {{ cameraIndicatorData.latitude }}°</span>
      <span>高度 {{ cameraIndicatorData.altitude }} 米</span>
      <span>方位角 {{ cameraIndicatorData.heading }}°</span>
      <span>俯仰角 {{ cameraIndicatorData.pitch }}°</span>
      <span>倾斜角 {{ cameraIndicatorData.roll }}°</span>
    </div>
    <div class="mouse-indicator-data-panel">
      <span>鼠标位置</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, watch, computed } from 'vue'

const cameraIndicatorData = reactive({
  longitude: 0,
  latitude: 0,
  altitude: 0,
  heading: 0,
  pitch: 0,
  roll: 0
})

function updateCameraIndicatorData() {
  const viewer = window.viewer;
  if (viewer) {
    const position = viewer.camera.positionWC;
    const cartographic = window.Cesium.Cartographic.fromCartesian(position);
    cameraIndicatorData.longitude = window.Cesium.Math.toDegrees(cartographic.longitude).toFixed(5); // 保留五位小数
    cameraIndicatorData.latitude = window.Cesium.Math.toDegrees(cartographic.latitude).toFixed(5); // 保留五位小数
    cameraIndicatorData.altitude = cartographic.height.toFixed(2); // 保留两位小数
    cameraIndicatorData.heading = window.Cesium.Math.toDegrees(viewer.camera.heading).toFixed(2); // 保留两位小数
    cameraIndicatorData.pitch = window.Cesium.Math.toDegrees(viewer.camera.pitch).toFixed(2); // 保留两位小数
    cameraIndicatorData.roll = window.Cesium.Math.toDegrees(viewer.camera.roll).toFixed(2); // 保留两位小数
  }
}

onMounted(() => {
  const viewer = window.viewer;
  if (viewer) {
    console.log('viewer is defined');
    
    viewer.camera.percentageChanged = 0.001; // 设置更高的灵敏度
    viewer.camera.changed.addEventListener(updateCameraIndicatorData);
    updateCameraIndicatorData(); // 初始化时调用一次
  }
})
</script>

<style scoped>
.map-indicator-data-panel {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  gap: 10px;
  padding: 0px 10px;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  box-sizing: border-box; /* 包含内边距在内 */
  z-index: 10;
  background-color: rgba(0, 0, 0, 0.8);
  
  span {
    color: rgb(255, 255, 255);
    font-size: 12px;
    font-family: Avenir, Helvetica, Arial, sans-serif;
  }
}

.camera-indicator-data-panel {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  gap: 8px;
}

.mouse-indicator-data-panel {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  gap: 8px;
}
</style>