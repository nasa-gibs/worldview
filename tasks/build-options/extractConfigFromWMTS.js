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
  for (entry of entries) {
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
    const xml = await fs.promises.readFile(inputFile, 'utf8')
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
      processLayer(gcLayer, wvLayers, entry)
    } catch (error) {
      if (error instanceof SkipException) {
        warningCount += 1
        console.warn(`${prog}: WARNING: [${id}] Skipping\n`)
      } else {
        errorCount += 1
        console.error(error.stack)
        console.error(`${prog}: ERROR: [${gcId}:${ident}] ${e}\n`)
      }
    }
  }

  if (gcContents.TileMatrixSet === 'Object') {
    processMatrixSet(gcContents.TileMatrixSet)
  } else {
    gcContents.TileMatrixSet.forEach(gcMatrixSet => {
      processMatrixSet(gcMatrixSet)
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
        wvLayer = await processTemporalLayer(wvLayer, dimension.Value)
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

function processMatrixSet (gcMatrixSet) {
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
