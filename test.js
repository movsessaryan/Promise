"use strict";
const Prom = require('./myPromise.js');
const makeAsync = require('./async.js');
const doSomeAyncWork = () => {
    return new Prom((res, rej) => {
        console.log('starting async work');
        setTimeout(() => {
            console.log('async work done');
            res(23);
        }, 2000);
    });
}

makeAsync(function* (){
    console.log('script started');
    const res = yield doSomeAyncWork();
    console.log(`doSomeAyncWork result: ${res}`);
})();

console.log('yes it is non-blocking');
