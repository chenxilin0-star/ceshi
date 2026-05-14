const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const resultLogic = require('./resultLogic')

function getFallbackTitle(test) {
  var category = (test && test.category) || ''
  if (category.indexOf('干饭') >= 0 || category.indexOf('消费') >= 0) return '今日干饭能量已生成'
  if (category.indexOf('社交') >= 0 || category.indexOf('朋友') >= 0) return '你的校园搭子属性已生成'
  if (category.indexOf('人设') >= 0 || category.indexOf('性格') >= 0) return '你的校园隐藏人设已生成'
  if (category.indexOf('状态') >= 0 || category.indexOf('情绪') >= 0) return '你的今日校园状态已生成'
  return '你的校园趣测结果已生成'
}

function buildResultDescription(test, resultTitle, score, questionCount) {
  var title = resultTitle || getFallbackTitle(test)
  var testTitle = (test && test.title) || '本次测试'
  var category = (test && test.category) || '校园趣测'
  var countText = questionCount ? ('你刚刚完成了 ' + questionCount + ' 道题，') : ''
  var base = countText + '系统根据你的选择生成了「' + title + '」。'
  var scene = '这份结果更像是一张校园状态卡，适合当作今天的轻松参考，不代表固定标签。'

  if (category.indexOf('干饭') >= 0 || category.indexOf('消费') >= 0) {
    scene = '今天可以先给自己补一点能量，再去处理那些不太想面对的小任务。'
  } else if (category.indexOf('社交') >= 0 || category.indexOf('朋友') >= 0) {
    scene = '你在人群里的角色不一定总是外放，但总有一种方式能让朋友感受到你的存在。'
  } else if (category.indexOf('摆烂') >= 0 || category.indexOf('回血') >= 0 || category.indexOf('情绪') >= 0) {
    scene = '如果今天电量不高，就先完成一个很小的动作；能动起来一点点，也算回血成功。'
  } else if (category.indexOf('人设') >= 0 || category.indexOf('性格') >= 0) {
    scene = '这个人设不是给你下定义，而是把你在校园里的某个可爱侧面放大了一下。'
  } else if (category.indexOf('状态') >= 0 || testTitle.indexOf('今日') >= 0) {
    scene = '今天不用强迫自己满格在线，找到适合自己的节奏就已经很不错。'
  }

  return base + scene + ' 本内容仅作校园娱乐参考。'
}

function buildAnswerSummary(questions, answers) {
  var summary = []
  for (var i = 0; i < questions.length; i++) {
    var q = questions[i] || {}
    var idx = answers[i]
    var option = q.options && q.options[idx] ? q.options[idx] : null
    summary.push({
      question: q.text || q.title || q.question || ('第' + (i + 1) + '题'),
      selectedText: option ? (option.text || option.label || '') : '',
      score: option ? (option.score || 0) : 0,
      dimension: option ? (option.dimension || '') : ''
    })
  }
  return summary
}

exports.main = async (event, context) => {
  try {
    const { OPENID } = cloud.getWXContext()
    const { testId, answers } = event

    if (!testId || !answers || !Array.isArray(answers)) {
      return { code: -1, message: '参数错误' }
    }

    // 1. 获取测试信息
    var testRes = await db.collection('tests').doc(testId).get()
    var test = testRes.data

    // 2. 获取所有题目
    var questionsRes = await db.collection('questions')
      .where({ testId: testId })
      .orderBy('order', 'asc')
      .get()
    var questions = questionsRes.data

    if (questions.length === 0) {
      return { code: -1, message: '题目不存在' }
    }

    // 3. 校验答案数量
    if (answers.length < questions.length) {
      return { code: -1, message: '请完成所有题目' }
    }

    // 4. 服务端计算分数和结果
    var scoringType = test.scoringType || 'score'
    var calculated = resultLogic.calculateTestResult(test, questions, answers)
    var score = calculated.score
    var resultTitle = calculated.resultTitle
    var resultDesc = calculated.resultDesc
    var resultEmoji = calculated.resultEmoji
    var answerSummary = buildAnswerSummary(questions, answers)

    // 5. 获取用户信息
    var userRes = await db.collection('users').where({ _openid: OPENID }).get()
    if (userRes.data.length === 0) {
      return { code: -1, message: '用户不存在' }
    }
    var userId = userRes.data[0]._id

    // 6. 保存结果
    var now = new Date().toISOString()
    var addRes = await db.collection('results').add({
      data: {
        userId: userId,
        testId: testId,
        testTitle: test.title,
        category: test.category,
        answers: answers,
        answerSummary: answerSummary,
        score: score,
        resultTitle: resultTitle,
        resultDesc: resultDesc,
        resultEmoji: resultEmoji,
        scoringType: scoringType,
        dominantDimension: calculated.dominantDimension || '',
        dimensionCounts: calculated.dimensionCounts || {},
        questionCount: questions.length,
        createTime: now
      }
    })

    return {
      code: 0,
      resultId: addRes._id,
      score: score,
      resultTitle: resultTitle,
      resultDesc: resultDesc,
      resultEmoji: resultEmoji,
      answerSummary: answerSummary,
      dominantDimension: calculated.dominantDimension || '',
      dimensionCounts: calculated.dimensionCounts || {},
      questionCount: questions.length
    }
  } catch (err) {
    return {
      code: -1,
      message: err.message || '提交测试失败'
    }
  }
}
