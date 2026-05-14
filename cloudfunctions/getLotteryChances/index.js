const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

function calculateRemainChances(records, shareEarned) {
  records = records || []
  if (shareEarned < 0) shareEarned = 0
  if (shareEarned > 2) shareEarned = 2
  var freeUsed = records.filter(function (r) { return r.source === 'free' }).length
  var shareUsed = records.filter(function (r) { return r.source === 'share' }).length
  var retryUsed = records.filter(function (r) { return r.source === 'retry' }).length
  var hasRetry = records.some(function (r) { return r.prizeType === 'retry' && r.source !== 'retry' })
  return {
    free: freeUsed >= 1 ? 0 : 1,
    share: Math.max(0, shareEarned - shareUsed),
    retry: (hasRetry && retryUsed === 0) ? 1 : 0
  }
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  var today = new Date()
  var todayStr = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0')
  var dayStart = new Date(todayStr + 'T00:00:00+08:00')

  try { await db.createCollection('lotteryRecords') } catch (e) {}
  try { await db.createCollection('lotteryShareChances') } catch (e) {}

  var records = []
  var shareEarned = 0
  try {
    var todayRecords = await db.collection('lotteryRecords').where({
      _openid: OPENID,
      createTime: _.gte(dayStart)
    }).get()
    records = todayRecords.data || []
  } catch (e) {
    records = []
  }

  try {
    var shareRecords = await db.collection('lotteryShareChances').where({
      _openid: OPENID,
      createTime: _.gte(dayStart)
    }).get()
    shareEarned = Math.min(2, (shareRecords.data || []).length)
  } catch (e2) {
    shareEarned = 0
  }

  var remain = calculateRemainChances(records, shareEarned)
  return {
    code: 0,
    remainChances: remain,
    totalChances: remain.free + remain.share + remain.retry,
    shareEarned: shareEarned
  }
}
