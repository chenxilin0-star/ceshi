const assert = require('assert')
const resultLogic = require('../cloudfunctions/submitTest/resultLogic')

function run(name, fn) {
  try {
    fn()
    console.log('✓ ' + name)
  } catch (err) {
    console.error('✗ ' + name)
    throw err
  }
}

var personaTest = {
  title: '你的校园隐藏人设',
  category: '校园人设',
  scoringType: 'dimension',
  dimensionEmojis: {
    '显眼包': '🦚',
    '摸鱼王': '🐟',
    '学霸型': '📚',
    '透明人': '👻'
  },
  resultRules: []
}

var foodTest = {
  title: '干饭奶茶人格测试',
  category: '干饭奶茶',
  scoringType: 'dimension',
  dimensionEmojis: {
    '奶茶续命': '🧋',
    '干饭第一': '🍚',
    '零食囤积': '🍫',
    '随缘吃啥': '🍃'
  },
  resultRules: []
}

var personaQuestions = [
  { options: [{ text: '抢答接梗', dimension: '显眼包' }, { text: '低头摸鱼', dimension: '摸鱼王' }, { text: '认真整理', dimension: '学霸型' }, { text: '安静观察', dimension: '透明人' }] },
  { options: [{ text: '群里刷屏', dimension: '显眼包' }, { text: '只回收到', dimension: '摸鱼王' }, { text: '发重点', dimension: '学霸型' }, { text: '被@才出现', dimension: '透明人' }] },
  { options: [{ text: '主动带节奏', dimension: '显眼包' }, { text: '能躲就躲', dimension: '摸鱼王' }, { text: '兜底质量', dimension: '学霸型' }, { text: '辅助支持', dimension: '透明人' }] }
]

var foodQuestions = [
  { options: [{ text: '奶茶新品', dimension: '奶茶续命' }, { text: '食堂热饭', dimension: '干饭第一' }, { text: '抽屉零食', dimension: '零食囤积' }, { text: '都可以', dimension: '随缘吃啥' }] },
  { options: [{ text: '先喝一杯', dimension: '奶茶续命' }, { text: '冲窗口', dimension: '干饭第一' }, { text: '囤几包', dimension: '零食囤积' }, { text: '不纠结', dimension: '随缘吃啥' }] },
  { options: [{ text: '饮料冰柜', dimension: '奶茶续命' }, { text: '夜宵地图', dimension: '干饭第一' }, { text: '分享薯片', dimension: '零食囤积' }, { text: '有啥吃啥', dimension: '随缘吃啥' }] }
]

run('校园人设按选项维度生成不同人设结果，不返回测试完成', function () {
  var extrovert = resultLogic.calculateTestResult(personaTest, personaQuestions, [0, 0, 0])
  var quiet = resultLogic.calculateTestResult(personaTest, personaQuestions, [3, 3, 3])

  assert.strictEqual(extrovert.resultTitle, '班级显眼包')
  assert.strictEqual(quiet.resultTitle, '隐藏观察者')
  assert.notStrictEqual(extrovert.resultTitle, quiet.resultTitle)
  assert.ok(extrovert.resultDesc.indexOf('气氛') >= 0 || extrovert.resultDesc.indexOf('接梗') >= 0)
  assert.ok(quiet.resultDesc.indexOf('观察') >= 0 || quiet.resultDesc.indexOf('安静') >= 0)
  assert.strictEqual(extrovert.dominantDimension, '显眼包')
  assert.strictEqual(quiet.dominantDimension, '透明人')
})

run('干饭奶茶按选项维度生成饮食人格，结果不和校园人设重合', function () {
  var milkTea = resultLogic.calculateTestResult(foodTest, foodQuestions, [0, 0, 0])
  var rice = resultLogic.calculateTestResult(foodTest, foodQuestions, [1, 1, 1])
  var personaTitles = ['班级显眼包', '专业摸鱼选手', '低调实力派', '隐藏观察者']

  assert.strictEqual(milkTea.resultTitle, '奶茶续命型选手')
  assert.strictEqual(rice.resultTitle, '食堂干饭王')
  assert.strictEqual(personaTitles.indexOf(milkTea.resultTitle), -1)
  assert.strictEqual(personaTitles.indexOf(rice.resultTitle), -1)
  assert.ok(milkTea.resultDesc.indexOf('奶茶') >= 0)
  assert.ok(rice.resultDesc.indexOf('食堂') >= 0 || rice.resultDesc.indexOf('干饭') >= 0)
})

run('有 resultRules 时仍优先使用配置结果', function () {
  var customTest = {
    title: '你的校园隐藏人设',
    category: '校园人设',
    scoringType: 'dimension',
    resultRules: [{ dimension: '显眼包', title: '自定义热场王', description: '使用数据库配置结果。', emoji: '🔥' }]
  }
  var result = resultLogic.calculateTestResult(customTest, personaQuestions, [0, 0, 0])
  assert.strictEqual(result.resultTitle, '自定义热场王')
  assert.strictEqual(result.resultDesc, '使用数据库配置结果。')
  assert.strictEqual(result.resultEmoji, '🔥')
})

run('数据库规则如果只是测试完成，也按维度改成真实结果', function () {
  var genericRuleTest = {
    title: '干饭奶茶人格测试',
    category: '干饭奶茶',
    scoringType: 'dimension',
    resultRules: [{ dimension: '奶茶续命', title: '测试完成', description: '感谢你的参与，你已完成本次测试。', emoji: '⭐' }]
  }
  var result = resultLogic.calculateTestResult(genericRuleTest, foodQuestions, [0, 0, 0])
  assert.strictEqual(result.resultTitle, '奶茶续命型选手')
  assert.ok(result.resultDesc.indexOf('奶茶') >= 0)
})
