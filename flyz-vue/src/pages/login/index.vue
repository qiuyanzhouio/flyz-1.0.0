<template>
  <div class="w-full h-full min-h-screen grid place-items-center p-4">
    <div class="flyz-card w-150 p-6">
      <div>
        <div class="flex flex-col items-start gap-2">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-brand-500/20 grid place-items-center">
              <i class="i-mdi-hexagon-multiple text-2xl text-brand-300"></i>
            </div>
            <div>
              <h1 class="text-xl font-bold text-ink-50">
                {{ appStore.title }}
              </h1>
              <p class="text-xs text-ink-300">
                欢迎回来，请登录后继续使用
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <div class="text-lg font-semibold text-ink-100">
          {{ loginConfig.meta.title }}
          <button type="button"
                  class="flyz-icon-btn"
                  aria-label="服务设置"
                  @click="appStore.serverSettingsDialog = true">
            <i class="i-mdi-cog text-lg"></i>
          </button>
        </div>
        <div class="flex gap-1">
          <div class="flyz-btn flyz-chip-sm"
               :class="[loginConfig.mode === 'password' ? 'flyz-btn-primary' : 'flyz-btn-info']"
               @click="loginConfig.mode = 'password'">
            密码登录
          </div>
          <div class="flyz-btn flyz-chip-sm"
               :class="[loginConfig.mode === 'qrcode' ? 'flyz-btn-primary' : 'flyz-btn-info']"
               @click="loginConfig.mode = 'qrcode'">
            扫码登录
          </div>
        </div>

        <!-- 密码登录 / 注册 / 找回密码 三个模式共用同一份 Form -->
        <Form v-show="loginConfig.mode !== 'qrcode'"
              ref="loginFormRef"
              :form-columns="loginConfig.columns"
              :form="loginConfig.model"
              label-direction="top"></Form>

        <!-- 表单底部操作区：按钮全部在 Form 外部，校验走 ref -->
        <div v-show="loginConfig.mode !== 'qrcode'" class="flex flex-col gap-3 -mt-1">
          <!-- 密码登录 -->
          <template v-if="loginConfig.mode === 'password'">
            <div class="flex flex-wrap items-center gap-2">
              <label class="flex items-center gap-1.5 text-xs text-ink-300 cursor-pointer select-none">
                <input v-model="loginConfig.remember" type="checkbox" class="accent-brand-500 w-3.5 h-3.5">
                <span>记住我</span>
              </label>
              <div class="ml-auto flex gap-3 text-xs text-ink-300">
                <a type="button" class="hover:text-brand-400" @click="loginConfig.mode = 'forgot'">
                  忘记密码？
                </a>
                <a type="button" class="hover:text-brand-400" @click="loginConfig.mode = 'register'">
                  注册账号
                </a>
              </div>
            </div>
            <button type="button"
                    class="flyz-btn flyz-btn-primary w-full h-10"
                    :disabled="loginConfig.submitting"
                    @click="loginConfig.submitLogin">
              <span v-if="loginConfig.submitting" class="flyz-btn-spinner"></span>
              <span>{{ loginConfig.submitting ? '登录中...' : '登 录' }}</span>
            </button>
          </template>

          <!-- 注册 -->
          <template v-else-if="loginConfig.mode === 'register'">
            <label class="flex items-center gap-2 text-xs text-ink-300 cursor-pointer select-none">
              <input v-model="loginConfig.agree" type="checkbox" class="accent-brand-500 w-3.5 h-3.5">
              <span>我已阅读并同意</span>
              <button type="button" class="text-brand-400 hover:underline" @click="showAgreement">《用户协议》</button>
              <span>和</span>
              <button type="button" class="text-brand-400 hover:underline" @click="showPrivacy">《隐私政策》</button>
            </label>
            <div class="flex gap-2">
              <button type="button" class="flyz-btn flyz-btn-tonal" @click="loginConfig.mode = 'password'">
                返回登录
              </button>
              <button type="button" class="flyz-btn flyz-btn-primary flex-1" @click="loginConfig.submitRegister">
                注册并登录
              </button>
            </div>
          </template>

          <!-- 找回密码 -->
          <template v-else-if="loginConfig.mode === 'forgot'">
            <div class="flex gap-2">
              <button type="button" class="flyz-btn flyz-btn-tonal" @click="loginConfig.mode = 'password'">
                返回登录
              </button>
              <button type="button" class="flyz-btn flyz-btn-primary flex-1" @click="loginConfig.submitForgot">
                提交修改
              </button>
            </div>
          </template>
        </div>

        <!-- 扫码登录 -->
        <div v-show="loginConfig.mode === 'qrcode'"
             class="flex flex-col items-center gap-3 py-3">
          <div class="w-48 h-48 rounded-lg border border-white/10 bg-white/5 grid place-items-center">
          </div>
          <div class="text-xs text-ink-300">
            {{ qrcodeConfig.hint }}
          </div>
          <div class="flex gap-2">
            <button type="button" class="flyz-btn flyz-btn-tonal" @click="qrcodeConfig.refresh">
              刷新二维码
            </button>
            <button type="button" class="flyz-btn" @click="loginConfig.submitQrcode">
              已扫码，登录
            </button>
          </div>
        </div>
      </div>

      <div class="mt-5 flex flex-wrap items-center justify-between gap-2">
        <div class="text-xs text-ink-400">
          © {{ year }} 为匠-控制器管理 · 保留所有权利
        </div>
        <div class="flex gap-3 text-xs text-ink-300">
          <a type="link" class="hover:text-brand-400" @click="goHome">返回首页</a>
          <a type="link" class="hover:text-brand-400" @click="showAgreement">服务协议</a>
          <a type="link" class="hover:text-brand-400" @click="showPrivacy">隐私政策</a>
        </div>
      </div>
    </div>
  </div>

  <!-- 服务与场景设置 Dialog -->
  <Dialog :model-value="appStore.serverSettingsDialog"
          title="服务与场景设置"
          max-width="min(560px, 92vw)"
          :close-on-mask="false"
          :show-actions="false"
          @update:model-value="v => v || (appStore.serverSettingsDialog = false)">
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-1 p-1 rounded-md bg-white/5 border border-white/10 self-start">
        <button type="button"
                class="flyz-btn"
                :class="['px-3 py-1.5 rounded text-xs leading-none transition-colors', settingsDialog.tab === 'servers' ? 'flyz-btn-primary' : '']"
                @click="settingsDialog.tab = 'servers'">
          服务地址
        </button>
        <button type="button"
                class="flyz-btn"
                :class="['px-3 py-1.5 rounded text-xs leading-none transition-colors', settingsDialog.tab === 'scene' ? 'flyz-btn-primary' : '']"
                @click="settingsDialog.tab = 'scene'">
          场景配置
        </button>
      </div>

      <!-- 服务地址 Tab -->
      <div v-show="settingsDialog.tab === 'servers'">
        <div class="mb-2 text-[11px] text-ink-400">
          当前环境已配置 <span class="text-brand-400">{{ appStore.serversConfigMeta.length }}</span> 个服务地址，由
          <code class="px-1 py-0.5 rounded bg-black/30">VITE_SERVER_LIST</code> 环境变量解析生成。
        </div>
        <Form ref="serverFormRef"
              :form-columns="settingsDialog.serverColumns"
              :form="settingsDialog.settings"
              label-direction="top"></Form>
        <div class="mt-4 flex justify-end gap-2">
          <button type="button" class="flyz-btn" @click="appStore.serverSettingsDialog = false">
            取消
          </button>
          <button type="button" class="flyz-btn flyz-btn-tonal" @click="settingsDialog.resetServers">
            恢复默认
          </button>
          <button type="button" class="flyz-btn flyz-btn-primary" @click="settingsDialog.saveServers">
            保存并应用
          </button>
        </div>
      </div>

      <!-- 场景配置 Tab -->
      <div v-show="settingsDialog.tab === 'scene'">
        <Form ref="sceneFormRef"
              :form-columns="settingsDialog.sceneColumns"
              :form="settingsDialog.settings"></Form>
        <div class="mt-4 flex justify-end gap-2">
          <button type="button" class="flyz-btn" @click="appStore.serverSettingsDialog = false">
            取消
          </button>
          <button type="button" class="flyz-btn flyz-btn-primary" @click="settingsDialog.saveScene">
            保存场景
          </button>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/register/stores/app'
