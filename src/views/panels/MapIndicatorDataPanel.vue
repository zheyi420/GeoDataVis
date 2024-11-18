
<template>
  <div class="map-indicator-data-panel">
    <div class="camera-indicator-data-panel">
      <span>相机位置</span>
      <span>经度 {{ longitude }}</span>
      <span>纬度 {{ latitude }}</span>
      <span>高度 {{ altitude }}</span>
      <span>方位角 {{ heading }}</span>
      <span>俯仰角 {{ pitch }}</span>
      <span>倾斜角 {{ roll }}</span>
    </div>
    <div class="mouse-indicator-data-panel">
      <span>鼠标位置</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'

const cameraIndicatorData = reactive({
  longitude: 0,
  latitude: 0,
  altitude: 0,
  heading: 0,
  pitch: 0,
  roll: 0
})



onMounted(() => {
  // 这里添加获取相机数据的逻辑
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