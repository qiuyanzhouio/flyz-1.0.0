/**
 * @class Utils
 * @description 综合业务工具类，涵盖存储、DOM操作、数据处理、性能优化等通用方法。
 * @author qiuw & Gemini
 * @date 2024-05-20
 * @updated 2026-03-02 - 完善 JSDoc 注释与代码健壮性
 */

/**
 * 内部私有辅助：创建存储管理工厂
 * @param {Storage} storage - 原生 Storage 对象 (localStorage 或 sessionStorage)
 * @returns {Object} 封装后的存储操作对象
 */
function createCache(storage) {
  return {
    /**
     * 设置存储项
     * @param {string} key - 键名
     * @param {any} value - 键值（对象会自动转为 JSON 字符串）
     */
    set(key, value) {
      if (key && value !== undefined && value !== null) {
        const val = typeof value === 'object' ? JSON.stringify(value) : value
        storage.setItem(key, val)
      }
    },
    setJSON(key, value) {
      this.set(key, value)
    },
    /**
     * 获取存储项
     * @param {string} key - 键名
     * @returns {string|null} 原始字符串内容
     */
    get(key) {
      return key ? storage.getItem(key) : null
    },
    /**
     * 获取并解析 JSON 存储项
     * @param {string} key - 键名
     * @returns {any} 解析后的对象或 null
     */
    getJSON(key) {
      const value = this.get(key)
      try {
        return value ? JSON.parse(value) : null
      } catch (error) {
        console.error('JSON parse error in Cache:', error)
        return null
      }
    },
    /** 移除指定项 */
    remove(key) {
      storage.removeItem(key)
    },
    /** 清空所有存储 */
    clear() {
      storage.clear()
    },
  }
}

export default class Utils {
  /**
   * @description 会话存储管理 (Browser SessionStorage)
   */
  static sessionCache = createCache(window.sessionStorage)

  /**
   * @description 本地持久化存储管理 (Browser LocalStorage)
   */
  static localCache = createCache(window.localStorage)

  /**
   * @description 现代浏览器事件监听器封装
   */
  static eventListener = {
    /**
     * 绑定事件
     * @param {Element|Window|Document} element - 目标元素
     * @param {string} event - 事件名称
     * @param {Function} handler - 回调函数
     * @param {boolean|Object} options - 监听选项
     */
    on(element, event, handler, options = false) {
      element?.addEventListener?.(event, handler, options)
    },
    /**
     * 移除事件
     * @param {Element|Window|Document} element - 目标元素
     * @param {string} event - 事件名称
     * @param {Function} handler - 回调函数
     * @param {boolean|Object} options - 监听选项
     */
    off(element, event, handler, options = false) {
      element?.removeEventListener?.(event, handler, options)
    },
  }

  /**
   * @description 浏览器环境检测
   * @property {boolean} isFirefox - 是否为火狐浏览器
   * @property {boolean} isChrome - 是否为 Chrome 浏览器
   * @property {boolean} isSafari - 是否为 Safari 浏览器
   * @property {boolean} isIE - 是否为 IE 浏览器 (基于 documentMode)
   */
  static browser = {
    isFirefox: /firefox/i.test(navigator.userAgent),
    isChrome: !!window.chrome,
    isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
    isIE: 'documentMode' in document,
  }

  /** 根据浏览器类型返回正确的鼠标滚轮事件名 */
  static mousewheelEventName = this.browser.isFirefox ? 'DOMMouseScroll' : 'mousewheel'
  /**
   * @description DOM 类名操作封装
   */
  static classList = {
    /** 检查是否包含类名 */
    has: (target, cls) => target?.classList?.contains(cls),
    /** 添加类名 */
    add: (target, cls) => target?.classList?.add(cls),
    /** 移除类名 */
    remove: (target, cls) => target?.classList?.remove(cls),
    /** 切换类名 */
    toggle: (target, cls) => target?.classList?.toggle(cls),
  }

