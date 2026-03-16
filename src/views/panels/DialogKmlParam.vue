<!--
 * @Author: zheyi420
 * @Date: 2026-03-16
 * @LastEditors: zheyi420
 * @LastEditTime: 2026-03-16
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
        <span>加载 KML/KMZ 文件</span>
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

        <el-form-item label="KML/KMZ 文件" :label-width="formLabelWidth" prop="file">
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
        <el-button type="primary" :loading="loading" :disabled="fileLoading" @click="loadKml(ruleFormRef)">
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
  ElAlert,
  ElMessage,
} from 'element-plus'
import { storeToRefs } from 'pinia'
import { usePanelStatusStore } from '@/stores/panelStatus'
import { useLayerStore } from '@/stores/map/layerStore'

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

const formLabelWidth = '120px'

const form4KmlParam = reactive({
  name: null,
  file: null,
})

const placeholder4Form = {
  name: '例如：本地 KML 图层',
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
    return callback(new Error('请选择 KML/KMZ 文件'))
  }
  if (!kmlFile.value) {
    return callback(new Error('请选择有效的 KML/KMZ 文件'))
  }
  callback()
}

const rules = {
  name: [{ validator: checkName, trigger: 'blur' }],
  file: [{ validator: checkFile, trigger: 'change' }],
}

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
    const layerStore = useLayerStore()
    layerStore
      .addKmlLayer(layerName, kmlFile.value)
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

</style>
