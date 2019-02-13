module.exports = function (config) {
  config.set({
    customLaunchers: {
      IE10: {
        base: 'IE',
        'x-ua-compatible': 'IE=EmulateIE10'
      }
    },
    frameworks: ['detectBrowsers', 'jasmine'],
    reporters: ['dots'],
    files: [
      'src/core/requireCore.js',
      'src/core/base.js',
      'src/core/util.js',
      'src/core/Spec.js',
      'src/core/Env.js',
      'src/core/JsApiReporter.js',
      'src/core/PrettyPrinter.js',
      'src/core/Suite.js',
      'src/core/**/*.js',
      'src/html/**/*.js',
      'src/**/*.js',
      'spec/helpers/asyncAwait.js',
      'spec/helpers/BrowserFlags.js',
      'spec/helpers/checkForMap.js',
      'spec/helpers/checkForSet.js',
      'spec/helpers/checkForSymbol.js',
      'spec/helpers/checkForTypedArrays.js',
      'spec/helpers/integrationMatchers.js',
      'spec/helpers/promises.js',
      'spec/helpers/defineJasmineUnderTest.js',
      'spec/**/*[Ss]pec.js'
    ],
    exclude: ['spec/npmPackage/**/*'],
    detectBrowsers: {
      preferHeadless: true,
      postDetection: function (availableBrowsers) {
        var ieIndex = availableBrowsers.indexOf('IE');

        if (ieIndex > -1) {
          availableBrowsers.splice(ieIndex, 1, 'IE10');
        }

        return availableBrowsers;
      }
    }
  });
};
