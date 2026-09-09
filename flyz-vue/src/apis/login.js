/**
 * @description 认证接口
 * @author
 * @time
 */
import { pythonHttp } from '@/register/http/index.js'

const Api = {
  Prefix: '/auth',
}

// 登录
export function auth_login(data = {}, config = { withToken: false }) {
  return pythonHttp.request(
    {
      url: Api.Prefix + '/login',
      method: 'POST',
      data,
    },
    config,
  )
}

// 获取当前用户信息
export function auth_me(params = {}, config = {}) {
  return pythonHttp.request(
    {
      url: Api.Prefix + '/me',
      method: 'get',
      params,
    },
    config,
  )
}
