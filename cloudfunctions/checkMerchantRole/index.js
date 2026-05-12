const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    // Check users collection for merchant role
    const userRes = await db.collection('users')
      .where({ _openid: OPENID })
      .get()

    let isMerchantByRole = false
    if (userRes.data && userRes.data.length > 0) {
      const user = userRes.data[0]
      isMerchantByRole = user.role === 'merchant'
    }

    // Check merchantConfig collection for merchantOpenids array
    let isMerchantByConfig = false
    try {
      const configRes = await db.collection('merchantConfig')
        .doc('config')
        .get()

      if (configRes.data && Array.isArray(configRes.data.merchantOpenids)) {
        isMerchantByConfig = configRes.data.merchantOpenids.includes(OPENID)
      }
    } catch (err) {
      // config document may not exist, treat as not a merchant
      isMerchantByConfig = false
    }

    const isMerchant = isMerchantByRole || isMerchantByConfig

    return {
      code: 0,
      isMerchant
    }
  } catch (err) {
    return {
      code: -1,
      isMerchant: false,
      message: err.message || '查询失败'
    }
  }
}
