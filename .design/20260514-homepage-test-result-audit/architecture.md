# 首页测试结果全量审查与修复设计

## 背景
用户反馈：首页仍有大量测试结果不达标，截图显示 `你的MBTI恋爱人格测试结果是` 却给出 `低调实力派` 这类校园班级人设结果。

## 根因假设
1. 当前代码只完整覆盖本地 seed 的 5 个测试域，未对线上 tests 集合中新增/运营配置的测试做全量兜底。
2. 结果域识别过宽：`人格/性格` 被直接归入 `persona`，导致 `MBTI恋爱人格测试` 被误判为校园人设。
3. `getTestDetail` 返回题目时去掉了 score/dimension，历史结果只能展示选项文本，缺少可用于解释“为什么是这个结果”的结构化证据。
4. `submitTest` 保存结果时没有保存 answerSummary，新提交结果页无法直接展示题目选择线索。

## 修复目标
- 首页/线上新增测试即使没有专门 resultRules，也不能退回“已生成/测试完成/校园人设套壳”。
- 域识别按更细分类优先级处理，`恋爱/MBTI恋爱` 不再落入校园人设。
- 服务端提交结果时保存并返回 answerSummary，结果页可展示选择依据。
- 对未知题目使用“测试标题 + 主导维度/分数区间 + 选择线索”生成对应结果，避免只覆盖少数硬编码测试。

## 范围
- 修改 `cloudfunctions/submitTest/resultLogic.js` 与 `cloudfunctions/submitTest/index.js`。
- 修改 `miniprogram/utils/testResultPresenter.js` 与 `miniprogram/pages/test-result/index.js`。
- 补充 Node 回归测试，覆盖 MBTI恋爱人格、未知人格/未知分数测试、answerSummary 保存。

## 不做
- 不改答题流程、不改积分/抽奖/分销功能。
- 不引入新依赖。
- 不连接或迁移生产数据库。当前环境 CloudBase 未登录，无法直接读取线上 tests 集合。