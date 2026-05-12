var util = require('../../utils/util.js')

Page({
  data: {
    isMerchant: false,
    checking: true
  },

  onLoad: function () {
    this.checkRole()
  },

  checkRole: function () {
    var that = this
    util.callFunction('checkMerchantRole').then(function (res) {
      if (res.code === 0 && res.isMerchant) {
        that.setData({ isMerchant: true, checking: false })
      } else {
        that.setData({ checking: false })
        wx.showModal({
          title: '无权限',
          content: '您不是商户，无法访问此页面',
          showCancel: false,
          success: function () {
            wx.navigateBack()
          }
        })
      }
    }).catch(function () {
      that.setData({ checking: false })
      wx.showToast({ title: '检查权限失败', icon: 'none' })
      wx.navigateBack()
    })
  },

  goProductManage: function () {
    wx.navigateTo({ url: '/pages/merchant-products/index' })
  },

  goVerify: function () {
    wx.navigateTo({ url: '/pages/merchant-verify/index' })
  },

  goVerifyLog: function () {
    wx.navigateTo({ url: '/pages/merchant-verify-log/index' })
  },

  goLotteryConfig: function () {
    wx.navigateTo({ url: '/pages/merchant-lottery/index' })
  },

  onShareAppMessage: function () {
    return util.shareToFriend('来趣测星球测测你的性格！', '/pages/index/index')
  },

  onShareTimeline: function () {
    return util.shareToTimeline('来趣测星球测测你的性格！')
  }
})
