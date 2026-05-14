const assert = require('assert')
const presenter = require('../miniprogram/utils/testResultPresenter')

function run(name, fn) {
  try {
    fn()
    console.log('✓ ' + name)
  } catch (err) {
    console.error('✗ ' + name)
    throw err
  }
}

function sample(category, title, resultTitle) {
  return presenter.normalizeResult({
    category: category,
    testTitle: title,
    resultTitle: resultTitle,
    resultDesc: '原始结果说明。',
    resultEmoji: '🌟',
    score: 12,
    questionCount: 5,
    testId: 'test-1'
  })
}

run('all homepage test themes generate a complete report', function () {
  var cases = [
    sample('今日校园状态', '今日校园状态检测', '半上线半摸鱼'),
    sample('校园人设', '你的校园隐藏人设', '低调实力派'),
    sample('干饭奶茶', '干饭奶茶人格测试', '奶茶续命型选手'),
    sample('摆烂回血', '摆烂回血指数测试', '半血待机中'),
    sample('朋友搭子', '你的朋友搭子角色', '树洞倾听担当')
  ]
  cases.forEach(function (result) {
    assert.ok(result.resultTheme && result.resultTheme.name)
    assert.ok(result.summaryText.length > result.resultDesc.length)
    assert.ok(result.resultTags.length >= 3)
    assert.strictEqual(result.insightCards.length, 3)
    assert.strictEqual(result.traitBars.length, 3)
    assert.strictEqual(result.actionList.length, 3)
    assert.ok(result.shareLine.indexOf(result.resultTitle) >= 0)
  })
})

run('different choices in the same personality test produce different matched report content', function () {
  var extrovert = sample('校园人设', '你的校园隐藏人设', '班级显眼包')
  var quiet = sample('校园人设', '你的校园隐藏人设', '隐藏观察者')

  assert.notDeepStrictEqual(extrovert.resultTags, quiet.resultTags)
  assert.notStrictEqual(extrovert.insightCards[0].text, quiet.insightCards[0].text)
  assert.notStrictEqual(extrovert.actionList[0].text, quiet.actionList[0].text)
  assert.ok(extrovert.insightCards[0].text.indexOf('活跃') >= 0 || extrovert.insightCards[0].text.indexOf('气氛') >= 0)
  assert.ok(quiet.insightCards[0].text.indexOf('观察') >= 0 || quiet.insightCards[0].text.indexOf('安静') >= 0)
})

run('different score results in the same status test produce different matched report content', function () {
  var low = sample('摆烂回血', '摆烂回血指数测试', '电量严重不足')
  var high = sample('摆烂回血', '摆烂回血指数测试', '满电出发')

  assert.notDeepStrictEqual(low.traitBars, high.traitBars)
  assert.notStrictEqual(low.insightCards[0].text, high.insightCards[0].text)
  assert.notStrictEqual(low.actionList[0].text, high.actionList[0].text)
  assert.ok(low.summaryText.indexOf('休息') >= 0 || low.summaryText.indexOf('回血') >= 0)
  assert.ok(high.summaryText.indexOf('输出') >= 0 || high.summaryText.indexOf('推进') >= 0)
})

run('generic completion title in consumption test is converted into a useful matched result', function () {
  var result = presenter.normalizeResult({
    testTitle: '消费风格测试',
    category: '消费风格',
    resultTitle: '测试完成',
    resultDesc: '感谢你的参与，你已完成本次测试。',
    resultEmoji: '⭐',
    score: 11,
    questionCount: 5,
    answerSummary: [
      { question: '促销时你会怎么做？', selectedText: '先看是否真的需要', score: 2 },
      { question: '朋友种草时你会怎么做？', selectedText: '先比较价格和评价', score: 2 }
    ]
  })

  assert.notStrictEqual(result.resultTitle, '测试完成')
  assert.ok(result.resultTitle.indexOf('消费者') >= 0 || result.resultTitle.indexOf('消费') >= 0)
  assert.ok(result.shareLine.indexOf('测试完成') === -1)
  assert.ok(result.resultTags.indexOf('测试完成') === -1)
  assert.ok(result.summaryText.indexOf('感谢你的参与') === -1)
  assert.ok(result.summaryText.indexOf('消费') >= 0)
  assert.ok(result.reasonList.length >= 2)
  assert.ok(result.strengthList.length >= 2)
  assert.ok(result.riskList.length >= 1)
  assert.ok(result.dominantTrait)
  assert.ok(result.matchPercent >= 0 && result.matchPercent <= 100)
})

