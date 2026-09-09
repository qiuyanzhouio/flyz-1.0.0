<template>
  <div class="h-full flex flex-col p-2">
    <div class="flyz-toolbar">
      <Form ref="queryFormRef"
            :form="listConfig.query"
            :form-columns="listConfig.queryColumns"
            class="flex-1 flex flex-wrap gap-2"
            label-direction="inset"></Form>
      <div class="flyz-toolbar-actions flex items-center">
        <button type="button" class="flyz-btn" @click="listConfig.handleSearch">
          查询
        </button>
        <button type="button" class="flyz-btn flyz-btn-text" @click="listConfig.handleReset">
          重置
        </button>
      </div>
    </div>

    <Table :columns="listConfig.headers"
           :data="listConfig.items"
           class="flex-1"
           border>
      <template #method="{ record }">
        <span class="flyz-chip"
              :class="`flyz-chip-${listConfig.methodColor[record.method] || 'default'}`">
          {{ record.method }}
        </span>
      </template>
      <template #status="{ record }">
        <span class="flyz-chip"
              :class="`flyz-chip-${record.status === 1 ? 'success' : 'danger'}`">
          {{ record.status === 1 ? '成功' : '失败' }}
        </span>
      </template>
      <template #cost_ms="{ record }">
        <span :class="record.cost_ms > 1000 ? 'text-danger' : 'text-ink-200'">
          {{ record.cost_ms }} ms
        </span>
      </template>
      <template #created_at="{ record }">
        <span class="flyz-text-muted text-xs">{{ formatTime(record.created_at) }}</span>
      </template>
      <template #actions="{ record }">
        <button type="button" class="flyz-btn flyz-btn-text" @click="detailDialog.open(record)">
          详情
        </button>
      </template>
    </Table>

    <Pagination v-model:page="listConfig.page"
                v-model:page-size="listConfig.pageSize"
                :total="listConfig.total"
                @change="listConfig.fetchList()"></Pagination>

    <!-- 详情弹窗 -->
    <Dialog v-model="detailDialog.visible"
            title="操作日志详情"
            :max-width="720"
            @cancel="detailDialog.visible = false">
      <template #actions>
        <button type="button" class="flyz-btn flyz-btn-primary" @click="detailDialog.visible = false">
          关闭
        </button>
      </template>
      <div v-if="detailDialog.data" class="space-y-3 text-sm">
        <div class="grid grid-cols-2 gap-x-4 gap-y-2">
          <div><span class="text-ink-400">日志ID：</span>{{ detailDialog.data.id }}</div>
          <div><span class="text-ink-400">操作用户：</span>{{ detailDialog.data.username || '-' }}（ID: {{ detailDialog.data.user_id ?? '-' }}）</div>
          <div><span class="text-ink-400">业务模块：</span>{{ detailDialog.data.module || '-' }}</div>
          <div><span class="text-ink-400">操作类型：</span>{{ detailDialog.data.action || '-' }}</div>
          <div>
            <span class="text-ink-400">请求方法：</span>
            <span class="flyz-chip"
                  :class="`flyz-chip-${listConfig.methodColor[detailDialog.data.method] || 'default'}`">{{ detailDialog.data.method }}</span>
          </div>
          <div>
            <span class="text-ink-400">状态：</span>
            <span class="flyz-chip"
                  :class="`flyz-chip-${detailDialog.data.status === 1 ? 'success' : 'danger'}`">
              {{ detailDialog.data.status === 1 ? '成功' : '失败' }}
            </span>
          </div>
          <div class="col-span-2">
            <span class="text-ink-400">请求路径：</span>{{ detailDialog.data.path }}
          </div>
          <div><span class="text-ink-400">客户端IP：</span>{{ detailDialog.data.ip || '-' }}</div>
          <div><span class="text-ink-400">耗时：</span>{{ detailDialog.data.cost_ms }} ms</div>
          <div class="col-span-2">
            <span class="text-ink-400">创建时间：</span>{{ formatTime(detailDialog.data.created_at) }}
          </div>
        </div>

        <div>
          <div class="text-ink-400 mb-1">
            请求参数
          </div>
          <pre class="flyz-code-block">{{ pretty(detailDialog.data.params) }}</pre>
        </div>
        <div>
          <div class="text-ink-400 mb-1">
            响应结果
          </div>
          <pre class="flyz-code-block">{{ pretty(detailDialog.data.result) }}</pre>
        </div>
        <div>
          <div class="text-ink-400 mb-1">
            User-Agent
          </div>
          <pre class="flyz-code-block">{{ detailDialog.data.user_agent || '-' }}</pre>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import Form from '@/components/form.vue'
