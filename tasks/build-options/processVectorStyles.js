const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const yargs = require('yargs')
const { hideBin } = require('yargs/helpers')

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const copyFile = promisify(fs.copyFile)

const prog = path.basename(__filename)

const options = yargs(hideBin(process.argv))
  .usage('Usage: $0 [options]')
  .option('inputDir', {
    demandOption: true,
    alias: 'i',
    type: 'string',
    description: 'getcapabilities input directory'
  })
  .option('wvStylesDir', {
    demandOption: true,
    alias: 'w',
    type: 'string',
    description: 'worldview hosted styles directory'
  })
  .option('outputDir', {
    demandOption: true,
    alias: 'o',
    type: 'string',
    description: 'wmts output directory'
  })
  .epilog('Extracts vector style information from GetCapabilities')

const { argv } = options
if (!argv.inputDir && !argv.outputDir) {
  throw new Error('Invalid number of arguments')
}

const inputDir = argv.inputDir
const wvStylesDir = argv.wvStylesDir
const outputDir = argv.outputDir

async function main () {
  let fileCount = 0
  let errorCount = 0

  const files = [...fs.readdirSync(inputDir), ...fs.readdirSync(wvStylesDir)]

  for (const file of files) {
    try {
      fileCount += 1
      await copyFileAsync(file)
    } catch (error) {
      errorCount += 1
      console.error(`${prog}: ERROR: [${file}] ${error}\n.`)
    }
  }

  console.error(`${prog}: ${errorCount} error(s), ${fileCount} file(s)`)

  if (errorCount > 0) {
    throw new Error(`${prog}: Error: ${errorCount} errors occured`)
  }
}

async function copyFileAsync (file) {
  if (file.endsWith('.json')) {
    const responseData = {}
    const vectorLayerFilename = file
    const vectorLayerId = vectorLayerFilename.split('.json', 1)[0]
    responseData.vectorStyles = {}
    responseData.vectorStyles[vectorLayerId] = {}
    const data = await readFile(`${inputDir}/${file}`, 'utf-8').catch(() => {
      return readFile(`${wvStylesDir}/${file}`, 'utf-8')
    })
    const initialData = JSON.parse(data)
    for (const i in initialData) {
      responseData.vectorStyles[vectorLayerId][i] = initialData[i]
    }
    await writeFile(`${inputDir}/${file}`, JSON.stringify(responseData, null, 2), 'utf-8')
    await copyFile(`${inputDir}/${file}`, `${outputDir}/${file}`)
  }
}

main().catch((err) => {
  console.error(err.stack)
})
