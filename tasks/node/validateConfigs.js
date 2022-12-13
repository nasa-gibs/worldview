// const fs = require('fs')
const path = require('path')
const yargs = require('yargs')
const console = require('console')

const prog = path.basename(__filename)

const options = yargs
  .usage('Usage: $0 [options]')
  .option('layerOrder', {
    demandOption: true,
    alias: 'o',
    type: 'string',
    description: 'layerOrder.json file'
  })
  .option('layerConfig', {
    demandOption: true,
    alias: 'c',
    type: 'string',
    description: 'layer-metadata/all.json file'
  })
  .epilog('Pulls visualization metadata files')

const { argv } = options
if (!argv.features && !argv.layerOrder && !argv.layerMetadata) {
  throw new Error('Invalid number of arguments')
}

console.warn(`${prog}: Validating layer configs...`)

main(url).catch((err) => {
  console.error(err.stack)
})
