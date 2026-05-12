// 云函数：上传消费凭证 - 事务版（支持交易单号去重）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { amount, transactionId, product, merchant, imageFileID } = event

  // 1. 查询用户
  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (userRes.data.length === 0) {
    return { code: -1, msg: '用户不存在' }
  }
  const user = userRes.data[0]
  const userId = user._id

  // 2. 校验金额
  if (!amount || amount <= 0) {
    return { code: -2, msg: '消费金额必须大于0' }
  }

  // 3. 校验交易单号
  if (!transactionId) {
    return { code: -2, msg: '缺少交易单号' }
  }

  // 4. 检查交易单号是否已使用（全局去重，一个单号只能用一次）
  const dupRes = await db.collection('receipts').where({
    transactionId: transactionId
  }).get()
  if (dupRes.data.length > 0) {
    return { code: -3, msg: '该交易单号已使用过，不能重复提交' }
  }

  // 5. 计算积分（保留一位小数：11.1元→1.1积分, 19.8元→1.9积分）
  const pointsEarned = Math.floor(amount) / 10
  const now = db.serverDate()

  // 6. 使用事务保证一致性
  const transaction = await db.startTransaction()
  try {
    // a. 添加消费记录
    const receiptRes = await transaction.collection('receipts').add({
      data: {
        _openid: OPENID,
        userId: userId,
        amount: amount,
        transactionId: transactionId,
        product: product,
        merchant: merchant,
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
        description: '消费 ¥' + amount + ' 获得 ' + pointsEarned + ' 积分',
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
      const refPoints = Math.floor(amount / 20 * 10) / 10
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
            description: '邀请用户消费 ¥' + amount + ' 获得 ' + refPoints + ' 积分',
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
            amount: amount,
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
