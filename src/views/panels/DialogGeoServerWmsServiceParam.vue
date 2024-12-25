<template>
  <el-dialog
    v-model="visStatus4DialogGeoServerWmsServiceParam"
    width="500"
    destroy-on-close
    :align-center="false"
    :close-on-click-modal="false"
    :before-close="handleClose"
    @open="dialogOpen"
    @opened="dialogOpened"
  >
    <template v-slot:header>
      <div class="dialog-title">
        <span>创建新的 WMS 连接</span>
      </div>
    </template>
    <template v-slot:default>
      <el-form ref="ruleFormRef" class="form-content" :model="form" :rules="rules">
        <div class="wms-param-a">
          <el-form-item label="图层名称" :label-width="formLabelWidth" prop="layerName">
            <el-input v-model="form.layerName" autocomplete="off" :placeholder="placeholder4Form.layerName" />
          </el-form-item>
          <el-form-item label="WMS服务地址URL" :label-width="formLabelWidth" prop="url">
            <el-input ref="ref4InputUrl" v-model="form.url" autocomplete="off" />
          </el-form-item>
          <!-- URL说明 -->
          <div ref="ref4InputUrlTip" class="form-item-tips">
            <span>示例：</span>
            <span>http://localhost:8090/geoserver/wms</span>
          </div>
        </div>
        <div class="wms-param-b">
          <div class="param-section-name">
            <span>标准参数</span>
          </div>
          <el-form-item label="service:" class="param-item">
            <span>WMS</span>
          </el-form-item>
        </div>
      </el-form>
    </template>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialogGeoServerWmsServiceParam">取消</el-button>
        <el-button type="primary" @click="setNewWmsServiceConnection(ruleFormRef)">确认</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { onMounted, ref, reactive } from 'vue'
import { ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElButton } from 'element-plus'
import { usePanelStatusStore } from '@/stores/panelStatus'
import { storeToRefs } from 'pinia'

const panelStatusStore = usePanelStatusStore()
const { visStatus4DialogGeoServerWmsServiceParam } = storeToRefs(panelStatusStore)
const { closeDialogGeoServerWmsServiceParam } = panelStatusStore

const ruleFormRef = ref(null)
const form = reactive({
  layerName: '',
  url: '',
})
const placeholder4Form = reactive({
  layerName: '图层一', // TODO 后续改为从store中获取
})
const rules = reactive({
  layerName: [{ validator: checkLayerName, trigger: 'blur' }],
  url: [{ validator: checkUrl, trigger: 'blur' }],
})
const formLabelWidth = '140px'

/**
 * @description 校验图层名称
 */
function checkLayerName(rule, value, callback) {
  
  // 如果图层名称为空，正常
  if (!value) {
    return callback()
  }

  // 如果图层名称为空格，提示错误
  if (!value.trim()) {
    // 删除前后空格后为空字符串
    return callback(new Error('图层名称不能为空格'))
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
 * @description 设置新的 WMS 服务连接
 */
function setNewWmsServiceConnection(ruleFormRef) {
  console.log('@@@', ruleFormRef);
  
  if (!ruleFormRef) {
    console.log('ruleFormRef is null')

    return
  }

  // 校验表单
  ruleFormRef
    .validate((isValid, invalidFields) => {
      console.log('isValid', isValid);
      console.log('invalidFields', invalidFields);
      
      if (isValid) {
        console.log('form', form)
        
        // 如果有默认值的选项，未被设置，则在此设置默认值
        const _form = { ...form }
        if (!_form.layerName) {
          _form.layerName = placeholder4Form.layerName
        }

        console.log('_form', _form)
        // 发送请求
        // 关闭对话框
        // closeDialogGeoServerWmsServiceParam()
      } else {
        console.log('error submit!!')
        // return false
      }
    })
    .then(() => {
      console.log('then')
    })
}

/**
 * @description 关闭对话框
 */
function handleClose(done) {
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

    .param-item {
      width: fit-content;
    }
  }
}
.form-item-tips {
  position: absolute;
  width: fit-content;
  margin-top: -10px;
  font-size: 12px;
  color: #606266;
  right: var(--el-dialog-padding-primary);
}
</style>
