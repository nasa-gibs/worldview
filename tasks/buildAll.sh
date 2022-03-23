#!/bin/bash

# Bash commands to run in Bamboo to prepare an rpm for deployment

# Overwrite the placeholder config in the RPM directory with the actual
# bit.ly configuration
cp bitly.json rpm/bitly.json

# Bamboo automatically sets NODE_ENV to production. Override this so that
# devDependencies are installed.
npm config set user 0
npm config set unsafe-perm true
export npm_config_unsafe_perm=true

npm install --production=false --ignore-scripts
# npm run python
./tasks/pythonInstall.sh linux
# npm run dist:container
pipenv run npm run dist:bamboo
node ./tasks/dist.js
# build RPM
node rpm/buildRPM.js

# This is where bamboo expects to find artifacts
mv ~/rpmbuild build/rpm


