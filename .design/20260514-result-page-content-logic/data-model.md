# 数据模型

## 输入字段
沿用现有结果数据：
- `testTitle`: 测试标题，例如「消费风格测试」。
- `category`: 测试分类。
- `resultTitle`: 云函数返回标题。若为「测试完成」等泛化标题，视为无效结果。
- `resultDesc`: 云函数返回说明。若只是感谢参与/完成提示，视为泛化说明。
- `score`: 分数。
- `questionCount`: 题数。
- `answers`: 历史结果里已有的答案下标数组。

## 新增前端派生字段
不入库，仅用于展示：
- `answerSummary`: 题目、选中选项、选项分数、维度。
- `matchPercent`: 结果匹配度百分比。
- `dominantTrait`: 主导特征。
- `reasonList`: 选择线索。
- `strengthList`: 结果优势。
- `riskList`: 风险提醒。

## 消费风格结果分层
按 `score / (questionCount * 4)` 估算：
- `<= 35%`: 精打细算型消费者。
- `36% - 65%`: 理性平衡型消费者。
- `> 65%`: 体验悦己型消费者。

该逻辑只在结果标题/描述泛化时启用，不覆盖已有明确结果。