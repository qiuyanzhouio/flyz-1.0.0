/**
 * @description 系统管理接口（用户/角色/部门/菜单/权限/日志）
 * 后端统一前缀 /api/v1，前端通过 pythonHttp(/papi) 代理转发
 */
import { pythonHttp } from '@/register/http/index.js'

/**
 * 通用 CRUD 接口工厂
 * @param {string} prefix 资源路径前缀，如 '/users'
 * @param {{ readonly?: boolean }} [options] readonly: true 时仅暴露 list / get（只读资源）
 * @returns {{ list: Function, get: Function, create?: Function, update?: Function, remove?: Function }}
 */
function createCrudApi(prefix, { readonly = false } = {}) {
  // 只读部分：查询类接口
  const readOnlyApi = {
    // 分页列表：params 含 page / page_size 及业务筛选字段
    list(params = {}) {
      return pythonHttp.request({ url: prefix, method: 'get', params })
    },
    // 详情
    get(id) {
      return pythonHttp.request({ url: `${prefix}/${id}`, method: 'get' })
    },
  }

  // 只读模式：不暴露写操作
  if (readonly) {
    return readOnlyApi
  }

  return {
    ...readOnlyApi,
    // 新建
    create(data = {}) {
      return pythonHttp.request({ url: prefix, method: 'post', data })
    },
    // 更新（整体提交，后端按传入字段更新）
    update(id, data = {}) {
      return pythonHttp.request({ url: `${prefix}/${id}`, method: 'put', data })
    },
    // 删除（软删除）
    remove(id) {
      return pythonHttp.request({ url: `${prefix}/${id}`, method: 'delete' })
    },
  }
}

// ============================ 用户 ============================
export const userApi = createCrudApi('/users')

// ============================ 角色 ============================
export const roleApi = createCrudApi('/roles')

// ============================ 部门 ============================
export const deptApi = createCrudApi('/depts')

// ============================ 权限 ============================
export const permissionApi = createCrudApi('/permissions')

// ============================ 菜单 ============================
export const menuApi = {
  ...createCrudApi('/menus'),
  // 获取当前登录用户的菜单树（基于角色权限）
  myTree() {
    return pythonHttp.request({ url: '/menus/tree', method: 'get' })
  },
}

// ============================ 操作日志（只读模式，仅 list / get） ============================
export const logApi = createCrudApi('/logs', { readonly: true })
