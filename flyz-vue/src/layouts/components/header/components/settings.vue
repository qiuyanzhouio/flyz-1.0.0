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
            fast-fail>
        <!-- 主题模式：白天 / 黑夜 -->
        <template #theme="{ form }">
          <div class="flex gap-2">
            <button v-for="opt in themeOptions"
                    :key="opt.value"
                    type="button"
                    class="flyz-btn flex-1 transition-colors duration-150"
                    :class="form.theme === opt.value
                      ? 'border-brand-500 bg-brand-500/15 text-ink-100 ring-1 ring-brand-500/40'
                      : 'border-surface-border bg-field text-ink-300 hover:text-ink-100'"
                    @click="applyTheme('theme', opt.value)">
              <i :class="opt.icon"></i>
              {{ opt.label }}
            </button>
          </div>
        </template>

        <!-- 主题色：默认 / 蓝色 / 紫色 / 绿色 -->
        <template #themeColor="{ form }">
          <div class="flex items-center justify-between px-1 gap-2">
            <div v-for="c in colorOptions"
                 :key="c.value"
                 :title="c.label"
                 class="flex flex-col items-center gap-1.5 cursor-pointer group"
                 @click="applyTheme('themeColor', c.value)">
              <span class="relative w-7 h-7 rounded-full border border-solid border-surface-border transition-transform duration-150 group-hover:scale-110"
                    :class="form.themeColor === c.value ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-surface' : ''"
                    :style="{background: c.color}"></span>
              <span class="text-xs"
                    :class="form.themeColor === c.value ? 'text-ink-100' : 'text-ink-400'">
                {{ c.label }}
              </span>
            </div>
          </div>
        </template>
      </Form>
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

// 主题模式选项
const themeOptions = [
  { label: '白天', value: 'light', icon: 'i-mdi-weather-sunny' },
  { label: '黑夜', value: 'dark', icon: 'i-mdi-weather-night' },
]

// 主题色选项（swatch 颜色与 CSS 变量色板保持一致）
const colorOptions = [
  { label: '默认', value: 'default', color: 'linear-gradient(135deg, #3b82f6, #6366f1)' },
  { label: '蓝色', value: 'blue', color: '#1e70fe' },
  { label: '紫色', value: 'purple', color: '#8b5cf6' },
  { label: '绿色', value: 'green', color: '#22c55e' },
]

// 主题相关配置即时生效（无需等待“确认”）
function applyTheme(key, value) {
  formConfig.form[key] = value
  appStore.updateSettings({ [key]: value })
}

const formConfig = reactive({
  form: {
    ...appStore.settings,
  },
  columns: [
    {
      label: '外观',
      key: 'appearance-section',
      componentsType: 'title',
    },
    {
      label: '主题模式',
      key: 'theme',
      componentsType: 'slot',
    },
    {
      label: '主题色',
      key: 'themeColor',
      componentsType: 'slot',
    },
    {
      label: '布局',
      key: 'layout-section',
      componentsType: 'title',
    },
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

<!-- DEBUG-HMR-TEST -->
