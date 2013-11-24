MADeferred
==========

Simpe Defer/Promise library for javascript. The purpose of this little library is to make nested Deferred objects / promise functionality easy.

For example:
```javascript
var dfd = new MADeferred();
var promise = dfd.promise();

promise.then(function(){
  var innerDfd = new MADeferred();
  setTimeout(function(){
    innerDfd.resolve();
  }, 3000);
  return innerDfd.promise();
})
  .then(function(){
    // some other code
  });
  
dfd.resolve();
```
The first then function is called whed dfd.resolve is called. But as the inner function returns a promise, the then chain will pause and wait for the innerDfd to be resolved.


Examples
========
Have a look at the MADeferredTest.html file for usage example.
Basic usage:
```javascript
       var dfd = new MADeferred();
       var promise = dfd.promise();
       promise.then(function(){
        // Do something
       })
        .then(function(){
        // and then something else
        }).
        fail(function(){
          // Something went wrong.
        });
        dfd.resolve();
````
What is fun is that if a then parameter function returns a promise, the then-chain will be paused until the return promise's deferred object is resolved:
```javascript
        var dfd = new MADeferred();
        var promise = dfd.promise();
        
        promise.then(function(){
            var dfd2 = new MADeferred(); // Used for inner promise
            var promise = dfd2.promise();
            setTimeout(function(){
              dfd2.resolve();
            }, 3000);
            return promise;
        })
                .then(function(){
                  // This will be executed after 3 seconds.
                });
        dfd.resolve();
```
