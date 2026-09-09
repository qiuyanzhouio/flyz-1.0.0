import { reactive, toRefs } from 'vue'

function setBodyUserSelect(disabled) {
  if (typeof document === 'undefined') {
    return
  }
  document.body.style.userSelect = disabled ? 'none' : ''
}

const state = reactive({
  dragType: 'add',
  isDragOver: false,
  isDragging: false,
  node: null,
})

/**
 * 基础拖拽能力
 *
 * @param {Object} options - 配置项
 * @param {Function} options.onDragStart - 拖拽开始回调（参数：event, node 克隆, eType）
 * @param {Function} options.onNodeStart - 同 onDragStart，二选一；若同时存在优先 onDragStart
 * @param {Function} options.onNodeOver - 拖拽悬停回调
 * @param {Function} options.onNodeLeave - 拖拽离开回调
 * @param {Function} options.onNodeDrop - 拖拽放置回调
 */
export default function useDragAndDrop(options = {}) {
  const { onNodeStart, onNodeOver, onNodeLeave, onNodeDrop } = options
  const { isDragOver, isDragging } = toRefs(state)

  function onDragStart(event, payload, eType = 'add') {
    event?.stopPropagation?.()

    const node = JSON.parse(JSON.stringify(payload))
    if (!node) {
      return
    }

    if (event?.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
    }

    state.dragType = eType
    state.isDragging = true
    state.node = node
    setBodyUserSelect(true)

    onNodeStart?.(event, state.node, eType)

    if (typeof document !== 'undefined') {
      document.addEventListener('drop', onDragEnd)
    }
  }

  function onDragOver(event, target) {
    event?.preventDefault?.()
    state.isDragOver = true

    if (event?.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }

    onNodeOver?.(event, target)
  }

  function onDragLeave() {
    state.isDragOver = false
    onNodeLeave?.()
  }

  function onDragEnd() {
    state.dragType = 'add'
    state.isDragging = false
    state.isDragOver = false
    state.node = null
    setBodyUserSelect(false)

    if (typeof document !== 'undefined') {
      document.removeEventListener('drop', onDragEnd)
    }
  }

  function onDrop(event, target) {
    if (!state.node) {
      return
    }

    event?.preventDefault?.()

    const payload = {
      ...JSON.parse(JSON.stringify(state.node)),
      x: event?.clientX,
      y: event?.clientY,
    }

    onNodeDrop?.(event, payload, target, state.dragType)
    onDragEnd()
  }

  return {
    isDragOver,
    isDragging,
    onDragStart,
    onDragLeave,
    onDragOver,
    onDrop,
    onDragEnd,
  }
}
