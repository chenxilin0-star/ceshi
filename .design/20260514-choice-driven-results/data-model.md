# 数据模型

## 输入
`submitTest` 继续使用原有入参：
- `testId`
- `answers`: 用户每题选择的选项下标数组

## 题目选项字段
- dimension 模式：`questions[i].options[answerIndex].dimension`
- score 模式：`questions[i].options[answerIndex].score`

## 新增/强化派生字段
`submitTest` 返回并保存：
- `dominantDimension`: dimension 模式下最高频选项维度，例如 `显眼包`、`奶茶续命`
- `dimensionCounts`: 各维度命中次数，例如 `{ "显眼包": 4, "摸鱼王": 1 }`

## 结果池
### 校园人设
- `显眼包` → `班级显眼包`
- `摸鱼王` → `专业摸鱼选手`
- `学霸型` → `低调实力派`
- `透明人` → `隐藏观察者`

### 干饭奶茶
- `奶茶续命` → `奶茶续命型选手`
- `干饭第一` → `食堂干饭王`
- `零食囤积` → `课桌零食库管理员`
- `随缘吃啥` → `佛系饮食派`

## 泛化结果识别
以下内容视为无效结果，不直接展示：
- `测试完成`
- `完成测试`
- `已完成`
- `结果已生成`
- `感谢你的参与，你已完成本次测试`

遇到这些内容时，按 dominantDimension/answerSummary 重新生成具体结果。
