# 测试计划

## 自动化
- 新增 `tests/test-result-presenter.test.js`：验证所有主题都能生成完整报告字段。
- `node --check miniprogram/pages/test-result/index.js`
- `node tests/test-result-presenter.test.js`

## 静态校验
- WXML 标签平衡。
- 保留功能 token：`retryTest`、`goHome`、`open-type="share"`、`wx:if`、`wx:for`、`wx:key`。
- JSON 可解析。
- `git diff --check`。

## 手工验收
- 完成 5 个首页测试后，结果页均应有：
  1. 结果封面与身份称号。
  2. 关键词标签。
  3. 至少 3 段专属解读。
  4. 3 个指数条。
  5. 今日行动建议。
  6. 分享按钮正常。
