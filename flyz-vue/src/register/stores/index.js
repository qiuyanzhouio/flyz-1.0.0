// Utilities
import { createPinia } from 'pinia'
import { persist } from './persist'

const pinia = createPinia()
// 注册插件
pinia.use(persist)

export default pinia
