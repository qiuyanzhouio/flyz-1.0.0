import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth_login, auth_me } from '@/apis/login'

// ============================
// 纯工具函数（模块级，不依赖响应式状态）
// ============================

let DEFAULT_HOME_PATH = '/home'

function normalizeMenuPath(path = '') {
  const clean = String(path || '').trim().replace(/^\/+|\/+$/g, '')
  return clean ? `/${clean}` : ''
}

function normalizeMenuList(menuList = []) {
  const walk = (list = []) => (Array.isArray(list) ? list : []).map(item => {
    const children = walk(item?.children)
    return {
      ...item,
      name: item?.name || '',
      path: normalizeMenuPath(item?.path),
      children,
    }
  })

  return walk(menuList)
}

function buildHomeTab(menuList = []) {
  const walk = (list = []) => {
    for (const item of (Array.isArray(list) ? list : [])) {
      if (item?.path && !item.children?.length) {
        return item
      }
      const found = walk(item?.children)
      if (found) {
        return found
      }
    }
    return null
  }

  const firstLeaf = walk(menuList) || {}
  const homeName = firstLeaf?.name || '首页'
  const homePath = firstLeaf?.path
  return {
    id: 'home',
    title: homeName,
    icon: 'mdi-home',
    path: homePath || DEFAULT_HOME_PATH,
    closable: false,
  }
}

function getDefaultSettings() {
  return {
    header: 50,
    menus: 0,
    lastMenuWidth: 245,
    tabs: 0,
    footer: 0,
  }
}

function normalizeSettings(settings = {}) {
  const toNumber = (val, fallback = 0) => {
    if (Array.isArray(val)) {
      return Number(val[0] ?? fallback)
    }
    const num = Number(val)
    return Number.isFinite(num) ? num : fallback
  }

  const defaults = getDefaultSettings()
  return {
    ...defaults,
    ...(settings || {}),
    header: toNumber(settings?.header, defaults.header),
    menus: toNumber(settings?.menus, defaults.menus),
    tabs: toNumber(settings?.tabs, defaults.tabs),
    footer: toNumber(settings?.footer, defaults.footer),
    lastMenuWidth: toNumber(settings?.lastMenuWidth, defaults.lastMenuWidth),
  }
}

/**
 * 服务列表元数据：从环境变量 VITE_SERVER_LIST 解析。
 * 返回数组：[{ key, label, defaultValue, proxyTarget, placeholder }]
 */
function getServerConfigMeta() {
  let list = []
  try {
    const raw = import.meta.env.VITE_SERVER_LIST
    if (raw) {
      list = typeof raw === 'string' ? JSON.parse(raw) : (Array.isArray(raw) ? raw : [])
    }
  } catch (_e) {
    list = []
  }

  // VITE_SERVER_LIST 未配置时，回退到内置的两个默认服务
  if (!Array.isArray(list) || list.length === 0) {
    list = [
      { key: 'javaBaseUrl', label: 'Java 服务地址', defaultValue: '', placeholder: 'http://ip:port/japi' },
      { key: 'pythonBaseUrl', label: '代理服务地址', defaultValue: '', placeholder: 'http://ip:port/papi' },
    ]
  }

  return list
    .filter(item => item && typeof item.key === 'string' && item.key.trim())
    .map(item => ({
      key: String(item.key).trim(),
      label: String(item.label || item.key || '').trim(),
      defaultValue: String(item.defaultValue || '').trim(),
      proxyTarget: String(item.proxyTarget || '').trim(),
      placeholder: String(item.placeholder || '请输入地址').trim(),
    }))
}

const serverConfigMeta = getServerConfigMeta()

const serverDefaults = Object.fromEntries(
  serverConfigMeta.map(item => [item.key, item.defaultValue || '']),
)

// ============================
// Store 定义
// ============================