run('generic campus persona title uses answer dimensions to show concrete different personas', function () {
  var active = presenter.normalizeResult({
    testTitle: '看看你的班级隐藏角色',
    category: '校园人设',
    resultTitle: '你的校园隐藏人设已生成',
    resultDesc: '感谢你的参与，你已完成本次测试。',
    resultEmoji: '⭐',
    questionCount: 3,
    answerSummary: [
      { question: '老师提问时你通常会？', selectedText: '主动举手，甚至抢答', dimension: '显眼包' },
      { question: '班级群里你通常会？', selectedText: '疯狂贡献表情包', dimension: '显眼包' },
      { question: '小组作业你通常会？', selectedText: '主动当组长带节奏', dimension: '显眼包' }
    ]
  })
  var quiet = presenter.normalizeResult({
    testTitle: '看看你的班级隐藏角色',
    category: '校园人设',
    resultTitle: '你的校园隐藏人设已生成',
    resultDesc: '感谢你的参与，你已完成本次测试。',
    resultEmoji: '⭐',
    questionCount: 3,
    answerSummary: [
      { question: '老师提问时你通常会？', selectedText: '默默听别人回答', dimension: '透明人' },
      { question: '班级群里你通常会？', selectedText: '有人@我才出现', dimension: '透明人' },
      { question: '小组作业你通常会？', selectedText: '做辅助工作不主导', dimension: '透明人' }
    ]
  })

  assert.strictEqual(active.resultTitle, '班级显眼包')
  assert.strictEqual(quiet.resultTitle, '隐藏观察者')
  assert.notStrictEqual(active.insightCards[0].text, quiet.insightCards[0].text)
  assert.ok(active.summaryText.indexOf('气氛') >= 0 || active.summaryText.indexOf('接梗') >= 0)
  assert.ok(quiet.summaryText.indexOf('观察') >= 0 || quiet.summaryText.indexOf('安静') >= 0)
})

run('legacy generic campus persona without dimensions still becomes a concrete class role', function () {
  var result = presenter.normalizeResult({
    testTitle: '性格色彩测试',
    category: '校园人设',
    resultTitle: '你的校园隐藏人设已生成',
    resultDesc: '你刚刚完成了 5 道题，系统根据你的选择生成了「你的校园隐藏人设已生成」。',
    resultEmoji: '🌟',
    score: 13,
    questionCount: 5
  })
  var concreteTitles = ['班级显眼包', '专业摸鱼选手', '低调实力派', '隐藏观察者']

  assert.ok(concreteTitles.indexOf(result.resultTitle) >= 0)
  assert.ok(result.resultTitle.indexOf('已生成') === -1)
  assert.ok(result.summaryText.indexOf('你的校园隐藏人设已生成') === -1)
  assert.ok(result.shareLine.indexOf(result.resultTitle) >= 0)
  assert.notStrictEqual(result.insightCards[0].text, result.insightCards[1].text)
  assert.strictEqual(result.testTitle, '看看你的班级隐藏角色')
})

run('old campus persona test title is normalized to the requested class-role title', function () {
  var result = presenter.normalizeResult({
    testTitle: '你的校园隐藏人设',
    category: '校园人设',
    resultTitle: '测试完成',
    resultDesc: '感谢你的参与，你已完成本次测试。',
    resultEmoji: '⭐',
    score: 10,
    questionCount: 5
  })

  assert.strictEqual(result.testTitle, '看看你的班级隐藏角色')
  assert.ok(result.resultTitle === '专业摸鱼选手' || result.resultTitle === '低调实力派' || result.resultTitle === '隐藏观察者' || result.resultTitle === '班级显眼包')
})

