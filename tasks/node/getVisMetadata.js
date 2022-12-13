const fs = require('fs')
const path = require('path')
const yargs = require('yargs')
const console = require('console')
const request = require('axios').default

const prog = path.basename(__filename)

const options = yargs
  .usage('Usage: $0 [options]')
  .option('features', {
    demandOption: true,
    alias: 'f',
    type: 'string',
    description: 'features.json file'
  })
  .option('layerOrder', {
    demandOption: true,
    alias: 'o',
    type: 'string',
    description: 'layerOrder.json file'
  })
  .option('layerMetadata', {
    demandOption: true,
    alias: 'm',
    type: 'string',
    description: 'layer-metadata/all.json file'
  })
  .epilog('Pulls visualization metadata files')

const { argv } = options
if (!argv.features && !argv.layerOrder && !argv.layerMetadata) {
  throw new Error('Invalid number of arguments')
}

const featuresFile = argv.features
let featuresData = fs.readFileSync(featuresFile)
let features = JSON.parse(featuresData)
if (fs.existsSync(featuresFile)) {
  featuresData = fs.readFileSync(featuresFile)
  features = JSON.parse(featuresData)
} else {
  throw new Error(`Error: ${featuresFile} feature file does not exist`)
}

const layerOrderFile = argv.layerOrder
let layerOrderData
let layerOrder
if (fs.existsSync(layerOrderFile)) {
  layerOrderData = fs.readFileSync(layerOrderFile)
  layerOrder = JSON.parse(layerOrderData)
} else {
  throw new Error(`Error: ${layerOrderFile} layer order file does not exist`)
}

const outputFile = argv.layerMetadata
let outputData
let output
if (fs.existsSync(outputFile)) {
  outputData = fs.readFileSync(outputFile)
  output = JSON.parse(outputData)
}

const metadataConfig = features.features.vismetadata
const url = metadataConfig.url
const daacMap = metadataConfig.daacMap || {}
const layerMetadata = {}
const failedRequests = []

// These are alias or otherwise layers that don't exist in GIBS
skipLayers = [
  'Land_Water_Map',
  'Land_Mask',
  'World_Database_on_Protected_Areas'
]

// NOTE:  Only using these properties at this time
useKeys = [
  'conceptIds',
  'dataCenter',
  'daynight',
  'orbitTracks',
  'orbitDirection',
  'ongoing',
  'layerPeriod',
  'title',
  'subtitle'
]

async function main (url) {
  layerOrder = layerOrder.layerOrder
  layerOrder = layerOrder.filter(x => !skipLayers.includes(x))

  console.warn(`${prog}: Pulling vis metadata for ${layerOrder.length} layers... `)
  for (layerId of layerOrder) {
    await getMetadata(layerId, url)
  }
  console.warn(layerMetadata)
}

async function getDAAC (metadata) {
  console.warn(metadata)
}

async function getMetadata (layerId, baseUrl) {
  try {
    await request({
      method: 'get',
      url: `${baseUrl}${layerId}.json`,
      timeout: 10000
    }).then(async (response) => {
      metadata = JSON.parse(response)
      layerMetadata[layerId] = getDAAC(metadata)
    })
  } catch (error) {
    // count how many times this has errored, then rety 2 times
    // throw new Error(`{prog}: WARNING: Failed to retrieve metadata config for ${layerId}, will retry...`)
  }
}

main(url).catch((err) => {
  console.error(err.stack)
  throw new Error(`${prog}: Visualization metadata not configured. Exiting.`)
})
