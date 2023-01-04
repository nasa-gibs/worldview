const yargs = require('yargs')
const axios = require('axios')
const { promisify } = require('util')
const fs = require('fs')
const readFileAsync = promisify(fs.readFile)

const prog = require('path').basename(__filename)

const options = yargs
  .usage('Usage: $0  <wv.json> <overrides_file>')
  .option('wvJsonFile', {
    demandOption: true,
    alias: 'w',
    type: 'string',
    description: 'wv.json file'
  })
  .option('overridesFile', {
    demandOption: true,
    alias: 'o',
    type: 'string',
    description: 'overrides file'
  })
  .option('featuresFile', {
    demandOption: true,
    alias: 'f',
    type: 'string',
    description: 'features file'
  })
  .epilog('Fetch preview images from WV Snapshots for any layers which they are missing.')

const { argv } = options
if (!argv.wvJsonFile && !argv.overridesFile && !argv.featuresFile) {
  throw new Error('Invalid number of arguments')
}

const wvJsonFile = argv.wvJsonFile
const overridesFile = argv.overridesFile
const featuresFile = argv.featuresFile

const badSnapshots = []
let overrideDatesDict = {}
let totalSuccessCount = 0
let totalFailureCount = 0
// const timeFormat = '%Y-%m-%dT%H:%M:%SZ'
let snapshotsUrl = ''
const paramDict = {
  base: {
    REQUEST: 'GetSnapshot',
    FORMAT: 'image/jpeg'
  },
  geographic: {
    BBOX: '-90,-180,90,180',
    CRS: 'EPSG:4326',
    WIDTH: '768',
    HEIGHT: '384'
  },
  arctic: {
    BBOX: '-4195000,-4195000,4195000,4195000',
    CRS: 'EPSG:3413',
    WIDTH: '512',
    HEIGHT: '512'
  },
  antarctic: {
    BBOX: '-4195000,-4195000,4195000,4195000',
    CRS: 'EPSG:3031',
    WIDTH: '512',
    HEIGHT: '512'
  }
}

// These layers should not be combined with the reference layer
const standaloneLayers = [
  'Graticule_15m',
  'Coastlines_15m',
  'Reference_Features_15m',
  'Reference_Labels_15m'
]

const destImgDir = './web/images/layers/previews/'

const referenceLayers = {
  geographic: 'OSM_Land_Water_Map',
  arctic: 'OSM_Land_Water_Map',
  antarctic: 'SCAR_Land_Water_Map'
}

const current = new Date()

async function main () {
  // Check to see if this feature is enabled in features.json before continuing
  const featuresFileContent = await readFileAsync(featuresFile, { encoding: 'utf-8' })
  const featuresDict = JSON.parse(featuresFileContent)
  if (featuresDict.features.previewSnapshots === false) {
    throw new Error('previewSnapshots note enabled in features.json')
  }

  // Allow manual configuration of layer ID to specific date to generate desired preview
  const overridesFileContent = await readFileAsync(overridesFile, { encoding: 'utf-8' })
  overrideDatesDict = JSON.parse(overridesFileContent)

  const wvJsonFileContent = await readFileAsync(wvJsonFile, { encoding: 'utf-8' })
  const wvJsonDict = JSON.parse(wvJsonFileContent)
  const layers = wvJsonDict.layers
  snapshotsUrl = wvJsonDict.features.imageDownload.url
  const fetchSnapshots = featuresDict.features.previewSnapshots
  if (!fetchSnapshots) {
    throw new Error(`${prog}: Layer preview fetching disabled. Exiting.`)
  }

  const promises = []
  for (const layer of Object.values(layers)) {
    promises.push(getSnapshots(layer))
  }

  try {
    await Promise.all(promises)
  } catch (error) {
    console.error(`${error}`)
  }

  if (badSnapshots.length > 0) {
    console.warn(`\n${prog}: WARNING: ${badSnapshots.length} snapshots returned no content. See below for details: `)
    for (const badLayer of badSnapshots) {
      console.warn(`\n\t Layer: ${badLayer.id}`)
      console.warn(`\t URL: ${badLayer.url}`)
    }
  }

  if (totalSuccessCount > 0) {
    console.warn(`\n${prog}: Successfully retrieved ${totalSuccessCount} snapshots!`)
  }
  if (totalFailureCount > 0) {
    console.warn(`\n${prog}: WARNING: Failed to retrieve ${totalFailureCount} snapshots!`)
  }
  if (totalFailureCount === 0 && totalSuccessCount === 0) {
    console.warn(`\n${prog}: No snapshots were retrieved. All layers found in wv.json have existing preview images!`)
  }
}

