<template>
  <div class="flyz-page flex flex-col">
    <div class="flyz-toolbar">
      <Form ref="queryFormRef"
            :form="permissionTable.query"
            :form-columns="permissionTable.queryColumns"
            class="flex-1 flex flex-wrap gap-2"
            fast-fail></Form>
      <div class="flyz-toolbar-actions flex items-center">
        <button type="button" class="flyz-btn" @click="permissionTable.handleSearch">
          查询
        </button>
        <button type="button" class="flyz-btn flyz-btn-text" @click="permissionTable.handleReset">
          重置
        </button>
      </div>
    </div>

    <div class="flyz-page-card flex flex-col flex-1 min-h-0">
      <div class="flex items-center justify-between px-2 py-2">
        <div class="text-sm font-medium text-ink-100">
          权限列表
        </div>
        <button type="button" class="flyz-btn flyz-btn-primary" @click="permissionDialog.openCreate(null)">
          <i class="i-mdi-plus mr-1"></i>新增权限
        </button>
      </div>

      <div class="flex-1 min-h-0">
        <Table :columns="permissionTable.headers"
               :data="permissionTable.filteredItems"
               class="h-full"
               border>
          <template #name="{ record }">
            <div class="flex items-center gap-2" :style="{ paddingLeft: `${(record.level || 0) * 20}px` }">
              <i v-if="record.hasChildren" class="i-mdi-subdirectory-arrow-right text-ink-400"></i>
              <i v-if="record.icon" :class="['flyz-cell-icon', record.icon.startsWith('i-') ? record.icon : `i-${record.icon}`]"></i>
              <span>{{ record.name }}</span>
            </div>
          </template>
          <template #type="{ record }">
            <span class="flyz-chip"
                  :class="`flyz-chip-${permissionTable.typeMeta[record.type]?.color || 'default'}`">
              {{ permissionTable.typeMeta[record.type]?.label || record.type }}
            </span>
          </template>
          <template #status="{ record }">
            <span class="flyz-chip"
                  :class="`flyz-chip-${record.status === 1 ? 'success' : 'default'}`">
              {{ record.status === 1 ? '启用' : '禁用' }}
            </span>
          </template>
          <template #actions="{ record }">
            <div class="flyz-row-actions flex flex-wrap gap-1">
              <button type="button" class="flyz-btn flyz-btn-text" @click="permissionDialog.openCreate(record)">
                新增子项
              </button>
              <button type="button" class="flyz-btn flyz-btn-text" @click="permissionDialog.openEdit(record)">
                编辑
              </button>
              <button type="button"
                      class="flyz-btn flyz-btn-text flyz-btn-danger-text"
                      @click="permissionTable.remove(record)">
                删除
              </button>
            </div>
          </template>
        </Table>
      </div>
    </div>

    <Dialog v-model="permissionDialog.visible"
            :title="permissionDialog.title[permissionDialog.mode]"
            :max-width="640"
            :loading="permissionDialog.submitting"
            confirm-text="保存"
            @cancel="permissionDialog.visible = false"
            @confirm="permissionDialog.submit()">
      <Form ref="dialogFormRef" :form="permissionDialog.form" :form-columns="permissionDialog.formColumns"></Form>
    </Dialog>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import Form from '@/components/form.vue'
import Table from '@/components/table.vue'
import Dialog from '@/components/dialog.vue'
import { useConfirm } from '@/register/utils/useConfirm.js'
import utils from '@/register/utils'
import { permissionApi } from '@/apis/system.js'

definePage({ meta: { requiresAuth: true, keepAlive: true } })

const { danger } = useConfirm()

const dialogFormRef = ref()

const permissionTable = reactive({
  typeMeta: {
    menu: { label: '菜单', color: 'primary' },
    button: { label: '按钮', color: 'warning' },
    api: { label: '接口', color: 'info' },
  },
  typeOptions: [
    { label: '菜单', value: 'menu' },
    { label: '按钮', value: 'button' },
    { label: '接口', value: 'api' },
  ],
  statusOptions: [
    { label: '启用', value: 1 },
    { label: '禁用', value: 0 },
  ],
  query: { keyword: '', type: null, status: null },
  queryColumns: computed(() => [
    { label: '关键词', key: 'keyword', componentsType: 'v-input', placeholder: '权限名称/编码', class: '!flex-[0_0_200px]' },
    {
      label: '类型', key: 'type', componentsType: 'v-select',
      itemTitle: 'label', itemValue: 'value', items: permissionTable.typeOptions,
      clearable: true, class: '!flex-[0_0_130px]',
    },
    {
      label: '状态', key: 'status', componentsType: 'v-select',
      itemTitle: 'label', itemValue: 'value', items: permissionTable.statusOptions,
      clearable: true, class: '!flex-[0_0_130px]',
    },
  ]),
  headers: [
    { label: '权限名称', key: 'name' },
    { label: '权限编码', key: 'code', width: 200 },
    { label: '类型', key: 'type', width: 90 },
    { label: '路径', key: 'path', width: 200 },
    { label: '排序', key: 'sort_order', width: 70 },
    { label: '状态', key: 'status', width: 80 },
    { label: '操作', key: 'actions', width: 220 },
  ],
  items: [],
  childMap: computed(() => {
    const map = {}
    permissionTable.items.forEach(item => {
      const pid = item.parent_id ?? 0
      if (!map[pid]) {
        map[pid] = []
      }
      map[pid].push(item)
    })
    Object.values(map).forEach(arr => arr.sort((a, b) => a.sort_order - b.sort_order))
    return map
  }),
  flatItems: computed(() => {
    const rows = []
    const walk = (parentId, level) => {
      ;(permissionTable.childMap[parentId] || []).forEach(item => {
        rows.push({ ...item, level, hasChildren: (permissionTable.childMap[item.id] || []).length > 0 })
        walk(item.id, level + 1)
      })
    }
    walk(0, 0)
    return rows
  }),
  filteredItems: computed(() => {
    const kw = (permissionTable.query.keyword || '').trim()
    return permissionTable.flatItems.filter(item => {
      const hitKw = !kw || item.name.includes(kw) || item.code.includes(kw)
      const hitType = !permissionTable.query.type || item.type === permissionTable.query.type
      const hitStatus = permissionTable.query.status === null || permissionTable.query.status === undefined || item.status === permissionTable.query.status
      return hitKw && hitType && hitStatus
    })
  }),
  async fetchList() {
    const res = await permissionApi.list({ page: 1, page_size: 1000 })
    if (res.code === 200) {
      this.items = res.data?.items || []
    }
  },
  handleSearch() { /* 响应式过滤 */ },
  handleReset() {
    this.query.keyword = ''
    this.query.type = null
    this.query.status = null
  },
  buildParentOptions(excludeId = null) {
    const excludeSet = new Set()
    if (excludeId !== null) {
      const collect = (id) => {
        excludeSet.add(id)
        ;(this.childMap[id] || []).forEach(c => collect(c.id))
      }
      collect(excludeId)
    }
    const options = []
    const walk = (parentId, depth) => {
      ;(this.childMap[parentId] || []).forEach(item => {
        if (excludeSet.has(item.id)) {
          return
        }
        options.push({ id: item.id, name: `${'├ '.repeat(depth)}${item.name}` })
        walk(item.id, depth + 1)
      })
    }
    walk(0, 0)
    return options
  },
  async remove(record) {
    const hasChildren = (this.childMap[record.id] || []).length > 0
    if (hasChildren) {
      utils.message('warning', '存在子权限，无法删除')
      return
    }
    const ok = await danger(`确认删除权限「${record.name}」吗？`)
    if (!ok) {
      return
    }
    const res = await permissionApi.remove(record.id)
    if (res.code === 200) {
      utils.message('success', '删除成功')
      this.fetchList()
    }
  },
})
permissionTable.fetchList()

