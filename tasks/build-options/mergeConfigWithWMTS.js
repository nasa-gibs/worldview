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
let layers = {}
newConf.layers = {}
newConf.sources = {}

const outputData = JSON.parse(fs.readFileSync(outputFile, 'utf-8'))
let fileCount = 0

async function main () {
  layers = newConf.layers
  delete layers.sources
  delete newConf.layers
  newConf = dictMerge(newConf, outputData)
  await processFiles()

  const jsonOptions = {}
  jsonOptions.indent = 2
  jsonOptions.separators = [',', ': ']

  await fs.writeFileSync(outputFile, JSON.stringify(newConf, jsonOptions))

  console.warn(`${prog}: ${fileCount} file(s) merged into ${path.basename(outputFile)}`)
}

async function processFiles () {
  try {
    const files = fs.readdirSync(inputDir)
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      fileCount += 1
      try {
        const data = fs.readFileSync(path.join(inputDir, file), 'utf-8')
        const jsonData = JSON.parse(data)
        newConf.layers = await wmtsDictMerge(layers, jsonData, outputData)
        newConf.sources = dictMerge(newConf.sources, jsonData.sources, outputData.sources)
      } catch (error) {
        throw new Error(`ERROR: ${path.join(inputDir, file)}: ${error.message}`)
      }
    }
  } catch (error) {
    console.error(error)
  }
}

async function wmtsDictMerge (target, obj, conf) {
  if (!(obj instanceof Object)) {
    return obj
  }
  for (const [k, v] of Object.entries(obj)) {
    if (k in conf && typeof conf[k] === 'object') {
      let foundSourceMisMatch = false
      if ('projections' in v && 'projections' in conf[k]) {
        const confProjections = conf[k].projections
        for (const [projectionKey, projection] of Object.entries(v.projections)) {
          const source = projection.source
          if (projectionKey in confProjections) {
            if ('source' in confProjections[projectionKey]) {
              if (source !== confProjections[projectionKey].source) {
                foundSourceMisMatch = true
                continue
              }
            }
          }
        }
      }
      if (foundSourceMisMatch) {
        continue
      }
      if (k in target && typeof target[k] === 'object') {
        target[k] = dictMerge(target[k], v, conf[k])
      } else {
        target[k] = dictMerge(v, conf[k])
      }
    }
  }
  return target.layers
}

main().catch((err) => {
  console.error(err.stack)
})
