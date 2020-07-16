module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: 'entry',
        corejs: '2.0',

      }],
    [
      '@babel/preset-react',
      {
        useBuiltIns: 'entry',
        corejs: '2.0',
      },
    ],
  ],
  plugins: [
    [
      '@babel/plugin-proposal-class-properties',
      {
        loose: true,
      },
    ],
  ],
};
