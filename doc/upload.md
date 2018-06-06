# upload.js

Build and upload Worldview to a remote host using `tasks/upload.js`.

```
upload.js [options] <name>

Options:
  --help        Show help                                              [boolean]
  --version     Show version number                                    [boolean]
  -c, --config  configuration target if not "release"                   [string]
  -d, --dist    do not build, use artifacts found in dist directory    [boolean]
  -h, --host    upload to this host                                     [string]
  -k, --key     path to private ssh key                                 [string]
  -r, --root    extract application to this directory                   [string]
  -u, --user    login to remote host using this user name               [string]
```

Files are uploaded using ssh and expect `key` to be listed in the remote's
`authorized_keys` file.

Defaults for `host`, `key`, `root`, and `user` should be placed in a JSON
file found at `~/.worldview/upload.config`.

Values on the command line override those found in the configuration file.

If `host` or `root` is not found in the configuration file, it must
appear on the command line.

Example configuration:

```json
{
    "host": "example.com",
    "user": "joe",
    "root": "/home/joe/worldview"
}
```

The script will create a directory named `name` in the `root` directory and
upload the application there. If the `root` path is in the configuration file,
separate instances of Worldview can be easily uploaded by just using the
`name` argument.

Prefix the command with `IGNORE_ERRORS=true` to build the application even
if there are errors in the Worldview configuration.

## Examples

Upload to a directory named `my-feature-branch` under the `root` directory.

```bash
tasks/upload.js my-feature-branch
```

Upload to a different `host` than the one specified in `upload.config`.

```bash
tasks/upload.js --host example.com my-feature-branch
```

Build Worldview using the special-config and ignore errors.
```bash
IGNORE_ERRORS=true tasks/upload.js -c special-config my-feature-branch
```
