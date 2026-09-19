const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const handle = require('./service').createService(cloud.database())
exports.main = async (event) => handle(event, cloud.getWXContext().OPENID)
