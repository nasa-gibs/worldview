#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yargs = require('yargs');
const console = require('console');
const request = require('axios').default;
const convert = require('xml-js');
const { promisify } = require('util');
const stream = require('stream');

const finished = promisify(stream.finished);
const prog = path.basename(__filename);
// const baseDir = path.join(__dirname, '..');

const options = yargs
  .usage('Usage: $0 [options]')
  .option('config', {
    demandOption: true,
    alias: 'c',
    type: 'string',
    description: 'config file',
  })
  .option('getcapabilities', {
    demandOption: true,
    alias: 'g',
    type: 'string',
    description: 'getcapabilities file',
  })
  .epilog('Pulls GetCapabilities XML and linked metadata from configured locations');

// import config file from ./config/default/release/config.json

const { argv } = options;
if (!argv.config && !argv.getcapabilities) {
  console.error('Invalid number of arguments');
  process.exit(1);
}
const configFile = argv.config;
const outputDir = argv.getcapabilities;
const colormaps = {};
const vectorstyles = {};
const vectordata = {};
const colormapsDir = path.join(outputDir, 'colormaps');
const vectorstylesDir = path.join(outputDir, 'vectorstyles');
const vectordataDir = path.join(outputDir, 'vectordata');

const configData = fs.readFileSync(configFile);
const config = JSON.parse(configData);

async function main () {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  await GetCapabilities();

  // process.exit();
}

async function GetCapabilities() {
  // Download each GC xml using the "from" attribute and put it in the "to" location
  if (Object.prototype.hasOwnProperty.call(config, 'wv-options-fetch')) {
    const fetchValues = config['wv-options-fetch'];
    Object.entries(fetchValues).forEach(async ([key, value]) => {
      const inputFile = value.from;
      const outputFile = `${outputDir}/${value.to}`;

      await fetchConfigs(inputFile, outputFile);
      await processGetCapabilities(outputFile);

      if (colormaps) {
        await gatherProcess(colormaps, 'colormaps', colormapsDir, '.xml');
      }
      if (vectorstyles) {
        await gatherProcess(vectorstyles, 'vectorstyles', vectorstylesDir, '.json');
      }
      if (vectordata) {
        await gatherProcess(vectordata, 'vectordatas', vectordataDir, '.json');
      }
    });
  }
}

async function fetchConfigs(inputFile, outputFile) {
  const writer = await fs.createWriteStream(outputFile);
  return request({
    method: 'get',
    url: inputFile,
    responseType: 'stream',
  }).then(async (response) => {
    await response.data.pipe(writer);
    return finished(writer);
  });
}

async function handleException(error, link) {
  console.warn(`\n ${prog} WARN: Unable to fetch ${link} ${error}`);
}

async function processVectorData(layer) {
  if (layer['ows:Metadata']) {
    Object.values(layer['ows:Metadata']).forEach((item) => {
      const schemaVersion = item._attributes['xlink:role'];
      if (schemaVersion === 'http://earthdata.nasa.gov/gibs/metadata-type/layer/1.0') {
        const vectorDataLink = item._attributes['xlink:href'];
        const vectorDataFile = path.basename(vectorDataLink);
        const vectorDataId = path.parse(vectorDataFile).name;
        vectordata[vectorDataId] = vectorDataLink;
      }
    });
  }
}

async function processLayer(layer) {
  const ident = layer['ows:Identifier']._text;
  if (layer['ows:Metadata']) {
    if (config.skipPalettes) {
      console.warn(`${prog}: WARN: Skipping palette for ${ident} \n`);
    } else {
      Object.values(layer['ows:Metadata']).forEach((item) => {
        const schemaVersion = item._attributes['xlink:role'];
        if (schemaVersion === 'http://earthdata.nasa.gov/gibs/metadata-type/colormap/1.3') {
          const colormapLink = item._attributes['xlink:href'];
          const colormapFile = path.basename(colormapLink);
          const colormapId = path.parse(colormapFile).name;
          colormaps[colormapId] = colormapLink;
        } else if (schemaVersion === 'http://earthdata.nasa.gov/gibs/metadata-type/mapbox-gl-style/1.0') {
          const vectorStyleLink = item._attributes['xlink:href'];
          const vectorStyleFile = path.basename(vectorStyleLink);
          const vectorStyleId = path.parse(vectorStyleFile).name;
          vectorstyles[vectorStyleId] = vectorStyleLink;
        }
      });
    }
  }
}

async function processGetCapabilities(outputFile) {
  const gcXML = fs.readFileSync(outputFile, { encoding: 'utf-8' });
  let gc = convert.xml2json(gcXML, { compact: true, spaces: 2 });
  gc = JSON.parse(gc);

  try {
    if (!gc.Capabilities || !gc.Capabilities.Contents) {
      console.error(`error: ${outputFile}: no layers`);
      process.exit(1);
    }

    const layers = gc.Capabilities.Contents.Layer;

    Object.values(layers).forEach((layer) => {
      processLayer(layer);
      processVectorData(layer);
    });
  } catch (error) {
    console.error(`ERROR: ${outputFile}: ${error}`);
    process.exit(1);
  }
}

async function processMetadata(link, dir, ext) {
  try {
    const outputFile = path.join(dir, path.basename(link));
    if (link.endsWith(ext)) {
      await fetchConfigs(link, outputFile);
    }
  } catch (error) {
    handleException(error, link);
  }
}

async function gatherProcess(type, typeStr, dir, ext) {
  console.warn(`${prog}: Fetching ${Object.keys(type).length} ${typeStr}`);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  Object.values(type).forEach(async (link) => {
    await processMetadata(link, dir, ext);
  });
}

main().catch((err) => {
  console.error(err.stack);
});
