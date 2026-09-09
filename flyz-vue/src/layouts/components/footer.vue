<template>
  <transition enter-active-class="animate__animated animate__fadeInUp animate__faster"
              leave-active-class="animate__animated animate__fadeOutDown animate__faster">
    <footer v-if="appStore.settings.footer"
            class="flyz-footer"
            :style="{ height: `${appStore.settings.footer}px` }">
      <div class="flyz-footer-inner flex items-center text-xs">
        <div class="hidden sm:flex items-center">
          <span>&copy; 2024-{{ new Date().getFullYear() }}</span>
          <span class="flyz-footer-divider mx-3"></span>
          <span class="font-medium flyz-footer-brand">@flyz</span>
        </div>
        <div class="flex-1"></div>
        <div class="flex items-center gap-2">
          <span class="flyz-footer-dot flyz-footer-vue"></span>
          <span class="ml-1 hidden md:inline mr-2">{{ appStore.userInfo?.prevLoginIPAddress || '--' }}</span>
          <span class="flyz-footer-tip" title="系统运行状态正常">
            <i class="flyz-footer-status i-mdi-check"></i>
          </span>
        </div>
      </div>
    </footer>
  </transition>
</template>

<script setup>
import { useAppStore } from '@/register/stores/app.js'

const appStore = useAppStore()
</script>
