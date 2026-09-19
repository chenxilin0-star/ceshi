// 云函数：调用自建 PaddleOCR 识别微信支付账单截图（不调用付费视觉模型）
const cloud = require('wx-server-sdk')
const http = require('http')
const https = require('https')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const PADDLE_OCR_URL = process.env.PADDLE_OCR_URL || 'http://43.156.130.103:8001/v1/ocr'
const PADDLE_OCR_TOKEN = process.env.PADDLE_OCR_TOKEN || ''
const ALLOWED_PRODUCTS = ['B-8号档口', 'B-7号档口']
const REQUIRED_MERCHANT = '四川青瑞和餐饮管理有限公司'
const REQUIRED_PLACE = '学府美食城'
const REQUIRED_ACQUIRER = '拉卡拉支付股份有限公司'
const MIN_AMOUNT = 5
const MAX_AMOUNT = 100

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
      timeout: 55000
    }, function (res) {
      var chunks = []
      res.on('data', function (chunk) { chunks.push(chunk) })
      res.on('end', function () {
        var raw = Buffer.concat(chunks).toString()
        try { resolve({ statusCode: res.statusCode, data: JSON.parse(raw) }) } catch (e) { resolve({ statusCode: res.statusCode, data: raw }) }
      })
    })
    req.on('error', reject)
    req.on('timeout', function () { req.destroy(); reject(new Error('OCR 服务请求超时')) })
    req.write(body)
    req.end()
  })
}

function cleanText(value) { return String(value || '').trim() }
function normalizeAmount(value) {
  var num = Number(value)
  return Number.isFinite(num) ? Math.round(Math.abs(num) * 100) / 100 : 0
}
function hasAnyRawText(rawText, words) {
  var text = cleanText(rawText)
  for (var i = 0; i < words.length; i++) if (text.indexOf(words[i]) === -1) return false
  return true
}
function findLabelValue(lines, label) {
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i]
    if (line === label && lines[i + 1]) return lines[i + 1]
    if (line.indexOf(label) === 0) {
      var inline = cleanText(line.slice(label.length)).replace(/^[:：]/, '')
      if (inline) return inline
    }
  }
  return ''
}
function normalizeProduct(value) {
  var match = cleanText(value).match(/B\s*[-－—]?\s*([78])\s*号\s*档口/i)
  return match ? 'B-' + match[1] + '号档口' : cleanText(value)
}
function extractReceiptFields(ocrData) {
  var lines = cleanText(ocrData && ocrData.rawText).split(/\n+/).map(cleanText).filter(Boolean)
  var rawText = lines.join('\n')
  var transactionId = ''
  var barcodeNo = ''
  for (var numberIndex = 0; numberIndex < lines.length; numberIndex++) {
    var digits = lines[numberIndex].replace(/[^\d]/g, '')
    if (!transactionId && /^\d{27,29}$/.test(digits)) transactionId = digits
    if (/^\d{16}$/.test(digits)) barcodeNo = digits
  }
  if (!barcodeNo) {
    for (var fallbackIndex = lines.length - 1; fallbackIndex >= 0; fallbackIndex--) {
      var fallbackDigits = lines[fallbackIndex].replace(/[^\d]/g, '')
      if (/^\d{15,17}$/.test(fallbackDigits)) { barcodeNo = fallbackDigits; break }
    }
  }
  var amount = 0
  for (var i = 0; i < lines.length; i++) {
    var amountMatch = lines[i].match(/^\s*[-−]\s*[¥￥]?\s*(\d+(?:\.\d{1,2})?)\s*$/)
    if (amountMatch) { amount = normalizeAmount(amountMatch[1]); break }
  }
  var labels = ['当前状态', '支付时间', '商品', '商户全称', '收单机构', '支付方式', '交易单号', '商户单号']
  return {
    rawText: rawText,
    isBillDetail: hasAnyRawText(rawText, labels),
    placeName: rawText.indexOf(REQUIRED_PLACE) >= 0 ? REQUIRED_PLACE : '',
    amount: amount,
    status: findLabelValue(lines, '当前状态'),
    payTime: findLabelValue(lines, '支付时间').replace(/(\d{1,2}日)(\d{1,2}:)/, '$1 $2'),
    product: normalizeProduct(findLabelValue(lines, '商品')),
    merchant: findLabelValue(lines, '商户全称'),
    acquirer: findLabelValue(lines, '收单机构'),
    paymentMethod: findLabelValue(lines, '支付方式'),
    paymentNote: findLabelValue(lines, '支付说明'),
    transactionId: transactionId,
    merchantOrderText: findLabelValue(lines, '商户单号'),
    barcodeNo: barcodeNo,
    tamperSuspicious: false,
    tamperReason: ''
  }
}

