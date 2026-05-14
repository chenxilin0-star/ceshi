# Test Plan

## 自动测试
- `node tests/test-result-presenter.test.js`
  - 首页已有测试主题均能生成完整报告。
  - 同一人格测试不同结果内容不同。
  - 同一状态测试不同分数内容不同。
  - 泛化标题「测试完成」+「消费风格测试」会转换为具体消费类型。
  - 缺字段仍有安全兜底。
- `node tests/lottery-logic.test.js`
- `node tests/lottery-share-flow.test.js`

## 静态校验
- `node --check miniprogram/utils/testResultPresenter.js`
- `node --check miniprogram/pages/test-detail/index.js`
- `node --check miniprogram/pages/test-result/index.js`
- 检查 WXML/WXSS 不含截图中的泛化标题硬编码。

## 手工验收建议
1. 测「消费风格测试」，结果页主标题不能再是「测试完成」。
2. 首屏应能看到：具体消费类型、匹配度、题数、主导特征。
3. 下滑应能看到：为什么是该结果、选择线索、优势/提醒、可执行建议。
4. 不同分数段应出现不同消费类型。