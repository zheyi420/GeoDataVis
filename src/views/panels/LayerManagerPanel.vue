<!--
 * @Author: zheyi420
 * @Date: 2025-04-14
 * @LastEditors: zheyi420 37471153+zheyi420@users.noreply.github.com
 * @LastEditTime: 2026-01-16
 * @FilePath: \GeoDataVis\src\views\panels\LayerManagerPanel.vue
 * @Description: 图层管理面板，显示加载的地图服务图层及地理数据文件图层
 *
-->

<template>
  <div class="layer-manager-panel" :class="{ collapsed }">
    <div class="panel-header">
      <h3>图层管理</h3>
      <el-button
        size="small"
        class="collapse-btn"
        @click="collapsed = !collapsed"
      >
        <el-icon>
          <ArrowUp v-show="!collapsed" />
          <ArrowDown v-show="collapsed" />
        </el-icon>
      </el-button>
    </div>

    <div v-show="!collapsed" class="panel-content">
      <!-- 图层分组 -->
      <el-collapse v-model="activeCollapses">
        <!-- 地图服务图层 -->
        <el-collapse-item title="地图服务图层" name="serviceLayers">
          <template #title>
            <div class="collapse-title">
              <el-icon><MapLocation /></el-icon>
              <span>地图服务图层</span>
            </div>
          </template>

          <div v-if="serviceLayers.length === 0" class="empty-tip">
            暂无图层，请从"服务"菜单加载
          </div>

          <el-table
            v-else
            :data="serviceLayers"
            size="small"
            style="width: 100%"
          >
            <el-table-column width="40">
              <template #default="scope">
                <el-checkbox
                  v-model="scope.row.visible"
                  @change="toggleLayerVisibility(scope.row)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="name" label="图层名称" />
            <el-table-column width="90">
              <template #default="scope">
                <el-popover
                  v-model:visible="layerPopovers[scope.row.id]"
                  placement="right"
                  width="fit-content"
                  trigger="click"
                >
                  <template #reference>
                    <el-button size="small">
                      <el-icon><Setting /></el-icon>
                    </el-button>
                  </template>
                  <div class="layer-options">
                    <!-- 3DTiles 模型专用选项 -->
                    <template v-if="scope.row.sourceType === 'Cesium3DTiles'">
                      <div class="option-item">
                        <el-checkbox
                          v-model="scope.row.debugShowBoundingVolume"
                          @change="toggle3DTilesDebugOption(scope.row, 'debugShowBoundingVolume')"
                        >debugShowBoundingVolume</el-checkbox>
                      </div>
                      <div class="option-item">
                        <el-checkbox
                          v-model="scope.row.debugShowContentBoundingVolume"
                          @change="toggle3DTilesDebugOption(scope.row, 'debugShowContentBoundingVolume')"
                        >debugShowContentBoundingVolume</el-checkbox>
                      </div>
                      <div class="option-item">
                        <el-checkbox
                          v-model="scope.row.showBoundingSphere"
                          @change="toggle3DTilesBoundingSphere(scope.row)"
                        >包围球（BoundingSphere）</el-checkbox>
                      </div>
                      <div class="option-item">
                        <el-checkbox
                          v-model="scope.row.showOrientedBoundingBox"
                          @change="toggle3DTilesOrientedBoundingBox(scope.row)"
                        >包围盒（OrientedBoundingBox）</el-checkbox>
                      </div>
                      <div class="option-item">
                        <el-checkbox
                          v-model="scope.row.showLocalAxes"
                          @change="toggle3DTilesLocalAxes(scope.row)"
                        >3DTiles 模型本地坐标轴</el-checkbox>
                      </div>
                      <div class="option-item">
                        <span>透明度:</span>
                        <el-slider
                          v-model="scope.row.opacity"
                          :min="0"
                          :max="1"
                          :step="0.01"
                          @change="update3DTilesOpacity(scope.row)"
                        />
                      </div>
                    </template>

                    <!-- 其他图层类型（WMS/WMTS）的透明度选项 -->
                    <template v-else>
                      <div class="option-item">
                        <span>透明度:</span>
                        <el-slider
                          v-model="scope.row.opacity"
                          :min="0"
                          :max="1"
                          :step="0.01"
                          @change="updateLayerOpacity(scope.row)"
                        />
                      </div>
                    </template>

                    <!-- 移除按钮（所有类型通用） -->
                    <el-button
                      type="danger"
                      size="small"
                      @click="removeLayer(scope.row)"
                    >
                      移除图层
                    </el-button>
                  </div>
                </el-popover>
              </template>
            </el-table-column>
          </el-table>
        </el-collapse-item>

        <!-- 地理数据文件图层 -->
        <el-collapse-item title="地理数据文件图层" name="fileLayers">
          <template #title>
            <div class="collapse-title">
              <el-icon><Document /></el-icon>
              <span>地理数据文件图层</span>
            </div>
          </template>

          <div v-if="fileLayers.length === 0" class="empty-tip">
            暂无图层，请从"文件"菜单加载
          </div>

          <el-table
            v-else
            :data="fileLayers"
            size="small"
            style="width: 100%"
          >
            <el-table-column width="40">
              <template #default="scope">
                <el-checkbox
                  v-model="scope.row.visible"
                  @change="toggleLayerVisibility(scope.row)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="name" label="图层名称" />
            <el-table-column width="90">
              <template #default="scope">
                <el-popover
                  v-model:visible="layerPopovers[scope.row.id]"
                  placement="left"
                  :width="200"
                  trigger="click"
                >
                  <template #reference>
                    <el-button size="small">
                      <el-icon><Setting /></el-icon>
                    </el-button>
                  </template>
                  <div class="layer-options">
                    <div class="option-item">
                      <span>透明度:</span>
                      <el-slider
                        v-model="scope.row.opacity"
                        :min="0"
                        :max="1"
                        :step="0.01"
                        @change="updateLayerOpacity(scope.row)"
                      />
                    </div>
                    <el-button
                      type="danger"
                      size="small"
                      @click="removeLayer(scope.row)"
                    >
                      移除图层
                    </el-button>
                  </div>
                </el-popover>
              </template>
            </el-table-column>
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useLayerStore } from '@/stores/map/layerStore';
import { ElIcon, ElButton, ElCollapse, ElCollapseItem, ElCheckbox, ElSlider, ElTable, ElTableColumn, ElPopover } from 'element-plus';
import { ArrowUp, ArrowDown, MapLocation, Document, Setting } from '@element-plus/icons-vue';

