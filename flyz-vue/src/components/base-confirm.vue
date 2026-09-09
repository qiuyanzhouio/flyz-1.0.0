<template>
  <Dialog v-model="state.visible"
          :title="state.title"
          :message="state.promptMode ? '' : state.message"
          :description="state.description"
          :type="state.type"
          :confirm-text="state.confirmText"
          :cancel-text="state.cancelText"
          :max-width="state.type === 'danger' ? 450 : 400"
          :show-close="false"
          :loading="false"
          @cancel="state.cancel()"
          @confirm="state.confirm()">
    <div v-if="state.promptMode" class="flyz-prompt">
      <div class="flyz-prompt-title">
        {{ state.message }}
      </div>
      <div class="flyz-prompt-field">
        <input ref="promptInputRef"
               v-model="state.inputValue"
               type="text"
               :class="[!!state.errorMessage ? 'flyz-prompt-input-error' : 'flyz-prompt-input', 'flyz-field']"
               :placeholder="state.placeholder"
               :required="state.required"
               autofocus
               @keydown.enter="state.confirm">
        <div v-if="state.errorMessage" class="flyz-prompt-error">
          {{ state.errorMessage }}
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { nextTick, onMounted, reactive, ref } from 'vue'
import Dialog from './dialog.vue'
import { registerConfirm } from '@/register/utils/useConfirm.js'

const promptInputRef = ref()

const state = reactive({
  visible: false,
  title: '确认操作',
  message: '确定执行此操作吗？',
  description: '',
  type: 'warning',
  confirmText: '确认',
  cancelText: '取消',
  resolve: null,
  promptMode: false,
  label: '',
  required: false,
  placeholder: '',
  inputValue: '',
  errorMessage: '',
  close() {
    this.visible = false
  },
  cancel() {
    this.close()
    if (this.resolve) {
      this.resolve(false)
      this.resolve = null
    }
  },
  confirm() {
    if (this.promptMode && this.required && !this.inputValue?.toString().trim()) {
      this.errorMessage = `${this.label || '该项'}不能为空`
      nextTick(() => promptInputRef.value?.focus?.())
      return
    }

    this.close()
    if (this.resolve) {
      this.resolve(this.promptMode ? this.inputValue : true)
      this.resolve = null
    }
  },
  show(options = {}) {
    const cfg = typeof options === 'string'
      ? { message: options }
      : options

    this.title = cfg.title || '确认操作'
    this.message = cfg.message || '确定执行此操作吗？'
    this.description = cfg.description || ''
    this.type = cfg.type || 'warning'
    this.confirmText = cfg.confirmText || '确认'
    this.cancelText = cfg.cancelText || '取消'
    this.promptMode = cfg.promptMode || false
    this.label = cfg.label || ''
    this.required = cfg.required !== false
    this.placeholder = cfg.placeholder || ''
    this.inputValue = cfg.modelValue ?? ''
    this.errorMessage = ''

    this.visible = true

    if (this.promptMode) {
      nextTick(() => {
        promptInputRef.value?.focus?.()
      })
    }

    return new Promise((resolve) => {
      this.resolve = resolve
    })
  },
})

onMounted(() => {
  registerConfirm({ show: options => state.show(options) })
})
</script>
