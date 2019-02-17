(function(env) {
	env.requireSetTimeout = function() {
		if (typeof setTimeout !== 'function') {
			env.pending('Environment does not support setTimeout');
		}
	};
})(jasmine.getEnv());
