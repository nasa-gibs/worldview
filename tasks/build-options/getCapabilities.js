const fs = require('fs')
const path = require('path')
const yargs = require('yargs')
const console = require('console')
const axios = require('axios').default
const convert = require('xml-js')
const { promisify } = require('util')
const stream = require('stream')

const finished = promisify(stream.finished)
const prog = path.basename(__filename)

const options = yargs
  .usage('Usage: $0 [options]')
  .option('config', {
    demandOption: true,
    alias: 'c',
    type: 'string',
    description: 'config file'
  })
  .option('getcapabilities', {
    demandOption: true,
    alias: 'g',
    type: 'string',
    description: 'getcapabilities file'
  })
  .option('mode', {
    demandOption: true,
    alias: 'm',
    type: 'string',
    description: 'mode'
  })
  .epilog('Pulls GetCapabilities XML and linked metadata from configured locations')

const { argv } = options
if (!argv.config && !argv.getcapabilities) {
  throw new Error('Invalid number of arguments')
}
const configFile = argv.config
const outputDir = argv.getcapabilities
const colormaps = {}
const vectorstyles = {}
const vectordata = {}
const colormapsDir = path.join(outputDir, 'colormaps')
const vectorstylesDir = path.join(outputDir, 'vectorstyles')
const vectordataDir = path.join(outputDir, 'vectordata')

const configData = fs.readFileSync(configFile)
const config = JSON.parse(configData)

async function main () {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
  }

  await getCapabilities()

  if (colormaps) {
    await gatherProcess(colormaps, 'colormap files', colormapsDir, '.xml')
  }
  if (vectorstyles) {
    await gatherProcess(vectorstyles, 'vectorstyle files', vectorstylesDir, '.json')
  }
  if (vectordata) {
    await gatherProcess(vectordata, 'vectordata files', vectordataDir, '.json')
  }
}

async function getCapabilities () {
  // Download each GC xml using the "from" attribute and put it in the "to" location
  if (Object.prototype.hasOwnProperty.call(config, 'wv-options-fetch')) {
    const fetchValues = config['wv-options-fetch']
    for (const value of fetchValues) {
      const inputFile = value.from
      const outputFile = `${outputDir}/${value.to}`

      if (argv.mode === 'verbose') console.warn(`Fetching config for ${inputFile} to ${outputFile}...`)
      await fetchConfigs(inputFile, outputFile)
      if (argv.mode === 'verbose') console.warn(`Processing capabilities for ${outputFile}...`)
      await processGetCapabilities(outputFile)
    }
  }
}

// convert to superagent and use promises
async function fetchConfigs (inputFile, outputFile) {
  const writer = await fs.createWriteStream(outputFile)
  return axios({
    method: 'get',
    url: inputFile,
    responseType: 'stream',
    timeout: 100000
  }).then(async (response) => {
    if (argv.mode === 'verbose') console.warn(`Writing ${outputFile}...`)
    await response.data.pipe(writer)
    return finished(writer)
  })
}

async function handleException (error, link, dir, ext, count) {
  if (!count) count = 0
  count++
  if (count <= 5) {
    await processMetadata(link, dir, ext, count)
  } else {
    console.warn(`\n ${prog} WARN: Unable to fetch ${link} ${error}`)
  }
}

async function processVectorData (layer) {
  if (argv.mode === 'verbose') {
    const ident = layer['ows:Identifier']._text
    console.warn(`Processing vector data for ${ident}:`)
  }
  if (layer['ows:Metadata']) {
    Object.values(layer['ows:Metadata']).forEach((item) => {
      const schemaVersion = item._attributes['xlink:role']
      if (schemaVersion === 'http://earthdata.nasa.gov/gibs/metadata-type/layer/1.0') {
        if (argv.mode === 'verbose') console.warn(`  Processing Metadata: ${item._attributes['xlink:href']}`)
        const vectorDataLink = item._attributes['xlink:href']
        const vectorDataFile = path.basename(vectorDataLink)
        const vectorDataId = path.parse(vectorDataFile).name
        vectordata[vectorDataId] = vectorDataLink
      }
    })
  }
}

async function processLayer (layer) {
  const ident = layer['ows:Identifier']._text
  if (argv.mode === 'verbose') console.warn(`Processing layer ${ident}:`)
  if (layer['ows:Metadata']) {
    if (config.skipPalettes) {
      console.warn(`${prog}: WARN: Skipping palette for ${ident} \n`)
    } else {
      Object.values(layer['ows:Metadata']).forEach((item) => {
        if (argv.mode === 'verbose') console.warn(`  Processing pallette: ${item._attributes['xlink:href']}`)
        const schemaVersion = item._attributes['xlink:role']
        if (schemaVersion === 'http://earthdata.nasa.gov/gibs/metadata-type/colormap/1.3') {
          const colormapLink = item._attributes['xlink:href']
          const colormapFile = path.basename(colormapLink)
          const colormapId = path.parse(colormapFile).name
          colormaps[colormapId] = colormapLink
        } else if (schemaVersion === 'http://earthdata.nasa.gov/gibs/metadata-type/mapbox-gl-style/1.0') {
          const vectorStyleLink = item._attributes['xlink:href']
          const vectorStyleFile = path.basename(vectorStyleLink)
          const vectorStyleId = path.parse(vectorStyleFile).name
          vectorstyles[vectorStyleId] = vectorStyleLink
        }
      })
    }
  }
}

