#!/bin/bash

# Bash commands to run in Bamboo to prepare an rpm for deployment

# Reset directories that have build or install artifacts
npm run distclean

npm install --production=false # Install dependencies, set production false so devDependencies are installed even though NODE_ENV is set to production
npm run dist
node rpm/buildRPM.js

