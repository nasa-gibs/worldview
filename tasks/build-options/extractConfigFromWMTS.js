const fs = require('fs')
const path = require('path')
const yargs = require('yargs')
const console = require('console')
const convert = require('xml-js')
const { processTemporalLayer } = require('./processTemporalLayer')

const prog = path.basename(__filename)

const options = yargs
  .usage('Usage: $0 [options]')
  .option('config', {
    demandOption: true,
    alias: 'c',
    type: 'string',
    description: 'config file'
  })
  .option('inputDir', {
    demandOption: true,
    alias: 'i',
    type: 'string',
    description: 'getcapabilities input directory'
  })
  .option('outputDir', {
    demandOption: true,
    alias: 'o',
    type: 'string',
    description: 'wmts output directory'
  })
  .epilog('Extracts configuration information from a WMTS GetCapabilities file, converts the XML to JSON')

const { argv } = options
if (!argv.config && !argv.inputDir && !argv.outputDir) {
  throw new Error('Invalid number of arguments')
}

const configFile = argv.config
const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'))
const inputDir = argv.inputDir
const outputDir = argv.outputDir

if (!Object.prototype.hasOwnProperty.call(config, 'wv-options-wmts')) {
  throw new Error(`${prog}: Error: "wv-options-wmts" not in config file`)
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir)
}

const tolerant = config.tolerant
const entries = config['wv-options-wmts']
const skip = config.skip || []

let totalLayerCount = 0
let totalWarningCount = 0
let totalErrorCount = 0

const wv = {
  layers: {},
  sources: {}
}
let wvMatrixSets = {}

class SkipException extends Error {
  constructor (message) {
    super(message)
    this.name = 'SkipException'
  }
}

/**
 * Main function
 * @returns {Promise<void>}
 * @throws {Error}
 * @throws {SkipException}
 */
async function main () {
  for (const entry of entries) {
    wv.layers = {}
    wv.sources = {}
    wvMatrixSets = {}
    const { errorCount, warningCount, layerCount } = await processEntry(entry)
    console.warn(`${prog}: ${errorCount} errors, ${warningCount} warnings, ${layerCount} layers for ${entry.source}`)

    const outputFile = path.join(outputDir, entry.to)
    fs.writeFile(outputFile, JSON.stringify(wv, null, 2), 'utf-8', err => {
      if (err) {
        console.error(err)
      }
    })

    totalErrorCount += errorCount
    totalWarningCount += warningCount
    totalLayerCount += layerCount
  }

  console.warn(`${prog}:${totalErrorCount} errors, ${totalWarningCount} warnings, ${totalLayerCount} layers`)

  if (totalErrorCount > 0) {
    throw new Error(`${prog}: Error: ${totalErrorCount} errors occured`)
  }
}

