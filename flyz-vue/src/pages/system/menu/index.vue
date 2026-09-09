<template>
  <div class="flyz-page flex flex-col">
    <div class="flyz-toolbar">
      <Form ref="queryFormRef"
            label-direction="left"
            :form="menuTable.query"
            :form-columns="menuTable.queryColumns"
            class="flex-1 flex flex-wrap gap-2"
            fast-fail></Form>
      <div class="flyz-toolbar-actions flex items-center">
        <button type="button" class="flyz-btn" @click="menuTable.handleSearch">
          查询
        </button>
        <button type="button" class="flyz-btn flyz-btn-text !px-4" @click="menuTable.handleReset">
          重置
        </button>
      </div>
    </div>

    <div class="flex flex-col flex-1 min-h-0">
      <div class="flex items-center justify-between px-2 py-2">
        <div class="text-sm font-medium text-ink-100">
          菜单列表
        </div>
        <button type="button" class="flyz-btn flyz-btn-primary" @click="menuDialog.openCreate(null)">
          <i class="i-mdi-plus mr-1"></i>新增菜单
        </button>
      </div>

      <div class="flex-1 min-h-0">
        <Table :columns="menuTable.headers"
               :data="menuTable.filteredItems"
               class="h-full"
               border>
          <template #name="{ record }">
            <div class="flex items-center gap-2" :style="{ paddingLeft: `${(record.level || 0) * 20}px` }">
              <i v-if="record.hasChildren" class="i-mdi-subdirectory-arrow-right text-ink-400"></i>
              <i v-if="record.icon" :class="['flyz-cell-icon', record.icon.startsWith('i-') ? record.icon : `i-${record.icon}`]"></i>
              <span>{{ record.name }}</span>
            </div>
          </template>
          <template #status="{ record }">
            <span class="flyz-chip"
                  :class="`flyz-chip-${record.status === 1 ? 'success' : 'default'}`">
              {{ record.status === 1 ? '启用' : '禁用' }}
            </span>
          </template>
          <template #actions="{ record }">
            <div class="flyz-row-actions flex flex-wrap gap-1">
              <button type="button" class="flyz-btn flyz-btn-text" @click="menuDialog.openCreate(record)">
                新增子菜单
              </button>
              <button type="button" class="flyz-btn flyz-btn-text" @click="menuDialog.openEdit(record)">
                编辑
              </button>
              <button type="button"
                      class="flyz-btn flyz-btn-text"
                      :class="record.status === 1 ? 'flyz-btn-warning-text' : 'flyz-btn-success-text'"
                      @click="menuTable.toggleStatus(record)">
                {{ record.status === 1 ? '禁用' : '启用' }}
              </button>
              <button type="button"
                      class="flyz-btn flyz-btn-text flyz-btn-danger-text"
                      @click="menuTable.remove(record)">
                删除
              </button>
            </div>
          </template>
        </Table>
      </div>
    </div>

    <Dialog v-model="menuDialog.visible"
            :title="menuDialog.title[menuDialog.mode]"
            :max-width="640"
            :loading="menuDialog.submitting"
            confirm-text="保存"
            @cancel="menuDialog.visible = false"
            @confirm="menuDialog.submit()">
      <Form ref="dialogFormRef" :form="menuDialog.form" :form-columns="menuDialog.formColumns"></Form>
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
import { menuApi } from '@/apis/system.js'

definePage({ meta: { requiresAuth: true, keepAlive: true } })

const { danger } = useConfirm()

const dialogFormRef = ref()

