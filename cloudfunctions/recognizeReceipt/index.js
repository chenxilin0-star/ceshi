// 云函数：使用智谱 GLM-4V-Flash 识别小票（零外部依赖）
const cloud = require('wx-server-sdk')
const https = require('https')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || ''

function postJSON(url, data) {
  return new Promise(function (resolve, reject) {
    var urlObj = new URL(url)
    var body = JSON.stringify(data)
    var req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + ZHIPU_API_KEY,
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 30000
    }, function (res) {
      var chunks = []
      res.on('data', function (chunk) { chunks.push(chunk) })
      res.on('end', function () {
        var raw = Buffer.concat(chunks).toString()
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(raw) })
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: raw })
        }
      })
    })
    req.on('error', reject)
    req.on('timeout', function () {
      req.destroy()
      reject(new Error('请求超时'))
    })
    req.write(body)
    req.end()
  })
}

exports.main = async (event, context) => {
  const { fileID } = event

  if (!fileID || String(fileID).indexOf('/receipts/') === -1) {
    return { code: -1, msg: '请先上传有效小票' }
  }
  if (!ZHIPU_API_KEY) {
    return { code: -2, msg: '识别服务未配置，请在云函数环境变量中设置 ZHIPU_API_KEY' }
  }

  try {
    // 1. 获取图片临时链接
    var fileList = await cloud.getTempFileURL({ fileList: [fileID] })
    var imageUrl = fileList.fileList[0].tempFileURL

    // 2. 调用 GLM-4V-Flash 识别
    var prompt = '请仔细识别这张支付凭证/小票图片，提取以下字段信息。\n\n需要提取的字段：\n1. product: 商品名称，只接受 "B-8号档口" 或 "B-7号档口"，如果不是这两个值则为空字符串\n2. status: 支付状态，查找"当前状态"对应的值\n3. transactionId: 交易单号，是一个28位纯数字\n4. merchant: 商户全称\n5. hasXuefu: 图片中是否包含"学府美食城"字样，布尔值\n6. amount: 消费金额，找出负数金额取其绝对值（即实际消费了多少钱）\n7. rawText: 图片中所有能识别到的文字内容\n\n请严格按以下JSON格式返回，不要返回任何其他内容：\n{"product":"","status":"","transactionId":"","merchant":"","hasXuefu":false,"amount":0,"rawText":""}'

    var response = await postJSON('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      model: 'glm-4v-flash',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl } },
          { type: 'text', text: prompt }
        ]
      }],
      temperature: 0.1,
      max_tokens: 1024
    })

    if (response.statusCode !== 200) {
      var errMsg = 'AI接口返回错误(' + response.statusCode + ')'
      if (response.data && response.data.error) {
        errMsg += ': ' + (response.data.error.message || JSON.stringify(response.data.error))
      }
      return { code: -2, msg: errMsg }
    }

    // 3. 解析模型返回
    var content = ''
    if (response.data && response.data.choices && response.data.choices[0]) {
      content = response.data.choices[0].message.content
    }

    if (!content) {
      return { code: -2, msg: 'AI未返回识别结果' }
    }

    // 提取JSON
    var jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { code: -3, msg: 'AI返回格式异常', rawContent: content }
    }

    var aiResult
    try {
      aiResult = JSON.parse(jsonMatch[0])
    } catch (e) {
      return { code: -3, msg: 'AI返回格式异常', rawContent: content }
    }

    // 4. 验证字段
    var parsed = {
      product: aiResult.product || '',
      status: aiResult.status || '',
      transactionId: String(aiResult.transactionId || ''),
      merchant: aiResult.merchant || '',
      hasXuefu: !!aiResult.hasXuefu,
      amount: parseFloat(aiResult.amount) || 0
    }

    var errors = []
    if (!parsed.product) {
      errors.push('未识别到商品名称（需为 B-8号档口 或 B-7号档口）')
    } else if (parsed.product !== 'B-8号档口' && parsed.product !== 'B-7号档口') {
      errors.push('商品名称不匹配：' + parsed.product + '（需为 B-8号档口 或 B-7号档口）')
    }
    if (parsed.status !== '支付成功') {
      errors.push('状态不是支付成功（当前：' + (parsed.status || '未识别') + '）')
    }
    if (!parsed.transactionId || !/^\d{28}$/.test(parsed.transactionId)) {
      errors.push('交易单号不正确（需为28位数字）')
    }
    if (parsed.merchant.indexOf('四川青瑞和餐饮管理有限公司') === -1) {
      errors.push('商户全称不匹配（当前：' + (parsed.merchant || '未识别') + '）')
    }
    if (!parsed.hasXuefu) {
      errors.push('未包含"学府美食城"字样')
    }
    if (parsed.amount <= 0) {
      errors.push('未识别到消费金额')
    }

    parsed.errors = errors
    parsed.valid = errors.length === 0

    return {
      code: 0,
      rawText: aiResult.rawText || content,
      parsed: parsed
    }

  } catch (err) {
    console.error('recognizeReceipt error:', err.message || err)
    return { code: -99, msg: '识别失败: ' + (err.message || '未知错误') }
  }
}
