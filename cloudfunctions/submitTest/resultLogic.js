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

var SOCIAL_PROFILES = {
  '气氛组': profile('气氛组组长', '你在朋友群里不是普通参与者，而是负责把场子点亮的人：朋友低气压时你会逗笑，群聊冷掉时你会接梗，约局没方向时你会让讨论热起来。你的选择集中在热场、鼓励和快乐扩散，所以结果落在「气氛组组长」。高光是感染力强，提醒是你也可以偶尔不营业。', '🎉', '气氛组'),
  '倾听者': profile('树洞倾听担当', '你是朋友最容易放心倾诉的类型：不急着评价、不抢着输出，能把别人的情绪稳稳接住。你的选择集中在倾听、陪伴和确认感受，所以结果落在「树洞倾听担当」。高光是温柔可靠，提醒是别只做别人的树洞，你也需要被听见。', '👂', '倾听者'),
  '行动派': profile('说走就走行动派', '你在朋友关系里不是只会讨论的人，而是能把想法变成行动的人：查路线、约时间、拉人出门、当面解决问题。你的选择集中在执行、落地和推进，所以结果落在「说走就走行动派」。高光是靠谱不拖，提醒是偶尔也允许计划慢一点。', '🏃', '行动派'),
  '军师型': profile('朋友圈军师', '你是朋友遇到问题时会想起的分析型搭子：能拆利弊、理线索、给方向，把混乱的局面讲清楚。你的选择集中在判断、分析和方案感，所以结果落在「朋友圈军师」。高光是洞察力强，提醒是别把自己只放在解决问题的位置。', '🧠', '军师型')
}

var DAILY_SCORE_PROFILES = [
  profile('佛系待机中', '你今天更像低压待机模式：不想被催，也不想强行满格营业。你的低分选择集中在想休息、慢启动和少消耗，所以结果落在「佛系待机中」。今天的重点不是冲刺，而是先用一个很小的动作把自己温柔启动。', '🦥', '低压待机'),
  profile('半上线半摸鱼', '你今天不是完全没状态，而是只想把电量花在必要的地方。你的选择落在负责和放空之间，所以结果是「半上线半摸鱼」。适合该做的先做一点，该休息的也别有负担。', '🐱', '弹性节奏'),
  profile('满格在线中', '你今天的校园状态比较在线：能听课、能聊天、也能把重要事情往前推。你的选择集中在主动参与和正常发挥，所以结果是「满格在线中」。趁状态好推进重点，但记得留一点余电。', '⚡', '满格在线'),
  profile('超频运行中', '你今天能量很冲，像开了高性能模式：什么都想参与，什么都想试试。你的高分选择集中在快节奏和高参与，所以结果是「超频运行中」。高光是爆发力强，提醒是记得给自己降温。', '🚀', '高能超频')
]

var RECHARGE_SCORE_PROFILES = [
  profile('电量严重不足', '你今天的电量已经偏低，不适合继续硬撑。你的选择集中在疲惫、拖延和低启动，所以结果落在「电量严重不足」。先休息回血，再做最低限度任务，会比逼自己满血更现实。', '🪫', '红灯电量'),
  profile('半血待机中', '你不是彻底关机，只是现在需要低速启动。你的选择显示你能撑一点，但不适合一口气接大任务，所以结果是「半血待机中」。先做一个 5 分钟小任务，状态会慢慢回来。', '🔋', '半血待机'),
  profile('电量充足', '你今天的电量处在可用区间，适合稳定推进积压的小事。你的选择偏向能执行、能恢复、不过度摆烂，所以结果是「电量充足」。别急着爆发，稳定输出更适合你。', '🔋', '稳定输出'),
  profile('满电出发', '你今天像刚充满电，适合处理一直拖着的重点任务。你的高分选择集中在主动解决和快速推进，所以结果是「满电出发」。高光是执行窗口打开，提醒是别把满电一次用空。', '⚡', '满电输出')
]

