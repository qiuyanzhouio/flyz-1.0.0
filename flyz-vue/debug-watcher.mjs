// 临时诊断脚本：检查 vite watcher 的 cwd 与 root
import { createServer } from 'vite'

const server = await createServer({ root: process.cwd(), server: { port: 3099 } })
await server.listen()

console.log('=== config.root =', server.config.root)
console.log('=== process.cwd() =', process.cwd())
console.log('=== watcher.options.cwd =', server.watcher?.options?.cwd)

server.watcher.on('change', (file) => {
  console.log('=== [change-event] file =', JSON.stringify(file))
})

console.log('=== diagnostic ready, editing a file now will print change event path')
