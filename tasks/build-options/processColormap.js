const fs = require('fs')
const path = require('path')
const convert = require('xml-js')
const { promisify } = require('util')
const yargs = require('yargs')

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

async function main () {
  const files = await walk(inputDir)
  for (const file of files) {
    try {
      const { id, xml } = await readFileAsync(file)
      await processFile(id, xml)
      fileCount += 1
    } catch (error) {
      console.error(error)
      console.error(`${prog}: ERROR: ${error}`)
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

/*
 * matchLegend: Determines if the given entry has a matching legend.id
 *
 * Parameters:
 * entry   [object] Single ColorMapEntry Object for this product
 * legends [object] collection of legends for this product
 *
 * Returns the matching legend if found
*/
async function matchLegend (entry, legends) {
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

async function processEntries (colormap) {
  const entries = toList(colormap.Entries.ColorMapEntry)
  let transparentMap = 'true'

  // Check to see if there is at least one non-transparent entry.
  for (const entry of entries) {
    if (entry._attributes.transparent === 'false') {
      transparentMap = 'false'
      break
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
  let initializeDisabled = []

  // TODO: make this a separate function for entries?
  await Promise.all(
    entries.map(async (entry, index) => {
      const legend = await matchLegend(entry, legends)

      if (legend === 'false') {
        refSkipList.push(entry._attributes.ref)
        return
      }

      const [r, g, b] = entry._attributes.rgb.split(',')

      // Force alpha value to 255 always
      const a = 255

      // If entry is served transparent, add it to the disabled array
      if (entry._attributes.transparent !== 'false' && mapType === 'classification') {
        initializeDisabled.push(refsList.length)
      }

      if (!entry._attributes.ref) {
        throw new Error('No ref in legend')
      }

      if (mapType === 'classification') {
        refsList.push(index)
      } else {
        refsList.push(entry._attributes.ref)
      }
      const rHex = parseInt(r).toString(16).padStart(2, '0')
      const gHex = parseInt(g).toString(16).padStart(2, '0')
      const bHex = parseInt(b).toString(16).padStart(2, '0')
      const aHex = parseInt(a).toString(16).padStart(2, '0')
      const colorString = rHex + gHex + bHex + aHex

      colors.push(colorString)

      if (mapType === 'continuous' || mapType === 'discrete') {
        const items = entry._attributes.value.replace(/[()[\]]/g, '').split(',')
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
          values.push(newItems)
        } catch (error) {
          throw new Error(`Invalid value: ${entry._attributes.value}`)
        }
      }
    })
  )

  // TODO: make this a separate function for legends?
  let skipIndex = 0
  const idList = []
  await Promise.all(
    legends.map(async (entry, index) => {
      if (refSkipList.includes(entry._attributes.id)) {
        skipIndex = skipIndex + 1
        return
      }
      const [r, g, b] = entry._attributes.rgb.split(',')

      // TODO: turn this into reusable function
      const rHex = parseInt(r).toString(16).padStart(2, '0')
      const gHex = parseInt(g).toString(16).padStart(2, '0')
      const bHex = parseInt(b).toString(16).padStart(2, '0')
      const aHex = parseInt(255).toString(16).padStart(2, '0')
      const colorString = rHex + gHex + bHex + aHex

      legendColors.push(colorString)

      if (!entry._attributes.tooltip) {
        throw new Error('No tooltips in legend')
      }

      tooltips.push(entry._attributes.tooltip)

      if (!entry._attributes.id) {
        throw new Error('No id in legend')
      }

      idList.push(entry._attributes.id)

      if (entry._attributes.showTick) {
        ticks.push(skipIndex - 1)
      }
    })
  )

  // Ensure all disabled colormap entries are included at the END
  // Update colors, legendColors & tooltips arrays accordingly
  if (mapType === 'classification') {
    const numDisabled = initializeDisabled.length
    if (numDisabled > 0) {
      const totalEntries = colors.length
      const disabledColorsArr = []
      const disabledLegendsArr = []
      const disabledTooltipsArr = []

      // Iterate backwards to maintain early indices
      for (let i = numDisabled - 1; i >= 0; i -= 1) {
        const thisIndex = initializeDisabled[i]

        disabledColorsArr.push(colors[thisIndex])
        disabledLegendsArr.push(legendColors[thisIndex])
        disabledTooltipsArr.push(tooltips[thisIndex])

        colors.splice(thisIndex, 1)
        legendColors.splice(thisIndex, 1)
        tooltips.splice(thisIndex, 1)
      }

      colors.push(...disabledColorsArr)
      legendColors.push(...disabledLegendsArr)
      tooltips.push(...disabledTooltipsArr)

      const firstDisabledIndex = totalEntries - numDisabled
      initializeDisabled = Array.from({
        length: numDisabled
      }, (item, index) => firstDisabledIndex + index)
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
    },
    disabled: initializeDisabled
  }
  if (mapType === 'continuous' || mapType === 'discrete') {
    result.entries.values = values
  }

  return result
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

/*
 * processFile: Process provided xml file, determine relevant data & write data
 * This determines the colormap & Palette legend data used in WV Layer window
 *
 * Parameters:
 * id  [string] representing this product's layer name
 * xml [string] represention of this product's xml colormap file (served from GIBS)
*/
async function processFile (id, xml) {
  let document
  let colormaps = []
  try {
    document = JSON.parse(convert.xml2json(xml, { compact: true, spaces: 2 }))
    if (document && document.ColorMaps && document.ColorMaps.ColorMap) {
      colormaps = await toList(document.ColorMaps.ColorMap)
    }
    const maps = []
    for (const colormap of colormaps) {
      const result = await processEntries(colormap)
      if (result === 'transparent') {
        // There are no visible colors in the colormap so stop processing
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

    const outputFile = path.join(outputDir, `${id}.json`)
    await writeFile(outputFile, JSON.stringify(data, null, 2), { encoding: 'utf-8' })
  } catch (error) {
    console.error(id)
    console.error(error)
  }
}

main().catch((err) => {
  console.error(err.stack)
})
