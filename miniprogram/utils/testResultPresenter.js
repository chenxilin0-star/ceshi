function includesAny(text, words) {
  text = text || ''
  for (var i = 0; i < words.length; i++) {
    if (text.indexOf(words[i]) >= 0) return true
  }
  return false
}

function detectTheme(result) {
  var text = [result.category || '', result.testTitle || '', result.resultTitle || ''].join('')
  if (includesAny(text, ['干饭', '奶茶', '食堂', '饮食', '零食'])) {
    return { key: 'food', name: '干饭能量报告', icon: '🧋', gradientClass: 'theme-food' }
  }
  if (includesAny(text, ['朋友', '搭子', '群聊', '社交', '同桌'])) {
    return { key: 'social', name: '好友关系报告', icon: '🤝', gradientClass: 'theme-social' }
  }
  if (includesAny(text, ['摆烂', '回血', '电量', '拖延', '犯困'])) {
    return { key: 'recharge', name: '今日电量报告', icon: '🔋', gradientClass: 'theme-recharge' }
  }
  if (includesAny(text, ['人设', '显眼包', '班级', '宿舍', '性格'])) {
    return { key: 'persona', name: '校园人格报告', icon: '🎭', gradientClass: 'theme-persona' }
  }
  if (includesAny(text, ['今日', '状态', '校园'])) {
    return { key: 'daily', name: '今日状态报告', icon: '✨', gradientClass: 'theme-daily' }
  }
  return { key: 'general', name: '趣测星球报告', icon: '🌟', gradientClass: 'theme-general' }
}

function buildTags(theme, result) {
  var title = result.resultTitle || ''
  var map = {
    daily: ['今日状态', '校园节奏', '轻松参考'],
    persona: ['隐藏人设', '班级角色', '专属气质'],
    food: ['干饭属性', '快乐补给', '校园能量'],
    recharge: ['电量指数', '回血建议', '节奏管理'],
    social: ['朋友角色', '相处风格', '群聊担当'],
    general: ['趣味测试', '状态卡片', '生活参考']
  }
  var tags = (map[theme.key] || map.general).slice()
  if (title && tags.indexOf(title) < 0) tags.unshift(title)
  return tags.slice(0, 4)
}

function buildSummary(result, theme) {
  var desc = result.resultDesc || buildFallbackDesc(result)
  var title = result.resultTitle || '你的校园趣测结果已生成'
  var prefixMap = {
    daily: '这不是一句简单评价，而是一张属于你今天的校园状态卡。',
    persona: '这个结果把你在校园里的一个高辨识度侧面放大了出来。',
    food: '你的选择透露出一种很有画面感的校园补给方式。',
    recharge: '这份结果更像是今天的能量仪表盘，帮你看见自己的节奏。',
    social: '你在朋友关系里的位置，比一句“外向/内向”更立体。',
    general: '这份报告会把你的选择整理成一张更完整的趣味状态卡。'
  }
  return '「' + title + '」' + (prefixMap[theme.key] || prefixMap.general) + desc
}

function buildFallbackDesc(result) {
  var title = result.resultTitle || '你的校园趣测结果'
  var testTitle = result.testTitle || '本次测试'
  var questionCount = result.questionCount || 0
  var countText = questionCount ? ('你刚刚完成了 ' + questionCount + ' 道题，') : ''
  return countText + '系统根据你在「' + testTitle + '」里的选择生成了「' + title + '」。这份结果适合当作今天的校园娱乐参考，不代表固定标签，也不需要太认真。'
}

function buildSuggestion(result) {
  var text = [result.category || '', result.testTitle || '', result.resultTitle || ''].join('')
  if (includesAny(text, ['干饭', '奶茶', '消费', '食堂'])) return '先给自己补点能量，再处理一个最容易完成的小任务。'
  if (includesAny(text, ['朋友', '同桌', '群聊', '社交', '搭子'])) return '找一个熟悉的人聊两句，轻松一点就好，不用强行营业。'
  if (includesAny(text, ['摆烂', '回血', '拖延', '犯困', '电量'])) return '允许自己慢一点，但别完全关机。先做一个 5 分钟能完成的小动作。'
  if (includesAny(text, ['人设', '显眼包', '班级', '宿舍', '性格'])) return '保留你的校园特色，但不用被任何标签框住，舒服地做自己就行。'
  return '把结果当作一张轻松的状态卡，顺手完成一个小目标，给今天加一点确定感。'
}

