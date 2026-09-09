<template>
  <transition enter-active-class="animate__animated animate__fadeInDown animate__faster"
              leave-active-class="animate__animated animate__fadeOutUp animate__faster">
    <div v-if="appStore.settings.tabs"
         class="flyz-tabs-bar"
         :style="{ height: `${appStore.settings.tabs}px` }">
      <div ref="scrollerRef"
           class="flyz-tabs-scroller"
           @wheel.prevent="tabsConfig.handleWheel">
        <div class="flyz-tabs-list">
          <div v-for="item in tabsConfig.visibleTabs"
               :key="item.path"
               :class="item.path === tabsConfig.activeTab ? 'flyz-tab-active' : 'flyz-tab'"
               :title="item.title"
               @click="tabsConfig.goTab(item.path)">
            <i :class="['flyz-tab-icon', tabsConfig.iconClass(item.icon)]"></i>
            <span class="flyz-tab-title">{{ item.title }}</span>
            <i v-if="item.path === tabsConfig.activeTab" class="i-mdi-dots-vertical flyz-tab-menu" @click.stop="tabsConfig.toggleMenu(item.path, $event)"></i>
          </div>
        </div>
      </div>
    </div>
  </transition>
  <!-- 下拉菜单 teleport 到 body：避免被 scroller 的 overflow 裁剪 -->
  <Teleport to="body">
    <transition enter-active-class="animate__animated animate__fadeIn animate__faster" leave-active-class="animate__animated animate__fadeOut animate__faster">
      <div v-if="tabsConfig.openTab"
           class="flyz-tab-menu-dropdown"
           :style="tabsConfig.dropdownStyle"
           @click.stop>
        <button type="button" class="flyz-tab-menu-item" @click.stop="tabsConfig.onMenuAction('refresh', tabsConfig.openTab)">
          <i class="i-mdi-refresh mr-1"></i>刷新
        </button>
        <button type="button"
                :class="!tabsConfig.openTab.closable ? 'flyz-tab-menu-item-disabled' : 'flyz-tab-menu-item'"
                :disabled="!tabsConfig.openTab.closable"
                @click.stop="tabsConfig.onMenuAction('close', tabsConfig.openTab)">
          <i class="i-mdi-close mr-1"></i>关闭当前
        </button>
        <button type="button" class="flyz-tab-menu-item" @click.stop="tabsConfig.onMenuAction('closeOthers', tabsConfig.openTab)">
          关闭其他
        </button>
        <button type="button" class="flyz-tab-menu-item" @click.stop="tabsConfig.onMenuAction('closeAll', tabsConfig.openTab)">
          关闭全部
        </button>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/register/stores/app.js'

const appStore = useAppStore()
const route = useRoute()
const router = useRouter()

const scrollerRef = ref(null)

// ============================ 标签页 ============================
const tabsConfig = reactive({
  openMenuPath: '',
  // 下拉菜单 fixed 定位坐标（teleport 到 body，相对视口）
  dropdownPos: { top: '0px', left: '0px' },
  tabs: computed(() => appStore.tabs),
  // 当前打开下拉菜单的标签页
  openTab: computed(() => tabsConfig.tabs.find(tab => tab.path === tabsConfig.openMenuPath) || null),
  dropdownStyle: computed(() => tabsConfig.dropdownPos),
  hiddenPathSet: computed(() => {
    const set = new Set()
    const walk = list => {
      ;(list || []).forEach(item => {
        if (item?.path && item.hidden === true) {
          set.add(item.path)
        }
        if (item?.children?.length) {
          walk(item.children)
        }
      })
    }
    walk(appStore.menus)
    return set
  }),
  visibleTabs: computed(() => tabsConfig.tabs.filter(tab => !tabsConfig.hiddenPathSet.has(tab.path))),
  activeTab: computed(() => {
    const currentVisibleTab = tabsConfig.visibleTabs.find(tab => tab.path === route.path)
    return currentVisibleTab?.path || ''
  }),
  iconClass(icon) {
    if (!icon) {
      return 'i-mdi-file-document-outline'
    }
    return icon.startsWith('i-') ? icon : `i-${icon}`
  },
  goTab(path) {
    const tab = this.tabs.find(item => item.path === path)
    const query = tab?.query || route.query

    if (path === route.path) {
      router.push({ path, query, hash: route.hash })
      return
    }

    if (tab?.query) {
      router.push({ path, query: tab.query })
      return
    }

    router.push(path)
  },
  refreshCurrent(path) {
    appStore.refreshTab(path)
    this.goTab(path)
  },
  removeTab(path) {
    if (path === appStore.homeTabPath) {
      return
    }

    const idx = this.visibleTabs.findIndex(tab => tab.path === path)
    appStore.removeTabByPath(path)

    if (route.path === path) {
      const next = this.visibleTabs[idx - 1] || this.visibleTabs[idx] || this.visibleTabs[this.visibleTabs.length - 1]
      if (next?.query) {
        router.push({ path: next.path, query: next.query })
      } else {
        router.push(next?.path || appStore.homeTabPath)
      }
    }
  },
  removeOthers(path) {
    appStore.removeOtherTabs(path)
    if (route.path !== path) {
      const tab = this.tabs.find(item => item.path === path)
      if (tab?.query) {
        router.push({ path, query: tab.query })
      } else {
        router.push(path)
      }
    }
  },
  removeAll() {
    appStore.removeAllClosableTabs()
    if (route.path !== appStore.homeTabPath) {
      router.push(appStore.homeTabPath)
    }
  },
  /**
   * 切换下拉菜单显隐，并记录触发按钮的视口坐标
   * @param {string} path 标签页路径
   * @param {MouseEvent} event 点击事件（用于获取按钮位置）
   */
  toggleMenu(path, event) {
    if (this.openMenuPath === path) {
      this.openMenuPath = ''
      return
    }
    const rect = event?.currentTarget?.getBoundingClientRect?.()
    if (rect) {
      this.dropdownPos = {
        top: `${Math.round(rect.bottom) + 4}px`,
        right: `${Math.round(window.innerWidth - rect.right)}px`,
      }
    }
    this.openMenuPath = path
  },
  onMenuAction(action, item) {
    this.openMenuPath = ''
    switch (action) {
      case 'refresh':
        this.refreshCurrent(item.path)
        break
      case 'close':
        this.removeTab(item.path)
        break
      case 'closeOthers':
        this.removeOthers(item.path)
        break
      case 'closeAll':
        this.removeAll()
        break
    }
  },
  handleDocClick(e) {
    if (!this.openMenuPath) {
      return
    }
    const el = e.target
    if (el && el.closest && el.closest('.flyz-tab-menu')) {
      return
    }
    this.openMenuPath = ''
  },
  handleWheel(e) {
    if (!scrollerRef.value) {
      return
    }
    // 滚动时收起下拉菜单（fixed 定位不跟随滚动）
    this.openMenuPath = ''
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      scrollerRef.value.scrollLeft += e.deltaY
    }
  },
})

const handleDocClick = e => tabsConfig.handleDocClick(e)

watch(
  () => route.fullPath,
  () => {
    appStore.addOrActivateTabByPath(route.path, route.query)
  },
  { immediate: true },
)

onMounted(() => {
  document.addEventListener('click', handleDocClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocClick)
})
</script>
