const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { verifyCode } = event
  const { OPENID } = cloud.getWXContext()

  if (!verifyCode) {
    return { code: -1, msg: '缺少兑换码' }
  }

  try {
    // 1. 验证当前用户是否为商户
    // 方式一：检查 users 集合中 role === 'merchant'
    const userRes = await db.collection('users')
      .where({ _openid: OPENID })
      .get()

    let isMerchant = false
    if (userRes.data.length > 0 && userRes.data[0].role === 'merchant') {
      isMerchant = true
    }

    // 方式二：检查 merchantConfig 集合中 merchantOpenids 数组
    if (!isMerchant) {
      try {
        const configRes = await db.collection('merchantConfig').doc('config').get()
        if (configRes.data && configRes.data.merchantOpenids && configRes.data.merchantOpenids.includes(OPENID)) {
          isMerchant = true
        }
      } catch (e) {
        // merchantConfig 文档可能不存在，忽略错误
      }
    }

    if (!isMerchant) {
      return { code: -10, msg: '无权限操作' }
    }

    // 2. 查询兑换码对应的优惠券
    const couponRes = await db.collection('userCoupons')
      .where({ verifyCode })
      .get()

    if (couponRes.data.length === 0) {
      return { code: -1, msg: '兑换码不存在' }
    }

    const userCoupon = couponRes.data[0]

    // 3. 检查状态
    if (userCoupon.status === 'used') {
      return { code: -2, msg: '已核销' }
    }

    // 4. 检查是否过期
    if (userCoupon.expireAt && userCoupon.expireAt <= new Date()) {
      await db.collection('userCoupons').doc(userCoupon._id).update({
        data: { status: 'expired' }
      })
      return { code: -3, msg: '已过期' }
    }

    // 5. 原子更新优惠券状态为已核销（防止并发双重核销）
    var updateRes = await db.collection('userCoupons').doc(userCoupon._id).update({
      data: {
        status: 'used',
        usedAt: db.serverDate(),
        usedByStaffId: OPENID
      }
    })
    if (updateRes.stats.updated === 0) {
      return { code: -2, msg: '核销失败，可能已被其他操作核销' }
    }

    // 6. 获取商品信息
    let productName = ''
    if (userCoupon.templateId) {
      try {
        const productRes = await db.collection('products').doc(userCoupon.templateId).get()
        productName = productRes.data.name || ''
      } catch (e) {
        // 商品可能已被删除
      }
    }

    // 7. 写入核销日志
    await db.collection('verifyLogs').add({
      data: {
        userCouponId: userCoupon._id,
        userId: userCoupon.userId || userCoupon._openid || '',
        templateId: userCoupon.templateId || '',
        verifyCode,
        staffOpenid: OPENID,
        productName,
        createTime: db.serverDate()
      }
    })

    return { code: 0, msg: '核销成功', productName }
  } catch (err) {
    return { code: -1, msg: '核销失败', error: err.message }
  }
}
