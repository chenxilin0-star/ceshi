const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

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
    var resultTitle = ''
    var resultDesc = ''
    var resultEmoji = ''
    var score = 0

    if (scoringType === 'dimension') {
      // 维度计分模式：每个选项属于一个维度，统计每个维度被选中的次数
      var dimensionCounts = {}
      var dimensionEmojis = test.dimensionEmojis || {}

      for (var i = 0; i < questions.length; i++) {
        var optIdx = answers[i]
        if (optIdx < 0 || !questions[i].options || !questions[i].options[optIdx]) continue
        var opt = questions[i].options[optIdx]
        var dim = opt.dimension || ''
        if (dim) {
          dimensionCounts[dim] = (dimensionCounts[dim] || 0) + 1
        }
      }

      // 找出计数最高的维度
      var maxDim = ''
      var maxCount = 0
      var dims = Object.keys(dimensionCounts)
      for (var d = 0; d < dims.length; d++) {
        if (dimensionCounts[dims[d]] > maxCount) {
          maxCount = dimensionCounts[dims[d]]
          maxDim = dims[d]
        }
      }

      score = maxCount
      resultEmoji = dimensionEmojis[maxDim] || ''

      // 从 resultRules 中匹配维度对应的结果
      var resultRules = test.resultRules || []
      for (var r = 0; r < resultRules.length; r++) {
        var rule = resultRules[r]
        if (rule.dimension === maxDim) {
          resultTitle = rule.title || ''
          resultDesc = rule.description || ''
          break
        }
      }

    } else {
      // 分数累加模式：每个选项有 score 值，累加后按区间匹配结果
      for (var i = 0; i < questions.length; i++) {
        var optIdx = answers[i]
        if (optIdx < 0 || !questions[i].options || !questions[i].options[optIdx]) continue
        score += (questions[i].options[optIdx].score || 0)
      }

      // 从 resultRules 中按分数区间匹配
      var resultRules = test.resultRules || []
      for (var r = 0; r < resultRules.length; r++) {
        var rule = resultRules[r]
        if (score >= (rule.minScore || 0) && score <= (rule.maxScore || 9999)) {
          resultTitle = rule.title || ''
          resultDesc = rule.description || ''
          resultEmoji = rule.emoji || ''
          break
        }
      }
    }

    // 如果没有匹配到任何规则，给一个默认结果
    if (!resultTitle) {
      resultTitle = '测试完成'
      resultDesc = '感谢你的参与，你已完成本次测试。'
      resultEmoji = '🌟'
    }

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
        score: score,
        resultTitle: resultTitle,
        resultDesc: resultDesc,
        resultEmoji: resultEmoji,
        scoringType: scoringType,
        createTime: now
      }
    })

    return {
      code: 0,
      resultId: addRes._id,
      score: score,
      resultTitle: resultTitle,
      resultDesc: resultDesc,
      resultEmoji: resultEmoji
    }
  } catch (err) {
    return {
      code: -1,
      message: err.message || '提交测试失败'
    }
  }
}
