const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  var today = new Date()
  var todayStr = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0')
  var dayStart = new Date(todayStr + 'T00:00:00+08:00')

  try { await db.createCollection('lotteryShareChances') } catch (e) {}

  var existing = []
  try {
    var res = await db.collection('lotteryShareChances').where({
      _openid: OPENID,
      createTime: _.gte(dayStart)
    }).get()
    existing = res.data || []
  } catch (e2) {
    existing = []
  }

  var added = false
  if (existing.length < 2) {
    await db.collection('lotteryShareChances').add({
      data: {
        source: event && event.scene ? event.scene : 'share_menu',
        createTime: db.serverDate()
      }
    })
    existing.push({})
    added = true
  }

  return {
    code: 0,
    added: added,
    shareEarned: Math.min(2, existing.length),
    remainShareUpperBound: Math.max(0, 2 - Math.min(2, existing.length))
  }
}
