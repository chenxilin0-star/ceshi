var util = require('../../utils/util.js')

Page({
  data: {
    coupons: [],
    totalPoints: 0,
    loading: true
  },

  onLoad: function () {
    this.loadData()
  },

  loadData: function () {
    var that = this
    // Get user points
    util.callFunction('login').then(function (res) {
      if (res.code === 0) {
        that.setData({ totalPoints: res.user.totalPoints || 0 })
      }
    })
    // Get available coupons
    util.callFunction('getCoupons').then(function (res) {
      that.setData({
        coupons: res.data || [],
        loading: false
      })
    }).catch(function () {
      that.setData({ loading: false })
    })
  },

  redeem: function (e) {
    var id = e.currentTarget.dataset.id
    var points = e.currentTarget.dataset.points
    var that = this

    if (this.data.totalPoints < points) return

    wx.showModal({
      title: '确认兑换',
      content: '将消耗 ' + points + ' 积分兑换优惠券',
      success: function (res) {
        if (res.confirm) {
          that.doRedeem(id)
        }
      }
    })
  },

  doRedeem: function (templateId) {
    var that = this
    wx.showLoading({ title: '兑换中...' })
    util.callFunction('redeemCoupon', { templateId: templateId }).then(function (res) {
      wx.hideLoading()
      if (res.code === 0) {
        wx.showModal({
          title: '兑换成功',
          content: '核销码: ' + res.verifyCode + '\n有效期至: ' + res.expireAt.split('T')[0],
          showCancel: false,
          success: function () {
            that.loadData()
          }
        })
      } else {
        wx.showToast({ title: res.msg || '兑换失败', icon: 'none' })
      }
    }).catch(function () {
      wx.hideLoading()
      wx.showToast({ title: '兑换失败，请重试', icon: 'none' })
    })
  },

  onShareAppMessage: function () {
    return util.shareToFriend('趣测星球优惠券，免费领取好礼！', '/pages/index/index')
  },

  onShareTimeline: function () {
    return util.shareToTimeline('趣测星球优惠券，免费领取好礼！')
  }
})
