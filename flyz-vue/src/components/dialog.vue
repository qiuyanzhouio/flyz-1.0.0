<template>
  <Teleport to="body">
    <transition enter-active-class="animate__animated animate__fadeIn animate__faster" leave-active-class="animate__animated animate__fadeOut animate__faster">
      <div v-if="dialogValue"
           class="flyz-dialog-mask fixed inset-0 z-2000 flex items-center justify-center p-4 overflow-auto"
           :style="{ background: scrim }"
           @click.self="handleMaskClick">
        <!-- 完全自定义模式：bare=true 时，直接渲染 slot 内容，不包裹 flyz-dialog-card -->
        <slot v-if="bare" name="default" :close="handleClose"></slot>

        <!-- 默认模式：带 flyz-dialog-card 包裹 -->
        <transition enter-active-class="animate__animated animate__zoomIn animate__faster" leave-active-class="animate__animated animate__zoomOut animate__faster">
          <div v-if="dialogValue"
               class="flyz-dialog-card relative w-full bg-surface text-ink-100 rounded-lg shadow-[0_12px_48px_rgba(0,0,0,0.45)] flex flex-col max-h-[calc(100vh-32px)]"
               :style="{ maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth }">
            <div class="flyz-dialog-title flex justify-between items-center flex-wrap gap-2 px-4 py-4 text-base font-semibold text-ink-100">
              <slot name="title">
                <span>{{ title }}</span>
              </slot>
              <button v-if="showClose"
                      type="button"
                      class="bg-transparent border-0 text-ink-400 text-xl leading-none cursor-pointer p-1 rounded transition-colors duration-150 hover:(bg-white/8 text-ink-100)"
                      aria-label="close"
                      @click="handleClose">
                <i class="i-mdi-close"></i>
              </button>
            </div>
            <div class="flyz-divider"></div>
            <div :class="['flyz-dialog-text overflow-auto px-4 py-4', textClass]">
              <!-- 确认模式：显示图标和消息 -->
              <template v-if="confirmMode">
                <div class="flex items-start gap-3 overflow-hidden">
                  <span class="flex-none w-9 h-9 rounded-full bg-white/6 inline-flex items-center justify-center text-2xl leading-none"
                        :style="{ color: confirmIconColor }">
                    <i :class="confirmIconClass"></i>
                  </span>
                  <div class="flex-1">
                    <div class="text-[15px] font-medium text-ink-100 mb-1">
                      {{ message }}
                    </div>
                    <div v-if="description" class="text-xs text-ink-400">
                      {{ description }}
                    </div>
                  </div>
                </div>
              </template>
              <!-- 普通模式：默认 slot -->
              <div v-else class="h-fit">
                <slot></slot>
              </div>
            </div>

            <div v-if="showActions" class="flyz-divider"></div>

            <div v-if="showActions" class="flyz-dialog-actions flex justify-end gap-2 p-4 flex-wrap">
              <slot name="actions">
                <slot name="cancel-btn">
                  <button type="button"
                          class="flyz-btn flyz-btn-text"
                          :disabled="confirmLoading"
                          @click="handleCancel">
                    {{ cancelText }}
                  </button>
                </slot>
                <slot name="confirm-btn">
                  <button type="button"
                          class="flyz-btn"
                          :class="confirmBtnClass"
                          :disabled="confirmLoading"
                          @click="handleConfirm">
                    <span v-if="confirmLoading" class="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full"></span>
                    <span>{{ confirmText }}</span>
                  </button>
                </slot>
              </slot>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useVModel } from '@vueuse/core'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  message: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'warning', // warning, danger, info, success
  },
  cancelText: {
    type: String,
    default: '取消',
  },
  confirmText: {
    type: String,
    default: '确认',
  },
  maxWidth: {
    type: [String, Number],
    default: 600,
  },
  showClose: {
    type: Boolean,
    default: true,
  },
  showActions: {
    type: Boolean,
    default: true,
  },
  scrollable: {
    type: Boolean,
    default: false,
  },
  textClass: {
    type: String,
    default: 'max-h-[calc(100vh-150px)]',
  },
  loading: {
    type: Boolean,
    default: undefined,
  },
  loadingDuration: {
    type: Number,
    default: 2000,
  },
  // 蒙层背景
  scrim: {
    type: String,
    default: 'rgba(0, 0, 0, 0.45)',
  },
  // 点击蒙层是否关闭
  closeOnMask: {
    type: Boolean,
    default: true,
  },
  // 极简模式：不渲染默认 flyz-dialog-card 结构，完全由 slot 控制
  bare: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'cancel', 'confirm', 'close'])

const dialogValue = useVModel(props, 'modelValue', emit)
const isLoading = ref(false)
let loadingTimer = null

// 确认模式配置
const iconMap = {
  warning: { icon: 'i-mdi-alert', color: '#fbbf24' },
  danger: { icon: 'i-mdi-close-circle', color: '#ef4444' },
  info: { icon: 'i-mdi-information', color: '#3b82f6' },
  success: { icon: 'i-mdi-check-circle', color: '#22c55e' },
}

const confirmMode = computed(() => !!props.message)
const confirmIcon = computed(() => iconMap[props.type] || iconMap.warning)
const confirmIconClass = computed(() => confirmMode.value ? confirmIcon.value.icon : '')
const confirmIconColor = computed(() => confirmMode.value ? confirmIcon.value.color : '')
const confirmBtnClass = computed(() => props.type === 'danger' ? 'flyz-btn-danger' : 'flyz-btn-primary')
// 确认按钮 loading：优先使用外部传入的 loading，否则使用内部 isLoading
const confirmLoading = computed(() => props.loading ?? isLoading.value)

const handleClose = () => {
  emit('close')
  dialogValue.value = false
}

const handleMaskClick = () => {
  if (!props.closeOnMask) {
    return
  }
  handleClose()
}

const handleCancel = () => {
  emit('cancel')
  dialogValue.value = false
}

const handleConfirm = async () => {
  // 如果外部传入了 loading 状态，则由外部控制
  if (props.loading !== undefined) {
    emit('confirm')
    return
  }

  // 内部默认 loading 逻辑
  isLoading.value = true
  emit('confirm')

  clearTimeout(loadingTimer)
  loadingTimer = setTimeout(() => {
    isLoading.value = false
    dialogValue.value = false
  }, props.loadingDuration)
}

// 关闭对话框时重置 loading 状态
watch(dialogValue, (val) => {
  if (!val) {
    clearTimeout(loadingTimer)
    isLoading.value = false
  }
})

// 打开时锁定 body 滚动
watch(dialogValue, (val) => {
  if (typeof document === 'undefined') {
    return
  }
  if (val) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

defineExpose({
  open: () => {
    dialogValue.value = true
  },
  close: handleClose,
  startLoading: () => {
    isLoading.value = true
  },
  stopLoading: () => {
    isLoading.value = false
  },
})
</script>
