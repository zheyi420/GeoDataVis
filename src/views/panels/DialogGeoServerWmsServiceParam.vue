<template>
  <el-dialog
    v-model="visStatus4DialogGeoServerWmsServiceParam"
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
        <span>创建新的 WMS 连接</span>
      </div>
    </template>
    <template v-slot:default>
      <el-form ref="ruleFormRef" class="form-content" :model="form4WmsServiceParam" :rules="rules">
        <div class="wms-param-a">
          <el-form-item label="图层名称" :label-width="formLabelWidth" prop="layerName">
            <el-input
              v-model="form4WmsServiceParam.layerName"
              autocomplete="off"
              :placeholder="placeholder4Form.layerName"
            />
          </el-form-item>
          <!-- TODO 增加对输入自动去除头尾空格 -->
          <el-form-item label="WMS服务地址URL" :label-width="formLabelWidth" prop="url">
            <el-input ref="ref4InputUrl" v-model="form4WmsServiceParam.url" autocomplete="off" />
          </el-form-item>
          <!-- URL说明 -->
          <div ref="ref4InputUrlTip" class="form-item-tips form-item-tips-url">
            <span>示例：</span>
            <span>http://localhost:8090/geoserver/wms</span>
          </div>
        </div>
        <div class="wms-param-b">
          <div class="param-section-name">
            <el-divider content-position="center">标准参数</el-divider>
          </div>
          <div class="param-section-input">
            <el-row :gutter="2" align="middle">
              <el-col :span="3">
                <span class="param-item">service:</span>
              </el-col>
              <el-col :span="9">
                <span class="param-item">{{ form4WmsServiceParam.service }}</span>
              </el-col>
              <el-col :span="3">
                <span class="param-item">request:</span>
              </el-col>
              <el-col :span="9">
                <span class="param-item">{{ form4WmsServiceParam.request }}</span>
              </el-col>
            </el-row>
            <el-row :gutter="2" align="middle">
              <el-col :span="3">
                <span class="param-item">version:</span>
              </el-col>
              <el-col :span="9">
                <el-form-item class="param-item">
                  <el-select v-model="form4WmsServiceParam.version" style="width: 80px">
                    <el-option
                      v-for="item of versionOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="3">
                <span class="param-item">{{ label4SrsCrs }}</span>
              </el-col>
              <el-col :span="9">
                <el-form-item prop="srs_crs" class="param-item">
                  <el-input v-model="form4WmsServiceParam.srs_crs" autocomplete="off" style="width: 180px">
                    <template #prepend>EPSG:</template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="2" align="middle">
              <el-col :span="3">
                <span class="param-item">layers:</span>
              </el-col>
              <el-col :span="9">
                <el-tooltip placement="right">
                  <template #content>值是以逗号分隔的图层名称列表<br />若单个图层，无需逗号</template>
                  <el-form-item prop="layers" class="param-item">
                    <el-input v-model="form4WmsServiceParam.layers" autocomplete="off" style="width: 120px" />
                  </el-form-item>
                </el-tooltip>
              </el-col>
              <el-col :span="3">
                <span class="param-item">styles:</span>
              </el-col>
              <el-col :span="9">
                <el-tooltip placement="right">
                  <template #content>值是以逗号分隔的样式名称列表<br />如为空，使用服务默认样式</template>
                  <el-form-item prop="styles" class="param-item">
                    <el-input v-model="form4WmsServiceParam.styles" autocomplete="off" style="width: 120px" />
                  </el-form-item>
                </el-tooltip>
              </el-col>
            </el-row>
            <el-row :gutter="2" align="middle">
              <el-col :span="3">
                <span class="param-item">width:</span>
              </el-col>
              <el-col :span="9">
                <el-form-item prop="width" class="param-item">
                  <el-input
                    v-model="form4WmsServiceParam.width"
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
                    v-model="form4WmsServiceParam.height"
                    autocomplete="off"
                    style="width: 80px"
                    :placeholder="placeholder4Form.height"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="2" align="middle">
              <el-col :span="3">
                <span class="param-item">format:</span>
              </el-col>
              <el-col :span="9">
                <el-form-item prop="format" class="param-item">
                  <el-select v-model="form4WmsServiceParam.format" style="width: 180px">
                    <el-option
                      v-for="item of formatOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="3">
                <span class="param-item">transparent:</span>
              </el-col>
              <el-col :span="9">
                <el-tooltip content="地图背景是否应该透明" placement="right">
                  <el-form-item prop="transparent" class="param-item">
                    <el-switch v-model="form4WmsServiceParam.transparent" style="margin-left: 10px" />
                  </el-form-item>
                </el-tooltip>
              </el-col>
            </el-row>
            <el-row :gutter="2" align="middle">
              <el-col :span="3">
                <span class="param-item">bgcolor:</span>
              </el-col>
              <el-col :span="9">
                <el-tooltip placement="right">
                  <template #content>地图图像的背景颜色<br />值为 RRGGBB 格式</template>
                  <el-form-item prop="bgcolor" class="param-item">
                    <el-input
                      v-model="form4WmsServiceParam.bgcolor"
                      style="width: 100px"
                      :formatter="value => `#${value}`"
                      :parser="value => value.replace(/^#/, '')"
                    />
                  </el-form-item>
                </el-tooltip>
              </el-col>
              <el-col :span="3">
                <el-checkbox v-model="form4WmsServiceParam.enableParamExceptions" style="margin-left: -18px" />
                <span class="param-item" :class="{ 'param-item-disabled': !form4WmsServiceParam.enableParamExceptions }" style="margin-left: 5px">
                  exceptions:
                </span>
              </el-col>
              <el-col :span="9">
                <span class="param-item" style="margin-left: 5px" :class="{ 'param-item-disabled': !form4WmsServiceParam.enableParamExceptions }">{{ form4WmsServiceParam.exceptions }}</span>
              </el-col>
            </el-row>
            <!-- TODO 后续增加
            <el-row :gutter="2" align="middle">
              <el-col :span="3">
                <span class="param-item">sld:</span>
              </el-col>
              <el-col :span="9">
                <span class="param-item">XML file URL</span>
              </el-col>
              <el-col :span="3">
                <span class="param-item">sld_body:</span>
              </el-col>
              <el-col :span="9">
                <span class="param-item">XML document</span>
              </el-col>
            </el-row>
            <el-row :gutter="2" align="middle">
              <el-col :span="3">
                <span class="param-item">time:</span>
              </el-col>
              <el-col :span="9">
                <span class="param-item">tiem</span>
              </el-col>
            </el-row>
             -->
          </div>
        </div>
      </el-form>
    </template>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="cancel">取消</el-button>
        <el-button type="primary" @click="setNewWmsServiceConnection(ruleFormRef)">确认</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { onMounted, computed, ref, reactive } from 'vue'
