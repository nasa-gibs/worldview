#!/usr/bin/env node

const yargs = require('yargs');
const console = require('console');

const options = yargs
  .usage('Usage: $0 [options]')
  .option('config', {
    alias: 'c',
    type: 'string',
    description: 'config file',
  })
  .option('getcapabilities', {
    alias: 'gc',
    type: 'string',
    description: 'getcapabilities file',
  });

// import config file from ./config/default/release/config.json

async function main() {
  console.log('testing');
  const { argv } = options;

  if (!argv.config) {
    console.log('error: config must be defined');
    process.exit(1);
  }

  argv.array.forEach((element) => {
    console.log(element);
  });

  // read config

  // get "wv-options-fetch" values

  // for each value

  // create an object of colormaps, vectorstyles, vectordata
}

main().catch((err) => {
  console.error(err.stack);
});
