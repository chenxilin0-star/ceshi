# API 规格

本次不新增、不修改云函数 API。

## 现有读取链路
1. `pages/test-detail/index` 调用 `submitTest`。
2. `submitTest` 返回 `resultTitle/resultDesc/resultEmoji/score/questionCount/resultId`。
3. `pages/test-result/index` 优先读取 `globalData.lastTestResult`。
4. 若无 globalData，则用 `resultId` 从 `results` 集合读取。

## 本次变化
结果页在客户端对已有结果做展示增强，不改变 API 入参/出参。
