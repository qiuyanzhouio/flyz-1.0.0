<template>
  <div class="flyz-card relative flex flex-col overflow-hidden" :class="[border ? 'border border-solid border-surface-border rounded-lg' : 'border-none']">
    <div class="flex items-center flex-nowrap border-b bg-surface-subtle">
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
        <!-- 虚拟滚动：上下占位撑起总高度 -->
        <div v-if="props.virtual" :style="{height: virtual.range.padTop + 'px'}"></div>
        <div v-for="(item, vi) in virtual.visibleData"
             :key="getRowKey(item, virtual.start + vi)"
             :data-vrow="props.virtual ? virtual.start + vi : undefined"
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
                  :index="virtual.start + vi"
                  :value="item[col.field]">
              {{ item[col.field] || '-' }}
            </slot>
          </div>
        </div>
        <div v-if="props.virtual" :style="{height: virtual.range.padBottom + 'px'}"></div>
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
  // 开启虚拟滚动（大数据量场景），仅渲染可视区域行
  virtual: {
    type: Boolean,
    default: false,
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
    if (props.virtual) {
      virtualState.scrollTop = tableBody.value.scrollTop
    }
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

// ============================
// 虚拟滚动：行高实测缓存 + 二分定位可视窗口
// ============================
const ROW_HEIGHT_ESTIMATE = 40
const VIRTUAL_OVERSCAN = 6

const virtualState = reactive({
  scrollTop: 0,
  viewportH: 0,
  // 行高缓存（按行索引），0 表示未测量，使用估算值
  rowHeights: [],
})

// 前缀和：offsets[i] 为第 i 行顶部距内容顶部的距离
const rowOffsets = computed(() => {
  const n = props.data.length
  const heights = virtualState.rowHeights
  const offsets = new Array(n + 1)
  offsets[0] = 0
  for (let i = 0; i < n; i++) {
    offsets[i + 1] = offsets[i] + (heights[i] || ROW_HEIGHT_ESTIMATE)
  }
  return offsets
})

// 可视窗口 [start, end)，含上下 overscan 缓冲
const virtualRange = computed(() => {
  const n = props.data.length
  if (!props.virtual || n === 0) {
    return { start: 0, end: n, padTop: 0, padBottom: 0 }
  }
  const offsets = rowOffsets.value
  const st = virtualState.scrollTop
  const vh = virtualState.viewportH || ROW_HEIGHT_ESTIMATE * 10

  // 二分：第一个底边超过视口顶部的行
  let lo = 0
  let hi = n
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (offsets[mid + 1] > st) {
      hi = mid
    } else {
      lo = mid + 1
    }
  }
  const start = Math.min(Math.max(0, lo - VIRTUAL_OVERSCAN), n)

  // 二分：第一个顶边不低于视口底部的行
  const target = st + vh
  lo = start
  hi = n
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (offsets[mid] < target) {
      lo = mid + 1
    } else {
      hi = mid
    }
  }
  let end = Math.min(n, lo + VIRTUAL_OVERSCAN)

  if (end < start) {
    end = start
  }
  return {
    start,
    end,
    padTop: offsets[start],
    padBottom: offsets[n] - offsets[end],
  }
})

const virtual = {
  get start() {
    return virtualRange.value.start
  },
  get visibleData() {
    const { start, end } = virtualRange.value
    if (!props.virtual) {
      return props.data
    }
    return props.data.slice(start, end)
  },
  get range() {
    return virtualRange.value
  },
}

// 渲染后测量实际行高，回填缓存（行高随列宽/内容变化自动修正）
async function measureVirtualRows() {
  await nextTick()
  const el = tableBody.value
  if (!el || !props.virtual) {
    return
  }
  const rows = el.querySelectorAll('[data-vrow]')
  const heights = virtualState.rowHeights
  rows.forEach((row) => {
    const i = Number(row.dataset.vrow)
    const h = row.offsetHeight
    if (i >= 0 && i < heights.length && h > 0 && heights[i] !== h) {
      heights[i] = h
    }
  })
}

useResizeObserver(tableBody, (entries) => {
  scrollConfig.updateScrollbar()
  if (props.virtual && entries?.[0]) {
    const h = entries[0].contentRect.height
    if (h && virtualState.viewportH !== h) {
      virtualState.viewportH = h
    }
    // 容器宽度变化会引起换行 -> 行高变化，重新测量
    measureVirtualRows()
  }
})

// 浅层监听：数据替换/增删行（长度变化）、列变化时重新测量，
// 避免对整表数据做 deep 遍历
watch(
  [() => props.data, () => props.data?.length, () => props.columns],
  async () => {
    // 行高缓存按索引对齐，数据变化后重置为估算值
    if (props.virtual) {
      virtualState.rowHeights = new Array(props.data.length).fill(0)
      virtualState.scrollTop = tableBody.value?.scrollTop || 0
    }
    await nextTick()
    scrollConfig.updateScrollbar()
    scrollConfig.sync(tableBody.value, tableHeader.value)
    if (props.virtual) {
      measureVirtualRows()
    }
  },
  { immediate: true },
)

// 可视窗口变化后测量新渲染的行
watch(
  () => [virtualRange.value.start, virtualRange.value.end],
  () => measureVirtualRows(),
)

onBeforeUnmount(() => {
  tableHeader.value = null
  tableBody.value = null
})
</script>
<!-- HMR-TEST-MARK -->
