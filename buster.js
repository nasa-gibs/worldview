var config = module.exports;

config['wv'] = {
  rootPath: './',
  environment: 'browser',
  src: [
    'web/build/wv-test-bundle.js'
  ],
  tests: ['test/**/*-spec.js']
};
