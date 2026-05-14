# 测试计划

## 自动化测试
1. `tests/submit-test-result-logic.test.js`
   - 校园人设不同选项维度生成不同人设。
   - 干饭奶茶不同选项维度生成不同饮食人格。
   - 干饭奶茶结果不复用校园人设标题。
   - 有效数据库 resultRules 优先。
   - 数据库规则若只是“测试完成/感谢参与”，会被维度兜底替换成真实结果。

2. `tests/test-result-presenter.test.js`
   - 泛化 resultTitle + 校园人设 answerSummary.dimension 会展示具体人设。
   - 泛化 resultTitle + 干饭奶茶 answerSummary.dimension 会展示具体饮食人格。
   - 两个测试结果池不重合。
   - 保留原有消费、状态、兜底结果测试。

3. 抽奖回归
   - `tests/lottery-logic.test.js`
   - `tests/lottery-share-flow.test.js`

## 静态校验
- JS 语法检查：所有变更 JS 文件 `node --check`
- WXML/JSON 基础校验
- `git diff --check`

## 人工验收
- 校园人设连续选择“显眼包”相关选项，结果页应显示“班级显眼包”。
- 校园人设连续选择“透明人”相关选项，结果页应显示“隐藏观察者”。
- 干饭奶茶连续选择“奶茶续命”相关选项，结果页应显示“奶茶续命型选手”。
- 干饭奶茶连续选择“零食囤积”相关选项，结果页应显示“课桌零食库管理员”。
- 页面不应显示“测试完成”作为最终结果标题。
