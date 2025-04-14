<!--
 * @Author: zheyi420
 * @Date: 2025-04-11
 * @LastEditors: zheyi420
 * @LastEditTime: 2025-04-15
 * @FilePath: \GeoDataVis\src\views\panels\MapParamsPanel.vue
 * @Description: 显示相机、鼠标等信息
 *
-->

<template>
  <div class="map-params-panel" ref="panelRef">
    <div class="camera-params-panel">
      <span class="panel-name">相机：</span>
      <span>经度 {{ cameraParams.longitude }}°</span>
      <span>纬度 {{ cameraParams.latitude }}°</span>
      <span>高度 {{ cameraParams.altitude }} 米</span>
      <span>方位角 {{ cameraParams.heading }}°</span>
      <span>俯仰角 {{ cameraParams.pitch }}°</span>
      <span>倾斜角 {{ cameraParams.roll }}°</span>
    </div>
    <div class="mouse-params-panel">
      <span class="panel-name">鼠标位置：</span>
      <span>{{ mouseParams.longitude }}°</span>
      <span>{{ mouseParams.latitude }}°</span>
      <span>{{ mouseParams.altitude }} 米</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, watch, computed } from 'vue'

const panelRef = ref(null)
const emit = defineEmits(['heightChange'])

const cameraParams = reactive({
  longitude: 0,
  latitude: 0,
  altitude: 0,
  heading: 0,
  pitch: 0,
  roll: 0
})

const mouseParams = reactive({
  longitude: 0,
  latitude: 0,
  altitude: 0
})

function updateCameraParams() {
  const viewer = window.viewer;
  if (viewer) {
    const position = viewer.camera.positionWC;
    const cartographic = window.Cesium.Cartographic.fromCartesian(position);
    cameraParams.longitude = window.Cesium.Math.toDegrees(cartographic.longitude).toFixed(5); // 保留五位小数
    cameraParams.latitude = window.Cesium.Math.toDegrees(cartographic.latitude).toFixed(5); // 保留五位小数
    cameraParams.altitude = cartographic.height.toFixed(2); // 保留两位小数

    const heading = window.Cesium.Math.toDegrees(viewer.camera.heading).toFixed(2); // 保留两位小数
    cameraParams.heading = heading == 360 ? 0 : heading;

    cameraParams.pitch = window.Cesium.Math.toDegrees(viewer.camera.pitch).toFixed(2); // 保留两位小数

    const roll = window.Cesium.Math.toDegrees(viewer.camera.roll).toFixed(2); // 保留两位小数
    cameraParams.roll = roll == 360 ? 0 : roll;
  }
}

function updateMouseParams(movement) {
  const ellipsoid = window.viewer.scene.globe.ellipsoid;
  const cartesian = window.viewer.scene.camera.pickEllipsoid(movement.endPosition, ellipsoid);
  if (cartesian) {
    const cartographic = window.Cesium.Cartographic.fromCartesian(cartesian);
    mouseParams.longitude = window.Cesium.Math.toDegrees(cartographic.longitude).toFixed(5); // 保留五位小数
    mouseParams.latitude = window.Cesium.Math.toDegrees(cartographic.latitude).toFixed(5); // 保留五位小数
    mouseParams.altitude = cartographic.height.toFixed(2); // 保留两位小数
  }
}

onMounted(() => {
  const viewer = window.viewer;
  if (viewer) {
    console.log('viewer is defined');

    // 发送面板高度
    if (panelRef.value) {
      emit('heightChange', panelRef.value.offsetHeight)
    }

    const removeCallBack4UpdateCameraParams = viewer.camera.changed.addEventListener(updateCameraParams);
    updateCameraParams(); // 初始化时调用一次

    const handler = new window.Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(updateMouseParams, window.Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }
})
</script>

<style scoped lang="scss">
.map-params-panel {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  gap: 20px;
  padding: 0px 10px;
  box-sizing: border-box; /* 包含内边距在内 */
  background-color: rgba(0, 0, 0, 0.8);

  span {
    color: rgb(255, 255, 255);
    font-size: 12px;
    font-family: Avenir, Helvetica, Arial, sans-serif;
  }

  .camera-params-panel {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    gap: 8px;

    .panel-name {
      font-weight: bold;
    }
  }

  .mouse-params-panel {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    gap: 3px;
    width: 285px;
    align-items: baseline;

    .panel-name {
      font-weight: bold;
    }

    span {
      width: 30%;
    }
  }
}


</style>
