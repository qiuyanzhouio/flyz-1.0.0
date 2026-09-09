<template>
  <transition enter-active-class="animate__animated animate__slideInLeft animate__faster"
              leave-active-class="animate__animated animate__slideOutLeft animate__faster">
    <div v-if="appStore.settings.menus"
         class="h-full overflow-auto"
         :style="{ width: `${appStore.settings.menus}px` }">
      <!-- compact mode: 图标 + 悬浮弹出子菜单 -->
      <div v-if="menuConfig.displayMode === 'compact'" class="flyz-menu-list">
        <div v-for="item in menuConfig.menuData"
             :key="item.id"
             @mouseenter="menuConfig.onCompactEnter(item, $event)"
             @mouseleave="menuConfig.onCompactLeave">
          <button type="button"
                  :class="menuConfig.isPrimaryActive(item.id) ? 'flyz-menu-item-active' : 'flyz-menu-item'"
                  :title="item.name"
                  @click="menuConfig.onPrimaryClick(item)">
            <i :class="['flyz-menu-item-icon', menuConfig.iconClass(item.icon)]"></i>
          </button>
        </div>
      </div>

      <!-- tree mode: 树形展开 -->
      <div v-else-if="menuConfig.displayMode === 'tree'" class="flyz-menu-list">
        <template v-for="item in menuConfig.menuData" :key="item.id">
          <div v-if="menuConfig.hasChildren(item)">
            <button type="button"
                    :class="['flyz-menu-item flyz-menu-parent', menuConfig.isPrimaryActive(item.id) ? 'flyz-menu-item-active' : '']"
                    @click="menuConfig.toggleOpen(item.id)">
              <i :class="['flyz-menu-item-icon flyz-menu-parent-icon', menuConfig.iconClass(item.icon)]"></i>
              <span class="flyz-menu-item-label">{{ item.name }}</span>
              <i :class="menuConfig.opened.includes(item.id) ? 'i-mdi-chevron-down flyz-menu-item-caret-open' : 'i-mdi-chevron-right flyz-menu-item-caret'"></i>
            </button>
            <transition enter-active-class="animate__animated animate__fadeInDown animate__faster"
                        leave-active-class="animate__animated animate__fadeOutUp animate__faster">
              <div v-if="menuConfig.opened.includes(item.id)" class="flyz-menu-children">
                <button v-for="sub in item.children"
                        :key="sub.id"
                        type="button"
                        :class="['flyz-menu-item flyz-menu-child', menuConfig.isSubActive(sub.path) ? 'flyz-menu-item-active' : '']"
                        @click="menuConfig.onSelectMenu(item, sub)">
                  <span class="flyz-menu-item-label">{{ sub.name }}</span>
                </button>
              </div>
            </transition>
          </div>
          <button v-else
                  type="button"
                  :class="menuConfig.isSubActive(item.path) ? 'flyz-menu-item-active' : 'flyz-menu-item'"
                  :title="item.name"
                  @click="menuConfig.onPrimaryClick(item)">
            <i :class="['flyz-menu-item-icon', menuConfig.iconClass(item.icon)]"></i>
            <span class="flyz-menu-item-label">{{ item.name }}</span>
          </button>
        </template>
      </div>

      <!-- cascader mode: 双列级联 -->
      <div v-else class="flyz-menu-cascader">
        <div class="flyz-menu-list flyz-menu-list-compact">
          <button v-for="item in menuConfig.menuData"
                  :key="item.id"
                  type="button"
                  :class="menuConfig.isPrimaryActive(item.id) ? 'flyz-menu-item-active' : 'flyz-menu-item'"
                  :title="item.name"
                  @click="menuConfig.onPrimaryClick(item)">
            <i :class="['flyz-menu-item-icon', menuConfig.iconClass(item.icon)]"></i>
          </button>
        </div>
        <div class="flyz-menu-divider"></div>
        <div class="flyz-menu-list flyz-menu-list-sub flex-grow">
          <transition mode="out-in"
                      enter-active-class="animate__animated animate__fadeInRight animate__faster"
                      leave-active-class="animate__animated animate__fadeOutLeft animate__faster">
            <div :key="menuConfig.activePrimary?.id || 'empty'" class="flex flex-col gap-0.5">
              <div v-if="menuConfig.activePrimary" class="flyz-menu-subheader">
                {{ menuConfig.activePrimary.name }}
              </div>
              <button v-if="menuConfig.activePrimary && !menuConfig.hasChildren(menuConfig.activePrimary)"
                      type="button"
                      :class="menuConfig.isSubActive(menuConfig.activePrimary.path) ? 'flyz-menu-item-active' : 'flyz-menu-item'"
                      @click="menuConfig.onSelectMenu(menuConfig.activePrimary, menuConfig.activePrimary)">
                <span class="flyz-menu-item-label">{{ menuConfig.activePrimary.name }}</span>
              </button>
              <button v-for="sub in menuConfig.activePrimaryChildren"
                      :key="sub.id"
                      type="button"
                      :class="menuConfig.isSubActive(sub.path) ? 'flyz-menu-item-active' : 'flyz-menu-item'"
                      @click="menuConfig.onSelectMenu(menuConfig.activePrimary, sub)">
                <span class="flyz-menu-item-label">{{ sub.name }}</span>
              </button>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </transition>
  <!-- mini 模式悬浮子菜单：teleport 到 body，避免被侧栏 overflow 裁剪 -->
  <Teleport to="body">
    <transition enter-active-class="animate__animated animate__fadeIn animate__faster" leave-active-class="animate__animated animate__fadeOut animate__faster">
      <div v-if="menuConfig.hoveredItem && menuConfig.hasChildren(menuConfig.hoveredItem)"
           class="flyz-submenu"
           :style="menuConfig.submenuPos"
           @mouseenter="menuConfig.onSubmenuEnter"
           @mouseleave="menuConfig.onSubmenuLeave">
        <div class="flyz-submenu-header">
          {{ menuConfig.hoveredItem.name }}
        </div>
        <button v-for="sub in menuConfig.hoveredItem.children"
                :key="sub.id"
                type="button"
                :class="menuConfig.isSubActive(sub.path) ? 'flyz-submenu-item-active' : 'flyz-submenu-item'"
                @click="menuConfig.onSelectMenu(menuConfig.hoveredItem, sub)">
          {{ sub.name }}
        </button>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreakpoints } from '@vueuse/core'
