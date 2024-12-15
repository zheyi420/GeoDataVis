<!--
 * @Author: zheyi420
 * @Date: 2024-12-15 03:28:42
 * @LastEditors: zheyi420
 * @LastEditTime: 2024-12-15 15:48:45
 * @FilePath: \GeoDataVis\src\views\panels\ToolBarLoadPanel.vue
 * @Description: 工具栏，用于加载数据的面板，包括加载数据服务、加载本地数据文件等
 * 
-->

<template>
  <div class="toolbar-load-panel">

    <el-dropdown
      ref="ref4ServiceLoadTypeDropdown"
      trigger="click"
    >
      <template v-slot:default>
        <span class="item">加载服务</span>
      </template>
      <template v-slot:dropdown>
        <el-cascader-panel
          v-model="selectedValue4ServiceLoadType"
          :options="options4ServiceLoadType"
          :props="props4ServiceLoadTypeOnCascaderPanel"
          @change="handleChange4ServiceLoadType"
        />
      </template>
    </el-dropdown>
    <el-dropdown
      ref="ref4FileLoadTypeDropdown"
      trigger="hover"
    >
      <template v-slot:default>
        <span class="item">加载文件</span>
      </template>
      <template v-slot:dropdown>
        <el-cascader-panel
          v-model="selectedValue4FileLoadType"
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

const ref4ServiceLoadTypeDropdown = ref(null);
const selectedValue4ServiceLoadType = ref(null) // 用于存储选中的值;
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
  {
    value: 'DEM',
    label: 'DEM',
  }
]

function handleChange4ServiceLoadType(value) {
  console.log('###handleChange4ServiceLoadType value', value);
  console.log('###handleChange4ServiceLoadType selectedValue4ServiceLoadType', selectedValue4ServiceLoadType.value);

  // 关闭下拉菜单
  ref4ServiceLoadTypeDropdown.value.handleClose();

  // 清除选中的值
  selectedValue4ServiceLoadType.value = [];

}

const ref4FileLoadTypeDropdown = ref(null);
const selectedValue4FileLoadType = ref(null)
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
function handleChange4FileLoadType(value) {
  console.log('###handleChange4FileLoadType value', value);
  console.log('###handleChange4FileLoadType selectedValue4FileLoadType', selectedValue4FileLoadType.value);

  // 关闭下拉菜单
  ref4FileLoadTypeDropdown.value.handleClose();

  // 清除选中的值
  selectedValue4FileLoadType.value = [];
}

</script>

<style scoped lang="scss">
.toolbar-load-panel {
  display: flex;
  background-color: #f0f0f0;
  height: 40px;
  width: fit-content;

  .item {
    padding: 0 7px;
    width: fit-content;
    font-size: 17px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}


</style>

<style>
.el-cascader-node__prefix {
  display: none !important;
}
</style>

