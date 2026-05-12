// 云函数：保存抽奖奖项配置（商户专用）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { prizes } = event

  // 1. 验证商户身份
  var isMerchant = false
  var userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (userRes.data.length > 0 && userRes.data[0].role === 'merchant') {
    isMerchant = true
  }
  if (!isMerchant) {
    try {
      var configRes = await db.collection('merchantConfig').doc('config').get()
      if (configRes.data && configRes.data.merchantOpenids && configRes.data.merchantOpenids.includes(OPENID)) {
        isMerchant = true
      }
    } catch (e) {}
  }
  if (!isMerchant) {
    return { code: -10, msg: '无权限操作' }
  }

  // 2. 校验参数
  if (!prizes || !Array.isArray(prizes) || prizes.length !== 8) {
    return { code: -1, msg: '奖项数量必须为8个' }
  }

  // 3. 校验概率总和 = 100.0%
  var totalProb = 0
  for (var i = 0; i < prizes.length; i++) {
    var p = prizes[i]
    if (!p.name || !p.name.trim()) {
      return { code: -2, msg: '第' + (i + 1) + '个奖项名称不能为空' }
    }
    if (typeof p.probability !== 'number' || p.probability < 0) {
      return { code: -2, msg: '第' + (i + 1) + '个奖项概率无效' }
    }
    if (!p.type || ['points', 'product', 'none'].indexOf(p.type) === -1) {
      return { code: -2, msg: '第' + (i + 1) + '个奖项类型无效' }
    }
    // 校验 type=points 必须有积分数
    if (p.type === 'points' && (!p.points || p.points <= 0)) {
      return { code: -2, msg: '第' + (i + 1) + '个积分奖项必须设置积分数' }
    }
    // 校验 type=product 必须关联商品
    if (p.type === 'product' && !p.productId) {
      return { code: -2, msg: '第' + (i + 1) + '个实物奖项必须选择商品' }
    }
    totalProb += p.probability
  }

  // 保留一位小数比较，总和必须为 100.0
  totalProb = Math.round(totalProb * 10) / 10
  if (totalProb !== 100.0) {
    return { code: -3, msg: '概率总和必须为100%，当前为' + totalProb + '%' }
  }

  // 4. 查询现有奖项
  try {
    await db.createCollection('lotteryPrizes')
  } catch (e) {}

  var existingRes = await db.collection('lotteryPrizes').orderBy('order', 'asc').get()

  var now = db.serverDate()

  if (existingRes.data.length === 0) {
    // 首次创建8条文档
    for (var j = 0; j < prizes.length; j++) {
      var prize = prizes[j]
      await db.collection('lotteryPrizes').add({
        data: {
          name: prize.name,
          type: prize.type,
          points: prize.type === 'points' ? prize.points : 0,
          productId: prize.type === 'product' ? prize.productId : '',
          productName: prize.type === 'product' ? (prize.productName || '') : '',
          probability: prize.probability,
          bgColor: prize.bgColor || '#FFE0EB',
          stock: prize.type === 'product' ? (prize.stock || null) : null,
          remainingStock: prize.type === 'product' ? (prize.remainingStock || prize.stock || null) : null,
          order: j + 1,
          enabled: prize.enabled !== false,
          createTime: now,
          updateTime: now
        }
      })
    }
  } else {
    // 更新已有文档
    for (var k = 0; k < prizes.length; k++) {
      var item = prizes[k]
      var existingDoc = existingRes.data.find(function (d) { return d.order === k + 1 })
      var updateData = {
        name: item.name,
        type: item.type,
        points: item.type === 'points' ? item.points : 0,
        productId: item.type === 'product' ? item.productId : '',
        productName: item.type === 'product' ? (item.productName || '') : '',
        probability: item.probability,
        bgColor: item.bgColor || '#FFE0EB',
        order: k + 1,
        enabled: item.enabled !== false,
        updateTime: now
      }

      // 仅当 type=product 时更新库存
      if (item.type === 'product') {
        // 如果切换了商品或之前不是 product 类型，重置库存
        if (existingDoc) {
          var productChanged = existingDoc.productId !== item.productId || existingDoc.type !== 'product'
          if (productChanged) {
            updateData.stock = item.stock || null
            updateData.remainingStock = item.stock || null
          }
          // 否则保持现有库存不变
        } else {
          updateData.stock = item.stock || null
          updateData.remainingStock = item.stock || null
        }
      } else {
        updateData.stock = null
        updateData.remainingStock = null
      }

      if (existingDoc) {
        await db.collection('lotteryPrizes').doc(existingDoc._id).update({ data: updateData })
      } else {
        await db.collection('lotteryPrizes').add({
          data: Object.assign({}, updateData, { createTime: now })
        })
      }
    }
  }

  return { code: 0, msg: '保存成功' }
}
