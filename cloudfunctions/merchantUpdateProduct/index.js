const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function isPositiveInteger(value) {
  return /^\d+$/.test(String(value)) && parseInt(value, 10) > 0
}

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
      if (!name || name.trim() === '') {
        return { code: -1, msg: '商品名称不能为空' }
      }
      updateData.name = name.trim()
    }
    if (image !== undefined) {
      if (!image) {
        return { code: -1, msg: '请上传商品图片' }
      }
      updateData.image = image
    }
    if (requiredPoints !== undefined) {
      if (!isPositiveInteger(requiredPoints)) {
        return { code: -1, msg: '所需积分必须为正整数' }
      }
      updateData.requiredPoints = parseInt(requiredPoints, 10)
    }
    if (totalCount !== undefined) {
      if (!isPositiveInteger(totalCount)) {
        return { code: -1, msg: '商品总数必须为正整数' }
      }
      var nextTotalCount = parseInt(totalCount, 10)
      // 重新计算剩余数量：新的总数 - 已兑换数量，不能小于已兑换数量
      const usedCount = (product.totalCount || 0) - (product.remainingCount || 0)
      if (nextTotalCount < usedCount) {
        return { code: -1, msg: '商品总数不能小于已兑换数量' }
      }
      updateData.totalCount = nextTotalCount
      updateData.remainingCount = nextTotalCount - usedCount
    }

    await db.collection('products').doc(productId).update({
      data: updateData
    })

    return { code: 0 }
  } catch (err) {
    return { code: -1, msg: '更新商品失败', error: err.message }
  }
}
