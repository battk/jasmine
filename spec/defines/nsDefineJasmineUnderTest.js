(function(global) {
	// By the time onload is called, jasmineRequire will be redefined to point
	// to the Jasmine source files (and not jasmine.js). So re-require
	require(['N/error'], function(error) {
		global.jasmineUnderTest = getJasmineRequireObj().core(
			getJasmineRequireObj(), error
		);
	});
})(this);
