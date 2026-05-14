var util = require('../../utils/util.js')

Page({
  data: {
    test: null,
    questions: [],
    currentIndex: 0,
    answers: [],
    selectedOption: -1,
    loading: true,
    submitting: false,
    transitioning: false
  },

  onLoad: function (options) {
    if (options && options.testId) {
      this.loadTestDetail(options.testId)
    } else {
      this.setData({ loading: false })
      wx.showToast({ title: '缺少测试参数', icon: 'none' })
      setTimeout(function () { wx.navigateBack() }, 1200)
    }
  },

  loadTestDetail: function (testId) {
    var that = this
    util.callFunction('getTestDetail', { testId: testId }).then(function (res) {
      if (res.code === 0) {
        that.setData({
          test: res.data.test,
          questions: res.data.questions,
          answers: new Array(res.data.questions.length).fill(-1),
          loading: false
        })
        wx.setNavigationBarTitle({ title: res.data.test.title || '心理测试' })
      } else {
        wx.showToast({ title: '加载失败', icon: 'none' })
        that.setData({ loading: false })
      }
    }).catch(function (err) {
      console.error('getTestDetail error', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      that.setData({ loading: false })
    })
  },

  // 选择选项 → 自动跳下一题或提交
  selectOption: function (e) {
    var that = this
    if (that.data.transitioning || that.data.submitting) return

    var idx = e.currentTarget.dataset.idx
    var answers = that.data.answers.slice()
    answers[that.data.currentIndex] = idx

    that.setData({
      selectedOption: idx,
      answers: answers,
      transitioning: true
    })

    // 选中后短暂高亮，然后自动跳转
    setTimeout(function () {
      // 判断是否最后一题
      if (that.data.currentIndex >= that.data.questions.length - 1) {
        that.submitTest()
      } else {
        var nextIdx = that.data.currentIndex + 1
        that.setData({
          currentIndex: nextIdx,
          selectedOption: answers[nextIdx] >= 0 ? answers[nextIdx] : -1,
          transitioning: false
        })
      }
    }, 400)
  },

  // 上一题
  prevQuestion: function () {
    if (this.data.currentIndex <= 0 || this.data.transitioning) return
    var prevIdx = this.data.currentIndex - 1
    this.setData({
      currentIndex: prevIdx,
      selectedOption: this.data.answers[prevIdx] >= 0 ? this.data.answers[prevIdx] : -1
    })
  },

  buildAnswerSummary: function () {
    var questions = this.data.questions || []
    var answers = this.data.answers || []
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

  // 提交测试（只传 testId 和 answers，服务端计算分数和结果）
  submitTest: function () {
    var that = this
    if (that.data.submitting) return

    var test = that.data.test
    var questions = that.data.questions || []
    var answers = that.data.answers || []
    if (!test || !test._id || questions.length === 0) {
      wx.showToast({ title: '测试数据异常', icon: 'none' })
      return
    }
    if (answers.length < questions.length || answers.some(function (a) { return a < 0 })) {
      wx.showToast({ title: '请完成所有题目', icon: 'none' })
      that.setData({ transitioning: false })
      return
    }

    that.setData({ submitting: true })

    util.callFunction('submitTest', {
      testId: test._id,
      answers: answers
    }).then(function (res) {
      that.setData({ submitting: false })
      if (res.code === 0) {
        getApp().globalData.lastTestResult = {
          resultId: res.resultId,
          testTitle: test.title,
          category: test.category,
          score: res.score,
          resultTitle: res.resultTitle,
          resultDesc: res.resultDesc,
          resultEmoji: res.resultEmoji || '',
          questionCount: res.questionCount || that.data.questions.length,
          answerSummary: that.buildAnswerSummary(),
          createTime: new Date().toISOString()
        }
        wx.redirectTo({
          url: '/pages/test-result/index?resultId=' + res.resultId
        })
      } else {
        wx.showToast({ title: res.message || '提交失败', icon: 'none' })
        that.setData({ transitioning: false })
      }
    }).catch(function (err) {
      console.error('submitTest error', err)
      that.setData({ submitting: false, transitioning: false })
      wx.showToast({ title: '提交失败', icon: 'none' })
    })
  },

  onShareAppMessage: function () {
    var test = this.data.test
    return util.shareToFriend(
      test ? '来趣测星球测测' + test.title : '来趣测星球测测你的性格！',
      '/pages/index/index'
    )
  }
})
