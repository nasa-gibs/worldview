const fs = require('fs')
const path = require('path')
const yargs = require('yargs')
const console = require('console')
const { globSync } = require('glob')
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
  .option('mode', {
    demandOption: true,
    alias: 'm',
    type: 'string',
    description: 'mode'
  })
  .epilog('Validates layers using a JSON schema')

const { argv } = options
if (!argv.inputDirectory && !argv.schemaFile) {
  throw new Error('Invalid number of arguments')
}

const { inputDirectory, schemaFile } = argv

const schemaRaw = fs.readFileSync(schemaFile)
const schema = JSON.parse(schemaRaw)
// check if build is gitc
const gitcEnv = process.env.CONFIG_ENV && process.env.CONFIG_ENV.includes('gitc')
// setting the additionalProperties to true for gitc builds
if (gitcEnv) {
  schema.definitions.layer.additionalProperties = true
}
const validate = ajv.compile(schema)

const invalidJsonFiles = []

console.warn(`${prog}: Validating layer configs...`)

async function main () {
  let files = globSync(inputDirectory + '/**/*')
  files = files.filter(file => file.endsWith('.json'))
  for (const filePath of files) {
    validateFile(filePath)
  }
  if (invalidJsonFiles.length) {
    if (argv.mode === 'verbose') console.warn(`${prog}: Invalid JSON files: ${invalidJsonFiles}`)
    throw new Error(`${prog}: FAILED: ${invalidJsonFiles.length} layer configs failed validation.`)
  } else {
    console.warn(`${prog}: PASSED: All layer configs passed validation!`)
  }
}

async function validateFile (filePath) {
  if (argv.mode === 'verbose') console.warn(`${prog}: Validating ${filePath}`)
  const layerFile = fs.readFileSync(filePath)
  const layer = JSON.parse(layerFile)
  const valid = validate(layer)
  if (!valid) {
    for (const error of validate.errors) {
      invalidJsonFiles.push(error)
      console.error(`${prog}: ERROR: ${error.instancePath} ${error.message}`)
    }
  }
}

main().catch((err) => {
  console.error(err.stack)
})
