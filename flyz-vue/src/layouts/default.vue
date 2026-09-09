<template>
  <div class="h-full flex flex-col overflow-hidden">
    <User></User>
    <Settings></Settings>
    <SearchDrawer></SearchDrawer>
    <Header></Header>
    <div class="flex-1 flex overflow-hidden">
      <Menus></Menus>
      <div class="h-full flex-1 flex flex-col overflow-hidden">
        <Tabs></Tabs>
        <main class="h-full flex-1 overflow-auto">
          <router-view v-slot="{ Component, route: currentRoute }">
            <transition mode="out-in"
                        enter-active-class="animate__animated animate__fadeIn animate__faster"
                        leave-active-class="animate__animated animate__fadeOut animate__faster">
              <keep-alive :max="keepAliveMax">
                <component :is="Component"
                           v-if="currentRoute.meta?.keepAlive"
                           :key="getViewKey(currentRoute.path)"></component>
                <div v-else :key="'no-alive-' + getViewKey(currentRoute.path)" class="h-full">
                  <component :is="Component" :key="getViewKey(currentRoute.path)"></component>
                </div>
              </keep-alive>
            </transition>
          </router-view>
        </main>
      </div>
    </div>
    <Footer></Footer>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import Footer from '@/layouts/components/footer.vue'
import Header from '@/layouts/components/header/index.vue'
import Menus from '@/layouts/components/menus.vue'
import Tabs from '@/layouts/components/tabs.vue'
import SearchDrawer from '@/layouts/components/header/components/search.vue'
import User from '@/layouts/components/header/components/user.vue'
import Settings from '@/layouts/components/header/components/settings.vue'
import { useAppStore } from '@/register/stores/app.js'

const appStore = useAppStore()
const keepAliveMax = computed(() => Math.max(appStore.tabs.length + 2, 12))

function getViewKey(path) {
  const refreshTick = appStore.tabRefreshMap[path] || 0
  return `${path}::${refreshTick}`
}
</script>
