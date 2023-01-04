const fs = require('fs')
const path = require('path')
const yargs = require('yargs')
const prog = path.basename(__filename)

const options = yargs
  .usage('Usage: $0 [optionsFile] [configDir]')
  .option('optionsFile', {
    demandOption: true,
    alias: 'o',
    type: 'string',
    description: 'options file'
  })
  .option('configDir', {
    demandOption: true,
    alias: 'c',
    type: 'string',
    description: 'config directory'
  })
  .epilog('Validates and corrects the configuration files.')

const { argv } = options
if (!argv.optionsFile && !argv.configDir) {
  throw new Error('Invalid number of arguments')
}

const optionsFile = argv.optionsFile
const configDir = argv.configDir

let errorCount = 0
let warningCount = 0
const removedLayers = []

const mainConfigFile = path.join(configDir, 'wv.json')
const wv = JSON.parse(fs.readFileSync(mainConfigFile, 'utf8'))
const opt = JSON.parse(fs.readFileSync(optionsFile, 'utf8'))

const tolerant = opt.tolerant || false

function fail (message) {
  console.error(`${prog}: ERROR: ${message}`)
  errorCount += 1
}

function error (message) {
  tolerant ? warn(message) : fail(message)
}

function warn (message) {
  console.error(`${prog}:  WARN: ${message}`)
  warningCount += 1
}

function removeLayer (wv, layerId) {
  removedLayers.push(layerId)
  delete wv.layers[layerId]
  if (wv.layerOrder.includes(layerId)) wv.layerOrder.splice(wv.layerOrder.indexOf(layerId), 1)
}

function isDateTimeFormat (input) {
  try {
    Date.parse(input)
    return true
  } catch (e) {
    return false
  }
}

if (tolerant) console.warn('Validation enforcement disabled')

let startDate = new Date(Number.MAX_SAFE_INTEGER)

