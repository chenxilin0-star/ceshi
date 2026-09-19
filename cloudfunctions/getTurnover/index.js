// 营业额查询：指定日期流水 + 全历史累计汇总 + 最近记录
// 金额字段 amountCents 为整数「分」，前端展示时再转元
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const $ = db.command.aggregate

async function isMerchant(openid) {
  try {
    const userRes = await db.collection('users').where({ _openid: openid }).get()
    if (userRes.data.length && userRes.data[0].role === 'merchant') return true
  } catch (e) {}
  try {
    const cfg = await db.collection('merchantConfig').doc('config').get()
    if (cfg.data && Array.isArray(cfg.data.merchantOpenids)) {
      return cfg.data.merchantOpenids.includes(openid)
    }
  } catch (e) {}
  return false
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!(await isMerchant(OPENID))) {
    return { code: -403, msg: '无权限' }
  }

  try {
    const date = event.date || ''
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : ''

    // 1) 指定日期的全部流水（当天记录量小，全量返回，前端现算今日汇总）
    let dayList = []
    if (validDate) {
      const dayRes = await db.collection('turnover')
        .where({ bizDate: validDate })
        .orderBy('createTime', 'desc')
        .limit(100)
        .get()
      dayList = dayRes.data
    }

    // 2) 全历史累计：按 店铺 × 板块 求和
    let totalsByCell = []
    const aggRes = await db.collection('turnover').aggregate()
      .group({
        _id: { shop: '$shop', channel: '$channel' },
        total: $.sum('$amountCents')
      })
      .end()
    totalsByCell = (aggRes.list || []).map(function (it) {
      return {
        shop: it._id.shop,
        channel: it._id.channel,
        total: it.total
      }
    })

    // 2.5) 月度累计：按 月份 × 店铺 求和
    let monthByShop = []
    const monthRes = await db.collection('turnover').aggregate()
      .group({
        _id: { month: '$bizMonth', shop: '$shop' },
        total: $.sum('$amountCents')
      })
      .end()
    monthByShop = (monthRes.list || []).map(function (it) {
      return {
        month: it._id.month,
        shop: it._id.shop,
        total: it.total
      }
    })

    // 3) 最近 50 条（历史列表）
    const recentRes = await db.collection('turnover')
      .orderBy('createTime', 'desc')
      .limit(50)
      .get()

    return {
      code: 0,
      data: {
        dayList: dayList,
        totalsByCell: totalsByCell,
        monthByShop: monthByShop,
        recentList: recentRes.data
      }
    }
  } catch (err) {
    return { code: -1, msg: err.message || '查询失败' }
  }
}