var TOPIC_SCORE_PROFILES = {
  mentalDrain: [
    profile('内耗过载型', '在「精神内耗指数测试」里，你的选择更像脑内开了太多后台：明明还没行动，已经先被担心、比较和反复推演消耗掉一大半。结果落在「内耗过载型」。建议先把脑子里的事写下来，只保留一个今天必须处理的小动作。', '🌀', '精神内耗'),
    profile('反复拉扯型', '你的内耗不算爆表，但很容易在“想做”和“算了”之间来回拉扯。结果落在「反复拉扯型」。适合先做低风险决定，别让每件小事都变成大型辩论赛。', '🔁', '精神内耗'),
    profile('自我校准型', '你会有想太多的时候，但也能把自己慢慢拉回现实。结果落在「自我校准型」。优势是能复盘，提醒是别把复盘变成自责。', '🧭', '精神内耗'),
    profile('松弛稳定型', '你的选择显示你比较能把注意力放回当下，不太容易被脑内小剧场拖走。结果落在「松弛稳定型」。继续保持这种低内耗节奏。', '🍃', '精神内耗')
  ],
  emotionManage: [
    profile('情绪风暴型', '在「情绪管理风格测试」里，你的选择更像情绪来得快、冲击也强：不一定是不成熟，而是感受很敏锐。结果落在「情绪风暴型」。先暂停十秒再回应，会比立刻爆发更保护你。', '🌪️', '情绪管理'),
    profile('忍住不说型', '你更习惯把情绪压住，表面没事，心里已经开会。结果落在「忍住不说型」。优势是克制，提醒是不要长期把感受塞回去。', '🤐', '情绪管理'),
    profile('稳定调节型', '你能感知情绪，也会尝试用比较稳的方式处理它。结果落在「稳定调节型」。这是很适合校园生活的情绪节奏。', '🌤️', '情绪管理'),
    profile('情绪导航员', '你不只是能管住情绪，还能分辨情绪背后的需求。结果落在「情绪导航员」。高光是稳定且有边界，提醒是别变成所有人的情绪客服。', '🧭', '情绪管理')
  ],
  socialAnxiety: [
    profile('社交省电型', '在「社交恐惧程度测试」里，你的选择显示你不是讨厌所有人，而是社交电量很珍贵。结果落在「社交省电型」。适合小范围、低压力、可退出的社交。', '🫥', '社交舒适区'),
    profile('熟人舒适型', '你在陌生场合会慢热，但到了熟人局就能自然很多。结果落在「熟人舒适型」。不必强迫自己一上来就社牛。', '🛋️', '社交舒适区'),
    profile('选择性社交型', '你不是社恐也不是社牛，而是会挑场合、挑对象、挑能量。结果落在「选择性社交型」。这是很健康的社交边界。', '🎯', '社交舒适区'),
    profile('社交自来熟', '你的选择更偏向主动破冰和自然融入，陌生场合也不太会卡壳。结果落在「社交自来熟」。提醒是也给慢热的人一点进入节奏的时间。', '🤝', '社交舒适区')
  ],
  stress: [
    profile('压力爆表型', '在「压力指数测试」里，你的选择显示当前压力已经很明显：不是矫情，而是身心都在提醒你降负荷。结果落在「压力爆表型」。先做减法，暂停一个不必要任务。', '🚨', '压力水平'),
    profile('高压绷紧型', '你的压力还没彻底爆表，但已经处在绷紧状态。结果落在「高压绷紧型」。适合把任务拆小，并给自己设置休息闹钟。', '🧯', '压力水平'),
    profile('可控压力型', '你有压力，但还能把它转化成一定行动力。结果落在「可控压力型」。保持节奏，不要把所有事都堆到最后一刻。', '📌', '压力水平'),
    profile('轻压前行型', '你的压力水平相对可控，更像轻微提醒而不是警报。结果落在「轻压前行型」。继续保持边做边调整的节奏。', '🌿', '压力水平')
  ],
  loveBrain: [
    profile('上头雷达型', '在「恋爱脑程度测试」里，你的选择说明你很容易被心动信号牵着走：对方一句话、一个表情，都可能在你脑子里循环播放。结果落在「上头雷达型」。喜欢可以热烈，但别把全部情绪开关交给对方。', '💘', '恋爱脑'),
    profile('反复脑补型', '你不一定会立刻冲动行动，但很容易在心里反复推演关系走向。结果落在「反复脑补型」。提醒是多看真实互动，少让脑补替对方发言。', '💭', '恋爱脑'),
    profile('清醒心动型', '你会心动，也会给自己留一点判断空间。结果落在「清醒心动型」。这是比较舒服的恋爱节奏：有感觉，但不失去自己。', '💗', '恋爱脑'),
    profile('边界稳定型', '你的选择显示你在感情里比较稳，不容易因为一时上头打乱全部生活。结果落在「边界稳定型」。优势是清醒，提醒是别把表达喜欢也压得太冷。', '🧊', '恋爱脑')
  ],
  mbtiLove: [
    profile('慢热守护者', '在「MBTI恋爱人格测试」里，你更像慢热但可靠的守护者：不会一开始就高调表达，但会用稳定回应和细节照顾建立安全感。结果落在「慢热守护者」。', '🛡️', 'MBTI恋爱'),
    profile('稳定陪伴者', '你的恋爱人格偏向稳定陪伴：重视承诺、日常回应和长期相处的舒服感。结果落在「稳定陪伴者」。优势是让人安心，提醒是别把需求都藏起来。', '🌙', 'MBTI恋爱'),
    profile('直球行动者', '你的恋爱人格更偏直接行动：喜欢就会靠近，问题出现也倾向当面解决。结果落在「直球行动者」。高光是真诚，提醒是给对方一点消化时间。', '🏹', 'MBTI恋爱'),
    profile('浪漫探索者', '你的恋爱人格更像浪漫探索者：重视新鲜感、仪式感和一起体验世界。结果落在「浪漫探索者」。提醒是热烈之外也要照顾稳定感。', '✨', 'MBTI恋爱')
  ]
}

