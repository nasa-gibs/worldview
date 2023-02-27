
const fs = require('fs')
const os = require('os')
const path = require('path')
const yargs = require('yargs')
const shell = require('shelljs')
const { NodeSSH } = require('node-ssh')

const ssh = new NodeSSH()

function error (msg) {
  const prog = path.basename(__filename)
  throw new Error(`${prog}: error: ${msg}`)
}

const { argv } = yargs
  .usage('$0 [options] <name>')
  .option('d', {
    alias: 'dist',
    description: 'do not build, use artifacts found in dist directory',
    type: 'boolean'
  })
  .option('e', {
    alias: 'env',
    description: 'configuration environment if not "release"',
    requiresArg: true,
    type: 'string'
  })
  .option('h', {
    alias: 'host',
    description: 'upload to this host',
    requiresArg: true,
    type: 'string'
  })
  .option('k', {
    alias: 'key',
    description: 'path to private ssh key',
    requiresArg: true,
    type: 'string'
  })
  .option('r', {
    alias: 'root',
    description: 'extract application to this directory',
    requiresArg: true,
    type: 'string'
  })
  .option('u', {
    alias: 'user',
    description: 'login to remote host using this user name',
    requiresArg: true,
    type: 'string'
  })
  .epilog(`
Defaults for "host", "key", "root", and "user" should be placed in a JSON
file found at "${os.homedir()}/.worldview/upload.config".

Values on the command line override those found in the configuration file.

If "host" or "root" is not found in the configuration file, it must
appear on the command line.`)

if (argv.help) {
  yargs.showHelp()
}

const baseDir = path.join(__dirname, '..')
const distDir = path.join(baseDir, 'dist')
const worldview = 'worldview.tar.gz'
const distWorldview = path.join(distDir, worldview)
const configFile = path.join(os.homedir(), '.worldview', 'upload.config')

let configData = '{}'
try {
  configData = fs.readFileSync(configFile)
} catch (err) {
  // okay if config file cannot be read
}

let config = {}
try {
  config = JSON.parse(configData)
} catch (err) {
  error(`${configFile}:\n${err}`)
}

const host = argv.host || config.host
const root = argv.root || config.root
const username = argv.user || config.user || os.userInfo().username
const key = argv.key || config.key || path.join(os.homedir(), '.ssh', 'id_rsa')

if (!host) {
  error('host not found in config file or command line')
}
if (!root) {
  error('root not found in config file or command line')
}
if (!username) {
  error('user not found in config file or command line')
}

const name = argv._[0]
if (!name) {
  error('name is required')
}

async function upload () {
  console.log(`Uploading to ${host}`)
  try {
    await ssh.connect({
      host,
      username,
      privateKeyPath: key
    })
    let cmd = `
      [ -e ${root}/${name}/${worldview} ] &&
      rm -rf ${root}/${name} &&
      mkdir -p ${root}/${name}`
    let result = await ssh.execCommand(cmd)
    process.stdout.write(result.stdout)
    process.stderr.write(result.stderr)
    await ssh.putFile(distWorldview, `${root}/${name}/${worldview}`)
    cmd = `
      cd ${root}/${name} &&
      tar xf ${worldview} --warning=no-unknown-keyword --strip-components=1 --touch`
    result = await ssh.execCommand(cmd)
    // Set permissions for Group and Other to Read and Execute for images, config metadata, and brand dirs
    cmd = `chmod  -R go+xr ${root}/${name}/config && chmod -R go+xr ${root}/${name}/images && chmod -R go+xr ${root}/${name}/brand`
    result = await ssh.execCommand(cmd)
    process.stdout.write(result.stdout)
    process.stderr.write(result.stderr)
    ssh.dispose()
    console.log('Done')
  } catch (err) {
    error(err.toString())
  }
}

if (!argv.dist) {
  const options = {}
  if (argv.env) {
    options.env = {
      ...process.env,
      CONFIG_ENV: argv.env
    }
  }

  shell.exec('npm run build', options)
  shell.exec('node ./tasks/dist.js', options)
}

upload()
