function countBySource(records, source) {
  return records.filter(function (r) { return r.source === source }).length
}

function hasRetryPrize(records) {
  return records.some(function (r) {
    return r.prizeType === 'retry' && r.source !== 'retry'
  })
}

function normalizeShareEarned(shareState) {
  var earned = shareState && typeof shareState.earned === 'number' ? shareState.earned : 0
  if (earned < 0) earned = 0
  if (earned > 2) earned = 2
  return earned
}

function calculateRemainChances(records, shareState) {
  records = records || []
  var freeUsed = countBySource(records, 'free')
  var shareUsed = countBySource(records, 'share')
  var retryUsed = countBySource(records, 'retry')
  var earnedShare = normalizeShareEarned(shareState)

  return {
    free: freeUsed >= 1 ? 0 : 1,
    share: Math.max(0, earnedShare - shareUsed),
    retry: (hasRetryPrize(records) && retryUsed === 0) ? 1 : 0
  }
}

function canUseSource(source, records, shareState) {
  var remain = calculateRemainChances(records, shareState)
  if (source === 'retry') {
    return remain.retry > 0 ? { ok: true, source: 'retry' } : { ok: false, msg: '没有可用的再来一次机会' }
  }
  if (source === 'share') {
    return remain.share > 0 ? { ok: true, source: 'share' } : { ok: false, msg: '请先分享获得抽奖机会' }
  }
  return remain.free > 0 ? { ok: true, source: 'free' } : { ok: false, msg: '今日免费抽奖次数已用完' }
}

function calculatePostSpinRemain(records, shareState, actualSource, prizeType) {
  var nextRecords = (records || []).slice()
  nextRecords.push({ source: actualSource, prizeType: prizeType })
  return calculateRemainChances(nextRecords, shareState)
}

function findSlotIndexByPrizeOrder(wheelItems, order) {
  var targetOrder = Number(order || 1)
  for (var j = 0; j < wheelItems.length; j++) {
    if (Number(wheelItems[j].order) === targetOrder) return j
  }
  return 0
}

function calculateTargetRotation(currentRotation, wheelItems, prize) {
  var count = wheelItems.length || 8
  var degPerSlot = 360 / count
  var slotIndex = findSlotIndexByPrizeOrder(wheelItems, prize.order)
  var targetAngle = (360 - (slotIndex * degPerSlot + degPerSlot / 2)) % 360
  var baseRotation = Math.ceil((currentRotation || 0) / 360) * 360
  return baseRotation + 360 * 6 + targetAngle
}

module.exports = {
  calculateRemainChances: calculateRemainChances,
  canUseSource: canUseSource,
  calculatePostSpinRemain: calculatePostSpinRemain,
  findSlotIndexByPrizeOrder: findSlotIndexByPrizeOrder,
  calculateTargetRotation: calculateTargetRotation
}