// 控制面板折叠状态
const collapsed = ref(false);
// 控制图层类别折叠状态
const activeCollapses = ref(['serviceLayers', 'fileLayers']);

// 独立管理每个图层的弹窗状态
const layerPopovers = ref({});

// 使用图层管理的store
const layerStore = useLayerStore();

const serviceLayers = computed(() => layerStore.getServiceLayers());
const fileLayers = computed(() => layerStore.getFileLayers());

onMounted(() => {});

// 切换图层可见性
function toggleLayerVisibility(layer) {
  layerStore.setLayerVisibility(layer.id, layer.visible);
}

// 更新图层透明度
function updateLayerOpacity(layer) {
  layerStore.setLayerOpacity(layer.id, layer.opacity);
}

// 移除图层
function removeLayer(layer) {
  // 先关闭弹框
  layerPopovers.value[layer.id] = false;
  // 再移除图层
  layerStore.removeLayer(layer.id);
  // 清理弹窗状态
  delete layerPopovers.value[layer.id];
}

// 切换 3DTiles 调试选项
function toggle3DTilesDebugOption(layer, type) {
  const options = {};
  if (type === 'debugShowBoundingVolume') {
    options.debugShowBoundingVolume = layer.debugShowBoundingVolume;
  } else if (type === 'debugShowContentBoundingVolume') {
    options.debugShowContentBoundingVolume = layer.debugShowContentBoundingVolume;
  }
  layerStore.set3DTilesDebugOptions(layer.id, options);
}

// 切换 3DTiles 包围球显示
function toggle3DTilesBoundingSphere(layer) {
  layerStore.set3DTilesBoundingSphere(layer.id, layer.showBoundingSphere);
}

// 切换 3DTiles 包围盒显示
function toggle3DTilesOrientedBoundingBox(layer) {
  layerStore.set3DTilesOrientedBoundingBox(layer.id, layer.showOrientedBoundingBox);
}

// 切换 3DTiles 本地坐标轴显示
function toggle3DTilesLocalAxes(layer) {
  layerStore.set3DTilesLocalAxes(layer.id, layer.showLocalAxes);
}

// 更新 3DTiles 透明度
function update3DTilesOpacity(layer) {
  layerStore.set3DTilesOpacity(layer.id, layer.opacity);
}
</script>

<style scoped lang="scss">
.layer-manager-panel {
  background-color: #fff;
  border-right: 1px solid #e0e0e0;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: all 0.3s ease;
  width: 300px;

  &.collapsed {
    height: fit-content;

    .panel-content {
      display: none;
    }
  }

  .panel-header {
    align-items: center;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-between;
    padding: 8px 16px;
    background-color: #fff;
    z-index: 1;

    h3 {
      font-size: 16px;
      margin: 0;
    }
  }

  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 8px;

    .el-collapse {
      border-top: none;
    }
  }

  .collapse-title {
    align-items: center;
    display: flex;
    gap: 8px;
  }

  .empty-tip {
    color: #909399;
    font-size: 14px;
    padding: 8px 0;
    text-align: center;
  }

  .layer-options {
    .option-item {
      display: flex;
      flex-direction: column;
      margin-bottom: 12px;
    }
  }
}
</style>
