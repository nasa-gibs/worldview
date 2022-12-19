const { dictMerge } = require('./util')
const fs = require('fs')
const path = require('path')
const yargs = require('yargs')
const prog = path.basename(__filename)

const options = yargs
  .usage('Usage: $0 [inputDir] [outputDir]')
  .option('inputDir', {
    demandOption: true,
    alias: 'i',
    type: 'string',
    description: 'getcapabilities input directory'
  })
  .option('outputFile', {
    demandOption: true,
    alias: 'o',
    type: 'string',
    description: 'wmts output directory'
  })
  .epilog('Concatenates all configuration items a directory into one configuration file.')

const { argv } = options
if (!argv.inputDir && !argv.outputFile) {
  throw new Error('Invalid number of arguments')
}

const inputDir = argv.inputDir
const outputFile = argv.outputFile

const conf = {}
let fileCount = 0

async function main () {
  fs.readdirSync(inputDir).forEach(file => {
    try {
      if (!file.endsWith('.json')) return
      fileCount += 1
      const data = JSON.parse(fs.readFileSync(path.join(inputDir, file), 'utf-8'))
      dictMerge(conf, data)
    } catch (error) {
      throw new Error(`ERROR: ${path.join(inputDir, file)}: ${error.message}`)
    }
  })

  const jsonOptions = {
    indent: 2,
    separators: [',', ': ']
  }

  fs.writeFileSync(outputFile, JSON.stringify(conf, null, jsonOptions.indent), 'utf-8')

  console.log(`${prog}: ${fileCount} file(s) merged into ${path.basename(outputFile)}`)
}

main().catch((err) => {
  console.error(err.stack)
})
