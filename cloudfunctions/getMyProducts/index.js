const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  // Query user by openid
  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (!userRes.data || userRes.data.length === 0) {
    return { code: 0, list: [] }
  }
  const user = userRes.data[0]

  // Query user's redeemed products (stored in userCoupons collection)
  const couponRes = await db.collection('userCoupons')
    .where({ userId: user._id })
    .orderBy('createTime', 'desc')
    .get()

  if (!couponRes.data || couponRes.data.length === 0) {
    return { code: 0, list: [] }
  }

  const userCoupons = couponRes.data

  // Collect all templateId values (product IDs)
  const templateIds = [...new Set(userCoupons.map(uc => uc.templateId).filter(Boolean))]

  if (templateIds.length === 0) {
    const list = userCoupons.map(uc => ({
      ...uc,
      productName: '',
      productImage: ''
    }))
    return { code: 0, list }
  }

  // Batch query products collection using _.in
  const productRes = await db.collection('products')
    .where({ _id: _.in(templateIds) })
    .get()

  // Build templateMap from results
  const templateMap = {}
  if (productRes.data) {
    productRes.data.forEach(product => {
      templateMap[product._id] = product
    })
  }

  // Map each userCoupon to include product info
  const list = userCoupons.map(uc => {
    const template = templateMap[uc.templateId] || {}
    return {
      ...uc,
      productName: template.name || '',
      productImage: template.image || ''
    }
  })

  return { code: 0, list }
}
