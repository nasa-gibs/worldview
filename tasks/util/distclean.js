const shell = require('shelljs')

const dirs = [
  'node_modules'
]

dirs.forEach((dir) => {
  console.log('Removing', dir)
  shell.rm('-rf', dir)
})
