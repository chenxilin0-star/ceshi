// 云函数：转盘抽奖（从数据库读取奖项配置）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 生成随机核销码
function generateVerifyCode() {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  var code = ''
  for (var i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { source } = event

  // 1. 获取用户
  var userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (userRes.data.length === 0) {
    return { code: -1, msg: '用户不存在，请先登录' }
  }
  var user = userRes.data[0]
  var userId = user._id

  // 2. 确保集合存在
  try { await db.createCollection('lotteryRecords') } catch (e) {}
  try { await db.createCollection('lotteryPrizes') } catch (e) {}

  // 3. 从数据库读取全部奖项（不过滤 enabled，由下面统一处理）
  var prizesRes = await db.collection('lotteryPrizes')
    .orderBy('order', 'asc')
    .get()
  var rawPrizes = prizesRes.data || []

  // 如果数据库没有配置，使用默认奖项
  if (rawPrizes.length === 0) {
    rawPrizes = [
      { name: '谢谢参与', type: 'none', points: 0, probability: 30.0, bgColor: '#FFE0EB', order: 1 },
      { name: '1积分', type: 'points', points: 1, probability: 20.0, bgColor: '#E8F8F5', order: 2 },
      { name: '谢谢参与', type: 'none', points: 0, probability: 15.0, bgColor: '#FFF0F5', order: 3 },
      { name: '5积分', type: 'points', points: 5, probability: 12.0, bgColor: '#E3F2FD', order: 4 },
      { name: '谢谢参与', type: 'none', points: 0, probability: 10.0, bgColor: '#F3E5F5', order: 5 },
      { name: '再来一次', type: 'none', points: 0, probability: 5.0, bgColor: '#FFF3E0', order: 6 },
      { name: '8积分', type: 'points', points: 8, probability: 5.0, bgColor: '#E8EAF6', order: 7 },
      { name: '10积分', type: 'points', points: 10, probability: 3.0, bgColor: '#E0F7FA', order: 8 }
    ]
  }

  // 4. 处理禁用/缺货的奖项：替换为"谢谢参与"而不是跳过
  // 这保证前端转盘8个扇区和后端奖项一一对应
  var allPrizes = []
  for (var fi = 0; fi < rawPrizes.length; fi++) {
    var fp = rawPrizes[fi]
    var disabled = !fp.enabled
    var outOfStock = fp.type === 'product' && fp.remainingStock !== null && fp.remainingStock <= 0
    if (disabled || outOfStock) {
      allPrizes.push({
        _id: fp._id,
        name: '谢谢参与',
        type: 'none',
        points: 0,
        probability: fp.probability,
        bgColor: fp.bgColor,
        order: fp.order
      })
    } else {
      allPrizes.push(fp)
    }
  }

  // 5. 查询今日抽奖记录
  var today = new Date()
  var todayStr = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0')
  var dayStart = new Date(todayStr + 'T00:00:00+08:00')

  var records = []
  try {
    var todayRecords = await db.collection('lotteryRecords').where({
      _openid: OPENID,
      createTime: _.gte(dayStart)
    }).get()
    records = todayRecords.data || []
  } catch (e) {
    records = []
  }

  var freeUsed = records.filter(function (r) { return r.source === 'free' }).length
  var shareUsed = records.filter(function (r) { return r.source === 'share' }).length
  var retryUsed = records.filter(function (r) { return r.source === 'retry' }).length

  // 6. 校验抽奖次数
  var canSpin = false
  var actualSource = source

  // 检查是否有"再来一次"的中奖记录（source不是retry，说明是正常抽奖中的）
  var hasRetryPrize = records.some(function (r) {
    return r.prizeType === 'retry' && r.source !== 'retry'
  })

  if (source === 'retry') {
    if (!hasRetryPrize) {
      return { code: -3, msg: '没有可用的再来一次机会' }
    }
    if (retryUsed > 0) {
      return { code: -3, msg: '再来一次机会已使用' }
    }
    canSpin = true
  } else if (source === 'share') {
    if (shareUsed >= 2) {
      return { code: -3, msg: '今日分享抽奖次数已用完' }
    }
    canSpin = true
  } else {
    if (freeUsed >= 1) {
      return { code: -3, msg: '今日免费抽奖次数已用完' }
    }
    canSpin = true
    actualSource = 'free'
  }

  if (!canSpin) {
    return { code: -3, msg: '没有抽奖机会' }
  }

  // 7. 抽奖 - 按概率加权随机选择
  var totalWeight = 0
  for (var wi = 0; wi < allPrizes.length; wi++) {
    totalWeight += Math.round(allPrizes[wi].probability * 10)
  }

  var rand = Math.floor(Math.random() * totalWeight)
  var selectedPrize = allPrizes[0]
  var accumulated = 0
  for (var si = 0; si < allPrizes.length; si++) {
    accumulated += Math.round(allPrizes[si].probability * 10)
    if (rand < accumulated) {
      selectedPrize = allPrizes[si]
      break
    }
  }

  var now = db.serverDate()
  var pointsEarned = 0
  var prizeType = selectedPrize.type

  // 判断是否为"再来一次"类型（名称匹配）
  if (selectedPrize.name === '再来一次') {
    prizeType = 'retry'
  }

  // 8. 写入抽奖记录（带重试）
  var writeOk = false
  for (var attempt = 0; attempt < 3; attempt++) {
    try {
      await db.collection('lotteryRecords').add({
        data: {
          _openid: OPENID,
          userId: userId,
          prizeId: selectedPrize._id || selectedPrize.order || 0,
          prizeName: selectedPrize.name,
          prizeType: prizeType,
          points: selectedPrize.points || 0,
          source: actualSource,
          createTime: now
        }
      })
      writeOk = true
      break
    } catch (e) {
      try { await db.createCollection('lotteryRecords') } catch (e2) {}
    }
  }

  if (!writeOk) {
    return { code: -99, msg: '系统繁忙，请重试' }
  }

  // 9. 根据奖品类型执行不同操作
  if (prizeType === 'points' && selectedPrize.points > 0) {
    pointsEarned = selectedPrize.points
    try {
      // 先 inc 积分，再读取最新值写 points 记录，避免 balanceAfter 不准
      await db.collection('users').doc(userId).update({
        data: {
          totalPoints: _.inc(pointsEarned),
          updateTime: now
        }
      })
      // 读取更新后的用户信息以获取正确的 balanceAfter
      var updatedUserRes = await db.collection('users').doc(userId).get()
      var balanceAfter = updatedUserRes.data.totalPoints

      await db.collection('points').add({
        data: {
          _openid: OPENID,
          userId: userId,
          change: pointsEarned,
          type: 'earn',
          source: 'lottery',
          description: '转盘抽奖获得 ' + pointsEarned + ' 积分',
          balanceAfter: balanceAfter,
          createTime: now
        }
      })
    } catch (e) {
      console.error('write points failed:', e)
    }
  } else if (prizeType === 'product' && selectedPrize.productId) {
    // 实物类型：创建 userCoupons 记录 + 条件扣库存
    try {
      var verifyCode = generateVerifyCode()
      var codeCheck = await db.collection('userCoupons').where({ verifyCode: verifyCode }).get()
      while (codeCheck.data.length > 0) {
        verifyCode = generateVerifyCode()
        codeCheck = await db.collection('userCoupons').where({ verifyCode: verifyCode }).get()
      }

      var expireAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      await db.collection('userCoupons').add({
        data: {
          _openid: OPENID,
          userId: userId,
          templateId: selectedPrize.productId,
          status: 'unused',
          verifyCode: verifyCode,
          expireAt: expireAt,
          usedAt: null,
          usedByStaffId: null,
          source: 'lottery',
          createTime: now
        }
      })

      // 扣减 remainingStock（原子操作）
      if (selectedPrize._id) {
        await db.collection('lotteryPrizes').doc(selectedPrize._id).update({
          data: {
            remainingStock: _.inc(-1),
            updateTime: now
          }
        })
      }
    } catch (e) {
      console.error('create userCoupon for product prize failed:', e)
    }
  }
  // type='none' 或 'retry'：不做任何操作

  // 10. 计算剩余次数
  var newFreeUsed = actualSource === 'free' ? freeUsed + 1 : freeUsed
  var newShareUsed = actualSource === 'share' ? shareUsed + 1 : shareUsed
  var newRetryUsed = actualSource === 'retry' ? retryUsed + 1 : retryUsed

  var remainFree = newFreeUsed >= 1 ? 0 : 1
  var remainShare = 2 - newShareUsed
  var remainRetry = 0

  if (prizeType === 'retry' && retryUsed === 0) {
    remainRetry = 1
  }

  return {
    code: 0,
    prize: {
      id: selectedPrize._id || selectedPrize.order || 0,
      order: selectedPrize.order || 1,
      name: selectedPrize.name,
      type: prizeType,
      points: selectedPrize.points || 0,
      bgColor: selectedPrize.bgColor || '#FFE0EB'
    },
    pointsEarned: pointsEarned,
    remainChances: {
      free: remainFree,
      share: Math.max(0, remainShare),
      retry: remainRetry
    }
  }
}
