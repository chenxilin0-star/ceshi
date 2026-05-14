# 数据模型

## 输入结果字段
沿用现有字段：
- `resultTitle`
- `resultDesc`
- `resultEmoji`
- `testTitle`
- `category`
- `score`
- `questionCount`
- `testId`

## 前端派生字段
新增展示字段均由前端根据现有字段计算：
- `resultTheme`: `{ key, name, icon, gradientClass }`
- `resultTags`: `String[]`
- `summaryText`: `String`
- `insightCards`: `{ icon, title, text }[]`
- `traitBars`: `{ label, value, tone }[]`
- `actionList`: `{ icon, text }[]`
- `shareLine`: `String`

## 持久化
不新增数据库字段，不写入数据库。派生字段仅用于结果页展示。
