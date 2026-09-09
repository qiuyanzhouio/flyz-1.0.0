<template>
  <div class="flyz-card relative flex flex-col overflow-hidden" :class="[border ? 'border border-solid border-surface-border rounded-lg' : 'border-none']">
    <div class="flex items-center flex-nowrap border-b bg-white/[0.02]">
      <div ref="tableHeader"
           class="w-10 flex-1 tr flex items-center flex-nowra overflow-auto"
           style="scrollbar-width: none;"
           @scroll="scrollConfig.handleHeaderScroll">
        <div v-for="(col, colIndex) in normalizedColumns"
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
      <div v-if="scrollConfig.bodyHasHScrollbar" class="w-[16px] !flex-[0_0_16px] border-l h-full"></div>
    </div>
    <div ref="tableBody" class=" !flex-1 overflow-auto" @scroll="scrollConfig.handleBodyScroll">
      <template v-if="props.data.length > 0">
        <div v-for="(item, index) in props.data"
             :key="getRowKey(item, index)"
             class="tr flex items-center flex-nowrap min-w-full"
             style="width: fit-content !important;"
             :class="[
               'border-b',
               scrollConfig.bodyHasHScrollbar ? 'border-r' : '',
               !scrollConfig.bodyHasWScrollbar && scrollConfig.bodyHasHScrollbar ? 'last:border-b-0' : '',
             ]">
          <div v-for="(col, colIndex) in normalizedColumns"
               :key="colIndex"
               class="td h-full py-1 px-2 w-10 flex-1 overflow-hidden break-words line-clamp-2"
               :style="{minWidth: col.width ? col.width + 'px' : ''}"
               :class="[
                 col.class,
                 border ? 'border-r last:border-r-0' : '',
               ]"
               :title="item[col.field] || '-'">
            <slot :name="col.field"
                  :record="item"
                  :column="col"
                  :index="index"
                  :value="item[col.field]">
              {{ item[col.field] || '-' }}
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
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
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
  // 行唯一键：字段名或 (item) => key 函数，缺省退回行索引
  rowKey: {
    type: [String, Function],
    default: '',
  },
})

const tableHeader = ref(null)
const tableBody = ref(null)

// 预计算列字段（key/prop/dataIndex 归一化），避免每个单元格重复判断
const normalizedColumns = computed(() =>
  props.columns.map(col => ({
    ...col,
    field: col.key || col.prop || col.dataIndex,
  })),
)

const getRowKey = (item, index) => {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(item) ?? index
  }
  if (props.rowKey) {
    return item[props.rowKey] ?? index
  }
  return index
}

const scrollConfig = reactive({
  bodyHasHScrollbar: false,
  bodyHasWScrollbar: false,
  sync(source, target) {
    // 值相同时跳过 DOM 写入，避免无效 style 更新
    if (!source || !target || target.scrollLeft === source.scrollLeft) {
      return
    }
    target.scrollLeft = source.scrollLeft
  },
  handleHeaderScroll() {
    this.sync(tableHeader.value, tableBody.value)
  },
  handleBodyScroll() {
    // 滚动不会改变 scrollHeight/clientWidth，仅需同步横向位置
    this.sync(tableBody.value, tableHeader.value)
  },
  updateScrollbar() {
    const el = tableBody.value
    const hasH = !!el && el.scrollHeight > el.clientHeight
    const hasW = !!el && el.scrollWidth > el.clientWidth
    // 状态未变化时不写响应式属性，避免触发无意义重渲染
    if (this.bodyHasHScrollbar !== hasH) {
      this.bodyHasHScrollbar = hasH
    }
    if (this.bodyHasWScrollbar !== hasW) {
      this.bodyHasWScrollbar = hasW
    }
  },
})

useResizeObserver(tableBody, () => scrollConfig.updateScrollbar())

// 浅层监听：数据替换/增删行（长度变化）、列变化时重新测量，
// 避免对整表数据做 deep 遍历
watch(
  [() => props.data, () => props.data?.length, () => props.columns],
  async () => {
    await nextTick()
    scrollConfig.updateScrollbar()
    scrollConfig.sync(tableBody.value, tableHeader.value)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  tableHeader.value = null
  tableBody.value = null
})
</script>
