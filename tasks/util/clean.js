const shell = require('shelljs')

const dirs = [
  'build',
  'dist',
  'web/brand',
  'web/config',
  'config/default/release/gc'
]

dirs.forEach((dir) => {
  console.log('Removing', dir)
  shell.rm('-rf', dir)
})
