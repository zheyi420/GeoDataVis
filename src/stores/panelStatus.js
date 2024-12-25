import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const usePanelStatusStore = defineStore('panelStatus', () => {
  const visStatus4DialogGeoServerWmsServiceParam = ref(false)
  function switchVisStatus4DialogGeoServerWmsServiceParam() {
    visStatus4DialogGeoServerWmsServiceParam.value = !visStatus4DialogGeoServerWmsServiceParam.value
  }
  function openDialogGeoServerWmsServiceParam() {
    visStatus4DialogGeoServerWmsServiceParam.value = true
  }
  function closeDialogGeoServerWmsServiceParam() {
    visStatus4DialogGeoServerWmsServiceParam.value = false
  }

  return {
    visStatus4DialogGeoServerWmsServiceParam,
    switchVisStatus4DialogGeoServerWmsServiceParam,
    openDialogGeoServerWmsServiceParam,
    closeDialogGeoServerWmsServiceParam,
  }
})
