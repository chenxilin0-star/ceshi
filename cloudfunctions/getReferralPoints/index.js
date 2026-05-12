// 云函数：分销积分明细
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  // 1. 查询用户
  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (userRes.data.length === 0) {
    return { code: -1, msg: '用户不存在' }
  }
  const user = userRes.data[0]
  const userId = user._id

  // 2. 查询分销积分记录
  const referralPointsRes = await db.collection('referralPoints')
    .where({ referrerId: userId })
    .orderBy('createTime', 'desc')
    .get()

  // 3. 关联被推荐人昵称
  const list = []
  for (const rp of referralPointsRes.data) {
    let referredName = '未知用户'
    try {
      const referredRes = await db.collection('users').doc(rp.referredId).get()
      referredName = referredRes.data.nickName || referredRes.data.name || '未知用户'
    } catch (e) {
      // 用户可能已被删除
    }
    list.push({
      amount: rp.amount,
      points: rp.points,
      referredName: referredName,
      createTime: rp.createTime
    })
  }

  return {
    code: 0,
    list: list
  }
}
