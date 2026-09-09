<template>
  <div class="w-full h-full flex-1 relative">
    <div v-if="isSeriesEmpty"
         class="flyz-chart-empty">
      <img v-if="emptyImage"
           :src="emptyImage"
           alt=""
           class="flyz-chart-empty-img">
      <div class="flyz-chart-empty-title">
        {{ emptyText }}
      </div>
    </div>
    <div ref="chartIns" class="w-full h-full min-h-[100px]"></div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import utils from '@/register/utils'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

const props = defineProps({
  option: {
    type: Object,
    default: () => ({}),
  },
  event: {
    type: Array,
    default: () => [],
  },
  group: {
    type: String,
    default: '',
  },
  lazy: {
    type: [Boolean, Object],
    default: () => ({
      notMerge: true,
      lazyUpdate: true,
    }),
  },
  // 空状态图片
  emptyImage: {
    type: String,
    default: '',
  },
  // 空状态文案
  emptyText: {
    type: String,
    default: '暂无数据！',
  },
})

const emit = defineEmits(
  [
    'click',
    'dblclick',
    'mousedown',
    'mouseup',
    'mousemove',
    'mouseout',
    'legendselectchanged',
    'legendselected',
    'legendunselected',
    'datazoom',
    'pieselectchanged',
    'geoselectchanged',
    'timelinechanged',
    'restore',
    'magictypechanged',
  ].map(item => {
    const type = item.split(':')[0]
    return `${type}Event`
  }),
)

const ecIns = ref(null)
const chartIns = ref(null)

const isSeriesEmpty = computed(() => {
  const series = props.option?.series
  return !Array.isArray(series) || series.length === 0
})

// --- 图表初始化 / 事件 / 清理 ---
const chartConfig = reactive({
  isInitializing: false,
  retryCount: 0,
  maxRetryCount: 10,  // 最多重试 10 次
  initRetryTimer: null,
  boundEvents: [],
  // 检查容器是否有尺寸
  hasSize() {
    if (!chartIns.value) {
      return false
    }
    return chartIns.value.offsetWidth > 0 && chartIns.value.offsetHeight > 0
  },
  // 初始化图表
  async init() {
    // 如果容器没有尺寸，延迟重试
    if (!this.hasSize()) {
      if (this.retryCount < this.maxRetryCount) {
        this.retryCount++
        this.initRetryTimer = setTimeout(() => {
          this.init()
        }, 100)  // 100ms 后重试
      }
      return
    }

    if (this.isInitializing) {
      return
    }

    // 重置重试计数
    this.retryCount = 0
    this.isInitializing = true

    try {
      let instance = echarts.getInstanceByDom(chartIns.value)

      if (!instance) {
        instance = echarts.init(chartIns.value, null, {
          locale: 'ZH',
          renderer: 'canvas',
          useDirtyRect: true,
          ssr: false,
          lazyUpdate: true,
        })

        if (props.group) {
          instance.group = props.group
          echarts.connect(props.group)
        }

        this.bindEvents(instance)
      }

      ecIns.value = instance

      const currentOption = instance.getOption() || {}
      const currentDataZoom = Array.isArray(currentOption.dataZoom) ? currentOption.dataZoom : []

      const optimizedOption = {
        backgroundColor: 'transparent',
        ...props.option,
        dataZoom: currentDataZoom.length ? currentDataZoom : props.option.dataZoom,
      }

      instance.setOption(optimizedOption, props.lazy)
    } finally {
      this.isInitializing = false
    }
  },
  // 绑定事件
  bindEvents(instance) {
    this.unbindEvents()
    this.boundEvents = []

    props.event.forEach(item => {
      const [type, isGetZr] = item.split(':')
      const target = isGetZr ? instance.getZr() : instance

      const handler = function (params) {
        emit(`${type}Event`, params, instance)
      }

      target.on(type, handler)
      this.boundEvents.push({ target, type, handler })
    })
  },
  // 解绑事件
  unbindEvents() {
    this.boundEvents.forEach(({ target, type, handler }) => {
      try {
        target.off(type, handler)
      } catch (_e) {
        // 忽略解绑错误
      }
    })
    this.boundEvents = []
  },
  updateDataZoom() {
    if (!ecIns.value) {
      return
    }
    ecIns.value.dispatchAction({
      type: 'dataZoom',
      start: 0,
      end: 100,
    })
  },
  // 统一清理逻辑
  cleanup() {
    // 清除重试定时器
    if (this.initRetryTimer) {
      clearTimeout(this.initRetryTimer)
      this.initRetryTimer = null
    }

    if (ecIns.value) {
      this.unbindEvents()

      if (props.group) {
        echarts.disConnect(props.group)
      }

      try {
        ecIns.value.clear()
      } catch (_e) {
        // 忽略清理错误
      }

      ecIns.value.dispose()
      ecIns.value = null
    }
  },
})

// 监听 series 变化
watch(
  () => props.option.series,
  () => {
    nextTick(() => {
      chartConfig.init()
    })
  },
  { deep: true },
)

// 监听 option 变化
watch(
  () => props.option,
  () => {
    nextTick(() => {
      chartConfig.init()
    })
  },
  { deep: true },
)

// 使用防抖优化重绘
const onResize = utils.debounce(() => {
  if (!ecIns.value) {
    return
  }
  ecIns.value.resize()
}, 300)

// 监听窗口大小变化
utils.useEventListener(window, 'resize', onResize)

// 使用 ResizeObserver 监听容器大小变化
const resizeObserver = new ResizeObserver(() => {
  // 容器尺寸变化时，尝试初始化或调整大小
  if (!ecIns.value && chartConfig.hasSize()) {
    chartConfig.init()
  } else if (ecIns.value) {
    onResize()
  }
})

onMounted(() => {
  nextTick(() => {
    chartConfig.init()
  })
  if (chartIns.value) {
    resizeObserver.observe(chartIns.value)
  }
})

onBeforeUnmount(() => {
  chartConfig.cleanup()
  resizeObserver.disconnect()
})

defineExpose({
  chartIns,
  ecIns,
  updateDataZoom: () => chartConfig.updateDataZoom(),
  refresh: () => chartConfig.init(),
  resize: onResize,
})
</script>
