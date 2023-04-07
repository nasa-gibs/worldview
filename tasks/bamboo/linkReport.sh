#!/bin/bash

# This script installs NODE, builds Worldview, & runs the linkcheck

set -e -x

# Install node.js
NODE_VERSION=v18.15.0
curl -O https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-x64.tar.gz
tar xf node-${NODE_VERSION}-linux-x64.tar.gz &&
export PATH=$(pwd)/node-${NODE_VERSION}-linux-x64/bin:${PATH}

# builds project and runs tests
npm install
npm run build
npm run linkcheck