const menuTable = reactive({
  statusOptions: [
    { label: '启用', value: 1 },
    { label: '禁用', value: 0 },
  ],
  query: { keyword: '', status: null },
  queryColumns: computed(() => [
    { label: '关键词', key: 'keyword', componentsType: 'v-input', placeholder: '菜单名称/编码', class: '!flex-[0_0_220px]' },
    {
      label: '状态', key: 'status', componentsType: 'v-select',
      itemTitle: 'label', itemValue: 'value', items: menuTable.statusOptions,
      clearable: true, class: '!flex-[0_0_140px]',
    },
  ]),
  headers: [
    { label: '菜单名称', key: 'name', width: 180 },
    { label: '菜单编码', key: 'code', width: 180 },
    { label: '路由地址', key: 'path', width: 200 },
    { label: '排序', key: 'sort_order', width: 70 },
    { label: '状态', key: 'status', width: 80 },
    { label: '操作', key: 'actions', width: 280 },
  ],
  items: [],
  childMap: computed(() => {
    const map = {}
    menuTable.items.forEach(item => {
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
      ;(menuTable.childMap[parentId] || []).forEach(item => {
        rows.push({ ...item, level, hasChildren: (menuTable.childMap[item.id] || []).length > 0 })
        walk(item.id, level + 1)
      })
    }
    walk(0, 0)
    return rows
  }),
  filteredItems: computed(() => {
    const kw = (menuTable.query.keyword || '').trim()
    const st = menuTable.query.status
    return menuTable.flatItems.filter(item => {
      const hitKw = !kw || item.name.includes(kw) || item.code.includes(kw)
      const hitSt = st === null || st === undefined || item.status === st
      return hitKw && hitSt
    })
  }),
  async fetchList() {
    const res = await menuApi.list({ page: 1, page_size: 100 })
    if (res.code === 200) {
      this.items = res.data?.items || []
    }
  },
  handleSearch() {
    // 直接依赖 query 响应式，无需额外提交
  },
  handleReset() {
    this.query.keyword = ''
    this.query.status = null
  },
  // 父菜单选项（编辑时排除自身及子孙，避免循环挂载）
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
  async toggleStatus(record) {
    const next = record.status === 1 ? 0 : 1
    const res = await menuApi.update(record.id, { status: next })
    if (res.code === 200) {
      utils.message('success', next === 1 ? '已启用' : '已禁用')
      this.fetchList()
    }
  },
  async remove(record) {
    const hasChildren = (this.childMap[record.id] || []).length > 0
    if (hasChildren) {
      utils.message('warning', '存在子菜单，无法删除')
      return
    }
    const ok = await danger(`确认删除菜单「${record.name}」吗？`)
    if (!ok) {
      return
    }
    const res = await menuApi.remove(record.id)
    if (res.code === 200) {
      utils.message('success', '删除成功')
      this.fetchList()
    }
  },
})
menuTable.fetchList()

const menuDialog = reactive({
  visible: false,
  submitting: false,
  mode: 'create',
  title: { create: '新增菜单', edit: '编辑菜单' },
  form: {},
  formColumns: [],
  buildColumns(isEdit) {
    const parentOptions = menuTable.buildParentOptions(isEdit ? this.form.id : null)
    return [
      {
        label: '菜单名称', key: 'name', componentsType: 'v-input', placeholder: '如：用户管理',
        rules: [v => Boolean(v && String(v).trim()) || '请输入菜单名称'],
        class: 'w-[calc(50%-8px)]',
      },
      {
        label: '菜单编码', key: 'code', componentsType: 'v-input', placeholder: '如：system:user',
        disabled: isEdit,
        rules: [
          v => Boolean(v && String(v).trim()) || '请输入菜单编码',
          v => /^[a-zA-Z0-9:_-]{1,128}$/.test(v) || '1-128位字母/数字/:_-',
        ],
        class: 'w-[calc(50%-8px)]',
      },
      {
        label: '上级菜单', key: 'parent_id', componentsType: 'v-select',
        itemTitle: 'name', itemValue: 'id', items: parentOptions,
        clearable: true, placeholder: '不选则为顶级菜单', class: 'w-[calc(50%-8px)]',
      },
      {
        label: '路由地址', key: 'path', componentsType: 'v-input', placeholder: '如：/system/users',
        class: 'w-[calc(50%-8px)]',
      },
      {
        label: '菜单图标', key: 'icon', componentsType: 'v-input', placeholder: 'mdi-account',
        class: 'w-[calc(50%-8px)]',
      },
      {
        label: '排序', key: 'sort_order', componentsType: 'v-input', type: 'number',
        class: 'w-[calc(50%-8px)]',
      },
      {
        label: '状态', key: 'status', componentsType: 'v-select',
        itemTitle: 'label', itemValue: 'value', items: menuTable.statusOptions,
        class: 'w-[calc(50%-8px)]',
      },
    ]
  },
  openCreate(parent) {
    this.mode = 'create'
    this.form = {
      name: '', code: '', parent_id: parent?.id ?? null,
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
        const res = await menuApi.create(payload)
        if (res.code === 200) {
          utils.message('success', '菜单创建成功')
          this.visible = false
          menuTable.fetchList()
        }
      } else {
        const res = await menuApi.update(this.form.id, payload)
        if (res.code === 200) {
          utils.message('success', '菜单更新成功')
          this.visible = false
          menuTable.fetchList()
        }
      }
    } finally {
      this.submitting = false
    }
  },
})
</script>
