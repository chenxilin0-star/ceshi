// 云函数：上传消费凭证 - 事务版（支持交易单号去重）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { amount, transactionId, product, merchant, imageFileID } = event
  const normalizedAmount = Number(amount)
  const normalizedTransactionId = String(transactionId || '').trim()
  const normalizedProduct = String(product || '').trim()
  const normalizedMerchant = String(merchant || '').trim()

  if (!imageFileID || String(imageFileID).indexOf('/receipts/') === -1) {
    return { code: -2, msg: '缺少有效小票图片' }
  }
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0 || normalizedAmount > 10000) {
    return { code: -2, msg: '消费金额必须大于0且不能异常过大' }
  }
  if (!/^\d{28}$/.test(normalizedTransactionId)) {
    return { code: -2, msg: '交易单号格式不正确' }
  }
  if (normalizedProduct !== 'B-8号档口' && normalizedProduct !== 'B-7号档口') {
    return { code: -2, msg: '商品名称不符合要求' }
  }
  if (normalizedMerchant.indexOf('四川青瑞和餐饮管理有限公司') === -1) {
    return { code: -2, msg: '商户信息不符合要求' }
  }

  // 1. 查询用户
  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (userRes.data.length === 0) {
    return { code: -1, msg: '用户不存在' }
  }
  const user = userRes.data[0]
  const userId = user._id

  // 2. 校验金额
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    return { code: -2, msg: '消费金额必须大于0' }
  }

  // 3. 校验交易单号
  if (!normalizedTransactionId) {
    return { code: -2, msg: '缺少交易单号' }
  }

  // 4. 检查交易单号是否已使用（全局去重，一个单号只能用一次）
  const dupRes = await db.collection('receipts').where({
    transactionId: normalizedTransactionId
  }).get()
  if (dupRes.data.length > 0) {
    return { code: -3, msg: '该交易单号已使用过，不能重复提交' }
  }

  // 5. 计算积分（保留一位小数：11.1元→1.1积分, 19.8元→1.9积分）
  const pointsEarned = Math.floor(normalizedAmount) / 10
  const now = db.serverDate()

  // 6. 使用事务保证一致性
  const transaction = await db.startTransaction()
  try {
    // a. 在事务内创建交易单号锁，降低并发重复提交风险
    try {
      const lockRes = await transaction.collection('receiptLocks').doc(normalizedTransactionId).get()
      if (lockRes && lockRes.data) {
        await transaction.rollback()
        return { code: -3, msg: '该交易单号已使用过，不能重复提交' }
      }
    } catch (e) {}
    await transaction.collection('receiptLocks').doc(normalizedTransactionId).set({
      data: {
        _openid: OPENID,
        transactionId: normalizedTransactionId,
        createTime: now
      }
    })

    // b. 添加消费记录
    const receiptRes = await transaction.collection('receipts').add({
      data: {
        _openid: OPENID,
        userId: userId,
        amount: normalizedAmount,
        transactionId: normalizedTransactionId,
        product: normalizedProduct,
        merchant: normalizedMerchant,
        imageFileID: imageFileID,
        pointsEarned: pointsEarned,
        status: 'approved',
        createTime: now
      }
    })
    const receiptId = receiptRes._id

    // b. 添加积分流水
    await transaction.collection('points').add({
      data: {
        _openid: OPENID,
        userId: userId,
        change: pointsEarned,
        type: 'earn',
        source: 'consumption',
        relatedId: receiptId,
        description: '消费 ¥' + normalizedAmount + ' 获得 ' + pointsEarned + ' 积分',
        balanceAfter: user.totalPoints + pointsEarned,
        createTime: now
      }
    })

    // c. 更新用户积分
    await transaction.collection('users').doc(userId).update({
      data: {
        totalPoints: _.inc(pointsEarned),
        updateTime: now
      }
    })

    // d. 处理分销返利（保留一位小数，每20元=1积分）
    if (user.referrerId) {
      const refPoints = Math.floor(normalizedAmount / 20 * 10) / 10
      if (refPoints > 0) {
        const referrerRes = await db.collection('users').doc(user.referrerId).get()
        const referrer = referrerRes.data

        await transaction.collection('points').add({
          data: {
            _openid: referrer._openid,
            userId: user.referrerId,
            change: refPoints,
            type: 'earn',
            source: 'referral',
            relatedId: receiptId,
            description: '邀请用户消费 ¥' + normalizedAmount + ' 获得 ' + refPoints + ' 积分',
            balanceAfter: referrer.totalPoints + refPoints,
            createTime: now
          }
        })

        await transaction.collection('users').doc(user.referrerId).update({
          data: {
            totalPoints: _.inc(refPoints),
            updateTime: now
          }
        })

        await transaction.collection('referralPoints').add({
          data: {
            referrerId: user.referrerId,
            referredId: userId,
            amount: normalizedAmount,
            points: refPoints,
            createTime: now
          }
        })
      }
    }

    await transaction.commit()
    return { code: 0, receiptId: receiptId, pointsEarned: pointsEarned }
  } catch (err) {
    await transaction.rollback()
    console.error('uploadReceipt error:', err)
    return { code: -99, msg: '系统错误，请重试' }
  }
}
