const fs = require('fs')
const path = require('path')
const yargs = require('yargs')
const { dictMerge } = require('./util')
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

let newConf = {}
newConf.layers = {}
newConf.sources = {}

const outputData = JSON.parse(fs.readFileSync(outputFile, 'utf-8'))
let fileCount = 0

async function main () {
  await processFiles()
  newConf = await dictMerge(newConf, outputData)

  const jsonOptions = {}
  jsonOptions.indent = 2
  jsonOptions.separators = [',', ': ']

  await fs.writeFileSync(outputFile, JSON.stringify(newConf, jsonOptions))

  console.warn(`${prog}: ${fileCount} file(s) merged into ${path.basename(outputFile)}`)
}

async function processFiles () {
  try {
    const files = await fs.readdirSync(inputDir)
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      fileCount += 1
      try {
        const data = await fs.readFile(path.join(inputDir, file), 'utf-8')
        const jsonData = JSON.parse(data)
        newConf.layers = wmtsDictMerge(newConf.layers, jsonData, outputData)
        newConf.sources = dictMerge(newConf.sources, jsonData.sources, outputData.sources)
      } catch (error) {
        throw new Error(`ERROR: ${path.join(inputDir, file)}: ${error.message}`)
      }
    }
  } catch (error) {
    console.error(error)
  }
}

function wmtsDictMerge (target, obj, conf) {
  if (typeof obj !== 'object' || !Object.prototype.hasOwnProperty.call(obj, 'layers')) return obj
  if (typeof conf !== 'object' || !Object.prototype.hasOwnProperty.call(conf, 'layers')) return obj

  for (const [k, v] of Object.entries(obj.layers)) {
    if (Object.prototype.hasOwnProperty.call(conf.layer, k) && typeof conf.layers[k] === 'object') {
      let foundSourceMisMatch = false
      if (Object.prototype.hasOwnProperty.call(v, 'projections') && Object.prototype.hasOwnProperty.call(conf.layers[k], 'projections')) {
        const confProjections = conf.layers[k].projections
        for (const [projectionKey, projection] of Object.entries(v.projections)) {
          const source = projection.source
          if (Object.prototype.hasOwnProperty.call(confProjections, projectionKey)) {
            if (Object.prototype.hasOwnProperty.call(confProjections[projectionKey], 'source')) {
              if (source !== confProjections[projectionKey].source) {
                foundSourceMisMatch = true
                continue
              }
            }
          }
        }
      }
      if (foundSourceMisMatch) continue
      if (Object.prototype.hasOwnProperty.call(target, k) && typeof target[k] === 'object') {
        dictMerge(target[k], v, conf.layers[k])
      } else {
        target[k] = dictMerge(v, conf.layers[k])
      }
    }
  }
  return target
}

main().catch((err) => {
  console.error(err.stack)
})
