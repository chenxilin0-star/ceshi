var util = require('../../utils/util.js')

Page({
  data: {
    referralCount: 0,
    totalReferralPoints: 0,
    referralCode: '',
    referrals: [],
    referralPoints: [],
    loading: true
  },

  onLoad: function () {
    // 不在这里调 loadData，由 onShow 统一处理
  },

  onShow: function () {
    this.loadData()
  },

  loadData: function () {
    this.getStats()
    this.getReferralPoints()
  },

  getStats: function () {
    var that = this
    util.callFunction('getReferralStats').then(function (res) {
      if (res.code === 0) {
        that.setData({
          referralCount: res.referralCount || 0,
          totalReferralPoints: res.totalReferralPoints || 0,
          referralCode: res.referralCode || ''
        })
      }
    })
  },

  getReferralPoints: function () {
    var that = this
    util.callFunction('getReferralPoints').then(function (res) {
      var list = (res.list || []).map(function (item) {
        item.createTimeShort = util.formatTime(item.createTime)
        return item
      })
      that.setData({
        referralPoints: list,
        loading: false
      })
    }).catch(function () {
      that.setData({ loading: false })
    })
  },

  onShareAppMessage: function () {
    return util.shareToFriend('来趣测星球测测你的性格！', '/pages/index/index')
  },

  onShareTimeline: function () {
    return util.shareToTimeline('来趣测星球测测你的性格！')
  }
})
