const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    // 验证当前用户是否为商户
    const userRes = await db.collection('users')
      .where({ _openid: OPENID })
      .get()

    let isMerchant = false
    if (userRes.data.length > 0 && userRes.data[0].role === 'merchant') {
      isMerchant = true
    }

    if (!isMerchant) {
      try {
        const configRes = await db.collection('merchantConfig').doc('config').get()
        if (configRes.data && configRes.data.merchantOpenids && configRes.data.merchantOpenids.includes(OPENID)) {
          isMerchant = true
        }
      } catch (e) {
        // merchantConfig 文档可能不存在
      }
    }

    if (!isMerchant) {
      return { code: -10, msg: '无权限操作' }
    }

    // 查询核销记录，按时间倒序，最多50条
    const logRes = await db.collection('verifyLogs')
      .orderBy('createTime', 'desc')
      .limit(50)
      .get()

    return { code: 0, list: logRes.data }
  } catch (err) {
    return { code: -1, msg: '查询失败', error: err.message }
  }
}
