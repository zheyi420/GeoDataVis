import { ref } from 'vue'
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
  function openDialogWmsServiceParam() {
    visStatus4DialogGeoServerWmsServiceParam.value = true
  }

  /**
   * 关闭"GeoServer WMS"服务参数对话框
   */
  function closeDialogGeoServerWmsServiceParam() {
    visStatus4DialogGeoServerWmsServiceParam.value = false
  }

  /**
   * 控制"WMTS"服务参数对话框的可见状态
   * @type {import('vue').Ref<boolean>}
   */
  const visStatus4DialogWmtsServiceParam = ref(false)

  /**
   * 切换"WMTS"服务参数对话框的可见状态
   */
  function switchVisStatus4DialogWmtsServiceParam() {
    visStatus4DialogWmtsServiceParam.value = !visStatus4DialogWmtsServiceParam.value
  }

  /**
   * 打开"WMTS"服务参数对话框
   */
  function openDialogWmtsServiceParam() {
    visStatus4DialogWmtsServiceParam.value = true
  }

  /**
   * 关闭"WMTS"服务参数对话框
   */
  function closeDialogWmtsServiceParam() {
    visStatus4DialogWmtsServiceParam.value = false
  }

  return {
    visStatus4DialogGeoServerWmsServiceParam,
    switchVisStatus4DialogGeoServerWmsServiceParam,
    openDialogWmsServiceParam,
    closeDialogGeoServerWmsServiceParam,
    visStatus4DialogWmtsServiceParam,
    switchVisStatus4DialogWmtsServiceParam,
    openDialogWmtsServiceParam,
    closeDialogWmtsServiceParam,
  }
})
