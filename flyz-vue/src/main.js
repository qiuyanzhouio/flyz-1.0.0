/**
 * main.js
 *
 * Bootstraps plugins then mounts the App`
 */

import { createApp } from 'vue'
// Plugins
import { registerPlugins } from '@/register'

import App from './App.vue'

// Styles
import 'animate.css'
import 'virtual:uno.css'
import '@/assets/styles/index.css'

const app = createApp(App)

registerPlugins(app)

app.mount('#app')
