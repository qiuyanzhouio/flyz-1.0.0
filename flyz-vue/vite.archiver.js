import fs from 'node:fs'
import path from 'node:path'
import archiver from 'archiver'

/**
 * 获取格式化时间字符串
 * @param {string} format - 时间格式，如 'YYYY-MM-DD hh:mm:ss'
 * @param {boolean} withMs - 是否包含毫秒
 * @returns {string} 格式化时间
 */
function formatTime(format = '', withMs = false) {
  if (!format) {
    return ''
  }

  const t = new Date()
  const pad = (n) => n.toString().padStart(2, '0')

  const replacements = {
    YYYY: t.getFullYear(),
    MM: pad(t.getMonth() + 1),
    DD: pad(t.getDate()),
    hh: pad(t.getHours()),
    mm: pad(t.getMinutes()),
    ss: pad(t.getSeconds()),
  }

  let result = format
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(key, 'g'), value)
  }

  return withMs ? `${result}(${t.getMilliseconds()})` : result
}

/**
 * 删除文件夹及其内容
 * @param {string} dir - 文件夹路径
 */
function removeDir(dir) {
  if (!fs['existsSync'](dir)) {
    return
  }

  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file)
    fs.statSync(fullPath).isDirectory()
      ? removeDir(fullPath)
      : fs['unlinkSync'](fullPath)
  }

  fs['rmdirSync'](dir)
}

/**
 * 创建文件夹（如果不存在）
 * @param {string} dir - 文件夹路径
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

/**
 * 获取文件大小（MB）
 * @param {number} bytes - 字节数
 * @returns {string} 文件大小字符串
 */
function formatFileSize(bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + 'MB'
}

export default function () {
  let startTime
  return {
    name: 'archiverDist',
    apply: 'build',
    buildStart() {
      startTime = Date.now()
      console.log(`📦 开始打包: ${formatTime('hh:mm:ss', true)}`)
    },
    closeBundle() {
      const zipFileName = `dist-${formatTime('YYYYMMDDhhmmss')}.zip`
      const distsDir = './dists'
      const distDir = './dist'

      // 确保输出目录存在
      ensureDir(distsDir)

      const outputPath = path.join(distsDir, zipFileName)
      const output = fs['createWriteStream'](outputPath)
      const archive = archiver('zip', { zlib: { level: 9 } })

      // 设置存档事件处理
      archive.on('warning', (err) => {
        if (err.code !== 'ENOENT') {
          throw err
        }
      })

      archive.on('error', (err) => {
        throw err
      })

      output.on('close', () => {
        const timeDiff = Date.now() - startTime
        const fileSize = formatFileSize(archive.pointer())

        console.log(`✅  结束打包: ${formatTime('hh:mm:ss', true)}`)
        console.log(`⏱️ 打包耗时: ${(timeDiff / 1000).toFixed(2)}s`)
        console.log(`📊 文件大小: ${fileSize}`)
        console.log(`📁 请在 ${distsDir} 目录下查找 ${zipFileName}`)

        // 清理dist目录
        removeDir(distDir)
      })

      // 开始压缩
      archive.pipe(output)
      archive.directory(distDir, false)
      archive.finalize()
    },
  }
}
