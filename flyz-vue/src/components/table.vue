<template>
  <div class="flyz-card relative flex flex-col overflow-hidden">
    <div class="flex items-center flex-nowrap border-b bg-white/[0.02]">
      <div ref="tableHeader"
           class="w-10 flex-1 tr flex items-center flex-nowra overflow-auto"
           style="scrollbar-width: none;"
           @scroll="scrollConfig.handleHeaderScroll">
        <div v-for="(col, colIndex) in columns"
             :key="colIndex"
             class="td py-1 px-2 w-10 flex-1 overflow-hidden break-words line-clamp-2"
             :class="[
               col.class,
               border ? 'border-r last:border-r-0' : '',
             ]"
             :style="{minWidth: col.width ? col.width + 'px' : ''}"
             :title="col.label || col.title">
          {{ col.label || col.title }}
        </div>
      </div>
      <div v-if="scrollConfig.bodyHasScrollbar" class="w-[16px] !flex-[0_0_16px] border-l h-full"></div>
    </div>
    <div ref="tableBody" class=" !flex-1 overflow-auto" @scroll="scrollConfig.handleBodyScroll">
      <template v-if="props.data.length > 0">
        <div v-for="(item, index) in props.data || []"
             :key="index"
             class="tr flex items-center flex-nowrap min-w-full"
             style="width: fit-content !important;"
             :class="[
               scrollConfig.bodyHasScrollbar ? 'border-r border-b' : 'border-b',
             ]">
          <div v-for="(col, colIndex) in columns"
               :key="colIndex"
               class="td h-full py-1 px-2 w-10 flex-1 overflow-hidden break-words line-clamp-2"
               :style="{minWidth: col.width ? col.width + 'px' : ''}"
               :class="[
                 col.class,
                 border ? 'border-r last:border-r-0' : '',
               ]"
               :title="item[col.key || col.prop || col.dataIndex] || '-'">
            <slot :name="col.key || col.prop || col.dataIndex"
                  :record="item"
                  :column="col"
                  :index="index"
                  :value="item[col.key || col.prop || col.dataIndex]">
              {{ item[col.key || col.prop || col.dataIndex] || '-' }}
            </slot>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="flex flex-col items-center justify-center px-4 py-15 text-ink-400">
          <i class="i-mdi-database-outline text-12"></i>
          <div class="mt-2">
            暂无数据
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
<script setup>
import { nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useResizeObserver } from '@vueuse/core'

const props = defineProps({
  columns: {
    type: Array,
    default: () => [],
  },
  data: {
    type: Array,
    default: () => [],
  },
  border: {
    type: Boolean,
    default: true,
  },
})

const tableHeader = ref(null)
const tableBody = ref(null)

const scrollConfig = reactive({
  bodyHasScrollbar: false,
  sync(source, target) {
    if (!source || !target) {
      return
    }
    target.scrollLeft = source.scrollLeft
  },
  handleHeaderScroll() {
    this.sync(tableHeader.value, tableBody.value)
  },
  handleBodyScroll() {
    this.sync(tableBody.value, tableHeader.value)
    this.updateScrollbar()
  },
  updateScrollbar() {
    if (!tableBody.value) {
      this.bodyHasScrollbar = false
      return
    }

    this.bodyHasScrollbar = tableBody.value.scrollHeight > tableBody.value.clientHeight
  },
})

useResizeObserver(tableBody, () => scrollConfig.updateScrollbar())

watch(
  () => props.data,
  async () => {
    await nextTick()
    scrollConfig.updateScrollbar()
    scrollConfig.sync(tableBody.value, tableHeader.value)
  },
  { deep: true, immediate: true },
)

onBeforeUnmount(() => {
  tableHeader.value = null
  tableBody.value = null
})
</script>
