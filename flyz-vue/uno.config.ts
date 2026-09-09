import { defineConfig, presetIcons, presetWind, transformerVariantGroup } from 'unocss'

/**
 * UnoCSS 配置
 * - presetUno：默认原子类（Tailwind/Windi 风格，支持 hover:/focus:/active: 变体）
 * - presetIcons：图标 class（i-mdi-home 等）
 * - shortcuts：业务级复合 class（btn / chip / card / menu 等）——所有组件级样式都在此集中定义
 * - theme：项目色板与基础 token（指向 CSS 变量，由 index.css 中 html[data-theme][data-bg] 切换）
 * - transformerVariantGroup：把 `hover:(...)` 编译成多个独立原子类
 * - preflights：全局 reset + 动画（无法用原子类表达的伪元素/选择器/Vue transition 等）
 */
export default defineConfig({
  presets: [
    presetWind(),
    presetIcons({
      scale: 1.1,
      warn: false,
    }),
  ],
  safelist: [
    // 菜单/标签页已知图标（动态 class 名需在 safelist 中声明）
    'i-mdi-home',
    'i-mdi-view-dashboard',
    'i-mdi-cog',
    'i-mdi-account',
    'i-mdi-account-group',
    'i-mdi-menu',
    'i-mdi-book-open-variant',
    'i-mdi-file-tree',
    'i-mdi-tag',
    'i-mdi-file-document-outline',
    'i-mdi-circle-small',
    'i-mdi-shield-account',
    'i-mdi-database',
    'i-mdi-server',
    'i-mdi-monitor',
    'i-mdi-chart-bar',
    'i-mdi-bell',
    'i-mdi-lock',
    'i-mdi-key-variant',
    'i-mdi-account-cog',
    // Header / 通用操作图标
    'i-mdi-magnify',
    'i-mdi-fullscreen',
    'i-mdi-fullscreen-exit',
    'i-mdi-power',
    'i-mdi-card-account-details',
    'i-mdi-office-building',
    'i-mdi-email',
    'i-mdi-cellphone',
    'i-mdi-folder',
    'i-mdi-check',
    'i-mdi-close',
    'i-mdi-plus',
    'i-mdi-refresh',
    'i-mdi-dots-vertical',
    'i-mdi-chevron-right',
    'i-mdi-chevron-down',
    'i-mdi-chevron-up',
    'i-mdi-arrow-left',
    'i-mdi-login',
    'i-mdi-help-circle-outline',
    // 消息/对话框图标
    'i-mdi-check-circle',
    'i-mdi-close-circle',
    'i-mdi-alert',
    'i-mdi-information',
    // 代码编辑器图标
    'i-mdi-auto-fix',
    'i-mdi-content-copy',
    'i-mdi-circle',
    // 树形结构图标
    'i-mdi-subdirectory-arrow-right',
    // 主题设置（白天/黑夜切换）
    'i-mdi-weather-sunny',
    'i-mdi-weather-night',
  ],
  transformers: [
    transformerVariantGroup(),
  ],
  theme: {
    colors: {
      // 品牌色：按 html[data-bg] 切换（默认/蓝/紫/绿）；
      // 采用 rgb(var() / <alpha-value>) 模式，使 /25 等透明度修饰符生效
      brand: {
        50: 'rgb(var(--c-brand-50) / <alpha-value>)',
        100: 'rgb(var(--c-brand-100) / <alpha-value>)',
        200: 'rgb(var(--c-brand-200) / <alpha-value>)',
        300: 'rgb(var(--c-brand-300) / <alpha-value>)',
        400: 'rgb(var(--c-brand-400) / <alpha-value>)',
        500: 'rgb(var(--c-brand-500) / <alpha-value>)',
        600: 'rgb(var(--c-brand-600) / <alpha-value>)',
        700: 'rgb(var(--c-brand-700) / <alpha-value>)',
        800: 'rgb(var(--c-brand-800) / <alpha-value>)',
        900: 'rgb(var(--c-brand-900) / <alpha-value>)',
      },
      // 表面：按 html[data-theme] 切换
      surface: {
        DEFAULT: 'var(--c-surface)',
        soft: 'var(--c-surface-soft)',
        raised: 'var(--c-surface-raised)',
        border: 'var(--c-surface-border)',
        subtle: 'var(--c-surface-subtle)',
      },
      // 文字：按 html[data-theme] 切换
      ink: {
        100: 'var(--c-ink-100)',
        200: 'var(--c-ink-200)',
        300: 'var(--c-ink-300)',
        400: 'var(--c-ink-400)',
        500: 'var(--c-ink-500)',
      },
      // 叠加层（悬停/底纹）：按 html[data-theme] 切换
      overlay: {
        DEFAULT: 'var(--c-overlay)',
        faint: 'var(--c-overlay-faint)',
        soft: 'var(--c-overlay-soft)',
        strong: 'var(--c-overlay-strong)',
      },
      // 布局遮罩（画布上的毛玻璃蒙层）
      veil: 'var(--c-veil)',
      // 下沉容器（子菜单等需要比父级更深的底色）
      sunken: 'var(--c-sunken)',
      // 代码片段底色
      snippet: 'var(--c-snippet-bg)',
      // 表单输入底色/边框
      field: {
        DEFAULT: 'var(--c-field-bg)',
        border: 'var(--c-field-border)',
        strong: 'var(--c-field-border-strong)',
      },
      // 状态文本（浅色底上的可读状态色）
      status: {
        ok: 'var(--c-text-ok)',
        warn: 'var(--c-text-warn)',
        err: 'var(--c-text-err)',
        info: 'var(--c-text-info)',
      },
      ok: 'rgb(var(--c-ok) / <alpha-value>)',
      warn: 'rgb(var(--c-warn) / <alpha-value>)',
      err: 'rgb(var(--c-err) / <alpha-value>)',
      info: 'rgb(var(--c-info) / <alpha-value>)',
    },
    fontFamily: {
      mono: 'Fira Code, Cascadia Code, monospace',
    },
  },
  preflights: [
    {
      getCSS: () => `* {margin: 0;padding: 0;box-sizing: border-box;border: 0 solid var(--c-base-border);color: var(--c-base-text);}a {color: inherit;text-decoration: none;cursor: pointer;}ul, ol {list-style: none;}img, svg, video {display: block;max-width: 100%;}button {cursor: pointer;}::selection {background: var(--c-selection);color: var(--c-selection-text);}html {scrollbar-color: var(--c-scrollbar) transparent;scrollbar-width: thin;-webkit-tap-highlight-color: transparent;}*::-webkit-scrollbar {width: 8px;height: 8px;}*::-webkit-scrollbar-track {background: transparent;}*::-webkit-scrollbar-thumb {background: var(--c-scrollbar);border-radius: 8px;}*::-webkit-scrollbar-thumb:hover {background: var(--c-scrollbar-hover);}*::-webkit-scrollbar-corner {background: transparent;}html, body, #app {width: 100%;height: 100%;margin: 0;padding: 0;overflow: hidden;background: var(--c-canvas);}body {font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;-webkit-font-smoothing: antialiased;-moz-osx-font-smoothing: grayscale;}button, input, select, textarea {font-family: inherit;}input, select {overflow: hidden;text-overflow: ellipsis;white-space: nowrap;}input::placeholder, textarea::placeholder {color: var(--c-placeholder);opacity: 1;}input[type="number"] {-moz-appearance: textfield;appearance: textfield;}input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button {-webkit-appearance: none;margin: 0;}input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus {-webkit-text-fill-color: var(--c-base-text);transition: background-color 99999s ease-out;}select option {background-color: var(--c-solid) !important;color: var(--c-solid-text) !important;}.select-wrapper select {appearance: none;-webkit-appearance: none;padding-right: 28px;}.select-wrapper::after {content: '';position: absolute;right: 10px;top: 50%;transform: translateY(-50%);width: 0;height: 0;border-left: 4px solid transparent;border-right: 4px solid transparent;border-top: 5px solid var(--c-caret);pointer-events: none;}.select-wrapper.is-empty::before {content: attr(data-placeholder);position: absolute;left: 12px;top: 50%;transform: translateY(-50%);color: var(--c-placeholder);pointer-events: none;}.select-wrapper.is-empty select {color: transparent;}.cm-editor {height: fit-content;width: fit-content;min-width: 100%;}.cm-editor.cm-focused {outline: none;}.cm-scroller {font-family: 'Fira Code', 'Cascadia Code', monospace;}.cm-gutters {background: rgba(255, 255, 255, 0.01) !important;color: #5c6370;border-right: 1px solid #181a1f;}.cm-activeLineGutter {background-color: #2c313a;color: #abb2bf;}.cm-activeLine {background-color: rgba(255, 255, 255, 0.06);}.ͼo {background: rgba(255, 255, 255, 0.01) !important;}`,
    },
  ],
  shortcuts: {
    // ===== 通用交互控件 =====
    'flyz-btn': 'inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-sm text-sm font-medium bg-surface-raised text-ink-100 border border-solid border-surface-border cursor-pointer transition-colors duration-150 hover:bg-overlay-strong disabled:opacity-60 disabled:cursor-not-allowed appearance-none',
    'flyz-btn-sm': 'flyz-btn h-8 px-3 text-[13px]',
    'flyz-btn-primary': 'flyz-btn bg-brand-500 text-white border-brand-500 hover:(bg-brand-600 border-brand-600)',
    'flyz-btn-danger': 'flyz-btn bg-err text-white border-err hover:(bg-red-600 border-red-600)',
    'flyz-btn-info': 'flyz-btn bg-info/20 text-status-info border-info/40 hover:(bg-info/30 text-status-info)',
    'flyz-btn-tonal': 'flyz-btn bg-brand-500/20 text-brand-200 border-brand-500/40 hover:(bg-brand-500/30 text-brand-100)',
    'flyz-btn-icon': 'inline-flex items-center justify-center w-9 h-9 rounded-md bg-transparent border border-solid border-transparent text-ink-200 cursor-pointer transition-colors duration-150 hover:(bg-overlay text-ink-100)',
    'flyz-btn-text': 'flyz-btn px-0 bg-transparent border-transparent text-ink-300 hover:(bg-transparent text-ink-100)',
    'flyz-btn-warning-text': 'flyz-btn-text text-status-warn hover:(!text-warn)',
    'flyz-btn-success-text': 'flyz-btn-text text-status-ok hover:(!text-ok)',
    'flyz-btn-danger-text': 'flyz-btn-text text-status-err hover:(!text-err)',
    'flyz-btn-spinner': 'inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin',

    // ===== 状态 chip =====
    'flyz-chip': 'border border-solid bg-brand-600 border-brand-600 text-white inline-flex items-center h-6 px-3 rounded-xl text-xs font-medium',
    'flyz-chip-sm': 'flyz-chip px-2',
    'flyz-chip-ok': 'flyz-chip bg-ok/20 text-status-ok',
    'flyz-chip-warn': 'flyz-chip bg-warn/20 text-status-warn',
    'flyz-chip-err': 'flyz-chip bg-err/20 text-status-err',
    'flyz-chip-info': 'flyz-chip bg-info/20 text-status-info',
    'flyz-chip-grey': 'flyz-chip bg-overlay-strong text-ink-300',
    'flyz-chip-muted': 'flyz-chip bg-overlay-soft text-ink-400',
    'flyz-chip-success': 'flyz-chip-ok',
    'flyz-chip-warning': 'flyz-chip-warn',
    'flyz-chip-error': 'flyz-chip-err',

    // ===== 通用面板 =====
    'flyz-card': '',
    'flyz-divider': 'h-px bg-surface-border',
    'flyz-divider-v': 'w-px bg-surface-border self-stretch',
    'flyz-tabs-scroller': 'h-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
    'flyz-search-highlight': 'text-amber-400 font-bold',

    // ===== 文本输入 =====
    'flyz-input': 'w-full h-8 px-3 rounded-sm border border-solid border-field-border bg-field text-ink-100 text-sm outline-none transition-colors duration-150 placeholder:text-ink-400 focus:(border-brand-500 ring-2 ring-brand-500/25)',
    'flyz-textarea': 'flyz-input h-auto min-h-20 py-2 leading-snug resize-y',
    'flyz-select': 'flyz-input pr-8 appearance-none cursor-pointer',

    // ===== 通用布局 =====
    'flyz-page': 'w-full h-full p-2 overflow-hidden',
    'flyz-page-card': 'flyz-card flex-1 overflow-hidden',
    'flyz-toolbar': 'flyz-card p-2 mb-2 flex items-center justify-between flex-wrap gap-2',
    'flyz-spacer': 'flex-1',

    // ===== 头像 =====
    'flyz-avatar': 'inline-flex items-center justify-center rounded-full bg-brand-500 text-white font-semibold',
    'flyz-avatar-sm': 'flyz-avatar w-8 h-8 text-xs',
    'flyz-avatar-md': 'flyz-avatar w-14 h-14 text-lg',
    'flyz-avatar-lg': 'flyz-avatar w-14 h-14 text-lg shrink-0',

    // ===== Layout: default =====
    'flyz-layout': 'relative z-0 flex flex-col w-full h-full before:(content-empty absolute inset-0 bg-veil backdrop-blur-md z--1)',
    'flyz-layout-body': 'flex flex-1 min-h-0 min-w-0',
    'flyz-layout-content': 'flex flex-col flex-1 min-w-0 min-h-0',
    'flyz-main': 'flex-1 overflow-x-hidden overflow-y-auto p-0 min-h-0',

    // ===== Layout: Header =====
    'flyz-header': 'relative flex items-center flex-none w-full px-3 bg-transparent border-b border-surface-border text-ink-100 z-50',
    'flyz-header-title': 'ml-3 text-[15px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis',
    'flyz-header-spacer': 'flex-1',
    'flyz-header-actions': 'flex items-center',
    'flyz-header-divider': 'w-px h-5 bg-overlay-strong mx-2',

    // Header: 图标按钮
    'flyz-icon-btn': 'appearance-none relative bg-transparent border border-transparent text-ink-200 w-9 h-9 rounded-md inline-flex items-center justify-center cursor-pointer transition-colors duration-150 hover:(bg-overlay text-ink-100)',
    'flyz-icon': 'text-lg leading-none',
    'flyz-badge': 'absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-err text-white text-[10px] font-semibold leading-4 text-center',

    // Header: 用户菜单
    'flyz-avatar-btn': 'appearance-none bg-transparent border-0 p-0 cursor-pointer',
    'flyz-user-avatar': 'inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-500 text-white text-xs font-semibold',
    'flyz-user-menu': 'relative',
    'flyz-user-dropdown': 'absolute top-[calc(100%+6px)] right-0 min-w-55 p-1.5 bg-surface border border-solid border-surface-border rounded-lg shadow-[var(--c-shadow)] z-60 flex flex-col',
    'flyz-user-item': 'appearance-none bg-transparent border-0 text-ink-200 flex items-center gap-2.5 px-2.5 py-2 rounded text-left cursor-pointer text-sm transition-colors duration-150 hover:(bg-overlay text-ink-100)',
    'flyz-user-item-danger': 'flyz-user-item hover:bg-err/15 hover:text-status-err',
    'flyz-user-item-icon': 'w-[18px] text-center text-base leading-none',
    'flyz-user-divider': 'h-px bg-surface-border my-1',

    // ===== Drawer: User (个人中心) =====
    'flyz-text-muted': 'text-ink-400',
    'flyz-user-list': 'p-0',
    'flyz-user-row': 'flex items-center gap-3 px-4 py-2.5 border-b border-surface-subtle last:border-b-0',
    'flyz-user-row-icon': 'w-6 text-center text-base leading-none text-ink-300',
    'flyz-user-row-body': 'flex-1 min-w-0',
    'flyz-user-row-label': 'text-xs text-ink-400',
    'flyz-user-row-value': 'text-sm text-ink-100 whitespace-nowrap overflow-hidden text-ellipsis',

    // ===== Layout: Menus =====
    'nav-menu-drawer': 'bg-overlay backdrop-blur-md saturate-[1.15] border-r border-overlay',
    'flyz-menu-list': 'flex flex-col p-2 gap-0.5 overflow-auto flex-1',
    'flyz-menu-list-compact': 'w-14 flex-none',
    'flyz-menu-list-sub': 'bg-sunken',
    'flyz-menu-item': 'appearance-none flex items-center gap-2.5 w-full h-9 px-2.5 rounded-md bg-transparent border-0 text-ink-200 text-sm text-left cursor-pointer whitespace-nowrap overflow-hidden transition-colors duration-150 hover:(bg-overlay text-ink-100)',
    'flyz-menu-item-active': 'flyz-menu-item bg-brand-500/25 text-brand-200',
    'flyz-menu-item-icon': 'flex-none w-[18px] text-center text-base leading-none',
    'flyz-menu-item-label': 'flex-1 min-w-0 overflow-hidden text-ellipsis',
    'flyz-menu-item-caret': 'text-xs text-ink-400 transition-transform duration-200',
    'flyz-menu-item-caret-open': 'flyz-menu-item-caret rotate-90',
    'flyz-menu-parent-icon': 'text-ink-200',
    'flyz-menu-child': 'pl-6 text-[13px] text-ink-300',
    'flyz-menu-children': 'flex flex-col gap-0.5 py-1',
    // compact mode 弹出子菜单
    'flyz-submenu': 'fixed min-w-40 p-1 bg-surface border border-solid border-surface-border rounded-lg shadow-[var(--c-shadow)] z-100',
    'flyz-submenu-header': 'px-2.5 py-1.5 text-[11px] font-semibold text-ink-400 uppercase tracking-[0.5px]',
    'flyz-submenu-item': 'appearance-none bg-transparent border-0 text-ink-200 block w-full px-2.5 py-1.5 rounded text-left text-[13px] cursor-pointer transition-colors duration-150 hover:(bg-overlay text-ink-100)',
    'flyz-submenu-item-active': 'flyz-submenu-item bg-brand-500/25 text-brand-200',
    // cascader 模式
    'flyz-menu-cascader': 'flex h-full overflow-hidden',
    'flyz-menu-divider': 'w-px bg-surface-border my-2',
    'flyz-menu-subheader': 'px-2.5 py-2 text-xs font-semibold text-ink-400',

    // ===== Layout: Tabs =====
    'flyz-tabs-bar': 'relative w-full bg-transparent border-b border-surface-border flex items-center z-40 flex-none',
    'flyz-tabs-list': 'inline-flex items-center h-full min-w-full px-2 gap-1',
    'flyz-tab': 'relative inline-flex items-center gap-1.5 h-[calc(100%-8px)] px-2.5 rounded-md bg-overlay-faint text-ink-300 text-[13px] cursor-pointer select-none whitespace-nowrap max-w-[220px] transition-colors duration-150 hover:(bg-overlay text-ink-100)',
    'flyz-tab-active': 'flyz-tab bg-brand-500/20 text-brand-200',
    'flyz-tab-icon': 'text-sm leading-none',
    'flyz-tab-title': 'overflow-hidden text-ellipsis whitespace-nowrap',
    'flyz-tab-menu': 'ml-0.5 mr--1',
    'flyz-tab-menu-btn': 'appearance-none bg-transparent border-0 text-inherit w-[22px] h-[22px] rounded cursor-pointer text-base leading-none inline-flex items-center justify-center transition-colors duration-150 hover:bg-overlay-strong',
    'flyz-tab-menu-dropdown': 'fixed min-w-[140px] p-1 bg-surface border border-solid border-surface-border rounded-md shadow-[var(--c-shadow)] z-50 flex flex-col',
    'flyz-tab-menu-item': 'appearance-none bg-transparent border-0 text-ink-200 text-left px-2.5 py-1.5 text-[13px] rounded cursor-pointer transition-colors duration-150 hover:(bg-overlay text-ink-100)',
    'flyz-tab-menu-item-disabled': 'flyz-tab-menu-item text-ink-500 cursor-not-allowed hover:bg-transparent hover:text-ink-500',

    // ===== Layout: Footer =====
    'flyz-footer': 'relative z-20 w-full bg-transparent border-t border-surface-border flex items-center px-3 text-ink-400 text-xs flex-none',
    'flyz-footer-inner': 'w-full',
    'flyz-footer-divider': 'inline-block w-px h-3.5 bg-overlay-strong align-middle mx-3',
    'flyz-footer-brand': 'text-brand-500 font-medium',
    'flyz-footer-dot': 'inline-block w-2 h-2 rounded-full bg-ok mr-1 align-middle',
    'flyz-footer-vue': 'bg-[#42b883]',
    'flyz-footer-tip': 'inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-ok/15 text-ok cursor-help',
    'flyz-footer-status': 'text-xs font-bold leading-none',

    // ===== Component: Dialog / Drawer 公共包裹（见各自模板也用了原子类） =====
    'flyz-dialog-mask': 'fixed inset-0 z-2000 flex items-center justify-center p-4 overflow-auto',
    'flyz-dialog-card': 'relative w-full bg-surface text-ink-100 rounded-lg shadow-[var(--c-shadow-lg)] flex flex-col max-h-[calc(100vh-32px)]',
    'flyz-dialog-title': 'flex justify-between items-center flex-wrap gap-2 px-4 py-4 text-base font-semibold text-ink-100',
    'flyz-dialog-text': 'overflow-auto px-4 py-4',
    'flyz-dialog-actions': 'flex justify-end gap-2 p-4 flex-wrap',
    'flyz-drawer-mask': 'fixed inset-0 z-1900',
    'flyz-drawer-panel': 'absolute bg-surface text-ink-100 shadow-[var(--c-shadow-lg)] flex flex-col overflow-auto',

    // ===== Component: BaseConfirm (prompt) =====
    'flyz-prompt': 'min-h-[100px]',
    'flyz-prompt-title': 'text-[15px] font-medium text-ink-100 mb-3',
    'flyz-prompt-field': 'flex flex-col gap-1',
    'flyz-prompt-input': 'w-full h-8 px-3 rounded-sm border border-solid border-field-border bg-field text-ink-100 text-sm outline-none transition-colors duration-150 focus:(border-brand-500 ring-2 ring-brand-500/25)',
    'flyz-prompt-input-error': 'flyz-prompt-input border-err',
    'flyz-prompt-error': 'text-xs text-status-err',

    // ===== Component: Search (搜索) =====
    'flyz-search-input': 'w-full h-8 px-3 rounded-sm border border-solid border-field-border bg-overlay-faint text-ink-100 text-sm outline-none transition-colors duration-150 focus:(border-brand-500 ring-2 ring-brand-500/25)',
    'flyz-search-divider': 'h-px bg-surface-border',
    'flyz-search-list': 'py-2 px-2 pb-2 overflow-auto',
    'flyz-search-subheader': 'text-[11px] uppercase text-ink-500 px-2.5 py-1.5 font-semibold tracking-[0.5px]',
    'flyz-search-item': 'appearance-none bg-transparent border-0 text-ink-200 flex items-center gap-3 w-full px-2.5 py-2 rounded-md text-left cursor-pointer text-sm transition-colors duration-150 hover:bg-overlay',
    'flyz-search-item-icon': 'w-[18px] text-center text-base leading-none',
    'flyz-search-item-body': 'flex flex-col flex-1 min-w-0',
    'flyz-search-item-title': 'text-sm text-ink-100 whitespace-nowrap overflow-hidden text-ellipsis',
    'flyz-search-item-sub': 'text-xs text-ink-400 whitespace-nowrap overflow-hidden text-ellipsis',
    'flyz-search-empty': 'px-4 text-center text-ink-400',
    'flyz-search-empty-title': 'text-sm font-medium text-ink-200 mb-1',
    'flyz-search-empty-sub': 'text-xs',


    // ===== Component: CodeEditor =====
    'flyz-code-editor': 'relative rounded-lg overflow-hidden flex flex-col h-full w-full max-h-full',
    // 编辑器全屏态：fixed 覆盖整个视窗
    'is-fullscreen': 'fixed! top-0 left-0 z-9999 w-full! h-full! rounded-none! bg-[#14141f]!',
    'flyz-code-toolbar': 'flex justify-between items-center px-4 py-2 border-b border-surface-border',
    'flyz-code-statusbar': 'flex justify-between items-center px-3 py-1 border-t border-surface-border text-[12px] text-ink-400',
    'flyz-code-lang': 'w-[130px] h-7 px-2 rounded border border-overlay-strong bg-overlay-faint text-ink-100 text-[12px] outline-none disabled:(opacity-50 cursor-not-allowed)',
    'flyz-code-autosave': 'text-[12px] text-ok',
    'flyz-code-icon-btn': 'appearance-none bg-transparent border border-transparent text-ink-300 w-7 h-7 rounded inline-flex items-center justify-center cursor-pointer transition-colors duration-150 hover:(bg-overlay text-ink-100 border-overlay-strong)',
    'flyz-code-icon': 'text-base leading-none',
    'flyz-code-error': 'absolute bottom-2 right-5 z-10 max-w-[300px] flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-err/95 text-white text-[12px] leading-[1.4]',
    'flyz-code-error-text': 'flex-1 break-words',
    'flyz-code-error-close': 'appearance-none bg-transparent border-0 text-white text-base leading-none cursor-pointer px-1',
    'flyz-code-chip': 'inline-flex items-center h-[18px] px-1.5 rounded-[3px] text-[11px] font-medium',
    'flyz-code-chip-error': 'flyz-code-chip bg-err text-white',

    // ===== Component: Chart (ECharts 空状态) =====
    'flyz-chart-empty': 'absolute inset-0 flex flex-col gap-2 pointer-events-none text-ink-400 z-1',
    'flyz-chart-empty-img': 'w-16 h-16 object-contain opacity-60',
    'flyz-chart-empty-title': 'text-sm font-medium',

    // ===== 表单统一字段类 =====
    'flyz-field': 'w-full h-8 px-3 rounded-sm border border-solid border-field-border bg-field text-ink-100 text-sm outline-none transition-colors duration-150 placeholder:text-ink-400 focus:(border-brand-500 ring-2 ring-brand-500/25)',
    'flyz-field-textarea': 'flyz-field h-auto min-h-[60px] py-2 leading-snug resize-y',
    'flyz-field-select': 'flyz-field pr-8 appearance-none cursor-pointer',
    'flyz-field-error': 'border-err focus:(border-err ring-err/25)',

    // ===== 列表页/表单页通用辅助 =====
    'flyz-toolbar-actions': 'pl-2',
    'flyz-row-actions': 'whitespace-nowrap',
    'flyz-cell-tree': '',
    'flyz-cell-icon': 'text-sm leading-none text-ink-400',
    'flyz-cell-text': 'text-ink-100 text-[13px]',

    // ===== 404 页专用 =====
    'flyz-404-page': 'w-full h-full p-10 px-5 flex items-center justify-center overflow-auto',
    'flyz-404-card': 'w-full max-w-[640px] p-6 rounded-lg bg-surface-soft border border-solid border-surface-border text-ink-100',
    'flyz-404-icon': 'inline-flex items-center justify-center w-12 h-12 rounded-full bg-warn/20 text-warn text-2xl font-bold shrink-0',
    'flyz-404-title': 'text-lg font-bold text-ink-100',
    'flyz-404-subtitle': 'text-[13px] text-ink-400 mt-1',
    'flyz-404-divider': 'h-px bg-surface-border',
    'flyz-404-path': 'text-[13px] text-ink-300',
    'flyz-btn-icon-small': 'text-sm leading-none',
  },
})
