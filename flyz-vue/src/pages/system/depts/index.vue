<template>
  <div class="flyz-page flex flex-col">
    <div class="flyz-toolbar">
      <Form ref="queryFormRef"
            :form="deptTable.query"
            :form-columns="deptTable.queryColumns"
            class="flex-1 flex flex-wrap gap-2"
            fast-fail></Form>
      <div class="flyz-toolbar-actions flex items-center">
        <button type="button" class="flyz-btn" @click="deptTable.handleSearch">
          查询
        </button>
        <button type="button" class="flyz-btn flyz-btn-text !px-4" @click="deptTable.handleReset">
          重置
        </button>
      </div>
    </div>

    <div class="flex flex-col flex-1 min-h-0">
      <div class="flex items-center justify-between px-2 py-2">
        <div class="text-sm font-medium text-ink-100">
          部门列表
        </div>
        <button type="button" class="flyz-btn flyz-btn-primary" @click="deptDialog.openCreate(null)">
          <i class="i-mdi-plus mr-1"></i>新增部门
        </button>
      </div>

      <div class="flex-1 min-h-0">
        <Table :columns="deptTable.headers"
               :data="deptTable.filteredItems"
               class="h-full"
               border>
          <template #name="{ record }">
            <div class="flex items-center gap-1" :style="{ paddingLeft: `${(record.level || 0) * 20}px` }">
              <i v-if="record.hasChildren" class="i-mdi-subdirectory-arrow-right text-ink-400"></i>
              <span>{{ record.name }}</span>
            </div>
          </template>
          <template #status="{ record }">
            <span class="flyz-chip"
                  :class="`flyz-chip-${record.status === 1 ? 'success' : 'default'}`">
              {{ record.status === 1 ? '启用' : '停用' }}
            </span>
          </template>
          <template #actions="{ record }">
            <div class="flyz-row-actions flex flex-wrap gap-1">
              <button type="button" class="flyz-btn flyz-btn-text" @click="deptDialog.openCreate(record)">
                新增子部门
              </button>
              <button type="button" class="flyz-btn flyz-btn-text" @click="deptDialog.openEdit(record)">
                编辑
              </button>
              <button type="button"
                      class="flyz-btn flyz-btn-text"
                      :class="record.status === 1 ? 'flyz-btn-warning-text' : 'flyz-btn-success-text'"
                      @click="deptTable.toggleStatus(record)">
                {{ record.status === 1 ? '停用' : '启用' }}
              </button>
              <button type="button"
                      class="flyz-btn flyz-btn-text flyz-btn-danger-text"
                      @click="deptTable.remove(record)">
                删除
              </button>
            </div>
          </template>
        </Table>
      </div>
    </div>

    <Dialog v-model="deptDialog.visible"
            :title="deptDialog.title[deptDialog.mode]"
            :max-width="520"
            :loading="deptDialog.submitting"
            confirm-text="保存"
            @cancel="deptDialog.visible = false"
            @confirm="deptDialog.submit()">
      <Form ref="dialogFormRef" :form="deptDialog.form" :form-columns="deptDialog.formColumns"></Form>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import Form from '@/components/form.vue'
import Table from '@/components/table.vue'
import Dialog from '@/components/dialog.vue'
import { useConfirm } from '@/register/utils/useConfirm.js'
import utils from '@/register/utils'
import { deptApi } from '@/apis/system.js'

definePage({ meta: { requiresAuth: true, keepAlive: true } })

const { danger } = useConfirm()

const dialogFormRef = ref()

