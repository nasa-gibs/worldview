# Build

There are three build major processes involved proir to deployment.

## Worldview Master

Master build is run on updates to the worldview master codebase. The core tasks that are run during this build can be found/edited in `master.sh`

## Worldview Options

The Worldview Options build is run when updates to the worldview options repository have been made. The core tasks that are run during this build can be found/edited in `config.sh`

## Site Build

The Site-Build build is run after either the completion of the Worldview Options or Master builds. The core tasks that are run during this build can be found/edited in `site_build.sh`