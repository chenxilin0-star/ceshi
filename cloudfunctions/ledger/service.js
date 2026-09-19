const crypto = require('crypto')
const rules = require('./rules')
const COLLECTION = 'ledger_entries'
const PAGE_SIZE = 30
const ERROR = { invalid: -2, missing: -3, conflict: -4, unauthenticated: -5 }
function issue(code, message) { const e = new Error(message); e.code = code; throw e }
function requireId(id) { if (typeof id !== 'string' || !/^[a-f0-9]{40}$/.test(id)) issue(ERROR.invalid, '记录编号无效') }
function token(value) { if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{16,80}$/.test(value)) issue(ERROR.invalid, '请求编号无效') }
function publicEntry(row) {
  return { _id: row._id, book: row.book, type: row.type, date: row.date, category: row.category, amountCents: row.amountCents, note: row.note, version: row.version }
}
function fingerprint(entry) { return JSON.stringify(entry) }
function createService(db) {
  const col = () => db.collection(COLLECTION)
  async function owned(openid, id) {
    requireId(id)
    const res = await col().where({ _id: id, _openid: openid }).limit(1).get()
    if (!res.data.length) issue(ERROR.missing, '记录不存在或无权访问')
    return res.data[0]
  }
  async function list(openid, event) {
    if (!Object.prototype.hasOwnProperty.call(rules.BOOKS, event.book)) issue(ERROR.invalid, '请选择账本')
    const range = rules.periodRange(event.mode, event.period)
    const offset = event.offset === undefined ? 0 : event.offset
    if (!Number.isInteger(offset) || offset < 0 || offset > 100000) issue(ERROR.invalid, '分页参数无效')
    const scope = { _openid: openid, book: event.book, deleted: false, date: db.command.gte(range.start).and(db.command.lte(range.end)) }
    const $ = db.command.aggregate
    const [rows, groups] = await Promise.all([
      col().where(scope).orderBy('date', 'desc').orderBy('_id', 'desc').skip(offset).limit(PAGE_SIZE + 1).get(),
      col().aggregate().match(scope).group({ _id: '$type', cents: $.sum('$amountCents'), count: $.sum(1) }).end()
    ])
    const summary = { incomeCents: 0, expenseCents: 0, balanceCents: 0, count: 0 }
    for (const group of groups.list) {
      if (group._id === 'income') summary.incomeCents = group.cents
      if (group._id === 'expense') summary.expenseCents = group.cents
      summary.count += group.count
    }
    summary.balanceCents = summary.incomeCents - summary.expenseCents
    if (![summary.incomeCents, summary.expenseCents, summary.balanceCents].every(Number.isSafeInteger)) throw new Error('汇总金额超过精度范围')
    return { code: 0, list: rows.data.slice(0, PAGE_SIZE).map(publicEntry), hasMore: rows.data.length > PAGE_SIZE, summary }
  }
  async function save(openid, event) {
    token(event.requestId)
    const entry = rules.validateEntry(event)
    if (!event.id) {
      const id = crypto.createHash('sha256').update(openid + ':' + event.requestId).digest('hex').slice(0, 40)
      const row = Object.assign({}, entry, { _id: id, _openid: openid, deleted: false, version: 1, createdAt: db.serverDate(), updatedAt: db.serverDate() })
      try { await col().add({ data: row }) } catch (err) {
        const old = await col().where({ _id: id, _openid: openid }).limit(1).get()
        if (!old.data.length) throw err
        const previous = old.data[0]
        if (previous.deleted || previous.version !== 1 || fingerprint(entry) !== fingerprint(rules.validateEntry(Object.assign({}, previous, { amount: rules.money(previous.amountCents) })))) {
          issue(ERROR.conflict, '这笔记录已保存或已变更，请返回账本刷新后查看')
        }
      }
      return { code: 0, id }
    }
    const current = await owned(openid, event.id)
    if (current.lastRequestId === event.requestId && current.lastAction === 'save') return { code: 0, id: event.id }
    if (current.deleted) issue(ERROR.missing, '记录已删除')
    if (!Number.isInteger(event.version) || event.version !== current.version) issue(ERROR.conflict, '记录已在其他地方修改，请返回账本刷新后重试')
    if (entry.book !== current.book) issue(ERROR.invalid, '不能修改记录所属账本')
    const result = await col().where({ _id: event.id, _openid: openid, deleted: false, version: event.version }).update({
      data: Object.assign({}, entry, { version: current.version + 1, lastRequestId: event.requestId, lastAction: 'save', updatedAt: db.serverDate() })
    })
    if (result.stats.updated !== 1) issue(ERROR.conflict, '记录已变更，请返回账本刷新后重试')
    return { code: 0, id: event.id }
  }
  async function remove(openid, event) {
    token(event.requestId)
    const current = await owned(openid, event.id)
    if (current.deleted && current.lastRequestId === event.requestId && current.lastAction === 'delete') return { code: 0 }
    if (current.deleted) issue(ERROR.missing, '记录已删除')
    if (!Number.isInteger(event.version) || current.version !== event.version) issue(ERROR.conflict, '记录已变更，请返回账本刷新后重试')
    const result = await col().where({ _id: event.id, _openid: openid, deleted: false, version: event.version }).update({ data: {
      deleted: true, version: current.version + 1, lastRequestId: event.requestId, lastAction: 'delete', updatedAt: db.serverDate()
    } })
    if (result.stats.updated !== 1) issue(ERROR.conflict, '记录已变更，请返回账本刷新后重试')
    return { code: 0 }
  }
  return async function handle(event, openid) {
    try {
      if (typeof openid !== 'string' || !openid) issue(ERROR.unauthenticated, '请在微信中重新打开记账')
      if (!event || typeof event !== 'object') issue(ERROR.invalid, '请求无效')
      if (event.action === 'list') return await list(openid, event)
      if (event.action === 'get') {
        const row = await owned(openid, event.id)
        if (row.deleted) issue(ERROR.missing, '记录已删除')
        return { code: 0, entry: publicEntry(row) }
      }
      if (event.action === 'save') return await save(openid, event)
      if (event.action === 'delete') return await remove(openid, event)
      issue(ERROR.invalid, '不支持的操作')
    } catch (err) {
      if (Object.values(ERROR).includes(err.code)) return { code: err.code, msg: err.message }
      if (/^(金额|请选择|备注)/.test(err.message)) return { code: ERROR.invalid, msg: err.message }
      return { code: -1, msg: '账本暂时无法连接，请稍后重试；保存操作请勿重复新建' }
    }
  }
}
module.exports = { createService, COLLECTION }
