<template>
  <div ref="formRef" v-bind="$attrs" class="flex flex-wrap gap-y-2 gap-x-2">
    <template v-for="item in visibleColumns" :key="item.key">
      <div v-if="item.componentsType === 'title'" class="w-full text-left text-[12px] text-slate-200 border-b border-slate-200">
        {{ item.label }}
      </div>
      <!-- slot 类型: 用户自定义内容 -->
      <FormItem v-else-if="item.componentsType === 'slot'"
                :class="item?.class"
                :label="item?.label"
                :label-direction="labelDirection"
                :error="validation.errors[item.key]">
        <slot :name="item.key" :form="form"></slot>
      </FormItem>

      <!-- code 类型: 自定义 CodeEditor 组件 -->
      <FormItem v-else-if="item.componentsType === 'v-code'"
                :class="item?.class"
                class="!w-full"
                :label="item?.label"
                :label-direction="labelDirection"
                :error="validation.errors[item.key]">
        <CodeEditor v-model="form[item.key]"
                    :initial-language="form[item.key + '_language']"
                    :full="false"
                    v-bind="item.nativeAttrs"></CodeEditor>
      </FormItem>

      <!-- radio 类型: 原生 HTML radio -->
      <FormItem v-else-if="item.componentsType === 'v-radio'"
                :class="item?.class"
                :label="item?.label"
                :label-direction="labelDirection"
                :error="validation.errors[item.key]">
        <label v-for="(it, itIndex) in item.items"
               :key="itIndex"
               class="cursor-pointer">
          <input v-model="form[item.key]"
                 type="radio"
                 :name="it[item.itemTitle]"
                 :value="it[item.itemValue]"
                 v-bind="item.nativeAttrs">
          {{ it[item.itemTitle] }}
        </label>
      </FormItem>

      <!-- checkbox 类型: 原生 HTML checkbox -->
      <FormItem v-else-if="item.componentsType === 'v-checkbox'"
                :class="item?.class"
                :label="item?.label"
                :label-direction="labelDirection"
                :error="validation.errors[item.key]">
        <div class="flex-1 flex items-center flex-wrap gap-2 px-4 py-6">
          <label v-for="(it, itIndex) in item.items"
                 :key="itIndex"
                 class="inline-flex items-center gap-1 cursor-pointer">
            <input type="checkbox"
                   :name="it[item.itemTitle]"
                   :checked="arrayValue.isChecked(item, it)"
                   @change="e => arrayValue.toggle(item, it, e)">
            <span>{{ it[item.itemTitle] }}</span>
          </label>
        </div>
      </FormItem>

      <!-- v-input 类型: 原生 HTML input -->
      <FormItem v-else-if="item.componentsType === 'v-input'"
                :class="item?.class"
                :label="item?.label"
                :label-direction="labelDirection"
                :error="validation.errors[item.key]">
        <input v-model="form[item.key]"
               :type="item.type"
               :class="['flex-1 flyz-field', item.type === 'datetime-local' ? '[&::-webkit-calendar-picker-indicator]:cursor-pointer' : '']"
               :placeholder="item.placeholder || '...'"
               v-bind="item.nativeAttrs">
      </FormItem>

      <!-- v-textarea 类型: 原生 HTML textarea -->
      <FormItem v-else-if="item.componentsType === 'v-textarea'"
                :class="item?.class"
                :label="item?.label"
                :label-direction="labelDirection"
                :error="validation.errors[item.key]">
        <textarea v-model="form[item.key]"
                  :class="['flex-1 flyz-field-textarea', { 'auto-grow': item.autoGrow }]"
                  :placeholder="item.placeholder || '...'"
                  rows="3"
                  v-bind="item.nativeAttrs">
        </textarea>
      </FormItem>

      <!-- v-number-input 类型: 原生 HTML number input -->
      <FormItem v-else-if="item.componentsType === 'v-number-input'"
                :class="item?.class"
                :label="item?.label"
                :label-direction="labelDirection"
                :error="validation.errors[item.key]">
        <input v-model="form[item.key]"
               type="number"
               class="flex-1 flyz-field"
               :placeholder="item.placeholder || '...'"
               v-bind="item.nativeAttrs">
      </FormItem>

      <!-- v-select 类型: 原生 HTML select / 多选下拉 -->
      <FormItem v-else-if="item.componentsType === 'v-select'"
                :class="item?.class"
                :label="item?.label"
                :label-direction="labelDirection"
                :error="validation.errors[item.key]">
        <!-- multiple: 自定义下拉多选 -->
        <div v-if="item.multiple"
             class="select-wrapper flex-1 relative min-h-[32px]"
             :class="{ 'is-empty': !selectConfig.getDisplayText(item) }"
             :data-placeholder="item.placeholder || '请选择'">
          <div class="flyz-field w-full min-h-[32px] cursor-pointer truncate"
               tabindex="0"
               @click="selectConfig.toggle(item.key)"
               @blur="selectConfig.closeAll()">
            {{ selectConfig.getDisplayText(item) }}
          </div>
          <div v-if="selectConfig.dropdownOpen[item.key]"
               class="absolute z-10 w-full mt-1 bg-surface rounded shadow-lg max-h-48 overflow-auto"
               @mousedown.prevent>
            <label v-for="(it, itIndex) in item.items"
                   :key="itIndex"
                   class="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-primary-light">
              <input type="checkbox"
                     :checked="arrayValue.isChecked(item, it)"
                     @change="e => arrayValue.toggle(item, it, e, item.onChange)">
              <span>{{ it[item.itemTitle] }}</span>
            </label>
          </div>
        </div>
        <!-- single: 原生 HTML select -->
        <div v-else
             class="select-wrapper flex-1 relative"
             :class="{ 'is-empty': form[item.key] == null || form[item.key] === '' }"
             :data-placeholder="item.placeholder || '请选择'">
          <select v-model="form[item.key]"
                  class="flyz-field-select"
                  v-bind="item.nativeAttrs">
            <option v-for="(it, itIndex) in item.items"
                    :key="itIndex"
                    :value="it[item.itemValue]">
              {{ it[item.itemTitle] }}
            </option>
          </select>
        </div>
      </FormItem>

      <!-- v-combobox 类型: 原生 HTML input + 可选下拉列表 -->
      <FormItem v-else-if="item.componentsType === 'v-combobox'"
                :class="item?.class"
                :label="item?.label"
                :label-direction="labelDirection"
                :error="validation.errors[item.key]">
        <div class="flex-1 relative">
          <input type="text"
                 :value="comboboxConfig.getValue(item)"
                 class="flyz-field w-full"
                 :placeholder="item.placeholder || '...'"
                 @focus="comboboxConfig.open(item.key)"
                 @input="e => comboboxConfig.handleInput(item, e.target.value)"
                 @blur="comboboxConfig.close">
          <div v-if="comboboxConfig.dropdownOpen[item.key]"
               class="absolute z-10 w-full mt-1 bg-surface rounded shadow-lg max-h-48 overflow-auto">
            <div v-for="(it, itIndex) in comboboxConfig.filteredItems[item.key]"
                 :key="itIndex"
                 :class="['px-3 py-2 cursor-pointer hover:bg-primary-light', comboboxConfig.isSelected(item, it) ? 'bg-primary text-white' : '']"
                 @mousedown.prevent="comboboxConfig.selectItem(item, it)">
              {{ it[item.itemTitle] }}
            </div>
            <div v-if="!comboboxConfig.filteredItems[item.key]?.length"
                 class="px-3 py-2 text-gray-400 text-center">
              无匹配项
            </div>
          </div>
        </div>
      </FormItem>

      <!-- v-file-input 类型: 原生 HTML file input -->
      <FormItem v-else-if="item.componentsType === 'v-file-input'"
                :class="item?.class"
                :label="item?.label"
                :label-direction="labelDirection"
                :error="validation.errors[item.key]">
        <input type="file"
               class="flex-1 flyz-field"
               v-bind="item.nativeAttrs">
      </FormItem>

      <!-- v-otp-input 类型: 原生 HTML otp input -->
      <FormItem v-else-if="item.componentsType === 'v-otp-input'"
                :class="item?.class"
                :label="item?.label"
                :label-direction="labelDirection"
                :error="validation.errors[item.key]">
        <div class="flex-1 flex gap-2">
          <input v-for="n in Number(item.length || 6)"
                 :key="n - 1"
                 type="text"
                 class="w-12 h-12 text-center text-xl flyz-field"
                 :maxlength="1"
                 :value="otpConfig.getChar(item, n - 1)"
                 @input="e => otpConfig.handleInput(item, n - 1, e)"
                 @keydown="e => otpConfig.handleKeydown(item, n - 1, e)">
        </div>
      </FormItem>

      <!-- v-slider 类型: 原生 HTML range input -->
      <FormItem v-else-if="item.componentsType === 'v-slider'"
                :class="item?.class"
                :label="item?.label"
                :label-direction="labelDirection"
                :error="validation.errors[item.key]">
        <div class="flex-1 flex items-center gap-3">
          <input v-model.number="form[item.key]"
                 type="range"
                 :min="item.min ?? 0"
                 :max="item.max ?? 100"
                 :step="item.step ?? 1"
                 class="flex-1 flyz-field accent-primary">
          <span class="w-12 text-center">{{ form[item.key] ?? 0 }}</span>
        </div>
      </FormItem>
      <!-- v-switch 类型: 原生 HTML checkbox (开关样式) -->
      <FormItem v-else-if="item.componentsType === 'v-switch'"
                :class="item?.class"
                :label="item?.label"
                :label-direction="labelDirection"
                :error="validation.errors[item.key]">
        <label class="h-full inline-flex items-center gap-2 cursor-pointer p-2">
          <input v-model="form[item.key]"
                 type="checkbox"
                 class="sr-only peer"
                 v-bind="item.nativeAttrs">
          <span class="relative w-11 h-6 rounded-full bg-white/15 peer-checked:bg-brand-500 transition-all duration-200 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:shadow-md after:transition-all after:duration-200 peer-checked:after:translate-x-5 peer-hover:after:scale-110"></span>
        </label>
      </FormItem>
    </template>
  </div>
