const fs = require('fs')
const path = require('path')
const yargs = require('yargs')
const { hideBin } = require('yargs/helpers')
const console = require('console')
const axios = require('axios').default

const prog = path.basename(__filename)

const options = yargs(hideBin(process.argv))
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
  .option('cacheMode', {
    demandOption: false,
    alias: 'c',
    type: 'string',
    description: 'Cache mode for fetching data'
  })
  .epilog('Creates a layer-metadata file containing all layers')

const { argv } = options
if (!argv.features && !argv.layerOrder && !argv.layerMetadata) {
  throw new Error('Invalid number of arguments')
}

const cacheMode = argv.cacheMode

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
  'DAILY_AERONET_ANGSTROM_440-870NM',
  'NOAA_2025_ERI_WMTS',
  'Reference_Labels_15m_arctic',
  'World_Imagery',
  'EUMETSAT_RING_Airmass_RGB',
  'EUMETSAT_RING_Ash_RGB',
  'EUMETSAT_RING_Dust_RGB',
  'EUMETSAT_RING_Natural_Color_RGB',
  'EUMETSAT_RING_IR108'
]

// NOTE: Only using these properties at this time
const useKeys = [
  'conceptIds',
  'ConceptIds',
  'dataCenter',
  'DataCenter',
  'daynight',
  'DayNight',
  'orbitTracks',
  'OrbitTracks',
  'orbitDirection',
  'OrbitDirection',
  'ongoing',
  'Ongoing',
  'layerPeriod',
  'LayerPeriod',
  'title',
  'Title',
  'subtitle',
  'Subtitle'
]

const layerCounts = {
  cmr: [],
  metadata: [],
  missing: []
}

async function main (url, cmrVisualizationsUrl) {
  layerOrder = layerOrder.layerOrder
  layerOrder = layerOrder.filter(x => !skipLayers.includes(x))

  console.warn(`${prog}: Fetching ${layerOrder.length} layer-metadata files`)
  const promises = layerOrder.map((layerId) => {
    if (!layerId.includes('_STD') && !layerId.includes('_NRT')) return getMetadata(layerId, url, cmrVisualizationsUrl)
    return Promise.reject(new Error(`Skipped layer: ${layerId}`))
  })
  const results = await Promise.allSettled(promises)
  const { fulfilled = [], rejected = [] } = Object.groupBy(results, (item) => item.status)

  rejected.forEach(({ reason }) => {
    console.error(`${prog}: ERROR: ${reason}\n`)
  })
  const metadataMap = new Map(fulfilled.map(({ value }) => value))
  const layerMetadata = Object.fromEntries(metadataMap)

  const layers = Object.keys(layerMetadata).sort().reduce(
    (obj, key) => {
      obj[key] = layerMetadata[key]
      return obj
    },
    {}
  )

  console.warn(JSON.stringify(layerCounts.metadata).split(',').join('\n') + '\n')
  console.warn('# of layers that have umm-vis:', layerCounts.cmr.length)
  console.warn('# of layers relying on backup layer-metadata:', layerCounts.metadata.length)
  console.warn('# of layers fully failing:', layerCounts.missing.length, layerCounts.missing)
  fs.writeFileSync(outputFile, JSON.stringify({ layers }))
  console.warn(`${prog}: Combined all ${Object.keys(layerMetadata).length} layer-metadata files into ${path.parse(outputFile).base}`)
}

function getDAAC (metadata) {
  if (!Array.isArray(metadata.conceptIds) || !metadata.conceptIds.length) {
    return metadata
  }
  for (const collection of metadata.conceptIds) {
    const origDataCenter = collection.dataCenter
    const dataCenter = daacMap[origDataCenter]
    if (!dataCenter) {
      continue
    }
    delete collection.dataCenter
    if (!metadata.dataCenter) {
      metadata.dataCenter = [dataCenter]
    } else if (!metadata.dataCenter.includes(dataCenter)) {
      metadata.dataCenter.push(dataCenter)
    }
  }
  return metadata
}

function getDAACUMMVIS (data) {
  if (!Array.isArray(data.ConceptIds) || !data.ConceptIds.length) {
    return data
  }
  const output = { ...data, ...data.Specification.ProductIdentification, ...data.Specification.ProductMetadata }
  for (const collection of data.ConceptIds) {
    const origDataCenter = collection.DataCenter
    const dataCenter = daacMap[origDataCenter]
    if (!dataCenter) {
      continue
    }
    delete collection.DataCenter
    if (!output.DataCenter) {
      output.DataCenter = [dataCenter]
    } else if (!output.DataCenter.includes(dataCenter)) {
      output.DataCenter.push(dataCenter)
    }
  }
  output['Title'] = output['WorldviewTitle']
  output['Subtitle'] = output['WorldviewSubtitle']
  return output
}

let headers = {}

if (cacheMode === 'no-store') {
  const noCacheHeaders = {
    'Cache-Control': 'no-cache no-store',
    Pragma: 'no-cache',
    Expires: '0'
  }
  headers = Object.assign(headers, noCacheHeaders)
}

async function getMetadata (layerId, baseUrl, ummVisUrl, count) {
  if (count - 1) console.warn(`retry #${count - 1} for ${layerId}`)
  try {
    let requestUrl = `${ummVisUrl}?keyword=${layerId}`
    if (count) {
      requestUrl = `${baseUrl}${layerId}.json`
    }
    const response = await axios({
      method: 'get',
      url: requestUrl,
      responseType: 'json',
      timeout: 10000,
      headers
    })
    const responseData = response.data
    if (!count && !responseData.hits) return getMetadata(layerId, baseUrl, ummVisUrl, 1)
    const daac = count ? getDAAC(responseData) : getDAACUMMVIS(responseData.items[0].umm)
    let metadataKeys = Object.keys(daac)
    metadataKeys = metadataKeys.filter(x => !useKeys.includes(x))
    for (const key of metadataKeys) {
      delete daac[key]
    }
    // Convert keys to camelCase
    for (const key in daac) {
      const firstUppercaseCharacter = key.match(/^[A-Z]/g)?.[0]
      if (firstUppercaseCharacter) {
        const newKey = key.replace(firstUppercaseCharacter, firstUppercaseCharacter.toLowerCase())
        daac[newKey] = daac[key]
        delete daac[key]
      }
    }
    if (count) {
      layerCounts.metadata.push(layerId)
    } else {
      layerCounts.cmr.push(layerId)
    }
    return [layerId, daac]
  } catch (error) {
    return await handleException(error, layerId, baseUrl, ummVisUrl, count)
  }
}

async function handleException (error, layerId, url, ummVisUrl, count) {
  if (!count) count = 0
  count++
  if (count < 5) {
    return getMetadata(layerId, url, ummVisUrl, count)
  } else {
    layerCounts.missing.push(layerId)
    console.warn(`\n ${prog} WARN: Unable to fetch ${layerId} ${error}`)
    return Promise.reject(new Error(`Failed to fetch layer ${layerId}: ${error}`))
  }
}

main(url, cmrVisualizationsUrl).catch((err) => {
  console.error(err.stack)
})
