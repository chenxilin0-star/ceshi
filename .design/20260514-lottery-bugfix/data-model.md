# 数据模型

## 现有集合
- `lotteryRecords`：记录用户今日抽奖记录，继续用于统计 free/share/retry 已使用次数。
- `lotteryPrizes`：奖品配置，不修改结构。

## 新增集合
### `lotteryShareChances`
用于记录用户当天主动分享后获得的额外抽奖机会。

字段：
- `_openid`：云开发自动注入用户标识。
- `source`：分享来源，例如 `share_app_message` / `share_timeline`。
- `createTime`：服务端时间 `db.serverDate()`。

## 规则
- 每个自然日最多计 2 条分享机会。
- 剩余分享次数 = `min(2, 今日分享记录数) - 今日 share 抽奖记录数`。
- 默认免费次数 = 1 - 今日 free 抽奖记录数。
- 再来一次次数仍由中奖记录 `prizeType === 'retry'` 决定。
