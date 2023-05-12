const { execSync } = require('child_process')
const { globSync } = require('glob')
const fs = require('fs')

const tag = process.argv[2]

if (!tag) {
  throw new Error('Please provide a tag to run the test.')
}

const testMatchPattern = '**/?(*.)test.js'

const testFiles = globSync(testMatchPattern)

const filesContainingTag = testFiles.filter((file) => {
  const fileContent = fs.readFileSync(file, 'utf8')
  const regex = new RegExp(`\\[${tag}\\]`, 'g')
  return regex.test(fileContent)
})

if (filesContainingTag.length === 0) {
  throw new Error(`No tests found with tag '${tag}'.`)
}

try {
  const testPathPattern = filesContainingTag.map(file => `"${file.replace(/\\/g, '\\\\')}"`).join('|')
  const testNamePattern = tag
  const command = `jest --testPathPattern="${testPathPattern}" --testNamePattern="${testNamePattern}"`
  execSync(command, { stdio: 'inherit' })
} catch (error) {
  throw new Error(error.status)
}

// npm run test:unit:tag -- alert-initial-state
