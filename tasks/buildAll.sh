#!/bin/bash
BASE=$(dirname "$0")/..

# Bash commands to run in Bamboo to prepare an rpm for deployment

# Overwrite the placeholder config in the RPM directory with the actual
# bit.ly configuration
cp bitly.json rpm/bitly.json
# Bamboo automatically sets NODE_ENV to production. Override this so that
# devDependencies are installed.

npm ci --production=false --ignore-scripts
node node_modules/.bin/patch-package  --allow-root
$BASE/tasks/pythonInstall.sh linux
pipenv run bash $BASE/tasks/distExplict.sh
node $BASE/rpm/buildRPM.js

# This is where bamboo expects to find artifacts
mv ~/rpmbuild build/rpm