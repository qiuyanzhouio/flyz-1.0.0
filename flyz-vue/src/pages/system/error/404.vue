<template>
  <div class="flyz-404-page">
    <div class="flyz-404-card">
      <div class="flex items-center gap-3 mb-4">
        <span class="flyz-404-icon" aria-hidden="true">
          <i class="i-mdi-help-circle-outline text-3xl"></i>
        </span>
        <div>
          <div class="flyz-404-title">
            404 - 页面不存在
          </div>
          <div class="flyz-404-subtitle">
            你访问的地址不存在或已被移除。
          </div>
        </div>
      </div>

      <div class="flyz-404-divider mb-4"></div>

      <div class="flyz-404-path mb-5">
        当前路径：<span class="font-medium">{{ route.fullPath }}</span>
      </div>

      <div class="flex flex-wrap gap-2">
        <button type="button" class="flyz-btn flyz-btn-primary" @click="goHome">
          <i class="i-mdi-home flyz-btn-icon-small"></i>
          返回首页
        </button>
        <button type="button" class="flyz-btn flyz-btn-tonal" @click="goBack">
          <i class="i-mdi-arrow-left flyz-btn-icon-small"></i>
          返回上一页
        </button>
        <button type="button" class="flyz-btn flyz-btn-text" @click="goLogin">
          <i class="i-mdi-login flyz-btn-icon-small"></i>
          去登录
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/register/stores/app'

const appStore = useAppStore()

definePage({
  meta: {
    requiresAuth: false,
  },
})

const route = useRoute()
const router = useRouter()

function goHome() {
  router.push(appStore.effectiveHomePath)
}

function goBack() {
  if (window.history.length <= 1) {
    return goHome()
  }
  router.back()
}

function goLogin() {
  appStore.logout()
  router.push({ path: '/login' })
}
</script>