</template>

<script setup>
import { useVModel } from '@vueuse/core'
import { computed, reactive, ref } from 'vue'
import CodeEditor from '@/components/code-editor.vue'
import FormItem from '@/components/form-item.vue'

// 允许透传到原生表单元素的 HTML 属性白名单
const NATIVE_ATTRS = [
  'disabled', 'readonly', 'required', 'autocomplete', 'autofocus',
  'min', 'max', 'step', 'minlength', 'maxlength', 'pattern',
  'accept', 'multiple', 'name', 'tabindex', 'rows', 'cols',
]

const props = defineProps({
  formColumns: {
    type: Array,
    default: () => [],
  },
  form: { type: Object, default: () => ({}) },
  labelDirection: { type: String, default: 'left' },
})

const emit = defineEmits(['update:form', 'update:validate'])
const form = useVModel(props, 'form', emit)
const formRef = ref()

// 预计算原生属性并缓存到列对象，避免模板每次渲染重复调用生成新对象
const visibleColumns = computed(() => {
  return props.formColumns.filter(item => !item?.hidden).map(item => ({
    ...item,
    label: item.label || item.key || '',
    nativeAttrs: nativeAttrs(item),
  }))
})

function nativeAttrs(item) {
  const attrs = {}
  for (const key of NATIVE_ATTRS) {
    if (item[key] !== undefined) {
      attrs[key] = item[key]
    }
  }
  return attrs
}