async function processGetCapabilities (outputFile) {
  let xml = fs.readFileSync(outputFile, { encoding: 'utf-8' })
  // need to manually add LERC
  if (outputFile.includes('gibs-geographic')) {
    const endFirstLayer = xml.indexOf('</Layer>') + 8
    const lercStr = '<Layer><ows:Title xml:lang=\'en\'>VIIRS Lerc layer for testing</ows:Title><ows:WGS84BoundingBox crs=\'urn:ogc:def:crs:OGC:2:84\'><ows:LowerCorner>-180 -90</ows:LowerCorner><ows:UpperCorner>180 90</ows:UpperCorner></ows:WGS84BoundingBox><ows:Identifier>VIIRS_VNP46A1_LERC_v1</ows:Identifier><ows:Metadata xlink:role=\'http://earthdata.nasa.gov/gibs/metadata-type/colormap/1.0\' xlink:type=\'simple\' xlink:title=\'GIBS Color Map: Data - RGB Mapping\' xlink:href=\'https://gitc.earthdata.nasa.gov/colormaps/v1.0/VIIRS_DayNightBand_At_Sensor_Radiance.xml\'/><ows:Metadata xlink:role=\'http://earthdata.nasa.gov/gibs/metadata-type/colormap/1.3\' xlink:type=\'simple\' xlink:title=\'GIBS Color Map: Data - RGB Mapping\' xlink:href=\'https://gitc.earthdata.nasa.gov/colormaps/v1.3/VIIRS_DayNightBand_At_Sensor_Radiance.xml\'/><ows:Metadata xlink:role=\'http://earthdata.nasa.gov/gibs/metadata-type/colormap/\' xlink:type=\'simple\' xlink:title=\'GIBS Color Map: Data - RGB Mapping\' xlink:href=\'https://gitc.earthdata.nasa.gov/colormaps/v1.3/VIIRS_DayNightBand_At_Sensor_Radiance.xml\'/><Style isDefault=\'true\'><ows:Title xml:lang=\'en\'>default</ows:Title><ows:Identifier>default</ows:Identifier><LegendURL height=\'85.5\' xlink:type=\'simple\' xlink:role=\'http://earthdata.nasa.gov/gibs/legend-type/horizontal\' width=\'378.0\' xlink:title=\'GIBS Color Map Legend: Horizontal\' xlink:href=\'https://gitc.earthdata.nasa.gov/legends/VIIRS_DayNightBand_At_Sensor_Radiance_H.svg\' format=\'image/svg+xml\'/><LegendURL height=\'288.0\' xlink:type=\'simple\' xlink:role=\'http://earthdata.nasa.gov/gibs/legend-type/vertical\' width=\'135.0\' xlink:title=\'GIBS Color Map Legend: Vertical\' xlink:href=\'https://gitc.earthdata.nasa.gov/legends/VIIRS_DayNightBand_At_Sensor_Radiance_V.svg\' format=\'image/svg+xml\'/></Style><Dimension><ows:Identifier>Time</ows:Identifier><ows:UOM>ISO8601</ows:UOM><Default>2022-07-31</Default><Current>false</Current><Value>2013-07-31/2022-07-01/P1D</Value></Dimension><TileMatrixSetLink><TileMatrixSet>500m</TileMatrixSet></TileMatrixSetLink><Format>image/lerc</Format><ResourceURL template=\'https://localhost:8080/wmts/epsg4326/best/wmts.cgi?Time={Time}&amp;layer=VIIRS_VNP46A1_LERC_v1&amp;style=default&amp;tilematrixset={TileMatrixSet}&amp;Service=WMTS&amp;Request=GetTile&amp;Version=1.0.0&amp;Format=image%2Flerc&amp;TileMatrix={TileMatrix}&amp;TileCol={TileCol}&amp;TileRow={TileRow}\' format=\'image/lerc\' resourceType=\'tile\'/></Layer>'
    xml = xml.substring(0, endFirstLayer) + lercStr + xml.substring(endFirstLayer)
  }
  const gc = JSON.parse(convert.xml2json(xml, { compact: true, spaces: 2 }))

  try {
    if (!gc.Capabilities || !gc.Capabilities.Contents) {
      throw new Error(`error: ${outputFile}: no layers`)
    }

    const layers = gc.Capabilities.Contents.Layer

    Object.values(layers).forEach((layer) => {
      processLayer(layer)
      processVectorData(layer)
    })
  } catch (error) {
    throw new Error(`ERROR: ${outputFile}: ${error}`)
  }
}

async function processMetadata (link, dir, ext, count) {
  // if (count) console.warn(`retry #${count} for ${link}`)
  try {
    const outputFile = path.join(dir, path.basename(link))
    if (link.endsWith(ext)) {
      await fetchConfigs(link, outputFile)
    }
  } catch (error) {
    handleException(error, link, dir, ext, count)
  }
}

async function gatherProcess (type, typeStr, dir, ext) {
  console.warn(`${prog}: Fetching ${Object.keys(type).length} ${typeStr}`)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
  Object.values(type).forEach(async (link) => {
    await processMetadata(link, dir, ext)
  })
}

main().catch((err) => {
  console.error(err.stack)
})
