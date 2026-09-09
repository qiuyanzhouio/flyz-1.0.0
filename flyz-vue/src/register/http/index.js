import axios from 'axios'
import utils from '@/register/utils'
import pinia from '@/register/stores'
import { useAppStore } from '@/register/stores/app.js'
import router from '@/register/router/index.js'

const getAppStore = () => useAppStore(pinia)
const getRouter = () => router

/**
 * HTTP 请求封装
 *
 * 保留功能：动态 baseURL、token 注入、GET 防缓存、全局 loading 计数、
 *           业务错误码处理、401 跳转、HTTP 状态码错误提示
 */
class Http {
  static DEFAULT_CONFIG = {
    baseURL: '',
    timeout: Number(import.meta.env.VITE_TIMEOUT) || 10000,
    validateStatus: status => status === 200,
    // GET 请求是否追加时间戳防缓存
    joinTime: true,
    // 请求是否携带 Authorization token
    withToken: true,
    // 是否自动弹出错误提示
    showError: true,
    // 是否在控制台打印请求/响应日志
    enableLog: false,
    // 自定义请求头 Content-Type
    contentType: '',
  }

  /**
   * @param {Partial<Http.DEFAULT_CONFIG> & { dynamicBaseUrlGetter?: () => string }} [options]
   */
  constructor(options = {}) {
    this.config = { ...Http.DEFAULT_CONFIG, ...options }
    this.dynamicBaseUrlGetter = options.dynamicBaseUrlGetter || null
    this.enableLog = this.config.enableLog

    this.service = axios.create({
      timeout: this.config.timeout,
      baseURL: this.config.baseURL || '',
      validateStatus: this.config.validateStatus,
    })

    this.setupInterceptors()
  }

  setupInterceptors() {
    // 请求拦截：注入 token
    this.service.interceptors.request.use(
      config => {
        if (this.enableLog) {
          console.log(`[Request] ${config.method?.toUpperCase()} ${config.url}`, config.params || config.data)
        }
        if (config.withToken !== false) {
          const appStore = getAppStore()
          if (appStore.token) {
            config.headers = { ...config.headers, Authorization: appStore.token }
          }
        }
        return config
      },
      error => {
        if (this.enableLog) {
          console.error('[Request Error]', error)
        }
        return Promise.reject(error)
      },
    )

    // 响应拦截：仅做日志透传，业务处理在 handleResponse 中
    this.service.interceptors.response.use(
      response => {
        if (this.enableLog) {
          console.log(`[Response] ${response.config.url}`, response.data)
        }
        return response
      },
      error => {
        if (this.enableLog) {
          console.error('[Response Error]', error)
        }
        return Promise.reject(error)
      },
    )
  }

  /**
   * 核心请求方法
   * @param {object} params 请求参数（url / method / data / params / headers 等）
   * @param {Partial<Http.DEFAULT_CONFIG>} [config] 请求级配置覆盖
   * @param {boolean} [loading=true] 是否触发全局 loading 计数
   * @returns {Promise<any>} 响应 data
   */
  async request(params = {}, config = {}, loading = true) {
    // 动态 baseURL
    if (this.dynamicBaseUrlGetter) {
      const dynamicBase = this.dynamicBaseUrlGetter()
      if (dynamicBase !== undefined) {
        this.service.defaults.baseURL = dynamicBase
      }
    }

    const finalConfig = { ...this.config, ...config }
    const requestParams = this.beforeRequestHook({ ...params }, finalConfig)

    // 注入 Content-Type
    if (finalConfig.contentType) {
      requestParams.headers = { 'Content-Type': finalConfig.contentType, ...(requestParams.headers || {}) }
    }

    const { appStore } = this.onRequestStart(loading)

    try {
      const response = await this.service.request(requestParams)
      return await this.handleResponse(response.data, finalConfig)
    } catch (error) {
      if (!axios.isCancel(error)) {
        await this.handleError(error, finalConfig)
      }
      throw error
    } finally {
      this.onRequestEnd({ appStore, loading })
    }
  }

  /**
   * 请求前处理：拼接 apiUrl、GET 请求追加时间戳
   */
  beforeRequestHook(params, config) {
    const method = (params.method || 'GET').toUpperCase()
    if (method === 'GET' && config.joinTime) {
      params.params = { ...(params.params || {}), _t: Date.now() }
    }
    return params
  }

  /**
   * 处理响应：业务错误码检查
   */
  async handleResponse(data, config) {
    await this.handleResponseError(data, config)
    return data
  }

  /**
   * 业务错误码处理
   */
  async handleResponseError(data, config) {
    const { code, message, msg } = data
    const text = message || msg
    if (code !== 200 && config.showError) {
      utils.message('error', text)
    }
    if (code === 401 || code === 600) {
      await this.handleUnauthorized(text)
    }
  }

  /**
   * HTTP 层错误处理
   */
  async handleError(error, config) {
    if (!error.response) {
      if (config.showError) {
        utils.message('error', '网络连接失败，请检查网络设置')
      }
      return
    }

    const { status } = error.response
    const errorMessages = {
      400: '请求参数错误',
      401: '未授权，请重新登录',
      403: '无权限访问',
      404: '资源未找到或已删除',
      405: '方法不允许',
      408: '请求超时',
      429: '请求过于频繁，请稍后再试',
      500: '服务器内部错误',
      502: '网关错误',
      503: '服务不可用',
      504: '网关超时',
    }

    const message = errorMessages[status] || `请求失败 (${status})`
    if (config.showError) {
      utils.message('error', message)
    }
    if (status === 401 || status === 600) {
      await this.handleUnauthorized(message)
    }
  }

  /**
   * 401 / 600 未授权：登出 + 跳转登录页
   */
  async handleUnauthorized(message) {
    const appStore = getAppStore()
    const router = getRouter()

    if (router.currentRoute?.value?.path === '/login') {
      return
    }

    await appStore.logout()
    utils.message('error', message || '登录信息已过期，请重新登录')
    await router.push('/login')
  }

  onRequestStart(loading) {
    const appStore = getAppStore()
    if (loading) {
      appStore.loadNums = (appStore.loadNums || 0) + 1
    }
    return { appStore, loading }
  }

  onRequestEnd({ appStore, loading }) {
    if (loading && appStore?.loadNums > 0) {
      appStore.loadNums = Math.max(appStore.loadNums - 1, 0)
    }
  }
}

const DEV = import.meta.env.DEV

const javaHttp = new Http({
  enableLog: DEV,
  dynamicBaseUrlGetter: () => {
    try {
      return getAppStore().javaBaseUrl || ''
    } catch {
      return ''
    }
  },
})

const pythonHttp = new Http({
  enableLog: DEV,
  dynamicBaseUrlGetter: () => {
    try {
      return getAppStore().pythonBaseUrl || ''
    } catch {
      return ''
    }
  },
})

export { javaHttp, pythonHttp }
