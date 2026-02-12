<template>
  <el-dialog
    v-model="visStatus4DialogWmtsServiceParam"
    class="dialog-wmts-service-param"
    width="600"
    destroy-on-close
    :align-center="false"
    :close-on-click-modal="false"
    :before-close="handleClose"
    :top="`0vh`"
    @open="dialogOpen"
    @opened="dialogOpened"
  >
    <template v-slot:header>
      <div class="dialog-title">
        <span>创建新的 WMTS 连接</span>
      </div>
    </template>
    <template v-slot:default>
      <el-form ref="ruleFormRef" class="form-content" :model="form4WmtsServiceParam" :rules="rules">
        <div class="wmts-param-a">
          <el-form-item label="图层名称" :label-width="formLabelWidth" prop="layerName">
            <el-input
              v-model="form4WmtsServiceParam.layerName"
              autocomplete="off"
              :placeholder="placeholder4Form.layerName"
            />
          </el-form-item>
          <el-form-item label="WMTS服务地址URL" :label-width="formLabelWidth" prop="url">
            <el-input ref="ref4InputUrl" v-model="form4WmtsServiceParam.url" autocomplete="off" />
          </el-form-item>
          <!-- URL说明 -->
          <div ref="ref4InputUrlTip" class="form-item-tips form-item-tips-url">
            <span>示例：</span>
            <span>http://t0.tianditu.gov.cn/img_w/wmts?tk=***</span>
          </div>
          <el-form-item label="WMTS元数据地址" :label-width="formLabelWidth" prop="metadataUrl">
            <el-input
              v-model="form4WmtsServiceParam.metadataUrl"
              autocomplete="off"
              :placeholder="placeholder4Form.metadataUrl"
            />
          </el-form-item>
          <!-- <div class="form-item-tips">
            <span>选填，填写后在确认时将解析并自动填充下方参数</span>
          </div> -->
        </div>
        <div class="wmts-param-b">
          <el-divider content-position="center">标准参数</el-divider>
          <div class="param-section-input">
            <el-row :gutter="2" align="middle">
              <el-col :span="3">
                <span class="param-item">layer:</span>
              </el-col>
              <el-col :span="9">
                <el-form-item class="param-item" prop="layer">
                  <el-input v-model="form4WmtsServiceParam.layer" autocomplete="off" style="width: 180px" />
                </el-form-item>
              </el-col>
              <el-col :span="3">
                <span class="param-item">style:</span>
              </el-col>
              <el-col :span="9">
                <el-tooltip placement="right">
                  <template #content>如为空，自动设置为默认样式名 'default'</template>
                  <el-form-item prop="style" class="param-item">
                    <el-input v-model="form4WmtsServiceParam.style" autocomplete="off" style="width: 180px" />
                  </el-form-item>
                </el-tooltip>
              </el-col>
            </el-row>
            <el-row :gutter="2" align="middle">
              <el-col :span="3">
                <span class="param-item">format:</span>
              </el-col>
              <el-col :span="7">
                <el-form-item class="param-item" prop="format">
                  <el-select v-model="form4WmtsServiceParam.format" style="width: 130px">
                    <el-option
                      v-for="item of formatOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="5">
                <span class="param-item">tileMatrixSet:</span>
              </el-col>
              <el-col :span="9">
                <el-form-item class="param-item" prop="tileMatrixSetID">
                  <el-input v-model="form4WmtsServiceParam.tileMatrixSetID" autocomplete="off" style="width: 180px" />
                  <!--
                  <el-input v-model="form4WmtsServiceParam.tileMatrixSetID" autocomplete="off" style="width: 180px">
                    <template #prepend>EPSG:</template>
                  </el-input>
                  -->
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="2" align="middle">
              <el-col :span="3">
                <span class="param-item">width:</span>
              </el-col>
              <el-col :span="9">
                <el-form-item prop="width" class="param-item">
                  <el-input
                    v-model="form4WmtsServiceParam.tileWidth"
                    autocomplete="off"
                    style="width: 80px"
                    :placeholder="placeholder4Form.width"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="3">
                <span class="param-item">height:</span>
              </el-col>
              <el-col :span="9">
                <el-form-item prop="height" class="param-item">
                  <el-input
                    v-model="form4WmtsServiceParam.tileHeight"
                    autocomplete="off"
                    style="width: 80px"
                    :placeholder="placeholder4Form.height"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </div>
      </el-form>
    </template>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="cancel">取消</el-button>
        <el-button type="primary" :loading="loading" @click="setNewWmtsServiceConnection(ruleFormRef)">确认</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { onMounted, ref, reactive } from 'vue'
