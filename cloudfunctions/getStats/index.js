// 商家端用户活跃度统计
// 口径：打开过小程序即算活跃（login 云函数每次登录更新 lastActiveAt）
// 返回：累计用户、今日活跃、近7天每日活跃、近7天每日新增
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const TZ_OFFSET = 8 * 3600 * 1000 // 东八区

// 东八区某天 0 点的时间戳
function dayStartTs(offsetDays) {
  const now = Date.now()
  const todayStart = Math.floor((now + TZ_OFFSET) / 86400000) * 86400000 - TZ_OFFSET
  return todayStart - offsetDays * 86400000
}

function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

// 时间戳 -> 东八区 'MM-DD'
function fmtDate(ts) {
  const d = new Date(ts + TZ_OFFSET)
  return pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate())
}

exports.main = async () => {
  try {
    // 累计用户
    const totalRes = await db.collection('users').count()

    // 近 7 天（含今天）每日活跃 + 每日新增
    const activeTrend = []
    const newTrend = []
    for (let i = 6; i >= 0; i--) {
      const start = dayStartTs(i)
      const end = start + 86400000
      const sIso = new Date(start).toISOString()
      const eIso = new Date(end).toISOString()

      const [activeRes, newRes] = await Promise.all([
        db.collection('users').where({
          lastActiveAt: db.command.gte(sIso).and(db.command.lt(eIso))
        }).count(),
        db.collection('users').where({
          createTime: db.command.gte(sIso).and(db.command.lt(eIso))
        }).count()
      ])

      const label = fmtDate(start)
      activeTrend.push({ label, count: activeRes.total })
      newTrend.push({ label, count: newRes.total })
    }

    // 今日活跃 = 趋势数组最后一项
    const todayActive = activeTrend.length ? activeTrend[activeTrend.length - 1].count : 0

    return {
      code: 0,
      data: {
        totalUsers: totalRes.total,
        todayActive: todayActive,
        activeTrend: activeTrend,
        newTrend: newTrend
      }
    }
  } catch (err) {
    return {
      code: -1,
      message: err.message || '统计失败'
    }
  }
}
