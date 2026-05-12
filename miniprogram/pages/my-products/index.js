var util = require('../../utils/util.js')
var qrcode = require('../../utils/qrcode.js')

Page({
  data: {
    products: [],
    filteredProducts: [],
    activeTab: 'unused',
    unusedCount: 0
  },

  onLoad: function () {
    this.loadProducts()
  },

  onShow: function () {
    this.loadProducts()
  },

  loadProducts: function () {
    var that = this
    util.callFunction('getMyProducts').then(function (res) {
      var now = new Date()
      var products = (res.list || []).map(function (item) {
        item.expireAtShort = item.expireAt ? item.expireAt.split('T')[0] : '--'
        item.usedAtShort = item.usedAt ? util.formatTime(item.usedAt) : ''
        // Create masked version of verify code
        if (item.verifyCode && item.verifyCode.length === 8) {
          item.verifyCodeMasked = item.verifyCode.substring(0, 2) + '****' + item.verifyCode.substring(6)
        }
        item.showCode = false

        // Real-time check for expired status
        if (item.status === 'unused' && item.expireAt) {
          var expireDate = new Date(item.expireAt)
          if (expireDate <= now) {
            item.status = 'expired'
          }
        }

        return item
      })
      var unusedCount = products.filter(function (p) { return p.status === 'unused' }).length
      that.setData({
        products: products,
        unusedCount: unusedCount
      })
      that.filterProducts()
    }).catch(function (err) {
      console.error('getMyProducts error', err)
    })
  },

  switchTab: function (e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab })
    this.filterProducts()
  },

  filterProducts: function () {
    var tab = this.data.activeTab
    var filtered = this.data.products.filter(function (p) { return p.status === tab })
    this.setData({ filteredProducts: filtered })
  },

  toggleCode: function (e) {
    var id = e.currentTarget.dataset.id
    var idx = e.currentTarget.dataset.index
    var products = this.data.products
    var targetItem = null
    for (var i = 0; i < products.length; i++) {
      if (products[i]._id === id) {
        products[i].showCode = !products[i].showCode
        targetItem = products[i]
        break
      }
    }
    this.setData({ products: products })
    this.filterProducts()

    // Draw QR code when showing the verify code
    if (targetItem && targetItem.showCode && targetItem.verifyCode) {
      var that = this
      setTimeout(function () {
        qrcode.drawQRCode('#qrcode-' + idx, targetItem.verifyCode, 200, function (err) {
          if (err) console.error('QR code draw error:', err)
        })
      }, 100)
    }
  },

  onShareAppMessage: function () {
    return util.shareToFriend('我在趣测星球兑换了好礼，快来看看！', '/pages/index/index')
  },

  onShareTimeline: function () {
    return util.shareToTimeline('我在趣测星球兑换了好礼，快来看看！')
  }
})
