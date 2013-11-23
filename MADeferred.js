/**
 * MADeferred and MAPromise are two classes providing minimalistic functions for handling promise chains and
 * recursive promises.
 * The main advantage from this compared to deferred objects from for example
 * @constructor
 */

function MADeferred() {
    this.promises = [];
    this.states = {unknown: 0, resolved: 1, rejected: 2};
    this.state = this.states.unknown;
};

function MAPromise(deferredObject) {
    this.deferredObject = deferredObject;
    this.queue = [];
    this.failQueue = [];
    this.alwaysQueue = [];
};

MADeferred.prototype.promise = function () {
    var promise = new MAPromise(this);
    this.addPromise(promise);
    return promise;
};
MADeferred.prototype.addPromise = function (promise) {
    this.promises.push(promise);
}

MADeferred.prototype.resolve = function () {
    this.state = this.states.resolved;
    this.resolveArguments = arguments;
    var args = arguments;
    this.promises.forEach(function (promise) {
        promise.resolve.apply(promise, args);
    });
};

MADeferred.prototype.reject = function () {
    var args = arguments;
    this.rejectArguments = arguments;
    this.state = this.states.rejected;
    this.promises.forEach(function (promise) {
        promise.reject.apply(promise, args);
    });
};

MAPromise.prototype.then = function (callback) {
    this.queue.push(callback);
    if (this.deferredObject.state == this.deferredObject.states.resolved) {
        if(this.deferredObject.resolveArguments){
            this.resolve.apply(this, this.deferredObject.resolveArguments);
        }else{
            this.resolve();
        }
        this.deferredObject.resolveArguments = null;
    }
    return this;
};

MAPromise.prototype.fail = function (callback) {
    if (this.deferredObject.state == this.deferredObject.states.rejected) {
        callback.apply(null, this.deferredObject.rejectArguments);
    }else{
        this.failQueue.push(callback);
    }
    return this;
};
MAPromise.prototype.always = function(callback){
    if(this.deferredObject.state != this.deferredObject.states.unknown){
        callback();
    }else{
        this.alwaysQueue.push(callback)
    }
};
MAPromise.prototype.reject = function () {
    var args = arguments;
    this.failQueue.forEach(function (callback) {
        callback.apply(null, args);
    });
    this.alwaysQueue.forEach(function(callback){
        callback();
    });
}
MAPromise.prototype.isMAPromise = function(obj){
    return (typeof(obj)==typeof({}) && obj.constructor.name == 'MAPromise');
}
MAPromise.prototype.resolve = function () {
    if (this.queue.length) {
        var curCallback = this.queue.shift();
        var res = curCallback.apply(null, arguments);
        if (MAPromise.prototype.isMAPromise(res)) {
            this.deferredObject = res.deferredObject;
            this.deferredObject.addPromise(this);
        }
        if (this.queue.length && this.deferredObject.state == this.deferredObject.states.resolved) {
            this.resolve.apply(this, this.deferredObject.resolveArguments);
        }
        if(this.failQueue.length && this.deferredObject.state == this.deferredObject.states.rejected){
            this.reject.apply(this, this.deferredObject.rejectArguments);
        }
    }
    if(this.queue.length == 0 && this.deferredObject.state == this.deferredObject.states.resolved){
        this.alwaysQueue.forEach(function(callback){
            callback();
        });
    }
};

