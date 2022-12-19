const fs = require('fs')
const path = require('path')
const yargs = require('yargs')
const console = require('console')
const glob = require('glob')
const Ajv = require('ajv')
const ajv = new Ajv()

const prog = path.basename(__filename)

const options = yargs
  .usage('Usage: $0 [options]')
  .option('inputDirectory', {
    demandOption: true,
    alias: 'i',
    type: 'string',
    description: 'the wv.json layers directory'
  })
  .option('schemaFile', {
    demandOption: true,
    alias: 's',
    type: 'string',
    description: 'layer-config.json schema'
  })
  .epilog('Validates layers using a JSON schema')

const { argv } = options
if (!argv.inputDirectory && !argv.schemaFile) {
  throw new Error('Invalid number of arguments')
}

const { inputDirectory, schemaFile } = argv

const schemaRaw = fs.readFileSync(schemaFile)
const schema = JSON.parse(schemaRaw)
const validate = ajv.compile(schema)

layerConfigFiles = []
invalidJsonFiles = []

console.warn(`${prog}: Validating layer configs...`)

async function main () {
  let files = await glob.sync(inputDirectory + '/**/*')
  files = files.filter(file => file.endsWith('.json'))
  for (filePath of files) {
    validateFile(filePath)
  }
  if (invalidJsonFiles.length) {
    throw new Error(`${prog}: FAILED: ${invalidJsonFiles.length} layer configs failed validation.`)
  } else {
    console.warn(`${prog}: PASSED: All layer configs passed validation!`)
  }
}

async function validateFile (filePath) {
  const layerFile = fs.readFileSync(filePath)
  const layer = JSON.parse(layerFile)
  const valid = validate(layer)
  if (!valid) {
    for (error of validate.errors) {
      invalidJsonFiles.push(error)
      console.error(`${prog}: ERROR: ${error.instancePath} ${error.message}`)
      // TOD: Add verbose mode with the full error:
      // console.error(error)
    }
  }
}

main().catch((err) => {
  console.error(err.stack)
})
