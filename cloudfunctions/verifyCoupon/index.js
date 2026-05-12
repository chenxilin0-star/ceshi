// 云函数：核销券
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

async function isMerchant(OPENID) {
  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (userRes.data.length > 0 && userRes.data[0].role === 'merchant') {
    return true
  }
  try {
    const configRes = await db.collection('merchantConfig').doc('config').get()
    return !!(configRes.data && configRes.data.merchantOpenids && configRes.data.merchantOpenids.includes(OPENID))
  } catch (e) {
    return false
  }
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { verifyCode } = event
  const now = db.serverDate()

  if (!verifyCode) {
    return { code: -1, msg: '缺少核销码' }
  }
  if (!(await isMerchant(OPENID))) {
    return { code: -10, msg: '无权限操作' }
  }

  try {
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
      if (userCoupon.status !== 'expired') {
        await db.collection('userCoupons').doc(userCoupon._id).update({
          data: { status: 'expired' }
        })
      }
      return { code: -3, msg: '券已过期' }
    }

    // 获取券面值
    let faceValue = 0
    try {
      const templateRes = await db.collection('coupons').doc(userCoupon.templateId).get()
      faceValue = templateRes.data.faceValue
    } catch (e) {}

    // 4. 条件更新券状态为已使用，避免并发重复核销
    var updateRes = await db.collection('userCoupons').where({
      _id: userCoupon._id,
      status: 'unused'
    }).update({
      data: {
        status: 'used',
        usedAt: now,
        usedByStaffId: OPENID
      }
    })
    if (updateRes.stats.updated === 0) {
      return { code: -2, msg: '核销失败，可能已被其他操作核销' }
    }

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
  } catch (err) {
    return { code: -1, msg: '核销失败', error: err.message }
  }
}