const deptTable = reactive({
  query: { keyword: '', status: null },
  committedQuery: { keyword: '', status: null },
  queryColumns: computed(() => [
    { label: '关键词', key: 'keyword', componentsType: 'v-input', placeholder: '部门名称/编码', class: '!flex-[0_0_220px]' },
    {
      label: '状态', key: 'status', componentsType: 'v-select',
      itemTitle: 'label', itemValue: 'value', items: deptTable.statusOptions,
      clearable: true, class: '!flex-[0_0_140px]',
    },
  ]),
  headers: [
    { label: '部门名称', key: 'name', width: 90 },
    { label: '部门编码', key: 'code', width: 180 },
    { label: '排序', key: 'sort_order', width: 80 },
    { label: '状态', key: 'status', width: 90 },
    { label: '创建时间', key: 'created_at', width: 170 },
    { label: '操作', key: 'actions', width: 280 },
  ],
  statusOptions: [
    { label: '启用', value: 1 },
    { label: '停用', value: 0 },
  ],
  items: [],
  loading: false,
  // 构建父子映射
  childMap: computed(() => {
    const map = {}
    deptTable.items.forEach(item => {
      const pid = item.parent_id ?? 0
      if (!map[pid]) {
        map[pid] = []
      }
      map[pid].push(item)
    })
    Object.values(map).forEach(arr => arr.sort((a, b) => a.sort_order - b.sort_order))
    return map
  }),
  // 扁平化（带层级）
  flatItems: computed(() => {
    const rows = []
    const walk = (parentId, level) => {
      const children = deptTable.childMap[parentId] || []
      children.forEach(item => {
        rows.push({ ...item, level, hasChildren: (deptTable.childMap[item.id] || []).length > 0 })
        walk(item.id, level + 1)
      })
    }
    walk(0, 0)
    return rows
  }),
  filteredItems: computed(() => {
    const kw = (deptTable.committedQuery.keyword || '').trim()
    const st = deptTable.committedQuery.status
    return deptTable.flatItems.filter(item => {
      const hitKw = !kw || item.name.includes(kw) || item.code.includes(kw)
      const hitSt = st === null || st === undefined || item.status === st
      return hitKw && hitSt
    })
  }),
  async fetchList() {
    this.loading = true
    try {
      const res = await deptApi.list({ page: 1, page_size: 1000 })
      if (res.code === 200) {
        this.items = res.data?.items || []
      }
    } finally {
      this.loading = false
    }
  },
  handleSearch() {
    this.committedQuery.keyword = this.query.keyword
    this.committedQuery.status = this.query.status
  },
  handleReset() {
    this.query.keyword = ''
    this.query.status = null
    this.committedQuery.keyword = ''
    this.committedQuery.status = null
  },
  // 父部门选项（编辑时排除自身及子孙）
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
    const res = await deptApi.update(record.id, { status: next })
    if (res.code === 200) {
      utils.message('success', next === 1 ? '已启用' : '已停用')
      this.fetchList()
    }
  },
  async remove(record) {
    const hasChildren = (this.childMap[record.id] || []).length > 0
    if (hasChildren) {
      utils.message('warning', '存在子部门，无法删除')
      return
    }
    const ok = await danger(`确认删除部门「${record.name}」吗？`)
    if (!ok) {
      return
    }
    const res = await deptApi.remove(record.id)
    if (res.code === 200) {
      utils.message('success', '删除成功')
      this.fetchList()
    }
  },
})
deptTable.fetchList()

const deptDialog = reactive({
  visible: false,
  submitting: false,
  mode: 'create',
  parentId: null,
  title: { create: '新增部门', edit: '编辑部门' },
  form: {},
  formColumns: [],
  buildColumns(isEdit) {
    const parentOptions = deptTable.buildParentOptions(isEdit ? this.form.id : null)
    return [
      {
        label: '部门名称', key: 'name', componentsType: 'v-input', placeholder: '如：技术部',
        rules: [v => Boolean(v && String(v).trim()) || '请输入部门名称'],
        class: 'w-[calc(50%-8px)]',
      },
      {
        label: '部门编码', key: 'code', componentsType: 'v-input', placeholder: '如：tech',
        disabled: isEdit,
        rules: [
          v => Boolean(v && String(v).trim()) || '请输入部门编码',
          v => /^[a-zA-Z0-9_]{1,64}$/.test(v) || '1-64位字母/数字/下划线',
        ],
        class: 'w-[calc(50%-8px)]',
      },
      {
        label: '上级部门', key: 'parent_id', componentsType: 'v-select',
        itemTitle: 'name', itemValue: 'id', items: parentOptions,
        clearable: true, class: 'w-[calc(50%-8px)]',
      },
      {
        label: '排序', key: 'sort_order', componentsType: 'v-input', type: 'number',
        class: 'w-[calc(50%-8px)]',
      },
      {
        label: '状态', key: 'status', componentsType: 'v-select',
        itemTitle: 'label', itemValue: 'value', items: deptTable.statusOptions,
        class: 'w-[calc(50%-8px)]',
      },
    ]
  },
  openCreate(parent) {
    this.mode = 'create'
    this.parentId = parent?.id ?? null
    this.form = { name: '', code: '', parent_id: parent?.id ?? null, sort_order: 0, status: 1 }
    this.formColumns = this.buildColumns(false)
    this.visible = true
  },
  openEdit(record) {
    this.mode = 'edit'
    this.parentId = record.parent_id ?? null
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
        sort_order: Number(this.form.sort_order) || 0,
        status: this.form.status,
      }
      if (this.mode === 'create') {
        payload.code = this.form.code
        const res = await deptApi.create(payload)
        if (res.code === 200) {
          utils.message('success', '部门创建成功')
          this.visible = false
          deptTable.fetchList()
        }
      } else {
        const res = await deptApi.update(this.form.id, payload)
        if (res.code === 200) {
          utils.message('success', '部门更新成功')
          this.visible = false
          deptTable.fetchList()
        }
      }
    } finally {
      this.submitting = false
    }
  },
})
</script>
