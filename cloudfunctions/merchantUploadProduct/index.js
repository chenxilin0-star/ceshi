const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { name, image, requiredPoints, totalCount } = event
  const { OPENID } = cloud.getWXContext()

  // 参数校验
  if (!name || name.trim() === '') {
    return { code: -1, msg: '商品名称不能为空' }
  }
  if (!requiredPoints || requiredPoints <= 0) {
    return { code: -1, msg: '所需积分必须大于0' }
  }
  if (!totalCount || totalCount <= 0) {
    return { code: -1, msg: '商品总数必须大于0' }
  }

  try {
    const addRes = await db.collection('products').add({
      data: {
        name,
        image,
        requiredPoints,
        totalCount,
        remainingCount: totalCount,
        status: 'active',
        createdBy: OPENID,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })

    return { code: 0, productId: addRes._id }
  } catch (err) {
    return { code: -1, msg: '上传商品失败', error: err.message }
  }
}
