const fs = require('fs')
const path = require('path')
const yargs = require('yargs')
const console = require('console')
const axios = require('axios').default
const xml2js = require('xml2js')

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
  .option('mode', {
    demandOption: true,
    alias: 'mo',
    type: 'string',
    description: 'mode'
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
const { url, cmrVisualizationsUrl } = metadataConfig
const daacMap = metadataConfig.daacMap || {}
const layerMetadata = {}

// These are alias or otherwise layers that don't exist in GIBS
const skipLayers = [
  'Land_Water_Map',
  'Land_Mask',
  'World_Database_on_Protected_Areas',
  'HLS_Shortwave_Infrared_Sentinel',
  'HLS_Shortwave_Infrared_Landsat',
  'HLS_False_Color_Vegetation_Landsat',
  'HLS_False_Color_Vegetation_Sentinel',
  'HLS_False_Color_Urban_Sentinel',
  'HLS_False_Color_Urban_Landsat',
  'HLS_False_Color_Sentinel',
  'HLS_Customizable_Sentinel',
  'HLS_Customizable_Landsat',
  'HLS_NDVI_Landsat',
  'HLS_NDWI_Landsat',
  'HLS_NDSI_Landsat',
  'HLS_Moisture_Index_Landsat',
  'HLS_EVI_Landsat',
  'HLS_SAVI_Landsat',
  'HLS_MSAVI_Landsat',
  'HLS_NBR2_Landsat',
  'HLS_NBR_Landsat',
  'HLS_TVI_Landsat',
  'HLS_NDVI_Sentinel',
  'HLS_NDWI_Sentinel',
  'HLS_NDSI_Sentinel',
  'HLS_Moisture_Index_Sentinel',
  'HLS_EVI_Sentinel',
  'HLS_SAVI_Sentinel',
  'HLS_MSAVI_Sentinel',
  'HLS_NBR2_Sentinel',
  'HLS_NBR_Sentinel',
  'HLS_TVI_Sentinel',
  'HLS_False_Color_Landsat',
  'AERONET_AOD_500NM',
  'AERONET_ANGSTROM_440-870NM',
  'DAILY_AERONET_AOD_500NM',
  'DAILY_AERONET_ANGSTROM_440-870NM'
]

// NOTE: Only using these properties at this time
const useKeys = [
  'conceptIds',
  'ConceptIds',
  'dataCenter',
  'daynight',
  'orbitTracks',
  'orbitDirection',
  'ongoing',
  'layerPeriod',
  'title',
  'Title',
  'subtitle',
  'Subtitle',
  'What'
]

async function main (url, cmrVisualizationsUrl) {
  layerOrder = layerOrder.layerOrder
  layerOrder = layerOrder.filter(x => !skipLayers.includes(x))

  console.warn(`${prog}: Fetching ${layerOrder.length} layer-metadata files`)
  for (const layerId of layerOrder) {
    if (!layerId.includes('_STD') && !layerId.includes('_NRT')) {
      if (argv.mode === 'verbose') console.warn(`${prog}: Fetching metadata for ${layerId}`)
      await getMetadata(layerId, url, cmrVisualizationsUrl)
    }
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
  const conceptIds = metadata.conceptIds || metadata.ConceptIds
  if (!Array.isArray(conceptIds) || !conceptIds.length) {
    return metadata
  }
  for (const collection of conceptIds) {
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

async function getMetadata (layerId, baseUrl, ummVisUrl, count) {
  if (count) console.warn(`retry #${count} for ${layerId}`)
  const searchReq = await fetch(`${ummVisUrl}?identifier=${layerId}`, { signal: AbortSignal.timeout(10000) })
  const searchText = await searchReq?.text?.() || ''
  const parser = new xml2js.Parser()
  const searchJson = await parser.parseStringPromise(searchText)
  const location = searchJson?.results?.references?.[0]?.reference?.[0]?.location?.[0]
  if (location) {
    const ummVisReq = await fetch(location, { signal: AbortSignal.timeout(10000) })
    const metadata = await ummVisReq.json()
    layerMetadata[layerId] = await getDAAC(metadata)
    let metadataKeys = Object.keys(layerMetadata[layerId])
    metadataKeys = metadataKeys.filter(x => !useKeys.includes(x))
    for (const key of metadataKeys) {
      delete layerMetadata[layerId][key]
    }
    // Convert keys to camelCase
    for (const key in layerMetadata[layerId]) {
      const firstUppercaseCharacter = key.match(/^[A-Z]/g)?.[0]
      if (firstUppercaseCharacter) {
        const newKey = key.replace(firstUppercaseCharacter, firstUppercaseCharacter.toLowerCase())
        layerMetadata[layerId][newKey] = layerMetadata[layerId][key]
        delete layerMetadata[layerId][key]
      }
    }
    if (argv.mode === 'verbose') console.warn(layerMetadata[layerId])
  } else {
    return axios({
      method: 'get',
      url: `${baseUrl}${layerId}.json`,
      responseType: 'json',
      timeout: 10000
    }).then(async (response) => {
      const metadata = response.data
      layerMetadata[layerId] = await getDAAC(metadata)
      let metadataKeys = Object.keys(layerMetadata[layerId])
      metadataKeys = metadataKeys.filter(x => !useKeys.includes(x))
      for (const key of metadataKeys) {
        delete layerMetadata[layerId][key]
      }
      if (argv.mode === 'verbose') console.warn(layerMetadata[layerId])
    }).catch((error) => {
      if (argv.mode === 'verbose') console.warn(`\n ${prog} WARN: Unable to fetch ${layerId} ${error}`)
      handleException(error, layerId, url, ummVisUrl, count)
    })
  }
}

async function handleException (error, layerId, url, ummVisUrl, count) {
  if (!count) count = 0
  count++
  if (count <= 5) {
    await getMetadata(layerId, url, ummVisUrl, count)
  } else {
    console.warn(`\n ${prog} WARN: Unable to fetch ${layerId} ${error}`)
  }
}

main(url, cmrVisualizationsUrl).catch((err) => {
  console.error(err.stack)
})
