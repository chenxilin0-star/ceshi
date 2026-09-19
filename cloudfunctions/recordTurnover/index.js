// 营业额流水：新增 / 修改 / 删除
// 金额统一以「分」为单位（整数）存储，规避 JS 浮点精度问题
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const SHOPS = ['曹氏鸭脖', '蛋蛋滑蛋饭']
const CHANNELS = ['校园卡', '收钱吧', '美团外卖']
const MAX_YUAN = 100000

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

function toCents(amount) {
  const s = String(amount).trim()
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null
  const parts = s.split('.')
  const yuan = parseInt(parts[0], 10)
  if (yuan > MAX_YUAN) return null
  const fen = parts.length > 1 ? parseInt((parts[1] + '00').slice(0, 2), 10) : 0
  return yuan * 100 + fen
}

exports.main = async (event, context) => {
  const { action, id, shop, channel, amount, bizDate } = event
  const { OPENID } = cloud.getWXContext()

  if (!(await isMerchant(OPENID))) {
    return { code: -403, msg: '无权限' }
  }

  if (action === 'add') {
    if (!SHOPS.includes(shop)) return { code: -1, msg: '店铺不合法' }
    if (!CHANNELS.includes(channel)) return { code: -1, msg: '收入板块不合法' }
    const cents = toCents(amount)
    if (cents === null || cents <= 0) return { code: -1, msg: '金额不合法：请输入正数，最多两位小数' }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bizDate || '')) return { code: -1, msg: '日期不合法' }

    const addRes = await db.collection('turnover').add({
      data: {
        shop: shop,
        channel: channel,
        amountCents: cents,
        bizDate: bizDate,
        bizMonth: bizDate.slice(0, 7),
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })
    return { code: 0, id: addRes._id }
  }

  if (action === 'update') {
    if (!id) return { code: -1, msg: '缺少记录ID' }
    const upd = {}
    if (shop !== undefined) {
      if (!SHOPS.includes(shop)) return { code: -1, msg: '店铺不合法' }
      upd.shop = shop
    }
    if (channel !== undefined) {
      if (!CHANNELS.includes(channel)) return { code: -1, msg: '收入板块不合法' }
      upd.channel = channel
    }
    if (amount !== undefined) {
      const c = toCents(amount)
      if (c === null || c <= 0) return { code: -1, msg: '金额不合法：请输入正数，最多两位小数' }
      upd.amountCents = c
    }
    if (bizDate !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(bizDate)) return { code: -1, msg: '日期不合法' }
      upd.bizDate = bizDate
      upd.bizMonth = bizDate.slice(0, 7)
    }
    if (Object.keys(upd).length === 0) return { code: -1, msg: '没有可修改的内容' }
    upd.updateTime = db.serverDate()
    await db.collection('turnover').doc(id).update({ data: upd })
    return { code: 0 }
  }

  if (action === 'delete') {
    if (!id) return { code: -1, msg: '缺少记录ID' }
    await db.collection('turnover').doc(id).remove()
    return { code: 0 }
  }

  return { code: -1, msg: '未知操作' }
}
