<template>
  <div :class="{ 'is-fullscreen': fullscreenState.active }"
       class="flyz-code-editor">
    <div class="flyz-code-toolbar">
      <div class="flex items-center gap-3">
        <select v-model="language"
                :disabled="readOnly"
                class="flyz-code-lang flyz-field-select"
                :title="`当前语言: ${language}`">
          <option v-for="lang in (limit || SUPPORTED_LANGS)"
                  :key="lang.value"
                  :value="lang.value">
            {{ lang.label }}
          </option>
        </select>
        <span v-if="autoSave"
              class="flyz-code-autosave inline-flex items-center gap-1">
          <i class="i-mdi-circle text-[8px]"></i>自动保存
        </span>
      </div>

      <div class="flex items-center gap-3">
        <button type="button"
                class="flyz-code-icon-btn"
                title="格式化 (Ctrl+S)"
                @click="toolbar.formatCode">
          <i class="i-mdi-auto-fix flyz-code-icon"></i>
        </button>
        <button type="button"
                class="flyz-code-icon-btn"
                title="复制代码"
                @click="toolbar.copyCode">
          <i class="i-mdi-content-copy flyz-code-icon"></i>
        </button>
        <button type="button"
                class="flyz-code-icon-btn"
                :title="foldState.folded ? '展开全部' : '折叠全部'"
                @click="foldState.toggle">
          <i :class="foldState.folded ? 'i-mdi-chevron-down flyz-code-icon' : 'i-mdi-chevron-up flyz-code-icon'"></i>
        </button>
      </div>
    </div>

    <div v-show="!foldState.folded" :style="{ ...editorBodyStyle, position: 'relative', flex: '1', minHeight: '0', overflow: 'auto', width: '100%' }">
      <div ref="editorContainer" class="cursor-text"></div>

      <transition enter-active-class="animate__animated animate__fadeIn animate__faster" leave-active-class="animate__animated animate__fadeOut animate__faster">
        <div v-if="errorState.info"
             class="flyz-code-error">
          <span class="flyz-code-error-text">{{ errorState.info.message }}</span>
          <button type="button"
                  class="flyz-code-error-close"
                  aria-label="close"
                  @click="errorState.clear">
            <i class="i-mdi-close"></i>
          </button>
        </div>
      </transition>
    </div>

    <div v-show="!foldState.folded" class="flyz-code-statusbar">
      <div class="flex items-center gap-2">
        L: {{ cursorState.currentLine }} | Char: {{ charCount }}
      </div>
      <div class="flex items-center gap-2">
        <span v-if="errorState.info"
              class="flyz-code-chip flyz-code-chip-error">
          {{ errorState.info.line > 0 ? `行 ${errorState.info.line}: 语法错误` : '语法错误' }}
        </span>
        <span class="font-bold font-mono">{{ language.toUpperCase() }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useVModel } from '@vueuse/core'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightActiveLine } from '@codemirror/view'
import { defaultKeymap, indentWithTab, history, historyKeymap } from '@codemirror/commands'
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, indentOnInput, foldGutter, foldKeymap, foldAll, unfoldAll } from '@codemirror/language'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { json } from '@codemirror/lang-json'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import { oneDark } from '@codemirror/theme-one-dark'

const SUPPORTED_LANGS = [
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Python', value: 'python3' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'JSON', value: 'json' },
  { label: 'Java', value: 'java' },
  { label: 'C++', value: 'cpp' },
]

const LANGUAGE_EXTENSIONS = {
  javascript: () => javascript(),
  typescript: () => javascript({ typescript: true }),
  python3: () => python(),
  python: () => python(),
  html: () => html(),
  css: () => css(),
  json: () => json(),
  java: () => java(),
  cpp: () => cpp(),
}

const props = defineProps({
  modelValue: { type: String, default: '' },
  initialLanguage: { type: String, default: 'javascript' },
  readOnly: { type: Boolean, default: false },
  height: { type: [String, Number], default: 400 },
  full: { type: Boolean, default: true },
  autoSave: { type: Boolean, default: false },
  limit: { type: Array, default: () => null },
})

const emit = defineEmits(['update:modelValue', 'update:initialLanguage', 'change', 'language-change', 'error'])

const codeValue = useVModel(props, 'modelValue', emit)
const language = useVModel(props, 'initialLanguage', emit)
const editorContainer = ref(null)

let editorView = null
let isInternalUpdate = false

const charCount = computed(() => {
  if (!editorView) {
    return 0
  }
  return editorView.state.doc.length
})

