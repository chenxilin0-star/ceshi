var util = require('../../utils/util.js')

var ZHIPU_API_KEY = '15be10cfab554afa8c6e236bdabc2fee.KxUVZjDVLoOGcqBs'

Page({
  data: {
    userInfo: null,
    imageFileID: '',
    tempFilePath: '',
    recognizing: false,
    ocrResult: null,
    submitting: false,
    receipts: [],
    loading: true,
    pendingTakePhoto: false
  },

  onLoad: function () {
    var user = getApp().globalData.userInfo
    if (user) {
      this.setData({ userInfo: user })
    }
  },

  onShow: function () {
    // 从登录页返回后刷新
    var user = getApp().globalData.userInfo
    if (user && user.nickName && user.nickName !== '微信用户') {
      this.setData({ userInfo: user })
      this.getReceipts()
    }
    // 如果登录前点了拍照，登录返回后自动执行
    if (this.data.pendingTakePhoto && getApp().isLoggedIn()) {
      this.setData({ pendingTakePhoto: false })
      this.doTakePhoto()
    }
  },

  getReceipts: function () {
    var that = this
    util.callFunction('getReceipts').then(function (res) {
      var list = (res.list || []).map(function (item) {
        item.createTimeShort = util.formatTime(item.createTime)
        return item
      })
      that.setData({ receipts: list, loading: false })
    }).catch(function () {
      that.setData({ loading: false })
    })
  },

  // 刷新用户信息（更新积分显示）
  refreshUserInfo: function () {
    var that = this
    util.callFunction('login').then(function (res) {
      if (res.code === 0) {
        that.setData({ userInfo: res.user })
        getApp().globalData.userInfo = res.user
      }
    })
  },

  // 拍照（仅相机，不允许相册）→ 需要登录
  takePhoto: function () {
    var that = this
    // 先检查登录
    getApp().requireLogin().then(function () {
      that.doTakePhoto()
    }).catch(function () {
      // 标记待执行操作，登录返回后 onShow 中继续
      that.setData({ pendingTakePhoto: true })
    })
  },

  doTakePhoto: function () {
    var that = this
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: function (res) {
        var tempFilePath = res.tempFilePaths[0]
        that.setData({
          tempFilePath: tempFilePath,
          ocrResult: null
        })

        wx.showLoading({ title: '上传中...' })
        wx.cloud.uploadFile({
          cloudPath: 'receipts/' + Date.now() + '_' + Math.random().toString(36).slice(2) + '.jpg',
          filePath: tempFilePath
        }).then(function (uploadRes) {
          wx.hideLoading()
          that.setData({ imageFileID: uploadRes.fileID })
          that.recognizeImage(uploadRes.fileID)
        }).catch(function () {
          wx.hideLoading()
          wx.showToast({ title: '上传失败', icon: 'none' })
        })
      }
    })
  },

  // 前端直接调用智谱 GLM-4V-Flash
  recognizeImage: function (fileID) {
    var that = this
    this.setData({ recognizing: true })

    wx.cloud.getTempFileURL({
      fileList: [fileID]
    }).then(function (res) {
      var imageUrl = res.fileList[0].tempFileURL

      var prompt = '请仔细识别这张支付凭证/小票图片，提取以下字段信息。\n\n需要提取的字段：\n1. product: 商品名称，只接受 "B-8号档口" 或 "B-7号档口"，如果不是这两个值则为空字符串\n2. status: 支付状态，查找"当前状态"对应的值\n3. transactionId: 交易单号，是一个28位纯数字\n4. merchant: 商户全称\n5. hasXuefu: 图片中是否包含"学府美食城"字样，布尔值\n6. amount: 消费金额，找出负数金额取其绝对值（即实际消费了多少钱）\n7. rawText: 图片中所有能识别到的文字内容\n\n请严格按以下JSON格式返回，不要返回任何其他内容：\n{"product":"","status":"","transactionId":"","merchant":"","hasXuefu":false,"amount":0,"rawText":""}'

      wx.request({
        url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        method: 'POST',
        timeout: 30000,
        header: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + ZHIPU_API_KEY
        },
        data: {
          model: 'glm-4v-flash',
          messages: [{
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: imageUrl } },
              { type: 'text', text: prompt }
            ]
          }],
          temperature: 0.1,
          max_tokens: 1024
        },
        success: function (res) {
          that.setData({ recognizing: false })

          if (res.statusCode !== 200) {
            wx.showModal({
              title: '识别失败',
              content: '状态码: ' + res.statusCode,
              showCancel: false
            })
            return
          }

          var content = ''
          if (res.data && res.data.choices && res.data.choices[0]) {
            content = res.data.choices[0].message.content
          }

          if (!content) {
            wx.showModal({ title: '识别失败', content: 'AI未返回结果', showCancel: false })
            return
          }

          var jsonMatch = content.match(/\{[\s\S]*\}/)
          if (!jsonMatch) {
            wx.showModal({ title: '识别失败', content: '返回格式异常', showCancel: false })
            return
          }

          var aiResult
          try {
            aiResult = JSON.parse(jsonMatch[0])
          } catch (e) {
            wx.showModal({ title: '识别失败', content: 'JSON解析失败', showCancel: false })
            return
          }

          var parsed = {
            product: aiResult.product || '',
            status: aiResult.status || '',
            transactionId: String(aiResult.transactionId || ''),
            merchant: aiResult.merchant || '',
            hasXuefu: !!aiResult.hasXuefu,
            amount: parseFloat(aiResult.amount) || 0
          }

          var errors = []
          if (!parsed.product) {
            errors.push('未识别到商品名称（需为 B-8号档口 或 B-7号档口）')
          } else if (parsed.product !== 'B-8号档口' && parsed.product !== 'B-7号档口') {
            errors.push('商品名称不匹配：' + parsed.product)
          }
          if (parsed.status !== '支付成功') {
            errors.push('状态不是支付成功（当前：' + (parsed.status || '未识别') + '）')
          }
          if (!parsed.transactionId || !/^\d{28}$/.test(parsed.transactionId)) {
            errors.push('交易单号不正确（需为28位数字）')
          }
          if (parsed.merchant.indexOf('四川青瑞和餐饮管理有限公司') === -1) {
            errors.push('商户全称不匹配（当前：' + (parsed.merchant || '未识别') + '）')
          }
          if (!parsed.hasXuefu) {
            errors.push('未包含"学府美食城"字样')
          }
          if (parsed.amount <= 0) {
            errors.push('未识别到消费金额')
          }

          parsed.errors = errors
          parsed.valid = errors.length === 0
          parsed.pointsPreview = Math.floor(parsed.amount) / 10

          that.setData({
            ocrResult: {
              code: 0,
              rawText: aiResult.rawText || content,
              parsed: parsed
            }
          })
        },
        fail: function (err) {
          that.setData({ recognizing: false })
          wx.showModal({
            title: '请求失败',
            content: '请检查网络，或在微信后台添加 request 合法域名：open.bigmodel.cn',
            showCancel: false
          })
        }
      })
    }).catch(function () {
      that.setData({ recognizing: false })
      wx.showToast({ title: '获取图片链接失败', icon: 'none' })
    })
  },

  // 确认提交积分
  submitReceipt: function () {
    if (this.data.submitting) return
    var that = this
    var parsed = this.data.ocrResult.parsed

    this.setData({ submitting: true })

    util.callFunction('uploadReceipt', {
      amount: parsed.amount,
      transactionId: parsed.transactionId,
      product: parsed.product,
      merchant: parsed.merchant,
      imageFileID: this.data.imageFileID
    }).then(function (res) {
      that.setData({ submitting: false })
      if (res.code === 0) {
        wx.showToast({ title: '+' + res.pointsEarned + '积分', icon: 'success' })
        // 重置状态
        that.setData({
          imageFileID: '',
          tempFilePath: '',
          ocrResult: null
        })
        // 刷新积分和记录列表
        that.getReceipts()
        that.refreshUserInfo()
      } else {
        wx.showModal({
          title: '提交失败',
          content: res.msg || '未知错误',
          showCancel: false
        })
      }
    }).catch(function (err) {
      that.setData({ submitting: false })
      wx.showModal({
        title: '提交异常',
        content: JSON.stringify(err).substring(0, 300),
        showCancel: false
      })
    })
  },

  // 重新拍照
  retakePhoto: function () {
    this.setData({
      imageFileID: '',
      tempFilePath: '',
      ocrResult: null
    })
    this.takePhoto()
  },

  goProductList: function () {
    wx.navigateTo({
      url: '/pages/product-list/index'
    })
  },

  onShareAppMessage: function () {
    return util.shareToFriend('在趣测星球赚积分，免费兑换好礼！', '/pages/index/index')
  },

  onShareTimeline: function () {
    return util.shareToTimeline('在趣测星球赚积分，免费兑换好礼！')
  }
})
