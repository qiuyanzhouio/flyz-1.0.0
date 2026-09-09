<template>
  <Drawer v-model="appStore.appUserDrawer"
          location="right"
          temporary
          :width="360">
    <div class="p-4 pb-2 text-base font-bold">
      个人中心
    </div>
    <div class="flyz-divider"></div>

    <div class="p-4 flex items-center gap-3">
      <span class="flyz-avatar-lg">{{ userConfig.avatar }}</span>
      <div class="min-w-0">
        <div class="text-base font-bold truncate">
          {{ userConfig.name }}
        </div>
        <div class="text-xs truncate flyz-text-muted">
          {{ userConfig.role || '未设置角色' }}
        </div>
      </div>
    </div>

    <div class="flyz-divider mb-2"></div>

    <div class="flyz-user-list">
      <div class="flyz-user-row">
        <i class="flyz-user-row-icon i-mdi-account"></i>
        <div class="flyz-user-row-body">
          <div class="flyz-user-row-label">
            账号
          </div>
          <div class="flyz-user-row-value">
            {{ userConfig.account }}
          </div>
        </div>
      </div>
      <div class="flyz-user-row">
        <i class="flyz-user-row-icon i-mdi-card-account-details"></i>
        <div class="flyz-user-row-body">
          <div class="flyz-user-row-label">
            用户 ID
          </div>
          <div class="flyz-user-row-value">
            {{ userConfig.userId }}
          </div>
        </div>
      </div>
      <div class="flyz-user-row">
        <i class="flyz-user-row-icon i-mdi-office-building"></i>
        <div class="flyz-user-row-body">
          <div class="flyz-user-row-label">
            所属系统
          </div>
          <div class="flyz-user-row-value">
            {{ userConfig.system }}
          </div>
        </div>
      </div>
      <div class="flyz-user-row">
        <i class="flyz-user-row-icon i-mdi-email"></i>
        <div class="flyz-user-row-body">
          <div class="flyz-user-row-label">
            邮箱
          </div>
          <div class="flyz-user-row-value">
            {{ userConfig.email }}
          </div>
        </div>
      </div>
      <div class="flyz-user-row">
        <i class="flyz-user-row-icon i-mdi-cellphone"></i>
        <div class="flyz-user-row-body">
          <div class="flyz-user-row-label">
            手机号
          </div>
          <div class="flyz-user-row-value">
            {{ userConfig.phone }}
          </div>
        </div>
      </div>
    </div>

    <div class="flyz-divider my-2"></div>

    <div class="p-3 flex gap-2">
      <button type="button"
              class="flyz-btn flyz-btn-tonal flex-1"
              @click="userConfig.goSettings">
        偏好设置
      </button>
      <button type="button"
              class="flyz-btn flyz-btn-danger flex-1"
              @click="userConfig.logout">
        退出登录
      </button>
    </div>
  </Drawer>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/register/stores/app.js'
import Drawer from '@/components/drawer.vue'

const router = useRouter()
const appStore = useAppStore()

const userConfig = reactive({
  info: computed(() => appStore.userInfo || {}),
  name: computed(() => userConfig.info?.name || userConfig.info?.userName || userConfig.info?.nickName || '未命名用户'),
  role: computed(() => userConfig.info?.roleName || userConfig.info?.role || userConfig.info?.postName || ''),
  account: computed(() => userConfig.info?.account || userConfig.info?.userAccount || userConfig.info?.loginName || '-'),
  userId: computed(() => String(userConfig.info?.id || userConfig.info?.userId || '-')),
  system: computed(() => userConfig.info?.systemName || userConfig.info?.systemId || '-'),
  email: computed(() => userConfig.info?.email || '-'),
  phone: computed(() => userConfig.info?.mobile || userConfig.info?.phone || '-'),
  avatar: computed(() => {
    const text = String(userConfig.name || '').trim()
    if (!text) {
      return 'U'
    }
    return text.slice(0, 1).toUpperCase()
  }),
  goSettings() {
    appStore.appUserDrawer = false
    appStore.appSettingsDrawer = true
  },
  logout() {
    appStore.appUserDrawer = false
    appStore.logout()
    router.push('/login')
  },
})
</script>
