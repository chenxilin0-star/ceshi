var util = require('../../utils/util.js')

Page({
  data: {
    tests: [],
    loading: true,
    userInfo: null,
    categoryEmojis: {
      '性格': '🎨',
      '心理': '🧘',
      '消费': '🛍',
      '恋爱': '💕',
      '社交': '🗣',
      '情绪': '🌊'
    },
    coverColors: {
      '性格': 'linear-gradient(135deg, #FF6B9D, #9B59B6)',
      '心理': 'linear-gradient(135deg, #9B59B6, #3498DB)',
      '消费': 'linear-gradient(135deg, #F39C12, #FF6B9D)',
      '恋爱': 'linear-gradient(135deg, #FF6B9D, #FF8A80)',
      '社交': 'linear-gradient(135deg, #3498DB, #2ECC71)',
      '情绪': 'linear-gradient(135deg, #9B59B6, #E91E63)'
    }
  },

  onLoad: function (options) {
    // 静默获取用户信息（不强制登录）
    var user = getApp().globalData.userInfo
    if (user) {
      this.setData({ userInfo: user })
    }
    getApp().globalData.loginPromise.then(function (result) {
      if (result.code === 0) {
        // 用户信息已由 app.js 存入 globalData
      }
    })

    this.loadTests()
  },

  onShow: function () {
    // 从登录页返回后刷新用户信息
    var user = getApp().globalData.userInfo
    if (user && user.nickName && user.nickName !== '微信用户') {
      this.setData({ userInfo: user })
    }
  },

  loadTests: function () {
    var that = this
    util.callFunction('getTests').then(function (res) {
      that.setData({
        tests: res.data || [],
        loading: false
      })
    }).catch(function (err) {
      console.error('getTests error', err)
      that.setData({ loading: false })
    })
  },

  // 点击测试 → 需要登录
  goTest: function (e) {
    var that = this
    var id = e.currentTarget.dataset.id
    getApp().requireLogin().then(function () {
      wx.navigateTo({
        url: '/pages/test-detail/index?testId=' + id
      })
    }).catch(function () {
      // 已跳转登录页，不需要额外处理
    })
  },

  // 去兑换 → 需要登录
  goProductList: function () {
    getApp().requireLogin().then(function () {
      wx.navigateTo({
        url: '/pages/product-list/index'
      })
    }).catch(function () {})
  },

  // 分享给朋友
  onShareAppMessage: function () {
    return util.shareToFriend('来趣测星球测测你的性格！', '/pages/index/index')
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    return util.shareToTimeline('来趣测星球测测你的性格！')
  }
})
