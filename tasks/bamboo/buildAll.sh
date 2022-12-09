#!/bin/bash

# Bash commands to run in Bamboo to prepare an rpm for deployment

BASE=$(dirname "$0")/..

# Bamboo automatically sets NODE_ENV to production. Override this so that
# devDependencies are installed.
npm ci --production=false --ignore-scripts
node node_modules/.bin/patch-package  --allow-root
# pipenv run bash $BASE/tasks/distExplict.sh

# Replacement of npm run dist
# Needed for bamboo to avoid permission errors with npm
node $BASE/tasks/clean.js
FETCH_GC=1 $BASE/tasks/buildOptions.sh
$BASE/tasks/buildOptions.sh
node $BASE/tasks/config.js
NODE_ENV=production npx webpack
node $BASE/tasks/dist.js
