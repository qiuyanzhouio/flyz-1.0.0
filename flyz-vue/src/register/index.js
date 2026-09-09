/**
 * registerPlugins
 *
 * Automatically included in `./src/main.js`
 */
import router from '@/register/router'
import pinia from '@/register/stores'
import directive from '@/register/directive'

export function registerPlugins(app) {
  app
    .use(pinia)
    .use(router)
    .use(directive)
}