function getTopicKey(test) {
  var text = [(test && test.category) || '', (test && test.title) || '', (test && test.description) || ''].join('')
  if (includesAny(text, ['精神内耗', '内耗指数'])) return 'mentalDrain'
  if (includesAny(text, ['情绪管理', '情绪风格'])) return 'emotionManage'
  if (includesAny(text, ['社交恐惧', '社恐程度', '社恐'])) return 'socialAnxiety'
  if (includesAny(text, ['压力指数', '压力水平', '减压'])) return 'stress'
  if (includesAny(text, ['恋爱脑'])) return 'loveBrain'
  if (includesAny(text, ['MBTI恋爱', 'MBTI 恋爱', '恋爱人格'])) return 'mbtiLove'
  return ''
}

function getDomain(test) {
  var text = [(test && test.category) || '', (test && test.title) || ''].join('')
  if (includesAny(text, ['恋爱', '爱情', '心动', '伴侣', '对象', '脱单', '喜欢的人', '暧昧', '亲密关系'])) return 'love'
  if (includesAny(text, ['干饭', '奶茶', '食堂', '饮食', '零食'])) return 'food'
  if (includesAny(text, ['朋友', '搭子', '社交', '群聊', '同桌'])) return 'social'
  if (includesAny(text, ['状态', '摆烂', '回血', '电量'])) return 'state'
  if (includesAny(text, ['消费', '购物', '预算'])) return 'consume'
  if (includesAny(text, ['人设', '性格', '人格', '班级', '校园隐藏', 'MBTI'])) return 'persona'
  return 'general'
}

function getFallbackTitle(test) {
  var domain = getDomain(test)
  if (domain === 'love') return '你的恋爱人格结果已生成'
  if (domain === 'food') return '干饭奶茶人格已生成'
  if (domain === 'social') return '你的校园搭子属性已生成'
  if (domain === 'persona') return '你的校园隐藏人设已生成'
  if (domain === 'state') return '你的今日校园状态已生成'
  return '你的校园趣测结果已生成'
}

function domainSuffix(domain) {
  var map = {
    love: '型恋爱人格',
    persona: '型校园人设',
    food: '型干饭人格',
    social: '型朋友角色',
    consume: '型消费风格',
    state: '型状态',
    general: '型结果'
  }
  return map[domain] || map.general
}

