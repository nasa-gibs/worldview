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

const conf = {}
let fileCount = 0

async function main () {
  const inputDir = argv.inputDir
  const outputFile = argv.outputFile
  await mergeFiles(inputDir)

  fs.writeFileSync(outputFile, JSON.stringify(conf, null, 2), 'utf-8')

  console.warn(`${prog}: ${fileCount} file(s) merged into ${path.basename(outputFile)}`)
}

async function mergeFiles (inputDir) {
  const files = fs.readdirSync(inputDir)
  for (const file of files) {
    try {
      if (file.endsWith('.json')) {
        fileCount += 1
        const data = JSON.parse(fs.readFileSync(path.join(inputDir, file), 'utf-8'))
        await dictMerge(conf, data)
      } else if (fs.existsSync(path.join(inputDir, file)) && fs.lstatSync(path.join(inputDir, file)).isDirectory()) {
        subDir = path.join(inputDir, file)
        await mergeFiles(subDir)
      }
    } catch (error) {
      throw new Error(`ERROR: ${path.join(inputDir, file)}: ${error.message}`)
    }
  }
}

main().catch((err) => {
  console.error(err.stack)
})
