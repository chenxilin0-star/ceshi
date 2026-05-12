/**
 * QR Code 绘制模块（微信小程序）
 * 底层使用 qrcode-generator 库（MIT，作者 Kazuhiko Arase）
 *
 * Usage:
 *   var qrcode = require('../../utils/qrcode.js')
 *   qrcode.drawQRCode(canvasId, text, size, callback)
 */

var qrgen = require('./qrcode-generator.js')

/**
 * 在 Canvas 2D 上绘制二维码
 * @param {string} canvasId  - 选择器，如 '#qrcode-0'
 * @param {string} text      - 要编码的文本（核销码）
 * @param {number} canvasSize - Canvas 逻辑尺寸（px）
 * @param {function} [callback] - callback(error)
 */
function drawQRCode(canvasId, text, canvasSize, callback) {
  // typeNumber=0 让库自动选择版本，纠错级别 L
  var qr = qrgen(0, 'L')
  qr.addData(text)
  qr.make()

  var moduleCount = qr.getModuleCount()
  var margin = 4                    // 4 模块留白
  var totalModules = moduleCount + margin * 2
  var cellSize = canvasSize / totalModules

  var query = wx.createSelectorQuery()
  query.select(canvasId).fields({ node: true, size: true }).exec(function (res) {
    if (!res || !res[0] || !res[0].node) {
      if (callback) callback('Canvas element not found: ' + canvasId)
      return
    }

    var canvas = res[0].node
    var ctx = canvas.getContext('2d')
    var dpr = wx.getWindowInfo().pixelRatio
    canvas.width = canvasSize * dpr
    canvas.height = canvasSize * dpr
    ctx.scale(dpr, dpr)

    // 白色背景
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvasSize, canvasSize)

    // 画黑色模块
    ctx.fillStyle = '#000000'
    for (var row = 0; row < moduleCount; row++) {
      for (var col = 0; col < moduleCount; col++) {
        if (qr.isDark(row, col)) {
          ctx.fillRect(
            (col + margin) * cellSize,
            (row + margin) * cellSize,
            Math.ceil(cellSize),
            Math.ceil(cellSize)
          )
        }
      }
    }

    if (callback) callback(null)
  })
}

module.exports = {
  drawQRCode: drawQRCode
}
