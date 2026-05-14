var util = require('../../utils/util.js')

var DEG_PER_SLOT = 360 / 8

// 默认颜色（加载远程配置前的 fallback）
var DEFAULT_COLORS = ['#FFE0EB', '#E8F8F5', '#FFF0F5', '#E3F2FD', '#F3E5F5', '#FFF3E0', '#E8EAF6', '#E0F7FA']

Page({
  data: {
    userInfo: null,
    spinning: false,
    wheelRotation: 0,
    wheelImage: '',
    remainChances: { free: 1, share: 0, retry: 0 },
    totalChances: 1,
    showResult: false,
    resultPrize: null,
    pendingShareSpin: false,
    wheelItems: [] // 动态奖项
  },

  onLoad: function () {
    var user = getApp().globalData.userInfo
    if (user) {
      this.setData({ userInfo: user })
    }
    this.loadPrizes()
    this.checkChances()
  },

  loadPrizes: function () {
    var that = this
    util.callFunction('getLotteryPrizes').then(function (res) {
      if (res.code === 0 && res.prizes && res.prizes.length > 0) {
        var items = []
        for (var i = 0; i < res.prizes.length && i < 8; i++) {
          var p = res.prizes[i]
          items.push({
            label: p.name || '谢谢参与',
            bg: p.bgColor || DEFAULT_COLORS[i],
            order: p.order || (i + 1),
            enabled: p.enabled !== false
          })
        }
        // 不足8个时补齐
        while (items.length < 8) {
          items.push({
            label: '谢谢参与',
            bg: DEFAULT_COLORS[items.length],
            order: items.length + 1,
            enabled: true
          })
        }
        that.setData({ wheelItems: items })
        that.drawWheel()
      } else {
        // fallback：使用默认
        that.setData({
          wheelItems: [
            { label: '谢谢参与', bg: '#FFE0EB', order: 1, enabled: true },
            { label: '1积分', bg: '#E8F8F5', order: 2, enabled: true },
            { label: '谢谢参与', bg: '#FFF0F5', order: 3, enabled: true },
            { label: '5积分', bg: '#E3F2FD', order: 4, enabled: true },
            { label: '谢谢参与', bg: '#F3E5F5', order: 5, enabled: true },
            { label: '再来一次', bg: '#FFF3E0', order: 6, enabled: true },
            { label: '8积分', bg: '#E8EAF6', order: 7, enabled: true },
            { label: '10积分', bg: '#E0F7FA', order: 8, enabled: true }
          ]
        })
        that.drawWheel()
      }
    }).catch(function () {
      that.setData({
        wheelItems: [
          { label: '谢谢参与', bg: '#FFE0EB', order: 1, enabled: true },
          { label: '1积分', bg: '#E8F8F5', order: 2, enabled: true },
          { label: '谢谢参与', bg: '#FFF0F5', order: 3, enabled: true },
          { label: '5积分', bg: '#E3F2FD', order: 4, enabled: true },
          { label: '谢谢参与', bg: '#F3E5F5', order: 5, enabled: true },
          { label: '再来一次', bg: '#FFF3E0', order: 6, enabled: true },
          { label: '8积分', bg: '#E8EAF6', order: 7, enabled: true },
          { label: '10积分', bg: '#E0F7FA', order: 8, enabled: true }
        ]
      })
      that.drawWheel()
    })
  },

  onShow: function () {
    var user = getApp().globalData.userInfo
    if (user && user.nickName && user.nickName !== '微信用户') {
      this.setData({ userInfo: user })
    }
    if (this.data.pendingShareSpin && getApp().isLoggedIn()) {
      this.grantShareChance('share_return')
    } else {
      this.checkChances()
    }
  },

  drawWheel: function () {
    var that = this
    var wheelItems = this.data.wheelItems
    if (wheelItems.length === 0) return

    var query = wx.createSelectorQuery()
    query.select('#wheelCanvas').fields({ node: true, size: true }).exec(function (res) {
      if (!res || !res[0]) return
      var canvas = res[0].node
      var ctx = canvas.getContext('2d')
      var dpr = wx.getWindowInfo().pixelRatio
      var size = res[0].width
      canvas.width = size * dpr
      canvas.height = size * dpr
      ctx.scale(dpr, dpr)

      var cx = size / 2
      var cy = size / 2
      var r = cx - 8
      var count = wheelItems.length
      var angle = 2 * Math.PI / count

      for (var i = 0; i < count; i++) {
        var startA = i * angle - Math.PI / 2
        var endA = startA + angle

        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, r, startA, endA)
        ctx.closePath()
        ctx.fillStyle = wheelItems[i].bg
        ctx.fill()
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(startA + angle / 2)
        ctx.fillStyle = '#333333'
        ctx.font = 'bold 14px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(wheelItems[i].label, r * 0.6, 0)
        ctx.restore()
      }

      // 画中心圆
      ctx.beginPath()
      ctx.arc(cx, cy, 30, 0, 2 * Math.PI)
      ctx.fillStyle = '#FF6B9D'
      ctx.fill()
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 16px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('GO', cx, cy)

      setTimeout(function () {
        wx.canvasToTempFilePath({
          canvas: canvas,
          success: function (imgRes) {
            that.setData({ wheelImage: imgRes.tempFilePath })
          }
        })
      }, 200)
    })
  },

  checkChances: function (callback) {
    var that = this
    if (!getApp().isLoggedIn()) {
      this.setData({ totalChances: 0 })
      if (callback) callback()
      return
    }

    util.callFunction('getLotteryChances').then(function (res) {
      if (res.code === 0 && res.remainChances) {
        var chances = res.remainChances
        var total = chances.free + chances.share + chances.retry
        that.setData({
          remainChances: chances,
          totalChances: total
        })
      } else {
        that.setData({
          remainChances: { free: 1, share: 0, retry: 0 },
          totalChances: 1
        })
      }
      if (callback) callback()
    }).catch(function () {
      that.setData({
        remainChances: { free: 1, share: 0, retry: 0 },
        totalChances: 1
      })
      if (callback) callback()
    })
  },

  onSpin: function () {
    var that = this
    if (this.data.spinning) return

    getApp().requireLogin().then(function () {
      that.checkChances(function () {
        var chances = that.data.remainChances
        if (chances.retry > 0) {
          that.doSpin('retry')
        } else if (chances.free > 0) {
          that.doSpin('free')
        } else if (chances.share > 0) {
          that.doSpin('share')
        } else {
          wx.showToast({ title: '今日抽奖次数已用完', icon: 'none' })
        }
      })
    }).catch(function () {})
  },

  doSpin: function (source) {
    var that = this
    if (this.data.spinning) return

    this.setData({ showResult: false, spinning: true })
    wx.showLoading({ title: '抽奖中...', mask: true })

    util.callFunction('spinLottery', { source: source }).then(function (res) {
      wx.hideLoading()

      if (res.code !== 0) {
        that.setData({ spinning: false })
        wx.showModal({
          title: '抽奖失败',
          content: res.msg || '请重试',
          showCancel: false
        })
        that.checkChances()
        return
      }

      var prize = res.prize
      var wheelItems = that.data.wheelItems

      // 通过 order 匹配转盘扇区位置
      var slotIndex = 0
      var targetOrder = Number(prize.order || 1)
      for (var j = 0; j < wheelItems.length; j++) {
        if (Number(wheelItems[j].order) === targetOrder) {
          slotIndex = j
          break
        }
      }

      // 指针固定在12点方向，按实际奖品 order 对齐对应扇区，避免视觉扇区与弹窗奖品不一致
      var slotDeg = 360 / (wheelItems.length || 8)
      var targetAngle = (360 - (slotIndex * slotDeg + slotDeg / 2)) % 360

      // 先把上次的旋转对齐到整圈，再加 6 圈 + 目标角度
      var baseRotation = Math.ceil(that.data.wheelRotation / 360) * 360
      var newRotation = baseRotation + 360 * 6 + targetAngle

      that.setData({ wheelRotation: newRotation })

      setTimeout(function () {
        that.setData({ spinning: false })

        if (res.pointsEarned > 0) {
          var user = getApp().globalData.userInfo
          if (user) {
            user.totalPoints = (user.totalPoints || 0) + res.pointsEarned
            getApp().globalData.userInfo = user
            that.setData({ userInfo: user })
          }
        }

        that.setData({
          showResult: true,
          resultPrize: prize,
          remainChances: res.remainChances,
          totalChances: res.remainChances.free + res.remainChances.share + res.remainChances.retry
        })
      }, 4200)
    }).catch(function () {
      wx.hideLoading()
      that.setData({ spinning: false })
      wx.showModal({
        title: '网络错误',
        content: '请检查网络后重试',
        showCancel: false
      })
    })
  },

  closeResult: function () {
    this.setData({ showResult: false })
  },

  onRetry: function () {
    this.setData({ showResult: false })
    this.doSpin('retry')
  },

  grantShareChance: function (scene) {
    var that = this
    util.callFunction('recordLotteryShare', { scene: scene || 'share_return' }).then(function (res) {
      that.setData({ pendingShareSpin: false })
      if (res && res.code === 0) {
        wx.showToast({ title: res.added ? '已获得1次额外抽奖机会' : '今日分享机会已达上限', icon: 'none' })
      }
      that.checkChances()
    }).catch(function () {
      that.setData({ pendingShareSpin: false })
      that.checkChances()
    })
  },

  onShareAppMessage: function () {
    this.setData({ pendingShareSpin: true })
    return util.shareToFriend('快来趣测星球抽奖，赢积分换好礼！', '/pages/index/index')
  },

  onShareTimeline: function () {
    this.setData({ pendingShareSpin: true })
    return util.shareToTimeline('快来趣测星球抽奖，赢积分换好礼！')
  }
})
