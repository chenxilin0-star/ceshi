# 测试结果内容匹配修复设计

## 背景
用户反馈 `pages/test-result/index` 视觉虽然升级，但同一类测试下不同选择得到的报告内容仍然过于相似，无法体现“人格测试/状态测试应根据选择产生不同结果”的核心体验。

## 目标
- 保留现有答题、提交、结果读取、分享、重测功能不变。
- 不修改云函数评分逻辑和数据库结构。
- 让结果页展示内容基于服务端已计算出的 `resultTitle` 进行差异化匹配。
- 覆盖当前 seedTests 中所有结果标题，包含状态、人设、干饭奶茶、摆烂回血、朋友搭子。

## 方案
在 `miniprogram/utils/testResultPresenter.js` 中新增按 `resultTitle` 精准匹配的 profile map：
- `tags`：结果专属标签。
- `lead`：结果专属报告开场。
- `cards`：三张专属解读卡，解释该结果的高光、选择线索和建议。
- `bars`：结果专属指数条，不再同主题复用。
- `actions`：结果专属今日行动建议。
- `share`：结果专属分享文案。

`normalizeResult()` 仍作为唯一入口。若 `resultTitle` 命中 profile，优先使用专属内容；未知结果仍走原兜底逻辑，保证未来新增测试不崩。

## 不变项
- 不改 `pages/test-result/index.wxml` 结构。
- 不改 `pages/test-result/index.js` 页面逻辑。
- 不改 `submitTest` 评分规则。
- 不改用户答案、分数、结果存储结构。