async function processEntry (entry) {
  let layerCount = 0
  let warningCount = 0
  let errorCount = 0

  wv.sources[entry.source] = {
    matrixSets: wvMatrixSets
  }

  const inputFile = path.join(inputDir, entry.from)
  const gcId = path.basename(inputFile)
  let gc
  try {
    let xml = await fs.promises.readFile(inputFile, 'utf8')
    // graceal need to manually add LERC because this is reading from build/options-build/gc/gibs-geographic.xml and
    // I don't know from what that file is being created
    if (entry.projection === 'geographic') {
      const endFirstLayer = xml.indexOf('</Layer>') + 8
      const lercStr = '<Layer><ows:Title xml:lang=\'en\'>VIIRS Lerc layer for testing</ows:Title><ows:WGS84BoundingBox crs=\'urn:ogc:def:crs:OGC:2:84\'><ows:LowerCorner>-180 -90</ows:LowerCorner><ows:UpperCorner>180 90</ows:UpperCorner></ows:WGS84BoundingBox><ows:Identifier>VIIRS_SNPP_DayNightBand_At_Sensor_Radiance_LERC</ows:Identifier><ows:Metadata xlink:role=\'http://earthdata.nasa.gov/gibs/metadata-type/colormap/1.0\' xlink:type=\'simple\' xlink:title=\'GIBS Color Map: Data - RGB Mapping\' xlink:href=\'https://gitc.earthdata.nasa.gov/colormaps/v1.0/VIIRS_DayNightBand_At_Sensor_Radiance.xml\'/><ows:Metadata xlink:role=\'http://earthdata.nasa.gov/gibs/metadata-type/colormap/1.3\' xlink:type=\'simple\' xlink:title=\'GIBS Color Map: Data - RGB Mapping\' xlink:href=\'https://gitc.earthdata.nasa.gov/colormaps/v1.3/VIIRS_DayNightBand_At_Sensor_Radiance.xml\'/><ows:Metadata xlink:role=\'http://earthdata.nasa.gov/gibs/metadata-type/colormap/\' xlink:type=\'simple\' xlink:title=\'GIBS Color Map: Data - RGB Mapping\' xlink:href=\'https://gitc.earthdata.nasa.gov/colormaps/v1.3/VIIRS_DayNightBand_At_Sensor_Radiance.xml\'/><Style isDefault=\'true\'><ows:Title xml:lang=\'en\'>default</ows:Title><ows:Identifier>default</ows:Identifier><LegendURL height=\'85.5\' xlink:type=\'simple\' xlink:role=\'http://earthdata.nasa.gov/gibs/legend-type/horizontal\' width=\'378.0\' xlink:title=\'GIBS Color Map Legend: Horizontal\' xlink:href=\'https://gitc.earthdata.nasa.gov/legends/VIIRS_DayNightBand_At_Sensor_Radiance_H.svg\' format=\'image/svg+xml\'/><LegendURL height=\'288.0\' xlink:type=\'simple\' xlink:role=\'http://earthdata.nasa.gov/gibs/legend-type/vertical\' width=\'135.0\' xlink:title=\'GIBS Color Map Legend: Vertical\' xlink:href=\'https://gitc.earthdata.nasa.gov/legends/VIIRS_DayNightBand_At_Sensor_Radiance_V.svg\' format=\'image/svg+xml\'/></Style><Dimension><ows:Identifier>Time</ows:Identifier><ows:UOM>ISO8601</ows:UOM><Default>2022-07-31</Default><Current>false</Current><Value>2013-07-31/2022-07-01/P1D</Value></Dimension><TileMatrixSetLink><TileMatrixSet>500m</TileMatrixSet></TileMatrixSetLink><Format>image/lerc</Format><ResourceURL template=\'https://localhost:8080/wmts/epsg4326/best/wmts.cgi?Time={Time}&amp;layer=VIIRS_SNPP_DayNightBand_At_Sensor_Radiance_LERC&amp;style=default&amp;tilematrixset={TileMatrixSet}&amp;Service=WMTS&amp;Request=GetTile&amp;Version=1.0.0&amp;Format=image%2Flerc&amp;TileMatrix={TileMatrix}&amp;TileCol={TileCol}&amp;TileRow={TileRow}\''
      const lercStr2 = ' format=\'image/lerc\' resourceType=\'tile\'/></Layer>'
      xml = xml.substring(0, endFirstLayer) + lercStr + lercStr2 + xml.substring(endFirstLayer)
    }
    gc = JSON.parse(convert.xml2json(xml, { compact: true, spaces: 2 }))
  } catch (e) {
    if (tolerant) {
      console.warn(`${prog}: WARN: [${inputFile}] Unable to get GC: ${e}\n`)
      warningCount += 1
    } else {
      console.error(`${prog}: ERROR: [${inputFile}] Unable to get GC: ${e}\n`)
      errorCount += 1
    }
    return { errorCount, warningCount, layerCount }
  }

  const gcContents = gc.Capabilities.Contents
  const wvLayers = wv.layers

  if (!gcContents || !gcContents.Layer) {
    errorCount += 1
    console.error(`${prog}: ERROR: [${gcId}] No layers\n`)
    return { errorCount, warningCount, layerCount }
  }

  for (const gcLayer of gcContents.Layer) {
    try {
      layerCount += 1
      await processLayer(gcLayer, wvLayers, entry)
    } catch (error) {
      if (error instanceof SkipException) {
        warningCount += 1
        console.warn(`${prog}: WARNING: [${gcId}] Skipping\n`)
      } else {
        errorCount += 1
        console.error(error.stack)
        const ident = gcLayer['ows:Identifier']._text
        console.error(`${prog}: ERROR: [${gcId}:${ident}] ${error}\n`)
      }
    }
  }

  if (gcContents.TileMatrixSet === 'Object') {
    processMatrixSet(gcContents.TileMatrixSet, entry)
  } else {
    gcContents.TileMatrixSet.forEach(gcMatrixSet => {
      processMatrixSet(gcMatrixSet, entry)
    })
  }

  return { errorCount, warningCount, layerCount }
}

