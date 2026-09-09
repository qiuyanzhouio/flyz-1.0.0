<template>
  <Dialog v-model="appStore.appSearchDrawer"
          :scrim="'rgba(0, 0, 0, 0.45)'"
          :max-width="720"
          :show-close="true">
    <div class="p-4 pb-2 text-base font-bold">
      项目搜索
    </div>
    <div class="px-4 pb-2">
      <input ref="searchInputRef"
             v-model="searchConfig.keyword"
             type="text"
             class="flyz-search-input"
             placeholder="输入菜单名称或路径"
             autofocus
             @keydown.enter.prevent="searchConfig.jumpFirst">
    </div>
    <div class="flyz-search-divider"></div>

    <div class="flyz-search-list py-2 overflow-auto" style="max-height: 52vh">
      <div class="flyz-search-subheader">
        菜单搜索
      </div>
      <button v-for="item in searchConfig.filtered"
              :key="`${item.path}-${item.id || item.label}`"
              type="button"
              class="flyz-search-item"
              @click="searchConfig.goMenu(item)">
        <i class="flyz-search-item-icon i-mdi-folder"></i>
        <span class="flyz-search-item-body">
          <span class="flyz-search-item-title" v-html="searchConfig.highlight(item.label)"></span>
          <span class="flyz-search-item-sub" v-html="searchConfig.highlight(item.path)"></span>
        </span>
      </button>
      <div v-if="!searchConfig.filtered.length"
           class="flyz-search-empty">
        <div class="flyz-search-empty-title">
          未找到匹配菜单
        </div>
        <div class="flyz-search-empty-sub">
          请尝试其它关键词
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/register/stores/app'
import Dialog from '@/components/dialog.vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const searchInputRef = ref(null)

const searchConfig = reactive({
  keyword: '',
  menus: computed(() => {
    const result = []
    const walk = (list = []) => {
      ;(Array.isArray(list) ? list : []).forEach(item => {
        if (item?.path && item.hidden !== true) {
          result.push({
            id: item.id,
            label: item.label || item.fullName || item.name || item.path,
            path: item.path,
          })
        }
        if (item?.children?.length) {
          walk(item.children)
        }
      })
    }
    walk(appStore.menus)
    return result
  }),
  filtered: computed(() => {
    const keyword = searchConfig.keyword.trim().toLowerCase()
    if (!keyword) {
      return searchConfig.menus
    }

    return searchConfig.menus.filter(item => {
      const label = String(item.label || '').toLowerCase()
      const path = String(item.path || '').toLowerCase()
      return label.includes(keyword) || path.includes(keyword)
    })
  }),
  escapeRegExp(value = '') {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  },
  highlight(text = '') {
    const raw = String(text || '')
    const keyword = this.keyword.trim()
    if (!keyword) {
      return raw
    }

    const safeKeyword = this.escapeRegExp(keyword)
    if (!safeKeyword) {
      return raw
    }

    const reg = new RegExp(`(${safeKeyword})`, 'ig')
    return raw.replace(reg, '<span class="flyz-search-highlight">$1</span>')
  },
  goMenu(item) {
    if (!item?.path) {
      return
    }

    appStore.addOrActivateTabByPath(item.path)
    appStore.appSearchDrawer = false

    if (route.path === item.path) {
      router.push({ path: item.path, query: route.query, hash: route.hash })
      return
    }

    router.push(item.path)
  },
  jumpFirst() {
    const first = this.filtered[0]
    if (first) {
      this.goMenu(first)
    }
  },
})

watch(() => appStore.appSearchDrawer, val => {
  if (val) {
    nextTick(() => {
      searchInputRef.value?.focus?.()
    })
    return
  }

  searchConfig.keyword = ''
})
</script>
