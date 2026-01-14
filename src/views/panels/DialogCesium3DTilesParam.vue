<!--
 * @Author: zheyi420
 * @Date: 2025-01-12
 * @LastEditors: zheyi420 37471153+zheyi420@users.noreply.github.com
 * @LastEditTime: 2026-01-14
 * @FilePath: \GeoDataVis\src\views\panels\DialogCesium3DTilesParam.vue
 * @Description: Cesium 3DTiles 模型加载对话框
 *
-->

<template>
  <el-dialog
    v-model="visStatus4DialogCesium3DTilesParam"
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
        <span>加载 Cesium 3DTiles 模型</span>
      </div>
    </template>
    <template v-slot:default>
      <el-form
        ref="ruleFormRef"
        class="form-content"
        :model="form4Cesium3DTilesParam"
        :rules="rules"
      >
        <el-form-item label="模型名称" :label-width="formLabelWidth" prop="name">
          <el-input
            v-model="form4Cesium3DTilesParam.name"
            autocomplete="off"
            :placeholder="placeholder4Form.name"
          />
        </el-form-item>

        <el-form-item label="Tileset URL" :label-width="formLabelWidth" prop="url">
          <el-input
            ref="ref4InputUrl"
            v-model="form4Cesium3DTilesParam.url"
            autocomplete="off"
            type="textarea"
            :rows="3"
            :placeholder="placeholder4Form.url"
          />
        </el-form-item>

        <!-- URL 说明 -->
        <div ref="ref4InputUrlTip" class="form-item-tips form-item-tips-url">
          <span>示例：</span>
          <span>https://pelican-public.s3.amazonaws.com/3dtiles/agi-hq/tileset.json</span>
        </div>

        <!-- 高级参数 -->
        <div class="form-param-advanced">
          <div class="param-section-name">
            <el-divider content-position="center">高级参数（可选）</el-divider>
          </div>
          <div class="param-section-input">
            <el-row :gutter="2" align="middle">
              <el-col :span="12">
                <span class="param-item">屏幕空间误差：</span>
              </el-col>
              <el-col :span="12">
                <el-tooltip
                  content="值越小渲染精度越高，性能消耗越大（推荐值：8-32）"
                  placement="right"
                >
                  <el-form-item prop="maximumScreenSpaceError" class="param-item">
                    <el-input-number
                      v-model="form4Cesium3DTilesParam.maximumScreenSpaceError"
                      :min="1"
                      :max="100"
                      :step="1"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-tooltip>
              </el-col>
            </el-row>
          </div>
        </div>
      </el-form>

      <!-- 错误提示信息 -->
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
        <el-button type="primary" :loading="loading" @click="loadCesium3DTiles(ruleFormRef)">
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
  ElDivider,
  ElRow,
  ElCol,
  ElTooltip,
  ElAlert,
  ElInputNumber,
  ElMessage,
} from 'element-plus'
import { usePanelStatusStore } from '@/stores/panelStatus'
import { storeToRefs } from 'pinia'
import { useLayerStore } from '@/stores/map/layerStore'
import { validateTilesetUrl } from '@/map/utils/ImageryLayerUtils'

const panelStatusStore = usePanelStatusStore()
const { visStatus4DialogCesium3DTilesParam } = storeToRefs(panelStatusStore)
const { closeDialogCesium3DTilesParam } = panelStatusStore

const ruleFormRef = ref(null)
const ref4InputUrl = ref(null)
const loading = ref(false)
const errorMessage = ref('')

const formLabelWidth = '140px'

const form4Cesium3DTilesParam = reactive({
  name: null,
  url: null,
  maximumScreenSpaceError: 16,
})

const placeholder4Form = {
  name: '例如：XXX 3DTiles 模型',
  url: '',
}

/**
 * 验证模型名称
 */
function checkName(rule, value, callback) {
  if (!value) {
    return callback(new Error('请输入模型名称'))
  }

  if (!value.trim()) {
    return callback(new Error('模型名称不能为空格'))
  }

  callback()
}

/**
 * 验证 Tileset URL
 */
function checkTilesetUrl(rule, value, callback) {
  if (!value) {
    return callback(new Error('请输入 tileset.json URL'))
  }

  if (!value.trim()) {
    return callback(new Error('URL 不能为空格'))
  }

  // 验证 URL 格式
  if (!validateTilesetUrl(value.trim())) {
    return callback(new Error('请输入有效的 URL 地址（应以 http:// 或 https:// 开头，以 .json 结尾）'))
  }

  callback()
}

