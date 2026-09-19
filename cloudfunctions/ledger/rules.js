// Keep identical to miniprogram/utils/ledgerRules.js (separate cloud deployment).
var BOOKS = { personal: '日常账本', business: '生意账本' }
var CATEGORIES = {
  personal: { income: ['生活费', '兼职', '奖学金', '退款', '其他收入'], expense: ['餐饮', '零食饮料', '交通', '学习用品', '购物', '娱乐', '其他支出'] },
  business: { income: ['营业额', '其他收入'], expense: ['买菜食材', '肉蛋水产', '调料粮油', '包装耗材', '水电燃气', '房租', '人工', '设备', '退款', '其他支出'] }
}
function fail(message) { throw new Error(message) }
function validDate(value) {
  if (typeof value !== 'string' || !/^20\d{2}-\d{2}-\d{2}$/.test(value)) return false
  var d = new Date(value + 'T00:00:00.000Z')
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
}
function amountToCents(value) {
  if (typeof value !== 'string' || !/^(0|[1-9]\d{0,6})(\.\d{1,2})?$/.test(value)) fail('金额须大于0，最多两位小数，上限9,999,999.99元')
  var parts = value.split('.')
  var cents = Number(parts[0]) * 100 + Number(((parts[1] || '') + '00').slice(0, 2))
  if (cents <= 0) fail('金额须大于0')
  return cents
}
function validateEntry(input) {
  if (!Object.prototype.hasOwnProperty.call(BOOKS, input.book)) fail('请选择账本')
  if (input.type !== 'income' && input.type !== 'expense') fail('请选择收入或支出')
  if (CATEGORIES[input.book][input.type].indexOf(input.category) < 0) fail('请选择有效分类')
  if (!validDate(input.date)) fail('请选择有效日期（2000—2099年）')
  if (typeof input.note !== 'string' || input.note.length > 100) fail('备注最多100字')
  return { book: input.book, type: input.type, category: input.category, date: input.date, amountCents: amountToCents(input.amount), note: input.note.trim() }
}
function periodRange(mode, period) {
  if (mode === 'day' && validDate(period)) return { start: period, end: period }
  if (mode !== 'month' || typeof period !== 'string' || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(period)) fail('请选择有效月份或日期')
  var parts = period.split('-')
  var last = new Date(Date.UTC(Number(parts[0]), Number(parts[1]), 0)).getUTCDate()
  return { start: period + '-01', end: period + '-' + last }
}
function money(cents) {
  var abs = Math.abs(cents)
  return (cents < 0 ? '-' : '') + Math.floor(abs / 100) + '.' + ('0' + (abs % 100)).slice(-2)
}
function today() {
  return new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10)
}
module.exports = { BOOKS: BOOKS, CATEGORIES: CATEGORIES, validDate: validDate, amountToCents: amountToCents, validateEntry: validateEntry, periodRange: periodRange, money: money, today: today }
