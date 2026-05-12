# 数据模型设计

## 现有模型复用
首页继续消费 `getTests` 返回的测试列表：

```js
{
  _id: string,
  title: string,
  description: string,
  category: string,
  cover: string,
  questionCount: number,
  requiredPoints: number,
  status: string,
  order: number,
  createTime: string
}
```

## 前端新增静态状态

### campusCategories
```js
{
  key: 'daily' | 'persona' | 'food' | 'recharge' | 'friends' | 'task',
  title: string,
  subtitle: string,
  emoji: string,
  tag: string,
  gradient: string,
  keywords: string[]
}
```

用途：
- 首页 6 类频道展示。
- 根据 `category/title/description` 匹配云端测试。

### dailyTasks
```js
{
  emoji: string,
  title: string,
  desc: string,
  rewardText: string
}
```

用途：
- 首页静态展示“每日小任务 + 积分”的产品心智。
- 第一版不直接写积分记录，避免无后端确认造成积分作弊风险。

### featuredTest
```js
{
  _id: string,
  title: string,
  description: string,
  category: string,
  questionCount: number
} | null
```

用途：
- Hero 主卡片主入口。
- 优先选择“今日校园状态”频道匹配测试。

## 状态机

### 首页加载状态
```
initial loading=true
  -> loadTests success: tests=[], featuredTest=..., loading=false
  -> loadTests fail: tests=[], featuredTest=null, loading=false, toast/log
```

### 频道点击状态
```
click category
  -> find matched test
    -> requireLogin
      -> navigate test-detail
  -> no matched test
    -> toast 内容上新中
```

### 今日身份点击状态
```
click hero CTA
  -> featuredTest exists
    -> requireLogin
      -> navigate test-detail
  -> tests[0] exists
    -> requireLogin
      -> navigate test-detail
  -> no tests
    -> toast 今日内容准备中
```

## 分类匹配规则

目标分类关键词：
- 今日校园状态：今日、状态、校园状态、关键词、犯困、摸鱼
- 校园人设测试：人设、显眼包、班级、宿舍、下课、上课
- 干饭/奶茶人格：干饭、奶茶、食堂、吃什么、小卖部、夜宵
- 摆烂回血测试：摆烂、回血、拖延、犯困、明天再说、电量
- 朋友/同桌/群聊角色：朋友、同桌、群聊、搭子、社交
- 每日小任务：任务、积分、打卡、挑战

旧分类兼容：
- `社交` -> 朋友搭子
- `消费` -> 干饭奶茶
- `性格` -> 校园人设
- `情绪` -> 今日校园状态/摆烂回血
- `心理` 不在首页突出为“心理”，只作为普通推荐测试显示，避免合规风险。
- `恋爱` 不做首页分类突出；推荐列表也避免红色恋爱标签文案。
