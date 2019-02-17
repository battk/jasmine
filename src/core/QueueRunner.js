getJasmineRequireObj().QueueRunner = function(j$) {
  function StopExecutionError() {}
  StopExecutionError.prototype = new Error();
  j$.StopExecutionError = StopExecutionError;

  function once(fn) {
    var called = false;
    return function(arg) {
      if (!called) {
        called = true;
        // Direct call using single parameter, because cleanup/next does not need more
        fn(arg);
      }
      return null;
    };
  }

  function emptyFn() {}

  function QueueRunner(attrs) {
    var queueableFns = attrs.queueableFns || [];
    this.queueableFns = queueableFns.concat(attrs.cleanupFns || []);
    this.firstCleanupIx = queueableFns.length;
    this.onComplete = attrs.onComplete || emptyFn;
    this.clearStack = attrs.clearStack || function(fn) {fn();};
    this.onException = attrs.onException || emptyFn;
    this.userContext = attrs.userContext || new j$.UserContext();
    this.timeout = attrs.timeout || {setTimeout: setTimeout, clearTimeout: clearTimeout};
    this.fail = attrs.fail || emptyFn;
    this.globalErrors = attrs.globalErrors || { pushListener: emptyFn, popListener: emptyFn };
    this.completeOnFirstError = !!attrs.completeOnFirstError;
    this.errored = false;
    this.forceSynchronous = attrs.forceSynchronous;

    if (typeof(this.onComplete) !== 'function') {
      throw new Error('invalid onComplete ' + JSON.stringify(this.onComplete));
    }
    this.deprecated = attrs.deprecated;
  }

  QueueRunner.prototype.execute = function() {
    var self = this;
    this.handleFinalError = function(error) {
      self.onException(error);
    };
    this.globalErrors.pushListener(this.handleFinalError);
    this.run(0);
  };

  QueueRunner.prototype.skipToCleanup = function (lastRanIndex) {
    if (lastRanIndex < this.firstCleanupIx) {
      this.runAsync(this.firstCleanupIx);
    } else {
      this.runAsync(lastRanIndex + 1);
    }
  };

  QueueRunner.prototype.clearTimeout = function(timeoutId) {
    Function.prototype.apply.apply(this.timeout.clearTimeout, [j$.getGlobal(), [timeoutId]]);
  };

  QueueRunner.prototype.setTimeout = function(fn, timeout) {
    return Function.prototype.apply.apply(this.timeout.setTimeout, [j$.getGlobal(), [fn, timeout]]);
  };

  QueueRunner.prototype.attempt = function attempt(iterativeIndex) {
    if (this.forceSynchronous || typeof this.timeout.setTimeout !== 'function') {
      return this.attemptSync(iterativeIndex);
    }

    return this.attemptAsync(iterativeIndex);
  };

  QueueRunner.prototype.attemptAsync = function attemptAsync(iterativeIndex) {
    var self = this,
      completedSynchronously = true,
      handleError = function handleError(error) {
        onException(error);
        next(error);
      },
      cleanup = once(function cleanup() {
        if (timeoutId !== void 0) {
          self.clearTimeout(timeoutId);
        }
        self.globalErrors.popListener(handleError);
      }),
      next = once(function next(err) {
        cleanup();

        if (j$.isError_(err)) {
          if (!(err instanceof StopExecutionError) && !err.jasmineMessage) {
            self.fail(err);
          }
          self.errored = errored = true;
        }

        function runNext() {
          if (self.completeOnFirstError && errored) {
            self.skipToCleanup(iterativeIndex);
          } else {
            self.runAsync(iterativeIndex + 1);
          }
        }

        if (completedSynchronously) {
          self.setTimeout(runNext);
        } else {
          runNext();
        }
      }),
      errored = false,
      queueableFn = self.queueableFns[iterativeIndex],
      timeoutId;

    next.fail = function nextFail() {
      self.fail.apply(null, arguments);
      self.errored = errored = true;
      next();
    };

    self.globalErrors.pushListener(handleError);

    if (queueableFn.timeout !== undefined) {
      var timeoutInterval = queueableFn.timeout || j$.DEFAULT_TIMEOUT_INTERVAL;
      timeoutId = self.setTimeout(function() {
        var error = new Error(
          'Timeout - Async callback was not invoked within ' + timeoutInterval + 'ms ' +
          (queueableFn.timeout ? '(custom timeout)' : '(set by jasmine.DEFAULT_TIMEOUT_INTERVAL)')
        );
        onException(error);
        next();
      }, timeoutInterval);
    }

    try {
      if (queueableFn.fn.length === 0) {
        var maybeThenable = queueableFn.fn.call(self.userContext);

        if (maybeThenable && j$.isFunction_(maybeThenable.then)) {
          maybeThenable.then(next, onPromiseRejection);
          completedSynchronously = false;
          return { completedSynchronously: false };
        }
      } else {
        queueableFn.fn.call(self.userContext, next);
        completedSynchronously = false;
        return { completedSynchronously: false };
      }
    } catch (e) {
      onException(e);
      self.errored = errored = true;
    }

    cleanup();
    return { completedSynchronously: true, errored: errored };

    function onException(e) {
      self.onException(e);
      self.errored = errored = true;
    }

    function onPromiseRejection(e) {
      onException(e);
      next();
    }
  };

  QueueRunner.prototype.attemptSync = function attemptSync(iterativeIndex) {
    var self = this,
      handleError = function handleError(error) {
        onException(error);
        next(error);
      },
      cleanup = once(function cleanup() {
        self.globalErrors.popListener(handleError);
      }),
      next = once(function next(err) {
        nextCalled = true;
        cleanup();

        if (j$.isError_(err)) {
          if (!(err instanceof StopExecutionError) && !err.jasmineMessage) {
            self.fail(err);
          }
          self.errored = errored = true;
        }

        // no longer chain run
      }),
      errored = false,
      queueableFn = self.queueableFns[iterativeIndex],
      nextCalled = false,
      timeoutInterval = queueableFn.timeout || j$.DEFAULT_TIMEOUT_INTERVAL;

    next.fail = function nextFail() {
      self.fail.apply(null, arguments);
      self.errored = errored = true;
      next();
    };

    self.globalErrors.pushListener(handleError);

    // Lost the timeout functionality here
    try {
      var now = Date.now();
      var error;

      // detect if a Promise is returned and then error, promises are not supported
      if (queueableFn.fn.length === 0) {
        var questionablePromise = queueableFn.fn.call(self.userContext);

        if (questionablePromise && typeof questionablePromise.then === 'function') {
          error = new Error('Queueable function returned a Promise. ' +
            'Promises are not supported in synchronous environments');

          onException(error);
          next();
        }
      } else {
        queueableFn.fn.call(self.userContext, next);
      }

      if (queueableFn.timeout !== undefined && Date.now() - now > timeoutInterval) {
        // this timeout will not detect infinite loops, it will only detect if the queueable
        // function takes too long
        error = new Error('Queueable function did not finish within timeout of ' + timeoutInterval +
          'ms ' + (queueableFn.timeout ? '(custom timeout)' : '(set by jasmine.DEFAULT_TIMEOUT_INTERVAL)')
        );

        onException(error);
        next();
      } else if (queueableFn.fn.length && !nextCalled) {
        // this case is for the strange synchronous spec that tries (and fails) to use a done callback
        // there is no reason for it but a vain attempt to match the async api
        error = new Error('Sync done callback was not invoked. ' +
          'Consider removing the done callback, it is unnecessary in synchronous environments');

        onException(error);
        next();
      }
    } catch (e) {
      onException(e);
      self.errored = errored = true;
    }

    cleanup();
    return {
      errored: errored
    };

    function onException(e) {
      self.onException(e);
      self.errored = errored = true;
    }
  };

  QueueRunner.prototype.run = function run(recursiveIndex) {
    if (this.forceSynchronous || typeof this.timeout.setTimeout !== 'function') {
      this.runSync(recursiveIndex);
    } else {
      this.runAsync(recursiveIndex);
    }
  };

  QueueRunner.prototype.runAsync = function runAsync(recursiveIndex) {
    var length = this.queueableFns.length,
      self = this,
      iterativeIndex;

    for (iterativeIndex = recursiveIndex; iterativeIndex < length; iterativeIndex++) {
      var result = this.attemptAsync(iterativeIndex);

      if (!result.completedSynchronously) {
        return;
      }

      self.errored = self.errored || result.errored;

      if (this.completeOnFirstError && result.errored) {
        this.skipToCleanup(iterativeIndex);
        return;
      }
    }

    this.clearStack(function() {
      self.globalErrors.popListener(self.handleFinalError);
      self.onComplete(self.errored && new StopExecutionError());
    });
  };

  // No more recursive QueueRunner
  // It makes gnarly stacks for no reason in a synchronous environment
  QueueRunner.prototype.runSync = function runSync(recursiveIndex) {
    var length = this.queueableFns.length,
      self = this,
      iterativeIndex = recursiveIndex;

    // this is a while loop now since for loops are traditionally used when iterating through all elements
    while (iterativeIndex < length) {
      var result = this.attemptSync(iterativeIndex);

      // code will always complete synchronously

      self.errored = self.errored || result.errored;

      // move skipToCleanup here since this is now the only place it can manipulate the iterativeIndex
      if (this.completeOnFirstError && result.errored && iterativeIndex < this.firstCleanupIx) {
        iterativeIndex = this.firstCleanupIx;
        continue;
      }

      iterativeIndex++;
    }

    this.clearStack(function () {
      self.globalErrors.popListener(self.handleFinalError);
      self.onComplete(self.errored && new StopExecutionError());
    });
  };

  return QueueRunner;
};
