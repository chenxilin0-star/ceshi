const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// ============================================================
// 趣测星球 - 测试题目种子数据
// 5 个测试覆盖 5 个分类，包含完整的题目、选项、计分规则和结果说明
// ============================================================

const TESTS_DATA = [
  // ──────────────────────────────────────────────
  // 测试1: 今日校园状态 (daily, score 模式)
  // ──────────────────────────────────────────────
  {
    test: {
      title: '今日校园状态检测',
      description: '5 道题看看你今天是满格上线还是自动待机，每天状态都不一样',
      category: '今日校园状态',
      cover: '',
      questionCount: 5,
      requiredPoints: 0,
      status: 'active',
      order: 1,
      scoringType: 'score',
      resultRules: [
        {
          minScore: 5,
          maxScore: 9,
          title: '佛系待机中',
          description: '今天的你像一只正在晒太阳的猫，对什么事都不太着急。这种状态其实挺好的，不用每时每刻都满格运转。允许自己慢慢来，先找一件让自己舒服的小事做起来就好。',
          emoji: '🦥'
        },
        {
          minScore: 10,
          maxScore: 13,
          title: '半上线半摸鱼',
          description: '你今天的状态是「能做但不多做」，该上课上课，但课间只想放空。这很正常，不用给自己太大压力，按自己的节奏走就行，该摸鱼的时候放心摸。',
          emoji: '🐱'
        },
        {
          minScore: 14,
          maxScore: 17,
          title: '满格在线中',
          description: '今天的你元气满满，课堂活跃度拉满，课间还有精力跟同学聊天打闹。趁今天状态好，把重要的事情推进一下，但也别忘了给自己留点喘息空间。',
          emoji: '⚡'
        },
        {
          minScore: 18,
          maxScore: 20,
          title: '超频运行中',
          description: '今天的你精力旺盛到有点收不住，什么都想参与，什么都想试试。这种状态很难得，但也要注意别把自己搞太累了。挑最重要的事全力以赴，其他的可以留到明天。',
          emoji: '🚀'
        }
      ],
      createTime: new Date().toISOString()
    },
    questions: [
      {
        text: '早上闹钟响的时候，你的第一反应是？',
        order: 1,
        options: [
          { text: '直接关掉，再躺五分钟', score: 1 },
          { text: '在床上发呆一会儿再起来', score: 2 },
          { text: '立刻起来，开始新的一天', score: 4 },
          { text: '已经醒了，根本不需要闹钟', score: 4 }
        ]
      },
      {
        text: '上课铃响了，你的状态是？',
        order: 2,
        options: [
          { text: '人坐在教室，灵魂还在被窝', score: 1 },
          { text: '能听进去一部分，偶尔走神', score: 2 },
          { text: '认真听讲，积极举手回答', score: 4 },
          { text: '比老师还积极，已经在预习下一课', score: 4 }
        ]
      },
      {
        text: '课间十分钟你会做什么？',
        order: 3,
        options: [
          { text: '趴桌上闭眼休息', score: 1 },
          { text: '和同桌随便聊聊天', score: 3 },
          { text: '去走廊找朋友玩', score: 4 },
          { text: '处理上一节课留下的笔记', score: 3 }
        ]
      },
      {
        text: '中午吃饭的时候，你最想的是？',
        order: 4,
        options: [
          { text: '吃完赶紧回去躺着', score: 1 },
          { text: '慢慢吃，不着急回去', score: 2 },
          { text: '边吃边和朋友聊今天的趣事', score: 4 },
          { text: '吃完还有精力去操场转一圈', score: 4 }
        ]
      },
      {
        text: '放学后你最有动力做的事是？',
        order: 5,
        options: [
          { text: '回家躺平，什么都不想干', score: 1 },
          { text: '先休息一会儿，再慢慢做作业', score: 2 },
          { text: '和朋友约着去打球或逛街', score: 4 },
          { text: '今天的作业今天搞定，晚上还要追剧', score: 4 }
        ]
      }
    ]
  },

  // ──────────────────────────────────────────────
  // 测试2: 校园隐藏人设 (persona, dimension 模式)
  // ──────────────────────────────────────────────
  {
    test: {
      title: '你的校园隐藏人设',
      description: '测测你在班级里到底是什么角色，可能和你想的不太一样',
      category: '校园人设',
      cover: '',
      questionCount: 6,
      requiredPoints: 0,
      status: 'active',
      order: 2,
      scoringType: 'dimension',
      dimensionEmojis: {
        '显眼包': '🦚',
        '摸鱼王': '🐟',
        '学霸型': '📚',
        '透明人': '👻'
      },
      resultRules: [
        {
          dimension: '显眼包',
          title: '班级显眼包',
          description: '你就是那个走到哪都能制造笑点的人，班级群里永远有你活跃的身影。你不是刻意搞笑，只是天生自带综艺感。但偶尔也给自己留点安静的时间，显眼包也需要充电的。',
          emoji: '🦚'
        },
        {
          dimension: '摸鱼王',
          title: '专业摸鱼选手',
          description: '你有一种天赋：看起来在认真听课，实际上脑子里已经在构思放学后的安排了。摸鱼不等于不努力，你只是知道什么时候该放松。建议把摸鱼的智慧用到该用力的地方。',
          emoji: '🐟'
        },
        {
          dimension: '学霸型',
          title: '低调实力派',
          description: '你可能不是话最多的那个，但你交作业永远最快、笔记永远最整齐。你的努力大家都看在眼里，不用刻意低调，该展示的时候就大方展示。',
          emoji: '📚'
        },
        {
          dimension: '透明人',
          title: '隐藏观察者',
          description: '你不是不存在，只是更喜欢安静地观察周围的一切。其实你在班里的存在感比你以为的要高，你的同桌和好朋友都很在意你。下次有想法的时候，不妨试着说出来。',
          emoji: '👻'
        }
      ],
      createTime: new Date().toISOString()
    },
    questions: [
      {
        text: '老师提问时，你通常的反应是？',
        order: 1,
        options: [
          { text: '主动举手，甚至抢答', dimension: '显眼包' },
          { text: '低头假装在看书，心里默念别叫我', dimension: '摸鱼王' },
          { text: '认真思考答案，举不举手看心情', dimension: '学霸型' },
          { text: '默默听别人回答，自己想一下对不对', dimension: '透明人' }
        ]
      },
      {
        text: '班级群里最常发消息的人是你吗？',
        order: 2,
        options: [
          { text: '肯定是我，表情包我贡献了80%', dimension: '显眼包' },
          { text: '只看不发，偶尔发一个"收到"', dimension: '摸鱼王' },
          { text: '有正经事的时候才发', dimension: '学霸型' },
          { text: '有人@我的时候才出现', dimension: '透明人' }
        ]
      },
      {
        text: '下课铃响了，你的第一个动作是？',
        order: 3,
        options: [
          { text: '冲到好朋友座位旁边开始聊天', dimension: '显眼包' },
          { text: '拿出手机/零食，开始摸鱼时间', dimension: '摸鱼王' },
          { text: '先把这节课的笔记整理完', dimension: '学霸型' },
          { text: '安静地坐在座位上，等别人来找你', dimension: '透明人' }
        ]
      },
      {
        text: '小组作业分工的时候，你通常会？',
        order: 4,
        options: [
          { text: '主动当组长，分配任务带节奏', dimension: '显眼包' },
          { text: '等别人分工，分到什么做什么', dimension: '摸鱼王' },
          { text: '承担最核心的部分，确保质量', dimension: '学霸型' },
          { text: '帮忙做辅助工作，不太想主导', dimension: '透明人' }
        ]
      },
      {
        text: '考试前一天晚上你在干嘛？',
        order: 5,
        options: [
          { text: '在群里跟同学互相鼓励（打气）', dimension: '显眼包' },
          { text: '说好的复习，结果刷了一晚上手机', dimension: '摸鱼王' },
          { text: '按照复习计划有条不紊地过一遍', dimension: '学霸型' },
          { text: '安静地看自己的笔记，心里有点紧张', dimension: '透明人' }
        ]
      },
      {
        text: '你觉得同学对你的印象是？',
        order: 6,
        options: [
          { text: '话多、搞笑、永远有梗', dimension: '显眼包' },
          { text: '佛系、随和、不太着急', dimension: '摸鱼王' },
          { text: '靠谱、认真、值得信任', dimension: '学霸型' },
          { text: '安静、低调、不太好懂', dimension: '透明人' }
        ]
      }
    ]
  },

  // ──────────────────────────────────────────────
  // 测试3: 干饭奶茶人格 (food, dimension 模式)
  // ──────────────────────────────────────────────
  {
    test: {
      title: '干饭奶茶人格测试',
      description: '你是奶茶续命型还是食堂干饭王？测测你的校园饮食人格',
      category: '干饭奶茶',
      cover: '',
      questionCount: 5,
      requiredPoints: 0,
      status: 'active',
      order: 3,
      scoringType: 'dimension',
      dimensionEmojis: {
        '奶茶续命': '🧋',
        '干饭第一': '🍚',
        '零食囤积': '🍫',
        '随缘吃啥': '🍃'
      },
      resultRules: [
        {
          dimension: '奶茶续命',
          title: '奶茶续命型选手',
          description: '你的校园日常是：上午一杯续命，下午一杯回血。你对奶茶店的新品比考试范围还熟悉。虽然奶茶快乐，但也记得偶尔喝点白开水，身体才是干饭的本钱。',
          emoji: '🧋'
        },
        {
          dimension: '干饭第一',
          title: '食堂干饭王',
          description: '你是那种下课铃一响就冲向食堂的人，对哪个窗口好吃、哪个阿姨手不抖了如指掌。你的饭卡消费记录就是一部校园美食地图。继续保持这份对食物的热爱吧。',
          emoji: '🍚'
        },
        {
          dimension: '零食囤积',
          title: '课桌零食库管理员',
          description: '你的课桌抽屉就是一个迷你小卖部，从辣条到饼干应有尽有。你不是在吃零食，就是在准备吃零食的路上。建议囤点健康小零食，吃得更安心。',
          emoji: '🍫'
        },
        {
          dimension: '随缘吃啥',
          title: '佛系饮食派',
          description: '你对吃这件事的态度是「什么都行」，别人纠结吃什么的时候你最淡定。这种心态挺好的，偶尔也给自己安排一顿想吃的，美食也是校园生活的快乐来源。',
          emoji: '🍃'
        }
      ],
      createTime: new Date().toISOString()
    },
    questions: [
      {
        text: '上午第三节课你开始犯困了，你会？',
        order: 1,
        options: [
          { text: '偷偷下单一杯奶茶等下课取', dimension: '奶茶续命' },
          { text: '忍住，等中午好好吃一顿', dimension: '干饭第一' },
          { text: '从抽屉摸出一包零食先垫垫', dimension: '零食囤积' },
          { text: '掐一下自己，再撑两节课', dimension: '随缘吃啥' }
        ]
      },
      {
        text: '中午冲向食堂的动力是什么？',
        order: 2,
        options: [
          { text: '食堂边上那家奶茶店出新品了', dimension: '奶茶续命' },
          { text: '今天有我超爱的红烧排骨', dimension: '干饭第一' },
          { text: '吃饱了正好回去消灭我的零食库存', dimension: '零食囤积' },
          { text: '该吃饭了就去吃呗', dimension: '随缘吃啥' }
        ]
      },
      {
        text: '放学路过小卖部你会买什么？',
        order: 3,
        options: [
          { text: '直奔冰柜拿一瓶饮料', dimension: '奶茶续命' },
          { text: '看看有没有新到的泡面', dimension: '干饭第一' },
          { text: '这周的零食还没囤够，多拿几包', dimension: '零食囤积' },
          { text: '转一圈没什么想买的就走', dimension: '随缘吃啥' }
        ]
      },
      {
        text: '晚自习到一半饿了，你的选择是？',
        order: 4,
        options: [
          { text: '翻翻书包看有没有漏掉的奶茶券', dimension: '奶茶续命' },
          { text: '默默计划等下吃什么夜宵', dimension: '干饭第一' },
          { text: '掏出提前准备好的小饼干', dimension: '零食囤积' },
          { text: '忍一忍，回去再吃', dimension: '随缘吃啥' }
        ]
      },
      {
        text: '朋友问你「等下吃什么」，你通常说？',
        order: 5,
        options: [
          { text: '先去买杯奶茶再说', dimension: '奶茶续命' },
          { text: '走，去食堂抢那个好吃的窗口', dimension: '干饭第一' },
          { text: '我带了零食，分你点就行', dimension: '零食囤积' },
          { text: '随便啊，你想吃什么', dimension: '随缘吃啥' }
        ]
      }
    ]
  },

  // ──────────────────────────────────────────────
  // 测试4: 摆烂回血指数 (recharge, score 模式)
  // ──────────────────────────────────────────────
  {
    test: {
      title: '摆烂回血指数测试',
      description: '测测你今天的电量还剩多少，是需要充电还是可以继续输出',
      category: '摆烂回血',
      cover: '',
      questionCount: 5,
      requiredPoints: 0,
      status: 'active',
      order: 4,
      scoringType: 'score',
      resultRules: [
        {
          minScore: 5,
          maxScore: 9,
          title: '电量严重不足',
          description: '你今天的电量已经亮红灯了，建议立刻给自己安排一段休息时间。不用觉得休息是浪费时间，充好电才能更好地出发。可以听听音乐、发发呆，先回一点血再说。',
          emoji: '🪫'
        },
        {
          minScore: 10,
          maxScore: 13,
          title: '半血待机中',
          description: '你的电量不是满的但也够用，属于「能撑但不太想撑」的状态。建议先完成一件小事情让自己进入状态，完成之后的成就感会帮你回血不少。',
          emoji: '🔋'
        },
        {
          minScore: 14,
          maxScore: 17,
          title: '电量充足',
          description: '今天的你状态不错，虽然不是那种鸡血满满的感觉，但该做的事情都能推进。趁着这波好状态把积压的任务处理一下，做完给自己一个小奖励。',
          emoji: '🔋'
        },
        {
          minScore: 18,
          maxScore: 20,
          title: '满电出发',
          description: '你今天的状态非常好，适合处理那些一直拖延没做的事情。不过也别一下子把电用光，合理分配精力，该休息的时候就休息，持续输出比爆发更有效。',
          emoji: '⚡'
        }
      ],
      createTime: new Date().toISOString()
    },
    questions: [
      {
        text: '今天起床时你的内心OS是？',
        order: 1,
        options: [
          { text: '我好累，不想面对今天', score: 1 },
          { text: '再让我躺五分钟就好', score: 2 },
          { text: '还行，新的一天开始了', score: 3 },
          { text: '今天有事要做，赶紧起来', score: 4 }
        ]
      },
      {
        text: '面对一堆作业的时候，你的反应是？',
        order: 2,
        options: [
          { text: '先放着，晚点再说（可能永远不会说）', score: 1 },
          { text: '挑最简单的先做，给自己一点信心', score: 2 },
          { text: '列个清单，按顺序慢慢来', score: 4 },
          { text: '直接开干，越想越不想做', score: 4 }
        ]
      },
      {
        text: '朋友突然约你出去玩，你的反应是？',
        order: 3,
        options: [
          { text: '好累，下次吧', score: 1 },
          { text: '如果是近的话可以考虑', score: 2 },
          { text: '好啊，出去走走正好换换心情', score: 4 },
          { text: '走！我正好也想出去', score: 4 }
        ]
      },
      {
        text: '晚上躺在床上的时候你在想什么？',
        order: 4,
        options: [
          { text: '明天能不能不上学', score: 1 },
          { text: '今天好像什么都没干就过去了', score: 2 },
          { text: '今天还做了不少事，明天继续', score: 3 },
          { text: '今天挺充实的，希望明天也这样', score: 4 }
        ]
      },
      {
        text: '你给自己今天的状态打几分？',
        order: 5,
        options: [
          { text: '1-2 分，基本没动', score: 1 },
          { text: '3-4 分，勉强及格', score: 2 },
          { text: '5-7 分，正常发挥', score: 3 },
          { text: '8-10 分，今天我很满意', score: 4 }
        ]
      }
    ]
  },

  // ──────────────────────────────────────────────
  // 测试5: 朋友搭子角色 (friends, dimension 模式)
  // ──────────────────────────────────────────────
  {
    test: {
      title: '你的朋友搭子角色',
      description: '你在朋友群里到底是什么担当？是气氛组还是军师，测一下就知道',
      category: '朋友搭子',
      cover: '',
      questionCount: 5,
      requiredPoints: 0,
      status: 'active',
      order: 5,
      scoringType: 'dimension',
      dimensionEmojis: {
        '气氛组': '🎉',
        '倾听者': '👂',
        '行动派': '🏃',
        '军师型': '🧠'
      },
      resultRules: [
        {
          dimension: '气氛组',
          title: '气氛组组长',
          description: '你是朋友圈里的开心果，有你在的地方就有笑声。你擅长活跃气氛，让每个聚会都不无聊。但也要记得，气氛组偶尔也需要有人来暖你，不开心的时候别一个人扛。',
          emoji: '🎉'
        },
        {
          dimension: '倾听者',
          title: '树洞倾听担当',
          description: '你是那种朋友有心事第一个想找的人，因为你从来不评判，只会安静地听。这种品质非常珍贵。不过也别只当别人的树洞，你有心事的时候也要学会说出来。',
          emoji: '👂'
        },
        {
          dimension: '行动派',
          title: '说走就走行动派',
          description: '你是朋友里最靠谱的那个，说好的事情一定会去做，约好的局从来不会放鸽子。你的执行力让大家都很信赖你。偶尔也可以允许自己偷个懒，不用什么事都冲在最前面。',
          emoji: '🏃'
        },
        {
          dimension: '军师型',
          title: '朋友圈军师',
          description: '你是那个大家遇到问题都来问意见的人，你的分析总是很到位。你有很强的洞察力和判断力。建议也多关注自己的感受，别把所有智慧都用在帮别人解决问题上。',
          emoji: '🧠'
        }
      ],
      createTime: new Date().toISOString()
    },
    questions: [
      {
        text: '朋友心情不好来找你，你通常会？',
        order: 1,
        options: [
          { text: '讲个笑话或者搞怪逗TA开心', dimension: '气氛组' },
          { text: '安静地听TA说完，给TA一个拥抱', dimension: '倾听者' },
          { text: '拉着TA出去走走，换个环境', dimension: '行动派' },
          { text: '帮TA分析问题，给出具体建议', dimension: '军师型' }
        ]
      },
      {
        text: '群聊里大家约周末去哪玩，你通常扮演的角色是？',
        order: 2,
        options: [
          { text: '各种提议，让讨论热闹起来', dimension: '气氛组' },
          { text: '看大家想去哪，我都行', dimension: '倾听者' },
          { text: '直接查好路线和时间发到群里', dimension: '行动派' },
          { text: '分析哪个方案性价比最高', dimension: '军师型' }
        ]
      },
      {
        text: '朋友之间发生了矛盾，你会怎么处理？',
        order: 3,
        options: [
          { text: '想办法缓和气氛，别让场面太僵', dimension: '气氛组' },
          { text: '分别听两边的想法，不急着站队', dimension: '倾听者' },
          { text: '约大家当面聊，别在群里吵', dimension: '行动派' },
          { text: '帮忙理清事情经过，找到解决办法', dimension: '军师型' }
        ]
      },
      {
        text: '朋友要做个重要决定来问你，你会？',
        order: 4,
        options: [
          { text: '鼓励TA相信自己的感觉，大胆选', dimension: '气氛组' },
          { text: '问TA心里更倾向于哪个选择', dimension: '倾听者' },
          { text: '帮TA把利弊列出来，快速做决定', dimension: '行动派' },
          { text: '从各个角度帮TA分析可能的后果', dimension: '军师型' }
        ]
      },
      {
        text: '你觉得朋友眼里的你是什么样的人？',
        order: 5,
        options: [
          { text: '永远有活力，有我就有快乐', dimension: '气氛组' },
          { text: '温柔体贴，什么都可以跟我说', dimension: '倾听者' },
          { text: '靠谱踏实，说到做到', dimension: '行动派' },
          { text: '冷静理性，关键时刻能拿主意', dimension: '军师型' }
        ]
      }
    ]
  }
]