async function main () {
  for (const layerId of Object.keys(wv.layers)) {
    let layer = wv.layers[layerId]

    if (layerId !== layer.get('id')) {
      error(`[${layerId}] layer id does not match id of ${layer.get('id')}`)
    }
    if (!wv.layerOrder.includes(layerId)) {
      if (opt.get('layerOrderExceptions', []).includes(layerId)) {
        removeLayer(wv, layerId)
        continue
      } else if (tolerant || opt.get('ignoreLayerOrder', false)) {
        wv.layerOrder.push(layerId)
      } else {
        removeLayer(wv, layerId)
        continue
      }
    }
    if (!layer.projections || layer.projections.length === 0) {
      error(`[${layerId}] No projections defined or not found in GC documents`)
      removeLayer(wv, layerId)
      continue
    }
    if (!Object.prototype.hasOwnProperty.call(layer, 'type')) {
      error(
        `[${layerId}] No type defined. Possible to be expecting configuration via GC document but was not found`
      )
      removeLayer(wv, layerId)
      continue
    }
    if (Object.prototype.hasOwnProperty.call(layer, 'palette') && !Object.prototype.hasOwnProperty.call(layer.palette, 'id')) {
      error(`[${layerId}] No palette definition`)
    } else if (Object.prototype.hasOwnProperty.call(layer, 'palette')) {
      const paletteId = layer.palette.id
      if (!fs.existsSync(path.join(configDir, 'palettes', `${paletteId}.json`))) {
        error(`[${layerId}] Unknown palette: ${paletteId}`)
        delete layer.palette
      }
    }
    if (Object.prototype.hasOwnProperty.call(layer, 'vectorStyle') && !Object.prototype.hasOwnProperty.call(layer.vectorStyle, 'id')) {
      error(`[${layerId}] No vectorStyle definition`)
    }
    if (!Object.prototype.hasOwnProperty.call(layer, 'group') && opt.get('warnOnUnexpectedLayer')) {
      error(`[${layerId}] Possible unexpected layer, no group defined`)
      removeLayer(wv, layerId)
      continue
    } else if (!Object.prototype.hasOwnProperty.call(layer, 'group')) {
      removeLayer(wv, layerId)
      continue
    }
    for (const projId of Object.keys(layer.projections)) {
      const projection = layer.projections[projId]
      if (Object.prototype.hasOwnProperty.call(projection, 'matrixSet')) {
        const source = projection.source
        const matrixSet = projection.matrixSet
        if (!Object.prototype.hasOwnProperty.call(wv.sources, source)) {
          error(`[${layerId}:${projId}] Invalid source: ${source}`)
          delete layer.projections[projId]
        } else if (!Object.prototype.hasOwnProperty.call(wv.sources[source], 'matrixSets')) {
          error(`[${layerId}:${projId}] No matrix sets for projection`)
          delete layer.projections[projId]
        } else if (!wv.sources[source].matrixSets.includes(matrixSet)) {
          error(`[${layerId}:${projId}] Invalid matrix set: ${matrixSet}`)
          delete layer.projections[projId]
        }
      }
    }
    if (Object.prototype.hasOwnProperty.call(layer, 'temporal')) {
      console.warn(`[${layerId}] GC Layer temporal values overwritten by Options`)
      layer = processTemporal(layer, layer.temporal)
    }
    if (layer.get('futureTime')) {
      if (Object.prototype.hasOwnProperty.call(layer, 'endDate')) {
        delete layer.endDate
      }
    }
    if (layer.get('futureTime', false)) {
      // do nothing
    } else {
      if (Object.prototype.hasOwnProperty.call(layer, 'endDate') && layer.get('ongoing', true)) {
        delete layer.endDate
      }
    }
    if (Object.prototype.hasOwnProperty.call(layer, 'startDate')) {
      const startTime = layer.startDate.replace('T', ' ').replace('Z', '')
      let d
      if (isDateTimeFormat(startTime)) {
        d = new Date(startTime)
      } else {
        d = new Date(layer.startDate)
      }
      startDate = Math.min(startDate, d)
    }
  }

  if (startDate.getTime() !== Number.MAX_VALUE) {
    wv.startDate = startDate.toISOString()
  }

  for (const layerId of wv.layerOrder) {
    if (!Object.prototype.hasOwnProperty.call(wv.layers, layerId)) {
      error(`[${layerId}] In layer order but no definition`)
    }
  }

  const startingLayers = []
  for (const startingLayer of wv.defaults.startingLayers) {
    if (!Object.prototype.hasOwnProperty.call(wv.layers, startingLayer.id)) {
      error(`Invalid starting layer: ${startingLayer.id}`)
    } else {
      startingLayers.push(startingLayer)
    }
  }
  wv.defaults.startingLayers = startingLayers
  wv.buildDate = Date.now()

  for (const projection of Object.keys(wv.naturalEvents.layers)) {
    for (const eventType of Object.keys(wv.naturalEvents.layers[projection])) {
      for (const layerObject of wv.naturalEvents.layers[projection][eventType]) {
        if (!Object.prototype.hasOwnProperty.call(wv.layers, layerObject[0])) {
          error(
            `The ${layerObject[0]} layer in the Natural events ${projection} ${eventType} config does not have a matching ID in the layer config`
          )
        }
      }
    }
  }

  for (const measurement of Object.values(wv.measurements)) {
    if (!Object.prototype.hasOwnProperty.call(measurement, 'sources')) continue
    for (const source of Object.values(measurement.sources)) {
      if (!Object.prototype.hasOwnProperty.call(source, 'settings')) continue
      for (const setting of source.settings) {
        if (!Object.prototype.hasOwnProperty.call(wv.layers, setting)) {
          error(
            `In measurement ${measurement.id}, source ${source.id}, layer not found: ${setting}`
          )
        }
      }
    }
  }

  console.log(`${prog}: ${errorCount} error(s), ${warningCount} warning(s), ${removeCount} removed`)

  if (errorCount > 0) {
    throw new Error(`${prog}: Error: ${errorCount} errors occured`)
  }
}

main().catch((err) => {
  console.error(err.stack)
})
