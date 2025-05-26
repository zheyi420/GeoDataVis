import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const usePanelStatusStore = defineStore('panelStatus', () => {
  /**
   * 控制"GeoServer WMS"服务参数对话框的可见状态
   * @type {import('vue').Ref<boolean>}
   */
  const visStatus4DialogGeoServerWmsServiceParam = ref(false)

  /**
   * 切换"GeoServer WMS"服务参数对话框的可见状态
   */
  function switchVisStatus4DialogGeoServerWmsServiceParam() {
    visStatus4DialogGeoServerWmsServiceParam.value = !visStatus4DialogGeoServerWmsServiceParam.value
  }

  /**
   * 打开"GeoServer WMS"服务参数对话框
   */
  function openDialogGeoServerWmsServiceParam() {
    visStatus4DialogGeoServerWmsServiceParam.value = true
  }

  /**
   * 关闭"GeoServer WMS"服务参数对话框
   */
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
