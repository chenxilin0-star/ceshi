// 云函数：使用智谱 GLM-4V-Flash 识别支付账单截图（零外部依赖）
const cloud = require('wx-server-sdk')
const https = require('https')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || ''
const ALLOWED_PRODUCTS = ['B-8号档口', 'B-7号档口']
const REQUIRED_MERCHANT = '四川青瑞和餐饮管理有限公司'
const REQUIRED_PLACE = '学府美食城'
const REQUIRED_ACQUIRER = '拉卡拉支付股份有限公司'
const MIN_AMOUNT = 5
const MAX_AMOUNT = 100

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

function cleanText(value) {
  return String(value || '').trim()
}

function normalizeAmount(value) {
  var num = Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.round(Math.abs(num) * 100) / 100
}

function hasAnyRawText(rawText, words) {
  var text = cleanText(rawText)
  for (var i = 0; i < words.length; i++) {
    if (text.indexOf(words[i]) === -1) return false
  }
  return true
}

exports.main = async (event, context) => {
  const { fileID } = event

  if (!fileID || String(fileID).indexOf('/receipts/') === -1) {
    return { code: -1, msg: '请先上传有效账单截图' }
  }
  if (!ZHIPU_API_KEY) {
    return { code: -2, msg: '识别服务未配置，请在云函数环境变量中设置 ZHIPU_API_KEY' }
  }

  try {
    // 1. 获取图片临时链接
    var fileList = await cloud.getTempFileURL({ fileList: [fileID] })
    var imageUrl = fileList.fileList[0].tempFileURL

    // 2. 调用 GLM-4V-Flash 识别。强制识别“账单详情”版式，降低普通小票/PS 图混入概率。
    var prompt = '你是支付账单截图审核器。请严格审核图片是否为微信/支付类“全部账单/账单详情”页面截图，版式需要与以下结构一致：顶部有“全部账单”或账单标题；中间有圆形“收”图标、商户名“学府美食城”、大额负数金额；详情区按左右两列显示“当前状态、支付时间、商品、商户全称、收单机构、支付方式、支付说明、交易单号、商户单号”；底部有横向条形码和数字。\n\n请特别检查是否存在PS/篡改/拼接痕迹：字体不一致、数字边缘异常、金额/交易单号/商户字段对齐异常、局部模糊、遮挡、涂抹、复制粘贴痕迹、截图不完整、不是账单详情页等。只要可疑，tamperSuspicious=true。\n\n必须提取字段：\n1. isBillDetail: 是否为上述账单详情格式\n2. placeName: 顶部商户/地点名，必须是“学府美食城”\n3. amount: 大号负数金额的绝对值，必须精确到2位以内\n4. status: “当前状态”右侧值，必须是“支付成功”\n5. payTime: “支付时间”右侧完整时间，格式类似“2026年5月12日 12:51:15”\n6. product: “商品”右侧值，只接受“B-8号档口”或“B-7号档口”\n7. merchant: “商户全称”右侧值，必须是“四川青瑞和餐饮管理有限公司”\n8. acquirer: “收单机构”右侧值，必须是“拉卡拉支付股份有限公司”\n9. paymentMethod: “支付方式”右侧值\n10. paymentNote: “支付说明”右侧值\n11. transactionId: “交易单号”右侧28位纯数字\n12. merchantOrderText: “商户单号”右侧文字\n13. barcodeNo: 条形码下方数字\n14. tamperSuspicious: 是否疑似PS/篡改/拼接/截图不完整/非原始账单详情页\n15. tamperReason: 可疑原因，没有则为空字符串\n16. rawText: 图片中所有能识别到的文字内容\n\n金额规则：amount 必须在5到100之间，低于5或高于100都不通过。\n\n请严格只返回JSON，不要返回Markdown，不要解释。JSON格式：\n{"isBillDetail":false,"placeName":"","amount":0,"status":"","payTime":"","product":"","merchant":"","acquirer":"","paymentMethod":"","paymentNote":"","transactionId":"","merchantOrderText":"","barcodeNo":"","tamperSuspicious":false,"tamperReason":"","rawText":""}'

    var response = await postJSON('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      model: 'glm-4v-flash',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl } },
          { type: 'text', text: prompt }
        ]
      }],
      temperature: 0,
      max_tokens: 1600
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

    // 4. 验证字段：前端展示 parsed；后端 uploadReceipt 再做二次强校验。
    var parsed = {
      isBillDetail: !!aiResult.isBillDetail,
      placeName: cleanText(aiResult.placeName),
      product: cleanText(aiResult.product),
      status: cleanText(aiResult.status),
      payTime: cleanText(aiResult.payTime),
      transactionId: cleanText(aiResult.transactionId),
      merchant: cleanText(aiResult.merchant),
      acquirer: cleanText(aiResult.acquirer),
      paymentMethod: cleanText(aiResult.paymentMethod),
      paymentNote: cleanText(aiResult.paymentNote),
      merchantOrderText: cleanText(aiResult.merchantOrderText),
      barcodeNo: cleanText(aiResult.barcodeNo),
      hasXuefu: cleanText(aiResult.placeName).indexOf(REQUIRED_PLACE) >= 0 || cleanText(aiResult.rawText).indexOf(REQUIRED_PLACE) >= 0,
      amount: normalizeAmount(aiResult.amount),
      tamperSuspicious: !!aiResult.tamperSuspicious,
      tamperReason: cleanText(aiResult.tamperReason)
    }

    var errors = []
    var rawText = cleanText(aiResult.rawText || content)
    var requiredLabels = ['当前状态', '支付时间', '商品', '商户全称', '收单机构', '支付方式', '支付说明', '交易单号', '商户单号']

    if (!parsed.isBillDetail) {
      errors.push('图片不是完整的账单详情格式')
    }
    if (!hasAnyRawText(rawText, requiredLabels)) {
      errors.push('账单字段不完整，需包含当前状态/支付时间/商品/商户全称/收单机构/支付方式/交易单号等')
    }
    if (parsed.tamperSuspicious) {
      errors.push('图片疑似被修改或不是原始截图：' + (parsed.tamperReason || '存在可疑痕迹'))
    }
    if (!parsed.hasXuefu || parsed.placeName.indexOf(REQUIRED_PLACE) === -1) {
      errors.push('商户名称需为“学府美食城”')
    }
    if (!parsed.amount) {
      errors.push('未识别到消费金额')
    } else if (parsed.amount < MIN_AMOUNT || parsed.amount > MAX_AMOUNT) {
      errors.push('消费金额必须在5-100元之间')
    }
    if (parsed.status !== '支付成功') {
      errors.push('当前状态必须为支付成功（当前：' + (parsed.status || '未识别') + '）')
    }
    if (!/^\d{4}年\d{1,2}月\d{1,2}日\s+\d{1,2}:\d{2}:\d{2}$/.test(parsed.payTime)) {
      errors.push('支付时间格式不正确')
    }
    if (ALLOWED_PRODUCTS.indexOf(parsed.product) === -1) {
      errors.push('商品名称需为 B-8号档口 或 B-7号档口')
    }
    if (parsed.merchant !== REQUIRED_MERCHANT) {
      errors.push('商户全称不匹配')
    }
    if (parsed.acquirer !== REQUIRED_ACQUIRER) {
      errors.push('收单机构不匹配')
    }
    if (!parsed.paymentMethod) {
      errors.push('未识别到支付方式')
    }
    if (!parsed.paymentNote) {
      errors.push('未识别到支付说明')
    }
    if (!/^\d{28}$/.test(parsed.transactionId)) {
      errors.push('交易单号不正确（需为28位数字）')
    }
    if (!parsed.merchantOrderText) {
      errors.push('未识别到商户单号/退款说明')
    }
    if (parsed.barcodeNo && !/^\d{10,32}$/.test(parsed.barcodeNo)) {
      errors.push('条形码编号格式异常')
    }

    parsed.errors = errors
    parsed.valid = errors.length === 0

    return {
      code: 0,
      rawText: rawText,
      parsed: parsed
    }

  } catch (err) {
    console.error('recognizeReceipt error:', err.message || err)
    return { code: -99, msg: '识别失败: ' + (err.message || '未知错误') }
  }
}
