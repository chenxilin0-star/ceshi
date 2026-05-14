function includesAny(text, words) {
  text = text || ''
  for (var i = 0; i < words.length; i++) {
    if (text.indexOf(words[i]) >= 0) return true
  }
  return false
}

function profile(title, desc, emoji, dimension) {
  return {
    title: title,
    description: desc,
    emoji: emoji,
    dimension: dimension
  }
}

var PERSONA_PROFILES = {
  '显眼包': profile(
    '班级显眼包',
    '你不是简单的“外向”，而是班级里的气氛发动机：老师一提问你敢接、群聊一冷你能热、朋友犯困你也能丢出一个梗。你的选择集中在主动表达、带节奏和愿意被看见，所以结果落在「班级显眼包」。高光是有感染力，提醒是别把自己逼成全天候营业，显眼包也可以安静充电。',
    '🦚',
    '显眼包'
  ),
  '摸鱼王': profile(
    '专业摸鱼选手',
    '你的校园人设不是躺平摆烂，而是很会给自己省电：该听的听、该过的过、能低消耗解决就不高调冲刺。你的选择集中在避开无效消耗、保持松弛和关键时刻再行动，所以结果落在「专业摸鱼选手」。高光是节奏感强，提醒是重点任务别被摸鱼顺手带走。',
    '🐟',
    '摸鱼王'
  ),
  '学霸型': profile(
    '低调实力派',
    '你的人设不是传统“卷王”，而是低调但能交付的稳定输出者：笔记会整理、任务会兜底、关键时刻不掉链子。你的选择集中在认真、靠谱、质量优先，所以结果落在「低调实力派」。高光是让人放心，提醒是别总躲在幕后，该展示成果的时候可以大方一点。',
    '📚',
    '学霸型'
  ),
  '透明人': profile(
    '隐藏观察者',
    '你不是没有存在感，而是把存在感藏在观察力里：群聊不一定抢话，但谁情绪不对、班里气氛变了、细节哪里有问题，你往往能感到。你的选择集中在先观察、少打扰、慢热表达，所以结果落在「隐藏观察者」。高光是细腻敏锐，提醒是有想法时别一直只在心里弹幕。',
    '👻',
    '透明人'
  )
}

var FOOD_PROFILES = {
  '奶茶续命': profile(
    '奶茶续命型选手',
    '你的干饭奶茶人格不是校园人设那种“显眼/低调”，而是典型的情绪补给派：上午犯困想来一杯，下午低电量也想靠甜度回血。你的选择集中在奶茶、新品、饮料和即时快乐，所以结果落在「奶茶续命型选手」。高光是很会给日常制造小确幸，提醒是奶茶快乐之外也记得补水和正餐。',
    '🧋',
    '奶茶续命'
  ),
  '干饭第一': profile(
    '食堂干饭王',
    '你的饮食人格是正餐战斗派：下课铃一响就知道哪个窗口值得冲，吃饱才是继续上课和生活的底气。你的选择集中在食堂、热饭、夜宵地图和真实饱腹感，所以结果落在「食堂干饭王」。高光是生活能量很实在，提醒是别只追求吃饱，偶尔也给营养搭配留个位置。',
    '🍚',
    '干饭第一'
  ),
  '零食囤积': profile(
    '课桌零食库管理员',
    '你的干饭奶茶人格是移动补给站：抽屉、书包、桌洞里总能摸出一点回血小东西，自己快乐，也能顺手投喂朋友。你的选择集中在囤货、零食、课间补给和随时可得的小快乐，所以结果落在「课桌零食库管理员」。高光是安全感和分享感很强，提醒是别让零食完全替代正餐。',
    '🍫',
    '零食囤积'
  ),
  '随缘吃啥': profile(
    '佛系饮食派',
    '你的饮食人格是随缘不内耗派：别人纠结吃什么时，你通常一句“都行”就能接住场面。你的选择集中在不挑、能吃就行、少纠结和低决策成本，所以结果落在「佛系饮食派」。高光是松弛不折腾，提醒是偶尔也可以认真选一顿自己真正想吃的。',
    '🍃',
    '随缘吃啥'
  )
}

function getDomain(test) {
  var text = [(test && test.category) || '', (test && test.title) || ''].join('')
  if (includesAny(text, ['干饭', '奶茶', '食堂', '饮食', '零食'])) return 'food'
  if (includesAny(text, ['人设', '性格', '人格', '班级', '校园隐藏'])) return 'persona'
  if (includesAny(text, ['朋友', '搭子', '社交', '群聊'])) return 'social'
  if (includesAny(text, ['状态', '摆烂', '回血', '电量'])) return 'state'
  if (includesAny(text, ['消费', '购物', '预算'])) return 'consume'
  return 'general'
}

function getFallbackTitle(test) {
  var domain = getDomain(test)
  if (domain === 'food') return '干饭奶茶人格已生成'
  if (domain === 'social') return '你的校园搭子属性已生成'
  if (domain === 'persona') return '你的校园隐藏人设已生成'
  if (domain === 'state') return '你的今日校园状态已生成'
  return '你的校园趣测结果已生成'
}

function getDimensionFallbackProfile(test, dimension) {
  var domain = getDomain(test)
  if (domain === 'persona') return PERSONA_PROFILES[dimension] || null
  if (domain === 'food') return FOOD_PROFILES[dimension] || null
  return null
}

