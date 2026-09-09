/**
 * v-debounce
 * 按钮防抖指令，可自行扩展至input
 * 接收参数：function类型
 */
import utils from '@/register/utils'
const debounce = {
  mounted(el, binding) {
    if (typeof binding.value !== 'function') {
      throw 'callback must be a function'
    }
    el.__debounceActive__ = true
    el.__handleClick__ = utils.debounce(() => {
      if (el.__debounceActive__) {
        binding.value()
      }
    }, 500)
    utils.eventListener.on(el, 'click', el.__handleClick__)
  },
  beforeUnmount(el) {
    el.__debounceActive__ = false
    utils.eventListener.off(el, 'click', el.__handleClick__)
  },
}

export default debounce
