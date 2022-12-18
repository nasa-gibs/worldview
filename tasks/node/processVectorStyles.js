const fs = require('fs')
const path = require('path')
const { promisify } = require('util')

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const copyFile = promisify(fs.copyFile)

const prog = path.basename(__filename)

const options = yargs
  .usage('Usage: $0 [options]')
  .option('inputDir', {
    demandOption: true,
    alias: 'i',
    type: 'string',
    description: 'getcapabilities input directory'
  })
  .option('outputDir', {
    demandOption: true,
    alias: 'o',
    type: 'string',
    description: 'wmts output directory'
  })
  .epilog('Extracts vector style information from GetCapabilities')

const { argv } = options
if (!argv.config && !argv.inputDir && !argv.outputDir) {
  throw new Error('Invalid number of arguments')
}

const inputDir = argv.inputDir
const outputDir = argv.outputDir

async function main () {
  let fileCount = 0
  let errorCount = 0

  for (const files of inputDir) {
    for (const file of fs.readdirSync(files)) {
      try {
        fileCount += 1
        await copyFileAsync(file)
      } catch (error) {
        errorCount += 1
        console.error(`${prog}: ERROR: [${file}] ${e}\n.`)
      }
    }
  }

  console.error(`${prog}: ${errorCount} error(s), ${fileCount} file(s)`)

  if (errorCount > 0) {
    throw new Error(`${prog}: Error: ${errorCount.length} errors occured`)
  }
}

async function copyFileAsync (file) {
  if (inputFile.endsWith('.json')) {
    const responseData = {}
    const vectorLayerFilename = file
    const vectorLayerId = vectorLayerFilename.split('.json', 1)[0]
    responseData.vectorStyles = {}
    responseData.vectorStyles[vectorLayerId] = {}
    const initialData = JSON.parse(await readFile(inputFile, 'utf-8'))
    for (const i in initialData) {
      responseData.vectorStyles[vectorLayerId][i] = initialData[i]
    }
    await writeFile(inputFile, JSON.stringify(responseData, null, 2), 'utf-8')
    await copyFile(inputFile, outputDir)
  }
}

main().catch((err) => {
  console.error(err.stack)
})
