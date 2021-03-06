var Joi = require('joi')
var schemas = require('../../schemas')
var moment = require('moment-timezone')

module.exports = {
    fn: function formatDate(input, ctx, cb) {
        if (input === undefined || input === null) return cb()
        var m = ctx.params.timezone ? moment(input).tz(ctx.params.timezone) : moment(input)
        var result = ctx.params.format ? m.format(ctx.params.format) : m.toISOString()
        cb(null, result)
    },
    schema: schemas.context.keys({
        input: Joi.date().optional(),
        params: Joi.object().keys({
            format: Joi.string().optional(),
            timezone: Joi.string().optional()
        })
    }).meta({
        description: 'Converts a date into a string',
        usage: 'format()'
    })
}
