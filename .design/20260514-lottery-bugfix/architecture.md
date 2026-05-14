# 抽奖页逻辑修复设计

## 目标
- 修复 `pages/lottery/index` 默认进入显示 3 次抽奖的问题。
- 修复分享后抽奖次数不增加的问题。
- 修复转盘视觉指针与弹窗中奖结果不一致的问题。

## 范围
- 小程序页面：`miniprogram/pages/lottery/index.js`
- 云函数：
  - `spinLottery`
  - `getLotteryChances`（新增：统一返回今日剩余次数）
  - `recordLotteryShare`（新增：记录今日分享机会）
- 单元测试：`tests/lottery-logic.test.js`

## 关键设计
1. 今日默认只给 1 次 `free` 抽奖机会。
2. 分享机会必须由 `recordLotteryShare` 写入 `lotteryShareChances` 后才计算，每天最多 2 次。
3. `spinLottery` 服务端重新校验机会来源，避免前端显示与后端实际不一致。
4. 前端机会展示改为调用 `getLotteryChances`，不再本地假定 `2 - shareUsed`。
5. 转盘停止位置按照奖品 `order` 与当前转盘 `wheelItems` 数量计算，类型统一转为 Number 后匹配。

## 不变项
- 不改抽奖入口 UI 结构。
- 不改积分发放、兑换码发放、抽奖记录写入语义。
- 不改奖品配置集合结构。
