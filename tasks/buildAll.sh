#!/bin/bash

# Bash commands to run in Bamboo to prepare an rpm for deployment

# Overwrite the placeholder config in the RPM directory with the actual
# bit.ly configuration
cp bitly.json rpm/bitly.json

# Bamboo automatically sets NODE_ENV to production. Override this so that
# devDependencies are installed.
npm install --production=false

npm dist
node rpm/buildRPM.js

# This is where bamboo expects to find artifacts
mv ~/rpmbuild build/rpm

