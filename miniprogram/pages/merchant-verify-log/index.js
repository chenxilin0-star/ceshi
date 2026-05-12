var util = require('../../utils/util.js')

Page({
  data: {
    logs: [],
    loading: true
  },

  onLoad: function () {
    this.loadLogs()
  },

  loadLogs: function () {
    var that = this
    util.callFunction('getVerifyLogs').then(function (res) {
      if (res.code !== 0) {
        wx.showToast({ title: res.msg || '查询失败', icon: 'none' })
        that.setData({ loading: false })
        return
      }
      var logs = (res.list || []).map(function (item) {
        item.createTimeShort = item.createTime ? item.createTime.split('T')[0] + ' ' + (item.createTime.split('T')[1] || '').substring(0, 5) : '--'
        return item
      })
      that.setData({ logs: logs, loading: false })
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
