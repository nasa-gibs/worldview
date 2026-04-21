module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-react'
  ],
  plugins: [
    [
      '@babel/plugin-transform-class-properties',
      {
        loose: true
      }
    ],
    [
      '@babel/plugin-transform-private-methods',
      {
        loose: true
      }
    ]
  ]
}
