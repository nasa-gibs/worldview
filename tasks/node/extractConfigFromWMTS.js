const fs = require('fs')
const path = require('path')
const yargs = require('yargs')
const console = require('console')
const processTemporalLayer = require('./processTemporalLayer')

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

const totalLayerCount = 0
let totalWarningCount = 0
const totalErrorCount = 0

class SkipException extends Error {
  constructor (message) {
    super(message)
    this.name = 'SkipException'
  }
}

async function main () {
  for (entry of entries) {
    // const { errorCount, warningCount, layerCount } = processEntry(entry)
    processEntry(entry)
  }

  console.warn(`
    ${prog}:
    ${totalErrorCount.length} errors,
    ${totalWarningCount.length} warnings,
    ${totalLayerCount.length} layers
  `)
  if (totalErrorCount > 0) {
    throw new Error(`${prog}: Error: ${totalErrorCount.length} errors occured`)
  }
}

function processLayer (gcLayer, wvLayers, entry) {
  const ident = gcLayer['ows:Identifier']
  if (skip.includes(ident)) {
    console.log(`${ident}: skipping`)
    throw new SkipException(ident)
  }

  wvLayers[ident] = {}
  let wvLayer = wvLayers[ident]
  wvLayer.id = ident
  wvLayer.type = 'wmts'
  wvLayer.format = gcLayer.Format

  const temporalForProjection = {}

  // Extract start and end dates
  if ('Dimension' in gcLayer) {
    const dimension = gcLayer.Dimension
    if (dimension['ows:Identifier'] === 'Time') {
      try {
        wvLayer = processTemporalLayer(wvLayer, dimension.Value)
      } catch (e) {
        console.error(e)
        console.error(`${prog}: ERROR: [${ident}] Error processing time values.`)
      }
    }
  }

  // Extract matrix set
  const matrixSetLink = gcLayer.TileMatrixSetLink
  const matrixSet = matrixSetLink.TileMatrixSet

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
        tileMatrix: setLimit.TileMatrix,
        minTileRow: parseInt(setLimit.MinTileRow, 10),
        maxTileRow: parseInt(setLimit.MaxTileRow, 10),
        minTileCol: parseInt(setLimit.MinTileCol, 10),
        maxTileCol: parseInt(setLimit.MaxTileCol, 10)
      })
    }
    wvLayer.projections[entry.projection].matrixSetLimits = mappedSetLimits
  }

  // Vector data links
  if ((Object.prototype.hasOwnProperty.call(gcLayer, 'ows:Metadata') && gcLayer['ows:Metadata'] !== null)) {
    for (const item of gcLayer['ows:Metadata']) {
      if (!Object.prototype.hasOwnProperty.call(item, '@xlink:role')) {
        throw new Error('No xlink:role')
      }
      const schemaVersion = item['@xlink:role']

      if (schemaVersion === 'http://earthdata.nasa.gov/gibs/metadata-type/layer/1.0') {
        const vectorDataLink = item['@xlink:href']
        const vectorDataFile = path.basename(vectorDataLink)
        const vectorDataId = path.splitext(vectorDataFile)[0]
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
        if (!('@xlink:role' in item)) {
          throw new Error('No xlink:role')
        }
        const schemaVersion = item['@xlink:role']

        if (schemaVersion === 'http://earthdata.nasa.gov/gibs/metadata-type/colormap/1.3') {
          const colormapLink = item['@xlink:href']
          const colormapFile = path.basename(colormapLink)
          const colormapId = path.splitext(colormapFile)[0]
          wvLayer.palette = {
            id: colormapId
          }
        } else if (schemaVersion === 'http://earthdata.nasa.gov/gibs/metadata-type/mapbox-gl-style/1.0') {
          const vectorstyleLink = item['@xlink:href']
          const vectorstyleFile = path.basename(vectorstyleLink)
          const vectorstyleId = path.splitext(vectorstyleFile)[0]
          wvLayer.vectorStyle = {
            id: vectorstyleId
          }
        }
      }
    }
  }
}

