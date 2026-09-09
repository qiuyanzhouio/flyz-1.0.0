<template>
  <div class="flyz-page flex flex-col">
    <div class="flyz-toolbar">
      <Form ref="queryFormRef"
            :form="roleTable.query"
            :form-columns="roleTable.queryColumns"
            class="flex-1 flex flex-wrap gap-2"
            fast-fail></Form>
      <div class="flyz-toolbar-actions flex items-center">
        <button type="button" class="flyz-btn" @click="roleTable.handleSearch">
          查询
        </button>
        <button type="button" class="flyz-btn flyz-btn-text !p-4" @click="roleTable.handleReset">
          重置
        </button>
      </div>
    </div>

    <div class="flex flex-col flex-1 min-h-0">
      <div class="flex items-center justify-between px-2 py-2">
        <div class="text-sm font-medium text-ink-100">
          角色列表
        </div>
        <button type="button" class="flyz-btn flyz-btn-primary" @click="dialog.openCreate">
          <i class="i-mdi-plus mr-1"></i>新增角色
        </button>
      </div>

      <div class="flex-1 min-h-0">
        <Table :columns="roleTable.headers"
               :data="roleTable.items"
               class="h-full"
               border>
          <template #status="{ record }">
            <span class="flyz-chip"
                  :class="`flyz-chip-${record.status === 1 ? 'success' : 'default'}`">
              {{ record.status === 1 ? '启用' : '停用' }}
            </span>
          </template>
          <template #is_builtin="{ record }">
            <span v-if="record.is_builtin" class="flyz-chip flyz-chip-warning">内置</span>
            <span v-else class="flyz-chip flyz-chip-default">自定义</span>
          </template>
          <template #dept_id="{ record }">
            {{ deptConfig.labelMap[record.dept_id] || '-' }}
          </template>
          <template #actions="{ record }">
            <div class="flyz-row-actions flex flex-wrap gap-1">
              <button type="button" class="flyz-btn flyz-btn-text" @click="dialog.openEdit(record)">
                编辑
              </button>
              <button type="button"
                      class="flyz-btn flyz-btn-text"
                      :class="record.status === 1 ? 'flyz-btn-warning-text' : 'flyz-btn-success-text'"
                      @click="rowActions.toggleStatus(record)">
                {{ record.status === 1 ? '停用' : '启用' }}
              </button>
              <button type="button"
                      class="flyz-btn flyz-btn-text flyz-btn-danger-text"
                      :disabled="record.is_builtin"
                      @click="rowActions.remove(record)">
                删除
              </button>
            </div>
          </template>
        </Table>
      </div>

      <Pagination v-model:page="roleTable.page"
                  v-model:page-size="roleTable.pageSize"
                  :total="roleTable.total"
                  @change="roleTable.fetchList()"></Pagination>
    </div>

    <Dialog v-model="dialog.visible"
            :title="dialog.title[dialog.mode]"
            :max-width="560"
            :loading="dialog.submitting"
            confirm-text="保存"
            @cancel="dialog.visible = false"
            @confirm="dialog.submit()">
      <Form ref="dialogFormRef" :form="dialog.form" :form-columns="dialog.formColumns"></Form>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import Form from '@/components/form.vue'
import Table from '@/components/table.vue'
import Dialog from '@/components/dialog.vue'
import Pagination from '@/components/pagination.vue'
import { useConfirm } from '@/register/utils/useConfirm.js'
import utils from '@/register/utils'
import { roleApi, deptApi } from '@/apis/system.js'

definePage({ meta: { requiresAuth: true, keepAlive: true } })

const { danger } = useConfirm()

const queryFormRef = ref()
const dialogFormRef = ref()

// ============================ 角色列表 ============================
const roleTable = reactive({
  statusOptions: [
    { label: '启用', value: 1 },
    { label: '停用', value: 0 },
  ],
  queryColumns: computed(() => [
    { label: '关键词', key: 'keyword', componentsType: 'v-input', placeholder: '角色名/编码', class: '!flex-[0_0_220px]' },
    {
      label: '状态', key: 'status', componentsType: 'v-select',
      itemTitle: 'label', itemValue: 'value', items: roleTable.statusOptions,
      clearable: true, class: '!flex-[0_0_140px]',
    },
  ]),
  headers: [
    { label: 'ID', key: 'id', width: 70 },
    { label: '角色名称', key: 'name', width: 120 },
    { label: '角色编码', key: 'code', width: 120 },
    { label: '描述', key: 'description', width: 200 },
    { label: '所属部门', key: 'dept_id', width: 140 },
    { label: '排序', key: 'sort', width: 80 },
    { label: '类型', key: 'is_builtin', width: 90 },
    { label: '状态', key: 'status', width: 90 },
    { label: '操作', key: 'actions', width: 210 },
  ],
  // 表单绑定的查询条件（未提交）
  query: {},
  // 已提交的查询条件（点击查询后生效）
  committedQuery: {},
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
  async fetchList() {
    const params = {
      page: this.page,
      page_size: this.pageSize,
      ...this.committedQuery,
    }
    const res = await roleApi.list(params)
    if (res?.code === 200) {
      this.items = res.data?.items || []
      this.total = res.data?.total || 0
    }
  },
  handleSearch() {
    this.page = 1
    this.committedQuery = { ...this.query }
    this.fetchList()
  },
  handleReset() {
    this.query = {}
    this.committedQuery = {}
    this.page = 1
    this.fetchList()
  },
})
roleTable.fetchList()

