import utils from '@/register/utils'
/**
 * v-throttle
 * 按钮节流指令，防止短时间内重复点击
 * 接收参数：function类型
 */
const throttle = {
  mounted(el, binding) {
    if (typeof binding.value !== 'function') {
      throw 'callback must be a function'
    }
    el.__throttleActive__ = true
    el.__handleClick__ = utils.throttle(() => {
      el.disabled = true
      if (el.__throttleActive__) {
        binding.value()
      }
      setTimeout(() => {
        el.disabled = false
      }, 1000)
    }, 1000)
    utils.eventListener.on(el, 'click', el.__handleClick__)
  },
  beforeUnmount(el) {
    el.__throttleActive__ = false
    utils.eventListener.off(el, 'click', el.__handleClick__)
  },
}

export default throttle
