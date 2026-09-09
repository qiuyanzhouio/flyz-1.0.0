<template>
  <div class="flyz-page flex">
    <div class="flyz-page-card p-4 mr-4 flex flex-col"
         style="width: 38%; min-width: 420px;">
      <div class="flex items-center justify-between mb-4">
        <div class="text-[15px] font-semibold">
          字典类型
        </div>
        <button type="button" class="flyz-btn" @click="typeDialog.handleVisible(true, 'create')">
          新增类型
        </button>
      </div>

      <div class="flex items-center gap-2 mb-3">
        <Form ref="typeQueryFormRef"
              :form="typeTable.query"
              :form-columns="typeTable.queryColumns"
              class="flex-1 flex gap-2"
              fast-fail></Form>
        <button type="button" class="flyz-btn flyz-btn-primary" @click="typeTable.handleSearch">
          查询
        </button>
        <button type="button" class="flyz-btn flyz-btn-text" @click="typeTable.handleReset">
          重置
        </button>
      </div>

      <div class="flex-1">
        <Table :columns="typeTable.headers"
               :data="typeTable.filteredItems"
               class="h-full"
               border>
          <template #status="{ record }">
            <span class="flyz-chip"
                  :class="`flyz-chip-${dictStore.getDictColor('user_status', record.status)}`">
              {{ dictStore.getDictLabel('user_status', record.status) }}
            </span>
          </template>
          <template #actions="{ record }">
            <div class="flyz-row-actions flex flex-wrap gap-1">
              <button type="button" class="flyz-btn flyz-btn-text" @click="itemTable.selectType(record)">
                详情
              </button>
              <button type="button" class="flyz-btn flyz-btn-text" @click="typeDialog.handleVisible(true, 'edit', record)">
                编辑
              </button>
              <button type="button"
                      class="flyz-btn flyz-btn-text"
                      :class="record.status === 1 ? 'flyz-btn-warning-text' : 'flyz-btn-success-text'"
                      @click="typeTable.handleStatus(record)">
                {{ record.status === 1 ? '停用' : '启用' }}
              </button>
            </div>
          </template>
        </Table>
      </div>
    </div>

    <div class="flyz-page-card p-4 flex-1 flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <div class="text-[15px] font-semibold">
          字典项（{{ itemTable.currentType?.name || '请选择字典类型' }}）
        </div>
        <button type="button"
                class="flyz-btn"
                :disabled="!itemTable.currentType"
                @click="itemDialog.handleVisible(true, 'create')">
          新增字典项
        </button>
      </div>

      <div class="flex-1">
        <Table :columns="itemTable.headers"
               :data="itemTable.filteredItems"
               class="h-full"
               border>
          <template #status="{ record }">
            <span class="flyz-chip"
                  :class="`flyz-chip-${dictStore.getDictColor('user_status', record.status)}`">
              {{ dictStore.getDictLabel('user_status', record.status) }}
            </span>
          </template>
          <template #actions="{ record }">
            <div class="flyz-row-actions flex flex-wrap gap-1">
              <button type="button" class="flyz-btn flyz-btn-text" @click="itemDialog.handleVisible(true, 'edit', record)">
                编辑
              </button>
              <button type="button"
                      class="flyz-btn flyz-btn-text"
                      :class="record.status === 1 ? 'flyz-btn-warning-text' : 'flyz-btn-success-text'"
                      @click="itemTable.handleStatus(record)">
                {{ record.status === 1 ? '停用' : '启用' }}
              </button>
              <button type="button" class="flyz-btn flyz-btn-text flyz-btn-danger-text" @click="itemTable.handleDelete(record)">
                删除
              </button>
            </div>
          </template>
        </Table>
      </div>
    </div>

    <Dialog v-model="typeDialog.visible"
            :title="typeDialog.title[typeDialog.mode]"
            confirm-text="保存"
            @cancel="typeDialog.handleClose()"
            @confirm="typeDialog.handleSubmit()">
      <Form ref="typeDialogFormRef"
            :form="typeDialog.form"
            :form-columns="typeDialog.formColumns"></Form>
    </Dialog>

    <Dialog v-model="itemDialog.visible"
            :title="itemDialog.title[itemDialog.mode]"
            confirm-text="保存"
            @cancel="itemDialog.handleClose()"
            @confirm="itemDialog.handleSubmit()">
      <Form ref="itemDialogFormRef"
            :form="itemDialog.form"
            :form-columns="itemDialog.formColumns"></Form>
    </Dialog>
  </div>
