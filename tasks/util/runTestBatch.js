const { execSync } = require('child_process')

const directory = process.argv[2]

if (!directory) {
  throw new Error('Please provide a directory to run the tests.')
}

try {
  const command = `jest 'web/js/modules/${directory}/'`
  execSync(command, { stdio: 'inherit' })
} catch (error) {
  throw new Error(error.status)
}

// npm run test:batch:directory -- animation
