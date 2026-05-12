var util = require('../../utils/util.js')

Page({
  data: {
    verifyCode: '',
    result: null,
    verifying: false
  },

  onCodeInput: function (e) {
    this.setData({ verifyCode: e.detail.value.toUpperCase(), result: null })
  },

  scanCode: function () {
    var that = this
    wx.scanCode({
      success: function (res) {
        var code = (res.result || '').toUpperCase()
        that.setData({ verifyCode: code })
      }
    })
  },

  doVerify: function () {
    var code = this.data.verifyCode.trim()
    if (!code) {
      wx.showToast({ title: '请输入核销码', icon: 'none' })
      return
    }

    var that = this
    this.setData({ verifying: true })
    util.callFunction('verifyProduct', { verifyCode: code }).then(function (res) {
      that.setData({ verifying: false })
      if (res.code === 0) {
        that.setData({
          result: { success: true, msg: '核销成功', productName: res.productName || '商品' }
        })
        wx.showToast({ title: '核销成功', icon: 'success' })
      } else {
        that.setData({
          result: { success: false, msg: res.msg || '核销失败' }
        })
      }
    }).catch(function () {
      that.setData({ verifying: false, result: { success: false, msg: '网络错误' } })
    })
  },

  onShareAppMessage: function () {
    return util.shareToFriend('来趣测星球测测你的性格！', '/pages/index/index')
  },

  onShareTimeline: function () {
    return util.shareToTimeline('来趣测星球测测你的性格！')
  }
})
