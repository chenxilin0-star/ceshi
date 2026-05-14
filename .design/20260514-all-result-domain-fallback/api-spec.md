# API 说明

## submitTest
无接口变更。

### 入参
```js
{ testId, answers }
```

### 出参
字段兼容旧版本，但结果内容更具体：
```js
{
  code: 0,
  resultId,
  score,
  resultTitle,
  resultDesc,
  resultEmoji,
  dominantDimension,
  dimensionCounts,
  questionCount
}
```

## 兼容策略
如果数据库 resultRules 是有效具体结果，优先使用数据库配置。
如果数据库 resultRules 是泛化完成态：
- `测试完成`
- `结果已生成`
- `你的校园隐藏人设已生成`
- `干饭奶茶人格已生成`
- `你的校园搭子属性已生成`
- `你的今日校园状态已生成`

则按测试域、维度、分数重新生成具体结果。