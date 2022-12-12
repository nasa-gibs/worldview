const shell = require('shelljs')

// create screenshot for local instance of Worldview
// https://github.com/sindresorhus/capture-website-cli

const cmdPrefix = 'npx capture-website-cli -s capture-website'
const targetURL = 'http://localhost:3000/?t=2020-12-20'
const outputFile = './web/images/preview.jpg'
const cmdOptions = `--output=${outputFile} --delay=5 --width=1200 --height=630 --type=jpeg --quality=0.2 --overwrite`

const cmd = `${cmdPrefix} ${targetURL} ${cmdOptions}`
shell.exec(cmd)
