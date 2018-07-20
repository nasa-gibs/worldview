#!/bin/bash

# Bash commands to run in Bamboo to prepare an rpm for deployment

# Overwrite the placeholder config in the RPM directory with the actual
# bit.ly configuration
cp bitly.json rpm/bitly.json

npm install
npm dist
node rpm/buildRPM.js

# This is where bamboo expects to find artifacts
mv ~/rpmbuild build/rpm

