# API 设计

## 复用 getTests

### 调用
```js
util.callFunction('getTests')
```

### 返回
```js
{
  code: 0,
  data: Test[]
}
```

### 首页使用字段
- `_id`：跳转测试详情必需。
- `title`：卡片标题。
- `description`：卡片说明。
- `category`：频道匹配与标签展示。
- `questionCount`：展示题目数。
- `requiredPoints`：如后续需要展示消耗积分可用。

## 不新增 API
本次首页改版不新增云函数，降低发布风险。

## 后续可选 API（非本次实现）

### getDailyCampusCard
用于生成用户每日身份卡，可按用户 openid + 日期稳定生成。

```js
request: {}
response: {
  code: 0,
  data: {
    date: '2026-05-12',
    title: '食堂冲锋队队长',
    keyword: '先吃再说',
    desc: '今天适合先补充能量再处理任务',
    rewardText: '+3积分'
  }
}
```

### completeDailyTask
用于真实发放每日任务积分，需要后端防重。

```js
request: { taskKey: string }
response: { code: 0, pointsAdded: 3 }
```

合规/安全要求：
- 每个 openid 每个 taskKey 每天只能完成一次。
- 不允许前端传入积分数。
- 不要求分享才能领取。
