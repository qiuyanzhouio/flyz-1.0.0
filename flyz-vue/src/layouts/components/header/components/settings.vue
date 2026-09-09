<template>
  <Drawer v-model="appStore.appSettingsDrawer"
          location="right"
          temporary
          :width="360">
    <div class="p-4 pb-2 text-base font-bold">
      配置中心
    </div>
    <div class="flyz-divider"></div>
    <div class="p-4">
      <Form ref="formRef"
            v-model:form="formConfig.form"
            :form-columns="formConfig.columns"
            class="flex flex-col gap-4"
            fast-fail></Form>
    </div>
    <div class="p-3 flex gap-2">
      <button type="button"
              class="flyz-btn flyz-btn-primary flex-1"
              @click="formConfig.handleValidate">
        确认
      </button>
    </div>
  </Drawer>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useAppStore } from '@/register/stores/app.js'
import Form from '@/components/form.vue'
import Drawer from '@/components/drawer.vue'

const appStore = useAppStore()

const formRef = ref()
const formConfig = reactive({
  form: {
    ...appStore.settings,
  },
  columns: [
    {
      label: '页头',
      key: 'header',
      componentsType: 'v-number-input',
      rules: [
        (value) => value >= 0 && value <= 100 || '页头高度必须在0-100之间',
      ],
      min: 0,
      max: 100,
    },
    {
      label: '菜单',
      key: 'menus',
      componentsType: 'v-select',
      itemTitle: 'label',
      itemValue: 'value',
      items: [
        {
          label: 'none',
          value: 0,
        },
        {
          label: 'mini',
          value: 56,
        },
        {
          label: 'small',
          value: 245,
        },
        {
          label: 'large',
          value: 320,
        },
      ],
      rules: [
        (value) => value >= 0 && value <= 500 || '菜单宽度必须在0-500之间',
      ],
      min: 0,
      max: 500,
    },
    {
      label: '标签页',
      key: 'tabs',
      componentsType: 'v-number-input',
      rules: [
        (value) => value >= 0 && value <= 100 || '标签页高度必须在0-100之间',
      ],
      min: 0,
      max: 100,
    },
    {
      label: '页脚',
      key: 'footer',
      componentsType: 'v-number-input',
      rules: [
        (value) => value >= 0 && value <= 100 || '页脚高度必须在0-100之间',
      ],
      min: 0,
      max: 100,
    },
  ],
  async handleValidate() {
    const { valid } = await formRef.value.validate()
    if (valid) {
      appStore.updateSettings(formConfig.form)
      appStore.appSettingsDrawer = false
    }
  },
})
</script>
