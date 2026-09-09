import js from '@eslint/js' // ESLint 官方推荐的 JavaScript 规则集
import vuePlugin from 'eslint-plugin-vue' // Vue.js 官方 ESLint 插件
import vueParser from 'vue-eslint-parser' // Vue 文件解析器，支持 .vue 文件中的模板、脚本和样式解析

export default [
  // 使用 ESLint 推荐的 JavaScript 规则作为基础配置
  js.configs.recommended,
  // 展开 Vue 插件的扁平配置中推荐的规则集（适用于 ESLint 扁平配置系统）
  ...vuePlugin.configs['flat/recommended'],
  {
    // 指定该配置适用的文件类型：JavaScript、ES模块、CommonJS 和 Vue 文件
    files: ['**/*.{js,mjs,cjs,vue}'],
    languageOptions: {
      // 使用 Vue 解析器来处理 .vue 文件，同时也能解析常规 JS 文件
      parser: vueParser,
      // 使用最新的 ECMAScript 语法特性
      ecmaVersion: 'latest',
      // 使用 ES 模块规范
      sourceType: 'module',
      // 定义全局变量，这些变量在代码中可以直接使用而不触发 no-undef 错误
      globals: {
        // ---- 浏览器标准 API ----
        console: 'readonly', // 控制台输出对象
        window: 'readonly', // 浏览器窗口对象
        document: 'readonly', // DOM 文档对象
        localStorage: 'readonly', // 本地存储
        sessionStorage: 'readonly', // 会话存储
        location: 'readonly', // 浏览器位置信息
        navigator: 'readonly', // 浏览器导航信息
        crypto: 'readonly', // 加密相关 API
        setTimeout: 'readonly', // 定时器函数
        clearTimeout: 'readonly', // 清除定时器
        setInterval: 'readonly', // 周期性定时器
        clearInterval: 'readonly', // 清除周期性定时器
        requestAnimationFrame: 'readonly', // 请求动画帧
        cancelAnimationFrame: 'readonly', // 取消动画帧
        AbortController: 'readonly', // 中止控制器
        AbortSignal: 'readonly', // 中止信号
        URL: 'readonly', // URL 构造函数
        URLSearchParams: 'readonly', // URL 查询参数构造函数
        FormData: 'readonly', // 表单数据构造函数
        Blob: 'readonly', // 二进制数据对象
        FileReader: 'readonly', // 文件读取器
        atob: 'readonly', // Base64 解码
        btoa: 'readonly', // Base64 编码
        CustomEvent: 'readonly', // 自定义事件构造函数
        Event: 'readonly', // 事件构造函数
        Error: 'readonly', // 错误构造函数
        structuredClone: 'readonly', // 结构化克隆方法
        TextEncoder: 'readonly', // 文本编码器
        TextDecoder: 'readonly', // 文本解码器
        Promise: 'readonly', // Promise 构造函数
        Map: 'readonly', // Map 数据结构
        Set: 'readonly', // Set 数据结构
        WeakMap: 'readonly', // WeakMap 数据结构
        WeakSet: 'readonly', // WeakSet 数据结构
        WebSocket: 'readonly', // WebSocket 构造函数
        Image: 'readonly', // Image 构造函数
        ResizeObserver: 'readonly', // 尺寸变化观察器
        alert: 'readonly', // 浏览器弹窗
        process: 'readonly', // Node.js process 对象

        // ---- Vue Composition API 全局可用的编译宏和组合式 API ----
        defineProps: 'readonly', // 定义组件 props
        defineEmits: 'readonly', // 定义组件事件
        defineExpose: 'readonly', // 定义组件暴露的属性和方法
        withDefaults: 'readonly', // 为 props 设置默认值
        computed: 'readonly', // 计算属性
        reactive: 'readonly', // 响应式对象
        ref: 'readonly', // 响应式引用
        onMounted: 'readonly', // 组件挂载后生命周期
        onBeforeUnmount: 'readonly', // 组件卸载前生命周期
        onActivated: 'readonly', // keep-alive 激活生命周期
        onDeactivated: 'readonly', // keep-alive 停用生命周期
        watch: 'readonly', // 监听器
        watchEffect: 'readonly', // 立即执行的响应式副作用
        nextTick: 'readonly', // DOM 更新后回调
        provide: 'readonly', // 依赖注入提供者
        inject: 'readonly', // 依赖注入注入者
        toRef: 'readonly', // 将响应式对象属性转换为 ref
        toRefs: 'readonly', // 将响应式对象所有属性转换为 refs
        isRef: 'readonly', // 判断是否为 ref
        unref: 'readonly', // 获取 ref 的内部值

        // ---- Vue Router 全局 API ----
        useRouter: 'readonly', // 获取路由实例
        useRoute: 'readonly', // 获取当前路由信息
        definePage: 'readonly', // 定义页面组件

        // ---- Pinia 状态管理全局 API ----
        defineStore: 'readonly', // 定义 Pinia store
        storeToRefs: 'readonly', // 将 store 的状态转换为 refs

        // ---- 第三方库全局变量 ----
        axios: 'readonly', // Axios HTTP 客户端

        // ---- 项目自定义全局变量 ----
        Utils: 'readonly', // 项目工具函数对象
        router: 'readonly', // 项目路由实例
        message: 'readonly', // 项目消息提示工具
      },
    },
    plugins: {
      vue: vuePlugin, // 注册 Vue 插件，使 Vue 规则生效
    },
    rules: {
      // ---- Vue 特定规则 ----

      // 关闭组件名必须为多单词的规则（允许单个单词组件名，如 App、Home）
      'vue/multi-word-component-names': 'off',
      // 允许在模板中使用 v-html（谨慎使用，可能有 XSS 风险）
      'vue/no-v-html': 'off',
      // 模板中的组件名强制使用 kebab-case（短横线命名），如 my-component
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      // 控制 HTML 标签是否自闭合：void 标签不自闭合，普通标签不自闭合，组件标签不自闭合
      'vue/html-self-closing': ['error', {
        html: {
          void: 'never',
          normal: 'never',
          component: 'never',
        },
      }],
      // 每行最大属性数量：单行最多 3 个属性，多行每行 1 个属性
      'vue/max-attributes-per-line': ['error', {
        singleline: 3,
        multiline: 1,
      }],
      // HTML 缩进：2 个空格，属性缩进 1 层，基础缩进 1 层，括号位置不额外缩进，属性垂直对齐
      'vue/html-indent': ['error', 2, {
        attribute: 1,
        baseIndent: 1,
        closeBracket: 0,
        alignAttributesVertically: true,
      }],
      // 模板中的属性值必须使用双引号
      'vue/html-quotes': ['error', 'double'],
      // 检测模板中未使用的变量，给出警告
      'vue/no-unused-vars': 'warn',
      // 检测是否直接修改 props，给出警告（应该通过事件向上传递）
      'vue/no-mutating-props': 'warn',
      // 属性名强制使用 kebab-case（短横线命名）
      'vue/attribute-hyphenation': ['error', 'always'],
      // props 命名规范检查，给出警告
      'vue/prop-name-casing': 'warn',
      // 检查 v-slot 指令的合法性，给出警告
      'vue/valid-v-slot': 'warn',
      // 检查 v-model 指令的合法性，给出警告
      'vue/valid-v-model': 'warn',
      // 属性换行位置：单行忽略，多行属性名与标签名同行
      'vue/first-attribute-linebreak': ['error', {
        singleline: 'ignore',
        multiline: 'beside',
      }],
      // HTML 闭合括号换行：单行不换行，多行不换行
      'vue/html-closing-bracket-newline': ['error', {
        singleline: 'never',
        multiline: 'never',
      }],
      // HTML 闭合括号空格：开始标签无空格，结束标签无空格，自闭合标签有空格
      'vue/html-closing-bracket-spacing': ['error', {
        startTag: 'never',
        endTag: 'never',
        selfClosingTag: 'always',
      }],
      // 非必填 prop 应该设置默认值，给出警告
      'vue/require-default-prop': 'warn',
      // 模板中的变量不要与父作用域变量重名（防止遮蔽），给出警告
      'vue/no-template-shadow': 'warn',

      // ---- JavaScript 通用规则 ----

      // 生产环境禁止使用 console，开发环境不做限制
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      // 生产环境禁止使用 debugger，开发环境不做限制
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      // 检测未使用的变量：以下划线开头的变量名可被忽略
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      // 禁止使用未声明的变量（错误级别）
      'no-undef': 'error',
      // 禁止使用常量条件表达式（如 if(true)），给出警告
      'no-constant-condition': 'warn',
      // 禁止空代码块，给出警告
      'no-empty': 'warn',
      // 优先使用 const 而非 let（当变量不会重新赋值时），给出警告
      'prefer-const': 'warn',
      // 禁止使用 var，强制使用 let 或 const（错误级别）
      'no-var': 'error',
      // 强制使用 === 和 !== 而不是 == 和 !=，给出警告
      'eqeqeq': 'warn',
      // 强制所有控制语句（if/else/for/while）使用大括号包裹
      'curly': ['error', 'all'],
      // 大括号风格：使用 1TBS（One True Brace Style），左大括号在语句同一行
      'brace-style': ['error', '1tbs'],
      // 缩进：2 个空格，switch case 语句缩进 1 层
      'indent': ['error', 2, { SwitchCase: 1 }],
      // 换行符风格：关闭检查（适应不同操作系统）
      'linebreak-style': 'off',
      // 字符串必须使用单引号（错误级别）
      'quotes': ['error', 'single'],
      // 语句末尾不使用分号（错误级别）
      'semi': ['error', 'never'],
      // 对象/数组末尾逗号：多行时必须添加尾随逗号（错误级别）
      'comma-dangle': ['error', 'always-multiline'],
      // 逗号前后空格：前无空格，后有空格（错误级别）
      'comma-spacing': ['error', { before: false, after: true }],
      // 对象键值对空格：冒号前无空格，后有空格（错误级别）
      'key-spacing': ['error', { beforeColon: false, afterColon: true }],
      // 关键字前后空格：前后都有空格（错误级别）
      'keyword-spacing': ['error', { before: true, after: true }],
      // 对象花括号内必须有空格（错误级别）
      'object-curly-spacing': ['error', 'always'],
      // 数组方括号内不能有空格（错误级别）
      'array-bracket-spacing': ['error', 'never'],
      // 函数括号前空格：匿名函数有空格，命名函数无空格，箭头函数有空格（错误级别）
      'space-before-function-paren': ['error', {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always',
      }],
      // 代码块前必须有空格（错误级别）
      'space-before-blocks': ['error', 'always'],
      // 禁止行尾多余空格（错误级别）
      'no-trailing-spaces': 'error',
      // 文件末尾必须有一个空行（错误级别）
      'eol-last': ['error', 'always'],
      // 最多允许连续 2 个空行，文件开头和末尾不允许空行（错误级别）
      'no-multiple-empty-lines': ['error', { max: 2, maxBOF: 0, maxEOF: 0 }],
      // 禁止变量自我赋值，给出警告
      'no-self-assign': 'warn',

      // ---- 禁用或调整的规则 ----

      // 禁用"常量二进制表达式"规则（Vue 模板中可能使用）
      'no-constant-binary-expression': 'off',
      // switch case 中声明变量，给出警告
      'no-case-declarations': 'warn',
      // 无用的赋值操作，给出警告
      'no-useless-assignment': 'warn',
      // 对象中重复的键名，给出警告
      'no-dupe-keys': 'warn',
      // 关闭"保留捕获错误"规则（不适用当前环境）
      'preserve-caught-error': 'off',
      // 关闭"静态类"规则（不适用当前项目）
      'unicorn/no-static-only-class': 'off',
    },
  },
  {
    // 配置需要忽略的文件和目录
    ignores: [
      'node_modules/**',
      'dist/**',
      'dist-*/**',
      'dists/**',
      'public/**',
      '*.local',
      '.eslintrc-auto-import.json',
    ],
  },
]