import Form from '@/components/form.vue'
import Dialog from '@/components/dialog.vue'
import utils from '@/register/utils'

definePage({
  meta: {
    layout: 'login',
    requiresAuth: false,
  },
})

const router = useRouter()
const appStore = useAppStore()
const year = new Date().getFullYear()

const loginFormRef = ref(null)
const serverFormRef = ref(null)
const sceneFormRef = ref(null)

const fullWidth = 'flex-[0_0_100%]'

// ============================ 登录 ============================
const loginConfig = reactive({
  mode: 'password',
  submitting: false,
  remember: false,
  agree: false,
  model: {
    username: '',
    password: '',
    confirm: '',
    phone: '',
    sms: '',
    captcha: '',
  },
  rules: {
    username: [
      v => Boolean(v) || '请输入账号',
      v => (v && v.length >= 3 && v.length <= 32) || '账号长度在 3 到 32 个字符之间',
    ],
    password: [
      v => Boolean(v) || '请输入密码',
      v => (v && v.length >= 6 && v.length <= 32) || '密码长度在 6 到 32 个字符之间',
    ],
    confirmPassword: [
      v => Boolean(v) || '请再次输入密码',
      v => (v === loginConfig.model.password) || '两次输入的密码不一致',
    ],
    phone: [
      v => Boolean(v) || '请输入手机号',
      v => (/^1[3-9]\d{9}$/.test(v || '')) || '请输入有效的 11 位手机号',
    ],
    sms: [
      v => Boolean(v) || '请输入短信验证码',
      v => (v && v.length === 6) || '短信验证码应为 6 位',
    ],
    captcha: [
      v => Boolean(v) || '请输入图形验证码',
      v => (v && v.length >= 4) || '图形验证码至少 4 位',
    ],
  },
  columns: computed(() => {
    if (loginConfig.mode === 'register') {
      return [
        { key: 'username', label: '账号', componentsType: 'v-input', placeholder: '请输入登录账号', class: fullWidth, rules: loginConfig.rules.username },
        { key: 'phone', label: '手机号', componentsType: 'v-input', placeholder: '请输入 11 位手机号', class: fullWidth, rules: loginConfig.rules.phone },
        { key: 'sms', label: '短信验证码', componentsType: 'v-input', placeholder: '请输入 6 位验证码', class: fullWidth, rules: loginConfig.rules.sms },
        { key: 'password', label: '密码', componentsType: 'v-input', type: 'password', placeholder: '请输入密码', class: fullWidth, rules: loginConfig.rules.password },
        { key: 'confirm', label: '确认密码', componentsType: 'v-input', type: 'password', placeholder: '请再次输入密码', class: fullWidth, rules: loginConfig.rules.confirmPassword },
      ]
    }

    if (loginConfig.mode === 'forgot') {
      return [
        { key: 'username', label: '账号', componentsType: 'v-input', placeholder: '请输入登录账号', class: fullWidth, rules: loginConfig.rules.username },
        { key: 'phone', label: '绑定手机号', componentsType: 'v-input', placeholder: '请输入注册时的手机号', class: fullWidth, rules: loginConfig.rules.phone },
        { key: 'sms', label: '短信验证码', componentsType: 'v-input', placeholder: '请输入 6 位验证码', class: fullWidth, rules: loginConfig.rules.sms },
        { key: 'password', label: '新密码', componentsType: 'v-input', type: 'password', placeholder: '请输入新的登录密码', class: fullWidth, rules: loginConfig.rules.password },
        { key: 'confirm', label: '确认新密码', componentsType: 'v-input', type: 'password', placeholder: '请再次输入新密码', class: fullWidth, rules: loginConfig.rules.confirmPassword },
      ]
    }

    return [
      { key: 'username', label: '账号', componentsType: 'v-input', placeholder: '请输入账号 / 手机号 / 邮箱', class: fullWidth, rules: loginConfig.rules.username },
      { key: 'password', label: '密码', componentsType: 'v-input', type: 'password', placeholder: '请输入密码', class: fullWidth, rules: loginConfig.rules.password },
      // { key: 'captcha', label: '图形验证码', componentsType: 'v-input', placeholder: '请输入验证码', class: fullWidth, rules: loginConfig.rules.captcha },
    ]
  }),
  meta: computed(() => {
    switch (loginConfig.mode) {
      case 'register': return { title: '注册账号' }
      case 'forgot': return { title: '找回密码' }
      case 'qrcode': return { title: '扫码登录' }
      default: return { title: `登录到 ${appStore.title}` }
    }
  }),
  resetModel() {
    Object.assign(this.model, {
      username: '',
      password: '',
      confirm: '',
      phone: '',
      sms: '',
      captcha: '',
    })
    this.agree = false
    nextTick(() => loginFormRef.value?.resetValidation())
  },
  async submitLogin() {
    if (this.mode !== 'password') {
      return
    }
    const { valid } = (await loginFormRef.value?.validate?.()) || { valid: false }
    if (!valid) {
      return
    }

    this.submitting = true
    try {
      const ok = await appStore.loginByPassword({
        username: this.model.username,
        password: this.model.password,
        captcha: this.model.captcha,
      })
      if (!ok) {
        return
      }
      utils.message('success', '登录成功')
      await this.afterSuccess()
    } finally {
      this.submitting = false
    }
  },
  async submitRegister() {
    if (this.mode !== 'register') {
      return
    }
    if (!this.agree) {
      utils.message('warning', '请先阅读并同意用户协议和隐私政策')
      return
    }
    const { valid } = (await loginFormRef.value?.validate?.()) || { valid: false }
    if (!valid) {
      return
    }

    await appStore.registerUser({ username: this.model.username })
    utils.message('success', '注册成功，已自动登录')
    await this.afterSuccess()
  },
  async submitForgot() {
    if (this.mode !== 'forgot') {
      return
    }
    const { valid } = (await loginFormRef.value?.validate?.()) || { valid: false }
    if (!valid) {
      return
    }

    await appStore.resetPassword()
    utils.message('success', '密码已重置，请用新密码登录')
    this.mode = 'password'
  },
  async submitQrcode() {
    const token = await appStore.loginByQrcode()
    if (token) {
      utils.message('success', '扫码登录成功')
      await this.afterSuccess()
    }
  },
  async afterSuccess() {
    try {
      await appStore.refreshCurrentUser()
    } catch (_e) {
      utils.message('warning', '获取当前用户信息失败，已跳转默认首页')
    }
    router.push(appStore.defaultHomePath)
  },
})

