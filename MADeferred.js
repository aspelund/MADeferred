// MADeferred v0.5
// =========================

// > https://github.com/aspelund/MADeferred
// > (c) 2013 Mattias Aspelund
// > underscore-contrib may be freely distributed under the MIT license.


/**
 * Creates a new MADeferred object in an unresolved state.
 * @constructor
 */
function MADeferred() {
    this.promises = [];
    this.states = {unknown: 0, resolved: 1, rejected: 2};
    this.state = this.states.unknown;
};

/**
 * Creates a new MAPromise object
 * @param deferredObject
 * @constructor
 */
function MAPromise(deferredObject) {
    this.deferredObject = deferredObject;
    this.queue = [];
    this.failQueue = [];
    this.alwaysQueue = [];
};

/**
 * Returns a promise coupled to this deferred object
 * @returns {MAPromise}
 */
MADeferred.prototype.promise = function () {
    var promise = new MAPromise(this);
    this.addPromise(promise);
    return promise;
};

/**
 * Adds a promise to the MADeferred object
 * @param promise
 */
MADeferred.prototype.addPromise = function (promise) {
    this.promises.push(promise);
}

/**
 * Resolves the Deferred object, looping through all promises resolving them one at a time.
 * @param Any number of arguments passed to resolve will be sent to the promises.
 * @returns {MADeferred}
 */
MADeferred.prototype.resolve = function () {
    this.state = this.states.resolved;
    this.resolveArguments = arguments;
    var args = arguments;
    this.promises.forEach(function (promise) {
        promise.resolve.apply(promise, args);
    });
    return this;
};

/**
 * Rejects the Deferred object, looping through all promises resolving them one at a time.
 * @param Any number of arguments passed to resolve will be sent to the promises.
 * @returns {MADeferred}
 */
MADeferred.prototype.reject = function () {
    var args = arguments;
    this.rejectArguments = arguments;
    this.state = this.states.rejected;
    this.promises.forEach(function (promise) {
        promise.reject.apply(promise, args);
    });
    return this;
};

/**
 * Then adds a function to the {MAPromise} callback queue. Once the {MADeferred} object is resolved,
 * {MAPromise} will loop through the queue, calling each callback at a time in the same order as the callbacks were
 * added. The callback's return will be used as parameter for the call to the following callback.
 * As long as the {MADeferred} object is resolved, the queue will be shifted.
 * If the callback returns a promise, the {MADeferred} object will be replaced with the returned promise {MADeferred}
 * object. If the new {MADeferred} object is in any other state than resolved, the promise wont continue it's
 * chain of then callbacks.
 *
 * If the {MAPromise} is already resolved when the callback is added, the callback will be immediately called.
 * @param callback
 * @returns {MAPromise}
 */
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

/**
 * This function adds a callback for the {MAPromise} fail callback queue. Once the {MADeferred} object is marked as
 * rejected, {MAPromise} will loop through the queue of callbacks, passing the {MADeferred} reject parameter to each
 * one.
 * If the {MADeferred} object is already rejected when fail is called, the callback will be called immediately.
 * @param callback
 * @returns {MAPromise}
 */
MAPromise.prototype.fail = function (callback) {
    if (this.deferredObject.state == this.deferredObject.states.rejected) {
        callback.apply(null, this.deferredObject.rejectArguments);
    }else{
        this.failQueue.push(callback);
    }
    return this;
};

/**
 * always adds a callback to a {MAPromise} always queue. This queue will be looped through when the {MADeferred}
 * object changes state to rejected or resolved, right after the then queue or reject queue has been processed.
 * @param callback
 * @returns {MAPromise}
 */
MAPromise.prototype.always = function(callback){
    if(this.deferredObject.state != this.deferredObject.states.unknown){
        callback();
    }else{
        this.alwaysQueue.push(callback)
    }
    return this;
};

/**
 * This function is called by the {MADeferred} object once its state is change to rejected. Any argument passed to the
 * {MADeferred} reject function is passed on to {MAPromise} reject.
 * Once the reject function is called, it will call all fail callbacks in the same order as they were added, followed
 * by processing the always queue if such exists.
 * @param args
 * @returns {MAPromise}
 */
MAPromise.prototype.reject = function () {
    var args = arguments;
    this.failQueue.forEach(function (callback) {
        callback.apply(null, args);
    });
    this.alwaysQueue.forEach(function(callback){
        callback();
    });
    return this;
}

/**
 * Function for checking if a variable is of type {MAPromise}.
 * @param obj
 * @returns {boolean}
 */
MAPromise.prototype.isMAPromise = function(obj){
    return (typeof(obj)==typeof({}) && obj.constructor.name == 'MAPromise');
}

/**
 * resolve is called by {MADeferred} when it is set as resolved. {MAPromise} will then process its resolve queue
 * and call each callback. The first callback will be called with any argument that has been passed to the {MADeferred}
 * resolve function.
 * The callback functions will be called in the same order as they were added. If a callback function returns an value,
 * the value will be used as a parameter for the next callback.
 * If a callback function returns a {MAPromise} object, the {MADeferred} object of the current {MAPromise} will be
 * replaced with the returned one. If this new {MADeferred} object is in a resolved state, the resolve queue will
 * continue to be called. If the new {MADeferred} object is in another state, the resolve queue will stop being
 * processed. If the new {MADeferred} object is in a reject state, the {MAPromise} will start processing its
 * reject queue.
 *
 * When the resolve queue is empty the always queue will be processed.
 *
 * @param args
 * @returns {MAPromise}
 */
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
    return this;
};

