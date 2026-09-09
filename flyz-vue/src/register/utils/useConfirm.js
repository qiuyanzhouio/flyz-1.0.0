/**
 * 全局确认对话框 Hook
 *
 * 使用方式：
 * 1. 在 App.vue 中挂载 <BaseConfirm />
 * 2. import { useConfirm } from '@/register/utils/useConfirm.js'
 * 3. const { confirm, danger, prompt } = useConfirm()
 * 4. if (await danger('确认删除吗？')) { ... }
 * 5. const token = await prompt('请输入口令', { label: '口令', required: true })
 */

// 全局实例引用
let confirmInstance = null

// 注册实例（由 BaseConfirm 组件调用）
export const registerConfirm = (instance) => {
  confirmInstance = instance
}

export const useConfirm = () => {
  const getInstance = () => {
    if (!confirmInstance) {
      console.warn('⚠️ BaseConfirm 组件未挂载，请在 App.vue 添加 <BaseConfirm />')
    }
    return confirmInstance
  }

  const show = (options) => {
    return getInstance()?.show(options) || Promise.resolve(false)
  }

  const confirm = (message, options = {}) => {
    return show({ message, type: 'warning', ...options })
  }

  const danger = (message, options = {}) => {
    return show({ message, type: 'danger', confirmText: '确认', ...options })
  }

  const info = (message, options = {}) => {
    return show({ message, type: 'info', confirmText: '我知道了', ...options })
  }

  const prompt = (message, options = {}) => {
    return show({
      message,
      type: 'warning',
      confirmText: '确认',
      promptMode: true,
      label: options.label || '请输入',
      required: options.required !== false,
      placeholder: options.placeholder || '',
      modelValue: options.modelValue ?? '',
      ...options,
    })
  }

  return {
    show,
    confirm,
    danger,
    info,
    prompt,
  }
}
