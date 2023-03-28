const { execSync } = require('child_process')
const path = require('path')

const directory = process.argv[2]

if (!directory) {
  throw new Error('Please provide a directory to run the tests.')
}

try {
  const testDirectory = path.join('web', 'js', 'modules', directory).replace(/\\/g, '/')
  const command = `jest ${testDirectory}`
  execSync(command, { stdio: 'inherit' })
} catch (error) {
  throw new Error(error.status)
}

// npm run test:batch:directory -- animation
