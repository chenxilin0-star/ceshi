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

  buildAnswerSummaryFromDetail: function (result, detail) {
    var questions = (detail && detail.questions) || []
    var answers = (result && result.answers) || []
    var summary = []
    for (var i = 0; i < questions.length; i++) {
      var q = questions[i] || {}
      var idx = answers[i]
      var option = q.options && q.options[idx] ? q.options[idx] : null
      summary.push({
        question: q.title || q.question || ('第' + (i + 1) + '题'),
        selectedText: option ? (option.text || option.label || '') : '',
        score: option ? (option.score || 0) : 0,
        dimension: option ? (option.dimension || '') : ''
      })
    }
    return summary
  },

  loadResult: function (resultId) {
    var that = this
    var db = wx.cloud.database()
    db.collection('results').doc(resultId).get().then(function (res) {
      var rawResult = res.data || {}
      if (rawResult.testId && rawResult.answers && !rawResult.answerSummary) {
        util.callFunction('getTestDetail', { testId: rawResult.testId }).then(function (detailRes) {
          if (detailRes.code === 0) rawResult.answerSummary = that.buildAnswerSummaryFromDetail(rawResult, detailRes.data)
          that.setData({
            result: normalizeResult(rawResult),
            loading: false
          })
        }).catch(function () {
          that.setData({
            result: normalizeResult(rawResult),
            loading: false
          })
        })
        return
      }
      that.setData({
        result: normalizeResult(rawResult),
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