import {
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElSelect,
  ElOption,
  ElButton,
  ElDivider,
  ElRow,
  ElCol,
  ElTooltip,
  ElMessage,
} from 'element-plus'
import { usePanelStatusStore } from '@/stores/panelStatus'
import { storeToRefs } from 'pinia'
import { useLayerStore } from '@/stores/map/layerStore'
import { fetchAndParseWmtsCapabilities } from '@/map/utils/WmtsCapabilitiesParser'

const panelStatusStore = usePanelStatusStore()
const { visStatus4DialogWmtsServiceParam } = storeToRefs(panelStatusStore)
const { closeDialogWmtsServiceParam } = panelStatusStore

const ruleFormRef = ref(null)
const form4WmtsServiceParam = reactive({
  layerName: null,
  url: null,
  metadataUrl: null,
  layer: null,
  style: '',
  format: 'image/png',
  tileMatrixSetID: 'EPSG:3857',
  tileWidth: 256,
  tileHeight: 256,
})

const formatOptions = [
  { label: 'image/png', value: 'image/png' },
  { label: 'image/jpeg', value: 'image/jpeg' },
  { label: 'image/png8', value: 'image/png8' },
  { label: 'image/webp', value: 'image/webp' },
  { label: 'tiles', value: 'tiles' }
]

const placeholder4Form = reactive({
  layerName: 'WMTS图层',
  width: '256',
  height: '256',
  metadataUrl: '选填',
})

const rules = reactive({
  layerName: [
    { validator: checkLayerName, trigger: 'blur' }
  ],
  url: [
    { validator: checkUrl, trigger: 'blur' }
  ],
  layer: [
    { validator: checkLayer, trigger: 'blur' }
  ],
  style: [
    { validator: checkStyle, trigger: 'blur' }
  ],
  format: [
    { required: true, message: '请选择图像格式', trigger: 'change' }
  ],
  tileMatrixSetID: [
    { required: true, message: '请输入瓦片矩阵集标识符', trigger: 'blur' }
  ]
})

/**
 * @description 校验图层名称
 */
function checkLayerName(rule, value, callback) {
  // 如果图层名称为空，正常，使用默认值
  if (!value) {
    return callback()
  }

  // 如果图层名称为空格，提示错误
  if (!value.trim()) {
    // 删除前后空格后为空字符串
    return callback(new Error('不能为空格'))
  }

  callback()
}

/**
 * @description 校验 URL
 */
function checkUrl(rule, value, callback) {
  // 校验value值是否符合URL规范
  // const reg = /^(http|https):\/\/(([\w.-]+)|((\d{1,3}\.){3}\d{1,3}(:\d+)?))\/\S*$/
  const reg = /^(http|https):\/\/(([\w.-]+)|((\d{1,3}\.){3}\d{1,3}))(:\d+)?(\/\S*)?$/

  if (!value) {
    return callback(new Error('请输入'))
  }

  if (!reg.test(value)) {
    return callback(new Error('格式错误'))
  }

  callback()
}

/**
 * @description 校验图层名称
 */
 function checkLayer(rule, value, callback) {
  // 如果图层名称为空，提示错误
  if (!value) {
    return callback(new Error('请输入'))
  }

  // 如果图层名称为空格，提示错误
  if (!value.trim()) {
    // 删除前后空格后为空字符串
    return callback(new Error('不能为空格'))
  }

  callback()
}

/**
 * @description 校验图层样式
 */
 function checkStyle(rule, value, callback) {
  // 如果图层样式为空，正常
  if (!value) {
    return callback()
  }

  // 如果图层名称为空格，提示错误
  if (!value.trim()) {
    // 删除前后空格后为空字符串
    return callback(new Error('不能为空格'))
  }

  callback()
}

const formLabelWidth = '160px'
const loading = ref(false)

const ref4InputUrl = ref(null)
const ref4InputUrlTip = ref(null)