const permissionDialog = reactive({
  visible: false,
  submitting: false,
  mode: 'create',
  title: { create: '新增权限', edit: '编辑权限' },
  form: {},
  formColumns: [],
  buildColumns(isEdit) {
    const parentOptions = permissionTable.buildParentOptions(isEdit ? this.form.id : null)
    return [
      {
        label: '权限名称', key: 'name', componentsType: 'v-input',
        rules: [v => Boolean(v && String(v).trim()) || '请输入权限名称'],
        class: 'w-[calc(50%-8px)]',
      },
      {
        label: '权限编码', key: 'code', componentsType: 'v-input', placeholder: '如 system:user:list',
        disabled: isEdit,
        rules: [
          v => Boolean(v && String(v).trim()) || '请输入权限编码',
          v => /^[a-zA-Z0-9:_-]{1,128}$/.test(v) || '1-128位字母/数字/:_-',
        ],
        class: 'w-[calc(50%-8px)]',
      },
      {
        label: '类型', key: 'type', componentsType: 'v-select',
        itemTitle: 'label', itemValue: 'value', items: permissionTable.typeOptions,
        disabled: isEdit,
        rules: [v => Boolean(v) || '请选择类型'],
        class: 'w-[calc(50%-8px)]',
      },
      {
        label: '上级权限', key: 'parent_id', componentsType: 'v-select',
        itemTitle: 'name', itemValue: 'id', items: parentOptions,
        clearable: true, placeholder: '不选则为顶级', class: 'w-[calc(50%-8px)]',
      },
      {
        label: '路径', key: 'path', componentsType: 'v-input',
        placeholder: '菜单路由或后端 API 路径', class: 'w-[calc(50%-8px)]',
      },
      {
        label: '图标', key: 'icon', componentsType: 'v-input', placeholder: 'mdi-account',
        class: 'w-[calc(50%-8px)]',
      },
      {
        label: '排序', key: 'sort_order', componentsType: 'v-input', type: 'number',
        class: 'w-[calc(50%-8px)]',
      },
      {
        label: '状态', key: 'status', componentsType: 'v-select',
        itemTitle: 'label', itemValue: 'value', items: permissionTable.statusOptions,
        class: 'w-[calc(50%-8px)]',
      },
    ]
  },
  openCreate(parent) {
    this.mode = 'create'
    this.form = {
      name: '', code: '', type: 'button', parent_id: parent?.id ?? null,
      path: '', icon: '', sort_order: 0, status: 1,
    }
    this.formColumns = this.buildColumns(false)
    this.visible = true
  },
  openEdit(record) {
    this.mode = 'edit'
    this.form = { ...record }
    this.formColumns = this.buildColumns(true)
    this.visible = true
  },
  async submit() {
    const { valid } = await dialogFormRef.value.validate()
    if (!valid) {
      return
    }
    this.submitting = true
    try {
      const payload = {
        name: this.form.name,
        parent_id: this.form.parent_id || null,
        path: this.form.path || '',
        icon: this.form.icon || '',
        sort_order: Number(this.form.sort_order) || 0,
        status: this.form.status,
      }
      if (this.mode === 'create') {
        payload.code = this.form.code
        payload.type = this.form.type
        const res = await permissionApi.create(payload)
        if (res.code === 200) {
          utils.message('success', '权限创建成功')
          this.visible = false
          permissionTable.fetchList()
        }
      } else {
        const res = await permissionApi.update(this.form.id, payload)
        if (res.code === 200) {
          utils.message('success', '权限更新成功')
          this.visible = false
          permissionTable.fetchList()
        }
      }
    } finally {
      this.submitting = false
    }
  },
})
</script>
