const assert = require('assert')
const fs = require('fs')
const path = require('path')

const source = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/lottery/index.js'), 'utf8')

function extractFunction(name) {
  const marker = name + ': function'
  const start = source.indexOf(marker)
  assert.notStrictEqual(start, -1, 'missing function ' + name)
  const next = source.indexOf('\n  },', start)
  assert.notStrictEqual(next, -1, 'cannot extract function ' + name)
  return source.slice(start, next)
}

function run(name, fn) {
  try {
    fn()
    console.log('✓ ' + name)
  } catch (err) {
    console.error('✗ ' + name)
    throw err
  }
}

run('share menu handler only marks a pending share and does not call cloud function before user returns', function () {
  const fn = extractFunction('onShareAppMessage')
  assert.ok(fn.indexOf('pendingShareSpin: true') !== -1)
  assert.strictEqual(fn.indexOf('recordLotteryShare'), -1)
})

run('onShow consumes pending share by recording share chance then refreshing chances', function () {
  const fn = extractFunction('onShow')
  assert.ok(fn.indexOf('grantShareChance') !== -1)
})

run('grantShareChance calls recordLotteryShare and then refreshes chance display', function () {
  const fn = extractFunction('grantShareChance')
  assert.ok(fn.indexOf('recordLotteryShare') !== -1)
  assert.ok(fn.indexOf('checkChances') !== -1)
})