function getScoreFallbackProfile(test, score, questionCount) {
  var domain = getDomain(test)
  var maxScore = Math.max((questionCount || 5) * 4, 1)
  var ratio = Math.round((score / maxScore) * 100)
  if (domain === 'consume') {
    if (ratio <= 35) return profile('精打细算型消费者', '你更偏向预算优先和必要性判断，购买前会先比较、先确认是否真的需要。优势是少踩冲动消费的坑，提醒是别把所有喜欢都压成“没必要”。', '🧮', '')
    if (ratio <= 65) return profile('理性平衡型消费者', '你会在预算、实用和喜欢之间找平衡：不盲目跟风，也愿意为真正高频使用或让自己开心的东西买单。', '⚖️', '')
    return profile('体验悦己型消费者', '你更容易被体验感、喜欢程度和情绪价值打动。优势是很会照顾自己的感受，提醒是连续被种草时先暂停一下。', '🛍️', '')
  }
  return null
}

function buildResultDescription(test, resultTitle, score, questionCount) {
  var title = resultTitle || getFallbackTitle(test)
  var testTitle = (test && test.title) || '本次测试'
  var countText = questionCount ? ('你刚刚完成了 ' + questionCount + ' 道题，') : ''
  return countText + '系统根据你在「' + testTitle + '」里的具体选择生成了「' + title + '」。这不是“测试完成”提示，而是把你的选项偏好翻译成一个可分享的校园趣味结果。本内容仅作校园娱乐参考。'
}

function isGenericTitle(title) {
  title = String(title || '').replace(/\s/g, '')
  return !title || title === '测试完成' || title === '完成测试' || title === '已完成' || title === '结果已生成' || title === '你的校园趣测结果已生成'
}

function isGenericDescription(desc) {
  desc = String(desc || '')
  return !desc || desc.indexOf('感谢你的参与') >= 0 || desc.indexOf('已完成本次测试') >= 0
}

function matchRuleByDimension(test, dimension) {
  var resultRules = (test && test.resultRules) || []
  for (var r = 0; r < resultRules.length; r++) {
    var rule = resultRules[r]
    if (rule.dimension === dimension) return rule
  }
  return null
}

function matchRuleByScore(test, score) {
  var resultRules = (test && test.resultRules) || []
  for (var r = 0; r < resultRules.length; r++) {
    var rule = resultRules[r]
    if (score >= (rule.minScore || 0) && score <= (rule.maxScore || 9999)) return rule
  }
  return null
}

function calculateDimensionResult(test, questions, answers) {
  var dimensionCounts = {}
  var dimensionEmojis = (test && test.dimensionEmojis) || {}
  var maxDim = ''
  var maxCount = 0

  for (var i = 0; i < questions.length; i++) {
    var optIdx = answers[i]
    if (optIdx < 0 || !questions[i].options || !questions[i].options[optIdx]) continue
    var opt = questions[i].options[optIdx]
    var dim = opt.dimension || ''
    if (dim) {
      dimensionCounts[dim] = (dimensionCounts[dim] || 0) + 1
      if (dimensionCounts[dim] > maxCount) {
        maxCount = dimensionCounts[dim]
        maxDim = dim
      }
    }
  }

  var rule = matchRuleByDimension(test, maxDim)
  if (rule && (isGenericTitle(rule.title) || isGenericDescription(rule.description))) rule = null
  var fallback = !rule ? getDimensionFallbackProfile(test, maxDim) : null
  var resultTitle = (rule && rule.title) || (fallback && fallback.title) || getFallbackTitle(test)
  var resultDesc = (rule && rule.description) || (fallback && fallback.description) || buildResultDescription(test, resultTitle, maxCount, questions.length)
  var resultEmoji = (rule && rule.emoji) || (fallback && fallback.emoji) || dimensionEmojis[maxDim] || '🌟'

  return {
    score: maxCount,
    resultTitle: resultTitle,
    resultDesc: resultDesc,
    resultEmoji: resultEmoji,
    dominantDimension: maxDim,
    dimensionCounts: dimensionCounts
  }
}

function calculateScoreResult(test, questions, answers) {
  var score = 0
  for (var i = 0; i < questions.length; i++) {
    var optIdx = answers[i]
    if (optIdx < 0 || !questions[i].options || !questions[i].options[optIdx]) continue
    score += (questions[i].options[optIdx].score || 0)
  }

  var rule = matchRuleByScore(test, score)
  if (rule && (isGenericTitle(rule.title) || isGenericDescription(rule.description))) rule = null
  var fallback = !rule ? getScoreFallbackProfile(test, score, questions.length) : null
  var resultTitle = (rule && rule.title) || (fallback && fallback.title) || getFallbackTitle(test)
  var resultDesc = (rule && rule.description) || (fallback && fallback.description) || buildResultDescription(test, resultTitle, score, questions.length)
  var resultEmoji = (rule && rule.emoji) || (fallback && fallback.emoji) || '🌟'

  return {
    score: score,
    resultTitle: resultTitle,
    resultDesc: resultDesc,
    resultEmoji: resultEmoji,
    dominantDimension: '',
    dimensionCounts: {}
  }
}

function calculateTestResult(test, questions, answers) {
  var scoringType = (test && test.scoringType) || 'score'
  if (scoringType === 'dimension') return calculateDimensionResult(test, questions || [], answers || [])
  return calculateScoreResult(test, questions || [], answers || [])
}

module.exports = {
  calculateTestResult: calculateTestResult,
  buildResultDescription: buildResultDescription,
  getFallbackTitle: getFallbackTitle,
  getDimensionFallbackProfile: getDimensionFallbackProfile,
  getScoreFallbackProfile: getScoreFallbackProfile
}