async function processLayer (gcLayer, wvLayers, entry) {
  const ident = gcLayer['ows:Identifier']._text
  if (skip.includes(ident)) {
    console.log(`${ident}: skipping`)
    throw new SkipException(ident)
  }

  wvLayers[ident] = {}
  let wvLayer = wvLayers[ident]
  wvLayer.id = ident
  wvLayer.type = 'wmts'
  wvLayer.format = gcLayer.Format._text

  const temporalForProjection = {}

  // Extract start and end dates
  if ('Dimension' in gcLayer) {
    const dimension = gcLayer.Dimension
    if (dimension['ows:Identifier']._text === 'Time') {
      try {
        wvLayer = await processTemporalLayer(wvLayer, dimension.Value, entry.source)
      } catch (e) {
        console.error(e)
        console.error(`${prog}: ERROR: [${ident}] Error processing time values.`)
      }
    }
  }

  // Extract matrix set
  const matrixSetLink = gcLayer.TileMatrixSetLink
  const matrixSet = matrixSetLink.TileMatrixSet._text

  const projectionInfo = {
    source: entry.source,
    matrixSet
  }

  wvLayer.projections = {}
  if (temporalForProjection[entry.projection]) {
    wvLayer.projections[entry.projection] = {
      ...projectionInfo,
      ...temporalForProjection[entry.projection]
    }
    delete wvLayer.dateRanges
    delete wvLayer.startDate
    delete wvLayer.endDate
  } else {
    wvLayer.projections[entry.projection] = { ...projectionInfo }
  }

  if (Object.prototype.hasOwnProperty.call(matrixSetLink, 'TileMatrixSetLimits') && matrixSetLink.TileMatrixSetLimits !== null) {
    const matrixSetLimits = matrixSetLink.TileMatrixSetLimits.TileMatrixLimits
    const mappedSetLimits = []
    for (const setLimit of matrixSetLimits) {
      mappedSetLimits.push({
        tileMatrix: setLimit.TileMatrix._text,
        minTileRow: parseInt(setLimit.MinTileRow._text, 10),
        maxTileRow: parseInt(setLimit.MaxTileRow._text, 10),
        minTileCol: parseInt(setLimit.MinTileCol._text, 10),
        maxTileCol: parseInt(setLimit.MaxTileCol._text, 10)
      })
    }
    wvLayer.projections[entry.projection].matrixSetLimits = mappedSetLimits
  }

  // Vector data links
  if ((Object.prototype.hasOwnProperty.call(gcLayer, 'ows:Metadata') && gcLayer['ows:Metadata'] !== null)) {
    for (const item of gcLayer['ows:Metadata']) {
      if (!(['xlink:role'] in item._attributes)) {
        throw new Error('No xlink:role')
      }
      const schemaVersion = item._attributes['xlink:role']

      if (schemaVersion === 'http://earthdata.nasa.gov/gibs/metadata-type/layer/1.0') {
        const vectorDataLink = item._attributes['xlink:href']
        const vectorDataFile = path.basename(vectorDataLink)
        const vectorDataId = path.parse(vectorDataFile).name
        wvLayer.vectorData = {
          id: vectorDataId
        }
      }
    }
  }

  if (('ows:Metadata' in gcLayer) && (gcLayer['ows:Metadata'] !== null)) {
    if (('skipPalettes' in config) && (ident in config.skipPalettes)) {
      console.warn(`${prog}: WARNING: Skipping palette for ${ident}`)
      totalWarningCount++
    } else {
      for (const item of gcLayer['ows:Metadata']) {
        if (!(['xlink:role'] in item._attributes)) {
          throw new Error('No xlink:role')
        }
        const schemaVersion = item._attributes['xlink:role']

        if (schemaVersion === 'http://earthdata.nasa.gov/gibs/metadata-type/colormap/1.3') {
          const colormapLink = item._attributes['xlink:href']
          const colormapFile = path.basename(colormapLink)
          const colormapId = path.parse(colormapFile).name
          wvLayer.palette = {
            id: colormapId
          }
        } else if (schemaVersion === 'http://earthdata.nasa.gov/gibs/metadata-type/mapbox-gl-style/1.0') {
          const vectorstyleLink = item._attributes['xlink:href']
          const vectorstyleFile = path.basename(vectorstyleLink)
          const vectorstyleId = path.parse(vectorstyleFile).name
          wvLayer.vectorStyle = {
            id: vectorstyleId
          }
        }
      }
    }
  }
}

function processMatrixSet (gcMatrixSet, entry) {
  const tileMatrixArr = gcMatrixSet.TileMatrix
  const ident = gcMatrixSet['ows:Identifier']._text
  const zoomLevels = tileMatrixArr.length
  const resolutions = []
  const formattedTileMatrixArr = []
  const maxResolution = entry.maxResolution
  for (let zoom = 0; zoom < zoomLevels; zoom += 1) {
    resolutions.push(maxResolution / (2 ** zoom))
  }

  for (const tileMatrix of tileMatrixArr) {
    formattedTileMatrixArr.push({
      matrixWidth: parseInt(tileMatrix.MatrixWidth._text, 10),
      matrixHeight: parseInt(tileMatrix.MatrixHeight._text, 10)
    })
  }

  wvMatrixSets[ident] = {
    id: ident,
    maxResolution,
    resolutions,
    tileSize: [
      parseInt(tileMatrixArr[0].TileWidth._text, 10),
      parseInt(tileMatrixArr[0].TileHeight._text, 10)
    ],
    tileMatrices: formattedTileMatrixArr
  }
}

main().catch((err) => {
  console.error(err.stack)
})
