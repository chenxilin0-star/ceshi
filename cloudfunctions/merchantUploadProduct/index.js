const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function isPositiveInteger(value) {
  return /^\d+$/.test(String(value)) && parseInt(value, 10) > 0
}

async function isMerchant(OPENID) {
  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (userRes.data.length > 0 && userRes.data[0].role === 'merchant') {
    return true
  }
  try {
    const configRes = await db.collection('merchantConfig').doc('config').get()
    return !!(configRes.data && configRes.data.merchantOpenids && configRes.data.merchantOpenids.includes(OPENID))
  } catch (e) {
    return false
  }
}

exports.main = async (event, context) => {
  const { name, image, requiredPoints, totalCount } = event
  const { OPENID } = cloud.getWXContext()

  if (!(await isMerchant(OPENID))) {
    return { code: -10, msg: '无权限操作' }
  }

  var points = parseInt(requiredPoints, 10)
  var count = parseInt(totalCount, 10)

  // 参数校验
  if (!name || name.trim() === '') {
    return { code: -1, msg: '商品名称不能为空' }
  }
  if (!image) {
    return { code: -1, msg: '请上传商品图片' }
  }
  if (!isPositiveInteger(requiredPoints)) {
    return { code: -1, msg: '所需积分必须为正整数' }
  }
  if (!isPositiveInteger(totalCount)) {
    return { code: -1, msg: '商品总数必须为正整数' }
  }

  try {
    const addRes = await db.collection('products').add({
      data: {
        name: name.trim(),
        image,
        requiredPoints: points,
        totalCount: count,
        remainingCount: count,
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