import { useAppStore } from '@/register/stores/app.js'

const breakpoints = useBreakpoints({
  sm: 600,
  md: 960,
  lg: 1280,
})
/** 窄屏：抽屉改为临时层 + 菜单不用 hover（触屏无法悬停） */
const isNarrowScreen = computed(() => breakpoints.smaller('md').value)

const appStore = useAppStore()
const router = useRouter()
const route = useRoute()

let hoverTimer = null

// ============================ 菜单 ============================
const menuConfig = reactive({
  menuData: computed(() => {
    const filterHiddenMenus = (list = []) => {
      return (list || [])
        .filter(item => item?.isHidden !== true)
        .map(item => ({
          ...item,
          children: Array.isArray(item.children) ? filterHiddenMenus(item.children) : [],
        }))
    }
    return filterHiddenMenus(appStore.menus)
  }),
  opened: [],
  activePrimary: null,
  hoveredId: null,
  // 悬浮子菜单 fixed 定位坐标（teleport 到 body，相对视口）
  submenuPos: { top: '0px', left: '0px' },
  // 当前悬浮的主菜单项（mini 模式弹出子菜单用）
  hoveredItem: computed(() => menuConfig.menuData.find(item => item.id === menuConfig.hoveredId) || null),
  displayMode: computed(() => {
    if (appStore.settings.menus < 60) {
      return 'compact'
    }
    if (appStore.settings.menus <= 250) {
      return 'tree'
    }
    return 'cascader'
  }),
  activePrimaryChildren: computed(() => menuConfig.activePrimary?.children || []),
  hasChildren(item) {
    return !!(item?.children && item.children.length)
  },
  isPrimaryActive(id) {
    return this.activePrimary?.id === id
  },
  isSubActive(path) {
    return route.path === path
  },
  selectPrimary(item) {
    this.activePrimary = item
  },
  onPrimaryClick(item) {
    this.selectPrimary(item)

    if (!this.hasChildren(item) && item?.path) {
      this.onSelectMenu(item, item)
    }
  },
  /**
   * 悬浮主菜单项：显示子菜单并记录弹出坐标
   * @param {object} item 主菜单项
   * @param {MouseEvent} event 鼠标事件（用于获取按钮位置）
   */
  onCompactEnter(item, event) {
    if (isNarrowScreen.value) {
      return
    }
    if (hoverTimer) {
      clearTimeout(hoverTimer)
      hoverTimer = null
    }
    this.hoveredId = item.id
    const rect = event?.currentTarget?.getBoundingClientRect?.()
    if (rect) {
      this.submenuPos = {
        top: `${Math.round(rect.top)}px`,
        left: `${Math.round(rect.right + 8)}px`,
      }
    }
  },
  onCompactLeave() {
    if (isNarrowScreen.value) {
      return
    }
    if (hoverTimer) {
      clearTimeout(hoverTimer)
    }
    hoverTimer = setTimeout(() => {
      this.hoveredId = null
    }, 100)
  },
  // 悬浮子菜单本体：取消关闭延时 / 移出后延时关闭
  onSubmenuEnter() {
    if (hoverTimer) {
      clearTimeout(hoverTimer)
      hoverTimer = null
    }
  },
  onSubmenuLeave() {
    if (hoverTimer) {
      clearTimeout(hoverTimer)
    }
    hoverTimer = setTimeout(() => {
      this.hoveredId = null
    }, 100)
  },
  toggleOpen(id) {
    if (this.opened.includes(id)) {
      this.opened = this.opened.filter(x => x !== id)
    } else {
      this.opened = [...this.opened, id]
    }
  },
  syncActiveByRoute(path) {
    const parent = this.menuData.find(item => {
      if (item.path === path) {
        return true
      }
      return (item.children || []).some(sub => sub.path === path)
    })
    if (!parent) {
      return
    }

    this.activePrimary = parent
    if (this.hasChildren(parent)) {
      this.opened = [parent.id]
    }
  },
  closeNavDrawerOnNarrow() {
    if (!isNarrowScreen.value) {
      return
    }
    const w = appStore.settings.menus
    if (w > 0) {
      appStore.updateSettings({
        lastMenuWidth: w,
        menus: 0,
      })
    }
  },
  onSelectMenu(parent, sub) {
    if (!sub?.path) {
      return
    }

    this.activePrimary = parent
    // 点击子菜单项后关闭 mini 模式悬浮菜单
    this.hoveredId = null
    appStore.addOrActivateTabByPath(sub.path)

    if (route.path !== sub.path) {
      router.push(sub.path)
    }
    this.closeNavDrawerOnNarrow()
  },
  iconClass(icon) {
    if (!icon) {
      return 'i-mdi-circle-small'
    }
    return icon.startsWith('i-') ? icon : `i-${icon}`
  },
})

watch(
  () => route.path,
  path => {
    appStore.addOrActivateTabByPath(path)
    menuConfig.syncActiveByRoute(path)
  },
  { immediate: true },
)

watch(
  () => appStore.settings.menus,
  () => {
    const w = appStore.settings.menus
    if (w > 0) {
      appStore.updateSettings({
        lastMenuWidth: w,
      })
    }
  },
  { immediate: true },
)

watch(
  () => menuConfig.menuData,
  () => {
    if (!menuConfig.activePrimary && menuConfig.menuData.length) {
      menuConfig.activePrimary = menuConfig.menuData[0]
    }
    menuConfig.syncActiveByRoute(route.path)
  },
  { immediate: true },
)
</script>
