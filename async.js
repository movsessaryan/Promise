"use strict";
const Prom = require('./myPromise.js');
// takes a generator function f, returns a function which acts like f with yield keyword having meaning of await;
const makeAsync = (genFunc) => {
    return function(...args){
        const generator = genFunc(...args);
        const awaitFn = (yieldResult) => {
            if(!yieldResult.done){
                return Prom.resolve(yieldResult.value).then(
                (val) => awaitFn(generator.next(val)),
                (err) => awatFn(generator.throw(err))
                );
            }
        }
        return awaitFn(generator.next());
    }
}

module.exports = makeAsync;
