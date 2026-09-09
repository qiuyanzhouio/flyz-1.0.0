import utils from '@/register/utils'

const clamp = (value, minValue, maxValue) => Math.min(Math.max(value, minValue), maxValue)

/**
 * 解析方向参数，返回 { axis, handlePosition }
 * - axis: 'x' 水平轴 | 'y' 垂直轴
 * - handlePosition: 'left' | 'right' | 'top' | 'bottom'
 *
 * 兼容旧用法：direction 传 'left'/'right'/'top'/'bottom' 时自动推断 axis
 */
const resolveDirection = (direction, handlePosition) => {
  // 新用法: direction = 'x' | 'y' + handlePosition 指定手柄位置
  if (direction === 'x' || direction === 'y') {
    const axis = direction
    const pos = handlePosition || (axis === 'x' ? 'right' : 'bottom')
    return { axis, handlePosition: pos }
  }

  // 旧用法: direction 直接传手柄位置
  const legacyMap = {
    left: { axis: 'x', handlePosition: 'left' },
    right: { axis: 'x', handlePosition: 'right' },
    top: { axis: 'y', handlePosition: 'top' },
    bottom: { axis: 'y', handlePosition: 'bottom' },
  }
  return legacyMap[direction] || { axis: 'x', handlePosition: 'right' }
}

/**
 * 创建拖拽手柄 DOM
 * @param {'left'|'right'|'top'|'bottom'} handlePosition 手柄位置
 * @param {object} options { handleSize, handleOffset, icon, hoverOnly, handleClass, handleStyle }
 */
const createHandle = (handlePosition, options = {}) => {
  const {
    handleSize = 14,
    handleOffset = 0,
    icon,
    hoverOnly = false,
    handleClass,
    handleStyle,
  } = options

  const isX = handlePosition === 'left' || handlePosition === 'right'

  const style = {
    position: 'absolute',
    zIndex: '2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(0, 0, 0, 0.38)',
    background: hoverOnly ? 'transparent' : 'linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.04))',
    userSelect: 'none',
    touchAction: 'none',
    cursor: isX ? 'ew-resize' : 'ns-resize',
    pointerEvents: 'auto',
    transition: 'opacity 0.2s ease',
    opacity: hoverOnly ? '0' : '1',
  }

  if (isX) {
    style.top = `${handleOffset}px`
    style.bottom = `${handleOffset}px`
    style.width = `${handleSize}px`
    style.height = 'auto'
    style.flexDirection = 'column'
    style[handlePosition] = `${handleOffset}px`
  } else {
    style.left = `${handleOffset}px`
    style.right = `${handleOffset}px`
    style.height = `${handleSize}px`
    style.width = 'auto'
    style[handlePosition] = `${handleOffset}px`
  }

  const handle = document.createElement('div')
  handle.dataset.draggableWhHandle = 'true'
  Object.assign(handle.style, style)

  if (handleClass) {
    handle.className = handleClass
  }

  if (handleStyle && typeof handleStyle === 'object') {
    Object.assign(handle.style, handleStyle)
  }

  handle.innerHTML = icon || (isX
    ? '<span style="font-size:14px;line-height:1">⋮⋮</span>'
    : '<span style="font-size:14px;line-height:1">⋯</span>')

  const enterHandler = () => {
    handle.style.opacity = '1'
  }
  const leaveHandler = () => {
    handle.style.opacity = '0'
  }

  if (hoverOnly) {
    utils.eventListener.on(handle, 'mouseenter', enterHandler)
    utils.eventListener.on(handle, 'mouseleave', leaveHandler)
  }

  return { handle, enterHandler, leaveHandler, hoverOnly }
}

const draggableWh = {
  mounted(el, binding) {
    const options = binding.value || {}
    const { axis, handlePosition } = resolveDirection(options.direction, options.handlePosition)
    const min = options.min ?? 280
    const max = options.max ?? 720
    const step = options.step ?? 1
    const onChange = options.onChange
    const disabled = options.disabled ?? false

    const isX = axis === 'x'
    const isReverse = handlePosition === 'left' || handlePosition === 'top'
    const sizeProp = isX ? 'width' : 'height'
    const posProp = isX ? 'left' : 'top'
    const cursor = isX ? 'ew-resize' : 'ns-resize'
    const clientAxis = isX ? 'clientX' : 'clientY'
    const rectAxis = isX ? 'width' : 'height'

    const { handle, enterHandler, leaveHandler, hoverOnly } = createHandle(handlePosition, options)

    const cleanup = () => {
      stop()
      utils.eventListener.off(handle, 'mousedown', start)
      if (hoverOnly) {
        utils.eventListener.off(handle, 'mouseenter', enterHandler)
        utils.eventListener.off(handle, 'mouseleave', leaveHandler)
      }
      handle.remove()
      delete el.__resizeCleanup__
    }

    if (disabled) {
      el.__resizeCleanup__ = cleanup
      return
    }

    let startPos = 0
    let startSize = 0
    let startOffset = 0
    let dragging = false
    let rafId = null
    let pendingValue = null

    const applySize = (value) => {
      if (typeof onChange === 'function') {
        onChange(value)
        return
      }
      el.style[sizeProp] = `${value}px`
      if (isReverse) {
        el.style[posProp] = `${startOffset + startSize - value}px`
      }
    }

    const flushSize = () => {
      rafId = null
      if (pendingValue !== null) {
        applySize(pendingValue)
        pendingValue = null
      }
    }

    const setSize = (value) => {
      const nextValue = clamp(value, min, max)
      if (pendingValue === nextValue) {
        return
      }
      pendingValue = nextValue
      if (rafId === null) {
        rafId = requestAnimationFrame(flushSize)
      }
    }

    const onMouseMove = (event) => {
      if (!dragging) {
        return
      }

      const delta = event[clientAxis] - startPos
      const next = isReverse ? startSize - delta : startSize + delta
      const steppedValue = Math.round(next / step) * step
      setSize(steppedValue)
    }

    const stop = () => {
      if (!dragging) {
        return
      }
      dragging = false
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        flushSize()
      }
      utils.eventListener.off(window, 'mousemove', onMouseMove)
      utils.eventListener.off(window, 'mouseup', stop)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    const start = (event) => {
      event.preventDefault()
      dragging = true

      const rect = el.getBoundingClientRect()
      startPos = event[clientAxis]
      startSize = rect[rectAxis]
      startOffset = isX ? el.offsetLeft : el.offsetTop

      document.body.style.userSelect = 'none'
      document.body.style.cursor = cursor
      utils.eventListener.on(window, 'mousemove', onMouseMove)
      utils.eventListener.on(window, 'mouseup', stop)
    }

    utils.eventListener.on(handle, 'mousedown', start)
    el.style.position = el.style.position || 'relative'
    el.appendChild(handle)
    el.__resizeCleanup__ = cleanup
  },

  beforeUnmount(el) {
    el.__resizeCleanup__?.()
  },
}

export default draggableWh
