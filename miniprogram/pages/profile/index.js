var util = require('../../utils/util.js')

Page({
  data: {
    userInfo: null,
    productCount: 0,
    isMerchant: false
  },

  onLoad: function () {
    this.loadData()
  },

  onShow: function () {
    this.loadData()
  },

  loadData: function () {
    var that = this
    var user = getApp().globalData.userInfo
    if (user && user.nickName && user.nickName !== '微信用户') {
      that.setData({
        userInfo: user,
        isMerchant: user.role === 'merchant'
      })
    }

    util.callFunction('getMyProducts').then(function (res) {
      if (res.code === 0) {
        var unused = (res.list || []).filter(function (p) { return p.status === 'unused' }).length
        that.setData({ productCount: unused })
      }
    })
  },

  goPage: function (e) {
    var url = e.currentTarget.dataset.url
    // tabBar 页面只能用 switchTab 跳转
    var tabPages = ['/pages/index/index', '/pages/points/index', '/pages/referral/index', '/pages/profile/index']
    if (tabPages.indexOf(url) >= 0) {
      wx.switchTab({ url: url })
    } else {
      wx.navigateTo({ url: url })
    }
  },

  logout: function () {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: function (res) {
        if (res.confirm) {
          wx.clearStorageSync()
          var app = getApp()
          app.globalData.userInfo = null
          app.globalData.loginPromise = app.doLogin()
          wx.reLaunch({
            url: '/pages/index/index'
          })
        }
      }
    })
  },

  onShareAppMessage: function () {
    return util.shareToFriend('来趣测星球测测你的性格！', '/pages/index/index')
  },

  onShareTimeline: function () {
    return util.shareToTimeline('来趣测星球测测你的性格！')
  }
})
