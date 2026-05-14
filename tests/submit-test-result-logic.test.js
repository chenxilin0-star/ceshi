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

var socialQuestions = [
  { options: [{ text: '逗TA开心', dimension: '气氛组' }, { text: '安静听完', dimension: '倾听者' }, { text: '拉TA出门', dimension: '行动派' }, { text: '分析问题', dimension: '军师型' }] },
  { options: [{ text: '让讨论热闹起来', dimension: '气氛组' }, { text: '看大家想法', dimension: '倾听者' }, { text: '查路线时间', dimension: '行动派' }, { text: '分析方案', dimension: '军师型' }] },
  { options: [{ text: '缓和气氛', dimension: '气氛组' }, { text: '分别倾听', dimension: '倾听者' }, { text: '约大家当面聊', dimension: '行动派' }, { text: '理清经过', dimension: '军师型' }] }
]

var scoreQuestions = [
  { options: [{ text: '完全没电', score: 1 }, { text: '勉强启动', score: 2 }, { text: '正常发挥', score: 3 }, { text: '满格在线', score: 4 }] },
  { options: [{ text: '想躺平', score: 1 }, { text: '慢慢做', score: 2 }, { text: '列清单做', score: 3 }, { text: '直接开干', score: 4 }] },
  { options: [{ text: '拒绝出门', score: 1 }, { text: '考虑一下', score: 2 }, { text: '出去走走', score: 3 }, { text: '立刻出发', score: 4 }] },
  { options: [{ text: '想关机', score: 1 }, { text: '还凑合', score: 2 }, { text: '挺充实', score: 3 }, { text: '超有劲', score: 4 }] },
  { options: [{ text: '1 分', score: 1 }, { text: '4 分', score: 2 }, { text: '7 分', score: 3 }, { text: '10 分', score: 4 }] }
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

run('score-mode legacy campus persona also returns a concrete class role instead of generated copy', function () {
  var legacyPersonaTest = {
    title: '性格色彩测试',
    category: '校园人设',
    scoringType: 'score',
    resultRules: [{ minScore: 0, maxScore: 20, title: '你的校园隐藏人设已生成', description: '感谢你的参与，你已完成本次测试。', emoji: '🌟' }]
  }
  var questions = [
    { options: [{ text: '安静观察', score: 1 }, { text: '主动带节奏', score: 4 }] },
    { options: [{ text: '被@才出现', score: 1 }, { text: '群里刷屏', score: 4 }] },
    { options: [{ text: '辅助支持', score: 1 }, { text: '抢答接梗', score: 4 }] },
    { options: [{ text: '低头摸鱼', score: 2 }, { text: '认真整理', score: 3 }] },
    { options: [{ text: '能躲就躲', score: 2 }, { text: '兜底质量', score: 3 }] }
  ]
  var result = resultLogic.calculateTestResult(legacyPersonaTest, questions, [1, 1, 1, 1, 1])
  var concreteTitles = ['班级显眼包', '专业摸鱼选手', '低调实力派', '隐藏观察者']

  assert.ok(concreteTitles.indexOf(result.resultTitle) >= 0)
  assert.ok(result.resultTitle.indexOf('已生成') === -1)
  assert.ok(result.resultDesc.indexOf('测试完成') === -1)
})

run('朋友搭子泛化结果也按选项维度生成具体角色', function () {
  var socialTest = {
    title: '你的朋友搭子角色',
    category: '朋友搭子',
    scoringType: 'dimension',
    resultRules: [{ dimension: '行动派', title: '你的校园搭子属性已生成', description: '感谢你的参与，你已完成本次测试。', emoji: '🌟' }]
  }
  var result = resultLogic.calculateTestResult(socialTest, socialQuestions, [2, 2, 2])

  assert.strictEqual(result.resultTitle, '说走就走行动派')
  assert.ok(result.resultDesc.indexOf('执行') >= 0 || result.resultDesc.indexOf('行动') >= 0)
  assert.strictEqual(result.dominantDimension, '行动派')
  assert.ok(result.resultTitle.indexOf('已生成') === -1)
})

run('今日状态和摆烂回血泛化结果按分数区间生成具体状态', function () {
  var dailyTest = {
    title: '今日校园状态检测',
    category: '今日校园状态',
    scoringType: 'score',
    resultRules: [{ minScore: 0, maxScore: 20, title: '你的今日校园状态已生成', description: '感谢你的参与，你已完成本次测试。', emoji: '🌟' }]
  }
  var rechargeTest = {
    title: '摆烂回血指数测试',
    category: '摆烂回血',
    scoringType: 'score',
    resultRules: [{ minScore: 0, maxScore: 20, title: '结果已生成', description: '感谢你的参与，你已完成本次测试。', emoji: '🌟' }]
  }
  var low = resultLogic.calculateTestResult(dailyTest, scoreQuestions, [0, 0, 0, 0, 0])
  var high = resultLogic.calculateTestResult(rechargeTest, scoreQuestions, [3, 3, 3, 3, 3])

  assert.strictEqual(low.resultTitle, '佛系待机中')
  assert.strictEqual(high.resultTitle, '满电出发')
  assert.ok(low.resultDesc.indexOf('测试完成') === -1)
  assert.ok(high.resultDesc.indexOf('已完成') === -1)
})

run('MBTI恋爱人格不能误判成校园班级人设', function () {
  var loveTest = {
    title: '你的MBTI恋爱人格测试',
    category: '恋爱人格',
    scoringType: 'dimension',
    resultRules: [{ dimension: '稳定陪伴', title: '低调实力派', description: '你的人设不是传统卷王，而是低调但能交付。', emoji: '📚' }]
  }
  var loveQuestions = [
    { text: '聊天时你更像？', options: [{ text: '稳定回复，认真接住情绪', dimension: '稳定陪伴' }, { text: '主动制造惊喜', dimension: '浪漫表达' }] },
    { text: '遇到矛盾你会？', options: [{ text: '先安抚对方再一起解决', dimension: '稳定陪伴' }, { text: '冷静分析边界', dimension: '理性边界' }] },
    { text: '喜欢一个人时你会？', options: [{ text: '用持续行动证明在意', dimension: '稳定陪伴' }, { text: '直接表达心动', dimension: '直球心动' }] }
  ]
  var result = resultLogic.calculateTestResult(loveTest, loveQuestions, [0, 0, 0])
  var campusTitles = ['班级显眼包', '专业摸鱼选手', '低调实力派', '隐藏观察者']

  assert.strictEqual(campusTitles.indexOf(result.resultTitle), -1)
  assert.ok(result.resultTitle.indexOf('恋爱') >= 0 || result.resultTitle.indexOf('陪伴') >= 0)
  assert.ok(result.resultDesc.indexOf('恋爱') >= 0 || result.resultDesc.indexOf('亲密关系') >= 0)
  assert.strictEqual(result.dominantDimension, '稳定陪伴')
})

run('未知首页测试按主导维度生成对应结果，不退回已生成', function () {
  var unknownTest = {
    title: '周末出行人格测试',
    category: '校园趣测',
    scoringType: 'dimension',
    resultRules: []
  }
  var questions = [
    { text: '周末你想怎么安排？', options: [{ text: '查路线做攻略', dimension: '计划控' }, { text: '临时出发', dimension: '随性派' }] },
    { text: '朋友问去哪？', options: [{ text: '列出备选清单', dimension: '计划控' }, { text: '到门口再说', dimension: '随性派' }] }
  ]
  var result = resultLogic.calculateTestResult(unknownTest, questions, [0, 0])

  assert.ok(result.resultTitle.indexOf('计划控') >= 0)
  assert.ok(result.resultTitle.indexOf('已生成') === -1)
  assert.ok(result.resultDesc.indexOf('周末出行人格测试') >= 0)
})
