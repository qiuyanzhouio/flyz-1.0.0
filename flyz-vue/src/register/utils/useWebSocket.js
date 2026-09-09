import { useAppStore } from '@/register/stores/app'
import ReconnectingWebSocket from 'reconnecting-websocket'
import Stomp from 'stompjs/lib/stomp.js'
import router from '@/register/router'
import Utils from '@/register/utils'

// 单例状态
let socketInstance = null // 底层连接 (ReconnectingWebSocket)
let stompClient = null // STOMP 包装层
const listeners = new Set()

export function useWebSocket() {
  const appStore = useAppStore()

  /**
   * 初始化连接
   * @param {string} url
   * @param {object} options
   * @param {boolean} options.useStomp 是否使用 STOMP 协议 (默认 true)
   * @param {Array} options.destinations STOMP 订阅列表
   */
  function initWebSocket(url, { useStomp = true, destinations = [], authorization = true, Authorization } = {}) {
    const shouldAuthorization = Authorization ?? authorization

    // 防止重复连接
    if (socketInstance || (useStomp && stompClient?.connected)) {
      return
    }

    // URL 处理
    let wsUrl = url.startsWith('http') || url.startsWith('ws') ? url : `${url}`

    // 如果是 STOMP 且走 SockJS 模式，通常需要转换协议
    if (useStomp) {
      wsUrl = wsUrl.replace('wss://', 'https://').replace('ws://', 'http://')
    }

    // Authorization
    if (shouldAuthorization) {
      const connector = wsUrl.includes('?') ? '&' : '?'
      wsUrl += `${connector}Authorization=${encodeURIComponent(appStore.token)}`
    }

    // 实例化底层连接
    socketInstance = new ReconnectingWebSocket(wsUrl)

    if (useStomp) {
      _initStompMode(socketInstance, destinations)
    } else {
      _initRawMode(socketInstance)
    }
  }

  // --- 模式 A: STOMP 模式 ---
  function _initStompMode(ws, destinations) {
    stompClient = Stomp.over(ws)
    stompClient.debug = null
    stompClient.heartbeat.outgoing = Number(import.meta.env.VITE_WS_HEARTBEAT_OUTGOING)
    stompClient.heartbeat.incoming = Number(import.meta.env.VITE_WS_HEARTBEAT_INCOMING)

    stompClient.connect(
      { login: appStore.token },
      () => {
        console.log('✅ STOMP Connected')
        destinations.forEach(({ topic, key }) => {
          stompClient.subscribe(topic, res => {
            _broadcast(key || topic, res)
          })
        })
      },
      err => _handleError(err),
    )
  }

  // --- 模式 B: 原生模式 ---
  function _initRawMode(ws) {
    ws.onopen = () => console.log('✅ WebSocket Connected (Raw)')
    ws.onmessage = res => {
      // 原生模式没有 topic 概念，默认 key 为 'raw'
      _broadcast('raw', res)
    }
    ws.onerror = err => _handleError(err)
  }

  /**
   * 发送消息 (兼容两种模式)
   */
  function sendWsMsg(destination, body = {}) {
    const payload = typeof body === 'string' ? body : JSON.stringify(body)

    if (stompClient?.connected) {
      // STOMP 模式：需要 destination (如 /app/send)
      stompClient.send(destination, {}, payload)
    } else if (socketInstance?.readyState === WebSocket.OPEN) {
      // 原生模式：destination 参数会被忽略，直接发送 payload
      socketInstance.send(payload)
    } else {
      console.warn('[WebSocket] 未连接或连接已断开')
    }
  }

  // 通用内部逻辑
  function _broadcast(type, data) {
    listeners.forEach(cb => cb(type, data))
  }

  function _handleError(err) {
    console.error('[WebSocket] Error:', err)
    if (err?.headers?.message?.includes('expired') || err?.status === 401) {
      Utils.message('error', '登录失效')
      appStore.logout()
      router.push('/login')
    }
  }

  function onWebSocket(callback) {
    listeners.add(callback)
  }

  function offWebSocket(callback) {
    listeners.delete(callback)
  }

  function closeWebSocket() {
    if (stompClient) {
      stompClient.disconnect()
      stompClient = null
    }
    if (socketInstance) {
      socketInstance.close()
      socketInstance = null
    }
    listeners.clear()
    console.log('关闭WebSocket')
  }

  return {
    initWebSocket,
    sendWsMsg,
    onWebSocket,
    offWebSocket,
    closeWebSocket,
    isConnected: () => (
      stompClient ? !!stompClient.connected : socketInstance?.readyState === WebSocket.OPEN
    ),
  }
}
