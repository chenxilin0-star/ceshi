const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { productId } = event
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

    // 软删除：更新状态为 inactive
    await db.collection('products').doc(productId).update({
      data: {
        status: 'inactive',
        updateTime: db.serverDate()
      }
    })

    return { code: 0 }
  } catch (err) {
    return { code: -1, msg: '删除商品失败', error: err.message }
  }
}