// --- 验证 ---
const validation = reactive({
  errors: {},
  validateField(item) {
    const rules = item.rules || []
    const value = form.value[item.key]
    for (const rule of rules) {
      const result = rule(value)
      if (result !== true) {
        this.errors[item.key] = result
        return false
      }
    }
    delete this.errors[item.key]
    return true
  },
  async validate() {
    let valid = true
    visibleColumns.value.forEach(item => {
      if (!this.validateField(item)) {
        valid = false
      }
    })
    emit('update:validate', valid)
    return { valid }
  },
  resetValidation() {
    Object.keys(this.errors).forEach(k => delete this.errors[k])
  },
})

// --- select multiple 下拉状态 ---
const selectConfig = reactive({
  dropdownOpen: {},
  toggle(key) {
    const isOpen = !!this.dropdownOpen[key]
    Object.keys(this.dropdownOpen).forEach(k => this.dropdownOpen[k] = false)
    this.dropdownOpen[key] = !isOpen
  },
  closeAll() {
    Object.keys(this.dropdownOpen).forEach(k => this.dropdownOpen[k] = false)
  },
  getDisplayText(item) {
    const value = form.value[item.key]
    if (!Array.isArray(value) || !value.length) {
      return ''
    }
    return value.map(v => {
      const found = item.items?.find(it => String(it[item.itemValue]) === String(v))
      return found?.[item.itemTitle] ?? v
    }).join(', ')
  },
})

