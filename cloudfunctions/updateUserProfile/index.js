// 云函数：更新用户头像和昵称
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { nickName, avatarUrl } = event

  if (!nickName || !nickName.trim()) {
    return { code: -1, msg: '请输入昵称' }
  }

  // 查找用户
  var userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (userRes.data.length === 0) {
    // 不存在则创建（兼容未走 login 直接进此流程的情况）
    var now = new Date().toISOString()
    var addRes = await db.collection('users').add({
      data: {
        _openid: OPENID,
        nickName: nickName.trim(),
        avatarUrl: avatarUrl || '',
        totalPoints: 0,
        role: 'user',
        referrerId: '',
        referralCode: '',
        createTime: now,
        updateTime: now
      }
    })
    return {
      code: 0,
      user: {
        _id: addRes._id,
        _openid: OPENID,
        nickName: nickName.trim(),
        avatarUrl: avatarUrl || '',
        totalPoints: 0,
        role: 'user',
        referrerId: '',
        referralCode: ''
      }
    }
  }

  // 已存在则更新
  var user = userRes.data[0]
  var updateData = {
    nickName: nickName.trim(),
    avatarUrl: avatarUrl || user.avatarUrl || '',
    updateTime: new Date().toISOString()
  }

  await db.collection('users').doc(user._id).update({
    data: updateData
  })

  return {
    code: 0,
    user: {
      _id: user._id,
      _openid: user._openid,
      nickName: updateData.nickName,
      avatarUrl: updateData.avatarUrl,
      totalPoints: user.totalPoints || 0,
      role: user.role || 'user',
      referrerId: user.referrerId || '',
      referralCode: user.referralCode || ''
    }
  }
}
