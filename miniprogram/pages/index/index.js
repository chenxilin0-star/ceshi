var util = require('../../utils/util.js')

var CAMPUS_CATEGORIES = [
  {
    key: 'daily',
    title: '今日校园状态',
    subtitle: '每天一个校园身份',
    emoji: '🌈',
    tag: '每日必看',
    themeClass: 'theme-daily',
    keywords: ['今日', '状态', '校园状态', '关键词', '犯困', '摸鱼']
  },
  {
    key: 'persona',
    title: '校园人设测试',
    subtitle: '看看你的班级隐藏角色',
    emoji: '😎',
    tag: '超有梗',
    themeClass: 'theme-persona',
    keywords: ['人设', '显眼包', '班级', '宿舍', '下课', '上课', '性格']
  },
  {
    key: 'food',
    title: '干饭奶茶人格',
    subtitle: '今天吃点什么才回血',
    emoji: '🧋',
    tag: '福利相关',
    themeClass: 'theme-food',
    keywords: ['干饭', '奶茶', '食堂', '吃什么', '小卖部', '夜宵', '消费']
  },
  {
    key: 'recharge',
    title: '摆烂回血测试',
    subtitle: '先充点电再出发',
    emoji: '🔋',
    tag: '懂你一下',
    themeClass: 'theme-recharge',
    keywords: ['摆烂', '回血', '拖延', '犯困', '明天再说', '电量', '情绪']
  },
  {
    key: 'friends',
    title: '朋友搭子角色',
    subtitle: '你在群聊里是哪种人',
    emoji: '👯',
    tag: '适合一起测',
    themeClass: 'theme-friends',
    keywords: ['朋友', '同桌', '群聊', '搭子', '社交']
  },
  {
    key: 'task',
    title: '每日小任务',
    subtitle: '轻松拿一点星球能量',
    emoji: '⭐',
    tag: '积分感',
    themeClass: 'theme-task',
    keywords: ['任务', '积分', '打卡', '挑战']
  }
]

var DAILY_TASKS = [
  { emoji: '💧', title: '喝一瓶水', desc: '先让自己回血一点', rewardText: '+1 能量' },
  { emoji: '⏱', title: '做个 5 分钟小目标', desc: '不用很努力，动一下就行', rewardText: '+3 能量' },
  { emoji: '🤝', title: '给朋友一句鼓励', desc: '今天也当一次气氛组', rewardText: '+2 能量' }
]

function getSafeText(value) {
  return (value || '').toString()
}

function matchCategory(test, category) {
  var text = [
    getSafeText(test.category),
    getSafeText(test.title),
    getSafeText(test.description)
  ].join('')
  for (var i = 0; i < category.keywords.length; i++) {
    if (text.indexOf(category.keywords[i]) >= 0) return true
  }
  return false
}

function getCategoryByKey(key) {
  for (var i = 0; i < CAMPUS_CATEGORIES.length; i++) {
    if (CAMPUS_CATEGORIES[i].key === key) return CAMPUS_CATEGORIES[i]
  }
  return CAMPUS_CATEGORIES[0]
}

function getDisplayCategory(test) {
  for (var i = 0; i < CAMPUS_CATEGORIES.length; i++) {
    if (matchCategory(test, CAMPUS_CATEGORIES[i])) return CAMPUS_CATEGORIES[i]
  }
  return {
    key: 'other',
    title: test.category || '校园趣测',
    subtitle: '轻松测一下',
    emoji: '🎯',
    tag: '推荐',
    themeClass: 'theme-other',
    keywords: []
  }
}

function decorateTests(tests) {
  var list = (tests || []).slice()
  list.sort(function (a, b) {
    return getPriority(a) - getPriority(b)
  })
  return list.map(function (item) {
    var category = getDisplayCategory(item)
    return {
      _id: item._id,
      title: item.title || '校园趣味测试',
      description: item.description || '几道题看看你的校园隐藏属性',
      category: item.category || category.title,
      displayCategory: category.title,
      displayEmoji: category.emoji,
      themeClass: category.themeClass,
      questionCount: item.questionCount || 0,
      requiredPoints: item.requiredPoints || 0,
      status: item.status || 'active',
      order: item.order || 0,
      createTime: item.createTime || ''
    }
  })
}