exports.main = async (event, context) => {
  const results = []
  const db = cloud.database()

  // 检查是否已有测试数据（防止重复导入）
  var existingRes = await db.collection('tests').count()
  if (existingRes.total > 0) {
    // 清除旧数据
    var existingTests = await db.collection('tests').limit(100).get()
    for (var t = 0; t < existingTests.data.length; t++) {
      await db.collection('tests').doc(existingTests.data[t]._id).remove()
    }
    var existingQuestions = await db.collection('questions').limit(1000).get()
    for (var q = 0; q < existingQuestions.data.length; q++) {
      await db.collection('questions').doc(existingQuestions.data[q]._id).remove()
    }
  }

  for (var i = 0; i < TESTS_DATA.length; i++) {
    var testData = TESTS_DATA[i]

    // 1. 插入测试记录
    var testAddRes = await db.collection('tests').add({ data: testData.test })
    var testId = testAddRes._id

    // 2. 插入该测试的所有题目
    var questionRecords = []
    for (var j = 0; j < testData.questions.length; j++) {
      var q = testData.questions[j]
      questionRecords.push({
        testId: testId,
        text: q.text,
        order: q.order,
        options: q.options
      })
    }

    // 批量插入题目
    for (var k = 0; k < questionRecords.length; k++) {
      await db.collection('questions').add({ data: questionRecords[k] })
    }

    results.push({
      testId: testId,
      title: testData.test.title,
      questionCount: testData.questions.length
    })
  }

  return {
    code: 0,
    message: '测试数据导入成功',
    data: results
  }
}
