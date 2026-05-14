# API 说明

## submitTest
入参不变：
```js
{ testId, answers }
```

返回结构兼容旧字段：
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

## 行为变化
- 如果数据库规则返回「你的校园隐藏人设已生成」这类生成态标题，云函数会忽略它，并用维度或分数兜底生成具体角色。
- score 模式的校园人设旧题也会返回具体班级角色。

## 部署
本次涉及云函数：
- `submitTest`
- 如需让 seed 标题进入数据库，还需要运行/部署项目已有的 `seedTests` 初始化逻辑。
