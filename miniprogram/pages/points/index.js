var util = require('../../utils/util.js')


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

  // 通过云函数调用智谱 GLM-4V-Flash，避免前端暴露 API Key
  recognizeImage: function (fileID) {
    var that = this
    if (!fileID) {
      wx.showToast({ title: '请先上传小票', icon: 'none' })
      return
    }

    this.setData({ recognizing: true })
    util.callFunction('recognizeReceipt', { fileID: fileID }).then(function (res) {
      that.setData({ recognizing: false })
      if (res.code === 0) {
        if (res.parsed) {
          res.parsed.pointsPreview = Math.floor(res.parsed.amount || 0) / 10
        }
        that.setData({ ocrResult: res })
      } else {
        wx.showModal({
          title: '识别失败',
          content: res.msg || res.message || 'AI未返回结果',
          showCancel: false
        })
      }
    }).catch(function (err) {
      that.setData({ recognizing: false })
      wx.showModal({
        title: '请求失败',
        content: (err && err.errMsg) || '请检查 recognizeReceipt 云函数是否已部署',
        showCancel: false
      })
    })
  },

  // 确认提交积分
  submitReceipt: function () {
    if (this.data.submitting) return
    var that = this
    var ocrResult = this.data.ocrResult
    var parsed = ocrResult && ocrResult.parsed
    if (!parsed || !parsed.valid) {
      wx.showToast({ title: '请先上传并通过小票校验', icon: 'none' })
      return
    }
    if (!this.data.imageFileID) {
      wx.showToast({ title: '缺少小票图片', icon: 'none' })
      return
    }

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