  /**
   * @description 生成全局唯一标识符 (GUID)
   * @returns {string} UUID 字符串
   */
  static getGuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.trunc(Math.random() * 16)
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  /**
   * @description 获取配置数据，支持自定义配置覆盖默认配置
   * @param {string} key - 配置项键名
   * @param {Object} customConfig - 用户自定义配置
   * @param {Object} defaultConfig - 系统默认配置全集
   * @returns {Array} 格式化后的配置数组
   */
  static useConfig(key, customConfig, defaultConfig) {
    const config = customConfig || (defaultConfig && defaultConfig[key]) || {}
    return Object.entries(config).map(([configKey, item]) => ({
      value: configKey,
      ...defaultConfig?.[key]?.[configKey],
      ...item,
    }))
  }

  /**
   * @description Vue Composition API 风格的事件监听钩子
   * @param {Element|Window} target - 目标对象
   * @param {string} event - 事件名
   * @param {Function} callback - 回调
   * @param {boolean|Object} options - 监听配置项
   * @returns {Object} 包含 mount(挂载), unmount(卸载), cleanup(清理) 的对象
   */
  static useEventListener(target, event, callback, options = true) {
    const mount = () => this.eventListener.on(target, event, callback, options)
    const unmount = () => this.eventListener.off(target, event, callback, options)
    return { mount, unmount, cleanup: unmount }
  }

  /**
   * @description 鼠标位置实时追踪工具
   * @returns {Object} 包含坐标对象及启动/停止方法
   */
  static useMouse() {
    const mousePosition = { x: 0, y: 0 }
    const handleMouseMove = (e) => {
      mousePosition.x = e.pageX || e.clientX
      mousePosition.y = e.pageY || e.clientY
    }
    return {
      position: mousePosition,
      start: () => this.eventListener.on(window, 'mousemove', handleMouseMove),
      stop: () => this.eventListener.off(window, 'mousemove', handleMouseMove),
    }
  }

  /**
   * @description 消息提示辅助器
   * @param {Function} snackbar - 传入组件库提供的全局提示方法
   * @returns {Object} 包含 success, error, warning, info 方法的对象
   */
  static createMessageHelper(snackbar) {
    const types = ['success', 'error', 'warning', 'info']
    return types.reduce((acc, type) => {
      acc[type] = (message, options = {}) => snackbar({ ...options, message, color: type })
      return acc
    }, {})
  }

