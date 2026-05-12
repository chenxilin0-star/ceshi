var util = require('../../utils/util.js')

Page({
  data: {
    products: [],
    totalPoints: 0,
    loading: true,
    redeeming: false
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
    // Get available products
    util.callFunction('getProducts').then(function (res) {
      that.setData({
        products: res.data || [],
        loading: false
      })
    }).catch(function () {
      that.setData({ loading: false })
    })
  },

  redeem: function (e) {
    if (this.data.redeeming) return
    var id = e.currentTarget.dataset.id
    var points = parseInt(e.currentTarget.dataset.points, 10) || 0
    var that = this
    var item = (this.data.products || []).find(function (x) { return x._id === id })

    if (!id || !item) {
      wx.showToast({ title: '商品不存在', icon: 'none' })
      return
    }
    if ((item.remainingCount || 0) <= 0) {
      wx.showToast({ title: '已兑完', icon: 'none' })
      return
    }
    if (this.data.totalPoints < points) {
      wx.showToast({ title: '积分不足', icon: 'none' })
      return
    }

    wx.showModal({
      title: '确认兑换',
      content: '将消耗 ' + points + ' 积分兑换商品',
      success: function (res) {
        if (res.confirm) {
          that.doRedeem(id)
        }
      }
    })
  },

  doRedeem: function (productId) {
    if (this.data.redeeming) return
    var that = this
    this.setData({ redeeming: true })
    wx.showLoading({ title: '兑换中...' })
    util.callFunction('redeemProduct', { productId: productId }).then(function (res) {
      wx.hideLoading()
      that.setData({ redeeming: false })
      if (res.code === 0) {
        wx.showModal({
          title: '兑换成功',
          content: '核销码: ' + res.verifyCode + '\n请凭核销码到店自提\n有效期至: ' + res.expireAt.split('T')[0],
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
      that.setData({ redeeming: false })
      wx.showToast({ title: '兑换失败，请重试', icon: 'none' })
    })
  },

  onShareAppMessage: function () {
    return util.shareToFriend('趣测星球积分商城，好礼等你来兑换！', '/pages/index/index')
  },

  onShareTimeline: function () {
    return util.shareToTimeline('趣测星球积分商城，好礼等你来兑换！')
  }
})
