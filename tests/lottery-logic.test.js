const assert = require('assert')
const logic = require('../cloudfunctions/spinLottery/lotteryLogic')

function run(name, fn) {
  try {
    fn()
    console.log('✓ ' + name)
  } catch (err) {
    console.error('✗ ' + name)
    throw err
  }
}

run('default daily chances are only one free chance when no share was earned', function () {
  const remain = logic.calculateRemainChances([], { earned: 0 })
  assert.deepStrictEqual(remain, { free: 1, share: 0, retry: 0 })
})

run('one successful share grants exactly one share chance', function () {
  const remain = logic.calculateRemainChances([], { earned: 1 })
  assert.deepStrictEqual(remain, { free: 1, share: 1, retry: 0 })
})

run('used share records reduce earned share chances', function () {
  const records = [{ source: 'share' }]
  const remain = logic.calculateRemainChances(records, { earned: 2 })
  assert.deepStrictEqual(remain, { free: 1, share: 1, retry: 0 })
})

run('share chances are capped at two per day even if user shares more', function () {
  const remain = logic.calculateRemainChances([], { earned: 5 })
  assert.deepStrictEqual(remain, { free: 1, share: 2, retry: 0 })
})

run('share spin is rejected when no share chance was earned', function () {
  assert.strictEqual(logic.canUseSource('share', [], { earned: 0 }).ok, false)
})

run('share spin is allowed after share chance was earned', function () {
  assert.strictEqual(logic.canUseSource('share', [], { earned: 1 }).ok, true)
})

run('wheel rotation maps each prize order to the same visual slot', function () {
  const wheelItems = [
    { order: 1, label: '谢谢参与' },
    { order: 2, label: '1积分' },
    { order: 3, label: '谢谢参与' },
    { order: 4, label: '5积分' },
    { order: 5, label: '谢谢参与' },
    { order: 6, label: '再来一次' },
    { order: 7, label: '8积分' },
    { order: 8, label: '10积分' }
  ]
  assert.strictEqual(logic.findSlotIndexByPrizeOrder(wheelItems, 5), 4)
  assert.strictEqual(logic.calculateTargetRotation(0, wheelItems, { order: 5 }) % 360, 157.5)
})