  /**
   * @description 统一消息提示入口
   *
   * 说明：
   * - 代码里多处会调用 Utils.message(type, text)
   * - 这里统一派发全局事件，由 App.vue 中的全局消息队列消费
   */
  static message(type = 'info', message = '', options = {}) {
    try {
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(
          new CustomEvent('app:message', {
            detail: { type, message, ...options },
          }),
        )
        return
      }

      const fn = type === 'error' ? console.error : type === 'warning' ? console.warn : console.log
      fn(`[${type}]`, message)
    } catch (e) {
      console.warn('[Utils.message] failed:', e)
    }
  }

  /**
   * @description 处理并替换无效的业务数据
   * @param {any} value - 待检测值
   * @param {string} invalid - 无效时的占位符，默认为 '-'
   * @returns {any} 原值或占位符
   */
  static setValidData(value = '', invalid = '-') {
    const invalidValues = new Set(['', '-', '-999', '-999.0', '-999.00', 'null', 'undefined'])
    return (value === undefined || invalidValues.has(String(value))) ? invalid : value
  }

  /**
   * @description 化学指标下标美化转换（如 NO2 -> NO₂）
   * @param {string} label - 原始文本
   * @param {string} dateType - 'hour' 或 'day'，决定 O3 是否显示为 8h 平均
   * @returns {string} 包含下标符号的字符串
   */
  static addSubToLabel(label, dateType = 'hour') {
    if (!label) {
      return ''
    }
    let pol = String(label).toUpperCase()
    const replacements = [
      { pattern: /NO2/g, replacement: 'NO₂' },
      { pattern: /SO2/g, replacement: 'SO₂' },
      { pattern: /O3(_8H)?/g, replacement: dateType === 'day' ? 'O₃_8h' : 'O₃' },
      { pattern: /PM2\.5|PM25/g, replacement: 'PM₂.₅' },
      { pattern: /PM10/g, replacement: 'PM₁₀' },
    ]
    for (const { pattern, replacement } of replacements) {
      pol = pol.replace(pattern, replacement)
    }
    return pol
  }

  /**
   * @description 简单的模板字符串解析
   * @example formatTemplate('Hello {name}', {name: 'Gemini'}) -> 'Hello Gemini'
   * @param {string} template - 包含 {key} 的模板
   * @param {Object} data - 数据源
   * @returns {string} 替换后的字符串
   */
  static formatTemplate(template = '', data = {}) {
    return template.replace(/\{(\w+)}/g, (match, key) => data[key] ?? match)
  }

  /**
   * @description 数组扁平化与树形结构互转
   * @param {Array} arr - 数据源
   * @param {'toFlat'|'toTree'} direction - 转换方向
   * @param {Object} config - 字段映射配置 { children, id, parentId }
   * @returns {Array} 转换后的数组
   */
  static flattenArray(arr, direction = 'toFlat', config = {}) {
    const { children = 'children', parentId = 'parentId', id = 'id' } = config

    if (direction === 'toFlat') {
      const result = []
      const flatten = (items) => {
        for (const item of items) {
          result.push(item)
          if (Array.isArray(item[children])) {
            flatten(item[children])
          }
        }
      }
      flatten(arr)
      return result
    }

    const map = {}
    const roots = []
    for (const item of arr) {
      map[item[id]] = { ...item, [children]: [] }
    }
    for (const item of arr) {
      const node = map[item[id]]
      const parent = map[item[parentId]]
      if (parent) {
        parent[children].push(node)
      } else {
        roots.push(node)
      }
    }
    return roots
  }

  /**
   * @description 函数防抖
   * @param {Function} func - 目标函数
   * @param {number} wait - 延迟毫秒数
   * @param {boolean} immediate - 是否立即执行一次
   */
  static debounce(func, wait, immediate = false) {
    let timeout
    return function (...args) {
      const later = () => {
        timeout = null
        if (!immediate) {
          func.apply(this, args)
        }
      }
      const callNow = immediate && !timeout
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
      if (callNow) {
        func.apply(this, args)
      }
    }
  }

  /**
   * @description 函数节流
   * @param {Function} func - 目标函数
   * @param {number} limit - 限制时间(ms)
   */
  static throttle(func, limit) {
    let inThrottle
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  }

  /**
   * @description 基于 RequestAnimationFrame 的极致节流，适用于滚动/绘图
   */
  static rafThrottle(func) {
    let isLocked = false
    return function (...args) {
      if (isLocked) {
        return
      }
      isLocked = true
      requestAnimationFrame(() => {
        func.apply(this, args)
        isLocked = false
      })
    }
  }

  /**
   * @description 计算指定字体下文本在 Canvas 中的像素宽度
   * @param {string} text - 文本
   * @param {number} fontSize - 字号
   * @param {string} fontFamily - 字体
   * @returns {number} 宽度像素值
   */
  static getTextWidth(text = '', fontSize = 16, fontFamily = 'Arial') {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) {
      return 0
    }
    context.font = `${fontSize}px ${fontFamily}`
    return context.measureText(text).width
  }

  /**
   * @description 安全的 JSON 解析，避免异常中断执行
   * @param {string} jsonString - 待解析字符串
   * @param {any} defaultValue - 解析失败时的默认返回
   */
  static safeJsonParse(jsonString, defaultValue = null) {
    try {
      return jsonString ? JSON.parse(jsonString) : defaultValue
    } catch {
      return defaultValue
    }
  }

  /**
   * @description 批量重置对象中所有字符串属性的值
   * @param {Object} obj - 目标对象
   * @param {string} defaultValue - 重置后的值
   */
  static resetObject(obj, defaultValue = '') {
    if (!obj || typeof obj !== 'object') {
      return obj
    }
    const result = { ...obj }
    for (const key of Object.keys(result)) {
      if (typeof result[key] === 'string') {
        result[key] = defaultValue
      }
    }
    return result
  }

  /**
   * @description 异步文件下载处理流程
   * @param {Function} apiFunction - API 请求函数
   * @param {Object} params - 请求参数
   * @param {Object} options - 配置项（如是否显示通知）
   */
  static async downloadFile(apiFunction, params = {}, options = {}) {
    const { showNotification = true, notificationMessage = '正在准备下载，请稍候...' } = options
    if (showNotification) {
      return {
        type: 'info',
        message: notificationMessage,
        action: async () => {
          const res = await apiFunction(params)
          this.handleDownloadResponse(res)
        },
      }
    }
    const response = await apiFunction(params)
    this.handleDownloadResponse(response)
  }

  /**
   * @description 处理下载请求的二进制响应并触发浏览器下载
   * @param {Object} response - Axios 或原生 Fetch 响应对象
   */
  static handleDownloadResponse(response) {
    if (!response?.data) {
      throw new Error('Invalid response')
    }
    const headers = response.headers || {}
    const contentDisposition = headers['content-disposition'] || headers['Content-Disposition']
    let filename = 'download'

    if (contentDisposition) {
      const matches = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i) ||
        contentDisposition.match(/filename="?([^;"\n]+)"?/i)
      if (matches?.[1]) {
        filename = decodeURIComponent(matches[1].replace(/['"]/g, ''))
      }
    }

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.append(link)
    link.click()
    setTimeout(() => {
      link.remove()
      window.URL.revokeObjectURL(url)
    }, 100)
  }

  /**
   * @description 递归深度合并两个对象
   */
  static deepMerge(target, source) {
    const output = { ...target }
    if (this.isObject(target) && this.isObject(source)) {
      for (const key of Object.keys(source)) {
        if (this.isObject(source[key])) {
          output[key] = (key in target) ? this.deepMerge(target[key], source[key]) : source[key]
        } else {
          output[key] = source[key]
        }
      }
    }
    return output
  }

  /** 简单的对象类型检测 */
  static isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item)
  }

  /**
   * @description 获取并解析当前 URL 的查询参数
   * @param {string} url - 指定 URL，默认为 location.href
   * @returns {Object} 参数键值对
   */
  static getUrlParams(url = window.location.href) {
    const params = {}
    for (const [key, value] of new URL(url).searchParams.entries()) {
      params[key] = value
    }
    return params
  }

  /**
   * @description 自定义日期格式化
   * @param {Date|string|number} date - 日期源
   * @param {string} fmt - 格式模板 (YYYY-MM-DD HH:mm:ss)
   * @returns {string} 格式化后的字符串
   */
  static formatDate(date = new Date(), fmt = 'YYYY-MM-DD HH:mm:ss') {
    const d = new Date(date)
    if (Number.isNaN(d.getTime())) {
      return ''
    }
    const o = {
      'M+': d.getMonth() + 1,
      'D+': d.getDate(),
      'H+': d.getHours(),
      'm+': d.getMinutes(),
      's+': d.getSeconds(),
    }
    let res = fmt.replace(/Y+/, (match) => String(d.getFullYear()).slice(4 - match.length))
    for (const k in o) {
      if (new RegExp(`(${k})`).test(res)) {
        res = res.replace(RegExp.$1, (match) =>
          match.length === 1 ? o[k] : String(o[k]).padStart(2, '0'),
        )
      }
    }
    return res
  }
}

// 导出解构出的别名，方便外部直接 import { debounce } from '@/utils'
export const {
  sessionCache,
  localCache,
  eventListener,
  browser,
  classList,
  getGuid,
  useConfig,
  useEventListener,
  useMouse,
  createMessageHelper,
  setValidData,
  addSubToLabel,
  formatTemplate,
  flattenArray,
  debounce,
  throttle,
  rafThrottle,
  getTextWidth,
  safeJsonParse,
  resetObject,
  downloadFile,
  deepMerge,
  getUrlParams,
  formatDate,
} = Utils
