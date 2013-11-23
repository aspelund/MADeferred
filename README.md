MADeferred
==========

Simpe Defer/Promise library for javascript. The purpose of this little library is to make nested Deferred objects / promise functionality easy.

For example:

var dfd = new MADeferred();
var promise = dfd.promise();

promise.then(function(){
  var innerDfd = new MADeferred();
  setTimeout(function(){
    innerDfd.resolve();
  }, 3000);
  innerDfd.promise();
})
  .then(function(){
    // some other code
  });
  
dfd.resolve();

The first then function is called whed dfd.resolve is called. But as the inner function returns a promise, the then chain will pause and wait for the innerDfd to be resolved.


Examples
========
Have a look at the MADeferredTest.html file for usage example.