// ============================ 部门选项 ============================
// 部门选项（扁平化 + 缩进）
const deptConfig = reactive({
  options: [],
  labelMap: computed(() => {
    const map = {}
    const walk = (nodes, depth = 0) => {
      nodes.forEach(n => {
        map[n.id] = `${'├ '.repeat(depth)}${n.name}`
        if (n.children?.length) {
          walk(n.children, depth + 1)
        }
      })
    }
    walk(deptConfig.options)
    return map
  }),
  async load() {
    const res = await deptApi.list({ page: 1, page_size: 1000 })
    this.options = res.data?.items || []
  },
})
deptConfig.load()

// ============================ 新增 / 编辑弹窗 ============================
const dialog = reactive({
  visible: false,
  submitting: false,
  mode: 'create',
  title: { create: '新增角色', edit: '编辑角色' },
  form: {},
  formColumns: [],
  buildColumns: isEdit => [
    {
      label: '角色名称', key: 'name', componentsType: 'v-input', placeholder: '如：管理员',
      rules: [v => Boolean(v && String(v).trim()) || '请输入角色名称'],
      class: 'w-[calc(50%-8px)]',
    },
    {
      label: '角色编码', key: 'code', componentsType: 'v-input', placeholder: '如：admin',
      disabled: isEdit,
      rules: [
        v => Boolean(v && String(v).trim()) || '请输入角色编码',
        v => /^[a-zA-Z0-9_]{1,64}$/.test(v) || '1-64位字母/数字/下划线',
      ],
      class: 'w-[calc(50%-8px)]',
    },
    {
      label: '所属部门', key: 'dept_id', componentsType: 'v-select',
      itemTitle: 'name', itemValue: 'id', items: deptConfig.options,
      clearable: true, class: 'w-[calc(50%-8px)]',
    },
    {
      label: '排序', key: 'sort', componentsType: 'v-input', type: 'number',
      class: 'w-[calc(50%-8px)]',
    },
    { label: '描述', key: 'description', componentsType: 'v-input', type: 'textarea', placeholder: '角色说明', class: 'w-full' },
    {
      label: '状态', key: 'status', componentsType: 'v-select',
      itemTitle: 'label', itemValue: 'value', items: roleTable.statusOptions,
      class: 'w-[calc(50%-8px)]',
    },
  ],
  openCreate() {
    this.mode = 'create'
    this.form = { name: '', code: '', description: '', sort: 0, status: 1, dept_id: null }
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
        name: this.form.name, code: this.form.code,
        description: this.form.description, sort: Number(this.form.sort) || 0,
        status: this.form.status, dept_id: this.form.dept_id || null,
      }
      let res
      if (this.mode === 'create') {
        res = await roleApi.create(payload)
        if (res.code === 200) {
          utils.message('success', '角色创建成功')
          this.visible = false
          roleTable.handleSearch()
        }
      } else {
        res = await roleApi.update(this.form.id, payload)
        if (res.code === 200) {
          utils.message('success', '角色更新成功')
          this.visible = false
          roleTable.fetchList()
        }
      }
    } finally {
      this.submitting = false
    }
  },
})

// ============================ 行操作 ============================
const rowActions = reactive({
  async toggleStatus(record) {
    const next = record.status === 1 ? 0 : 1
    const res = await roleApi.update(record.id, { status: next })
    if (res.code === 200) {
      utils.message('success', next === 1 ? '已启用' : '已停用')
      roleTable.fetchList()
    }
  },
  async remove(record) {
    if (record.is_builtin) {
      utils.message('warning', '内置角色不可删除')
      return
    }
    const ok = await danger(`确认删除角色「${record.name}」吗？`)
    if (!ok) {
      return
    }
    const res = await roleApi.remove(record.id)
    if (res.code === 200) {
      utils.message('success', '删除成功')
      roleTable.fetchList()
    }
  },
})
</script>
