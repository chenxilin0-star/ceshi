// 云函数：兑换商品（事务版）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 生成随机核销码
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

  // 1. 查询用户
  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (userRes.data.length === 0) {
    return { code: -1, msg: '用户不存在' }
  }
  const user = userRes.data[0]
  const userId = user._id

  // 2. 查询商品
  let product
  try {
    const productRes = await db.collection('products').doc(productId).get()
    product = productRes.data
  } catch (e) {
    return { code: -1, msg: '商品不存在' }
  }

  // 校验剩余数量
  if (product.remainingCount <= 0) {
    return { code: -2, msg: '商品已售罄' }
  }

  // 校验用户积分是否足够
  if (user.totalPoints < product.requiredPoints) {
    return { code: -3, msg: '积分不足' }
  }

  // 3. 检查是否已兑换
  const existRes = await db.collection('userCoupons').where({
    userId: userId,
    templateId: productId
  }).get()
  if (existRes.data.length > 0) {
    return { code: -4, msg: '您已兑换过该商品' }
  }

  // 4. 生成唯一核销码
  let verifyCode = generateVerifyCode()
  let codeCheck = await db.collection('userCoupons').where({ verifyCode }).get()
  while (codeCheck.data.length > 0) {
    verifyCode = generateVerifyCode()
    codeCheck = await db.collection('userCoupons').where({ verifyCode }).get()
  }

  // 5. 计算过期时间（30天后）
  const expireAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  const requiredPoints = product.requiredPoints

  // 6. 使用事务保证一致性
  const transaction = await db.startTransaction()
  try {
    // a. 扣减商品库存
    await transaction.collection('products').doc(productId).update({
      data: {
        remainingCount: _.inc(-1)
      }
    })

    // b. 扣减用户积分
    await transaction.collection('users').doc(userId).update({
      data: {
        totalPoints: _.inc(-requiredPoints),
        updateTime: now
      }
    })

    // c. 添加积分流水（支出）
    await transaction.collection('points').add({
      data: {
        _openid: OPENID,
        userId: userId,
        change: -requiredPoints,
        type: 'spend',
        source: 'redeem_product',
        description: `兑换「${product.name}」消耗 ${requiredPoints} 积分`,
        balanceAfter: user.totalPoints - requiredPoints,
        createTime: now
      }
    })

    // d. 添加用户兑换记录（复用 userCoupons 集合）
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
    return {
      code: 0,
      verifyCode: verifyCode,
      expireAt: expireAt
    }
  } catch (err) {
    await transaction.rollback()
    console.error('redeemProduct error:', err)
    return { code: -99, msg: '系统错误，请重试' }
  }
}