// --- combobox 配置 ---
const comboboxConfig = reactive({
  dropdownOpen: {},
  searchQueries: {},
  open(key) {
    Object.keys(this.dropdownOpen).forEach(k => this.dropdownOpen[k] = false)
    this.dropdownOpen[key] = true
  },
  close() {
    Object.keys(this.dropdownOpen).forEach(k => this.dropdownOpen[k] = false)
  },
  getValue(item) {
    const value = form.value[item.key]
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    return value || ''
  },
  handleInput(item, value) {
    this.searchQueries[item.key] = value
    form.value[item.key] = value
  },
  isSelected(item, it) {
    const value = form.value[item.key]
    const itemValue = it[item.itemValue]
    if (Array.isArray(value)) {
      return value.some(v => String(v) === String(itemValue))
    }
    return String(value) === String(itemValue)
  },
  selectItem(item, it) {
    const itemValue = it[item.itemValue]
    if (item.multiple) {
      const current = Array.isArray(form.value[item.key]) ? [...form.value[item.key]] : []
      const index = current.findIndex(v => String(v) === String(itemValue))
      if (index >= 0) {
        current.splice(index, 1)
      } else {
        current.push(itemValue)
      }
      form.value[item.key] = current
    } else {
      form.value[item.key] = itemValue
    }
    this.searchQueries[item.key] = it[item.itemTitle]
  },
  filteredItems: computed(() => {
    const result = {}
    visibleColumns.value.forEach(item => {
      if (item.componentsType === 'v-combobox') {
        const query = comboboxConfig.searchQueries[item.key] || ''
        result[item.key] = (item.items || []).filter(it => {
          const label = it[item.itemTitle] || ''
          return label.toLowerCase().includes(query.toLowerCase())
        })
      }
    })
    return result
  }),
})

// --- OTP 输入 ---
const otpConfig = reactive({
  getChar(item, index) {
    const value = String(form.value[item.key] || '')
    return value[index] || ''
  },
  handleInput(item, index, e) {
    const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '')
    e.target.value = val
    const currentValue = String(form.value[item.key] || '')
    const chars = currentValue.split('')
    chars[index] = val
    form.value[item.key] = chars.join('')
    if (val && index < Number(item.length || 6) - 1) {
      const inputs = e.target.closest('.flex-1').querySelectorAll('input')
      if (inputs[index + 1]) {
        inputs[index + 1].focus()
      }
    }
  },
  handleKeydown(_, index, e) {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      const inputs = e.target.closest('.flex-1').querySelectorAll('input')
      if (inputs[index - 1]) {
        inputs[index - 1].focus()
      }
    }
  },
})

// --- 多选数组值通用处理（checkbox / select multiple 共用） ---
const arrayValue = reactive({
  isChecked(item, it) {
    const value = form.value[item.key]
    if (!Array.isArray(value)) {
      return false
    }
    return value.some(v => String(v) === String(it[item.itemValue]))
  },
  toggle(item, it, e, onChange) {
    const value = it[item.itemValue]
    const current = Array.isArray(form.value[item.key]) ? [...form.value[item.key]] : []
    const index = current.findIndex(v => String(v) === String(value))
    if (e.target.checked) {
      if (index === -1) {
        current.push(value)
      }
    } else {
      if (index !== -1) {
        current.splice(index, 1)
      }
    }
    form.value[item.key] = current
    onChange?.({ target: { value: current } })
  },
})

const reset = () => {
  visibleColumns.value.forEach(item => {
    if (Array.isArray(form.value[item.key])) {
      form.value[item.key] = []
    } else {
      form.value[item.key] = ''
    }
  })
  Object.keys(validation.errors).forEach(k => delete validation.errors[k])
  Object.keys(selectConfig.dropdownOpen).forEach(k => delete selectConfig.dropdownOpen[k])
  Object.keys(comboboxConfig.dropdownOpen).forEach(k => delete comboboxConfig.dropdownOpen[k])
  Object.keys(comboboxConfig.searchQueries).forEach(k => delete comboboxConfig.searchQueries[k])
}

defineExpose({
  validate: () => validation.validate(),
  reset,
  resetValidation: () => validation.resetValidation(),
  formRef,
})
</script>