watch(() => loginConfig.mode, (val) => {
  if (val !== 'qrcode') {
    loginConfig.resetModel()
  }
})

// ============================ 扫码登录 ============================
const qrcodeConfig = reactive({
  seed: Date.now(),
  hint: computed(() => '请使用「为匠控制器」APP 扫描二维码登录'),
  refresh() {
    this.seed = Date.now()
    utils.message('success', '二维码已刷新')
  },
})

// ============================ 服务与场景设置 ============================
const settingsDialog = reactive({
  tab: 'servers',
  settings: {
    ...Object.fromEntries(
      appStore.serversConfigMeta.map(item => [item.key, appStore.serverBaseUrls[item.key] || item.defaultValue || '']),
    ),
    projectId: '',
    sceneId: '',
  },
  serverColumns: computed(() => {
    const urlRules = [
      v => Boolean(v) || '请填写服务地址',
      v => {
        const s = String(v || '').trim()
        if (!s) {
          return true
        }
        const isAbsolute = /^https?:\/\//i.test(s)
        const isRelative = /^\/[^?]*$/.test(s)
        return (isAbsolute || isRelative) || '地址格式错误，必须以 http(s):// 或 / 开头'
      },
    ]
    return appStore.serversConfigMeta.map(item => ({
      key: item.key,
      label: item.label,
      componentsType: 'v-input',
      placeholder: item.placeholder || '请输入地址',
      class: fullWidth,
      rules: urlRules,
    }))
  }),
  sceneColumns: computed(() => [
    {
      key: 'projectId',
      label: '项目ID',
      componentsType: 'v-input',
      class: fullWidth,
    },
    {
      key: 'sceneId',
      label: '场景ID',
      componentsType: 'v-input',
      class: fullWidth,
    },
  ]),
  sync() {
    for (const item of appStore.serversConfigMeta) {
      this.settings[item.key] = appStore.serverBaseUrls[item.key] || item.defaultValue || ''
    }
    this.tab = 'servers'
    nextTick(() => {
      serverFormRef.value?.resetValidation()
      sceneFormRef.value?.resetValidation()
    })
  },
  async saveServers() {
    const { valid } = (await serverFormRef.value?.validate?.()) || { valid: false }
    if (!valid) {
      utils.message('error', '请检查服务地址格式')
      return
    }
    const map = {}
    for (const item of appStore.serversConfigMeta) {
      map[item.key] = String(this.settings[item.key] || '').trim()
    }
    appStore.setServerBaseUrlMap(map)
    utils.message('success', '服务地址已保存并立即生效')
    appStore.serverSettingsDialog = false
  },
  resetServers() {
    appStore.resetServerBaseUrlsToDefaults()
    for (const item of appStore.serversConfigMeta) {
      this.settings[item.key] = appStore.serverBaseUrls[item.key] || ''
    }
    nextTick(() => serverFormRef.value?.resetValidation())
    utils.message('success', '服务地址已恢复到环境变量默认值')
  },
  async saveScene() {
    const { valid } = (await sceneFormRef.value?.validate?.()) || { valid: false }
    if (!valid) {
      utils.message('error', '请检查场景配置项')
      return
    }
    utils.message('success', '场景配置已保存')
    appStore.serverSettingsDialog = false
  },
})

watch(() => appStore.serverSettingsDialog, (v) => {
  if (v) {
    settingsDialog.sync()
  }
})

// ============================ 底部链接 ============================
function goHome() {
  router.push('/')
}
function showAgreement() {
  utils.message('info', '即将跳转至用户协议（占位）')
}
function showPrivacy() {
  utils.message('info', '即将跳转至隐私政策（占位）')
}
</script>