// --- 编辑器核心（纯方法，内部使用闭包变量） ---
const editor = {
  getLanguageExtension(lang) {
    const key = lang?.toLowerCase()
    if (LANGUAGE_EXTENSIONS[key]) {
      return LANGUAGE_EXTENSIONS[key]()
    }
    return javascript()
  },
  buildExtensions() {
    const extensions = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      foldGutter(),
      bracketMatching(),
      indentOnInput(),
      history(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      oneDark,
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...foldKeymap,
        indentWithTab,
        {
          key: 'Escape',
          run: () => {
            if (fullscreenState.active) {
              fullscreenState.active = false
              return true
            }
            return false
          },
        },
        {
          key: 'Mod-s',
          run: () => {
            toolbar.formatCode()
            return true
          },
        },
      ]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          isInternalUpdate = true
          codeValue.value = update.state.doc.toString()
          isInternalUpdate = false
          emit('change', codeValue.value)
          cursorState.update(update.state)
        }
        if (update.selectionSet) {
          cursorState.update(update.state)
        }
      }),
      EditorView.theme({
        '&': {
          height: '100%',
          fontSize: '14px',
        },
        '.cm-scroller': {
          fontFamily: '\'Fira Code\', \'Cascadia Code\', monospace',
          overflow: 'auto',
        },
        '.cm-content': {
          padding: '12px 0',
        },
        '.cm-gutters': {
          paddingRight: '4px',
          borderRight: 'none',
        },
      }),
    ]

    if (props.readOnly) {
      extensions.push(EditorView.editable.of(false))
    }

    extensions.push(editor.getLanguageExtension(language.value))

    return extensions
  },
  init() {
    if (!editorContainer.value) {
      return
    }

    const state = EditorState.create({
      doc: codeValue.value || '',
      extensions: editor.buildExtensions(),
    })

    editorView = new EditorView({
      state,
      parent: editorContainer.value,
    })

    cursorState.update(editorView.state)
  },
  destroy() {
    if (editorView) {
      editorView.destroy()
      editorView = null
    }
  },
  updateLanguage() {
    if (!editorView) {
      return
    }

    editorView.dispatch({
      effects: EditorState.reconfigure.of(editor.buildExtensions()),
    })
  },
}

// --- 全屏状态 ---
const fullscreenState = reactive({
  active: false,
  toggle() {
    this.active = !this.active
    nextTick(() => {
      if (editorView) {
        editorView.requestMeasure()
      }
    })
  },
})

// --- 折叠状态 ---
const foldState = reactive({
  folded: false,
  toggle() {
    if (!editorView) {
      return
    }
    this.folded = !this.folded
    if (this.folded) {
      foldAll(editorView)
    } else {
      unfoldAll(editorView)
    }
  },
})

// --- 工具栏操作 ---
const toolbar = reactive({
  async formatCode() {
    const lang = language.value.toLowerCase()
    const rawCode = codeValue.value

    if (!rawCode.trim()) {
      return
    }

    try {
      let formatted = rawCode

      switch (lang) {
        case 'json':
          formatted = JSON.stringify(JSON.parse(rawCode), null, 2)
          break
        default:
          errorState.set({ message: `当前语言 (${lang.toUpperCase()}) 暂不支持格式化`, line: 0 })
          return
      }

      if (formatted !== rawCode && editorView) {
        editorView.dispatch({
          changes: {
            from: 0,
            to: editorView.state.doc.length,
            insert: formatted,
          },
        })
      }
    } catch (e) {
      console.error('格式化失败：请检查语法是否正确', e)
      errorState.set({ message: '格式化失败：请检查语法是否正确', line: 0 })
    }
  },
  async copyCode() {
    try {
      await navigator.clipboard.writeText(codeValue.value || '')
    } catch (_e) {
      // 忽略错误
    }
  },
})

// --- 错误提示 ---
const errorState = reactive({
  info: null,
  timerId: null,
  set(info) {
    this.clear()
    this.info = info
    this.timerId = setTimeout(() => {
      this.info = null
    }, 3000)
  },
  clear() {
    if (this.timerId) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
    this.info = null
  },
})

// --- 光标信息 ---
const cursorState = reactive({
  currentLine: 1,
  update(state) {
    const pos = state.selection.main.head
    const line = state.doc.lineAt(pos)
    this.currentLine = line.number
  },
})

const editorBodyStyle = computed(() => ({
  height: fullscreenState.active
    ? 'calc(100vh - 80px)'
    : typeof props.height === 'number'
      ? `${props.height}px`
      : props.height,
}))

watch(language, (newLang) => {
  emit('language-change', newLang)
  editor.updateLanguage()
})

watch(() => props.modelValue, (newVal) => {
  if (isInternalUpdate) {
    return
  }
  if (editorView && newVal !== editorView.state.doc.toString()) {
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: newVal || '',
      },
    })
  }
})

watch(() => fullscreenState.active, () => {
  nextTick(() => {
    if (editorView) {
      editorView.requestMeasure()
    }
  })
})

onMounted(() => {
  nextTick(() => {
    editor.init()
  })
})

onBeforeUnmount(() => {
  errorState.clear()
  editor.destroy()
})
</script>
