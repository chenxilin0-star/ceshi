# Data Model / State

本次是纯 UI 美化，不新增、不删除、不迁移任何数据模型。

## 保持不变的状态
- 积分页：`userInfo.totalPoints`、`tempFilePath`、`recognizing`、`ocrResult`、`submitting`、`receipts`、`loading`。
- 分销页：`referralCount`、`totalReferralPoints`、`referralPoints`、`loading`。
- 其他页面：保持现有页面 data、事件与云函数返回字段不变。

## UI-only 装饰原则
- 允许使用静态文字、emoji 或 CSS 伪视觉层增强界面。
- 不依赖新增 JS 字段。
- 不改变条件渲染逻辑。