function buildInsightCards(result, theme) {
  var title = result.resultTitle || '你的结果'
  var common = {
    daily: [
      ['🎒', '今日主线', '你的状态关键词是「' + title + '」。今天不一定要全程高燃，找到适合自己的节奏更重要。'],
      ['🌈', '隐藏优势', '你能感知自己当下的能量变化，这会帮助你更聪明地分配注意力。'],
      ['🧭', '使用说明', '把结果当作今天的小提醒：该冲的时候冲一下，该休息的时候也别硬撑。']
    ],
    persona: [
      ['🎭', '人格高光', '「' + title + '」代表你在校园里有很鲜明的存在方式，不是标签，是一个可爱的侧面。'],
      ['✨', '容易被看见的点', '别人记住你的，往往不是单一表现，而是你处理课堂、同学和任务时的整体气质。'],
      ['🪄', '反差空间', '这个结果不限制你。偶尔换一种打开方式，反而会让你的校园人设更立体。']
    ],
    food: [
      ['🍱', '补给偏好', '「' + title + '」说明你很懂得用食物和小快乐给校园生活回血。'],
      ['🧋', '快乐触发器', '你的满足感常常来自具体的小确幸：一杯饮料、一顿热饭、一次和朋友的分享。'],
      ['🌿', '平衡建议', '快乐补给很好，也可以偶尔给身体安排一点更稳定的能量来源。']
    ],
    recharge: [
      ['🔋', '电量状态', '「' + title + '」是你今天的能量提示，不是评价你努力不努力。'],
      ['⏳', '节奏特征', '你更适合把大任务拆成小动作，用完成感慢慢把状态拉回来。'],
      ['☁️', '回血方式', '别急着逼自己满格在线，先从一个可以立刻完成的小动作开始。']
    ],
    social: [
      ['🤝', '关系位置', '「' + title + '」说明你在朋友之间有独特价值，不一定最吵，但会被需要。'],
      ['💬', '相处风格', '你的选择体现了你在群体里的互动方式：有自己的节奏，也有照顾别人的一面。'],
      ['🌟', '友谊提示', '好的关系不需要一直用力表现，舒服自然的连接也很珍贵。']
    ],
    general: [
      ['🌟', '结果解读', '「' + title + '」来自你刚刚的选择组合，是一张轻松的个人状态卡。'],
      ['🧩', '选择线索', '每一道题都在捕捉你的偏好、节奏和反应方式，组合起来才是完整结果。'],
      ['🪐', '今日提示', '结果不用当成固定定义，把它当作今天的一点灵感就好。']
    ]
  }
  var rows = common[theme.key] || common.general
  return rows.map(function (row) { return { icon: row[0], title: row[1], text: row[2] } })
}

function clamp(num, min, max) {
  if (num < min) return min
  if (num > max) return max
  return num
}

function buildTraitBars(result, theme) {
  var score = typeof result.score === 'number' ? result.score : parseInt(result.score || 0, 10) || 0
  var questionCount = result.questionCount || 5
  var base = clamp(Math.round((score / Math.max(questionCount * 4, 1)) * 100), 28, 96)
  var configs = {
    daily: ['在线感', '松弛度', '行动力'],
    persona: ['辨识度', '稳定感', '反差感'],
    food: ['快乐补给', '分享欲', '续航力'],
    recharge: ['当前电量', '回血速度', '执行启动'],
    social: ['陪伴感', '表达力', '可靠度'],
    general: ['匹配度', '趣味值', '今日感']
  }
  var labels = configs[theme.key] || configs.general
  return [
    { label: labels[0], value: base, tone: 'pink' },
    { label: labels[1], value: clamp(100 - Math.floor(base / 3), 40, 92), tone: 'purple' },
    { label: labels[2], value: clamp(base - 8 + (questionCount * 3), 36, 94), tone: 'blue' }
  ]
}

function buildActionList(result, theme) {
  var suggestion = result.resultSuggestion || buildSuggestion(result)
  var actions = {
    daily: [['☀️', '给今天选一个最想完成的小目标。'], ['🍬', suggestion], ['📌', '晚上回看一下：今天哪一刻最像这个结果？']],
    persona: [['📸', '把这个结果当作今天的人设卡保存下来。'], ['💬', '找同桌/朋友问问：他们觉得像不像？'], ['✨', suggestion]],
    food: [['🧋', '给自己安排一个不超预算的小补给。'], ['🍚', '认真吃一顿饭，别只靠零食续命。'], ['🌈', suggestion]],
    recharge: [['⏱️', '先做一个 5 分钟能完成的小任务。'], ['🛋️', '给自己安排一段真正不刷题的休息。'], ['🔋', suggestion]],
    social: [['💌', '给一个朋友发一句轻松的问候。'], ['👂', '今天聊天时多听一句，也多表达一句。'], ['🤝', suggestion]],
    general: [['🪐', '把结果当作今天的灵感卡。'], ['🎯', suggestion], ['📮', '分享给朋友看看 TA 的结果会不会一样。']]
  }
  var rows = actions[theme.key] || actions.general
  return rows.map(function (row) { return { icon: row[0], text: row[1] } })
}

function normalizeResult(result) {
  var data = result || {}
  var normalized = {}
  for (var key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) normalized[key] = data[key]
  }
  normalized.resultTitle = normalized.resultTitle || '你的校园趣测结果已生成'
  normalized.resultEmoji = normalized.resultEmoji || '🌟'
  normalized.resultDesc = normalized.resultDesc || buildFallbackDesc(normalized)
  normalized.resultSuggestion = normalized.resultSuggestion || buildSuggestion(normalized)
  normalized.testTitle = normalized.testTitle || '校园趣测'
  normalized.score = typeof normalized.score === 'number' ? normalized.score : parseInt(normalized.score || 0, 10) || 0
  normalized.questionCount = normalized.questionCount || 0

  var theme = detectTheme(normalized)
  normalized.resultTheme = theme
  normalized.resultTags = buildTags(theme, normalized)
  normalized.summaryText = buildSummary(normalized, theme)
  normalized.insightCards = buildInsightCards(normalized, theme)
  normalized.traitBars = buildTraitBars(normalized, theme)
  normalized.actionList = buildActionList(normalized, theme)
  normalized.shareLine = '我的结果是「' + normalized.resultTitle + '」，这张校园状态卡有点准。'
  return normalized
}

module.exports = {
  normalizeResult: normalizeResult,
  detectTheme: detectTheme,
  buildFallbackDesc: buildFallbackDesc,
  buildSuggestion: buildSuggestion
}
