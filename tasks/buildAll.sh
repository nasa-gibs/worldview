#!/bin/bash

# Bash commands to run in Bamboo to prepare an rpm for deployment

npm install --production=false # Install dependencies, set production false so devDependencies are installed even though NODE_ENV is set to production
npm run dist
node rpm/buildRPM.js

# This is where bamboo expects to find artifacts
mv ~/rpmbuild build/rpm

