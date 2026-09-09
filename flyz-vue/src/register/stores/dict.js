import { defineStore } from 'pinia'
import { ref } from 'vue'

const MOCK_DICT_DATA = {
  user_status: [
    { label: '启用', value: '1', color: 'success', sort: 1, status: 1 },
    { label: '停用', value: '0', color: 'grey', sort: 2, status: 1 },
  ],
  gender: [
    { label: '男', value: 'M', sort: 1, status: 1 },
    { label: '女', value: 'F', sort: 2, status: 1 },
    { label: '未知', value: 'U', sort: 3, status: 1 },
  ],
  audit_status: [
    { label: '待审核', value: 'pending', sort: 1, status: 1 },
    { label: '通过', value: 'approved', sort: 2, status: 1 },
    { label: '驳回', value: 'rejected', sort: 3, status: 1 },
  ],
}

// 字典缓存有效期（毫秒）
const DICT_CACHE_TTL = 1000 * 60 * 30

const clone = value => JSON.parse(JSON.stringify(value))

export const useDictStore = defineStore('dict', () => {
  // --- state ---
  const dictCache = ref({})
  const dictLoadedAt = ref({})
  // 请求去重：{ [dictCode]: Promise }
  const loadingMap = ref({})

  // --- actions ---
  function setDict(dictCode, list = []) {
    if (!dictCode) {
      return
    }
    dictCache.value = {
      ...dictCache.value,
      [dictCode]: clone(list),
    }
    dictLoadedAt.value = {
      ...dictLoadedAt.value,
      [dictCode]: Date.now(),
    }
  }

  function getDict(dictCode) {
    if (!dictCode) {
      return []
    }
    return dictCache.value[dictCode] || []
  }

  function isExpired(dictCode) {
    const loadedAt = dictLoadedAt.value[dictCode]
    return !loadedAt || Date.now() - loadedAt > DICT_CACHE_TTL
  }

  async function loadDict(dictCode, options = {}) {
    const { force = false } = options
    if (!dictCode) {
      return []
    }

    if (!force && Array.isArray(dictCache.value[dictCode]) && !isExpired(dictCode)) {
      return getDict(dictCode)
    }

    if (loadingMap.value[dictCode]) {
      return loadingMap.value[dictCode]
    }

    const requestPromise = fetchDictFromServer(dictCode)
      .then((list) => {
        const normalized = Array.isArray(list)
          ? [...list].sort((a, b) => (a.sort || 0) - (b.sort || 0))
          : []

        setDict(dictCode, normalized)
        return getDict(dictCode)
      })
      .finally(() => {
        const nextLoadingMap = { ...loadingMap.value }
        delete nextLoadingMap[dictCode]
        loadingMap.value = nextLoadingMap
      })

    loadingMap.value = {
      ...loadingMap.value,
      [dictCode]: requestPromise,
    }

    return requestPromise
  }

  function getDictLabel(dictCode, value, defaultLabel = '-') {
    const item = getDict(dictCode).find(it => String(it.value) === String(value))
    return item?.label ?? defaultLabel
  }

  function getDictColor(dictCode, value, defaultColor = 'grey') {
    const item = getDict(dictCode).find(it => String(it.value) === String(value))
    return item?.color ?? defaultColor
  }

  async function fetchDictFromServer(dictCode) {
    await new Promise(resolve => setTimeout(resolve, 200))
    return clone(MOCK_DICT_DATA[dictCode] || [])
  }

  return {
    // state（持久化字段）
    dictCache,
    dictLoadedAt,
    // actions
    setDict,
    getDict,
    loadDict,
    getDictLabel,
    getDictColor,
  }
}, {
  persist: {
    key: 'pinia-dict',
    storage: 'session',
    version: '1.1',
    expire: 1000 * 60 * 60,
    paths: ['dictCache', 'dictLoadedAt'],
  },
})
