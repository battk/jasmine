getJasmineRequireObj().StackTrace = function(j$) {
  function StackTrace(error) {
    // handle N/error and normal errors (which might not have a stack)
    var lines;
    if (j$.isArray_(error.stack)) {
      lines = error.stack;
    } else if (error.stack) {
      lines = error.stack.split('\n').filter(function(line) {
        return line !== '';
      });
    } else {
      lines = [];
    }

    var extractResult = extractMessage(error.message, lines);

    if (extractResult) {
      this.message = extractResult.message;
      lines = extractResult.remainder;
    }

    var parseResult = tryParseFrames(lines);
    this.frames = parseResult.frames;
    this.style = parseResult.style;
  }

  var framePatterns = [
    // Rhino Exception in SuiteScript looks like v8 except that the function name and file name are switched
    //	e.g. "  at SYSTEM_LIBS:2413 (localRequire)"
    // or " at INVOCATION_WRAPPER:27 (restletwrapper)"
    {
      re: /^\s*at (.+:\d+) \((.+)\)$/,
      fnIx: 2,
      fileLineColIx: 1,
      style: 'v8'
    },
    // PhantomJS on Linux, Node, Chrome, IE, Edge
    // e.g. "   at QueueRunner.run (http://localhost:8888/__jasmine__/jasmine.js:4320:20)"
    // Note that the "function name" can include a surprisingly large set of
    // characters, including angle brackets and square brackets.
    {
      re: /^\s*at ([^)]+) \(([^)]+)\)$/,
      fnIx: 1,
      fileLineColIx: 2,
      style: 'v8'
    },
    // NodeJS alternate form, often mixed in with the Chrome style
    // e.g. "  at /some/path:4320:20
    {
      re: /\s*at (.+)$/,
      fileLineColIx: 1,
      style: 'v8'
    },
    // SuiteScript
    // e.g. "<anonymous>(/SuiteScripts/ns-jasmine/spec/introduction.js:424)"
    // or "createError(N/error.js)"
    // or "attempt(/SuiteScripts/ns-jasmine/vendor/shimJasmine/shim-jasmine.js:172)"
    {
      re: /^([^(]+)\(([^)]+)\)$/,
      fnIx: 1,
      fileLineColIx: 2,
      style: 'webkit' // pretend to be webkit, the Error Formatter will match better
    },
    // PhantomJS on OS X, Safari, Firefox
    // e.g. "run@http://localhost:8888/__jasmine__/jasmine.js:4320:27"
    // or "http://localhost:8888/__jasmine__/jasmine.js:4320:27"
    {
      re: /^(([^@\s]+)@)?([^\s]+)$/,
      fnIx: 2,
      fileLineColIx: 3,
      style: 'webkit'
    }
  ];
  // regexes should capture the function name (if any) as group 1
  // and the file, line, and column as group 2.

  function tryParseFrames(lines) {
    var style = null;
    var frames = lines.map(function(line) {
      var convertedLine = first(framePatterns, function(pattern) {
        var overallMatch = line.match(pattern.re);

        if (!overallMatch) { return null; }

        // filename for NetSuite modules does not include line numbers
        // example : N/error.js
        var netsuiteModuleMatch = overallMatch[pattern.fileLineColIx].match(
          /^N\/[^:]*$/);

        // this regular expression matched column numbers which it doesn't use
        // changed to allow column number to be missing
        var fileLineColMatch = overallMatch[pattern.fileLineColIx].match(
          /^(.*?):(\d+)(:\d+)?$/);

        if (fileLineColMatch) {
          style = style || pattern.style;

          return {
            raw: line,
            file: fileLineColMatch[1],
            line: parseInt(fileLineColMatch[2], 10),
            func: overallMatch[pattern.fnIx]
          };
        } else if (netsuiteModuleMatch) {
          style = style || pattern.style;

          return {
            raw: line,
            file: netsuiteModuleMatch[0],
            line: undefined,
            func: overallMatch[pattern.fnIx]
          };
        } else {
          return null;
        }


      });

      return convertedLine || { raw: line };
    });

    return {
      style: style,
      frames: frames
    };
  }

  function first(items, fn) {
    var i, result;

    for (i = 0; i < items.length; i++) {
      result = fn(items[i]);

      if (result) {
        return result;
      }
    }
  }

  function extractMessage(message, stackLines) {
    var len = messagePrefixLength(message, stackLines);

    if (len > 0) {
      return {
        message: stackLines.slice(0, len).join('\n'),
        remainder: stackLines.slice(len)
      };
    }
  }

  function messagePrefixLength(message, stackLines) {
    if (!stackLines.length ||!stackLines[0].match(/^Error/)) {
      return 0;
    }

    var messageLines = message.split('\n');
    var i;

    for (i = 1; i < messageLines.length; i++) {
      if (messageLines[i] !== stackLines[i]) {
        return 0;
      }
    }

    return messageLines.length;
  }

  return StackTrace;
};
