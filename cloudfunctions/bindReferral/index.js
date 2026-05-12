// 云函数：绑定分销关系
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { referrerId } = event

  // 1. 查询当前用户
  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (userRes.data.length === 0) {
    return { code: -1, msg: '用户不存在' }
  }
  const user = userRes.data[0]
  const userId = user._id

  // 2. 不能绑定自己
  if (userId === referrerId) {
    return { code: -1, msg: '不能绑定自己为推荐人' }
  }

  // 3. 检查是否已有推荐人
  const existRef = await db.collection('referrals').where({ referredId: userId }).get()
  if (existRef.data.length > 0) {
    return { code: -2, msg: '您已有推荐人，无法重复绑定' }
  }

  // 4. 检查推荐人是否存在
  let referrer
  try {
    const referrerRes = await db.collection('users').doc(referrerId).get()
    referrer = referrerRes.data
  } catch (e) {
    return { code: -3, msg: '推荐人不存在' }
  }

  // 5. 添加分销记录
  await db.collection('referrals').add({
    data: {
      referrerId: referrerId,
      referredId: userId,
      createTime: db.serverDate()
    }
  })

  // 6. 更新用户的推荐人字段
  await db.collection('users').doc(userId).update({
    data: {
      referrerId: referrerId,
      updateTime: db.serverDate()
    }
  })

  return {
    code: 0,
    bound: true,
    referrerName: referrer.nickName || referrer.name || '未知用户'
  }
}
