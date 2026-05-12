/**
 * 日期格式化
 */
function formatDate(date) {
  if (typeof date === 'string') {
    date = new Date(date)
  }
  var year = date.getFullYear()
  var month = (date.getMonth() + 1).toString().padStart(2, '0')
  var day = date.getDate().toString().padStart(2, '0')
  return year + '-' + month + '-' + day
}

/**
 * 格式化显示日期（简短 MM-DD）
 */
function formatDateShort(dateStr) {
  if (!dateStr) return ''
  var parts = dateStr.split('-')
  if (parts.length === 3) {
    return parts[1] + '-' + parts[2]
  }
  return dateStr
}

/**
 * 金额格式化
 */
function formatAmount(amount) {
  return parseFloat(amount).toFixed(2)
}

/**
 * 生成随机码
 * @param {number} len 长度
 * @returns {string} 大写字母数字组合
 */
function generateCode(len) {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  var result = ''
  for (var i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 生成推荐码（6位）
 */
function generateReferralCode() {
  return generateCode(6)
}

/**
 * 生成核销码（8位）
 */
function generateVerifyCode() {
  return generateCode(8)
}

/**
 * 云函数调用封装
 */
function callFunction(name, data) {
  return wx.cloud.callFunction({
    name: name,
    data: data || {}
  }).then(function (res) {
    return res.result
  })
}

/**
 * ISO 时间转显示时间
 */
function formatTime(isoStr) {
  if (!isoStr) return ''
  var date = new Date(isoStr)
  var month = (date.getMonth() + 1).toString().padStart(2, '0')
  var day = date.getDate().toString().padStart(2, '0')
  var hour = date.getHours().toString().padStart(2, '0')
  var min = date.getMinutes().toString().padStart(2, '0')
  return month + '-' + day + ' ' + hour + ':' + min
}

/**
 * 分享给朋友（带分销 referrerId）
 * @param {string} title 分享标题
 * @param {string} path 分享路径（如 '/pages/index/index'）
 */
function shareToFriend(title, path) {
  var user = getApp().globalData.userInfo
  var sharePath = path || '/pages/index/index'
  if (user && user._id) {
    sharePath += (sharePath.indexOf('?') >= 0 ? '&' : '?') + 'referrerId=' + user._id
  }
  return { title: title, path: sharePath }
}

/**
 * 分享到朋友圈（带分销 referrerId）
 * @param {string} title 分享标题
 */
function shareToTimeline(title) {
  var user = getApp().globalData.userInfo
  return {
    title: title,
    query: user && user._id ? 'referrerId=' + user._id : ''
  }
}

module.exports = {
  formatDate: formatDate,
  formatDateShort: formatDateShort,
  formatAmount: formatAmount,
  generateCode: generateCode,
  generateReferralCode: generateReferralCode,
  generateVerifyCode: generateVerifyCode,
  callFunction: callFunction,
  formatTime: formatTime,
  shareToFriend: shareToFriend,
  shareToTimeline: shareToTimeline
}
