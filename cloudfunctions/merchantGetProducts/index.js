const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    const res = await db.collection('products')
      .where({
        createdBy: OPENID
      })
      .orderBy('createTime', 'desc')
      .get()

    return { code: 0, data: res.data }
  } catch (err) {
    return { code: -1, msg: '获取商品列表失败', error: err.message }
  }
}
