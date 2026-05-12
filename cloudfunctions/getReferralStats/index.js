// 云函数：分销统计
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  // 1. 查询用户
  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (userRes.data.length === 0) {
    return { code: -1, msg: '用户不存在' }
  }
  const user = userRes.data[0]
  const userId = user._id

  // 2. 统计邀请人数
  const referralsRes = await db.collection('referrals')
    .where({ referrerId: userId })
    .count()
  const referralCount = referralsRes.total

  // 3. 汇总分销积分
  let totalReferralPoints = 0
  const pointsRes = await db.collection('points')
    .where({
      userId: userId,
      source: 'referral'
    })
    .get()
  for (const p of pointsRes.data) {
    totalReferralPoints += p.change
  }

  return {
    code: 0,
    referralCount: referralCount,
    totalReferralPoints: totalReferralPoints,
    referralCode: user.referralCode || ''
  }
}
