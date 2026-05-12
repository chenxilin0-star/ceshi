const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { productId, name, image, requiredPoints, totalCount } = event
  const { OPENID } = cloud.getWXContext()

  if (!productId) {
    return { code: -1, msg: '缺少商品ID' }
  }

  try {
    // 查询商品是否存在且属于当前用户
    const productRes = await db.collection('products').doc(productId).get()
    const product = productRes.data

    if (!product) {
      return { code: -1, msg: '商品不存在' }
    }

    if (product.createdBy !== OPENID) {
      return { code: -1, msg: '无权限操作' }
    }

    // 构建更新对象，仅更新提供了的字段
    const updateData = {
      updateTime: db.serverDate()
    }

    if (name !== undefined) {
      updateData.name = name
    }
    if (image !== undefined) {
      updateData.image = image
    }
    if (requiredPoints !== undefined) {
      updateData.requiredPoints = requiredPoints
    }
    if (totalCount !== undefined) {
      updateData.totalCount = totalCount
      // 重新计算剩余数量：新的总数 - 已兑换数量
      const usedCount = product.totalCount - product.remainingCount
      updateData.remainingCount = totalCount - usedCount
    }

    await db.collection('products').doc(productId).update({
      data: updateData
    })

    return { code: 0 }
  } catch (err) {
    return { code: -1, msg: '更新商品失败', error: err.message }
  }
}
