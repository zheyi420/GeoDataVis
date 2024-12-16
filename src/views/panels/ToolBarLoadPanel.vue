<!--
 * @Author: zheyi420
 * @Date: 2024-12-15 03:28:42
 * @LastEditors: zheyi420
 * @LastEditTime: 2024-12-17 01:49:12
 * @FilePath: \GeoDataVis\src\views\panels\ToolBarLoadPanel.vue
 * @Description: 工具栏，用于加载数据的面板，包括加载数据服务、加载本地数据文件等
 * 
-->

<template>
  <div class="toolbar-load-panel">
    <!-- 加载服务 -->
    <el-dropdown
      ref="ref4ServiceLoadTypeDropdown"
      trigger="hover"
      @visible-change="handleVisibleChange4ServiceLoadTypeDropdown"
    >
      <template v-slot:default>
        <span class="item">服务</span>
      </template>
      <template v-slot:dropdown>
        <el-cascader-panel
          ref="ref4ServiceLoadTypeCascaderPanel"
          :options="options4ServiceLoadType"
          :props="props4ServiceLoadTypeOnCascaderPanel"
          @change="handleChange4ServiceLoadType"
        />
      </template>
    </el-dropdown>
    <!-- 加载文件 -->
    <el-dropdown
      ref="ref4FileLoadTypeDropdown"
      trigger="hover"
      @visible-change="handleVisibleChange4FileLoadTypeDropdown"
    >
      <template v-slot:default>
        <span class="item">文件</span>
      </template>
      <template v-slot:dropdown>
        <el-cascader-panel
          ref="ref4FileLoadTypeCascaderPanel"
          :options="options4FileLoadType"
          :props="props4FileLoadTypeOnCascaderPanel"
          @change="handleChange4FileLoadType"
        />
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElDropdown, ElCascaderPanel } from 'element-plus';

/** 加载服务 */
const ref4ServiceLoadTypeDropdown = ref(null);
const ref4ServiceLoadTypeCascaderPanel = ref(null);
const props4ServiceLoadTypeOnCascaderPanel = {
  expandTrigger: 'hover',
}
const options4ServiceLoadType = [
  {
    value: 'GeoServer',
    label: 'GeoServer',
    children: [
      {
        value: 'WMS',
        label: 'WMS',
        
      },
      {
        value: 'WMTS',
        label: 'WMTS',
      },
    ],
  },
  {
    value: '3D-Data',
    label: '3D-Data',
    children: [
      {
        value: 'Cesium3DTiles',
        label: 'Cesium3DTiles',
      }
    ],
  },
]

function handleVisibleChange4ServiceLoadTypeDropdown(visible) {
  console.log('###服务“下拉列表visible-change', visible);

  
  console.log('ref4ServiceLoadTypeDropdown.value', ref4ServiceLoadTypeDropdown.value);
  console.log('ref4ServiceLoadTypeCascaderPanel.value', ref4ServiceLoadTypeCascaderPanel.value);
  
  if (visible) {
    
    // ref4ServiceLoadTypeDropdown.value.$el.classList.add('is-hover');
  } else {
    // 关闭下拉菜单时，清空展开节点记录
    ref4ServiceLoadTypeCascaderPanel.value.clearCheckedNodes();
    // ref4ServiceLoadTypeDropdown.value.$el.classList.remove('is-hover');
    // ref4ServiceLoadTypeCascaderPanel.value.$el.blur();
    // ref4ServiceLoadTypeDropdown.value.$el.blur();
    /* setTimeout(() => {
      ref4ServiceLoadTypeDropdown.value.$el.blur();
    }, 0); */
  }
}
function handleChange4ServiceLoadType(value) {
  console.log('###handleChange4ServiceLoadType value', value);

  // 关闭下拉菜单
  ref4ServiceLoadTypeDropdown.value.handleClose();
  // 清空选中的节点
  ref4ServiceLoadTypeCascaderPanel.value.clearCheckedNodes();

}

/** 加载文件 */
const ref4FileLoadTypeDropdown = ref(null);
const ref4FileLoadTypeCascaderPanel = ref(null);
const options4FileLoadType = [
  {
    value: 'GeoJSON',
    label: 'GeoJSON',
  },
  {
    value: 'Shapefile',
    label: 'Shapefile',
  }
]
const props4FileLoadTypeOnCascaderPanel = {
  expandTrigger: 'hover',
}
function handleVisibleChange4FileLoadTypeDropdown(visible) {
  console.log('###文件“下拉列表visible-change', visible);

  if (visible) {
    console.log('ref4FileLoadTypeDropdown.value', ref4FileLoadTypeDropdown.value);
    
    // ref4FileLoadTypeDropdown.value.classList.add('is-hover');
  } else {
    // 关闭下拉菜单时，清空展开节点记录
    ref4FileLoadTypeCascaderPanel.value.clearCheckedNodes();
    // ref4FileLoadTypeDropdown.value.classList.remove('is-hover');
  }
}
function handleChange4FileLoadType(value) {
  console.log('###handleChange4FileLoadType value', value);

  // 关闭下拉菜单
  ref4FileLoadTypeDropdown.value.handleClose();
  // 清空选中的节点
  ref4FileLoadTypeCascaderPanel.value.clearCheckedNodes();
}


</script>

<style scoped lang="scss">
.toolbar-load-panel {
  display: flex;
  background-color: #f0f0f0;
  height: 40px;
  width: fit-content;

  .el-dropdown {

    &:focus-visible {
      outline: none;
    }
    
    // &.is-hover,
    /* &:focus-within,
    &:hover {
      background-color: #34495e;
      color: #fff;
    } */

    /* &:not(:hover):not(:focus-within) {
      background-color: #f0f0f0;
      color: #000;
    } */
  }

  .item {
    padding: 0 7px;
    width: fit-content;
    font-size: 17px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:focus-visible {
      outline: none;
    }

    /* &:hover {
      background-color: #34495e;
      color: #fff;
    } */
  }
}
</style>

<style lang="scss">
.el-cascader-node__prefix {
  display: none !important;
}
.el-cascader-node {
  --el-cascader-node-background-hover: #34495e;

  &:not(.is-disabled):focus {
    background: unset;
  }

  &:not(.is-disabled):hover {
    background: var(--el-cascader-node-background-hover);
    color: #fff;
  }

  &.in-active-path {
    background: var(--el-cascader-node-background-hover);
  }

  &.in-active-path,
  &.is-active {
    color: #fff;
    font-weight: unset;
  }
}
</style>

