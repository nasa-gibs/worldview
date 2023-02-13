#!/bin/bash

# Bash commands to run in Bamboo to prepare an rpm for deployment

BASE=$(dirname "$0")/../..

# Bamboo automatically sets NODE_ENV to production. Override this so that
# devDependencies are installed.
npm ci --production=false --ignore-scripts
node node_modules/.bin/patch-package  --allow-root

cd $BASE
npm run dist