function trackBadSnapshots (layerId, projection, request, imgPath) {
  const arcticBadSize = 9949
  const antarcticBadSize = 4060
  const geographicBadSize = 12088

  fs.stat(imgPath, (error, stats) => {
    if (error) {
      console.error(error)
      return
    }

    const size = stats.size
    if ([arcticBadSize, antarcticBadSize, geographicBadSize].includes(size)) {
      badSnapshots.push({
        id: layerId,
        projection,
        url: request.url
      })
    }
  })
}

function getBestDate (projection, period, dateRanges) {
  const lastRange = dateRanges[dateRanges.length - 1]
  const startDate = lastRange.startDate
  const endDate = lastRange.endDate
  const parsedStartDate = new Date(startDate)
  const parsedEndDate = new Date(endDate)
  const pYear = parsedEndDate.getFullYear()
  const pMonth = parsedEndDate.getMonth() + 1 // months are 0-indexed in JavaScript
  let interval = parseInt(lastRange.dateInterval, 10)
  let alteredDate = null

  // Handle daily layers
  if (period === 'daily') {
    // Go back a few more days for single day layers since something
    // too recent may not be processed yet
    if (interval === 1) {
      interval = 3
    }
    alteredDate = new Date(parsedEndDate - interval * 24 * 60 * 60 * 1000)
  }

  // Choose a good daylight month for arctic
  if (projection === 'arctic' && ![4, 5, 6, 7, 8, 9].includes(pMonth)) {
    if (pYear === current.getFullYear() && current.getMonth() + 1 < 6) {
      alteredDate = new Date(pYear - 1, 5, 1)
    } else {
      alteredDate = new Date(pYear, 5, 1)
    }
  }

  // Choose a good daylight month for antarctic
  if (projection === 'antarctic' && ![10, 11, 12, 1, 2].includes(pMonth)) {
    // TODO handle "bad" months for antarctic
    alteredDate = new Date(pYear, 11, 1)
  }

  // Make sure modified date isn't out of layer date range
  if (alteredDate && alteredDate >= parsedStartDate) {
    return alteredDate.toISOString().slice(0, -5) + 'Z'
  }
  return endDate
}

function getTimeParam (projection, layerId, layer, params) {
  // Only include TIME param for temporal layers
  const dateRanges = layer.dateRanges
  const startDate = layer.startDate
  const period = layer.period

  if (dateRanges) {
    params.TIME = getBestDate(projection, period, dateRanges)
  } else if (startDate) {
    params.TIME = startDate
  }

  // Use any configured override dates
  if (overrideDatesDict[layerId]) {
    params.TIME = overrideDatesDict[layerId]
  }
}

async function getSnapshots (layer) {
  for (const projection of Object.keys(layer.projections)) {
    const projDict = layer.projections[projection]
    const referenceLayer = referenceLayers[projection]

    // Sometimes a layer id is provided per projection (e.g. Land Mask layers)
    // We need to use this layer id to request the layer from WVS/GIBS
    // But, we need to use the WV id as the file name (since that's how we will look up the image in WV)
    let gibsLayerId, wvLayerId
    if (projDict.layer) {
      gibsLayerId = projDict.layer
      wvLayerId = layer.id
    } else {
      gibsLayerId = wvLayerId = layer.id
    }

    const params = { ...paramDict.base, ...paramDict[projection] }
    getTimeParam(projection, wvLayerId, layer, params)

    if (gibsLayerId !== referenceLayer && !standaloneLayers.includes(gibsLayerId)) {
      params.LAYERS = `${referenceLayer},${gibsLayerId}`
      params.OPACITIES = '0.50,1'
    } else {
      params.LAYERS = gibsLayerId
    }

    const destFileName = path.join(destImgDir, projection, `${wvLayerId}.jpg`)

    // Only get images that we don't have already
    const fileExists = await fs.promises.stat(destFileName)
      .then(() => true)
      .catch(() => false)
    if (fileExists) continue

    try {
      const imageReq = await axios.get(snapshotsUrl, { params })
      let statusText = 'ERROR'
      if (imageReq.status === 200) {
        statusText = 'SUCCESS'
        totalSuccessCount += 1
        await fs.promises.writeFile(destFileName, imageReq.data, { flag: 'wx' })
        if (gibsLayerId === referenceLayers[projection]) continue
        trackBadSnapshots(wvLayerId, projection, imageReq, imageReq.data)
      } else {
        totalFailureCount += 1
      }
      console.warn(`\n${prog}: Result: ${statusText} - ${imageReq.status}`)
      console.warn(`${prog}: Layer: ${wvLayerId}`)
      console.warn(`${prog}: URL: ${imageReq.config.url}`)
    } catch (e) {
      console.error(`${prog} ERROR: ${e}`)
    }
  }
}

main().catch((err) => {
  console.error(err.stack)
})
