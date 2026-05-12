var util = require('../../utils/util.js')

function buildFallbackDesc(result) {
  var title = result.resultTitle || '你的校园趣测结果'
  var testTitle = result.testTitle || '本次测试'
  var questionCount = result.questionCount || 0
  var countText = questionCount ? ('你刚刚完成了 ' + questionCount + ' 道题，') : ''
  return countText + '系统根据你在「' + testTitle + '」里的选择生成了「' + title + '」。这份结果适合当作今天的校园娱乐参考，不代表固定标签，也不需要太认真。'
}

function buildSuggestion(result) {
  var text = [result.category || '', result.testTitle || '', result.resultTitle || ''].join('')
  if (text.indexOf('干饭') >= 0 || text.indexOf('奶茶') >= 0 || text.indexOf('消费') >= 0 || text.indexOf('食堂') >= 0) {
    return '今日建议：先给自己补点能量，再处理一个最容易完成的小任务。'
  }
  if (text.indexOf('朋友') >= 0 || text.indexOf('同桌') >= 0 || text.indexOf('群聊') >= 0 || text.indexOf('社交') >= 0 || text.indexOf('搭子') >= 0) {
    return '今日建议：可以找一个熟悉的人聊两句，轻松一点就好，不用强行营业。'
  }
  if (text.indexOf('摆烂') >= 0 || text.indexOf('回血') >= 0 || text.indexOf('拖延') >= 0 || text.indexOf('犯困') >= 0 || text.indexOf('电量') >= 0) {
    return '今日建议：允许自己慢一点，但别完全关机。先做一个 5 分钟能完成的小动作。'
  }
  if (text.indexOf('人设') >= 0 || text.indexOf('显眼包') >= 0 || text.indexOf('班级') >= 0 || text.indexOf('宿舍') >= 0 || text.indexOf('性格') >= 0) {
    return '今日建议：保留你的校园特色，但不用被任何标签框住，舒服地做自己就行。'
  }
  return '今日建议：把结果当作一张轻松的状态卡，顺手完成一个小目标，给今天加一点确定感。'
}

function normalizeResult(result) {
  var data = result || {}
  var normalized = {}
  for (var key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      normalized[key] = data[key]
    }
  }
  normalized.resultTitle = normalized.resultTitle || '你的校园趣测结果已生成'
  normalized.resultEmoji = normalized.resultEmoji || '🌟'
  normalized.resultDesc = normalized.resultDesc || buildFallbackDesc(normalized)
  normalized.resultSuggestion = normalized.resultSuggestion || buildSuggestion(normalized)
  normalized.testTitle = normalized.testTitle || '校园趣测'
  normalized.score = typeof normalized.score === 'number' ? normalized.score : 0
  return normalized
}

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
