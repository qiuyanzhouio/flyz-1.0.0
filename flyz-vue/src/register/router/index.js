/**
 * router/index.js
 *
 * Automatic routes for `./src/pages/*.vue` + 动态菜单路由注册
 */

import { setupLayouts } from 'virtual:generated-layouts'
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { useAppStore } from '@/register/stores/app.js'

const LOGIN_PATH = '/login'
const viewModules = import.meta.glob(['/src/pages/**/*.vue', '!/src/pages/**/components/**/*.vue'])
const registeredMenuRouteNames = new Set()

const notFoundRoute = {
  path: '/:pathMatch(.*)*',
  name: 'NotFound',
  component: () => import('@/pages/system/error/404.vue'),
  meta: {
    layout: 'default',
    requiresAuth: false,
  },
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: setupLayouts([...routes, notFoundRoute]),
})

/**
 * 规范化菜单路径：去除首尾斜杠后，统一以 / 开头
 * @param {string} [urlAddress='']
 * @returns {string}
 */
function normalizeMenuPath(urlAddress = '') {
  const clean = urlAddress.trim().replace(/^\/+|\/+$/g, '')
  return clean ? `/${clean}` : ''
}

/**
 * 根据菜单 URL 查找对应的页面组件
 * @param {string} [urlAddress='']
 * @returns {Function|null}
 */
function resolveMenuView(urlAddress = '') {
  const clean = normalizeMenuPath(urlAddress).replace(/^\//, '')
  if (!clean) {
    return null
  }

  const candidates = [`@/pages/${clean}.vue`, `@/pages/${clean}/index.vue`]
  return candidates.find(key => viewModules[key]) || null
}

/**
 * 递归注册菜单动态路由
 * @param {Array} menuList 菜单树
 */
export function registerMenuRoutesByList(menuList = []) {
  const walk = (list) => {
    for (const menu of list) {
      const children = Array.isArray(menu?.children) ? menu.children : []
      const path = normalizeMenuPath(menu?.urlAddress)
      const component = resolveMenuView(menu?.urlAddress)

      if (path && component && !registeredMenuRouteNames.has(path)) {
        registeredMenuRouteNames.add(path)
        router.addRoute({
          path,
          name: `menu:${path}`,
          component,
          meta: {
            layout: 'default',
            requiresAuth: true,
            menuId: menu?.id,
            menuName: menu?.fullName,
          },
        })
      }

      if (children.length) {
        walk(children)
      }
    }
  }

  walk(Array.isArray(menuList) ? menuList : [])
}

/**
 * 清除所有已注册的菜单动态路由
 */
export function resetMenuRoutes() {
  for (const path of registeredMenuRouteNames) {
    const name = `menu:${path}`
    if (router.hasRoute(name)) {
      router.removeRoute(name)
    }
  }
  registeredMenuRouteNames.clear()
}

/**
 * 获取登录后跳转目标：优先 query.redirect，其次 effectiveHomePath
 * @param {import('vue-router').RouteLocationNormalized} to
 * @param {import('@/register/stores/app.js').AppStore} appStore
 * @returns {string}
 */
function getLoginRedirect(to, appStore) {
  const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : ''
  const target = redirect || appStore.effectiveHomePath
  return target !== LOGIN_PATH ? target : ''
}

router.beforeEach((to) => {
  const appStore = useAppStore()
  registerMenuRoutesByList(appStore.menus)

  // 已登录用户访问登录页时自动跳转
  if (to.path === LOGIN_PATH && appStore.isAuthed) {
    const redirect = getLoginRedirect(to, appStore)
    if (redirect) {
      return { path: redirect, replace: true }
    }
  }

  return true
})

router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (!localStorage.getItem('dynamic-reload')) {
      localStorage.setItem('dynamic-reload', 'true')
      location.assign(to.fullPath)
    }
  }
})

router.isReady().then(() => {
  localStorage.removeItem('dynamic-reload')
})

export default router
