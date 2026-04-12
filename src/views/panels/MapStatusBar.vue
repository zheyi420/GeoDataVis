<template>
  <div class="map-status-bar" ref="panelRef">
    <div v-if="showBeianInfo" class="left-section">
      <BeianInfo />
    </div>
    <div class="right-section">
      <MapParamsPanel />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import BeianInfo from '@/views/panels/BeianInfo.vue'
import MapParamsPanel from '@/views/panels/MapParamsPanel.vue'

const showBeianInfo = import.meta.env.MODE === 'production-tencent-cos' || import.meta.env.DEV

const panelRef = ref(null)
const emit = defineEmits(['heightChange'])

onMounted(() => {
  if (panelRef.value) {
    emit('heightChange', panelRef.value.offsetHeight)
  }
})
</script>

<style scoped lang="scss">
.map-status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  width: 100%;
  padding: 0 10px;
  box-sizing: border-box;
  background-color: rgba(0, 0, 0, 0.8);

  .left-section {
    min-width: 0;
  }

  .right-section {
    margin-left: auto;
    min-width: 0;
    flex-shrink: 0;
  }
}
</style>