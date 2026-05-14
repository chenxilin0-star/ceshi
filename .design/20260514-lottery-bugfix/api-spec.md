# API 变更

## 新增云函数：getLotteryChances
输入：无

输出：
```js
{
  code: 0,
  remainChances: { free: Number, share: Number, retry: Number },
  totalChances: Number,
  shareEarned: Number
}
```

用途：抽奖页进入、回到页面、抽奖后刷新次数。

## 新增云函数：recordLotteryShare
输入：
```js
{ scene: 'share_app_message' | 'share_timeline' }
```

输出：
```js
{
  code: 0,
  added: Boolean,
  shareEarned: Number,
  remainShareUpperBound: Number
}
```

用途：用户触发分享后记录一次当天分享机会，最多 2 次。

## 修改云函数：spinLottery
- 新增读取 `lotteryShareChances`。
- 抽奖机会由服务端统一计算并校验。
- 返回 `remainChances` 使用同一套计算逻辑。
