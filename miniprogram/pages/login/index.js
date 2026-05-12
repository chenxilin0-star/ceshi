var util = require('../../utils/util.js')

Page({
  data: {
    avatarUrl: '',
    nickName: '',
    canSubmit: false
  },

  onShareAppMessage: function () {
    return util.shareToFriend('来趣测星球测测你的性格！', '/pages/index/index')
  },

  onShareTimeline: function () {
    return util.shareToTimeline('来趣测星球测测你的性格！')
  },

  onChooseAvatar: function (e) {
    var avatarUrl = e.detail.avatarUrl
    this.setData({ avatarUrl: avatarUrl })
    this.checkCanSubmit()
  },

  onNicknameInput: function (e) {
    this.setData({ nickName: e.detail.value })
    this.checkCanSubmit()
  },

  onNicknameChange: function (e) {
    this.setData({ nickName: e.detail.value })
    this.checkCanSubmit()
  },

  checkCanSubmit: function () {
    var can = this.data.avatarUrl && this.data.nickName && this.data.nickName.trim().length > 0
    this.setData({ canSubmit: can })
  },

  onSubmit: function () {
    if (!this.data.canSubmit) return

    var that = this
    this.setData({ canSubmit: false })

    wx.showLoading({ title: '登录中...' })

    var avatarUrl = this.data.avatarUrl
    var nickName = this.data.nickName.trim()

    // 上传头像到云存储
    var cloudPath = 'avatars/' + Date.now() + '_' + Math.random().toString(36).slice(2) + '.jpg'
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: avatarUrl
    }).then(function (uploadRes) {
      var avatarFileID = uploadRes.fileID

      // 保存用户信息
      return wx.cloud.callFunction({
        name: 'updateUserProfile',
        data: {
          nickName: nickName,
          avatarUrl: avatarFileID
        }
      })
    }).then(function (res) {
      wx.hideLoading()

      var result = res.result
      if (result.code === 0) {
        // 更新全局用户信息
        var app = getApp()
        app.globalData.userInfo = result.user

        // 处理推荐关系（如果有）
        var pendingReferrerId = app.globalData.pendingReferrerId
        if (pendingReferrerId) {
          wx.cloud.callFunction({
            name: 'bindReferral',
            data: { referrerId: pendingReferrerId }
          }).then(function (refRes) {
            if (refRes.result && refRes.result.code === 0 && refRes.result.bound) {
              wx.showToast({ title: '推荐关系已绑定', icon: 'success' })
            }
          }).catch(function () {})
          app.globalData.pendingReferrerId = null
        }

        wx.showToast({ title: '登录成功', icon: 'success' })

        // 返回上一页
        setTimeout(function () {
          wx.navigateBack({
            fail: function () {
              // 如果没有上一页，跳首页
              wx.switchTab({ url: '/pages/index/index' })
            }
          })
        }, 500)
      } else {
        wx.showModal({
          title: '登录失败',
          content: result.msg || '请重试',
          showCancel: false
        })
        that.setData({ canSubmit: true })
      }
    }).catch(function (err) {
      wx.hideLoading()
      console.error('login submit error:', err)
      wx.showModal({
        title: '登录失败',
        content: '网络错误，请重试',
        showCancel: false
      })
      that.setData({ canSubmit: true })
    })
  }
})
