const fs = require('fs')
const path = require('path')
const yargs = require('yargs')
const console = require('console')
const axios = require('axios').default

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
  .epilog('Creates a layer-metadata file containing all layers')

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

const metadataConfig = features.features.vismetadata
const url = metadataConfig.url
const daacMap = metadataConfig.daacMap || {}
const layerMetadata = {}

// These are alias or otherwise layers that don't exist in GIBS
skipLayers = [
  'Land_Water_Map',
  'Land_Mask',
  'World_Database_on_Protected_Areas'
]

// NOTE: Only using these properties at this time
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

  console.warn(`${prog}: Fetching ${layerOrder.length} layer-metadata files`)
  for (layerId of layerOrder) {
    await getMetadata(layerId, url)
  }

  const layers = Object.keys(layerMetadata).sort().reduce(
    (obj, key) => {
      obj[key] = layerMetadata[key]
      return obj
    },
    {}
  )

  await fs.writeFileSync(outputFile, JSON.stringify({ layers }))
  console.warn(`${prog}: Combined all layer-metadata files into ${path.parse(outputFile).base}`)
}

async function getDAAC (metadata) {
  if (!Array.isArray(metadata.conceptIds) || !metadata.conceptIds.length) {
    return metadata
  }
  for (collection of metadata.conceptIds) {
    const origDataCenter = collection.dataCenter
    const dataCenter = daacMap[origDataCenter]
    if (!dataCenter) {
      continue
    }
    await delete collection.dataCenter
    if (!metadata.dataCenter) {
      metadata.dataCenter = [dataCenter]
    } else if (!metadata.dataCenter.includes(dataCenter)) {
      metadata.dataCenter.push(dataCenter)
    }
  }
  return metadata
}

async function getMetadata (layerId, baseUrl, count) {
  if (count) console.warn(`retry #${count} for ${layerId}`)
  return axios({
    method: 'get',
    url: `${baseUrl}${layerId}.json`,
    responseType: 'json',
    timeout: 10000
  }).then(async (response) => {
    metadata = response.data
    layerMetadata[layerId] = await getDAAC(metadata)
    metadataKeys = Object.keys(layerMetadata[layerId])
    metadataKeys = metadataKeys.filter(x => !useKeys.includes(x))
    for (key of metadataKeys) {
      delete layerMetadata[layerId][key]
    }
  }).catch((error) => {
    handleException(error, layerId, url, count)
  })
}

async function handleException (error, layerId, url, count) {
  if (!count) count = 0
  count++
  if (count <= 5) {
    await getMetadata(layerId, url, count)
  } else {
    console.warn(`\n ${prog} WARN: Unable to fetch ${layerId} ${error}`)
  }
}

main(url).catch((err) => {
  console.error(err.stack)
})
