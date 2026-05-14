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

run('missing raw result fields still produce safe fallback report', function () {
  var result = presenter.normalizeResult({})
  assert.strictEqual(result.resultTitle, '你的校园趣测结果已生成')
  assert.ok(result.summaryText)
  assert.ok(result.resultTags.length >= 3)
  assert.strictEqual(result.score, 0)
  assert.notStrictEqual(result.dominantTrait, 'general')
  assert.ok(result.dominantTrait)
})
