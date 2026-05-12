const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    var query = db.collection('tests').where({
      status: _.neq('disabled')
    })

    var res = await query.orderBy('order', 'asc').orderBy('createTime', 'desc').get()
    var list = (res.data || []).map(function (item) {
      return {
        _id: item._id,
        title: item.title || '',
        description: item.description || '',
        category: item.category || '',
        cover: item.cover || '',
        questionCount: item.questionCount || 0,
        requiredPoints: item.requiredPoints || 0,
        status: item.status || 'active',
        order: item.order || 0,
        createTime: item.createTime || ''
      }
    })

    return { code: 0, data: list }
  } catch (err) {
    console.error('getTests error:', err)
    return { code: -1, msg: '获取测试列表失败', message: err.message || '获取测试列表失败' }
  }
}