function domainScene(domain) {
  var map = {
    love: '亲密关系里的表达方式',
    persona: '校园/班级场景里的表现方式',
    food: '干饭、奶茶和日常补给偏好',
    social: '朋友相处和群聊互动方式',
    consume: '消费决策和预算取舍方式',
    state: '今天的能量状态和行动节奏',
    general: '这个测试主题下的偏好组合'
  }
  return map[domain] || map.general
}

function buildDynamicDimensionProfile(test, dimension) {
  if (!dimension) return null
  var domain = getDomain(test)
  var title = dimension
  if (title.indexOf('型') < 0 && title.indexOf('派') < 0 && title.indexOf('者') < 0 && title.indexOf('控') < 0) title += domainSuffix(domain)
  var testTitle = (test && test.title) || '本次测试'
  var scene = domainScene(domain)
  var desc = '你的选择集中在「' + dimension + '」这一组线索上，所以在「' + testTitle + '」中更接近「' + title + '」。这说明你在' + scene + '里有比较稳定的偏好：优势是方向感清楚，提醒是不要被单一标签限制，具体相处和行动还要看真实场景。本内容仅作娱乐参考。'
  var emoji = domain === 'love' ? '💗' : (domain === 'consume' ? '🛍️' : (domain === 'state' ? '✨' : '🌟'))
  return profile(title, desc, emoji, dimension)
}

function getDimensionFallbackProfile(test, dimension) {
  var domain = getDomain(test)
  if (domain === 'persona') return PERSONA_PROFILES[dimension] || buildDynamicDimensionProfile(test, dimension)
  if (domain === 'food') return FOOD_PROFILES[dimension] || buildDynamicDimensionProfile(test, dimension)
  if (domain === 'social') return SOCIAL_PROFILES[dimension] || buildDynamicDimensionProfile(test, dimension)
  return buildDynamicDimensionProfile(test, dimension)
}

function scoreProfileByRatio(profiles, ratio) {
  if (ratio <= 35) return profiles[0]
  if (ratio <= 65) return profiles[1]
  if (ratio <= 85) return profiles[2]
  return profiles[3]
}

function getScoreFallbackProfile(test, score, questionCount) {
  var domain = getDomain(test)
  var maxScore = Math.max((questionCount || 5) * 4, 1)
  var ratio = Math.round((score / maxScore) * 100)
  var text = [(test && test.category) || '', (test && test.title) || ''].join('')
  var topicKey = getTopicKey(test)
  if (topicKey && TOPIC_SCORE_PROFILES[topicKey]) return scoreProfileByRatio(TOPIC_SCORE_PROFILES[topicKey], ratio)
  if (domain === 'state') {
    if (includesAny(text, ['摆烂', '回血', '电量'])) return scoreProfileByRatio(RECHARGE_SCORE_PROFILES, ratio)
    return scoreProfileByRatio(DAILY_SCORE_PROFILES, ratio)
  }
  if (domain === 'persona') {
    if (ratio <= 30) return PERSONA_PROFILES['透明人']
    if (ratio <= 50) return PERSONA_PROFILES['摸鱼王']
    if (ratio <= 75) return PERSONA_PROFILES['学霸型']
    return PERSONA_PROFILES['显眼包']
  }
  if (domain === 'food') {
    if (ratio <= 30) return FOOD_PROFILES['随缘吃啥']
    if (ratio <= 50) return FOOD_PROFILES['零食囤积']
    if (ratio <= 75) return FOOD_PROFILES['干饭第一']
    return FOOD_PROFILES['奶茶续命']
  }
  if (domain === 'consume') {
    if (ratio <= 35) return profile('精打细算型消费者', '你更偏向预算优先和必要性判断，购买前会先比较、先确认是否真的需要。优势是少踩冲动消费的坑，提醒是别把所有喜欢都压成“没必要”。', '🧮', '')
    if (ratio <= 65) return profile('理性平衡型消费者', '你会在预算、实用和喜欢之间找平衡：不盲目跟风，也愿意为真正高频使用或让自己开心的东西买单。', '⚖️', '')
    return profile('体验悦己型消费者', '你更容易被体验感、喜欢程度和情绪价值打动。优势是很会照顾自己的感受，提醒是连续被种草时先暂停一下。', '🛍️', '')
  }
  var band = ratio <= 35 ? '低调观察' : (ratio <= 65 ? '平衡适应' : (ratio <= 85 ? '主动表达' : '高能投入'))
  if (domain === 'love') {
    if (ratio <= 35) band = '慢热观察'
    else if (ratio <= 65) band = '稳定陪伴'
    else if (ratio <= 85) band = '直球表达'
    else band = '热烈投入'
  }
  return buildDynamicDimensionProfile(test, band)
}

