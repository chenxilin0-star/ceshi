var util = require('../../utils/util.js')

var BG_COLORS = ['#FFE0EB', '#E8F8F5', '#FFF0F5', '#E3F2FD', '#F3E5F5', '#FFF3E0', '#E8EAF6', '#E0F7FA']

Page({
  data: {
    prizes: [],
    loading: true,
    saving: false,
    totalProb: 0,
    showProductPicker: false,
    products: [],
    editingIndex: -1,
    showTypePicker: false
  },

  onLoad: function () {
    this.loadPrizes()
  },

  loadPrizes: function () {
    var that = this
    util.callFunction('getLotteryPrizes').then(function (res) {
      console.log('getLotteryPrizes result:', JSON.stringify(res))
      if (res.code === 0) {
        var prizes = res.prizes || []
        // 确保正好8个
        while (prizes.length < 8) {
          prizes.push({
            name: '谢谢参与',
            type: 'none',
            points: 0,
            productId: '',
            productName: '',
            probability: 0,
            bgColor: BG_COLORS[prizes.length],
            stock: null,
            remainingStock: null,
            order: prizes.length + 1,
            enabled: true
          })
        }
        that.setData({ prizes: prizes, loading: false })
        that.calcTotalProb()
      } else {
        that.setData({ loading: false })
        wx.showModal({
          title: '加载失败',
          content: res.msg || res.error || '未知错误(code:' + res.code + ')',
          showCancel: false
        })
      }
    }).catch(function (err) {
      console.error('getLotteryPrizes error:', err)
      that.setData({ loading: false })
      wx.showModal({
        title: '云函数调用失败',
        content: '请确认 getLotteryPrizes 云函数已上传部署。\n错误: ' + (err.errMsg || JSON.stringify(err)),
        showCancel: false
      })
    })
  },

  calcTotalProb: function () {
    var prizes = this.data.prizes
    var total = 0
    for (var i = 0; i < prizes.length; i++) {
      var v = parseFloat(prizes[i].probability)
      if (!isNaN(v)) total += v
    }
    total = Math.round(total * 10) / 10
    this.setData({ totalProb: total })
  },

  onNameInput: function (e) {
    var idx = e.currentTarget.dataset.index
    var val = e.detail.value
    this.setData({ ['prizes[' + idx + '].name']: val })
  },

  onTypeTap: function (e) {
    var idx = e.currentTarget.dataset.index
    this.setData({ showTypePicker: true, editingIndex: idx })
  },

  onTypeSelect: function (e) {
    var type = e.currentTarget.dataset.type
    var idx = this.data.editingIndex
    var update = {}
    update['prizes[' + idx + '].type'] = type
    if (type !== 'points') {
      update['prizes[' + idx + '].points'] = 0
    }
    if (type !== 'product') {
      update['prizes[' + idx + '].productId'] = ''
      update['prizes[' + idx + '].productName'] = ''
      update['prizes[' + idx + '].stock'] = null
      update['prizes[' + idx + '].remainingStock'] = null
    }
    this.setData(update)
    this.setData({ showTypePicker: false })
  },

  onTypeCancel: function () {
    this.setData({ showTypePicker: false })
  },

  onPointsInput: function (e) {
    var idx = e.currentTarget.dataset.index
    var val = parseFloat(e.detail.value) || 0
    this.setData({ ['prizes[' + idx + '].points']: val })
  },

  onProbInput: function (e) {
    var idx = e.currentTarget.dataset.index
    var raw = e.detail.value
    // 存原始字符串，保留用户正在输入的小数点（如 "0."）
    this.setData({ ['prizes[' + idx + '].probability']: raw })
    this.calcTotalProb()
  },

  onEnabledChange: function (e) {
    var idx = e.currentTarget.dataset.index
    var val = e.detail.value
    this.setData({ ['prizes[' + idx + '].enabled']: val })
  },

  onSelectProduct: function (e) {
    var idx = e.currentTarget.dataset.index
    var that = this
    this.setData({ editingIndex: idx })

    // 加载商品列表
    wx.showLoading({ title: '加载商品...' })
    util.callFunction('merchantGetProducts').then(function (res) {
      wx.hideLoading()
      if (res.code === 0) {
        that.setData({
          products: res.data || [],
          showProductPicker: true
        })
      } else {
        wx.showToast({ title: '获取商品失败', icon: 'none' })
      }
    }).catch(function () {
      wx.hideLoading()
      wx.showToast({ title: '获取商品失败', icon: 'none' })
    })
  },

  onProductSelect: function (e) {
    var pid = e.currentTarget.dataset.id
    var pname = e.currentTarget.dataset.name
    var idx = this.data.editingIndex
    var product = this.data.products.find(function (p) { return p._id === pid })
    var stock = product ? (product.remainingCount || product.totalCount || null) : null

    this.setData({
      ['prizes[' + idx + '].productId']: pid,
      ['prizes[' + idx + '].productName']: pname,
      ['prizes[' + idx + '].stock']: stock,
      ['prizes[' + idx + '].remainingStock']: stock,
      ['prizes[' + idx + '].name']: pname,
      showProductPicker: false
    })
  },

  onProductCancel: function () {
    this.setData({ showProductPicker: false })
  },

  onStockInput: function (e) {
    var idx = e.currentTarget.dataset.index
    var val = parseInt(e.detail.value) || 0
    this.setData({
      ['prizes[' + idx + '].stock']: val,
      ['prizes[' + idx + '].remainingStock']: val
    })
  },

  onSave: function () {
    if (this.data.saving) return
    var prizes = this.data.prizes

    // 构建提交数据，确保 probability 和 points 是数字
    var submitPrizes = []
    for (var i = 0; i < prizes.length; i++) {
      var p = prizes[i]
      var probVal = parseFloat(p.probability)
      if (isNaN(probVal)) probVal = 0
      probVal = Math.round(probVal * 10) / 10

      var pointsVal = parseFloat(p.points) || 0
      var stockVal = p.stock != null ? (parseInt(p.stock) || 0) : null

      submitPrizes.push({
        name: (p.name || '').trim(),
        type: p.type || 'none',
        points: pointsVal,
        productId: p.productId || '',
        productName: p.productName || '',
        probability: probVal,
        bgColor: p.bgColor || BG_COLORS[i],
        stock: stockVal,
        remainingStock: stockVal,
        order: i + 1,
        enabled: p.enabled !== false
      })
    }

    var total = 0
    for (var j = 0; j < submitPrizes.length; j++) {
      total += submitPrizes[j].probability
    }
    total = Math.round(total * 10) / 10

    if (total !== 100.0) {
      wx.showModal({
        title: '保存失败',
        content: '概率总和必须为100%，当前为' + total + '%',
        showCancel: false
      })
      return
    }

    // 校验每个奖项
    for (var k = 0; k < submitPrizes.length; k++) {
      var sp = submitPrizes[k]
      if (!sp.name) {
        wx.showModal({ title: '提示', content: '第' + (k + 1) + '个奖项名称不能为空', showCancel: false })
        return
      }
      if (sp.type === 'points' && sp.points <= 0) {
        wx.showModal({ title: '提示', content: '第' + (k + 1) + '个积分奖项必须设置积分数', showCancel: false })
        return
      }
      if (sp.type === 'product' && !sp.productId) {
        wx.showModal({ title: '提示', content: '第' + (k + 1) + '个实物奖项必须选择商品', showCancel: false })
        return
      }
    }

    this.setData({ saving: true })
    var that = this

    util.callFunction('saveLotteryPrizes', { prizes: submitPrizes }).then(function (res) {
      that.setData({ saving: false })
      if (res.code === 0) {
        wx.showToast({ title: '保存成功', icon: 'success' })
      } else {
        wx.showModal({ title: '保存失败', content: res.msg || '请重试', showCancel: false })
      }
    }).catch(function () {
      that.setData({ saving: false })
      wx.showModal({ title: '保存失败', content: '网络错误，请重试', showCancel: false })
    })
  },

  onShareAppMessage: function () {
    return util.shareToFriend('来趣测星球测测你的性格！', '/pages/index/index')
  },

  onShareTimeline: function () {
    return util.shareToTimeline('来趣测星球测测你的性格！')
  }
})
