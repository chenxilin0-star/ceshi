var util = require('../../utils/util.js')

Page({
  data: {
    isEdit: false,
    productId: '',
    name: '',
    image: '',
    tempFilePath: '',
    requiredPoints: '',
    totalCount: '',
    canSubmit: false,
    submitting: false
  },

  onLoad: function (options) {
    if (options && options.id) {
      this.setData({ isEdit: true, productId: options.id })
      wx.setNavigationBarTitle({ title: '编辑商品' })
      this.loadProduct(options.id)
    } else {
      wx.setNavigationBarTitle({ title: '添加商品' })
    }
  },

  loadProduct: function (productId) {
    var that = this
    util.callFunction('merchantGetProducts').then(function (res) {
      var product = (res.data || []).find(function (p) { return p._id === productId })
      if (product) {
        that.setData({
          name: product.name,
          image: product.image,
          requiredPoints: String(product.requiredPoints),
          totalCount: String(product.totalCount)
        })
        that.checkCanSubmit()
      }
    })
  },

  onNameInput: function (e) {
    this.setData({ name: e.detail.value })
    this.checkCanSubmit()
  },

  onPointsInput: function (e) {
    this.setData({ requiredPoints: e.detail.value })
    this.checkCanSubmit()
  },

  onCountInput: function (e) {
    this.setData({ totalCount: e.detail.value })
    this.checkCanSubmit()
  },

  checkCanSubmit: function () {
    var can = this.data.name && this.data.image && parseFloat(this.data.requiredPoints) > 0 && parseInt(this.data.totalCount) > 0 && !this.data.submitting
    this.setData({ canSubmit: can })
  },

  chooseImage: function () {
    var that = this
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        var tempFilePath = res.tempFilePaths[0]
        that.setData({ tempFilePath: tempFilePath })
        wx.showLoading({ title: '上传中...' })
        wx.cloud.uploadFile({
          cloudPath: 'products/' + Date.now() + '_' + Math.random().toString(36).slice(2) + '.jpg',
          filePath: tempFilePath
        }).then(function (uploadRes) {
          wx.hideLoading()
          that.setData({ image: uploadRes.fileID })
          that.checkCanSubmit()
        }).catch(function () {
          wx.hideLoading()
          wx.showToast({ title: '上传失败', icon: 'none' })
        })
      }
    })
  },

  submit: function () {
    if (!this.data.canSubmit || this.data.submitting) return

    var that = this
    this.setData({ submitting: true })

    var params = {
      name: this.data.name,
      image: this.data.image,
      requiredPoints: parseInt(this.data.requiredPoints),
      totalCount: parseInt(this.data.totalCount)
    }

    var funcName = this.data.isEdit ? 'merchantUpdateProduct' : 'merchantUploadProduct'
    if (this.data.isEdit) {
      params.productId = this.data.productId
    }

    util.callFunction(funcName, params).then(function (res) {
      that.setData({ submitting: false })
      if (res.code === 0) {
        wx.showToast({ title: that.data.isEdit ? '保存成功' : '添加成功', icon: 'success' })
        setTimeout(function () {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({ title: res.msg || '操作失败', icon: 'none' })
      }
    }).catch(function () {
      that.setData({ submitting: false })
      wx.showToast({ title: '操作失败', icon: 'none' })
    })
  },

  onShareAppMessage: function () {
    return util.shareToFriend('来趣测星球测测你的性格！', '/pages/index/index')
  },

  onShareTimeline: function () {
    return util.shareToTimeline('来趣测星球测测你的性格！')
  }
})
