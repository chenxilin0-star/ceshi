# API Spec

## 不新增 API
本次不新增云函数，不改现有云函数参数。

## 使用现有 API
### `submitTest`
保持现有调用：
```js
util.callFunction('submitTest', { testId, answers })
```
返回仍使用：
- `resultId`
- `score`
- `resultTitle`
- `resultDesc`
- `resultEmoji`
- `questionCount`

### `getTestDetail`
历史结果页补充选择线索时复用现有接口：
```js
util.callFunction('getTestDetail', { testId })
```
用于根据 `answers` 还原题目和选项文案。

## 兼容性
- 如果 `getTestDetail` 失败，结果页仍能展示，只是少一部分具体选择线索。
- 如果没有 `answers`，presenter 仍会按测试主题和分数给出结果，不显示空白。