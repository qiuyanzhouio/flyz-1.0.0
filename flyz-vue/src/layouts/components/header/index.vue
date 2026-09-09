<template>
  <transition enter-active-class="animate__animated animate__fadeInDown animate__faster"
              leave-active-class="animate__animated animate__fadeOutUp animate__faster">
    <header v-if="appStore.settings.header"
            class="flyz-header"
            :style="{ height: `${appStore.settings.header}px` }">
      <button type="button"
              class="flyz-icon-btn"
              aria-label="toggle drawer"
              @click="drawer.toggle">
        <i class="i-mdi-menu text-lg"></i>
      </button>
      <div class="flyz-header-title">
        {{ appStore.title }}
      </div>
      <div class="flyz-header-spacer"></div>

      <div class="flyz-header-actions flex items-center">
        <button type="button"
                class="flyz-icon-btn mr-1"
                aria-label="search"
                @click="appStore.appSearchDrawer = true">
          <i class="i-mdi-magnify text-lg"></i>
        </button>
        <button type="button"
                class="flyz-icon-btn mr-3 hidden sm:inline-flex"
                :aria-label="fullscreen.active ? '退出全屏' : '进入全屏'"
                @click="fullscreen.toggle">
          <i :class="fullscreen.active ? 'i-mdi-fullscreen-exit text-lg' : 'i-mdi-fullscreen text-lg'"></i>
        </button>
        <span class="flyz-header-divider mx-2"></span>
        <div ref="menuRef" class="flyz-user-menu">
          <button type="button"
                  class="flyz-avatar-btn ml-2"
                  aria-label="user menu"
                  @click="userMenu.toggle">
            <span class="flyz-user-avatar">AD</span>
          </button>
          <transition enter-active-class="animate__animated animate__fadeIn animate__faster" leave-active-class="animate__animated animate__fadeOut animate__faster">
            <div v-if="userMenu.open" class="flyz-user-dropdown">
              <button type="button"
                      class="flyz-user-item"
                      @click="userMenu.onAction('profile')">
                <i class="flyz-user-item-icon i-mdi-account"></i>
                <span>个人中心</span>
              </button>
              <button type="button"
                      class="flyz-user-item"
                      @click="userMenu.onAction('settings')">
                <i class="flyz-user-item-icon i-mdi-cog"></i>
                <span>偏好设置</span>
              </button>
              <span class="flyz-user-divider my-2"></span>
              <button type="button"
                      class="flyz-user-item flyz-user-item-danger"
                      @click="userMenu.onAction('logout')">
                <i class="flyz-user-item-icon i-mdi-power"></i>
                <span>退出登录</span>
              </button>
            </div>
          </transition>
        </div>
      </div>
    </header>
  </transition>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/register/stores/app'
import utils from '@/register/utils'

const router = useRouter()
const appStore = useAppStore()

const menuRef = ref(null)

// ============================ 侧栏抽屉 ============================
const drawer = reactive({
  getWidth() {
    const m = appStore.settings.menus
    if (Array.isArray(m)) {
      return Number(m[0] ?? 0)
    }
    const n = Number(m)
    return Number.isFinite(n) ? n : 0
  },
  toggle() {
    const current = this.getWidth()
    if (current > 0) {
      appStore.updateSettings({
        lastMenuWidth: current,
        menus: 0,
      })
    } else {
      appStore.updateSettings({
        menus: appStore.settings.lastMenuWidth || 245,
      })
    }
  },
})

// ============================ 全屏 ============================
const fullscreen = reactive({
  active: false,
  async toggle() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await document.documentElement.requestFullscreen()
      }
    } catch (_error) {
      utils.message('error', '全屏切换失败')
    }
  },
  sync() {
    this.active = Boolean(document.fullscreenElement)
  },
})

// ============================ 用户菜单 ============================
const userMenu = reactive({
  open: false,
  toggle() {
    this.open = !this.open
  },
  onAction(action) {
    this.open = false
    switch (action) {
      case 'profile':
        appStore.appUserDrawer = true
        break
      case 'settings':
        appStore.appSettingsDrawer = true
        break
      case 'logout':
        this.logout()
        break
    }
  },
  logout() {
    appStore.logout()
    router.push('/login')
  },
  handleDocClick(e) {
    if (!this.open) {
      return
    }
    if (menuRef.value && !menuRef.value.contains(e.target)) {
      this.open = false
    }
  },
})

function _handleNotice() {
  utils.message('warning', '你有 5 条未读消息')
}

const onDocClick = e => userMenu.handleDocClick(e)
const onFsChange = () => fullscreen.sync()

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('fullscreenchange', onFsChange)
  fullscreen.sync()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('fullscreenchange', onFsChange)
})
</script>
