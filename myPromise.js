"use strict";

const states = {
    PENDING: 'pending',
    FULFILLED: 'fulfilled',
    REJECTED: 'rejected'
};

const isFunction = (f) => {
    return Object.prototype.toString.call(f) === '[object Function]';
}

const resolutionProcedure = (promise, x) => {
    if(x === promise){
        promise.reject(new TypeError());
    }
    const type = typeof x;
    if(type === 'object' || type === 'function'){
        //to ensure that if x.then is a getter it is called only once
        try{
            const then = x.then;
        }
        catch(e){
            promise.reject(e);
        }

        if(isFunction(then)){
            let resCalled = false;
            let rejCalled = false;
            try{
                then.call(x,
                    (val) => {
                        if(!resCalled && !rejCalled){
                            resolutionProcedure(promise, val);
                        }
                        resCalled = true;
                    },
                    (reason) => {
                        if(!resCalled && !rejCalled){
                            promise.reject(reason);
                        }
                        rejCalled = true;
                    }
                );
            }
            catch(e){
                if(!resCalled && !rejCalled){
                    promise.reject(e);
                }
            }
            return;
        }
    }
    promise.fulfill(x);
}


function execOnSuccess(promise){
    if(promise.onSuccess !== null && !promise.resCalled){
        promise.resCalled = true;
        let x;
        try{
            x = promise.onSuccess(this.value);
        }
        catch(e){
            promise.reject(e);
        }
        resolutionProcedure(promise,x);
    }
    else{
        promise.reject(this.value);
    }
}

function execOnFailue(promise){
    if(promise.onFailure !== null && !promise.rejCalled){
        promise.rejCalled = true;
        let x;
        try{
            x = promise.onFailure(this.reason);
        }
        catch(e){
            promise.reject(e);
        }
        resolutionProcedure(promise,x);
    }
    else{
        promise.reject(this.value);
    }
}


module.exports = class MyPromise{
    constructor(executor, onSuccess, onFailure){
        this.state = states.PENDING;
        if(executor){
            executor(this.fulfill.bind(this), this.reject.bind(this));
        }
        this.onSuccess = isFunction(onSuccess) ? onSuccess : null;
        this.onFailure = isFunction(onFailure) ? onFailure : null;
        this.children = [];
        this.value = null;
        this.reason = null;
        this.resCalled = false;
        this.rejCalled = false;
    }

    then(onSuccess, onFailure){
        const p = new MyPromise(null, onSuccess, onFailure);
        this.children.push(p);
        switch (this.state) {
            case states.FULFILLED:
                this.fulfill(this.value);
                break;
            case states.REJECTED:
                this.reject(this.reason);
            default: break;
        }
        return p;
    }

    catch(onFailure){
        this.then(null,onFailure);
    }

    fulfill(val){
        this.state = states.FULFILLED;
        this.value = val;
        this.children.forEach((p) => setTimeout(execOnSuccess.bind(this, p), 0));
    }

    reject(reason){
        this.state = states.REJECTED;
        this.reason = reason;
        this.children.forEach((p) => setTimeout(execOnFailue.bind(this, p), 0));
    }

    static resolve(val){
        if(val instanceof MyPromise){
            return val;
        }
        const then = val.then;
        if(isFunction(then)){
            return new MyPromise(then);
        }
        return new MyPromise(suc => suc(val));
    }
}