import Table from '@/components/table.vue'
import Dialog from '@/components/dialog.vue'
import Pagination from '@/components/pagination.vue'
import utils from '@/register/utils'
import { logApi } from '@/apis/system.js'

definePage({ meta: { requiresAuth: true, keepAlive: true } })

const queryFormRef = ref()

const statusOptions = [
  { label: '成功', value: 1 },
  { label: '失败', value: 0 },
]

const listConfig = reactive({
  query: { keyword: '', module: '', status: null, start_time: '', end_time: '' },
  queryColumns: [
    { label: '关键词', key: 'keyword', componentsType: 'v-input', placeholder: '用户名/模块/路径', class: '!flex-[0_0_200px]' },
    { label: '模块', key: 'module', componentsType: 'v-input', placeholder: '业务模块', class: '!flex-[0_0_150px]' },
    {
      label: '状态', key: 'status', componentsType: 'v-select',
      itemTitle: 'label', itemValue: 'value', items: statusOptions,
      clearable: true, class: '!flex-[0_0_120px]',
    },
    { label: '开始日期', key: 'start_time', componentsType: 'v-input', type: 'date', class: '!flex-[0_0_160px]' },
    { label: '结束日期', key: 'end_time', componentsType: 'v-input', type: 'date', class: '!flex-[0_0_160px]' },
  ],
  headers: [
    { label: 'ID', key: 'id', width: 70 },
    { label: '用户名', key: 'username', width: 120 },
    { label: '模块', key: 'module', width: 120 },
    { label: '操作', key: 'action', width: 100 },
    { label: '方法', key: 'method', width: 90 },
    { label: '路径', key: 'path' },
    { label: '状态', key: 'status', width: 80 },
    { label: 'IP', key: 'ip', width: 130 },
    { label: '耗时', key: 'cost_ms', width: 100 },
    { label: '时间', key: 'created_at', width: 160 },
    { label: '操作', key: 'actions', width: 80 },
  ],
  methodColor: { GET: 'info', POST: 'success', PUT: 'warning', DELETE: 'danger' },
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
  committedQuery: {},
  async fetchList() {
    const params = {
      page: this.page,
      page_size: this.pageSize,
      ...this.committedQuery,
    }
    const res = await logApi.list(params)
    if (res.code === 200) {
      this.items = res.data?.items || []
      this.total = res.data?.total || 0
    }
  },
  buildParams() {
    const p = {}
    if (this.query.keyword?.trim()) {
      p.keyword = this.query.keyword.trim()
    }
    if (this.query.module?.trim()) {
      p.module = this.query.module.trim()
    }
    if (this.query.status !== null && this.query.status !== undefined && this.query.status !== '') {
      p.status = this.query.status
    }
    if (this.query.start_time) {
      p.start_time = `${this.query.start_time}T00:00:00`
    }
    if (this.query.end_time) {
      p.end_time = `${this.query.end_time}T23:59:59`
    }
    return p
  },
  handleSearch() {
    this.page = 1
    this.committedQuery = this.buildParams()
    this.fetchList()
  },
  handleReset() {
    this.query.keyword = ''
    this.query.module = ''
    this.query.status = null
    this.query.start_time = ''
    this.query.end_time = ''
    this.committedQuery = {}
    this.page = 1
    this.fetchList()
  },
})
listConfig.fetchList()

const detailDialog = reactive({
  visible: false,
  data: null,
  async open(record) {
    this.visible = true
    this.data = null
    const res = await logApi.get(record.id)
    if (res.code === 200) {
      this.data = res.data
    }
  },
})

function formatTime(t) {
  return t ? utils.formatDate(new Date(t), 'YYYY-MM-DD HH:mm:ss') : '-'
}

function pretty(str) {
  if (!str) {
    return '-'
  }
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}
</script>

<style scoped>
.flyz-code-block {
  @apply bg-black/30 text-ink-200 rounded p-2 text-xs overflow-auto max-h-48 whitespace-pre-wrap break-all;
}
</style>
