<template>
  <Teleport to="body">
    <transition enter-active-class="animate__animated animate__fadeIn animate__faster" leave-active-class="animate__animated animate__fadeOut animate__faster">
      <div v-if="modelValue"
           class="flyz-drawer-mask fixed inset-0 z-1900"
           :style="{ background: scrim }"
           @click.self="handleMaskClick">
        <transition :enter-active-class="panelEnterClass" :leave-active-class="panelLeaveClass">
          <div v-if="modelValue"
               class="flyz-drawer-panel absolute bg-surface text-ink-100 shadow-[var(--c-shadow-lg)] flex flex-col overflow-auto animate__animated"
               :class="panelLocationClass"
               :style="panelStyle">
            <slot></slot>
          </div>
        </transition>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useVModel } from '@vueuse/core'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  width: { type: [String, Number], default: 320 },
  // left | right | top | bottom
  location: { type: String, default: 'right' },
  scrim: { type: String, default: 'rgba(0, 0, 0, 0.45)' },
  // 是否点击蒙层关闭
  closeOnMask: { type: Boolean, default: true },
  // 是否为临时抽屉（窄屏会强制走临时层）
  temporary: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'close'])

const model = useVModel(props, 'modelValue', emit)

const isVertical = computed(() => props.location === 'left' || props.location === 'right')

const panelLocationClass = computed(() => {
  const map = {
    left: 'left-0 top-0 h-full',
    right: 'right-0 top-0 h-full',
    top: 'top-0 left-0 w-full',
    bottom: 'bottom-0 left-0 w-full',
  }
  return map[props.location] || map.right
})

const panelEnterClass = computed(() => {
  const map = {
    left: 'animate__animated animate__slideInLeft animate__faster',
    right: 'animate__animated animate__slideInRight animate__faster',
    top: 'animate__animated animate__slideInDown animate__faster',
    bottom: 'animate__animated animate__slideInUp animate__faster',
  }
  return map[props.location] || map.right
})

const panelLeaveClass = computed(() => {
  const map = {
    left: 'animate__animated animate__slideOutLeft animate__faster',
    right: 'animate__animated animate__slideOutRight animate__faster',
    top: 'animate__animated animate__slideOutUp animate__faster',
    bottom: 'animate__animated animate__slideOutDown animate__faster',
  }
  return map[props.location] || map.right
})

const panelStyle = computed(() => {
  const size = typeof props.width === 'number' ? `${props.width}px` : props.width
  return isVertical.value
    ? { width: size, height: '100%' }
    : { height: size, width: '100%' }
})

const handleMaskClick = () => {
  if (!props.closeOnMask) {
    return
  }
  emit('close')
  model.value = false
}

// 打开时锁定 body 滚动
watch(model, (val) => {
  if (typeof document === 'undefined') {
    return
  }
  if (val) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>
