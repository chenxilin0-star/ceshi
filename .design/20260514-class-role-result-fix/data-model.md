# 数据模型

## 输入
- `test.title/category/scoringType/resultRules`
- `questions[].options[].dimension` 或 `score`
- `answers[]`
- 前端历史结果字段：`testTitle/category/resultTitle/resultDesc/score/questionCount/dominantDimension/dimensionCounts/answerSummary`

## 新增/调整规则
- 生成态标题无效：
  - `测试完成`
  - `完成测试`
  - `已完成`
  - `结果已生成`
  - `你的校园趣测结果已生成`
  - `你的校园隐藏人设已生成`
  - `干饭奶茶人格已生成`
  - `你的校园搭子属性已生成`
  - `你的今日校园状态已生成`

## 兜底映射
### 校园人设 score fallback
- 低分：隐藏观察者
- 中低分：专业摸鱼选手
- 中高分：低调实力派
- 高分：班级显眼包

### 干饭奶茶 score fallback
- 低分：佛系饮食派
- 中低分：课桌零食库管理员
- 中高分：食堂干饭王
- 高分：奶茶续命型选手

## 展示标题兼容
旧数据中以下标题在结果页展示为「看看你的班级隐藏角色」：
- 性格色彩测试
- 你的校园隐藏人设
- 校园人格盲盒
