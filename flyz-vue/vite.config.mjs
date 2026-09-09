import { fileURLToPath, URL } from 'node:url'
import Vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import UnoCSS from 'unocss/vite'  // 确保导入正确
// Plugins
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'
import VueRouter from 'unplugin-vue-router/vite'
import { defineConfig, loadEnv } from 'vite'
import Layouts from 'vite-plugin-vue-layouts-next'
import viteArchiverFile from './vite.archiver.js'

export default ({ mode, command }) => {
  const envDir = './'
  const env = loadEnv(mode, envDir)
  const isBuild = command === 'build'
  const isProd = mode === 'production'
  const basePath = env.VITE_BASE_PATH || ''

  // 从 VITE_SERVER_LIST 解析开发代理配置
  let proxyList = []
  try {
    const raw = env.VITE_SERVER_LIST
    const list = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : []
    if (Array.isArray(list)) {
      for (const item of list) {
        // 仅当 defaultValue 是相对路径（如 /papi）且配置了 proxyTarget 时才生成代理
        if (item?.proxyTarget && typeof item.defaultValue === 'string' && /^\/[^/]/.test(item.defaultValue)) {
          proxyList.push([item.defaultValue, item.proxyTarget])
        }
      }
    }
  } catch (e) {
    console.warn('[vite] VITE_SERVER_LIST 不是合法 JSON，将跳过代理配置:', e)
    proxyList = []
  }

  return defineConfig({
    base: basePath,
    envDir,
    plugins: [
      VueRouter({
        routesFolder: 'src/pages',
        exclude: [
          // 所有 components 目录下都作为组件，不作为路由页面
          '**/components/**/*.vue',
        ],
        layouts: {
          // 默认布局
          default: 'src/layouts/default.vue',
        },
      }),
      Layouts({
        exclude: ['**/components/**'],
      }),
      Vue({
        template: {},
      }),
      Components({
        directoryAsNamespace: true,
      }),
      AutoImport({
        imports: [
          'vue',
          VueRouterAutoImports,
          {
            'vue-router': ['useRouter', 'useRoute'],
            pinia: ['defineStore', 'storeToRefs'],
            axios: [['default', 'axios']],
          },
        ],
        eslintrc: {
          enabled: true,
        },
        vueTemplate: true,
        dts: false,
      }),
      isBuild && visualizer({
        filename: 'dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
      viteArchiverFile({
        distDir: './dist',
        outputDir: './dists',
        zipName: 'project-{timestamp}.zip',
        cleanDist: true,
        verbose: true,
        enableHash: false,
        maxBackups: 5,
        dateFormat: 'YYYY-MM-DD_hh-mm-ss',
        archiveOptions: {
          zlib: { level: 9 },
        },
      }),
      UnoCSS(),  // 添加 UnoCSS 插件
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('src', import.meta.url)),
      },
      extensions: ['.js', '.json', '.jsx', '.mjs', '.vue'],
    },
    server: {
      host: '0.0.0.0',
      port: Number(env.VITE_PORT || '3000'),
      open: false,
      cors: true,
      hmr: {
        overlay: true,
      },
      warmup: {
        // 预编译常用模块
        clientFiles: ['./src/main.js', './src/App.vue'],
      },
      // 将代理配置统一转换为 vite server.proxy 所需格式
      proxy: createProxyConfig(proxyList),
      fs: {
        // 限制文件访问
        allow: ['..'],
        strict: true,
      },
    },
    build: {
      target: 'es2020', // 更现代的 target
      minify: isProd ? 'esbuild' : false, // esbuild 比 terser 更快
      sourcemap: isProd ? 'hidden' : true, // 生产环境生成隐藏的 sourcemap
      rollupOptions: {
        output: {
          manualChunks(id) {
            // 更智能的代码分割
            if (id.includes('node_modules')) {
              // 精确匹配核心框架
              if (/\/node_modules\/(vue|@vue\/)/.test(id)) {
                return 'vue-core'
              }
              // pinia 和 vue-router
              if (id.includes('pinia') || id.includes('vue-router')) {
                return 'vue-state'
              }
              // echarts 图表库
              if (id.includes('echarts')) {
                return 'charts'
              }
              // 网络请求相关
              if (id.includes('axios') || id.includes('reconnecting-websocket') || id.includes('stompjs')) {
                return 'network'
              }
              // 其余第三方库统一打包到 vendor
              return 'vendor'
            }
          },
          // 更好的文件命名
          chunkFileNames: isProd
            ? 'assets/[name]-[hash].js'
            : 'assets/[name].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          // 添加模块预加载
          experimentalMinChunkSize: 20_000,
        },
        // 外部依赖处理
        external: [],
      },
      // 构建报告
      reportCompressedSize: true,
      cssCodeSplit: true,
      chunkSizeWarningLimit: 3000,
    },
    optimizeDeps: {
      include: ['vue', 'vue-router'],
      exclude: [],
    },
    define: {
      'process.env': {},
      __APP_ENV__: JSON.stringify(mode),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
  })
}

function createProxyConfig(list = []) {
  const httpsRE = /^https:\/\//
  const proxies = {}
  for (const [prefix, target] of list) {
    const isHttps = httpsRE.test(target)

    proxies[prefix] = {
      target: target,
      changeOrigin: true,
      ws: true,
      rewrite: path => path.replace(new RegExp(`^${prefix}`), ''),
      // https is require secure=false
      ...(isHttps ? { secure: false } : {}),
    }
  }
  return proxies
}
