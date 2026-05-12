var util = require('../../utils/util.js')

Page({
  data: {
    products: [],
    loading: true
  },

  onLoad: function () {
    this.loadProducts()
  },

  onShow: function () {
    this.loadProducts()
  },

  loadProducts: function () {
    var that = this
    util.callFunction('merchantGetProducts').then(function (res) {
      var products = (res.data || []).map(function (item) {
        item.createTimeShort = item.createTime ? item.createTime.split('T')[0] : '--'
        item.statusText = item.status === 'active' ? '上架中' : '已下架'
        return item
      })
      that.setData({ products: products, loading: false })
    }).catch(function () {
      that.setData({ loading: false })
    })
  },

  goAddProduct: function () {
    wx.navigateTo({ url: '/pages/merchant-product-edit/index' })
  },

  goEditProduct: function (e) {
    var id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/merchant-product-edit/index?id=' + id })
  },

  toggleProduct: function (e) {
    var id = e.currentTarget.dataset.id
    var currentStatus = e.currentTarget.dataset.status
    var that = this

    if (currentStatus === 'active') {
      wx.showModal({
        title: '确认下架',
        content: '确定要下架该商品吗？',
        success: function (res) {
          if (res.confirm) {
            that.deleteProduct(id)
          }
        }
      })
    }
  },

  deleteProduct: function (productId) {
    var that = this
    wx.showLoading({ title: '操作中...' })
    util.callFunction('merchantDeleteProduct', { productId: productId }).then(function (res) {
      wx.hideLoading()
      if (res.code === 0) {
        wx.showToast({ title: '已下架', icon: 'success' })
        that.loadProducts()
      } else {
        wx.showToast({ title: res.msg || '操作失败', icon: 'none' })
      }
    }).catch(function () {
      wx.hideLoading()
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
