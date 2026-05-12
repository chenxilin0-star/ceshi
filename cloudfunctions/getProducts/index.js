const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const result = await db.collection('products')
      .where({
        status: 'active',
        remainingCount: _.gt(0)
      })
      .orderBy('createTime', 'desc')
      .get()

    return {
      code: 0,
      data: result.data
    }
  } catch (err) {
    return {
      code: -1,
      message: err.message
    }
  }
}
