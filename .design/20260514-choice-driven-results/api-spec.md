# API 说明

## submitTest
本次不改变入参，仍为：

```js
{
  testId: string,
  answers: number[]
}
```

## 返回字段
保留原字段：
- `code`
- `resultId`
- `score`
- `resultTitle`
- `resultDesc`
- `resultEmoji`
- `questionCount`

新增兼容字段：
- `dominantDimension`: 最高命中的维度
- `dimensionCounts`: 维度计数字典

这些字段只用于结果页解释“为什么是这个结果”，不要求旧客户端必须使用。

## 云函数部署影响
本次修改了 `cloudfunctions/submitTest/index.js`，新增 `cloudfunctions/submitTest/resultLogic.js`。
因此线上要生效必须重新上传/部署 `submitTest` 云函数。

## 数据库影响
不需要新增集合或迁移字段。
新的结果记录会保存 `dominantDimension/dimensionCounts`，旧结果仍可由前端根据 `answerSummary` 或历史 answers 兜底展示。
