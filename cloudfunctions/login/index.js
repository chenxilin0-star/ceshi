const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function generateShortCode(len) {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  var result = ''
  for (var i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  var userRes = await db.collection('users').where({ _openid: OPENID }).get()

  if (userRes.data.length === 0) {
    // Generate unique referral code
    var referralCode = generateShortCode(6)
    var codeExists = true
    while (codeExists) {
      var check = await db.collection('users').where({ referralCode: referralCode }).get()
      if (check.data.length === 0) {
        codeExists = false
      } else {
        referralCode = generateShortCode(6)
      }
    }

    var now = new Date().toISOString()
    var addRes = await db.collection('users').add({
      data: {
        _openid: OPENID,
        nickName: '微信用户',
        avatarUrl: '',
        totalPoints: 0,
        role: 'user',
        referrerId: '',
        referralCode: referralCode,
        createTime: now,
        updateTime: now
      }
    })

    return {
      code: 0,
      user: {
        _id: addRes._id,
        _openid: OPENID,
        nickName: '微信用户',
        avatarUrl: '',
        totalPoints: 0,
        role: 'user',
        referrerId: '',
        referralCode: referralCode
      }
    }
  }

  var user = userRes.data[0]
  return {
    code: 0,
    user: {
      _id: user._id,
      _openid: user._openid,
      nickName: user.nickName || '微信用户',
      avatarUrl: user.avatarUrl || '',
      totalPoints: user.totalPoints || 0,
      role: user.role || 'user',
      referrerId: user.referrerId || '',
      referralCode: user.referralCode || ''
    }
  }
}
