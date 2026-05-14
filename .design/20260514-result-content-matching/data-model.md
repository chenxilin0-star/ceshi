# 数据模型

## 输入字段
继续使用现有结果对象字段：
- `resultTitle`：服务端根据答案/分数/维度计算出的结果标题，本次作为内容匹配主键。
- `resultDesc`：服务端结果描述，仍保留并拼入 summary。
- `resultEmoji`：结果 emoji。
- `testTitle`：测试标题。
- `category`：测试分类。
- `score`：分数或最高维度计数。
- `questionCount`：题目数量。

## 前端派生字段
`normalizeResult()` 根据 `resultTitle` 派生：
- `resultTags`
- `summaryText`
- `insightCards`
- `traitBars`
- `actionList`
- `shareLine`

## 当前覆盖结果标题
- 今日校园状态：佛系待机中、半上线半摸鱼、满格在线中、超频运行中
- 校园隐藏人设：班级显眼包、专业摸鱼选手、低调实力派、隐藏观察者
- 干饭奶茶人格：奶茶续命型选手、食堂干饭王、课桌零食库管理员、佛系饮食派
- 摆烂回血指数：电量严重不足、半血待机中、电量充足、满电出发
- 朋友搭子角色：气氛组组长、树洞倾听担当、说走就走行动派、朋友圈军师

## 数据库变更
无。