</template>

<script setup>
import Form from '@/components/form.vue'
import Table from '@/components/table.vue'
import Dialog from '@/components/dialog.vue'
import { useDictStore } from '@/register/stores/dict.js'

definePage({
  meta: {
    requiresAuth: true,
    keepAlive: true,
  },
})

const dictStore = useDictStore()
onMounted(() => dictStore.loadDict('user_status'))

const statusOptions = computed(() => dictStore.getDict('user_status').map(i => ({ ...i, value: Number(i.value) })))

const typeQueryFormRef = ref()
const typeDialogFormRef = ref()
const itemDialogFormRef = ref()

const typeTable = reactive({
  query: {},
  queryColumns: [
    { label: '关键词', key: 'keyword', componentsType: 'v-input', class: '!flex-[0_0_180px]' },
    {
      label: '状态',
      key: 'status',
      componentsType: 'v-select',
      itemTitle: 'label',
      itemValue: 'value',
      items: statusOptions,
      class: '!flex-[0_0_130px]',
    },
  ],
  headers: [
    { label: '名称', key: 'name', width: 90 },
    { label: '编码', key: 'code', width: 90 },
    { label: '状态', key: 'status', width: 90 },
    { label: '操作', key: 'actions', width: 180 },
  ],
  items: [
    { id: 1, name: '用户状态', code: 'user_status', status: 1, sort: 1 },
    { id: 2, name: '性别', code: 'gender', status: 1, sort: 2 },
    { id: 3, name: '审核状态', code: 'audit_status', status: 1, sort: 3 },
  ],
  filteredItems: computed(() => typeTable.items.filter(i => {
    const { keyword, status } = typeTable.query || {}
    const hitKeyword = !keyword || [i.name, i.code].some(t => String(t).includes(keyword))
    const hitStatus = status === undefined || (i.status === status)
    return hitKeyword && hitStatus
  })),
  handleSearch() {
    typeQueryFormRef.value?.validate()
  },
  handleReset() {
    this.query = {}
  },
  handleStatus(item) {
    item.status = item.status === 1 ? 0 : 1
  },
})

const itemTable = reactive({
  currentTypeId: 1,
  map: {
    1: [
      { id: 101, typeId: 1, label: '启用', value: '1', sort: 1, status: 1, color: 'success' },
      { id: 102, typeId: 1, label: '停用', value: '0', sort: 2, status: 1, color: 'grey' },
    ],
    2: [
      { id: 201, typeId: 2, label: '男', value: 'M', sort: 1, status: 1 },
      { id: 202, typeId: 2, label: '女', value: 'F', sort: 2, status: 1 },
    ],
    3: [
      { id: 301, typeId: 3, label: '待审核', value: 'pending', sort: 1, status: 1 },
      { id: 302, typeId: 3, label: '通过', value: 'approved', sort: 2, status: 1 },
    ],
  },
  headers: [
    { label: '标签', key: 'label', width: 90 },
    { label: '值', key: 'value', width: 90 },
    { label: '排序', key: 'sort', width: 80 },
    { label: '状态', key: 'status', width: 90 },
    { label: '操作', key: 'actions', width: 160 },
  ],
  currentType: computed(() => typeTable.items.find(i => i.id === itemTable.currentTypeId)),
  filteredItems: computed(() => {
    const list = itemTable.map[itemTable.currentTypeId] || []
    return [...list].sort((a, b) => a.sort - b.sort)
  }),
  selectType(item) {
    this.currentTypeId = item.id
    syncTypeDictCache()
  },
  handleStatus(item) {
    item.status = item.status === 1 ? 0 : 1
    syncTypeDictCache()
  },
  handleDelete(item) {
    const list = this.map[this.currentTypeId] || []
    this.map[this.currentTypeId] = list.filter(i => i.id !== item.id)
    syncTypeDictCache()
  },
})

