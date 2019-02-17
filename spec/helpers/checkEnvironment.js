(function(env) {
	env.isNode = function() {
		return (
			typeof process !== 'undefined' &&
			process.versions &&
			typeof process.versions.node === 'string'
		);
	};
	env.isBrowser = function() {
		return (
			typeof window !== 'undefined' && typeof window.document !== 'undefined'
		);
	};
	env.isRhino = function() {
		return (
			typeof Continuation === 'function' && typeof JavaException === 'function'
		);
	};
	env.isNetSuite = function() {
		return typeof nlobjError === 'function';
	};
	env.requireNode = function() {
		if (!env.isNode()) {
			env.pending('Environment is not node');
		}
	};
	env.requireBrowser = function() {
		if (!env.isBrowser()) {
			env.pending('Environment is not browser');
		}
	};
	env.requireRhino = function() {
		if (!env.isRhino()) {
			env.pending('Environment is not rhino');
		}
	};
	env.requireNetSuite = function() {
		if (!env.isNetSuite()) {
			env.pending('Environment is not rhino');
		}
	};
})(jasmine.getEnv());
