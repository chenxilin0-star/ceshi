// 云函数：获取抽奖奖项配置
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 默认8个奖项
const DEFAULT_PRIZES = [
  { name: '谢谢参与', type: 'none', points: 0, productId: '', productName: '', probability: 30.0, bgColor: '#FFE0EB', stock: null, remainingStock: null, order: 1, enabled: true },
  { name: '1积分', type: 'points', points: 1, productId: '', productName: '', probability: 20.0, bgColor: '#E8F8F5', stock: null, remainingStock: null, order: 2, enabled: true },
  { name: '谢谢参与', type: 'none', points: 0, productId: '', productName: '', probability: 15.0, bgColor: '#FFF0F5', stock: null, remainingStock: null, order: 3, enabled: true },
  { name: '5积分', type: 'points', points: 5, productId: '', productName: '', probability: 12.0, bgColor: '#E3F2FD', stock: null, remainingStock: null, order: 4, enabled: true },
  { name: '谢谢参与', type: 'none', points: 0, productId: '', productName: '', probability: 10.0, bgColor: '#F3E5F5', stock: null, remainingStock: null, order: 5, enabled: true },
  { name: '再来一次', type: 'none', points: 0, productId: '', productName: '', probability: 5.0, bgColor: '#FFF3E0', stock: null, remainingStock: null, order: 6, enabled: true },
  { name: '8积分', type: 'points', points: 8, productId: '', productName: '', probability: 5.0, bgColor: '#E8EAF6', stock: null, remainingStock: null, order: 7, enabled: true },
  { name: '10积分', type: 'points', points: 10, productId: '', productName: '', probability: 3.0, bgColor: '#E0F7FA', stock: null, remainingStock: null, order: 8, enabled: true }
]

exports.main = async (event, context) => {
  try {
    // 确保集合存在
    try {
      await db.createCollection('lotteryPrizes')
    } catch (e) {
      // 集合已存在
    }

    var res = await db.collection('lotteryPrizes')
      .orderBy('order', 'asc')
      .get()

    // 如果集合为空，初始化默认配置
    if (res.data.length === 0) {
      var now = db.serverDate()
      for (var i = 0; i < DEFAULT_PRIZES.length; i++) {
        await db.collection('lotteryPrizes').add({
          data: Object.assign({}, DEFAULT_PRIZES[i], { createTime: now, updateTime: now })
        })
      }
      // 重新查询
      res = await db.collection('lotteryPrizes').orderBy('order', 'asc').get()
    }

    // 处理展示数据：禁用或缺货的奖项替换为"谢谢参与"
    // 这样前端转盘永远展示8个扇区，与 spinLottery 实际抽奖逻辑一致
    var displayPrizes = []
    for (var j = 0; j < res.data.length; j++) {
      var p = res.data[j]
      if (!p.enabled || (p.type === 'product' && p.remainingStock !== null && p.remainingStock <= 0)) {
        // 禁用或缺货 → 展示为"谢谢参与"，概率不变（spinLottery 会将概率也给谢谢参与）
        displayPrizes.push({
          _id: p._id,
          name: '谢谢参与',
          type: 'none',
          points: 0,
          productId: '',
          productName: '',
          probability: p.probability,
          bgColor: p.bgColor,
          stock: null,
          remainingStock: null,
          order: p.order,
          enabled: true,
          _disabled: true  // 标记原始为禁用，前端配置页用
        })
      } else {
        displayPrizes.push(p)
      }
    }

    return { code: 0, prizes: displayPrizes }
  } catch (err) {
    return { code: -1, msg: '获取奖项失败', error: err.message }
  }
}
