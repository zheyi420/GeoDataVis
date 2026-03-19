<!--
 * @Author: zheyi420
 * @Date: 2024-12-15 03:28:42
 * @LastEditors: zheyi420
 * @LastEditTime: 2026-03-19
 * @FilePath: \GeoDataVis\src\views\panels\ToolBarLoadPanel.vue
 * @Description: 工具栏，用于加载数据的面板，包括加载数据服务、加载本地数据文件等
 *
-->

<template>
  <div class="toolbar-load-panel">
    <el-dropdown
      ref="ref4AddLoadTypeDropdown"
      trigger="hover"
      @visible-change="handleVisibleChange4AddLoadTypeDropdown"
    >
      <template v-slot:default>
        <span class="item">添加</span>
      </template>
      <template v-slot:dropdown>
        <el-cascader-panel
          ref="ref4AddLoadTypeCascaderPanel"
          :options="options4AddLoadType"
          :props="props4AddLoadTypeOnCascaderPanel"
          @change="handleChange4AddLoadType"
        />
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElDropdown, ElCascaderPanel } from 'element-plus';
import { usePanelStatusStore } from '@/stores/panelStatus';

const ref4AddLoadTypeDropdown = ref(null);
const ref4AddLoadTypeCascaderPanel = ref(null);
const props4AddLoadTypeOnCascaderPanel = {
  expandTrigger: 'hover',
}
const options4AddLoadType = [
  {
    value: 'Web Map',
    label: 'Web Map',
    children: [
      { value: 'WMS', label: 'WMS' },
      { value: 'WMTS', label: 'WMTS' },
    ],
  },
  {
    value: '3D-Data',
    label: '3D-Data',
    children: [
      { value: 'Cesium3DTiles', label: 'Cesium3DTiles' },
    ],
  },
  {
    value: 'DEM',
    label: 'DEM',
    children: [
      { value: 'CesiumTerrain', label: 'Cesium Terrain' },
    ],
  },
  { value: 'GeoJSON', label: 'GeoJSON' },
  { value: 'KML', label: 'KML/KMZ' },
]

function handleVisibleChange4AddLoadTypeDropdown(visible) {
  if (!visible) {
    ref4AddLoadTypeCascaderPanel.value.clearCheckedNodes();
  }
}

function handleChange4AddLoadType(value) {
  ref4AddLoadTypeDropdown.value.handleClose();
  ref4AddLoadTypeCascaderPanel.value.clearCheckedNodes();

  if (!value || value.length === 0) return;

  if (value.length === 2) {
    switch (value[0]) {
      case 'Web Map':
        _loadGeoServerService(value[1]);
        break;
      case '3D-Data':
        _load3DDataService(value[1]);
        break;
      case 'DEM':
        _loadDemService(value[1]);
        break;
      default:
        break;
    }
  } else if (value.length === 1) {
    if (value[0] === 'GeoJSON') {
      usePanelStatusStore().openDialogGeoJsonParam();
    } else if (value[0] === 'KML') {
      usePanelStatusStore().openDialogKmlParam();
    }
  }
}

function _loadGeoServerService(value) {
  switch (value) {
    case 'WMS':
      usePanelStatusStore().openDialogWmsServiceParam();
      break;
    case 'WMTS':
      usePanelStatusStore().openDialogWmtsServiceParam();
      break;
    default:
      break;
  }
}

/**
 * 处理 3D 数据服务加载
 * @param {string} value - 服务类型（如 'Cesium3DTiles'）
 */
function _load3DDataService(value) {
  console.log('###_load3DDataService value:', value);

  switch (value) {
    case 'Cesium3DTiles': {
      console.log('###加载服务-3D-Data-Cesium3DTiles');
      usePanelStatusStore().openDialogCesium3DTilesParam();
      break;
    }
    default: {
      console.log('###加载服务-3D-Data-未匹配', value);
      break;
    }
  }
}

/**
 * 处理 DEM 地形服务加载
 * @param {string} value - 服务类型（如 'CesiumTerrain'）
 */
function _loadDemService(value) {
  console.log('###_loadDemService value:', value);

  switch (value) {
    case 'CesiumTerrain': {
      console.log('###加载服务-DEM-CesiumTerrain');
      usePanelStatusStore().openDialogCesiumTerrainParam();
      break;
    }
    default: {
      console.log('###加载服务-DEM-未匹配', value);
      break;
    }
  }
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