import {
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElButton,
  ElDivider,
  ElRow,
  ElCol,
  ElTooltip,
  ElSwitch,
  ElCheckbox,
  ElMessage,
} from 'element-plus'
import { usePanelStatusStore } from '@/stores/panelStatus'
import { storeToRefs } from 'pinia'

const panelStatusStore = usePanelStatusStore()
const { visStatus4DialogGeoServerWmsServiceParam } = storeToRefs(panelStatusStore)
const { closeDialogGeoServerWmsServiceParam } = panelStatusStore

const ruleFormRef = ref(null)
const form4WmsServiceParam = reactive({
  layerName: null,
  url: null,
  service: 'WMS',
  version: '1.1.0',
  request: 'GetMap',
  layers: null,
  styles: '', // 默认需要为空字符串
  srs_crs: null,
  width: null,
  height: null,
  format: 'image/png',
  transparent: false,
  bgcolor: 'FFFFFF',
  exceptions: 'application/vnd.ogc.se_xml',
  enableParamExceptions: false,
})
const label4SrsCrs = computed(() => {
  return form4WmsServiceParam.version === '1.3.0' ? 'crs:' : 'srs:'
})
const versionOptions = [
  { label: '1.0.0', value: '1.0.0' },
  { label: '1.1.0', value: '1.1.0' },
  { label: '1.1.1', value: '1.1.1' },
  { label: '1.3.0', value: '1.3.0' },
]
const formatOptions = [
  // TODO 还是需要通过 WMS 服务的 GetCapabilities 请求来查询支持的格式
  { label: 'image/png', value: 'image/png' },
  { label: 'image/png8', value: 'image/png8' },
  { label: 'image/jpeg', value: 'image/jpeg' },
  { label: 'image/vnd.jpeg-png', value: 'image/vnd.jpeg-png' },
  { label: 'image/vnd.jpeg-png8', value: 'image/vnd.jpeg-png8' },
  { label: 'image/gif', value: 'image/gif' },
  { label: 'image/tiff', value: 'image/tiff' },
  { label: 'image/tiff8', value: 'image/tiff8' },
  { label: 'image/geotiff', value: 'image/geotiff' },
  { label: 'image/geotiff8', value: 'image/geotiff8' },
  // { label: 'image/svg', value: 'image/svg' },
  // { label: 'application/pdf', value: 'application/pdf' },
  // { label: 'rss', value: 'rss' },
  // { label: 'kmz', value: 'kmz' },
  // { label: 'text/mapml', value: 'text/mapml' },
  // { label: '', value: '' }, // text/html; subtype=mapml
  // { label: 'application/openlayers', value: 'application/openlayers' },
  // { label: '', value: '' }, // format=application/json;type=utfgrid
]
const placeholder4Form = reactive({
  layerName: '图层一', // TODO 后续改为从store中获取
  width: '256',
  height: '256',
})
const rules = reactive({
  layerName: [{ validator: checkLayerName, trigger: 'blur' }],
  url: [{ validator: checkUrl, trigger: 'blur' }],
  layers: [{ validator: checkLayers, trigger: 'blur' }],
  styles: [{ validator: checkStyles, trigger: 'blur' }],
  srs_crs: [{ validator: checkSrsCrs, trigger: 'blur' }],
  width: [{ validator: checkWidthHeight, trigger: 'blur' }],
  height: [{ validator: checkWidthHeight, trigger: 'blur' }],
  bgcolor: [{ validator: checkBgcolor, trigger: 'blur' }],
})
const formLabelWidth = '140px'

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
function checkLayers(rule, value, callback) {
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
function checkStyles(rule, value, callback) {
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

/**
 * @description 校验坐标系
 */
function checkSrsCrs(rule, value, callback) {
  // 如果坐标系为空，提示错误
  if (!value) {
    return callback(new Error('请输入'))
  }

  // 如果坐标系为空格，提示错误
  if (!value.trim()) {
    // 删除前后空格后为空字符串
    return callback(new Error('不能为空格'))
  }

  // 如果坐标系不符合规范，提示错误
  // 规范：4位或5位数字
  // 由于value是字符串，直接使用正则表达式
  const reg = /^\d{4,5}$/
  if (!reg.test(value)) {
    return callback(new Error('格式错误'))
  }

  callback()
}

/**
 * @description 校验背景颜色
 */
function checkBgcolor(rule, value, callback) {
  // 如果背景颜色为空，正常，使用默认值，且重新设置为`FFFFFF`
  if (!value) {
    form4WmsServiceParam.bgcolor = 'FFFFFF'
    return callback()
  }

  // 如果背景颜色为空格，提示错误
  if (!value.trim()) {
    // 删除前后空格后为空字符串
    return callback(new Error('不能为空格'))
  }

  // 如果背景颜色不符合规范，提示错误
  // 规范：6位字符，由数字和字母组成
  // 由于value是字符串，直接使用正则表达式
  const reg = /^[0-9a-fA-F]{6}$/
  if (!reg.test(value)) {
    return callback(new Error('格式错误'))
  }

  callback()
}

/**
 * @description 校验高宽
 */
function checkWidthHeight(rule, value, callback) {
  // 如果高宽为空，正常，使用默认值
  if (!value) {
    return callback()
  }

  // 如果高宽为空格，提示错误
  if (!value.trim()) {
    // 删除前后空格后为空字符串
    return callback(new Error('不能为空格'))
  }

  // 如果高宽不符合规范，提示错误
  // 规范：数字
  // 由于value是字符串，直接使用正则表达式
  const reg = /^\d+$/
  if (!reg.test(value)) {
    return callback(new Error('格式错误'))
  }

  callback()
}

/**
 * @description 取消
 */
function cancel() {
  // 重置表单
  resetForm()
  // 关闭对话框
  closeDialogGeoServerWmsServiceParam()
}

/**
 * @description 设置新的 WMS 服务连接
 */
function setNewWmsServiceConnection(ruleFormRef) {
  // console.log('@@@', ruleFormRef);

  if (!ruleFormRef) {
    console.log('ruleFormRef is null')
    return
  }

  // 校验表单
  ruleFormRef
    .validate((isValid, invalidFields) => {
      // console.log('isValid', isValid);
      // console.log('invalidFields', invalidFields);
      console.log('form4WmsServiceParam', form4WmsServiceParam)

      if (isValid) {
        // 如果有默认值的选项，未被设置，则在此设置默认值
        const _form = { ...form4WmsServiceParam }
        if (!_form.layerName) {
          _form.layerName = placeholder4Form.layerName
        }
        if (!_form.width) {
          _form.width = placeholder4Form.width
        }
        if (!_form.height) {
          _form.height = placeholder4Form.height
        }
        _form.srs_crs = `EPSG:${_form.srs_crs}`

        console.log('提交表单', _form)

        // 处理表单数据，区分 WebMapServiceImageryProvider 的 parameters 和其他参数
        const WebMapServiceImageryProviderConstructorOptions = {
          url: _form.url,
          layers: _form.layers,
          parameters: {
            service: _form.service,
            version: _form.version,
            request: _form.request,
            styles: _form.styles,
            format: _form.format,
            bgcolor: _form.bgcolor,
            transparent: _form.transparent,
          },
          tileWidth: _form.width,
          tileHeight: _form.height,
          ...(_form.version === '1.3.0' ? { crs: _form.srs_crs } : { srs: _form.srs_crs })
        }
        if (_form.enableParamExceptions) {
          WebMapServiceImageryProviderConstructorOptions.parameters.exceptions = _form.exceptions
        }
        // 调用加载 WMS 服务的方法
        const layer = window.layerManager.addWmsLayer(_form.layerName, WebMapServiceImageryProviderConstructorOptions)

        if (layer) {
          // 图层加载成功
          ElMessage({
            type: 'success',
            message: `图层 ${_form.layerName} 加载成功`
          })
          // 重置表单
          resetForm()
          // 关闭对话框
          closeDialogGeoServerWmsServiceParam()
        } else {
          // 图层加载失败
          ElMessage({
            type: 'error',
            message: '图层加载失败，请检查服务地址和参数'
          })
          // 不关闭对话框，让用户修改参数
        }
      } else {
        console.log('error submit!!')
        // return false
      }
    })
    .then(res => {
      console.log('ruleFormRef.validate res', res); // true
    })
    .catch(error => {
      console.error('ruleFormRef.validate error', error)
    })
}

/**
 * @description 重置表单
 */
function resetForm() {
  if (ruleFormRef.value) {
    ruleFormRef.value.resetFields()
    // 重置不在resetFields范围内的字段
    form4WmsServiceParam.service = 'WMS'
    form4WmsServiceParam.version = '1.1.0'
    form4WmsServiceParam.request = 'GetMap'
    form4WmsServiceParam.styles = ''
    form4WmsServiceParam.format = 'image/png'
    form4WmsServiceParam.transparent = false
    form4WmsServiceParam.bgcolor = 'FFFFFF'
    form4WmsServiceParam.exceptions = 'application/vnd.ogc.se_xml'
    form4WmsServiceParam.enableParamExceptions = false
  }
}

/**
 * @description 关闭对话框
 */
function handleClose(done) {
  resetForm()
  closeDialogGeoServerWmsServiceParam()
  done()
}

const ref4InputUrl = ref(null)
const ref4InputUrlTip = ref(null)
const setFormItemTips4UrlPos = () => {
  const inputUrlElement = ref4InputUrl.value
  const formItemTipsElement = ref4InputUrlTip.value
  if (inputUrlElement && formItemTipsElement) {
    const inputUrlRect = inputUrlElement.getBoundingClientRect()
    console.log('inputUrlRect', inputUrlRect)

    formItemTipsElement.style.position = 'absolute' // relative
    formItemTipsElement.style.left = `${inputUrlRect.left}px`
  }
}
function dialogOpen() {
  // console.log('dialogOpen')
}
function dialogOpened() {
  // console.log('dialogOpened')
}
</script>

<style scoped lang="scss">
.dialog-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.form-content {
  .wms-param-a {
  }

  .wms-param-b {
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
  width: fit-content;
  // margin-top: -10px;
  font-size: 12px;
  color: #606266;

  &.form-item-tips-url {
    right: var(--el-dialog-padding-primary);
    position: absolute;
    margin-top: -10px;
  }
}
</style>
