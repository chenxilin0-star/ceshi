const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { testId } = event

    // 获取测试基本信息
    var testRes = await db.collection('tests').doc(testId).get()
    var test = testRes.data

    // 获取该测试的所有题目，按 order 排序
    var questionsRes = await db.collection('questions')
      .where({ testId: testId })
      .orderBy('order', 'asc')
      .get()

    // 清洗题目数据：只返回选项文本，不返回 score 和 dimension（防止作弊）
    var cleanQuestions = []
    for (var i = 0; i < questionsRes.data.length; i++) {
      var q = questionsRes.data[i]
      var cleanOptions = []
      if (q.options && Array.isArray(q.options)) {
        for (var j = 0; j < q.options.length; j++) {
          cleanOptions.push({ text: q.options[j].text })
        }
      }
      cleanQuestions.push({
        _id: q._id,
        text: q.text,
        options: cleanOptions
      })
    }

    // 返回测试信息（去掉 resultRules 等敏感字段）
    return {
      code: 0,
      data: {
        test: {
          _id: test._id,
          title: test.title,
          description: test.description,
          category: test.category,
          questionCount: test.questionCount
        },
        questions: cleanQuestions
      }
    }
  } catch (err) {
    return {
      code: -1,
      message: err.message || '获取测试详情失败'
    }
  }
}
