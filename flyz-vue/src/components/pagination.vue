<template>
  <div class="flex items-center justify-between flex-wrap gap-2 px-2 py-2 text-xs text-ink-300 select-none">
    <!-- 左侧：总数 + 每页条数 -->
    <div class="flex items-center gap-3">
      <span>共 <span class="text-ink-100 font-medium">{{ total }}</span> 条</span>
      <div class="flex items-center gap-1 whitespace-nowrap">
        <span>每页</span>
        <select v-model.number="pager.innerPageSize"
                class="flyz-field-select h-7 px-1 text-xs min-w-[60px]">
          <option v-for="size in pageSizes" :key="size" :value="size">
            {{ size }}
          </option>
        </select>
        <span>条</span>
      </div>
    </div>

    <!-- 右侧：页码按钮 -->
    <div class="flex items-center gap-1">
      <button type="button"
              class="flyz-btn flyz-btn-text px-2 py-1 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="pager.innerPage <= 1"
              @click="pager.goTo(pager.innerPage - 1)">
        上一页
      </button>
      <template v-for="p in pager.visiblePages" :key="p.key">
        <span v-if="p.ellipsis" class="px-1 text-ink-400">…</span>
        <button v-else
                type="button"
                class="flyz-btn min-w-[28px] h-7 px-2 rounded text-xs transition-colors"
                :class="p.active
                  ? 'bg-brand-500 text-white'
                  : 'bg-overlay text-ink-200 hover:(bg-overlay-strong text-ink-100)'"
                @click="pager.goTo(p.value)">
          {{ p.value }}
        </button>
      </template>
      <button type="button"
              class="flyz-btn flyz-btn-text px-2 py-1 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="pager.innerPage >= pager.totalPages"
              @click="pager.goTo(pager.innerPage + 1)">
        下一页
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'

const props = defineProps({
  // 当前页码（从 1 开始）
  page: { type: Number, default: 1 },
  // 每页条数
  pageSize: { type: Number, default: 10 },
  // 总条数
  total: { type: Number, default: 0 },
  // 可选每页条数
  pageSizes: { type: Array, default: () => [10, 20, 50, 100] },
  // 页码按钮最多显示几个
  maxButtons: { type: Number, default: 7 },
})

const emit = defineEmits(['update:page', 'update:pageSize', 'change'])

const pager = reactive({
  totalPages: computed(() =>
    props.pageSize > 0 ? Math.ceil(props.total / props.pageSize) : 1,
  ),
  innerPage: computed(() => Math.min(Math.max(1, props.page), pager.totalPages || 1)),
  innerPageSize: computed({
    get: () => props.pageSize,
    set: (val) => {
      emit('update:pageSize', val)
      // 切换每页条数时回到首页并通知父组件刷新
      emit('update:page', 1)
      emit('change', { page: 1, pageSize: val })
    },
  }),
  /**
   * 生成带省略号的页码列表
   * @returns {Array<{ value?: number, active?: boolean, ellipsis?: boolean, key: string|number }>}
   */
  visiblePages: computed(() => {
    const total = pager.totalPages
    const current = pager.innerPage
    const max = props.maxButtons
    const pages = []

    if (total <= max) {
      for (let i = 1; i <= total; i++) {
        pages.push({ value: i, active: i === current, key: i })
      }
      return pages
    }

    // 始终显示首页
    pages.push({ value: 1, active: current === 1, key: 'first' })

    const side = Math.floor((max - 3) / 2)
    let start = current - side
    let end = current + side

    if (start < 2) {
      start = 2
      end = max - 2
    }
    if (end > total - 1) {
      end = total - 1
      start = total - max + 2
    }

    if (start > 2) {
      pages.push({ ellipsis: true, key: 'ellipsis-left' })
    }
    for (let i = start; i <= end; i++) {
      pages.push({ value: i, active: i === current, key: i })
    }
    if (end < total - 1) {
      pages.push({ ellipsis: true, key: 'ellipsis-right' })
    }

    // 始终显示末页
    pages.push({ value: total, active: current === total, key: 'last' })
    return pages
  }),
  goTo(p) {
    const target = Math.min(Math.max(1, p), this.totalPages)
    if (target === this.innerPage) {
      return
    }
    emit('update:page', target)
    emit('change', { page: target, pageSize: this.innerPageSize })
  },
})
</script>
