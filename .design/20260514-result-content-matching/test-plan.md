# 测试计划

## 单元测试
文件：`tests/test-result-presenter.test.js`

新增断言：
1. 同一人格测试不同结果：`班级显眼包` vs `隐藏观察者`
   - 标签不同。
   - 第一张解读卡不同。
   - 行动建议不同。
   - 文案包含对应关键词：活跃/气氛、观察/安静。

2. 同一状态测试不同分数结果：`电量严重不足` vs `满电出发`
   - 指数条不同。
   - 第一张解读卡不同。
   - 行动建议不同。
   - 文案包含对应关键词：休息/回血、输出/推进。

3. 保留已有完整报告测试和缺字段兜底测试。

## 回归测试
- `node tests/test-result-presenter.test.js`
- `node tests/lottery-logic.test.js`
- `node tests/lottery-share-flow.test.js`

## 静态校验
- `node --check miniprogram/utils/testResultPresenter.js`
- `node --check miniprogram/pages/test-result/index.js`
- JSON 配置解析。
- WXML 基础标签平衡校验。
- `git diff --check`
