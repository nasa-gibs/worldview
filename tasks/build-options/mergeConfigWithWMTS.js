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
    const files = fs.readdirSync(inputDir)
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      fileCount += 1
      try {
        const data = fs.readFileSync(path.join(inputDir, file), 'utf-8')
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

// function wmtsDictMerge (target, obj, conf) {
//   // console.warn(conf.layers)

//   if (typeof obj !== 'object') {
//     return obj
//   }

//   target = conf.map(item => ({
//     ...obj.find(({ layers }) => item.layers === layers),
//     ...item
//   }))
//   console.warn(target)
//   return target
// }

function wmtsDictMerge (target, obj, conf) {
  obj = obj.layers
  // conf = conf.layers

  if (typeof obj !== 'object') {
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
        target[k] = wmtsDictMerge(target[k], v, conf[k])
      } else {
        target[k] = wmtsDictMerge(v, conf[k])
      }
    }
  }
  return target
}

main().catch((err) => {
  console.error(err.stack)
})
