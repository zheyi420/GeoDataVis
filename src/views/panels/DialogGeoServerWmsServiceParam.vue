<template>
  <el-dialog v-model="visStatus4DialogGeoServerWmsServiceParam" title="创建新的 WMS 连接" width="500">
    <el-form :model="form">
      <el-form-item label="Promotion name" :label-width="formLabelWidth">
        <el-input v-model="form.name" autocomplete="off" />
      </el-form-item>
      <el-form-item label="Zones" :label-width="formLabelWidth">
        <el-select v-model="form.region" placeholder="Please select a zone">
          <el-option label="Zone No.1" value="shanghai" />
          <el-option label="Zone No.2" value="beijing" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialogGeoServerWmsServiceParam">Cancel</el-button>
        <el-button type="primary" @click="closeDialogGeoServerWmsServiceParam">
          Confirm
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElButton } from 'element-plus';
import { usePanelStatusStore } from '@/stores/panelStatus';
import { storeToRefs } from 'pinia';

const panelStatusStore = usePanelStatusStore();
const { visStatus4DialogGeoServerWmsServiceParam } = storeToRefs(panelStatusStore);
const { closeDialogGeoServerWmsServiceParam } = panelStatusStore;

const form = reactive({
  name: '',
  region: '',
});
const formLabelWidth = '140px';

</script>

<style scoped>

</style>