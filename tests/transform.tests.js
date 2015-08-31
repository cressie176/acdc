var assert = require('assert')
var acdc = require('..')
var flow = require('../lib/tasks/flow')
var selectors = require('../lib/tasks/selectors')
var mutators = require('../lib/tasks/mutators')
var transformation = require('../lib/tasks/transformation')
var dsl = require('../lib/dsl')
var async = require('async')
var R = require('ramda')

describe('AC/DC', function() {

    it('should execute a task', function(done) {
        var executed = false
        acdc().transform().using(function(dsl, cb) {
            cb({
                task: {
                    fn: function dummy(input, ctx, cb) {
                        executed = true
                        cb()
                    }
                }
            })
        }).done(function(err) {
            assert.ifError(err)
            assert.ok(executed)
            done()
        })
    })

    it('should yield a result', function(done) {
        acdc().transform().using(function(dsl, cb) {
            cb({
                task: {
                    fn: function dummy(input, ctx, cb) {
                        cb(null, 123)
                    }
                }
            })
        }).done(function(err, result) {
            assert.ifError(err)
            assert.equal(result, 123)
            done()
        })
    })

    it('should yield errors', function(done) {
        acdc().transform().using(function(dsl, cb) {
            cb({
                task: {
                    fn: function dummy(input, ctx, cb) {
                        cb(new Error('nothing to see here'))
                    }
                }
            })
        }).done(function(err, result) {
            assert.ok(err)
            assert.equal(err.message, 'nothing to see here')
            done()
        })
    })

    it('shoud yield thrown errors', function(done) {
        acdc().transform().using(function(dsl, cb) {
            cb({
                task: {
                    fn: function dummy(input, ctx, cb) {
                        throw new Error('nothing to see here')
                    }
                }
            })
        }).done(function(err, result) {
            assert.ok(err)
            assert.equal(err.message, 'nothing to see here')
            done()
        })
    })

    it('shoud yield thrown errors in async code', function(done) {
        acdc().transform().using(function(dsl, cb) {
            cb({
                task: {
                    fn: function dummy(input, ctx, cb) {
                        setImmediate(function() {
                            throw new Error('nothing to see here')
                        })
                    }
                }
            })
        }).done(function(err, result) {
            assert.ok(err)
            assert.equal(err.message, 'nothing to see here')
            done()
        })
    })

    it('shoud yield errors thrown from synchronous code wrapped by async', function(done) {
        acdc().transform().using(function(dsl, cb) {
            cb({
                task: {
                    fn: function dummy(input, ctx, cb) {
                        async.series([
                            function() {
                                throw new Error('nothing to see here')
                            }
                        ])
                    }
                }
            })
        }).done(function(err, result) {
            assert.ok(err)
            assert.equal(err.message, 'nothing to see here')
            done()
        })
    })

    it('should support complex conversion flows', function(done) {
        acdc().transform({ a: 'x', b: 'y' }).using(function(dsl, cb) {
            cb({
                task: flow.sequence,
                params: {
                    tasks: [
                        {
                            task: flow.fork,
                            params: {
                                tasks: {
                                    a: {
                                        task: selectors.getProperty,
                                        params: {
                                            path: 'a'
                                        }
                                    },
                                    b: {
                                        task: selectors.getProperty,
                                        params: {
                                            path: 'b'
                                        }
                                    }
                                }
                            }
                        },
                        {
                            task: {
                                fn: function slash(input, ctx, cb) {
                                    cb(null, input.a + '/' + input.b)
                                }
                            }
                        }
                    ]
                }
            })
        }).done(function(err, result) {
            assert.ifError(err)
            assert.equal(result, 'x/y')
            done()
        })
    })

    it('should support shorthand syntax', function(done) {
        acdc().bind(flow)
            .bind(dsl.task)
            .bind(selectors.getProperty).alias('get')
            .bind(mutators.setProperty).alias('set')
            .bind(transformation.copyProperty).alias('copy')
            .bind(transformation.map).alias('map')
            .bind(transformation.transformProperty).alias('transform')
            .bind(transformation.uppercase).alias('uppercase')
            .transform({ a: 'x', b: 'y' })
            .using(function(dsl, cb) {
                with (dsl) {
                    cb(sequence([
                        fork({
                            a: get('a'),
                            b: get('b')
                        }),
                        task(function slash(input, ctx, cb) {
                            cb(null, input.a + '/' + input.b)
                        }),
                        set('z'),
                        copy('z', 'z2'),
                        transform('z2', uppercase(), 'Z2')
                    ]))
                }
            })
            .done(function(err, result) {
                assert.ifError(err)
                assert.equal(result.Z2, 'X/Y')

                assert.equal(typeof sequence, 'undefined')
                assert.equal(typeof fork, 'undefined')
                assert.equal(typeof get, 'undefined')
                assert.equal(typeof set, 'undefined')
                assert.equal(typeof copy, 'undefined')
                assert.equal(typeof transform, 'undefined')
                assert.equal(typeof task, 'undefined')

                done()
            })
    })
})