run('generic food title uses answer dimensions to show food personas without campus-persona overlap', function () {
  var milkTea = presenter.normalizeResult({
    testTitle: '干饭奶茶人格测试',
    category: '干饭奶茶',
    resultTitle: '测试完成',
    resultDesc: '感谢你的参与，你已完成本次测试。',
    resultEmoji: '⭐',
    questionCount: 3,
    answerSummary: [
      { question: '上午犯困你会？', selectedText: '偷偷下单一杯奶茶', dimension: '奶茶续命' },
      { question: '中午动力是什么？', selectedText: '奶茶店出新品了', dimension: '奶茶续命' },
      { question: '朋友问吃什么？', selectedText: '先去买杯奶茶再说', dimension: '奶茶续命' }
    ]
  })
  var snack = presenter.normalizeResult({
    testTitle: '干饭奶茶人格测试',
    category: '干饭奶茶',
    resultTitle: '测试完成',
    resultDesc: '感谢你的参与，你已完成本次测试。',
    resultEmoji: '⭐',
    questionCount: 3,
    answerSummary: [
      { question: '上午犯困你会？', selectedText: '从抽屉摸出零食', dimension: '零食囤积' },
      { question: '放学路过小卖部？', selectedText: '多拿几包零食', dimension: '零食囤积' },
      { question: '晚自习饿了？', selectedText: '掏出小饼干', dimension: '零食囤积' }
    ]
  })
  var personaTitles = ['班级显眼包', '专业摸鱼选手', '低调实力派', '隐藏观察者']

  assert.strictEqual(milkTea.resultTitle, '奶茶续命型选手')
  assert.strictEqual(snack.resultTitle, '课桌零食库管理员')
  assert.strictEqual(personaTitles.indexOf(milkTea.resultTitle), -1)
  assert.strictEqual(personaTitles.indexOf(snack.resultTitle), -1)
  assert.ok(milkTea.summaryText.indexOf('奶茶') >= 0)
  assert.ok(snack.summaryText.indexOf('零食') >= 0)
})

run('generic social title uses answer dimensions to show concrete friend role', function () {
  var result = presenter.normalizeResult({
    testTitle: '你的朋友搭子角色',
    category: '朋友搭子',
    resultTitle: '你的校园搭子属性已生成',
    resultDesc: '感谢你的参与，你已完成本次测试。',
    resultEmoji: '⭐',
    questionCount: 3,
    answerSummary: [
      { question: '朋友心情不好来找你？', selectedText: '拉着TA出去走走', dimension: '行动派' },
      { question: '群聊约周末去哪玩？', selectedText: '直接查好路线和时间', dimension: '行动派' },
      { question: '朋友之间发生矛盾？', selectedText: '约大家当面聊', dimension: '行动派' }
    ]
  })

  assert.strictEqual(result.resultTitle, '说走就走行动派')
  assert.ok(result.summaryText.indexOf('行动') >= 0 || result.summaryText.indexOf('执行') >= 0)
  assert.ok(result.shareLine.indexOf('已生成') === -1)
})

run('generic daily and recharge score results become concrete score-band reports', function () {
  var daily = presenter.normalizeResult({
    testTitle: '今日校园状态检测',
    category: '今日校园状态',
    resultTitle: '你的今日校园状态已生成',
    resultDesc: '感谢你的参与，你已完成本次测试。',
    resultEmoji: '⭐',
    score: 5,
    questionCount: 5
  })
  var recharge = presenter.normalizeResult({
    testTitle: '摆烂回血指数测试',
    category: '摆烂回血',
    resultTitle: '结果已生成',
    resultDesc: '感谢你的参与，你已完成本次测试。',
    resultEmoji: '⭐',
    score: 20,
    questionCount: 5
  })

  assert.strictEqual(daily.resultTitle, '佛系待机中')
  assert.strictEqual(recharge.resultTitle, '满电出发')
  assert.ok(daily.summaryText.indexOf('已生成') === -1)
  assert.ok(recharge.shareLine.indexOf('结果已生成') === -1)
})

run('missing raw result fields still produce safe fallback report', function () {
  var result = presenter.normalizeResult({})
  assert.strictEqual(result.resultTitle, '你的校园趣测结果已生成')
  assert.ok(result.summaryText)
  assert.ok(result.resultTags.length >= 3)
  assert.strictEqual(result.score, 0)
  assert.notStrictEqual(result.dominantTrait, 'general')
  assert.ok(result.dominantTrait)
})
