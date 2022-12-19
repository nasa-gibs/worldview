const fs = require('fs')
const path = require('path')
const convert = require('xml-js')
const { promisify } = require('util')
const yargs = require('yargs')

const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

const prog = path.basename(__filename)

const options = yargs
  .usage('Usage: $0 [config] [inputDir] [outputDir]')
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
  .epilog('Converts colormaps to JSON files')

const { argv } = options
if (!argv.config && !argv.inputDir && !argv.outputDir) {
  throw new Error('Invalid number of arguments')
}

const config = argv.config
const inputDir = argv.inputDir
const outputDir = argv.outputDir

const skips = config.skipPalettes || []
let errorCount = 0
let fileCount = 0

const walk = (dir) => {
  let results = []
  const list = fs.readdirSync(dir)
  list.forEach((file) => {
    file = `${dir}/${file}`
    const stat = fs.statSync(file)
    if (stat && stat.isDirectory()) {
      /* Recurse into a subdirectory */
      results = results.concat(walk(file))
    } else {
      const fileType = file.split('.').pop()
      if (fileType === 'xml') {
        results.push(file)
      }
    }
  })
  return results
}

async function main() {
  const files = await walk(inputDir)
  for (const file of files) {
    try {
      const { id, xml } = await readFileAsync(file)
      await processFile(id, xml)
      fileCount += 1
    } catch (error) {
      console.error(`${prog}: ERROR: ${error.message}`)
      errorCount += 1
    }
  }

  console.warn(`${prog}: ${errorCount} error(s), ${fileCount} file(s)`)

  if (errorCount > 0) {
    throw new Error(`${prog}: Error: ${errorCount} errors occured`)
  }
}

function toList (v) {
  return Array.isArray(v) ? v : [v]
}

function matchLegend (entry, legends) {
  try {
    let matched = 'false'
    for (const legend of legends) {
      if (!legend._attributes.id) {
        throw new Error('No legend IDs')
      }
      if (legend._attributes.id === entry._attributes.ref) {
        matched = legend
      }
    }
    return matched
  } catch (e) {
    throw new Error(`Invalid reference: ${entry._attributes.ref}`)
  }
}

function processEntries (colormap) {
  const entries = toList(colormap.Entries.ColorMapEntry)

  let transparentMap = 'true'
  for (const entry of entries) {
    if (entry._attributes.transparent === 'false') {
      transparentMap = 'false'
    }
  }
  if (transparentMap === 'true') {
    return 'transparent'
  }

  if (!colormap.Legend) {
    throw new Error('No Legend')
  }
  const mapType = colormap.Legend._attributes.type
  const legends = toList(colormap.Legend.LegendEntry)
  const colors = []
  const values = []
  const ticks = []
  const tooltips = []
  const legendColors = []
  const refsList = []
  const refSkipList = []
  const colorFormat = '{0:02x}{1:02x}{2:02x}{3:02x}'
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]
    const legend = matchLegend(entry, legends)
    if (legend === 'false') {
      refSkipList.push(entry._attributes.ref)
      continue
    }
    const [r, g, b] = entry._attributes.rgb.split(',')
    let a = 0
    if (entry._attributes.transparent === 'true') {
      a = 255
    }
    if (a === 0) {
      refSkipList.push(entry._attributes.ref)
      continue
    }
    if (!entry._attributes.ref) {
      throw new Error('No ref in legend')
    }
    refsList.push(entry._attributes.ref)
    colors.push(colorFormat.format(parseInt(r, 10), parseInt(g, 10), parseInt(b, 10), a))
    if (mapType === 'continuous' || mapType === 'discrete') {
      const items = entry._attributes['value'].replace(/[()[\]]/g, '').split(',')
      try {
        const newItems = []
        for (const item of items) {
          let v = parseFloat(item)
          if (v === Number.POSITIVE_INFINITY) {
            v = Number.MAX_VALUE
          }
          if (v === Number.NEGATIVE_INFINITY) {
            v = Number.MIN_VALUE
          }
          newItems.push(v)
        }
      } catch (error) {
        throw new Error(`Invalid value: ${entry._attributes.value}`)
      }

      let skipIndex = 0
      const idList = []
      for (const [index, entry] of legends.entries()) {
        if (refSkipList.includes(entry._attributes.id)) {
          skipIndex += 1
          continue
        }
        const [r, g, b] = entry._attributes['rgb'].split(',')
        legendColors.push(colorFormat.format(parseInt(r, 10), parseInt(g, 10), parseInt(b, 10), 255))
        if (!entry._attributes.tooltip) {
          throw new Error('No tooltips in legend')
        }
        tooltips.push(entry._attributes.tooltip)
        if (!entry._attributes.id) {
          throw new Error('No id in legend')
        }
        idList.push(entry._attributes.id)
        if (entry._attributes.showTick) {
          ticks.push(index - skipIndex)
        }
      }

      const result = {
        type: mapType,
        entries: {
          type: mapType,
          colors,
          refs: refsList
        },
        legend: {
          colors: legendColors,
          type: mapType,
          tooltips,
          ticks,
          refs: idList
        }
      }
      if (mapType === 'continuous' || mapType === 'discrete') {
        result.entries.values = values
      }

      return result
    }
  }
}

async function readFileAsync (file) {
  const id = path.basename(file, path.extname(file))
  if (skips.includes(id)) {
    console.error(`${prog}:  WARN: [${file}] Skipping`)
    return
  }
  const xml = await readFile(file, { encoding: 'utf-8' })
  return { id, xml }
}

async function processFile (id, xml) {
  const document = JSON.parse(convert.xml2json(xml, { compact: true, spaces: 2 }))
  const colormaps = toList(document.ColorMaps.ColorMap)
  const maps = []
  for (const colormap of colormaps) {
    const result = await processEntries(colormap)
    if (result === 'transparent') {
      continue
    }
    result.title = colormap._attributes.title
    result.entries.title = colormap._attributes.title
    result.legend.title = colormap._attributes.title
    result.legend.id = `${id}_${maps.length}_legend`
    if ('minLabel' in colormap.Legend._attributes) {
      result.legend.minLabel = colormap.Legend._attributes.minLabel
    }
    if ('maxLabel' in colormap.Legend._attributes) {
      result.legend.maxLabel = colormap.Legend._attributes.maxLabel
    }
    if ('units' in colormap._attributes) {
      result.legend.units = colormap._attributes.units
    }
    maps.push(result)
  }

  const data = {
    id,
    maps
  }
  const jsonOptions = {
    indent: 2,
    separators: [',', ': ']
  }

  const outputFile = path.join(outputDir, `${id}.json`)
  await writeFile(outputFile, JSON.stringify(data, null, jsonOptions.indent), { encoding: 'utf-8' })
}

main().catch((err) => {
  console.error(err.stack)
})
