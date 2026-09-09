<template>
  <div class="flyz-page flex flex-col">
    <!-- 查询条件 -->
    <div class="flyz-toolbar">
      <Form ref="queryFormRef"
            :form="userTable.query"
            :form-columns="userTable.queryColumns"
            class="flex-1 flex flex-wrap gap-2"
            fast-fail></Form>
      <div class="flyz-toolbar-actions flex items-center">
        <button type="button" class="flyz-btn" @click="userTable.handleSearch">
          查询
        </button>
        <button type="button" class="flyz-btn flyz-btn-text" @click="userTable.handleReset">
          重置
        </button>
      </div>
    </div>

    <div class="flyz-page-card flex flex-col flex-1 min-h-0">
      <!-- 工具栏：新增 -->
      <div class="flex items-center justify-between px-2 py-2">
        <div class="text-sm font-medium text-ink-100">
          用户列表
        </div>
        <button type="button" class="flyz-btn flyz-btn-primary" @click="dialog.openCreate">
          <i class="i-mdi-plus mr-1"></i>新增用户
        </button>
      </div>

      <!-- 数据表格 -->
      <div class="flex-1 min-h-0">
        <Table :columns="userTable.headers"
               :data="userTable.items"
               class="h-full"
               border>
          <template #status="{ record }">
            <span class="flyz-chip"
                  :class="`flyz-chip-${dictStore.getDictColor('user_status', record.status)}`">
              {{ dictStore.getDictLabel('user_status', record.status) }}
            </span>
          </template>
          <template #created_at="{ record }">
            <span class="flyz-text-muted text-xs">{{ formatTime(record.created_at) }}</span>
          </template>
          <template #actions="{ record }">
            <div class="flyz-row-actions flex flex-wrap gap-1">
              <button type="button"
                      class="flyz-btn flyz-btn-text"
                      @click="dialog.openEdit(record)">
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
                      @click="rowActions.remove(record)">
                删除
              </button>
            </div>
          </template>
        </Table>
      </div>

      <!-- 分页 -->
      <Pagination v-model:page="userTable.page"
                  v-model:page-size="userTable.pageSize"
                  :total="userTable.total"
                  @change="userTable.fetchList()"></Pagination>
    </div>

    <!-- 新增 / 编辑弹窗 -->
    <Dialog v-model="dialog.visible"
            :title="dialog.title[dialog.mode]"
            :max-width="560"
            :loading="dialog.submitting"
            confirm-text="保存"
            @cancel="dialog.visible = false"
            @confirm="dialog.submit()">
      <Form ref="dialogFormRef"
            :form="dialog.form"
            :form-columns="dialog.formColumns"></Form>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import Form from '@/components/form.vue'
import Table from '@/components/table.vue'
import Dialog from '@/components/dialog.vue'
import Pagination from '@/components/pagination.vue'
import { useDictStore } from '@/register/stores/dict.js'
import { useConfirm } from '@/register/utils/useConfirm.js'
import utils from '@/register/utils'
import { userApi } from '@/apis/system.js'

definePage({
  meta: {
    requiresAuth: true,
    keepAlive: true,
  },
})

const dictStore = useDictStore()
const { danger } = useConfirm()
dictStore.loadDict('user_status')

const queryFormRef = ref()
const dialogFormRef = ref()

