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
      'src/**/*.js',
      'spec/helpers/*.js',
      'spec/defines/defineJasmineUnderTest.js',
      'spec/**/*[Ss]pec.js'
    ],
    exclude: [
      'spec/npmPackage/**/*'
    ],
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
