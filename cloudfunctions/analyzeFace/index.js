// 云函数：调用自建 InsightFace 面部分析服务（性别/年龄/脸型/氛围分）
// 架构与 recognizeReceipt（PaddleOCR）完全一致：云存储 fileID → 临时链接 → 自建服务转发
// 说明：原 face-api 服务（8002）因性别年龄不准已下线，现由 xingeji-face-gender（8003）承接
// 环境变量：
//   FACE_API_URL   面部分析服务地址，默认 http://43.156.130.103:8002/v1/genderage
//   FACE_API_TOKEN 面部分析服务鉴权 Token（控制台配置，不要提交到代码）
const cloud = require('wx-server-sdk')
const http = require('http')
const https = require('https')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const FACE_API_URL = process.env.FACE_API_URL || 'http://43.156.130.103:8002/v1/genderage'
const FACE_API_TOKEN = process.env.FACE_API_TOKEN || ''

function postJSON(url, data, headers) {
  return new Promise(function (resolve, reject) {
    var urlObj = new URL(url)
    var body = JSON.stringify(data)
    var transport = urlObj.protocol === 'https:' ? https : http
    var req = transport.request({
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }, headers || {}),
      timeout: 25000
    }, function (res) {
      var chunks = []
      res.on('data', function (chunk) { chunks.push(chunk) })
      res.on('end', function () {
        var raw = Buffer.concat(chunks).toString()
        try { resolve({ statusCode: res.statusCode, data: JSON.parse(raw) }) } catch (e) { resolve({ statusCode: res.statusCode, data: raw }) }
      })
    })
    req.on('error', reject)
    req.on('timeout', function () { req.destroy(); reject(new Error('面部分析服务请求超时')) })
    req.write(body)
    req.end()
  })
}

exports.main = async (event, context) => {
  var fileID = event && event.fileID
  console.info('[face-analysis] request', JSON.stringify({ fileID: fileID || '', requestId: context && context.REQUESTID ? context.REQUESTID : '' }))
  if (!fileID || String(fileID).indexOf('/faces/') === -1) return { code: -1, msg: '请先上传有效照片' }
  if (!FACE_API_TOKEN) return { code: -2, msg: '识别服务未配置，请在云函数环境变量中设置 FACE_API_TOKEN' }

  try {
    var fileList = await cloud.getTempFileURL({ fileList: [fileID] })
    var imageUrl = fileList.fileList[0].tempFileURL
    var response = await postJSON(FACE_API_URL, { imageUrl: imageUrl }, { 'X-FACE-TOKEN': FACE_API_TOKEN })

    if (response.statusCode !== 200) {
      console.error('[face-analysis] face-api-error', response.statusCode, JSON.stringify(response.data).slice(0, 500))
      return { code: -3, msg: '面部分析服务返回错误(' + response.statusCode + ')' }
    }

    var body = response.data
    if (body && body.code === 0) {
      return { code: 0, data: body.data }
    }
    return { code: (body && body.code) || -4, msg: (body && body.message) || '分析失败' }
  } catch (err) {
    console.error('[face-analysis] error', err.message || err)
    return { code: -99, msg: '分析失败: ' + (err.message || '未知错误') }
  } finally {
    // 隐私设计：照片仅用于本次分析，无论成功失败，处理完立即从云存储删除，云端不落库
    try {
      await cloud.deleteFile({ fileList: [fileID] })
      console.info('[face-analysis] photo deleted after analysis', fileID)
    } catch (cleanErr) {
      console.error('[face-analysis] photo cleanup failed:', cleanErr && cleanErr.message, fileID)
    }
  }
}
