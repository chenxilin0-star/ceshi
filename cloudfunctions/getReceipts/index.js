// 云函数：获取消费记录
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  // 1. 查询用户
  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (userRes.data.length === 0) {
    return { code: -1, msg: '用户不存在' }
  }
  const user = userRes.data[0]

  // 2. 查询消费记录
  const receiptsRes = await db.collection('receipts')
    .where({ userId: user._id })
    .orderBy('createTime', 'desc')
    .limit(50)
    .get()

  return {
    code: 0,
    list: receiptsRes.data
  }
}