function getPriority(test) {
  for (var i = 0; i < CAMPUS_CATEGORIES.length; i++) {
    if (matchCategory(test, CAMPUS_CATEGORIES[i])) return i
  }
  return 99
}

function findTestByCategory(tests, categoryKey) {
  var category = getCategoryByKey(categoryKey)
  for (var i = 0; i < tests.length; i++) {
    if (matchCategory(tests[i], category)) return tests[i]
  }
  return null
}

Page({
  data: {
    tests: [],
    rawTests: [],
    loading: true,
    userInfo: null,
    campusCategories: CAMPUS_CATEGORIES,
    dailyTasks: DAILY_TASKS,
    featuredTest: null,
    todayCard: {
      title: '生成我的今日身份',
      keyword: '校园状态加载中',
      desc: '每天一个轻松校园标签，测完还能去领积分福利',
      emoji: '🌈'
    }
  },

  onLoad: function (options) {
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
    var user = getApp().globalData.userInfo
    if (user && user.nickName && user.nickName !== '微信用户') {
      this.setData({ userInfo: user })
    }
  },

  loadTests: function () {
    var that = this
    util.callFunction('getTests').then(function (res) {
      var rawTests = res.data || []
      var decoratedTests = decorateTests(rawTests)
      var featuredTest = findTestByCategory(rawTests, 'daily') || rawTests[0] || null
      that.setData({
        rawTests: rawTests,
        tests: decoratedTests,
        featuredTest: featuredTest,
        todayCard: that.buildTodayCard(featuredTest),
        loading: false
      })
    }).catch(function (err) {
      console.error('getTests error', err)
      that.setData({
        loading: false,
        todayCard: that.buildTodayCard(null)
      })
    })
  },

  buildTodayCard: function (featuredTest) {
    if (featuredTest) {
      return {
        title: featuredTest.title || '今日校园状态',
        keyword: '今日身份待生成',
        desc: featuredTest.description || '30 秒看看你今天是哪种校园状态',
        emoji: getDisplayCategory(featuredTest).emoji || '🌈'
      }
    }
    return {
      title: '今日校园状态',
      keyword: '内容准备中',
      desc: '今天的校园身份卡正在上新，先去看看积分福利吧',
      emoji: '🌈'
    }
  },

  goFeaturedTest: function () {
    var test = this.data.featuredTest || this.data.rawTests[0]
    if (!test || !test._id) {
      wx.showToast({ title: '今日内容准备中', icon: 'none' })
      return
    }
    this.openTest(test._id)
  },

  goCategory: function (e) {
    var key = e.currentTarget.dataset.key
    var test = findTestByCategory(this.data.rawTests || [], key)
    if (!test || !test._id) {
      wx.showToast({ title: '内容上新中', icon: 'none' })
      return
    }
    this.openTest(test._id)
  },

  goTaskAction: function () {
    wx.showToast({ title: '完成测试或消费可获得积分', icon: 'none' })
  },

  goTest: function (e) {
    var id = e.currentTarget.dataset.id
    if (!id) {
      wx.showToast({ title: '测试不存在', icon: 'none' })
      return
    }
    this.openTest(id)
  },

  openTest: function (id) {
    getApp().requireLogin().then(function () {
      wx.navigateTo({
        url: '/pages/test-detail/index?testId=' + id
      })
    }).catch(function () {
      // 已跳转登录页，不需要额外处理
    })
  },

  goProductList: function () {
    getApp().requireLogin().then(function () {
      wx.navigateTo({
        url: '/pages/product-list/index'
      })
    }).catch(function () {})
  },

  goPoints: function () {
    getApp().requireLogin().then(function () {
      wx.navigateTo({
        url: '/pages/points/index'
      })
    }).catch(function () {})
  },

  onShareAppMessage: function () {
    return util.shareToFriend('来趣测星球生成你的今日校园身份！', '/pages/index/index')
  },

  onShareTimeline: function () {
    return util.shareToTimeline('趣测星球：每天一个校园身份')
  }
})
