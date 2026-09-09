import Utils from '@/register/utils'

/**
 * 轻量 Pinia 持久化插件
 *
 * options.persist 配置：
 *   key       : 缓存键名
 *   storage   : 'local' | 'session'
 *   paths     : 指定持久化的字段（空数组表示全部）
 *   version   : 版本号，不匹配时自动清理旧缓存
 *   expire    : 过期时间（毫秒）
 *   autoCleanup: 版本不匹配/过期时是否自动删除
 *   sanitize  : (data) => data | null  恢复前的数据清洗钩子，返回 null 跳过恢复
 */
export function persist({ store, options }) {
  const persistConfig = options?.persist
  if (!persistConfig) {
    return
  }

  const {
    key = `pinia-${store.$id}`,
    storage = 'local',
    paths = [],
    version = '1.0',
    expire = null,
    autoCleanup = true,
    sanitize = null,
  } = typeof persistConfig === 'object' ? persistConfig : {}

  const cache = storage === 'session' ? Utils.sessionCache : Utils.localCache
  if (!cache) {
    console.error('[PiniaPersist] Storage type invalid or Utils not loaded')
    return
  }

  // --- 初始化加载 ---
  try {
    const rawData = cache.getJSON(key)
    if (rawData) {
      const now = Date.now()
      let isInvalid = false

      if (rawData._v !== version) {
        console.warn(`[PiniaPersist] Store "${store.$id}" Version mismatch: Cache ${rawData._v} vs Current ${version}`)
        isInvalid = true
      } else if (rawData._e && now > rawData._e) {
        console.warn(`[PiniaPersist] Store "${store.$id}" Expired`)
        isInvalid = true
      }

      if (isInvalid) {
        if (autoCleanup) {
          cache.remove(key)
        }
      } else {
        const { _v, _t, _e, ...data } = rawData

        const toPatch = typeof sanitize === 'function' ? sanitize(data, store) : data
        if (toPatch) {
          store.$patch(toPatch)
        }
      }
    }
  } catch (error) {
    console.error('[PiniaPersist] Restore failed:', error)
  }

  // --- 状态订阅 ---
  store.$subscribe(
    (_, state) => {
      let toPersist = {}

      if (paths.length > 0) {
        for (const path of paths) {
          if (state[path] !== undefined) {
            toPersist[path] = state[path]
          }
        }
      } else {
        const raw = Utils.toRaw ? Utils.toRaw(state) : state
        try {
          toPersist = structuredClone(raw)
        } catch {
          toPersist = JSON.parse(JSON.stringify(raw))
        }
      }

      const now = Date.now()
      toPersist._v = version
      toPersist._t = now
      toPersist._e = expire ? now + expire : null

      cache.setJSON(key, toPersist)
    },
    { detached: true },
  )
}
