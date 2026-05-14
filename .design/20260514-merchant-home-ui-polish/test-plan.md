# Test Plan

## 静态校验
- JSON 可解析。
- WXML 标签闭合。
- `bindtap="goProductManage"`、`goVerify`、`goVerifyLog`、`goLotteryConfig` 保留。
- 不产生 `.js` diff。
- `git diff --check` 通过。

## 手工预览
- 打开商户中心页，检查顶部 Hero、概览卡片、四个入口卡片、提示区在小屏下不溢出。
- 点击四个入口确认跳转不变。