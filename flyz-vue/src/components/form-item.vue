<template>
  <!-- top 模式: label 在上方 -->
  <div v-if="labelDirection === 'top'" class="form-item-self">
    <label class="block mb-1 text-start text-[14px] text-ink-400">{{ label || '-' }}</label>
    <slot></slot>
    <span v-if="error" class="text-status-err text-xs mt-1">{{ error }}</span>
  </div>

  <!-- left 模式: label 在左侧 -->
  <div v-else-if="labelDirection === 'left'" class="form-item-self flex items-center">
    <label class="whitespace-nowrap text-[14px] text-ink-400 mr-1">{{ label || '-' }}</label>
    <slot></slot>
    <span v-if="error" class="text-status-err text-xs ml-2">{{ error }}</span>
  </div>

  <!-- inset 模式: label 浮动在输入框内 (默认) -->
  <div v-else class="relative form-item-self">
    <!-- 边框 -->
    <div class="flex absolute top-0 left-0 z-0 w-full h-full">
      <div class="w-[10px] h-full rounded-[4px_0_0_4px] border border-solid !border-r-none border-field-strong"></div>
      <div class="h-full border-solid border-b !border-r-none !border-l-none !border-t-none border-field-strong">
        <label class="flex items-center -translate-y-1/2 px-1 text-[14px] text-ink-400">{{ label || '-' }}</label>
      </div>
      <div class="flex-1 h-full rounded-[0_4px_4px_0] border border-solid !border-l-none border-field-strong"></div>
    </div>
    <div class="relative z-1">
      <slot class=""></slot>
    </div>
    <span v-if="error" class="text-status-err text-xs mt-1 block">{{ error }}</span>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, default: '' },
  labelDirection: { type: String, default: 'inset' },
  error: { type: String, default: '' },
})
</script>
