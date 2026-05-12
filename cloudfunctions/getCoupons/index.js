// 云函数：获取可兑换券
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  // 查询状态为 active 且剩余数量大于 0 的券
  const couponsRes = await db.collection('coupons')
    .where({
      status: 'active',
      remainingCount: _.gt(0)
    })
    .get()

  return {
    code: 0,
    data: couponsRes.data
  }
}
