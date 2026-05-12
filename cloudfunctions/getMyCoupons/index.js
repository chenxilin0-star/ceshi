// 云函数：获取券包
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  // 1. 查询用户
  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (userRes.data.length === 0) {
    return { code: -1, msg: '用户不存在' }
  }
  const user = userRes.data[0]

  // 2. 查询用户券
  const userCouponsRes = await db.collection('userCoupons')
    .where({ userId: user._id })
    .orderBy('createTime', 'desc')
    .get()

  if (userCouponsRes.data.length === 0) {
    return { code: 0, list: [] }
  }

  // 3. 批量收集所有 templateId 并一次性查询券模板
  const templateIds = []
  for (const uc of userCouponsRes.data) {
    if (uc.templateId && templateIds.indexOf(uc.templateId) === -1) {
      templateIds.push(uc.templateId)
    }
  }

  const templateMap = {}
  if (templateIds.length > 0) {
    // 使用 in 操作符批量查询所有相关券模板
    const templatesRes = await db.collection('coupons')
      .where({ _id: _.in(templateIds) })
      .get()
    for (const t of templatesRes.data) {
      templateMap[t._id] = t
    }
  }

  // 4. 组装结果
  const list = userCouponsRes.data.map(function (uc) {
    const template = templateMap[uc.templateId]
    return {
      ...uc,
      templateName: template ? template.name : '未知券',
      faceValue: template ? template.faceValue : 0
    }
  })

  return {
    code: 0,
    list: list
  }
}
