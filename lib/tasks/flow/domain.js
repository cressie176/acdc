var debug = require('debug')('acdc:tasks:flow:domain')
var Domain = require('domain')
var run = require('./run')
var Joi = require('joi')
var schemas = require('../../schemas')
var R = require('ramda')

module.exports = {

    fn: function domain(input, ctx, cb) {

        debug('Creating domain')
        var domain = Domain.create()

        domain.on('error', function(err) {
            setImmediate(function() {
                unhandled(err)
            })
        }).run(function() {
            run.fn(input, ctx, function() {
                debug('Exiting domain')
                domain.exit()
                R.apply(cb, arguments)
            })
        })

        function unhandled(err) {
            debug('Exiting domain')
            domain.exit()
            debug('Unhandled error: %s', err.message)
            cb(err)
        }
    },
    schema: schemas.context.keys({
        params: Joi.object().keys({
            name: Joi.string().optional(),
            task: schemas.task,
            params: Joi.object().optional()
        })
    }).meta({
        description: 'Runs a task within a domain',
        usage: 'domain()'
    })
}
