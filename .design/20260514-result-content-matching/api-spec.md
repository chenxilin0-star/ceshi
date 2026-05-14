# API 说明

## 云函数
本次不新增、不修改云函数 API。

## 现有链路
1. `pages/test-detail/index` 调用 `submitTest`，提交 `testId` 和 `answers`。
2. `submitTest` 根据测试配置计算 `resultTitle/resultDesc/resultEmoji/score/questionCount`。
3. `pages/test-detail/index` 将返回结果写入 `globalData.lastTestResult` 并跳转 `pages/test-result/index`。
4. `pages/test-result/index` 调用 `normalizeResult()` 生成展示字段。

## 本次展示层契约
`normalizeResult(rawResult)`：
- 输入仍是原结果对象。
- 输出仍是原字段 + 派生展示字段。
- 若 `rawResult.resultTitle` 命中 profile，返回结果专属报告内容。
- 若未命中，使用通用 fallback，不影响未来新增测试。
