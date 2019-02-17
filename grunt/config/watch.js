module.exports = {
  scripts: {
    files: ['src/**/*.js', 'spec/**/*.js'],
    tasks: ['jshint', 'execAllSpecs'],
    options: {
      atBegin: true
    },
  }
};
