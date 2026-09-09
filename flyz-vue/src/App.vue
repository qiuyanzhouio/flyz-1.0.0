<template>
  <router-view></router-view>
  <!-- 全局消息提示 -->
  <Teleport to="body">
    <transition enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0 -translate-y-2"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition duration-200 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-2">
      <div v-if="snackbar.visible"
           class="fixed top-6 right-6 z-3000 flex items-center gap-2 min-w-60 max-w-120 px-3.5 py-2.5 rounded-md text-sm text-white shadow-2xl"
           :class="snackbar.colorClass"
           role="status">
        <i :class="['flex-none text-base', snackbar.iconClass]"></i>
        <span class="flex-1 break-words">{{ snackbar.current.message }}</span>
        <button v-if="!snackbar.current.persistent"
                type="button"
                class="bg-transparent border-0 text-white/85 text-lg leading-none cursor-pointer px-1"
                aria-label="close"
                @click="snackbar.visible = false">
          <i class="i-mdi-close"></i>
        </button>
      </div>
    </transition>
  </Teleport>
  <!-- 全局确认对话框 -->
  <BaseConfirm></BaseConfirm>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, watch } from 'vue'
import BaseConfirm from '@/components/base-confirm.vue'
import { useAppStore } from '@/register/stores/app.js'

const appStore = useAppStore()

// 主题同步：将主题模式/主题色写入 html 属性，驱动 CSS 变量切换
watch(
  () => [appStore.settings.theme, appStore.settings.themeColor],
  ([theme, themeColor]) => {
    const el = document.documentElement
    el.dataset.theme = theme === 'light' ? 'light' : 'dark'
    el.dataset.bg = themeColor || 'default'
  },
  { immediate: true },
)

const ICONS = {
  success: 'i-mdi-check-circle',
  error: 'i-mdi-close-circle',
  warning: 'i-mdi-alert',
  info: 'i-mdi-information',
}

const COLORS = {
  success: 'bg-ok/95',
  error: 'bg-err/95',
  warning: 'bg-warn/95 text-[#1a1a2e]',
  info: 'bg-brand-500/95',
}

// ============================ 全局消息提示 ============================
const snackbar = reactive({
  visible: false,
  queue: [],
  current: {
    message: '',
    color: 'info',
    timeout: 2500,
    persistent: false,
  },
  hideTimer: null,
  iconClass: computed(() => ICONS[snackbar.current.color] || ICONS.info),
  colorClass: computed(() => COLORS[snackbar.current.color] || COLORS.info),
  clearTimer() {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }
  },
  normalize(payload = {}) {
    const timeout = Number(payload.timeout)
    return {
      message: payload.message || '',
      color: payload.color || payload.type || 'info',
      timeout: Number.isFinite(timeout) ? timeout : 2500,
      persistent: Boolean(payload.persistent),
    }
  },
  showNext() {
    if (this.visible) {
      return
    }
    const next = this.queue.shift()
    if (!next) {
      return
    }
    this.current = next
    this.visible = true
  },
  pushMessage(event) {
    const msg = this.normalize(event?.detail || {})
    if (!msg.message) {
      return
    }
    this.queue.push(msg)
    this.showNext()
  },
})

// 显示时安排自动隐藏；隐藏（含手动关闭）时清定时器并展示队列中的下一条
watch(() => snackbar.visible, (visible) => {
  snackbar.clearTimer()
  if (!visible) {
    snackbar.showNext()
    return
  }
  const { timeout, persistent } = snackbar.current
  if (!persistent && timeout > 0) {
    snackbar.hideTimer = setTimeout(() => {
      snackbar.visible = false
    }, timeout)
  }
})

const handleAppMessage = e => snackbar.pushMessage(e)

onMounted(() => {
  window.addEventListener('app:message', handleAppMessage)
})

onBeforeUnmount(() => {
  snackbar.clearTimer()
  window.removeEventListener('app:message', handleAppMessage)
})
</script>