async function processEntry (entry) {
  let layerCount = 0
  let warningCount = 0
  let errorCount = 0
  const wv = {
    layers: {},
    sources: {}
  }
  const wvMatrixSets = {}
  wv.sources[entry.source] = {
    matrixSets: wvMatrixSets
  }

  const inputFile = path.join(inputDir, entry.from)
  const gcId = path.basename(inputFile)
  let gc
  try {
    const xml = await fs.promises.readFile(inputFile, 'utf8')
    gc = xmltodict.parse(xml)
  } catch (e) {
    if (tolerant) {
      process.stderr.write(`${prog}:   WARN: [${inputFile}] Unable to get GC: ${e}\n`)
      warningCount += 1
    } else {
      process.stderr.write(`${prog}: ERROR: [${inputFile}] Unable to get GC: ${e}\n`)
      errorCount += 1
    }
    return [errorCount, warningCount, layerCount]
  }

  const gcContents = gc.Capabilities.Contents
  const wvLayers = wv.layers

  if (!gcContents || !gcContents.Layer) {
    errorCount += 1
    process.stderr.write(`${prog}: ERROR: [${gcId}] No layers\n`)
    return [errorCount, warningCount, layerCount]
  }

  if (typeof gc.Capabilities.Contents.Layer === 'object') {
    const gcLayer = gc.Capabilities.Contents.Layer
    const ident = gcLayer['ows:Identifier']
    try {
      layerCount += 1
      processLayer(gcLayer, wvLayers, entry)
    } catch (error) {
      if (error instanceof SkipException) {
        warningCount += 1
        process.stderr.write(`${prog}: WARNING: [${ident}] Skipping\n`)
      } else {
        errorCount += 1
        console.error(e.stack)
        process.stderr.write(`${prog}: ERROR: [${gcId}:${ident}] ${e}\n`)
      }
    }
  } else {
    for (const gcLayer of gcContents.Layer) {
      // const ident = gcLayer['ows:Identifier']
      try {
        layerCount += 1
        processLayer(gcLayer, wvLayers, entry)
      } catch (error) {
        if (se instanceof SkipException) {
          warningCount += 1
          process.stderr.write(`${prog}: WARNING: [${id}] Skipping\n`)
        } else {
          errorCount += 1
          console.error(e.stack)
        }
      }
    }
  }

  processMatrixSet(gcMatrixSet)

  if (typeof gcContents.TileMatrixSet === 'object') {
    processMatrixSet(gcContents.TileMatrixSet)
  } else {
    gcContents.TileMatrixSet.forEach(gcMatrixSet => {
      processMatrixSet(gcMatrixSet)
    })
  }
}

function processMatrixSet (gcMatrixSet) {
  const tileMatrixArr = gcMatrixSet.TileMatrix
  const ident = gcMatrixSet['ows:Identifier']
  const zoomLevels = tileMatrixArr.length
  const resolutions = []
  const formattedTileMatrixArr = []
  const maxResolution = entry.maxResolution
  for (let zoom = 0; zoom < zoomLevels; zoom += 1) {
    resolutions.push(maxResolution / (2 ** zoom))
  }

  for (const tileMatrix of tileMatrixArr) {
    formattedTileMatrixArr.push({
      matrixWidth: parseInt(tileMatrix.MatrixWidth, 10),
      matrixHeight: parseInt(tileMatrix.MatrixHeight, 10)
    })
  }

  wvMatrixSets[ident] = {
    id: ident,
    maxResolution,
    resolutions,
    tileSize: [
      parseInt(tileMatrixArr[0].TileWidth, 10),
      parseInt(tileMatrixArr[0].TileHeight, 10)
    ],
    tileMatrices: formattedTileMatrixArr
  }
}

main().catch((err) => {
  console.error(err.stack)
})