// ============================ 用户列表 ============================
const userTable = reactive({
  // 状态下拉选项（数值类型，与后端 1/0 对齐）
  statusOptions: [
    { label: '启用', value: 1 },
    { label: '停用', value: 0 },
  ],
  // 查询表单列
  queryColumns: computed(() => [
    { label: '关键词', key: 'keyword', componentsType: 'v-input', placeholder: '用户名/邮箱/昵称', class: '!flex-[0_0_220px]' },
    {
      label: '状态',
      key: 'status',
      componentsType: 'v-select',
      itemTitle: 'label',
      itemValue: 'value',
      items: userTable.statusOptions,
      clearable: true,
      class: '!flex-[0_0_140px]',
    },
  ]),
  headers: [
    { label: 'ID', key: 'id', width: 70 },
    { label: '用户名', key: 'username' },
    { label: '昵称', key: 'nickname' },
    { label: '邮箱', key: 'email' },
    { label: '状态', key: 'status', width: 90 },
    { label: '创建时间', key: 'created_at', width: 170 },
    { label: '操作', key: 'actions', width: 220 },
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
    const res = await userApi.list(params)
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
userTable.fetchList()

// ============================ 新增 / 编辑弹窗 ============================
const dialog = reactive({
  visible: false,
  submitting: false,
  mode: 'create',
  title: { create: '新增用户', edit: '编辑用户' },
  form: {},
  formColumns: [],
  // 新建表单列
  createColumns: [
    {
      label: '用户名',
      key: 'username',
      componentsType: 'v-input',
      placeholder: '字母/数字/下划线',
      rules: [
        v => Boolean(v && String(v).trim()) || '请输入用户名',
        v => /^[a-zA-Z0-9_]{3,64}$/.test(v) || '3-64位字母/数字/下划线',
      ],
      class: 'w-[calc(50%-8px)]',
    },
    {
      label: '邮箱',
      key: 'email',
      componentsType: 'v-input',
      placeholder: 'name@example.com',
      rules: [
        v => Boolean(v && String(v).trim()) || '请输入邮箱',
        v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || '邮箱格式不正确',
      ],
      class: 'w-[calc(50%-8px)]',
    },
    {
      label: '密码',
      key: 'password',
      componentsType: 'v-input',
      type: 'password',
      placeholder: '6-64位',
      rules: [
        v => Boolean(v && String(v).trim()) || '请输入密码',
        v => String(v).length >= 6 || '密码至少 6 位',
      ],
      class: 'w-[calc(50%-8px)]',
    },
    { label: '昵称', key: 'nickname', componentsType: 'v-input', placeholder: '不填则与用户名相同', class: 'w-[calc(50%-8px)]' },
  ],
  // 编辑表单列（用户名/密码不可改）
  editColumns: [
    { label: '用户名', key: 'username', componentsType: 'v-input', disabled: true, class: 'w-[calc(50%-8px)]' },
    { label: '邮箱', key: 'email', componentsType: 'v-input', rules: [v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || '邮箱格式不正确'], class: 'w-[calc(50%-8px)]' },
    { label: '昵称', key: 'nickname', componentsType: 'v-input', class: 'w-[calc(50%-8px)]' },
    {
      label: '状态',
      key: 'status',
      componentsType: 'v-select',
      itemTitle: 'label',
      itemValue: 'value',
      items: userTable.statusOptions,
      class: 'w-[calc(50%-8px)]',
    },
  ],
  openCreate() {
    this.mode = 'create'
    this.form = { username: '', email: '', password: '', nickname: '' }
    this.formColumns = this.createColumns
    this.visible = true
  },
  openEdit(record) {
    this.mode = 'edit'
    this.form = { ...record }
    this.formColumns = this.editColumns
    this.visible = true
  },
  async submit() {
    const { valid } = await dialogFormRef.value.validate()
    if (!valid) {
      return
    }
    this.submitting = true
    try {
      if (this.mode === 'create') {
        const res = await userApi.create({ ...this.form })
        if (res.code === 200) {
          utils.message('success', '用户创建成功')
          this.visible = false
          userTable.handleSearch()
        }
      } else {
        const payload = {
          nickname: this.form.nickname,
          email: this.form.email,
          status: this.form.status,
        }
        const res = await userApi.update(this.form.id, payload)
        if (res.code === 200) {
          utils.message('success', '用户更新成功')
          this.visible = false
          userTable.fetchList()
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
    const res = await userApi.update(record.id, { status: next })
    if (res.code === 200) {
      utils.message('success', next === 1 ? '已启用' : '已停用')
      userTable.fetchList()
    }
  },
  async remove(record) {
    const ok = await danger(`确认删除用户「${record.nickname || record.username}」吗？此操作不可恢复。`)
    if (!ok) {
      return
    }
    const res = await userApi.remove(record.id)
    if (res.code === 200) {
      utils.message('success', '删除成功')
      userTable.fetchList()
    }
  },
})

function formatTime(t) {
  return t ? utils.formatDate(new Date(t), 'YYYY-MM-DD HH:mm') : '-'
}
</script>
