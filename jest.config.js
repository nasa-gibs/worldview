module.exports = {
  setupFiles: [
    'jest-canvas-mock',
    'jsdom-worker',
    './setupJest.js'
  ],
  moduleDirectories: [
    'node_modules'
  ],
  moduleNameMapper: {
    '^googleTagManager$': '<rootDir>/web/js/components/util/google-tag-manager.js',
    '^ol-mapbox-style$': '<rootDir>/node_modules/ol-mapbox-style/src/index.js'
  },
  transformIgnorePatterns: [],
  testPathIgnorePatterns: [
    '<rootDir>/e2e/'
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/build/'
  ],
  testEnvironment: 'jsdom'
}
