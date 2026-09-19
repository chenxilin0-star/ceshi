// 云函数：兑换商品（事务版）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

function generateVerifyCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { productId } = event
  const now = db.serverDate()

  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (userRes.data.length === 0) {
    return { code: -1, msg: '用户不存在' }
  }
  const user = userRes.data[0]
  const userId = user._id

  let product
  try {
    const productRes = await db.collection('products').doc(productId).get()
    product = productRes.data
  } catch (e) {
    return { code: -1, msg: '商品不存在' }
  }

  if (product.remainingCount <= 0) {
    return { code: -2, msg: '商品已售罄' }
  }

  if (user.totalPoints < product.requiredPoints) {
    return { code: -3, msg: '积分不足' }
  }

  let verifyCode = generateVerifyCode()
  let codeCheck = await db.collection('userCoupons').where({ verifyCode }).get()
  while (codeCheck.data.length > 0) {
    verifyCode = generateVerifyCode()
    codeCheck = await db.collection('userCoupons').where({ verifyCode }).get()
  }

  const expireAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const requiredPoints = product.requiredPoints

  const transaction = await db.startTransaction()
  try {
    await transaction.collection('products').doc(productId).update({
      data: { remainingCount: _.inc(-1) }
    })
    await transaction.collection('users').doc(userId).update({
      data: { totalPoints: _.inc(-requiredPoints), updateTime: now }
    })
    await transaction.collection('points').add({
      data: {
        _openid: OPENID,
        userId: userId,
        change: -requiredPoints,
        type: 'spend',
        source: 'redeem_product',
        description: '兑换「' + product.name + '」消耗 ' + requiredPoints + ' 积分',
        balanceAfter: user.totalPoints - requiredPoints,
        createTime: now
      }
    })
    await transaction.collection('userCoupons').add({
      data: {
        _openid: OPENID,
        userId: userId,
        templateId: productId,
        status: 'unused',
        verifyCode: verifyCode,
        expireAt: expireAt,
        usedAt: null,
        usedByStaffId: null,
        createTime: now
      }
    })
    await transaction.commit()
    return { code: 0, verifyCode: verifyCode, expireAt: expireAt }
  } catch (err) {
    await transaction.rollback()
    console.error('redeemProduct error:', err)
    return { code: -99, msg: '系统错误，请重试' }
  }
}