export const useAppStore = defineStore('app', () => {
  // --- state ---
  const title = ref('为匠-控制器管理')
  const token = ref('')
  const userInfo = ref(null)
  const loadNums = ref(0)
  const menus = ref([])
  const defaultHomePath = ref(DEFAULT_HOME_PATH)
  const tabs = ref([buildHomeTab()])
  const tabRefreshMap = ref({})
  const appSearchDrawer = ref(false)
  const appUserDrawer = ref(false)
  const appSettingsDrawer = ref(false)
  const serverSettingsDialog = ref(false)
  const settings = ref(getDefaultSettings())
  // 动态服务地址表：{ [key]: url }
  const serverBaseUrls = ref({ ...serverDefaults })

  // --- getters (computed) ---
  // 菜单叶子集合（内部使用）
  const allMenuLeaves = computed(() =>
    menus.value.flatMap(item => {
      const children = item.children || []
      if (children.length) {
        return children
      }
      return item?.path ? [item] : []
    }),
  )

  const menuLeafMap = computed(() =>
    allMenuLeaves.value.reduce((acc, item) => {
      if (item?.path) {
        acc[item.path] = item
      }
      return acc
    }, {}),
  )

  const effectiveHomePath = computed(() =>
    allMenuLeaves.value.find(item => item?.path)?.path || defaultHomePath.value,
  )

  const homeTabPath = computed(() => {
    const home = tabs.value.find(tab => tab.id === 'home' && tab.closable === false)
    return home?.path || ''
  })

  const isAuthed = computed(() => Boolean(token.value))

  // http 层动态 baseURL 快捷访问
  const javaBaseUrl = computed(() => serverBaseUrls.value.javaBaseUrl || '')
  const pythonBaseUrl = computed(() => serverBaseUrls.value.pythonBaseUrl || '')

  // --- actions ---
  async function loginByPassword(data) {
    const res = await auth_login(data)
    token.value = res.data.token_type + ' ' + res.data.access_token
    return res.code === 200
  }

  async function loginByQrcode() {
    await new Promise(resolve => setTimeout(resolve, 350))
    token.value = `mock-qrcode-token-${Date.now()}`
    userInfo.value = { name: '扫码用户' }
    return token.value
  }

  async function refreshCurrentUser(params = {}) {
    const res = await auth_me(params)
    userInfo.value = res?.data || null
    menus.value = normalizeMenuList(res?.data?.menus || [])
    tabs.value = [buildHomeTab(menus.value)]
    defaultHomePath.value = tabs.value[0].path || DEFAULT_HOME_PATH
    tabRefreshMap.value = {}
    return res
  }

  async function registerUser({ account }) {
    await new Promise(resolve => setTimeout(resolve, 350))
    token.value = `mock-register-token-${Date.now()}`
    userInfo.value = { name: account || '新用户' }
    return token.value
  }

  async function resetPassword() {
    await new Promise(resolve => setTimeout(resolve, 350))
    return true
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    tabs.value = [buildHomeTab()]
    tabRefreshMap.value = {}
    loadNums.value = 0
    appSearchDrawer.value = false
  }

  function updateSettings(payload = {}) {
    settings.value = normalizeSettings({
      ...settings.value,
      ...(payload || {}),
    })
  }

  // --- 服务地址管理 ---
  /** 批量保存一组服务地址（来自 Login Form 提交） */
  function setServerBaseUrlMap(map = {}) {
    const next = { ...serverBaseUrls.value }
    for (const k of Object.keys(map || {})) {
      next[k] = String(map[k] || '').trim()
    }
    serverBaseUrls.value = next
  }

  /** 重置所有服务地址到环境变量默认值 */
  function resetServerBaseUrlsToDefaults() {
    serverBaseUrls.value = { ...serverDefaults }
  }

  // --- Tab 管理 ---
  function addOrActivateTabByPath(path, query = {}) {
    const menu = menuLeafMap.value[path]
    if (!menu) {
      return
    }

    const idx = tabs.value.findIndex(tab => tab.path === path)
    if (idx > -1) {
      tabs.value[idx] = {
        ...tabs.value[idx],
        query: { ...(query || {}) },
      }
      return
    }

    tabs.value.push({
      id: menu.id,
      title: menu.name,
      icon: menu.icon || 'mdi-file-document-outline',
      path: menu.path,
      closable: menu.path !== homeTabPath.value,
      query: { ...(query || {}) },
    })
  }

  function removeTabByPath(path) {
    tabs.value = tabs.value.filter(
      tab => tab.path !== path || tab.path === homeTabPath.value,
    )
  }

  function removeOtherTabs(path) {
    tabs.value = tabs.value.filter(
      tab => tab.path === homeTabPath.value || tab.path === path,
    )
  }

  function removeAllClosableTabs() {
    tabs.value = tabs.value.filter(tab => tab.path === homeTabPath.value)
  }

  function refreshTab(path) {
    const current = tabRefreshMap.value[path] || 0
    tabRefreshMap.value = {
      ...tabRefreshMap.value,
      [path]: current + 1,
    }
  }

  return {
    // state
    title,
    token,
    userInfo,
    loadNums,
    menus,
    defaultHomePath,
    tabs,
    tabRefreshMap,
    appSearchDrawer,
    appUserDrawer,
    appSettingsDrawer,
    serverSettingsDialog,
    settings,
    serverBaseUrls,
    // getters
    effectiveHomePath,
    homeTabPath,
    isAuthed,
    serversConfigMeta: serverConfigMeta,
    javaBaseUrl,
    pythonBaseUrl,
    // actions
    loginByPassword,
    loginByQrcode,
    refreshCurrentUser,
    registerUser,
    resetPassword,
    logout,
    updateSettings,
    setServerBaseUrlMap,
    resetServerBaseUrlsToDefaults,
    addOrActivateTabByPath,
    removeTabByPath,
    removeOtherTabs,
    removeAllClosableTabs,
    refreshTab,
  }
}, {
  persist: {
    key: 'pinia-app',
    storage: 'local',
    version: '1.7',
    expire: 1000 * 60 * 60,
    paths: ['token', 'userInfo', 'menus', 'tabs', 'tabRefreshMap', 'settings', 'serverBaseUrls'],
    sanitize(data) {
      if ('token' in data && !data.token) {
        return null
      }
      return data
    },
  },
})
