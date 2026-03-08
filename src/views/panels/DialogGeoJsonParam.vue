<!--
 * @Author: zheyi420
 * @Date: 2026-03-08
 * @LastEditors: zheyi420
 * @LastEditTime: 2026-03-08
 * @FilePath: \GeoDataVis\src\views\panels\DialogGeoJsonParam.vue
 * @Description: GeoJSON 文件加载对话框
 *
-->

<template>
  <el-dialog
    v-model="visStatus4DialogGeoJsonParam"
    width="520"
    destroy-on-close
    :align-center="false"
    :close-on-click-modal="false"
    :before-close="handleClose"
    :top="`0vh`"
  >
    <template v-slot:header>
      <div class="dialog-title">
        <span>加载 GeoJSON 文件</span>
      </div>
    </template>

    <template v-slot:default>
      <el-form
        ref="ruleFormRef"
        class="form-content"
        :model="form4GeoJsonParam"
        :rules="rules"
      >
        <el-form-item label="图层名称" :label-width="formLabelWidth" prop="name">
          <el-input
            v-model="form4GeoJsonParam.name"
            autocomplete="off"
            :placeholder="placeholder4Form.name"
          />
        </el-form-item>

        <el-form-item label="GeoJSON 文件" :label-width="formLabelWidth" prop="file">
          <div class="file-uploader">
            <el-upload
              ref="uploadRef"
              accept=".geojson,.json"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleFileChange"
            >
              <el-button :loading="fileLoading">选择文件</el-button>
            </el-upload>
            <span class="file-name">{{ fileName || '未选择文件' }}</span>
          </div>
        </el-form-item>

        <el-form-item label="贴地形" :label-width="formLabelWidth">
          <div class="clamp-row">
            <el-switch v-model="form4GeoJsonParam.clampToGround" />
            <span class="clamp-tip">
              开启后高程数据将被忽略，图形贴合地形表面；关闭后保留坐标高程（WGS84 椭球高）。
            </span>
          </div>
        </el-form-item>
      </el-form>

      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        :closable="true"
        @close="errorMessage = ''"
        style="margin-top: 12px"
      />
    </template>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="cancel">取消</el-button>
        <el-button type="primary" :loading="loading" :disabled="fileLoading" @click="loadGeoJson(ruleFormRef)">
          确认加载
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import {
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElUpload,
  ElSwitch,
  ElAlert,
  ElMessage,
} from 'element-plus'
import { storeToRefs } from 'pinia'
import { usePanelStatusStore } from '@/stores/panelStatus'
import { useLayerStore } from '@/stores/map/layerStore'
import { parseAndValidate } from '@/map/utils/GeoJsonValidator'

const panelStatusStore = usePanelStatusStore()
const { visStatus4DialogGeoJsonParam } = storeToRefs(panelStatusStore)
const { closeDialogGeoJsonParam } = panelStatusStore

const ruleFormRef = ref(null)
const uploadRef = ref(null)
const loading = ref(false)
const fileLoading = ref(false)
const errorMessage = ref('')
const fileName = ref('')
const geoJsonData = ref(null)

const formLabelWidth = '120px'

const form4GeoJsonParam = reactive({
  name: null,
  file: null,
  clampToGround: false,
})

const placeholder4Form = {
  name: '例如：本地 GeoJSON 图层',
}

function checkName(rule, value, callback) {
  if (!value) {
    return callback(new Error('请输入图层名称'))
  }
  if (!value.trim()) {
    return callback(new Error('图层名称不能为空格'))
  }
  callback()
}

function checkFile(rule, value, callback) {
  if (!value) {
    return callback(new Error('请选择 GeoJSON 文件'))
  }
  if (!geoJsonData.value) {
    return callback(new Error('GeoJSON 尚未校验通过'))
  }
  callback()
}

const rules = {
  name: [{ validator: checkName, trigger: 'blur' }],
  file: [{ validator: checkFile, trigger: 'change' }],
}

async function handleFileChange(uploadFile) {
  if (!uploadFile || !uploadFile.raw) {
    return
  }

  errorMessage.value = ''
  fileLoading.value = true

  try {
    const data = await parseAndValidate(uploadFile.raw)
    geoJsonData.value = data
    fileName.value = uploadFile.name
    form4GeoJsonParam.file = uploadFile.name

    if (!form4GeoJsonParam.name) {
      form4GeoJsonParam.name = uploadFile.name.replace(/\.[^/.]+$/, '')
    }

    ruleFormRef.value?.validateField('file')
  } catch (error) {
    geoJsonData.value = null
    fileName.value = ''
    form4GeoJsonParam.file = null
    errorMessage.value = error.message || 'GeoJSON 校验失败'
    ruleFormRef.value?.validateField('file')
  } finally {
    fileLoading.value = false
  }
}

function loadGeoJson(ruleFormRef) {
  if (!ruleFormRef) {
    return
  }

  errorMessage.value = ''

  ruleFormRef.validate((isValid) => {
    if (!isValid) {
      return
    }

    loading.value = true
    const layerName = form4GeoJsonParam.name?.trim() || placeholder4Form.name
    const loadOptions = {
      clampToGround: form4GeoJsonParam.clampToGround,
    }

    const layerStore = useLayerStore()
    layerStore
      .addGeoJsonLayer(layerName, geoJsonData.value, loadOptions)
      .then(layerId => {
        ElMessage({
          type: 'success',
          message: `图层："${layerName}" 加载成功`,
        })
        resetForm()
        closeDialogGeoJsonParam()
        console.log('GeoJSON 图层加载成功，图层 ID:', layerId)
      })
      .catch(error => {
        errorMessage.value = error.message || 'GeoJSON 加载失败'
        console.error('加载 GeoJSON 失败:', error)
      })
      .finally(() => {
        loading.value = false
      })
  })
}

function resetForm() {
  if (ruleFormRef.value) {
    ruleFormRef.value.resetFields()
  }
  uploadRef.value?.clearFiles()
  fileName.value = ''
  geoJsonData.value = null
  errorMessage.value = ''
  form4GeoJsonParam.clampToGround = false
}

function cancel() {
  resetForm()
  closeDialogGeoJsonParam()
}

function handleClose(done) {
  resetForm()
  done()
}
</script>

<style scoped lang="scss">
.form-content {
  padding-right: 20px;
}

.file-uploader {
  display: flex;
  align-items: center;
  gap: 10px;

  .file-name {
    font-size: 12px;
    color: #909399;
  }
}

.clamp-row {
  display: flex;
  align-items: center;
  gap: 10px;
  line-height: 1.4;

  .clamp-tip {
    font-size: 12px;
    color: #909399;
  }
}
</style>