exports.main = async (event, context) => {
  var fileID = event.fileID
  console.info('[receipt-recognition] request', JSON.stringify({ fileID: fileID || '', requestId: context && context.REQUESTID ? context.REQUESTID : '' }))
  if (!fileID || String(fileID).indexOf('/receipts/') === -1) return { code: -1, msg: '请先上传有效账单截图' }
  if (!PADDLE_OCR_TOKEN) return { code: -2, msg: '识别服务未配置，请在云函数环境变量中设置 PADDLE_OCR_TOKEN' }

  try {
    var fileList = await cloud.getTempFileURL({ fileList: [fileID] })
    var imageUrl = fileList.fileList[0].tempFileURL
    var response = await postJSON(PADDLE_OCR_URL, { imageUrl: imageUrl }, { 'X-OCR-Token': PADDLE_OCR_TOKEN })
    if (response.statusCode !== 200) {
      console.error('[receipt-recognition] paddle-error', response.statusCode, JSON.stringify(response.data).slice(0, 500))
      return { code: -2, msg: 'OCR服务返回错误(' + response.statusCode + ')' }
    }

    var aiResult = extractReceiptFields(response.data)
    var rawText = aiResult.rawText
    var parsed = {
      isBillDetail: !!aiResult.isBillDetail,
      placeName: cleanText(aiResult.placeName),
      product: cleanText(aiResult.product),
      status: cleanText(aiResult.status),
      payTime: cleanText(aiResult.payTime),
      transactionId: cleanText(aiResult.transactionId).replace(/[^\d]/g, ''),
      merchant: cleanText(aiResult.merchant),
      acquirer: cleanText(aiResult.acquirer),
      paymentMethod: cleanText(aiResult.paymentMethod),
      paymentNote: cleanText(aiResult.paymentNote),
      merchantOrderText: cleanText(aiResult.merchantOrderText),
      barcodeNo: cleanText(aiResult.barcodeNo).replace(/[^\d]/g, ''),
      hasXuefu: rawText.indexOf(REQUIRED_PLACE) >= 0,
      amount: normalizeAmount(aiResult.amount),
      tamperSuspicious: !!aiResult.tamperSuspicious,
      tamperReason: cleanText(aiResult.tamperReason)
    }

    var errors = []
    var requiredLabels = ['当前状态', '支付时间', '商品', '商户全称', '收单机构', '支付方式', '交易单号', '商户单号']
    if (!parsed.isBillDetail || !hasAnyRawText(rawText, requiredLabels)) errors.push('账单字段不完整，需包含当前状态/支付时间/商品/商户全称/收单机构/支付方式/交易单号等')
    if (!parsed.hasXuefu || parsed.placeName !== REQUIRED_PLACE) errors.push('商户名称需为"学府美食城"')
    if (!parsed.amount) errors.push('未识别到消费金额')
    else if (parsed.amount < MIN_AMOUNT || parsed.amount > MAX_AMOUNT) errors.push('消费金额必须在5-100元之间')
    if (parsed.status !== '支付成功') errors.push('当前状态必须为支付成功（当前：' + (parsed.status || '未识别') + '）')
    if (!/^\d{4}年\d{1,2}月\d{1,2}日\s+\d{1,2}:\d{2}:\d{2}$/.test(parsed.payTime)) errors.push('支付时间格式不正确')
    else {
      var timeMatch = parsed.payTime.match(/^(\d{4})年(\d{1,2})月/)
      if (timeMatch && (parseInt(timeMatch[1], 10) < 2026 || (parseInt(timeMatch[1], 10) === 2026 && parseInt(timeMatch[2], 10) < 5))) errors.push('仅支持2026年5月之后的消费记录')
    }
    if (ALLOWED_PRODUCTS.indexOf(parsed.product) === -1) errors.push('商品名称需为 B-8号档口 或 B-7号档口')
    if (parsed.merchant !== REQUIRED_MERCHANT) errors.push('商户全称不匹配')
    if (parsed.acquirer !== REQUIRED_ACQUIRER) errors.push('收单机构不匹配')
    if (!parsed.paymentMethod) errors.push('未识别到支付方式')
    if (!parsed.merchantOrderText) errors.push('未识别到商户单号/退款说明')
    if (!/^\d{27,29}$/.test(parsed.transactionId)) errors.push('交易单号格式异常（需为27-29位数字）')
    if (!/^\d{16}$/.test(parsed.barcodeNo) && !/^\d{15,17}$/.test(parsed.barcodeNo)) errors.push('条形码编号格式异常（需为16位数字）')

    parsed.errors = errors
    parsed.valid = errors.length === 0
    console.info('[receipt-recognition] validation', JSON.stringify({ valid: parsed.valid, errors: errors, transactionId: parsed.transactionId, barcodeNo: parsed.barcodeNo, product: parsed.product, amount: parsed.amount, rawText: rawText.slice(0, 4000) }))
    return { code: 0, rawText: rawText, parsed: parsed }
  } catch (err) {
    console.error('[receipt-recognition] error', err.message || err)
    return { code: -99, msg: '识别失败: ' + (err.message || '未知错误') }
  }
}