/**
 * 验证屏幕空间误差
 */
function checkMaximumScreenSpaceError(rule, value, callback) {
  if (value < 1 || value > 100) {
    return callback(new Error('屏幕空间误差应在 1-100 之间'))
  }

  callback()
}

const rules = {
  name: [{ validator: checkName, trigger: 'blur' }],
  url: [{ validator: checkTilesetUrl, trigger: 'blur' }],
  maximumScreenSpaceError: [{ validator: checkMaximumScreenSpaceError, trigger: 'change' }],
}

/**
 * 对话框打开时的回调
 */
function dialogOpen() {
  // console.log('Dialog opened');
}

/**
 * 对话框打开完成后的回调
 */
function dialogOpened() {
  // console.log('Dialog opened completely');
  // 自动聚焦到 URL 输入框
  if (ref4InputUrl.value) {
    ref4InputUrl.value.focus()
  }
}

/**
 * 加载 Cesium 3DTiles 模型
 */
function loadCesium3DTiles(ruleFormRef) {
  if (!ruleFormRef) {
    console.log('ruleFormRef is null')
    return
  }

  // 清空之前的错误信息
  errorMessage.value = ''

  // 校验表单
  ruleFormRef.validate((isValid, invalidFields) => {
    console.log('form4Cesium3DTilesParam', form4Cesium3DTilesParam)

    if (isValid) {
      // 开始加载，设置loading状态
      loading.value = true

      // 如果有默认值的选项，未被设置，则在此设置默认值
      const _form = { ...form4Cesium3DTilesParam }
      if (!_form.name) {
        _form.name = placeholder4Form.name
      }

      // 构建 3DTiles 配置项
      const tileset3DOptions = {
        url: _form.url.trim(),
        maximumScreenSpaceError: _form.maximumScreenSpaceError,
      }

      console.log('提交表单', _form)
      console.log('3DTiles 选项', tileset3DOptions)

      // 调用加载 3DTiles 的方法，使用 Promise 链处理结果
      const layerStore = useLayerStore()
      layerStore
        .add3DTilesLayer(_form.name, tileset3DOptions)
        .then((layerId) => {
          // 模型加载成功
          console.log('3DTiles 模型加载成功，图层 ID:', layerId)
          ElMessage({
            type: 'success',
            message: `模型："${_form.name}" 加载成功`,
          })
          // 重置表单
          resetForm()
          // 关闭对话框
          closeDialogCesium3DTilesParam()
        })
        .catch(error => {
          // 模型加载失败
          errorMessage.value = error.message || '加载 3DTiles 模型失败，请检查 URL 和网络连接'
          console.error('加载 3DTiles 失败:', error)
        })
        .finally(() => {
          // 结束加载状态
          loading.value = false
        })
    } else {
      console.log('表单验证失败:', invalidFields)
    }
  })
}

/**
 * 重置表单
 */
function resetForm() {
  if (ruleFormRef.value) {
    ruleFormRef.value.resetFields()
    // 重置不在 resetFields 范围内的字段
    form4Cesium3DTilesParam.maximumScreenSpaceError = 16
    errorMessage.value = ''
  }
}

/**
 * 取消
 */
function cancel() {
  // 重置表单
  resetForm()
  // 关闭对话框
  closeDialogCesium3DTilesParam()
}

/**
 * 关闭对话框
 */
function handleClose(done) {
  resetForm()
  done()
}
</script>

<style scoped lang="scss">
.form-content {
  padding-right: 20px;

  .form-item-tips {
    display: flex;
    justify-content: flex-end;
    width: 100%;
    text-align: right;
    font-size: 12px;
    color: #909399;
    margin-bottom: 10px;

    &.form-item-tips-url {
      margin-top: 0px;
    }

    span {
      margin-right: 8px;
    }
  }

  .form-param-advanced {
    .param-section-name {
      margin: 20px 0;
    }

    .param-section-input {
      .param-item {
        font-size: 13px;
        color: #606266;
        margin-bottom: 12px;

        &:last-child {
          margin-bottom: 0;
        }

        &.param-item-disabled {
          color: #c0c4cc;
        }
      }
    }
  }
}

.dialog-footer {
  text-align: right;
}

.dialog-title {
  display: flex;
  align-items: center;

  span {
    margin-left: 8px;
  }
}
</style>