function buildResultDescription(test, resultTitle, score, questionCount) {
  var title = resultTitle || getFallbackTitle(test)
  var testTitle = (test && test.title) || '本次测试'
  var countText = questionCount ? ('你刚刚完成了 ' + questionCount + ' 道题，') : ''
  return countText + '系统根据你在「' + testTitle + '」里的具体选择生成了「' + title + '」。这不是“测试完成”提示，而是把你的选项偏好翻译成一个可分享的校园趣味结果。本内容仅作校园娱乐参考。'
}

function isGenericTitle(title) {
  title = String(title || '').replace(/\s/g, '')
  return !title || title === '测试完成' || title === '完成测试' || title === '已完成' || title === '结果已生成' || title === '你的校园趣测结果已生成' || title === '你的校园隐藏人设已生成' || title === '干饭奶茶人格已生成' || title === '你的校园搭子属性已生成' || title === '你的今日校园状态已生成' || title === '你的恋爱人格结果已生成' || title.lastIndexOf('已生成') === title.length - 3
}

function isMismatchedTitleForDomain(test, title) {
  var domain = getDomain(test)
  title = String(title || '')
  var personaTitles = ['班级显眼包', '专业摸鱼选手', '低调实力派', '隐藏观察者']
  var foodTitles = ['奶茶续命型选手', '食堂干饭王', '课桌零食库管理员', '佛系饮食派']
  var socialTitles = ['气氛组组长', '树洞倾听担当', '说走就走行动派', '朋友圈军师']
  if ((domain === 'love' || domain === 'loveBrain' || domain === 'mbtiLove') && (personaTitles.indexOf(title) >= 0 || foodTitles.indexOf(title) >= 0 || socialTitles.indexOf(title) >= 0)) return true
  if (domain === 'food' && personaTitles.indexOf(title) >= 0) return true
  if (domain === 'social' && personaTitles.indexOf(title) >= 0) return true
  if (domain === 'persona' && foodTitles.indexOf(title) >= 0) return true
  return false
}

function isGenericDescription(desc) {
  desc = String(desc || '')
  return !desc || desc.indexOf('感谢你的参与') >= 0 || desc.indexOf('已完成本次测试') >= 0 || desc.indexOf('你的校园隐藏人设已生成') >= 0
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
  if (rule && (isGenericTitle(rule.title) || isGenericDescription(rule.description) || isMismatchedTitleForDomain(test, rule.title))) rule = null
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
  if (rule && (isGenericTitle(rule.title) || isGenericDescription(rule.description) || isMismatchedTitleForDomain(test, rule.title))) rule = null
  var fallback = !rule ? getScoreFallbackProfile(test, score, questions.length) : null
  var resultTitle = (rule && rule.title) || (fallback && fallback.title) || getFallbackTitle(test)
  var resultDesc = (rule && rule.description) || (fallback && fallback.description) || buildResultDescription(test, resultTitle, score, questions.length)
  var resultEmoji = (rule && rule.emoji) || (fallback && fallback.emoji) || '🌟'

  return {
    score: score,
    resultTitle: resultTitle,
    resultDesc: resultDesc,
    resultEmoji: resultEmoji,
    dominantDimension: (fallback && fallback.dimension) || '',
    dimensionCounts: (fallback && fallback.dimension) ? ((function () { var data = {}; data[fallback.dimension] = 1; return data })()) : {}
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
