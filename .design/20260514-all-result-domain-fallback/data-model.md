# 数据模型

## 服务端结果输出
保持原结构：
```js
{
  score,
  resultTitle,
  resultDesc,
  resultEmoji,
  dominantDimension,
  dimensionCounts
}
```

## 新增内部映射
### SOCIAL_PROFILES
- `气氛组 -> 气氛组组长`
- `倾听者 -> 树洞倾听担当`
- `行动派 -> 说走就走行动派`
- `军师型 -> 朋友圈军师`

### DAILY_SCORE_PROFILES
- 低分：`佛系待机中`
- 中低：`半上线半摸鱼`
- 中高：`满格在线中`
- 高分：`超频运行中`

### RECHARGE_SCORE_PROFILES
- 低分：`电量严重不足`
- 中低：`半血待机中`
- 中高：`电量充足`
- 高分：`满电出发`

## 前端 presenter 派生字段
保持原结构：
- `resultTheme`
- `resultTags`
- `summaryText`
- `insightCards`
- `traitBars`
- `actionList`
- `reasonList`
- `strengthList`
- `riskList`
- `shareLine`