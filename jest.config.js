module.exports = {
  setupFiles: [
    'jest-canvas-mock',
    'jsdom-worker'
  ],
  moduleDirectories: [
    'node_modules'
  ],
  moduleNameMapper: {
    '^googleTagManager$': '<rootDir>/web/js/components/util/google-tag-manager.js'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(ol|ol-mapbox-style|quick-lru|geotiff|@mapbox|node-fetch|data-uri-to-buffer|fetch-blob|formdata-polyfill)/)'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/e2e/'
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/build/'
  ],
  testEnvironment: 'jsdom'
}
