// 云函数：核销券
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { verifyCode } = event
  const now = db.serverDate()

  // 1. 查询用户券
  const couponRes = await db.collection('userCoupons').where({ verifyCode }).get()
  if (couponRes.data.length === 0) {
    return { code: -1, msg: '券不存在' }
  }
  const userCoupon = couponRes.data[0]

  // 2. 校验状态
  if (userCoupon.status === 'used') {
    return { code: -2, msg: '券已被使用' }
  }

  // 3. 校验过期
  const expireAt = new Date(userCoupon.expireAt)
  if (expireAt <= new Date()) {
    // 将过期券状态更新为 expired
    if (userCoupon.status !== 'expired') {
      await db.collection('userCoupons').doc(userCoupon._id).update({
        data: {
          status: 'expired'
        }
      })
    }
    return { code: -3, msg: '券已过期' }
  }

  // 获取券面值
  let faceValue = 0
  try {
    const templateRes = await db.collection('coupons').doc(userCoupon.templateId).get()
    faceValue = templateRes.data.faceValue
  } catch (e) {
    // 模板可能已被删除
  }

  // 4. 更新券状态为已使用
  await db.collection('userCoupons').doc(userCoupon._id).update({
    data: {
      status: 'used',
      usedAt: now,
      usedByStaffId: OPENID
    }
  })

  // 5. 写入核销日志
  await db.collection('verifyLogs').add({
    data: {
      userCouponId: userCoupon._id,
      userId: userCoupon.userId,
      templateId: userCoupon.templateId,
      verifyCode: verifyCode,
      staffOpenid: OPENID,
      faceValue: faceValue,
      createTime: now
    }
  })

  return {
    code: 0,
    msg: '核销成功',
    faceValue: faceValue
  }
}
