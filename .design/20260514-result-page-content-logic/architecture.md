# 测试结果页内容逻辑修复

## 背景
用户截图中「消费风格测试」结果页展示为「测试完成」，正文也是完成提示，视觉包装很多但没有回答测试页最核心的问题：我是什么结果、为什么是这个结果、这个结果有什么用。

对标 MBTI 类结果页的核心逻辑：
1. 明确给出结果类型，而不是完成状态。
2. 展示可理解的关键指标，如匹配度、题数、主导特征。
3. 解释结果定义。
4. 说明为什么得到该结果，最好能关联用户选择。
5. 展示优势、风险和行动建议。

## 目标
- 不再把「测试完成」作为主结果展示。
- 对缺少有效 resultRules 或结果标题泛化的测试，前端 presenter 根据测试主题、分数和答题线索生成有意义的结果类型。
- 消费风格测试至少生成「精打细算型消费者 / 理性平衡型消费者 / 体验悦己型消费者」等可理解结果。
- 结果页结构从“装饰型报告”改为“结论 + 证据 + 指标 + 优势风险 + 建议”。

## 非目标
- 不改答题流程。
- 不改云函数评分逻辑。
- 不改数据库结构。
- 不引入新依赖。

## 改动范围
- `miniprogram/utils/testResultPresenter.js`
  - 识别泛化结果标题/描述。
  - 针对消费类测试生成具体结果 profile。
  - 输出 `matchPercent`、`dominantTrait`、`reasonList`、`strengthList`、`riskList`。
- `miniprogram/pages/test-detail/index.js`
  - 跳转结果页前把题目和选项摘要写入 `globalData.lastTestResult.answerSummary`，用于解释“为什么是这个结果”。
- `miniprogram/pages/test-result/index.js`
  - 历史结果从云端加载时，如果有 answers/testId，则补拉测试详情生成 answerSummary。
- `miniprogram/pages/test-result/index.wxml/.wxss`
  - 展示匹配度、主导特征、选择线索、优势与提醒。
