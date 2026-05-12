App({
  onLaunch: function (options) {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        traceUser: true
      })
    }

    // 处理带 referrerId 的启动参数
    if (options && options.query && options.query.referrerId) {
      this.globalData.pendingReferrerId = options.query.referrerId
    }
    if (options && options.query && options.query.scene) {
      this.globalData.pendingScene = decodeURIComponent(options.query.scene)
    }

    // 全局静默登录：获取 OPENID，创建/获取用户记录（不弹登录页）
    this.globalData.loginPromise = this.doLogin()
  },

  onShow: function (options) {
    if (options && options.query && options.query.referrerId) {
      this.globalData.pendingReferrerId = options.query.referrerId
      this.tryBindReferral()
    }
    if (options && options.query && options.query.scene) {
      this.globalData.pendingScene = decodeURIComponent(options.query.scene)
    }
  },

  doLogin: function () {
    var that = this
    return wx.cloud.callFunction({ name: 'login' }).then(function (res) {
      var result = res.result
      if (result.code === 0) {
        that.globalData.userInfo = result.user
        // 登录成功后自动处理待绑定的推荐关系
        that.tryBindReferral()
      }
      return result
    }).catch(function (err) {
      console.error('global login error', err)
      return { code: -1, msg: '登录失败' }
    })
  },

  // 尝试绑定推荐关系（登录后、或从分享链接进入时调用）
  tryBindReferral: function () {
    var referrerId = this.globalData.pendingReferrerId
    if (!referrerId) return
    var user = this.globalData.userInfo
    if (!user || !user._id) return
    this.globalData.pendingReferrerId = null
    wx.cloud.callFunction({
      name: 'bindReferral',
      data: { referrerId: referrerId }
    }).then(function (res) {
      if (res.result && res.result.code === 0 && res.result.bound) {
        wx.showToast({ title: '推荐关系已绑定', icon: 'success' })
      }
    }).catch(function () {})
  },

  // 检查是否已设置昵称头像（不跳转，只返回 true/false）
  isLoggedIn: function () {
    var user = this.globalData.userInfo
    return !!(user && user.nickName && user.nickName !== '微信用户')
  },

  // 需要登录的操作调用此方法：已登录直接返回用户，未登录跳转登录页
  requireLogin: function () {
    var that = this
    return new Promise(function (resolve, reject) {
      if (that.isLoggedIn()) {
        resolve(that.globalData.userInfo)
        return
      }

      // 等静默登录完成再判断
      that.globalData.loginPromise.then(function (result) {
        if (result.code === 0) {
          var user = result.user
          if (user.nickName && user.nickName !== '微信用户') {
            resolve(user)
            return
          }
        }
        // 需要完善资料，跳转登录页
        wx.navigateTo({
          url: '/pages/login/index'
        })
        reject({ code: -2, msg: '需要登录' })
      }).catch(function () {
        wx.navigateTo({
          url: '/pages/login/index'
        })
        reject({ code: -2, msg: '需要登录' })
      })
    })
  },

  globalData: {
    userInfo: null,
    pendingReferrerId: null,
    pendingScene: null,
    loginPromise: null
  }
})
