var util = require('../../utils/util.js')

Page({
  data: {
    coupons: [],
    filteredCoupons: [],
    activeTab: 'unused',
    unusedCount: 0
  },

  onLoad: function () {
    this.loadCoupons()
  },

  onShow: function () {
    this.loadCoupons()
  },

  loadCoupons: function () {
    var that = this
    util.callFunction('getMyCoupons').then(function (res) {
      var now = new Date()
      var coupons = (res.list || []).map(function (item) {
        item.expireAtShort = item.expireAt ? item.expireAt.split('T')[0] : '--'
        item.usedAtShort = item.usedAt ? util.formatTime(item.usedAt) : ''
        // Create masked version of verify code
        if (item.verifyCode && item.verifyCode.length === 8) {
          item.verifyCodeMasked = item.verifyCode.substring(0, 2) + '****' + item.verifyCode.substring(6)
        }
        item.showCode = false

        // 实时判断过期状态：数据库中 status 为 unused 但已过期的券应显示为 expired
        if (item.status === 'unused' && item.expireAt) {
          var expireDate = new Date(item.expireAt)
          if (expireDate <= now) {
            item.status = 'expired'
          }
        }

        return item
      })
      var unusedCount = coupons.filter(function (c) { return c.status === 'unused' }).length
      that.setData({
        coupons: coupons,
        unusedCount: unusedCount
      })
      that.filterCoupons()
    }).catch(function (err) {
      console.error('getMyCoupons error', err)
    })
  },

  switchTab: function (e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab })
    this.filterCoupons()
  },

  filterCoupons: function () {
    var tab = this.data.activeTab
    var filtered = this.data.coupons.filter(function (c) { return c.status === tab })
    this.setData({ filteredCoupons: filtered })
  },

  toggleCode: function (e) {
    var id = e.currentTarget.dataset.id
    var coupons = this.data.coupons
    for (var i = 0; i < coupons.length; i++) {
      if (coupons[i]._id === id) {
        coupons[i].showCode = !coupons[i].showCode
        break
      }
    }
    this.setData({ coupons: coupons })
    this.filterCoupons()
  },

  onShareAppMessage: function () {
    return util.shareToFriend('我在趣测星球领取了优惠券，快来看看！', '/pages/index/index')
  },

  onShareTimeline: function () {
    return util.shareToTimeline('我在趣测星球领取了优惠券，快来看看！')
  }
})
