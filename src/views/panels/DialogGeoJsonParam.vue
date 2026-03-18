<!--
 * @Author: zheyi420
 * @Date: 2026-03-08
 * @LastEditors: zheyi420
 * @LastEditTime: 2026-03-18
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
        <span>加载 GeoJSON 数据</span>
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

        <el-form-item label="加载方式" :label-width="formLabelWidth">
          <el-radio-group v-model="loadMode">
            <el-radio value="file">从文件加载</el-radio>
            <el-radio value="url">从 URL 加载</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          v-if="loadMode === 'file'"
          label="GeoJSON 文件"
          :label-width="formLabelWidth"
          prop="file"
        >
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

        <el-form-item
          v-if="loadMode === 'url'"
          label="GeoJSON URL"
          :label-width="formLabelWidth"
          prop="url"
        >
          <el-input
            v-model="form4GeoJsonParam.url"
            placeholder="https://example.com/data.geojson"
            clearable
          />
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

      <el-alert
        v-if="loadMode === 'url'"
        type="info"
        :closable="false"
        show-icon
        style="margin-top: 12px"
      >
        若 GeoJSON 来自跨域 URL，可能因 CORS 导致加载失败。
      </el-alert>
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
import { ref, reactive, watch } from 'vue'
import {
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElUpload,
  ElAlert,
  ElMessage,
  ElRadioGroup,
  ElRadio,
} from 'element-plus'
import { storeToRefs } from 'pinia'
import { usePanelStatusStore } from '@/stores/panelStatus'
import { useLayerStore } from '@/stores/map/layerStore'
import { parseAndValidate, parseAndValidateFromUrl, analyzeGeoJson } from '@/map/utils/GeoJsonValidator'
import { parseLayerNameFromUrl } from '@/utils/urlUtils'

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
const geoJsonAnalysis = ref(null)
const loadMode = ref('file')

const formLabelWidth = '120px'

const form4GeoJsonParam = reactive({
  name: null,
  file: null,
  url: '',
})

const placeholder4Form = {
  name: 'GeoJSON 图层名称',
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
  if (loadMode.value !== 'file') {
    return callback()
  }
  if (!value) {
    return callback(new Error('请选择 GeoJSON 文件'))
  }
  if (!geoJsonData.value) {
    return callback(new Error('GeoJSON 尚未校验通过'))
  }
  callback()
}

function checkUrl(rule, value, callback) {
  if (loadMode.value !== 'url') {
    return callback()
  }
  if (!value || !value.trim()) {
    return callback(new Error('请输入 GeoJSON URL'))
  }
  const trimmed = value.trim()
  if (!/^https?:\/\//i.test(trimmed)) {
    return callback(new Error('URL 需以 http:// 或 https:// 开头'))
  }
  callback()
}

const rules = {
  name: [{ validator: checkName, trigger: 'blur' }],
  file: [{ validator: checkFile, trigger: 'change' }],
  url: [{ validator: checkUrl, trigger: 'blur' }],
}

watch(loadMode, (newMode) => {
  if (newMode === 'file') {
    form4GeoJsonParam.url = ''
  } else {
    form4GeoJsonParam.file = null
    geoJsonData.value = null
    geoJsonAnalysis.value = null
    fileName.value = ''
  }
  ruleFormRef.value?.clearValidate(['file', 'url'])
})

watch(
  () => [form4GeoJsonParam.url, loadMode.value],
  ([url, mode]) => {
    if (mode !== 'url') return
    const parsed = parseLayerNameFromUrl(url)
    if (parsed && (!form4GeoJsonParam.name || !form4GeoJsonParam.name.trim())) {
      form4GeoJsonParam.name = parsed
    }
  },
  { immediate: false }
)

async function handleFileChange(uploadFile) {
  if (!uploadFile || !uploadFile.raw) {
    return
  }

  errorMessage.value = ''
  fileLoading.value = true

  try {
    const data = await parseAndValidate(uploadFile.raw)
    geoJsonData.value = data
    geoJsonAnalysis.value = analyzeGeoJson(data)
    fileName.value = uploadFile.name
    form4GeoJsonParam.file = uploadFile.name

    if (geoJsonAnalysis.value?.warnings?.length > 0) {
      ElMessage({
        type: 'warning',
        message: geoJsonAnalysis.value.warnings.join('\n'),
        duration: 8000,
        showClose: true,
      })
    }

    if (!form4GeoJsonParam.name) {
      form4GeoJsonParam.name = uploadFile.name.replace(/\.[^/.]+$/, '')
    }

    ruleFormRef.value?.validateField('file')
  } catch (error) {
    geoJsonData.value = null
    geoJsonAnalysis.value = null
    fileName.value = ''
    form4GeoJsonParam.file = null
    errorMessage.value = error.message || 'GeoJSON 校验失败'
    ruleFormRef.value?.validateField('file')
  } finally {
    fileLoading.value = false
  }
}

function loadGeoJson(formRef) {
  if (!formRef) {
    return
  }

  errorMessage.value = ''

  formRef.validate(async (isValid) => {
    if (!isValid) {
      return
    }

    loading.value = true
    const layerName = form4GeoJsonParam.name?.trim() || placeholder4Form.name
    const layerStore = useLayerStore()

    let analysis = geoJsonAnalysis.value
    let data = geoJsonData.value

    if (loadMode.value === 'url') {
      try {
        data = await parseAndValidateFromUrl(form4GeoJsonParam.url.trim())
        analysis = analyzeGeoJson(data)
        if (analysis?.warnings?.length > 0) {
          ElMessage({
            type: 'warning',
            message: analysis.warnings.join('\n'),
            duration: 8000,
            showClose: true,
          })
        }
      } catch (error) {
        errorMessage.value = error.message || 'GeoJSON 获取或校验失败'
        console.error('加载 GeoJSON 失败:', error)
        loading.value = false
        return
      }
    }

    layerStore
      .addGeoJsonLayer(layerName, analysis, data)
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
  geoJsonAnalysis.value = null
  form4GeoJsonParam.url = ''
  loadMode.value = 'file'
  errorMessage.value = ''
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

</style>
