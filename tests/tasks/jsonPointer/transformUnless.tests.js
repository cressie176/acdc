var assert = require('assert')
var flow = require('../../../lib/tasks/flow')
var jsonPointer = require('../../../lib/tasks/jsonPointer')

describe('Json Pointer Transform Unless', function() {

    it('should require condition param to be a task', function(done) {
        transformUnless(undefined, { condition: {} }, function(err) {
            assert.ok(err)
            assert.equal(err.message, 'child "params" fails because [child "condition" fails because [child "task" fails because ["task" is required]]]')
            done()
        })
    })

    it('should require a from path', function(done) {
        transformUnless(undefined, { condition: { task: { fn: function() {} } }, from: 1 }, function(err) {
            assert.ok(err)
            assert.equal(err.message, 'child "params" fails because [child "from" fails because ["from" must be a string]]')
            done()
        })
    })

    it('should require transformer param to be a task', function(done) {
        transformUnless(undefined, { condition: { task: { fn: function() {} } }, from: 'x', transformer: {} }, function(err) {
            assert.ok(err)
            assert.equal(err.message, 'child "params" fails because [child "transformer" fails because [child "task" fails because ["task" is required]]]')
            done()
        })
    })

    it('should require a to path to be a string', function(done) {
        transformUnless(undefined, { condition: { task: { fn: function() {} } }, from: 'x', transformer: { task: { fn: function() {} } }, to: 1 }, function(err) {
            assert.ok(err)
            assert.equal(err.message, 'child "params" fails because [child "to" fails because ["to" must be a string]]')
            done()
        })
    })

    it('should transform when the condition is false', function(done) {
        transformUnless({ foo: 'oh yeah!' }, {
            condition: {
                task: {
                    fn: function condition(input, ctx, cb) {
                        cb(null, false)
                    }
                }
            },
            from: '/foo',
            transformer: {
                task: {
                    fn: function(input, ctx, cb) {
                        cb(null, input + '!!')
                    }
                }
            },
            to: '/bar'
        }, function(err, result) {
            assert.ifError(err)
            assert.equal(result.bar, 'oh yeah!!!')
            done()
        })
    })

    it('should not transform when condition is true', function(done) {
        transformUnless({ foo: 'oh yeah!' }, {
            condition: {
                task: {
                    fn: function condition(input, ctx, cb) {
                        cb(null, true)
                    }
                }
            },
            from: '/foo',
            transformer: {
                task: {
                    fn: function(input, ctx, cb) {
                        cb(null, input + '!!')
                    }
                }
            },
            to: '/bar'

        }, function(err, result) {
            assert.ifError(err)
            assert.equal(result, undefined)
            done()
        })
    })

    it('should default the to path', function(done) {
        transformUnless({ foo: 'oh yeah!' }, {
            condition: {
                task: {
                    fn: function condition(input, ctx, cb) {
                        cb(null, false)
                    }
                }
            },
            from: '/foo',
            transformer: {
                task: {
                    fn: function(input, ctx, cb) {
                        cb(null, input + '!!')
                    }
                }
            }
        }, function(err, result) {
            assert.ifError(err)
            assert.equal(result.foo, 'oh yeah!!!')
            done()
        })
    })

    function transformUnless(input, params, cb) {
        flow.run.fn(input, {
            params: {
                task: jsonPointer.transformUnless,
                params: params
            }
        }, cb)
    }
})