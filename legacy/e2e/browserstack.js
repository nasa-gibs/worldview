/* eslint new-cap: "off" */

const Nightwatch = require('nightwatch')
const browserstack = require('browserstack-local')
const environments = require('./environments.js')

const environmentNames = environments.map(
  (e) => [
    e.browser,
    e.browser_version,
    e.os,
    e.os_version
  ].join('_').replace(/\./g, '-').replace(/ /g, '_')
)

try {
  process.mainModule.filename = './node_modules/nightwatch/bin/nightwatch'

  // Code to start browserstack local before start of test
  console.log('Connecting localhost to Browserstack...')
  const bsLocal = new browserstack.Local()
  Nightwatch.bs_local = bsLocal
  bs_local.start({
    key: process.env.BROWSERSTACK_ACCESS_KEY,
    localIdentifier: `wvtester19234${process.env.BROWSERSTACK_USER}`.replace(/[^a-zA-Z0-9]/g, ''),
    force: 'true' // if you want to kill existing ports
  }, (error) => {
    if (error) throw new Error(error)
    console.log('Connected. Running tests...')
    console.log('Go to https://www.browserstack.com/automate to view tests in progress.')

    Nightwatch.cli((argv) => {
      const envString = environmentNames.join(',')
      argv.e = envString
      argv.env = envString
      Nightwatch.CliRunner(argv)
        .setup(null, () => {
          bs_local.stop(() => {
            process.exitCode = 0
          })
        })
        .runTests(() => {
          bs_local.stop(() => {
            if (bs_local.pid && process) {
              process.exitCode = 0
            }
          })
        }).catch((err) => {
          console.error(err)
          process.exitCode = 1
        })
    })
  })
} catch (ex) {
  console.log('There was an error while starting the test runner:\n\n')
  process.stderr.write(`${ex.stack}\n`)
  process.exitCode = 1
}
