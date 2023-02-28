const moment = require('moment')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const yargs = require('yargs')

const prog = path.basename(__filename)

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

let overrideDatesDict = {}
const badSnapshots = []
let totalSuccessCount = 0
let totalFailureCount = 0
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

async function main () {
  // Check to see if this feature is enabled in features.json before continuing
  const featuresFileContent = fs.readFileSync(featuresFile, { encoding: 'utf-8' })
  const featuresDict = JSON.parse(featuresFileContent)
  if (featuresDict.features.previewSnapshots === false) {
    throw new Error('previewSnapshots note enabled in features.json')
  }

  // Allow manual configuration of layer ID to specific date to generate desired preview
  const overridesFileContent = fs.readFileSync(overridesFile, { encoding: 'utf-8' })
  overrideDatesDict = JSON.parse(overridesFileContent)

  const wvJsonFileContent = fs.readFileSync(wvJsonFile, { encoding: 'utf-8' })
  const wvJsonDict = JSON.parse(wvJsonFileContent)
  const layers = wvJsonDict.layers
  snapshotsUrl = wvJsonDict.features.imageDownload.url
  const fetchSnapshots = featuresDict.features.previewSnapshots
  if (!fetchSnapshots) {
    throw new Error(`${prog}: Layer preview fetching disabled. Exiting.`)
  }

  for (const layer of Object.values(layers)) {
    await getSnapshots(layer)
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

async function trackBadSnapshots (layerId, projection, request, imgFile, badSnapshots) {
  const arcticBadSize = 9949
  const antarcticBadSize = 4060
  const geographicBadSize = 12088
  let size = 0

  fs.stat(imgFile, (err, stats) => {
    if (err) throw err
    size = stats.size
  })

  if (size === geographicBadSize || size === arcticBadSize || size === antarcticBadSize) {
    badSnapshots.push({
      id: layerId,
      projection,
      url: request.url
    })
  }
}

async function getBestDate (projection, period, dateRanges) {
  const lastRange = dateRanges[dateRanges.length - 1]
  const startDate = lastRange.startDate
  let endDate = lastRange.endDate
  const parsedStartDate = moment(startDate).utc()
  const parsedEndDate = moment(endDate).utc()
  const parsedEndYear = parsedEndDate.year()
  const parsedEndMonth = parsedEndDate.month() + 1
  let interval = parseInt(lastRange.dateInterval, 10)
  let alteredDate = null

  // Handle daily layers
  if (period === 'daily') {
    if (interval === 1) {
      // Go back a few more days for single day layers since something
      // too recent may not be processed yet
      interval = 3
    }
    alteredDate = moment(endDate).subtract(interval, 'days').utc().format()
  } else {
    alteredDate = moment(endDate).subtract(interval, 'months').utc().format()
  }

  // Choose a good daylight month for arctic
  if (projection === 'arctic' && ![4, 5, 6, 7, 8, 9].includes(parsedEndMonth)) {
    const currentYear = moment().year()
    const currentMonth = moment().month() + 1
    if (parsedEndYear === currentYear && currentMonth < 6) {
      alteredDate = moment({ year: parsedEndYear - 1, month: 4, day: 1 }).utc().format()
    } else {
      alteredDate = moment({ year: parsedEndYear, month: 4, day: 1 }).utc().format()
    }
  }

  // Choose a good daylight month for antarctic
  if (projection === 'antarctic' && ![10, 11, 12, 1, 2].includes(parsedEndMonth)) {
    alteredDate = moment({ year: parsedEndYear, month: 10, day: 1 }).utc().format()
  }

  // Make sure modified date isn't out of layer date range
  if (alteredDate && moment(alteredDate).isSameOrAfter(parsedStartDate)) {
    endDate = alteredDate
  }

  return endDate
}

async function getTimeParam (projection, layerId, layer, params) {
  // Only include TIME param for temporal layers
  const dateRanges = layer.dateRanges
  const startDate = layer.startDate
  const period = layer.period

  if (dateRanges) {
    params.TIME = await getBestDate(projection, period, dateRanges)
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
    const params = { ...paramDict.base, ...paramDict[projection] }

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

    const destFileName = path.join(destImgDir, projection, `${wvLayerId}.jpg`)

    // Only get images that we don't have already
    const fileExists = await fs.promises.stat(destFileName)
      .then(() => true)
      .catch(() => false)
    if (fileExists) continue

    await getTimeParam(projection, wvLayerId, layer, params)

    if (gibsLayerId !== referenceLayer && !standaloneLayers.includes(gibsLayerId)) {
      params.LAYERS = `${referenceLayer},${gibsLayerId}`
      params.OPACITIES = '0.50,1'
    } else {
      params.LAYERS = gibsLayerId
    }

    try {
      const imageReq = await axios({
        method: 'get',
        url: snapshotsUrl,
        params,
        responseType: 'stream'
      })
      if (imageReq.status === 200) {
        statusText = 'SUCCESS'
        totalSuccessCount += 1
        const dest = await fs.createWriteStream(destFileName, { flags: 'wx' })
        dest.on('finish', () => {
          console.warn(`File ${destFileName} has been written`)
          if (gibsLayerId === referenceLayers[projection]) {
            return
          }
          trackBadSnapshots(wvLayerId, projection, imageReq, destFileName)
        })
        imageReq.data.pipe(dest)
      } else {
        totalFailureCount += 1
        statusText = 'ERROR'
      }
      console.warn(`\n${prog}: Result: ${statusText} - ${imageReq.status}`)
      console.warn(`${prog}: Layer: ${wvLayerId}`)
      console.warn(`${prog}: URL: ${imageReq.config.url}`)
    } catch (e) {
      totalFailureCount += 1
      statusText = 'ERROR'
      console.error(`${prog} ERROR: Unable to fetch layer: ${wvLayerId} proj:${projection}`)
      // console.error(`${prog} Error: ${e}`)
    }
  }
}

main().catch((err) => {
  console.error(err.stack)
})
