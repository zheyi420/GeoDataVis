<!--
 * @Author: zheyi420
 * @Date: 2026-02-27
 * @FilePath: \GeoDataVis\src\views\panels\DialogCesiumTerrainParam.vue
 * @Description: Cesium Terrain 地形服务加载对话框
 *
-->

<template>
  <el-dialog
    v-model="visStatus4DialogCesiumTerrainParam"
    class="dialog-cesium-terrain-param"
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
        <span>加载 Cesium Terrain 地形</span>
      </div>
    </template>
    <template v-slot:default>
      <el-form
        ref="ruleFormRef"
        class="form-content"
        :model="form4CesiumTerrainParam"
        :rules="rules"
      >
        <el-form-item label="地形名称" :label-width="formLabelWidth" prop="name">
          <el-input
            v-model="form4CesiumTerrainParam.name"
            autocomplete="off"
            :placeholder="placeholder4Form.name"
          />
        </el-form-item>

        <el-form-item label="地形服务根 URL" :label-width="formLabelWidth" prop="url">
          <el-input
            ref="ref4InputUrl"
            v-model="form4CesiumTerrainParam.url"
            autocomplete="off"
            type="textarea"
            :rows="3"
            :placeholder="placeholder4Form.url"
          />
        </el-form-item>

        <!-- URL 说明 -->
        <div ref="ref4InputUrlTip" class="form-item-tips form-item-tips-url">
          <span>示例：</span>
          <span>https://data.mars3d.cn/terrain</span>
          <span>（Cesium 会自动请求 layer.json）</span>
        </div>

        <!-- 高级参数 -->
        <div class="form-param-advanced">
          <div class="param-section-name">
            <el-divider content-position="center">高级参数（可选）</el-divider>
          </div>
          <div class="param-section-input">
            <el-form-item prop="requestVertexNormals" class="param-item">
              <el-checkbox v-model="form4CesiumTerrainParam.requestVertexNormals">
                请求顶点法线（用于地形光照）
              </el-checkbox>
            </el-form-item>
            <el-form-item prop="requestWaterMask" class="param-item">
              <el-checkbox v-model="form4CesiumTerrainParam.requestWaterMask">
                请求水面遮罩（用于水面效果）
              </el-checkbox>
            </el-form-item>
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
        <el-button type="primary" :loading="loading" @click="loadCesiumTerrain(ruleFormRef)">
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
  ElCheckbox,
  ElAlert,
  ElMessage,
} from 'element-plus'
import { usePanelStatusStore } from '@/stores/panelStatus'
import { storeToRefs } from 'pinia'
import { useTerrainStore } from '@/stores/map/terrainStore'
import { createCesiumTerrainProvider } from '@/map/utils/ImageryLayerUtils'

const panelStatusStore = usePanelStatusStore()
const { visStatus4DialogCesiumTerrainParam } = storeToRefs(panelStatusStore)
const { closeDialogCesiumTerrainParam } = panelStatusStore

const ruleFormRef = ref(null)
const ref4InputUrl = ref(null)
const loading = ref(false)
const errorMessage = ref('')

const formLabelWidth = '140px'

const form4CesiumTerrainParam = reactive({
  name: null,
  url: null,
  requestVertexNormals: false,
  requestWaterMask: false,
})

const placeholder4Form = {
  name: '例如：Cesium World Terrain',
  url: '',
}

/**
 * 验证地形名称
 */
function checkName(rule, value, callback) {
  if (!value) {
    return callback(new Error('请输入地形名称'))
  }

  if (!value.trim()) {
    return callback(new Error('地形名称不能为空格'))
  }

  callback()
}

/**
 * 验证地形服务 URL
 */
function checkTerrainUrl(rule, value, callback) {
  if (!value) {
    return callback(new Error('请输入地形服务根 URL'))
  }

  if (!value.trim()) {
    return callback(new Error('URL 不能为空格'))
  }

  if (!/^https?:\/\/.+/i.test(value.trim())) {
    return callback(new Error('请输入有效的 URL 地址（应以 http:// 或 https:// 开头）'))
  }

  callback()
}

const rules = {
  name: [{ validator: checkName, trigger: 'blur' }],
  url: [{ validator: checkTerrainUrl, trigger: 'blur' }],
}

/**
 * 对话框打开时的回调
 */
function dialogOpen() {}

/**
 * 对话框打开完成后的回调
 */
function dialogOpened() {
  if (ref4InputUrl.value) {
    ref4InputUrl.value.focus()
  }
}

/**
 * 加载 Cesium Terrain 地形
 */
function loadCesiumTerrain(ruleFormRef) {
  if (!ruleFormRef) {
    return
  }

  errorMessage.value = ''

  ruleFormRef.validate((isValid, invalidFields) => {
    if (isValid) {
      loading.value = true

      const _form = { ...form4CesiumTerrainParam }
      if (!_form.name) {
        _form.name = placeholder4Form.name
      }

      const terrainOptions = {
        url: _form.url.trim(),
        requestVertexNormals: _form.requestVertexNormals,
        requestWaterMask: _form.requestWaterMask,
      }

      createCesiumTerrainProvider(terrainOptions)
        .then((provider) => {
          const terrainStore = useTerrainStore()
          terrainStore.addTerrain(_form.name, provider, terrainOptions)
          ElMessage({
            type: 'success',
            message: `地形："${_form.name}" 加载成功`,
          })
          resetForm()
          closeDialogCesiumTerrainParam()
        })
        .catch((error) => {
          errorMessage.value = error.message || '加载地形失败，请检查 URL 和网络连接'
          console.error('加载 Cesium Terrain 失败:', error)
        })
        .finally(() => {
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
    form4CesiumTerrainParam.requestVertexNormals = false
    form4CesiumTerrainParam.requestWaterMask = false
    errorMessage.value = ''
  }
}

/**
 * 取消
 */
function cancel() {
  resetForm()
  closeDialogCesiumTerrainParam()
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
  display: flex;
  flex-direction: column;
  gap: 10px;

  .form-item-tips {
    // display: flex;
    // flex-wrap: wrap;
    // justify-content: flex-end;
    // width: 100%;
    // text-align: right;
    // font-size: 12px;
    // color: #909399;
    // margin-bottom: 10px;

    align-self: flex-end;
    width: fit-content;
    font-size: 12px;
    color: #606266;
    margin-top: -10px;
    gap: 8px;

    &.form-item-tips-url {
      user-select: text;
      -webkit-user-select: text;
      -moz-user-select: text;
      -ms-user-select: text;
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

<style lang="scss">
.dialog-cesium-terrain-param {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
</style>
