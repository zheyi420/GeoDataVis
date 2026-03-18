<!--
 * @Author: zheyi420
 * @Date: 2026-03-16
 * @LastEditors: zheyi420
 * @LastEditTime: 2026-03-18
 * @FilePath: \GeoDataVis\src\views\panels\DialogKmlParam.vue
 * @Description: KML/KMZ 文件加载对话框
 *
-->

<template>
  <el-dialog
    v-model="visStatus4DialogKmlParam"
    width="520"
    destroy-on-close
    :align-center="false"
    :close-on-click-modal="false"
    :before-close="handleClose"
    :top="`0vh`"
  >
    <template v-slot:header>
      <div class="dialog-title">
        <span>加载 KML/KMZ 数据</span>
      </div>
    </template>

    <template v-slot:default>
      <el-form
        ref="ruleFormRef"
        class="form-content"
        :model="form4KmlParam"
        :rules="rules"
      >
        <el-form-item label="图层名称" :label-width="formLabelWidth" prop="name">
          <el-input
            v-model="form4KmlParam.name"
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
          label="KML/KMZ 文件"
          :label-width="formLabelWidth"
          prop="file"
        >
          <div class="file-uploader">
            <el-upload
              ref="uploadRef"
              accept=".kml,.kmz"
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
          label="KML/KMZ URL"
          :label-width="formLabelWidth"
          prop="url"
        >
          <el-input
            v-model="form4KmlParam.url"
            placeholder="https://example.com/data.kml"
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
        v-if="loadMode === 'file'"
        type="info"
        :closable="false"
        show-icon
        class="kml-tip-alert"
        style="margin-top: 12px"
      >
        <div class="kml-tip-list">
          <div class="kml-tip-item">若 KML 文件内含相对路径图标，请使用 KMZ 打包后加载。</div>
          <div class="kml-tip-item">若 KML 文件内引用外部图片 URL，可能因 CORS 导致贴图无法显示。</div>
        </div>
      </el-alert>
    </template>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="cancel">取消</el-button>
        <el-button type="primary" :loading="loading" :disabled="fileLoading" @click="loadKml(ruleFormRef)">
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
import { parseLayerNameFromUrl } from '@/utils/urlUtils'

const panelStatusStore = usePanelStatusStore()
const { visStatus4DialogKmlParam } = storeToRefs(panelStatusStore)
const { closeDialogKmlParam } = panelStatusStore

const ruleFormRef = ref(null)
const uploadRef = ref(null)
const loading = ref(false)
const fileLoading = ref(false)
const errorMessage = ref('')
const fileName = ref('')
const kmlFile = ref(null)
const loadMode = ref('file')

const formLabelWidth = '120px'

const form4KmlParam = reactive({
  name: null,
  file: null,
  url: '',
})

const placeholder4Form = {
  name: 'KML/KMZ 图层名称',
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
    return callback(new Error('请选择 KML/KMZ 文件'))
  }
  if (!kmlFile.value) {
    return callback(new Error('请选择有效的 KML/KMZ 文件'))
  }
  callback()
}

function checkUrl(rule, value, callback) {
  if (loadMode.value !== 'url') {
    return callback()
  }
  if (!value || !value.trim()) {
    return callback(new Error('请输入 KML/KMZ URL'))
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
    form4KmlParam.url = ''
  } else {
    form4KmlParam.file = null
    kmlFile.value = null
    fileName.value = ''
  }
  ruleFormRef.value?.clearValidate(['file', 'url'])
})

watch(
  () => [form4KmlParam.url, loadMode.value],
  ([url, mode]) => {
    if (mode !== 'url') return
    const parsed = parseLayerNameFromUrl(url)
    if (parsed && (!form4KmlParam.name || !form4KmlParam.name.trim())) {
      form4KmlParam.name = parsed
    }
  },
  { immediate: false }
)

function handleFileChange(uploadFile) {
  if (!uploadFile || !uploadFile.raw) {
    return
  }

  errorMessage.value = ''
  fileLoading.value = true

  try {
    kmlFile.value = uploadFile.raw
    fileName.value = uploadFile.name
    form4KmlParam.file = uploadFile.name

    if (!form4KmlParam.name) {
      form4KmlParam.name = uploadFile.name.replace(/\.[^/.]+$/, '')
    }

    ruleFormRef.value?.validateField('file')
  } catch (error) {
    kmlFile.value = null
    fileName.value = ''
    form4KmlParam.file = null
    errorMessage.value = error.message || '文件选择失败'
    ruleFormRef.value?.validateField('file')
  } finally {
    fileLoading.value = false
  }
}

function loadKml(formRef) {
  if (!formRef) {
    return
  }

  errorMessage.value = ''

  formRef.validate((isValid) => {
    if (!isValid) {
      return
    }

    loading.value = true
    const layerName = form4KmlParam.name?.trim() || placeholder4Form.name
    const data = loadMode.value === 'file' ? kmlFile.value : form4KmlParam.url?.trim()
    const layerStore = useLayerStore()
    layerStore
      .addKmlLayer(layerName, data)
      .then(layerId => {
        ElMessage({
          type: 'success',
          message: `图层："${layerName}" 加载成功`,
        })
        resetForm()
        closeDialogKmlParam()
        console.log('KML 图层加载成功，图层 ID:', layerId)
      })
      .catch(error => {
        errorMessage.value = error.message || 'KML/KMZ 加载失败'
        console.error('加载 KML/KMZ 失败:', error)
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
  kmlFile.value = null
  form4KmlParam.url = ''
  loadMode.value = 'file'
  errorMessage.value = ''
}

function cancel() {
  resetForm()
  closeDialogKmlParam()
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

.kml-tip-alert :deep(.el-alert__content),
.kml-tip-alert :deep(.el-alert__description) {
  text-align: left;
}

.kml-tip-list {
  margin: 0;
}

.kml-tip-item {
  padding-left: 1em;
  position: relative;
  margin-bottom: 0.25em;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.5em;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
  }

  &:last-child {
    margin-bottom: 0;
  }
}
</style>
