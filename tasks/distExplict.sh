#!/bin/bash

BASE=$(dirname "$0")/..
# Replacement of npm run dist
# Needed for bamboo to avoid
# permission errors with npm
node $BASE/tasks/clean.js
FETCH_GC=1 $BASE/tasks/buildOptions.sh
$BASE/tasks/buildOptions.sh
node $BASE/tasks/config.js
NODE_ENV=production npx webpack
node $BASE/tasks/dist.js
