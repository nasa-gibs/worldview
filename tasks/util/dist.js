const fs = require('fs')
const moment = require('moment')
const shell = require('shelljs')
const tar = require('tar')
const pkg = require('../../package.json')

console.log('Preparing distribution')
shell.rm('-rf', 'build/worldview')
shell.mkdir('-p', 'build/worldview')
shell.cp('-rf', 'web/*', 'build/worldview')

// Remove preview images, if that feature is disabled, for smaller dist file size
const { CONFIG_ENV, GTM_ID } = process.env
const featuresConfigPath = CONFIG_ENV
  ? `config/active/${CONFIG_ENV}/features.json`
  : 'config/default/common/features.json'
const { features } = JSON.parse(fs.readFileSync(featuresConfigPath))
if (!features.previewSnapshots) {
  shell.rm('-rf', 'build/worldview/images/layers/previews')
}

console.log('Branding')
// eslint-disable-next-line n/no-missing-require
const brand = require('../../build/worldview/brand/brand.json')

const applyTo = [
  'build/worldview/index.html',
  'build/worldview/build/wv.js',
  'build/worldview/brand/about/*.html',
  'build/worldview/pages/*.html',
  'build/worldview/manifest.webmanifest'
]

// Build date shown in the About box
const buildTimestamp = moment.utc().format('MMMM DD, YYYY [-] HH:mm [UTC]')

// Append to all URI references for cache busting
const buildNonce = moment.utc().format('YYYYMMDDHHmmssSSS')

const officialName = brand.officialName || brand.name
const longName = brand.longName || brand.name
const shortName = brand.shortName || brand.name
const email = brand.email || 'support@example.com'
const url = brand.url || 'https://worldview.earthdata.nasa.gov/'

shell.sed('-i', /@OFFICIAL_NAME@/g, officialName, applyTo)
shell.sed('-i', /@URL@/g, url, applyTo)
shell.sed('-i', /@LONG_NAME@/g, longName, applyTo)
shell.sed('-i', /@NAME@/g, shortName, applyTo)
shell.sed('-i', /@MAIL@/g, email, applyTo)
shell.sed('-i', /@BUILD_NONCE/g, buildNonce, applyTo)
shell.sed('-i', /@BUILD_TIMESTAMP@/g, buildTimestamp, applyTo)
shell.sed('-i', /@BUILD_VERSION@/g, pkg.version, applyTo)

// replace google tag manager id
const googleTagManagerID = GTM_ID || ''
shell.sed('-i', /@GTM_ID@/g, googleTagManagerID, applyTo)

const dist = 'dist/worldview.tar.gz'
console.log(`Creating distribution: ${dist}`)
shell.mkdir('-p', 'dist')
tar.c({
  gzip: true,
  portable: true,
  C: 'build'
}, ['worldview']).pipe(fs.createWriteStream(dist))
