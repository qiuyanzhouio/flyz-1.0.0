import utils from '@/register/utils'

const clamp = (val, min, max) => Math.min(Math.max(val, min), max)

const draggable = {
  mounted(el) {
    el.style.cursor = 'move'
    el.style.position = 'absolute'

    const onMouseMove = (e) => {
      const x = clamp(e.pageX - el._disX, 0, el._maxX)
      const y = clamp(e.pageY - el._disY, 0, el._maxY)
      el.style.left = x + 'px'
      el.style.top = y + 'px'
    }

    const onMouseUp = () => {
      utils.eventListener.off(document, 'mousemove', onMouseMove)
      utils.eventListener.off(document, 'mouseup', onMouseUp)
    }

    const onMouseDown = (e) => {
      el._disX = e.pageX - el.offsetLeft
      el._disY = e.pageY - el.offsetTop
      el._maxX = el.parentNode.offsetWidth - el.offsetWidth
      el._maxY = el.parentNode.offsetHeight - el.offsetHeight
      utils.eventListener.on(document, 'mousemove', onMouseMove)
      utils.eventListener.on(document, 'mouseup', onMouseUp)
    }

    el._onMouseDown = onMouseDown
    utils.eventListener.on(el, 'mousedown', onMouseDown)
  },

  beforeUnmount(el) {
    if (el._onMouseDown) {
      utils.eventListener.off(el, 'mousedown', el._onMouseDown)
      el._onMouseDown = null
    }
  },
}

export default draggable
