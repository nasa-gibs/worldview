#!/usr/bin/env node

const fs = require('fs');

function usage() {
  console.log(`
Usage: csv2colormap.js <id> <name> <csv_file> <json_file>

Given a CSV file with red, green, and blue values in the range
of 0-255, create a colormap JSON file that goes in the
common/config/palettes-custom.json directory.
  `);
}

if (process.argv.length !== 4 + 2) {
  usage();
  process.exit(1);
}

let [id, name, csvFile, jsonFile] = process.argv.slice(2);
let file = fs.readFileSync(csvFile, 'utf8');
let lines = file.split('\n');
let colors = [];
for (let line of lines) {
  if (line.trim().length === 0) {
    continue;
  }
  let [r, g, b] = line.split(',');
  let color = `${hex(r)}${hex(g)}${hex(b)}ff`;
  colors.push(color);
}

let colormap = {
  [id]: {
    id,
    name: name,
    colors
  }
};
fs.writeFileSync(jsonFile, JSON.stringify(colormap));

// decimal to hex for bytes, 10 => 0a
function hex(dec) {
  dec = Number.parseInt(dec);
  let h = dec.toString(16);
  if (h.length === 1) {
    h = '0' + h;
  }
  return h;
};
