var util = require('../../utils/util.js')
var resultPresenter = require('../../utils/testResultPresenter.js')
var normalizeResult = resultPresenter.normalizeResult

Page({
  data: {
    result: null,
    loading: true
  },

  onLoad: function (options) {
    // 优先从 globalData 取结果数据（由 test-detail 页面存入）
    var lastResult = getApp().globalData.lastTestResult
    if (lastResult) {
      this.setData({
        result: normalizeResult(lastResult),
        loading: false
      })
      getApp().globalData.lastTestResult = null
      return
    }

    // 如果 globalData 没有数据，尝试用 resultId 从云端加载
    if (options.resultId) {
      this.loadResult(options.resultId)
    } else {
      this.setData({ loading: false })
    }
  },

  loadResult: function (resultId) {
    var that = this
    var db = wx.cloud.database()
    db.collection('results').doc(resultId).get().then(function (res) {
      that.setData({
        result: normalizeResult(res.data),
        loading: false
      })
    }).catch(function (err) {
      console.error('loadResult error', err)
      that.setData({ loading: false })
    })
  },

  goHome: function () {
    wx.switchTab({ url: '/pages/index/index' })
  },

  retryTest: function () {
    var testId = this.data.result ? this.data.result.testId : ''
    if (testId) {
      wx.redirectTo({
        url: '/pages/test-detail/index?testId=' + testId
      })
    } else {
      wx.switchTab({ url: '/pages/index/index' })
    }
  },

  onShareAppMessage: function () {
    var result = this.data.result
    var title = result
      ? '我在趣测星球生成了「' + result.resultTitle + '」'
      : '来趣测星球生成你的今日校园身份！'
    return util.shareToFriend(title, '/pages/index/index')
  },

  onShareTimeline: function () {
    var result = this.data.result
    var title = result
      ? '趣测星球：我的结果是「' + result.resultTitle + '」'
      : '趣测星球：每天一个校园身份'
    return util.shareToTimeline(title)
  }
})