const typeDialog = reactive({
  visible: false,
  mode: 'create',
  title: { create: '新增字典类型', edit: '编辑字典类型' },
  form: {},
  formColumns: [
    { label: '字典名称', key: 'name', componentsType: 'v-input', class: 'w-[calc(50%-8px)]' },
    { label: '字典编码', key: 'code', componentsType: 'v-input', class: 'w-[calc(50%-8px)]' },
    {
      label: '状态',
      key: 'status',
      componentsType: 'v-select',
      itemTitle: 'label',
      itemValue: 'value',
      items: statusOptions,
      class: 'w-[calc(50%-8px)]',
    },
    { label: '排序', key: 'sort', componentsType: 'v-number-input', class: 'w-[calc(50%-8px)]' },
  ],
  handleVisible(status, mode, item = {}) {
    this.visible = status
    this.mode = mode
    this.form = { id: null, name: '', code: '', status: 1, sort: typeTable.items.length + 1, ...item }
  },
  handleSubmit() {
    typeDialogFormRef.value?.validate()
    const payload = { ...this.form }
    if (!payload.name || !payload.code) {
      return
    }

    if (this.mode === 'create') {
      const maxId = typeTable.items.reduce((m, c) => Math.max(m, c.id), 0)
      const row = { ...payload, id: maxId + 1 }
      typeTable.items.push(row)
      itemTable.map[row.id] = []
      itemTable.currentTypeId = row.id
    } else {
      typeTable.items = typeTable.items.map(i => i.id === payload.id ? { ...i, ...payload } : i)
    }

    syncTypeDictCache()
    this.visible = false
  },
  handleClose() {
    this.visible = false
    this.form = {}
  },
})

const itemDialog = reactive({
  visible: false,
  mode: 'create',
  title: { create: '新增字典项', edit: '编辑字典项' },
  form: {},
  formColumns: [
    { label: '标签', key: 'label', componentsType: 'v-input', class: 'w-[calc(50%-8px)]' },
    { label: '值', key: 'value', componentsType: 'v-input', class: 'w-[calc(50%-8px)]' },
    {
      label: '状态',
      key: 'status',
      componentsType: 'v-select',
      itemTitle: 'label',
      itemValue: 'value',
      items: statusOptions,
      class: 'w-[calc(50%-8px)]',
    },
    { label: '排序', key: 'sort', componentsType: 'v-number-input', class: 'w-[calc(50%-8px)]' },
  ],
  handleVisible(status, mode, item = {}) {
    this.visible = status
    this.mode = mode
    const list = itemTable.map[itemTable.currentTypeId] || []
    this.form = {
      id: null,
      typeId: itemTable.currentTypeId,
      label: '',
      value: '',
      status: 1,
      sort: list.length + 1, ...item,
    }
  },
  handleSubmit() {
    itemDialogFormRef.value?.validate()
    const payload = { ...this.form, typeId: itemTable.currentTypeId }
    if (!payload.label || !payload.value) {
      return
    }
    const list = itemTable.map[itemTable.currentTypeId] || []

    if (this.mode === 'create') {
      const allIds = Object.values(itemTable.map).flat().map(i => i.id)
      const maxId = allIds.length ? Math.max(...allIds) : 0
      list.push({ ...payload, id: maxId + 1 })
      itemTable.map[itemTable.currentTypeId] = list
    } else {
      itemTable.map[itemTable.currentTypeId] = list.map(i => i.id === payload.id ? { ...i, ...payload } : i)
    }

    syncTypeDictCache()
    this.visible = false
  },
  handleClose() {
    this.visible = false
    this.form = {}
  },
})

function syncTypeDictCache() {
  const currentType = typeTable.items.find(i => i.id === itemTable.currentTypeId)
  if (!currentType?.code) {
    return
  }
  const list = (itemTable.map[itemTable.currentTypeId] || []).map(i => ({
    label: i.label,
    value: i.value,
    sort: i.sort,
    status: i.status,
    color: i.color,
  }))
  dictStore.setDict(currentType.code, list)
}
</script>
