# AC/CD

JavaScript object transformation

```js
var assert = require('assert')
var transform = require('acdc')
var flow = require('../lib/tasks/flow')
var selectors = require('../lib/tasks/selectors')
var mutators = require('../lib/tasks/mutators')
var transformation = require('../lib/tasks/transformation')
var dsl = require('../lib/dsl')

acdc()
    .bind(flow)
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
        assert.equal(result.Z1, 'X/Y')
    })
```