onMounted(() => {
  console.log('DialogWmtsServiceParam onMounted')
})

function dialogOpen() {
  console.log('WMTS对话框打开')
}

function dialogOpened() {
  console.log('WMTS对话框已打开')
  // 聚焦到URL输入框
  if (ref4InputUrl.value) {
    ref4InputUrl.value.focus()
  }
}

function handleClose() {
  closeDialogWmtsServiceParam()
}

function cancel() {
  resetForm()
  closeDialogWmtsServiceParam()
}

function resetForm() {
  if (ruleFormRef.value) {
    ruleFormRef.value.resetFields()
  }
  // 重置为默认值
  Object.assign(form4WmtsServiceParam, {
    layerName: null,
    url: null,
    metadataUrl: null,
    layer: null,
    style: '',
    format: 'image/png',
    tileMatrixSetID: 'EPSG:3857',
    tileWidth: 256,
    tileHeight: 256,
  })
}

async function setNewWmtsServiceConnection(formEl) {
  if (!formEl) return

  loading.value = true

  formEl.validate(async (valid) => {
    if (!valid) {
      console.log('WMTS表单验证失败!')
      loading.value = false
      return
    }

    const _form = { ...form4WmtsServiceParam }
    console.log('提交WMTS表单', _form)

    // 构造 WebMapTileServiceImageryProvider 选项，先使用表单值；style 为空时自动设为 'default'
    const options = {
      url: _form.url,
      layer: _form.layer,
      style: (_form.style != null && String(_form.style).trim() !== '') ? _form.style : 'default',
      format: _form.format,
      tileMatrixSetID: _form.tileMatrixSetID,
      tileWidth: _form.tileWidth,
      tileHeight: _form.tileHeight
    }

    // 若填写了元数据地址，请求并解析 GetCapabilities，用解析结果覆盖/补充参数
    const metadataUrl = (_form.metadataUrl && typeof _form.metadataUrl === 'string') ? _form.metadataUrl.trim() : ''
    if (metadataUrl) {
      try {
        const parsed = await fetchAndParseWmtsCapabilities(metadataUrl)
        options.layer = parsed.layer
        options.style = parsed.style
        options.format = parsed.format
        options.tileMatrixSetID = parsed.tileMatrixSetID
        options.tileMatrixLabels = parsed.tileMatrixLabels
        if (parsed.minimumLevel != null) options.minimumLevel = parsed.minimumLevel
        if (parsed.maximumLevel != null) options.maximumLevel = parsed.maximumLevel
        if (parsed.tileWidth != null) options.tileWidth = parsed.tileWidth
        if (parsed.tileHeight != null) options.tileHeight = parsed.tileHeight
      } catch (err) {
        ElMessage.error(err.message || '解析 WMTS 元数据失败')
        loading.value = false
        return
      }
    }

    const layerStore = useLayerStore()
    try {
      await layerStore.addWmtsLayer(_form.layerName, options)
      ElMessage({ type: 'success', message: `WMTS图层："${_form.layerName}" 加载成功` })
      resetForm()
      closeDialogWmtsServiceParam()
    } catch (error) {
      ElMessage.error(error.message || 'WMTS图层加载失败，请检查服务地址和参数')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped lang="scss">
.dialog-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.form-content {
  .wmts-param-a {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .wmts-param-b {
    padding-top: 5px;

    .param-section-name {
      margin: 20px 0px 10px 0px;
      font-size: 14px;
      font-weight: bold;
    }

    .param-section-input {
      .el-row {
        margin-bottom: 17px;
        height: 30px;

        &:last-child {
          // margin-bottom: 0;
        }

        .el-col {
          display: flex;
          justify-content: flex-start;

          .el-form-item {
            margin-bottom: 0px;
          }
        }
      }

      .param-item {
        width: fit-content;
        white-space: nowrap;
        display: flex;
        align-items: center;
      }

      .param-item-disabled {
        color: #c0c4cc;
      }
    }
  }
}
.form-item-tips {
  align-self: flex-end;
  width: fit-content;
  font-size: 12px;
  color: #606266;
  margin-top: -10px;

  &.form-item-tips-url {
    user-select: text;
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
  }
}
</style>

<style lang="scss">
.dialog-wmts-service-param {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
</style>
