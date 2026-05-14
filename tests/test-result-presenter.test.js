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

run('missing raw result fields still produce safe fallback report', function () {
  var result = presenter.normalizeResult({})
  assert.strictEqual(result.resultTitle, '你的校园趣测结果已生成')
  assert.ok(result.summaryText)
  assert.ok(result.resultTags.length >= 3)
  assert.strictEqual(result.score, 0)
})
