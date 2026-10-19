module.exports = {
  presets: [
    '@babel/preset-env',
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  assumptions: {
    setPublicClassFields: true,
    privateFieldsAsProperties: true,
  }
}
